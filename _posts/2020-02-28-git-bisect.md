---
layout: post
title: "git bisect"
date: 2020-02-28 09:52:49+00:00
category: tips
tags: [git]
---

Git is great at helping you unfuck situations you've gotten yourself into, it is
like Winston Wolf in that regard. During your development process have you ever
realised a feature that was once working is now incredibly broken and you have
_no_ idea when this bug was introduced? Of course you have, you're only human.

To carry on this string of recent posts on git I think it's time we went over a very
useful feature which, in usual git fashion, has a name that confuses and scares
people. It's not completely obvious what it is for so here is what the git man
pages say about `git bisect`:

> Use binary search to find the commit that introduced a bug

Yes, it is this simple.

If you are like me and you didn't study computer science at university you might
not know what binary search is, and that's fine. We can't know everything. I feel
it would be good to get you quickly up to speed on what binary search is before
talking about `git bisect`.

## Binary search

In short [binary search](https://en.wikipedia.org/wiki/Tree_sort) is an
algorithm for finding things quickly. If we have a sorted list of elements like
so

```
1  4  7  9  13  42  81  102
```

And we are trying to find the number `42` we would start off looking at the
middle element

```
1  4  7  9  13  42  81  102
            ^
```

Is this the element we are after? Nope, then is it smaller or larger than the
element we are after? It's smaller. Grand, we then focus our attention on the
upper half of the list and pick the middle element again and repeat that
process.


```
13  42  81  102
        ^
```

`81` is larger than the element we need so we take the lower half of the list
and repeat


```
13  42
    ^
```

We check the element and rejoice because we have found what we are after.

A real life example of this would be when you search for a term in the index of
a book, you are looking for `git` so you flick to the back of the book and see
you've landed in the `K` section. Well,  you know `G` is before `K` so you flick
back a few pages and see you're in the `D` section, you go forward a few pages
to `G`.

Database indexes also work in a similar fashion.

## Big O

Binary search has a [big O](https://en.wikipedia.org/wiki/Big_O_notation) of
O(log₂n) on average which means it's quick. In our number example we found our
element in 3 iterations which was pretty good but with even bigger numbers the
efficiency of this algorithm really shines through.

If we have a list of 1,000,000,000 items it will take just 29 iterations to find
what we are looking for. Fire a few more zeros on there and it takes 39
iterations to find an item in a list of 1,000,000,000,000 elements.

## Back to git

Now you know the power of binary search you can understand how the tool does was
it does. It will help you to (very quickly) hone in on the commit that has disrupted
your work flow allowing you to publicly flog whoever authored the commit, but
let's be honest it was probably you anyway.

Examples are a great way to show git in action so let's have a look at one of my
side projects

```
code/death-ray [master] » git status --oneline

25fb6f8 (HEAD -> master) build sprinkler system
72ad2d3 replace robot sharks with live ones
809a5eb install robot sharks
a61be52 dig moat
7bb5349 unleash coronavirus
5bc64b2 download entire ABBA discography
a47b2a2 install speakers
2b1db02 top up live bees
6817a4a install puppy crusher
4c560a4 Initial commit
```

My death ray was working perfectly last week but right now it won't even start,
it was definitely working when I added those bees...

## Starting git bisect

All you need to know before using `git bisect` is a commit in which your code is
broken, this is usually your current commit aka the one `HEAD` is pointing at.
And a commit in which your code was working as intended, which for this example
was `2b1db02`.

To start you run the `start` command and tell git which commit is the bad one,
if you leave out the commit git will use `HEAD`.

```
code/death-ray [master] » git bisect start
code/death-ray [master] » git bisect bad
```

Now all that's left to do is tell git which commit is good

```
code/death-ray [master] » git bisect good 2b1db02
Bisecting: 3 revisions left to test after this (roughly 2 steps)
[7bb5349c36a3c49dae0a4100ca85258959180090] unleash coronavirus
code/death-ray [7bb5349] » _
```

Git has now checked out commit `7bb5349` and told us there's about 2 steps left
in this process and it is awaiting our input.

## The Good, The Bad, and the Broken

Let's revisit our git log again only this time I'll show where our good and bad
commits are and which commit we are currently on

```
25fb6f8 (HEAD -> master) build sprinkler system <-- bad
72ad2d3 replace robot sharks with live ones
809a5eb install robot sharks
a61be52 dig moat
7bb5349 unleash coronavirus                     <-- HEAD
5bc64b2 download entire ABBA discography
a47b2a2 install speakers
2b1db02 top up live bees                        <-- good
...
```

Looking at it here we can see git had picked a commit in the middle of our
commit range, like we did with our simple binary search example at the start
of this post.

Git is waiting for us to tell it whether this commit is `good` or `bad`, we
check our code and nope this commit is a dud, we can mark it bad like we did
before. There's no need to pass a commit has as `HEAD` is used.

```
code/death-ray [7bb5349] » git bisect bad
Bisecting: 0 revisions left to test after this (roughly 1 step)
[5bc64b236d64f08d8af61116a4fa274e10830689] download entire ABBA discography
code/death-ray [5bc64b2] » _
```

## Narrowing it down

Looking at our git log this is how git would view our commits, we have very
quickly narrowed it down to two commits.

```
25fb6f8 (HEAD -> master) build sprinkler system < -- bad
72ad2d3 replace robot sharks with live ones     < -- bad
809a5eb install robot sharks                    < -- bad
a61be52 dig moat                                < -- bad
7bb5349 unleash coronavirus                     < -- bad
5bc64b2 download entire ABBA discography        < -- HEAD
a47b2a2 install speakers
2b1db02 top up live bees                        <-- good
...
```

We test our code and nope still broken. We mark it and move onto the last
commit.

```
code/death-ray [5bc64b2] » git bisect bad
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[a47b2a2d3b09804b8dac6ecd250fb6d45e25d350] install speakers
code/death-ray [a47b2a2] » _
```

## Damn bees

This is the final commit to check. We give it a whirl and yes, the once broken
feature is working. That's on me for thinking ABBA and live bees would play
nicely together. We mark this commit as `good` and git triumphantly tells us
this is the bad commit.

```
code/death-ray [a47b2a2] » git bisect good
5bc64b236d64f08d8af61116a4fa274e10830689 is the first bad commit
commit 5bc64b236d64f08d8af61116a4fa274e10830689
Author: Skip Gibson <evil.dr.skip@gmail.com>
Date:   Fri Feb 28 10:34:08 2020 +0000

    download entire ABBA discography

    :000000 100644 0000000000000000000000000000000000000000
    e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 A   file4373
```

 After we have finished our investigation we need to get out of `bisect` mode
 using `git bisect reset`, which will checkout the position `HEAD` was at before
 we started sleuthing around in our commit history.

## Conclusion

Git has your back. Don't be afraid of it. Also bees are more complicated than
you think.

