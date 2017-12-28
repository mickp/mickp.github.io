---
layout: post
title: Conway series length problem
---

I received an e-mail from a colleague describing a problem concerning the length of the 100th term of the Morris, Conway or look-and-say series:

> Start with a 1 and then describe what you see for the next iteration. So, starting at 1, the next number is one 1 (11), the next is two 1 (21), then one 2 one 1 (1211), and so on:
>
> 1
> 11
> 21
> 1211
> 111221
> 312211
>
> The question to answer is what's the length in digits of the 100th
> number in the chain, starting with "1" as the first?

It was simple enough to implement a brute-force solution in python, using a regular experession to find groups of integers in a string. Soon enough, though this started hitting swap space, and slowed down significantly. I did a quick comparision of different approaches and storage types: here are timings for evaluation of the first 50 terms in the sequence, and the 50th term.

|  method                      | t(1:50) / s |  t(50) /s  |
| :---                         | :------ | :------ |
|  group matching over string  |   6.0   |  1.10   |
|  group matching over [int,]  |   3.3   |  0.56   |
|  pop integers from list      |   1.8   |  0.30   |
|  iterate over deque          |   1.6   |  0.28   |
|  group matching over deque   |   3.1   |  0.56   |
|  iterate over file           |   9.6   |  1.60   |

Sooner or later, all memory-based methods started hitting swap space, slowing them down considerably. A look at the results of each iteration showed that the term length increased by an order of magnitude every 8 to 9 iterations. Fitting an exponential to the first 80 or so lengths gave an estimate of the length of the 100th term of (511,230,000,000 +/- 20,000,000) or, stored uncompressed as 8-bit characters, about half a terabyte. A brute-force approach with naive storage was not going to work: the fast deque method hits memory limitations after several hours, having reached iteration 80; I stopped the file-based method after it took a week to reach iteration 88.

![term length vs iteration](assets/2017-12-28-Fig1-TermLength.png)

As an experiment, I ran one of the terms (iteration 80, I think) through 7-zip. This yeilded a compression ratio of 
about 1,000, suggesting considerable repetition in the term. I started looking at the first 120(ish) digits of each term and realised the following:
* only the digits 1, 2 and 3 occur in the first 80 iterations;
* after 22 iterations, the start of each term repeats every three iterations.
This led me to think about three possibilities:
i) using byte-packing for more efficient storage;
ii) exploiting the repetition within terms;
iii) exploiting the periodicity of the sequence after the 22nd term.
The first possibility is not really feasible: it would reduce storage requirements, but I'd still need to iterate over something like 10^12 digits, with an additional overhead on en/decoding those digits. The same goes for the second possibility, if it were only used to reduce storage overhead, but it also allows for a reduction in computational overhead: where there is repetition of subsequences, full treatment is only required on the first occurence of a subsequence; we just have to make sure that those subsequences can be treated independently.

The third possibility provides a way of identifying independent subsequences. Two adjacent subsequences will not affect each other if the last digit of the left subsequence never equals the first digit of the right subsequence, with 'never' meaning 'over all iterations'. The last digit of a (sub)sequence is invariant on iteration: 
  e.g. 1 -> 11 -> 21 -> 1211 -> 111221 ...
so we don't need to iterate the left subsequence at all. The 'over all iterations' consideration reduces to 25 iterations, thanks to the period-3 repetition observed after the first 22 iterations.

The [solution](code/2017-12-28-morrisSolution.py) I settled on is a compromise of simplicity and efficiency. I use brute force to calculate iterations until the sequence exceeds a set threshold on length. I then identify independent subsequences in the sequence, and create an n-ary tree that keeps a count of the number of occurences of each subsequence. The procedure is repeated on each node, until the required number of iterations is reached. The total sequence length can then be determined by summing the products of the count and length for all nodes in the tree, with the length of a node depending on the length of its child nodes. This approach means that repeated subsequences may be evaluated more than once if they occur on different nodes, but the book-keeping is straightforward.

The method can be tested by comparing it to the brute-force approach, using an artifically small threshold on length to produce many more nodes than are necessary. Using a more sensible threshold, this method takes under three hours to determine the length of the 100th term to be 511,247,092,564, which falls comfortably within the bounds of my estimate from the first 80 terms (511,230,000,000 +/- 20,000,000).

```
Verifying method.

Depth: 1,       direct 1,       tree 1,         nodes 1
Depth: 2,       direct 2,       tree 2,         nodes 2
Depth: 3,       direct 2,       tree 2,         nodes 2
Depth: 4,       direct 4,       tree 4,         nodes 2
Depth: 5,       direct 6,       tree 6,         nodes 2
Depth: 6,       direct 6,       tree 6,         nodes 2
Depth: 7,       direct 8,       tree 8,         nodes 2
Depth: 8,       direct 10,      tree 10,        nodes 3
Depth: 9,       direct 14,      tree 14,        nodes 3
Depth: 10,      direct 20,      tree 20,        nodes 3
Depth: 11,      direct 26,      tree 26,        nodes 3
Depth: 12,      direct 34,      tree 34,        nodes 5
Depth: 13,      direct 46,      tree 46,        nodes 6
Depth: 14,      direct 62,      tree 62,        nodes 7
Depth: 15,      direct 78,      tree 78,        nodes 10
Depth: 16,      direct 102,     tree 102,       nodes 11
Depth: 17,      direct 134,     tree 134,       nodes 15
Depth: 18,      direct 176,     tree 176,       nodes 20
Depth: 19,      direct 226,     tree 226,       nodes 24
Depth: 20,      direct 302,     tree 302,       nodes 29

Reached length 511247092564 at depth 100 in 10970.977379s.
```