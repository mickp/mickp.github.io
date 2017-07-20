---
layout: post
title: Python mutiprocessing bug
---

I use multiprocessing in [microscope](https://github.com/MicronOxford/microscope) to serve hardware device interfaces in their own processes - that way, if one device goes down, it doesn't bring down the others. There's also a loop that tries to bring those interfaces back up, if their process dies unexpectedly. This wasn't behaving quite as I expected, and it looks like this is down to a bug in the multiprocessing module. Details and a workaround can be found in [issue 30975](http://bugs.python.org/issue30975).