"""
Determining the length of Morris/Conway/Look-and-say sequence.

Copyright 2017 Mick Phillips (mick.phillips at gmail dot com)
"""
import collections
from itertools import groupby

# Only digits 1, 2 and 3 appear in (at least) the first 80 iterations.

# The start of the sequence demonstrates period-3 recurrence after 22 iterations.

# The sequence can be split into discrete parts if the last digit of the left
# part does not equal the first digit of the right part for all generations or,
# practically, for 22+3 = 25 generations, thanks to recurrence.


def las(s):
    # Look and say - generate the next term in the sequence from s.
    out = ''
    for k, g in groupby(s):
        count = sum(1 for _ in g)
        out += str(count) + k
    return out


def lasn(s, n):
    # Look and say n times.
    for i in range(n):
        s = las(s)
    return s


def splitsHere(ss):
    # Deterimine if the string can be split at substring ss.
    if len(ss) == 1:
        return False
    p = ss[0]   # End of left-hand part
    q = ss[1:]  # Right-hand part
    qs = [q[0]] # Results of las on right-hand part.
    for i in range(25):
        # Never see digit larger than 3 in first 80 iterations,
        # so only need to check first 3 digits of right-hand part.
        q = las(q[0:4])
        qs.append(q[0])
    return not(p in qs)


def splitToTokenCounts(s):
    # Split the string into token counts and the remaining tail of the string.
    tokens = collections.Counter()
    i = 0
    for j in range(len(s)):
        if splitsHere(s[j:]):
            tokens.update([s[i:j+1]])
            i = j+1
    tail = s[i:]
    return tokens, tail


class Node(object):
    # A node in an n-ary tree representing development of a sequence.
    # The sequence is iterated until it reaches some length limit.
    # It is then broken into tokens, which are counted, and a child
    # node is created for each token.  Example usage:
    #   create a base node
    #       tree = Node('1')
    #   evolve it to represent the sequence after N iterations
    #       tree.propogateToDepth(N)
    #   calculate the lengh of the sequence after N iterations
    #       tree.length()

    def __init__(self, root, depth=0):
        self.root = root
        self.depth = depth
        self.children = []
        self.counts = None
        self._isLeaf = False


    def grow(self, maxi=None, maxlen=1000000):
        # Iterate the sequence until maxi or maxlen is hit, then
        # return the token count and tail.
        s = self.root
        i = 0
        while len(s) < maxlen:
            s = las(s)
            i += 1
            if maxi is not None and i >= maxi:
                break
        tokens, tail = splitToTokenCounts(s)
        return i, tokens, tail


    def propogateToDepth(self, n, maxlen=100000):
        # Keep calling grow until we have a tree representing the sequence
        # after n iterations.
        numNodes = 1  # Counter for this and child nodes.
        if n == self.depth:
            self._isLeaf = True
            return 1

        j, tokens, tail = self.grow(maxi=n-self.depth, maxlen=maxlen)
        j += self.depth

        self.counts = tokens
        self.counts.update([tail])
        # Create a new node for each unique token.
        for token in self.counts:
            self.children.append(Node(token, j))
        for child in self.children:
            numNodes += child.propogateToDepth(n, maxlen=maxlen)
        return numNodes
        

    def length(self):
        # Return the length of the node - recurses through child nodes.
        if self._isLeaf:
            return len(self.root)
        elif not self.children:
            return 0
        else:
            return sum(c.length() * self.counts[c.root] for c in self.children)



def verify(toDepth=20, maxlen=1000):
    # Compare direct and tree methods of evaluating sequence length.
    # This uses a short maxlen to ensure multiple nodes at even modest
    # depth.
    s = '1'
    for i in range(0, toDepth):
        tree = Node('1')
        numNodes = tree.propogateToDepth(i, maxlen=maxlen)
        print ("Depth: %d, \tdirect %d, \ttree %d, \tnodes %d" 
                    % (i+1, len(s), tree.length(), numNodes))
        s = las(s)
    return tree


if __name__ == "__main__":
    import sys
    import time

    try:
        depth = int(sys.argv[1])
    except:
        depth = 20

    print("\nVerifying method.\n")
    verify()
    print("\n")

    if sys.platform == "win32":
        default_timer = time.clock
    else:
        default_timer = time.time

    t0 = default_timer()
    n = Node('1')
    n.propogateToDepth(depth-1)
    length = n.length()
    t1 = default_timer()

    print ("Reached length %d at depth %d in %fs." % (length, depth, t1-t0))