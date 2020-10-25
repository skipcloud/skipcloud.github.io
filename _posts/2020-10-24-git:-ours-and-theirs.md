---
layout: post
title: 'git: ours and theirs'
date: 2020-10-24 07:28:21+01:00
categories: [blog]
tags: [git, ours, theirs, merge, rebase]
---

Every now and then you run into problems when merging or rebasing branches using
git, and to make things worse it asks you to accept "our" changes or "their"
changes. Not prepared to give git the satisfaction of playing its little game
you choose one and hope for the best which inevitably turns out to be the wrong
one and you need to restart the merging/rebase process anew.

Okay maybe I'm projecting my experiences onto you, dear reader, but if you
experience confusion when faced with merge conflicts and needing to make a
decision on which changes to keep then this post is for you.

I seem to say this in all of my git posts but having a clear mental model of
what git is doing during certain operations really helps, my goal here is to
help you understand what git is doing and what it needs from you when you
encounter conflicts.

## what is a conflict

Alright, this might be a little basic but let's discuss what a conflict actually
is, understanding what a conflict is will help us in later sections.

I've set up a very simple git repo with two branches `master` and `dev`:

```
A--B  <- master
 \
   C  <- dev
```

As you can see `dev` branches from `master` at commit `A`, commit `A` is
considered the _common ancestor_ of `dev` and `master`. In the mean time
`master` has created a new commit `B` and `dev` created a new commit `C`.

All good, except the changes in commits `B` and `C` alter the same line in the
same file. Here is the change `master` has made:

```
> git --no-pager show -1
```

```diff
commit 47e7876df1a535e94fd86faea6f59bfb979b1358 (HEAD -> master)
Author: Skip Gibson <skipcloudgibson@gmail.com>
Date:   Sat Oct 24 07:45:07 2020 +0100

    B

diff --git a/my_file b/my_file
index 97a576e..677fa23 100644
--- a/my_file
+++ b/my_file
@@ -1 +1 @@
-change A
+change B
```

And here is the change `dev` has made:

```
> git --no-pager show -1
```

```diff
commit 998fa8d125853c9b2d6d1db0205d9ff10ea29a01 (HEAD -> dev)
Author: Skip Gibson <skipcloudgibson@gmail.com>
Date:   Sat Oct 24 07:45:24 2020 +0100

    C

diff --git a/my_file b/my_file
index 97a576e..35b6888 100644
--- a/my_file
+++ b/my_file
@@ -1 +1 @@
-change A
+change C
```

Due to the fact these two commits `B` and `C` have made _conflicting_ changes if
we were to try to merge or rebase  `dev` and `master` now we will get merge
conflicts because git has no idea which of these two changes to apply, thus you
get brought in to make the decision.

## merging

Let's pull the trigger and try merge `dev` into `master` just so we can see what
happens.

```
> git checkout master
Switched to branch 'master'

> git merge dev
Auto-merging my_file
CONFLICT (content): Merge conflict in my_file
Automatic merge failed; fix conflicts and then commit the result.
```

Oh no, we have a conflict in `my_file`. If we check `git status` and use the
`--short` option it shows us the file has the state `U` for the changes on both
sides of this merge.  The left `U` is for the index and the right `U` is for the
working tree.  `U` stands for "updated and unmerged".

```
> git status -s
UU my_file
```

And inside the file we have some conflict markers lovingly inserted for us by
git.

```
> cat my_file
<<<<<<< HEAD
change B
=======
change C
>>>>>>> dev
```

The first section marked `<<<<<<< HEAD` down to `=======` are the changes that
`master` would like to make. We are currently on the `master` branch so `HEAD`
points to commit `B`.

And the section `=======` to `>>>>>>> dev` shows the changes from `dev`.

In some text editors and IDEs they have functionality which allows you to sort
out your conflicts and usually they present them as `our` and `their` changes,
and without the proper context it's easy to see why this can get confusing.

[Atom](https://atom.io/) will show the changes like this:

<img src="/assets/img/2020-10-24/merge.png" class="blog-image" alt="Atom
showing a merge conflict when merging" />

### ours or theirs?

In order to try and merge these branches we first checked out `master` so in
essence we are `master`. The changes in commit `B` are _our_ changes.

We are trying to merge in changes from a different branch `dev`, seeing as it's
a different branch then the one we are on then we should consider any changes
they make to be _their_ changes.

The trick here is to remember what `git merge` is trying to accomplish and where
we are, as in which branch are we currently on. We are on the `master` branch so
anything marked `ours` is from the `master` branch, and the branch we are trying
to merge in (the foreign branch) is `dev` so anything marked `theirs` is from
`dev`.

As I said it's easy to see why this is confusing, personally if I've been
working on `dev` all day then I would consider the changes in `dev` to be _my_
changes, i.e.  _ours_, but the reality is things are the opposite to what I'm
expecting.

Git doesn't think like that, it has no idea what you've been up to all day, it
has just been asked to merge two branches. During a merge conflict brought about
by trying to merge branches it will consider anything `HEAD` is
pointing to to be _ours_ (`HEAD` is pointing to the same commit that `master`
is pointing to) and the commits it's merging into `HEAD` will be _theirs_.

To make things fun this way of thinking about conflicts doesn't always apply,
for example rebasing is the complete opposite...

## rebasing

For this section let's expand our history slightly so `dev` has an additional
commit `D`.

```
A--B     <- master
 \
   C--D  <- dev
```

`C` is now making an unrelated change and won't result in a conflict but `D`
 will result in the same conflict as , changing the same line in `my_file`.

Now instead of merging the `dev` branch into `master` we want to rebase `dev`,
instead of this history:

```
A--B     <- master
 \
   C--D  <- dev
```

We would like this history:

```
A--B        <- master
    \
      C--D  <- dev
```

We want to change the common ancestor between the two branches from `A` to the
new `B` commit on `master`.

Unlike our merge from before we don't need to be on `master` to accomplish this
because we are making changes to our `dev` branch, so we need to checkout `dev`.

```
> git checkout dev
Switched to branch 'dev'

> git rebase master
Created autostash: 15e3f17
HEAD is now at 124c8df D
First, rewinding head to replay your work on top of it...
Applying: C
Applying: D
Using index info to reconstruct a base tree...
M       my_file
Falling back to patching base and 3-way merge...
Auto-merging my_file
CONFLICT (content): Merge conflict in my_file
error: Failed to merge in the changes.
Patch failed at 0002 D
hint: Use 'git am --show-current-patch' to see the failed patch

Resolve all conflicts manually, mark them as resolved with
"git add/rm <conflicted_files>", then run "git rebase --continue".
You can instead skip this commit: run "git rebase --skip".
To abort and get back to the state before "git rebase", run "git rebase --abort".

```

That's a lot of spiel just to tell us that there is a conflict when trying to
apply commit `D`, let's see what `git status` tells us about the file.

```
> git status -s
UU my_file
```

Righto, conflicts. And what is in the file?

```
<<<<<<< HEAD
change B
=======
change D
>>>>>>> D
```

Interesting, it's similar to but not the same as the conflict markers when
merging. `HEAD` always points to the current commit you are on and by the looks
of it it's pointing to commit `B` and the bottom section is the change from
commit `C` which is our `dev` branch.

Confusingly what is considered "ours" and "theirs" has switched, an IDE
will show the changes like this now:


<img src="/assets/img/2020-10-24/rebase.png" class="blog-image" alt="Atom
showing a merge conflict" />

What would really help here is an understanding of what `git rebase` does, so let's
take a step back and look at a different example.

## what is rebase doing?

Say we have two branches, `main` and `topic`.

```
W--X--Y--Z   <- main
 \
   A--B      <- topic
```

The intention now is to rebase `topic` with `main` so the common ancestor is
`Z`, i.e. we want the history to look like this:

```
W--X--Y--Z        <- main
          \
            A--B  <- topic
```

To do that we would run `git rebase main` whilst we are on the `topic` branch.
The first thing that git does is take the commits `A` and `B` and save them in a
temporary area.

Git then resets `topic` to the head of `main` so it is now pointing
at commit `Z`.

```
W--X--Y--Z  <- main
         ^
         └─ topic
```

Now git works through the changes it placed in the temporary area and applies
them one by one to the `topic` branch again.

It applies `A` cleanly so `topic` is now pointing to `A`:


```
W--X--Y--Z     <- main
          \
            A  <- topic
```

Git then moves onto the next commit in the temporary area which is commit `B`
and tries to apply the changes onto `A`. If all goes to plan and there are
no conflicts then `topic` is now pointing to commit `B`.

Git will try to move onto the next change, but seeing as all of our
commits have  been applied there is nothing else left to do but finish the
rebase operation.

And so we end up with a rebased branch, all is well and we can sleep soundly at
night.

```
W--X--Y--Z        <- main
          \
            A--B  <- topic
```

This is a simplified version of what happens, it's what `man git-rebase` will
tell you too. Let's jump back to our main example with the `master` and `dev`
branches, let's walk through what git has been attempting.

When we started we were on our `dev` branch and things looked like this:

```
A--B  <- master
 \
   C  <- dev (HEAD)
```

`dev` is pointing to a commit and `HEAD` is pointing to `dev`.

```
> git rev-parse --short master
47e7876

> git rev-parse --short dev
998fa8d

> cat .git/HEAD
ref: refs/heads/dev
```

We ran `git rebase master` and the first thing git did was take the commit `C`
(`998fa8d`) and put it in the temporary area then point _`HEAD`_ to the commit
`master` is pointing at: `47e7876`. The commit that `dev` points to wasn't
changed.

```
> git rebase master
... # conflict!
... # output elided for brevity

> cat .git/HEAD
47e7876df1a535e94fd86faea6f59bfb979b1358

> git rev-parse --short dev
998fa8d
```

Git then tried to apply `C` to `HEAD` but it ran into a conflict and added
conflict markers to our file and paused the rebase operations waiting for us to
make a decision.

Right now this is how things are looking.

```
A--B  <- main
   ^
   └─ HEAD

# temporary area
C <- dev
```


Our file now looks like this:

```
<<<<<<< HEAD
change B
=======
change C
```

An editor will show us this:

<img src="/assets/img/2020-10-24/rebase.png" class="blog-image" alt="Atom
showing a merge conflict" />

Based on what we know about merge conflicts you can see why it's easy to get
incredibly confused about what's happening right now.

This operation requires us to think slightly differently than before when we
were merging,
