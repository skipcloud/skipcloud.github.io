---
layout: post
title: git revisions
date: 2020-11-08 06:57:45+00:00
categories: [blog]
tags: [git, revisions, HEAD, range]
---

The last few of my posts have been about Git and this one is no different, I
want to shift gears though and instead of talking about specific git commands
and their behaviour I would like to talk about
[gitrevisions](https://git-scm.com/docs/gitrevisions). Gitrevisions are the
arguments you pass to commands to specify either...

- A specific commit
- Commits reachable from a specific commit
- A range of commits

Which command you are using will make a difference to which of the above you
will want to work with. I say _commit_ here but there are commands that will
work with other objects like _blobs_ and _trees_. If you don't know what blobs
or trees are then check out my post on [How Git Works]({% post_url
2020-07-19-how-git-works %}).

Right, enough waffling, there is a lot to get through so let's dive in.

## revisions

Here is a small repo I threw together so I can show you examples of these
revisions. There are three branches: `master`, `dev` are both local branches and
there is one remote branch `origin/master`.

For the most part `HEAD` will be on commit `F` in the following examples.

```
*   3b3d402 (HEAD -> master, origin/master) F
|\
| * 69fdef7 (dev) D
| * 30a4fb3 C
* | dd81b17 E
|/
* 6bfe3ba B
* 32f3315 A
```

## \<sha1>

This is the one people are very familiar with, passing the SHA1 hash of a commit
object to a command.

```
> git --no-pager show --oneline 69fdef7
```

```
69fdef7 (dev) D
diff --git a/file b/file
index b1e6722..8422d40 100644
--- a/file
+++ b/file
@@ -1,3 +1,4 @@
 A
 B
 C
+D
```

There isn't much else to talk about with this one other than you can pass the
entire hash for the commit, in this case
`69fdef755908451625c665fe1b8fa06ecec718f9`, but passing just a few characters
will be enough providing the value is unique within the repo, git needs at
least 4 characters to work with i.e. `69fd` would work.

## \<refname>

A _refname_ is a symbolic name that points to a commit, for example the name of
your branch. This is a very common way people reference commit objects, for
example `master` points to the commit `F` which is the head of that branch.
When passed as a gitrevision to a command `master` in this instance would be
taken by git to mean `refs/heads/master`.

`master`, `heads/master`, and `refs/heads/master` all refer to the same thing.

```
> git rev-parse master
3b3d4022eb580f9ace87e5bf4ed35e627fd94289

> git rev-parse heads/master
3b3d4022eb580f9ace87e5bf4ed35e627fd94289

> git rev-parse refs/heads/master
3b3d4022eb580f9ace87e5bf4ed35e627fd94289
```

The refs are all found in `.git/refs`:

```
> ls -l .git/refs
total 12
drwxr-x--- 2 skip skip 4096 Nov  7 07:20 heads
drwxr-x--- 3 skip skip 4096 Nov  7 07:28 remotes
drwxr-x--- 2 skip skip 4096 Nov  7 07:17 tags
```

It stands to reason then that we could write `refs/remotes/<refname>` to have a git
command work on a remote branch. In my small repo I've set up a remote called
`origin` and I have `master` tracking it.

```
> ls -l .git/refs/remotes/origin/
total 4
-rw-r----- 1 skip skip 41 Nov  7 07:28 master
```

Let's see use `git show` to look at the remote ref:

```
> git --no-pager show --oneline refs/remotes/origin/master
```

```
3b3d402 (HEAD -> master, origin/master) F

diff --cc file
index 72f43f8,8422d40..8fda00d
--- a/file
+++ b/file
@@@ -1,3 -1,4 +1,5 @@@
  A
  B
+ C
+ D
 +E

```

I don't have any tags in this repo but we could also use `refs/tags/<refname>` to
look at a commit that is annotated with a tag.

When we specified `master` earlier git assumed we meant the `heads` version, and
we've seen that we can be more specific with our ref if we want to look at a
remote or a tag. How does git deal with ambiguous references? After all there
are two `master` branches, my local one and the remote one. Rules of course!
It will go through this rule set and show whichever matches first.

- Does `.git/<refname>` exist? Things like `HEAD` and `ORIG_HEAD` are found this
    way.
- Does `.git/refs/<refname>` exist?
- Does `.git/refs/tags/<refname>` exist?
- Does `.git/refs/heads/<refname>` exist?
- Does `.git/refs/remotes/<refname>` exist?
- Does `.git/refs/remotes/<refname>/HEAD` exist?

Simple really. Let's move onto more obscure ways to reference a commit.

## @

This one is really basic, `@` just means `HEAD`, it is used to build more complex
references though so remember this one.

```
> git rev-parse @
3b3d4022eb580f9ace87e5bf4ed35e627fd94289

> git rev-parse HEAD
3b3d4022eb580f9ace87e5bf4ed35e627fd94289
```

## [\<refname>]@{\<date>}

This is probably one of the cooler things I've learned about git in the past
year, git works really well with temporal strings! You can pass things like `5
minutes ago` or `last year` in as `<date>` and git will find what you want. The
only stipulation is there needs to be some sort of history for `<refname>` in
`.git/logs`.

For example `dev@{'10 minutes ago'}` will find the closest commit it can find
from 10 minutes ago. Notice I have to quote the temporal string otherwise my
shell complains.

```
> git --no-pager log --oneline -1 dev@{'10 minutes ago'}
69fdef7 (dev) D
```

If I ask for a date or time that git doesn't have logs for it'll complain but
return the oldest entry it can find.

```
> git --no-pager log --oneline -1 dev@{'25 years ago'}
warning: Log for 'dev' only goes back to Sat, 7 Nov 2020 07:18:05 +0000.
6bfe3ba B
```

And leaving off the `<refname>` git will assume `HEAD`.

```
> git --no-pager log --oneline -1 @{'10 minutes ago'}
3b3d402 (HEAD -> master, origin/master) F
```

## \<refname>@{\<n>}

This version allows you to get the _n-th_ prior value for `<refname>`.

```
> git --no-pager log --oneline -1 dev
69fdef7 (dev) D

> git --no-pager log --oneline -1 dev@{1}
30a4fb3 C
```

Like `[<refname>]@{<date>}` there needs to be a log for this reference in
`.git/logs`. And like the previous syntax you can leave off `<refname>` if you
want to reference the current branch. For example with `master` checked out
`@{1}` finds first prior value for `master`.

## @{-\<n>}

This syntax allows you to reference the n-th previous branch or commit checkout
before the current one. As an example we are currently on `master` and before
that I was in `dev` making some changes so `@{-1}` should show us the tip of
`dev`:

```
> git --no-pager log -1 --oneline @{-1}
69fdef7 (dev) D
```

## [\<branchname>]@{upstream}

Now we are getting into the funky commands that you'll no doubt remember exist
in future but need to look up the syntax for if you ever need to use them because
I sure as hell do (`man gitrevisions` is very handy).

This syntax allows you to reference the upstream branch for `<branchname>` and
if you leave off `<branchname>` then the current branch is used. In other words you
can reference the branch that `<branchname>` is building off.

```
> git --no-pager log -1 --oneline @{upstream}
3b3d402 (HEAD -> master, origin/master) F
```

The `master` branch has `origin/master` as its upstream branch and
`origin/master` happens to be pointing to the same commit as `master`. To make
this example crystal clear I will create a new commit on our local `master`
branch:

```
> git --no-pager log --oneline --graph

* 93ffd00 (HEAD -> master) G
*   3b3d402 (origin/master) F
|\
| * 69fdef7 (dev) D
| * 30a4fb3 C
* | dd81b17 E
|/
* 6bfe3ba B
* 32f3315 A
```

Running the same command as before the result should still show `origin/master`
pointing to commit `F`:

```
> git --no-pager log -1 --oneline @{u}
3b3d402 (origin/master) F
```

I guess it's a good time to mention that `u` is accepted too, and the keyword is
case insensitive so all of the following are fair game.

- `@{upstream}`
- `@{UPSTREAM}`
- `@{UpStReAm}`
- `@{U}`
- `@{u}`

## [\<branchname>]@{push}

The previous command let you see the `upstream` so this one naturally lets us
see what the `push` branch is up to. For the majority of people the `push`
branch will probably be the same as `upstream`.

```
> git --no-pager log -1 --oneline @{push}
3b3d402 (origin/master) F
```

If we perhaps changed the repo so `master` was pulling from `origin` (i.e. our
upstream) but we pushed to a fork of the project, that is when this would be
useful. This is what's known as a _triangular workflow_.

## \<rev>^[\<n>]

This is where things get interesting, the `^` character allows you to specify
the n-th parent. To explain this we need a good idea of the git history of our
repo, so I'll repost it here.

```
* 93ffd00 (HEAD -> master) G
*   3b3d402 (origin/master) F
|\
| * 69fdef7 (dev) D
| * 30a4fb3 C
* | dd81b17 E
|/
* 6bfe3ba B
* 32f3315 A
```

Most commits in this history have a single parent, for example `B` has `A` as
its parent.

```
> git --no-pager log -1 --oneline 6bfe3ba^
32f3315 A
```

Where things get interesting is with merge commits because they have
multiple parents. When you leave off `<n>` then git uses `^1`, i.e.
the first parent.

Using master's remote branch as our `rev`, which is currently pointing to commit
`F`, we can look at either of `F`s parents, commit `E` or commit `D`:

```
> git --no-pager log -1 --oneline origin/master^
dd81b17 E
> git --no-pager log -1 --oneline origin/master^2
69fdef7 (dev) D
```

And of course `rev` can be a branch name, a commit hash, a tag etc.

`^` can also be chained together, `^^^` means `^1^1^1` and in plain English it
means "the first parent of the first parent of the first parent" but you could
use any combination of numbers to really hone in on what you're after, like
`master^3^^^2` which means "the second parent of the first parent of the first
parent of the third parent of `master`".

One final example before we move on, `master^^2^` should show us commit `C`
because `^^2^` means "the first parent of the second parent of the first
parent".

```
> git --no-pager log -1 --oneline master^^2^
30a4fb3 C
```

The first `^` selected the merge commit `F`, `^2` selected the second parent of
`F` which was `D`, and the final `^` selected `D`s parent `C`.

```
* 93ffd00 (HEAD -> master) G   # <- master
*   3b3d402 (origin/master) F  # <- master^
|\
| * 69fdef7 (dev) D            # <- master^^2
| * 30a4fb3 C                  # <- master^^2^
* | dd81b17 E
|/
* 6bfe3ba B
* 32f3315 A
```

And to really drive the point home `master^^^` would show us commit `B`.

```
> git --no-pager log -1 --oneline master^^^
6bfe3ba B
```

## \<rev>~[\<n>]

The sexy cousin of `^` is the tilde character `~`, it is similar to `^` in that
it allows you to specify ancestors but `~` only follows first parents. `~3`
means exactly the same as `^^^`.

`master~3` will show us commit `B`:

```
> git --no-pager log -1 --oneline master~3
6bfe3ba B
```

We can mix and match `~` and `^` too, `master^^2^` is the same as `master~^2~`.

```
> git --no-pager log -1 --oneline master~^2~
30a4fb3 C
```

## \<rev>^{type}

So `^` can help us find the ancestors of a revision, cool what else can it do?
If you use curly braces after `^` and pass it a type like `commit`, `tree`,
`blob`, then git will recursively dereference the revision until it finds an
object of _type_ otherwise it returns an error.

It's good to keep in mind that this syntax doesn't look at a parent of `<rev>`
like the previous use cases, it looks at `<rev>` itself. `master` is currently
pointing to commit `G` so `master^{commit}` should show us the commit that
`master` is pointing at.

```
> git --no-pager show --oneline master^{commit}
```

```
93ffd00 (HEAD -> master) G
diff --git a/file b/file
index 8fda00d..eaf1c36 100644
--- a/file
+++ b/file
@@ -3,3 +3,4 @@ B
 C
 D
 E
+G
```

Commit objects make use of tree objects so this is handy way to see what tree
object a commit is using. The tree object isn't very interesting in this repo as
we are only working with a single file, still it's nice to have the option to
look at it.

```
> git --no-pager show --oneline master^{tree}
tree master^{tree}

file

> git rev-parse master^{tree}
2ccb2a1893ea7f93abe3645d2511ecd83b555606
```

Objects are lovely and all but what if we want to find a commit based on what's
in the commit message?

## \<rev>^{/\<text>}

This syntax allows you to search for the youngest commit that is reachable from
`<rev>` that has `<text>` in the commit message. _Very_ handy for tracking down
when something was introduced to a code base, like a pesky bug. `<text>` is
actually a regular expression so you don't even need to know the exact text
you're looking for.

Unfortunately we don't have any particularly exciting commit messages in this
example repo but here's a simple example looking for commit `B`:

```
> git --no-pager log -1 --oneline master^{/B}
6bfe3ba B
```

Bear in mind that had there been two commits with `B` in their commit message
then `master^{/B}` would've returned the youngest commit, i.e. the most recent.

## :/<text>

This syntax is the bigger more powerful brother of `<rev>^{/<text>}`, `:/<text>`
doesn't need a revision specified because it checks all commits reachable from
any ref.

To demonstrate I've added a few more commits `H` and `I` to the `dev` branch:

```
> git --no-pager log --oneline --graph --all
* 8c93571 (dev) I
* d70837d H
| * 93ffd00 (HEAD -> master) G
| *   3b3d402 (origin/master) F
| |\
| |/
|/|
* | 69fdef7 D
* | 30a4fb3 C
| * dd81b17 E
|/
* 6bfe3ba B
* 32f3315 A

```

Okay, this graph business is getting a little hard to follow so I'll lay it out
slightly differently which hopefully makes it easier to understand.

```
A--B-----E--F--G     <- master (HEAD)
    \      /
      C--D-----H--I  <- dev
```

We still have `master` checked out, if we used the previous syntax to look for
commit `H` then git won't be able to find it because it's not reachable from
`master`.

````
> git --no-pager log -1 --oneline master^{/H}
fatal: ambiguous argument 'master^{/H}': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
````

This is where `:/<text>` comes in handy because it searches commits reachable
from any ref.

```
> git --no-pager branch
  dev
* master

> git --no-pager log -1 --oneline :/H
d70837d H
```

There is a special sequence for this syntax too, namely `:/!`, it is reserved
for modifiers. `!-` perform a negative match, so `:/!-A` finds the youngest
commit that doesn't contain `A`, which in our case would be the latest commit on
`dev`, commit `I`.

```
> git --no-pager log -1 --oneline :/'!-A'
8c93571 (dev) I
```

Note that I had to wrap my `<text>` in quotes otherwise my shell (zsh) performs
[history
expansion](http://zsh.sourceforge.net/Doc/Release/Expansion.html#History-Expansion)
on the text before it gets to git.

To escape `!` you use a double exclamation point `:/!!`.

That about does it for searching for text, let's move on to specifying paths.

## \<rev>:\<path>

With this syntax you can reference the blob or tree that `<path>` points to,
remember tree objects are essentially directories and blobs are files. To
demonstrate this syntax I'll use the
[`cat-file`](https://git-scm.com/docs/git-cat-file) command which let's us
inspect objects.

I need to add a new directory and a new file to our repo in order to make
explaining this syntax a little easier.

```
> tree
.
├── dir
│   └── other_file
└── file

1 directory, 2 files

```

And here is how the commit history is looking, commit `J` add the new directory
and file:

```
A--B-----E--F--G--J  <- master (HEAD)
    \      /
      C--D-----H--I  <- dev
```

Let's see what type (`-t`) of object `file` is.

```
> git cat-file -t HEAD:file
blob
```

Git looks for `file` at the root of our repo, i.e. the top level. If we want to
look at `other_file` we need to be more specific.

```
> git cat-file -t HEAD:dir/other_file
blob
```

The `<path>` will be converted to a relative path from the root of the project
if it starts with `./` or `../`. Let's `cd` into `dir` and look at `other_file`.

```
> cd dir
> git cat-file -t HEAD:./other_file
blob
```

We could also look at the tree object that represents `dir` by using `./`:

```
> basename $(pwd)
dir
> git cat-file -t HEAD:./
tree
```

And seeing as I mentioned `../` let's use it to look at `file` which is in the
root of our repo:

```
> git cat-file -t HEAD:../file
blob
```

I think I've thoroughly explained this syntax so let's look at something a
little more complicated that uses paths.

## :\<n>:\<path>

This one requires knowledge of _stages_, I went over this in my previous post
called [git: ours and theirs]({% post_url 2020-10-24-git:-ours-and-theirs %}).
I'll give a brief overview here.

Git keeps track of things using the index file, if we look inside the index file
now using the [`ls-files`](https://git-scm.com/docs/git-ls-files) command we see
this:

```
> git ls-files --stage -v
H 100644 c8f145fff1f95011192cd044373759315c22c587 0     dir/other_file
H 100644 eaf1c36af3f83330127a0178e3a79a9198794cd9 0     file
                                                  ^
```

I added the `^` to the output and it is pointing to the stage number for the
objects, the stage number can range from `0` to `3` and in this instance `0`
just means they are normal files.

Stages `1` to `3` are reserved for merges and conflicts:

- `1` is the common ancestor version of the file.
- `2` is the target branch version of the file.
- `3` is the version of the file from the branch being merged in.


Alright, clear as mud. Let's try and merge `master` and `dev` to get a merge
conflict, both branches have been editing `file` so we will definitely get some
conflicts.

As a reminder here is the current state of our commit history:

```
A--B-----E--F--G--J  <- master (HEAD)
    \      /
      C--D-----H--I  <- dev
```

Here we go.

```
> git merge dev
Auto-merging file
CONFLICT (content): Merge conflict in file
Recorded preimage for 'file'
Automatic merge failed; fix conflicts and then commit the result.

> git status --short --branch
## master...origin/master [ahead 2]
UU file

```

Grand, now what's in the index file?

```
> git ls-files --stage -v
H 100644 c8f145fff1f95011192cd044373759315c22c587 0     dir/other_file
M 100644 8422d40f12717e1ebd5cef2449f6c09d1f775969 1     file
M 100644 eaf1c36af3f83330127a0178e3a79a9198794cd9 2     file
M 100644 0a02bcfcceb224ee1733c9e21b8d053a9514c09d 3     file
```

There are now three versions of `file` in the index, now that we have some
stages to work with we can finally turn our attention to the gitrevision syntax
`:<n>:<path>`.

You may have already sussed how this works but the `<n>` here is the stage
version you want to look at and `<path>` is the path to a file or directory you
are interested in.

Let's have a look at the base version of `file`:

```
> git --no-pager show :1:file
A
B
C
D
```

We can do the same with `2` and `3` to look at the different versions of the
file.

```
> git --no-pager show :2:file
A
B
C
D
E
G

> git --no-pager show :3:file
A
B
C
D
H
I
```

The initial `:<n>` is optional and if it is left off git will look for stage `0`
of `<path>` which right now doesn't exist in the index so we get an error.

```
> git --no-pager show :file
fatal: Path 'file' is in the index, but not at stage 0.
Did you mean ':1:file'?
```

Let's abort this merge and try running that command again, remember `master` is
pointing to commit `G`.

```
> git merge --abort
> git --no-pager show :file
A
B
C
D
E
G
```

Seeing as there are no conflicts anymore then only normal stage 0 files exist in
the index so `:file` shows us the blob for `file`.

## reachable commits

I've been using `git log` throughout this post to look at commits but that
command actually shows us sets of commits, this is why I've been using the
`-<n>` option, i.e. `-1`, to tell it to only return one commit instead of the
whole set.

Leaving off that option `git log` will show us the set reachable from the
revision we specify. Reachable means any commit in the revisions ancestor chain
including the commit itself.

Using one of our old friends I'll show what I mean:

```
> git --no-pager log --oneline :/C
30a4fb3 C
6bfe3ba B
32f3315 A
```

The revisions I've shown so far will return all the commits reachable right back
as far as git can go. In our small example repo that's initial commit `A`.

## excluding commits

It is possible to exclude commits reachable from a commit and we can do that by
prefixing a revision with `^`, for example let's rerun the last command but
exclude the commit set.

```
> git --no-pager log --oneline ^:/C
>
```

We get nothing back, on the surface that doesn't seem very useful but if we give
the command another revision like `HEAD` it'll return the commits reachable by
`HEAD` but not those reachable from `C`.

```
> git --no-pager log --oneline ^:/C HEAD
4b78cbd (HEAD -> master) J
93ffd00 G
3b3d402 (origin/master) F
dd81b17 E
69fdef7 D

```

Now _that_ is actually useful! In fact it's so handy there is an alternative
syntax for it, this leads us nicely into the last section: ranges.

## \<rev1>..\<rev2>

This syntax is the shorthand for `^<rev1> <rev2>`. A double dot range will show
us all the commits reach able by `<rev2>` but exclude any commits reachable by
`<rev1>`.

```
> git --no-pager log --oneline :/C..HEAD
4b78cbd (HEAD -> master) J
93ffd00 G
3b3d402 (origin/master) F
dd81b17 E
69fdef7 D

```

I'll use the commit diagram from earlier to give a different perspective on
what's happening.

```
*--*-----E--F--G--J  <- master (HEAD)
    \      /
      *--D-----*--*  <- dev
      ^
      └ commit C
```

`:/C..HEAD` has left us with any commits reachable by `HEAD` and excluding
commit `C` and any commits reachable from `C`. `HEAD` is pointing at commit `J`
so commits `J`, `G`, `F`, `E`, and `D` are returned.

Let's do one more example.

```
> git --no-pager log --oneline :/E..:/I
8c93571 (dev) I
d70837d H
69fdef7 D
30a4fb3 C

```

Looking at our trusty commit diagram we get this:


```
         ┌ commit E
*--*-----*--*--*--*  <- master (HEAD)
    \      /
      C--D-----H--I  <- dev
```

`:/E..:/I` has left us with commits reachable by `I` but excluded any reachable
by `E`, which has given us `I`, `H`, `D`, and `C`.

I just want to point out while I'm using `:/<text>` as my revisions you can use
any of the revisions we've spoken about. You can mix and match too:

```
> git --no-pager log --oneline 32f33..dev^
d70837d H
69fdef7 D
30a4fb3 C
6bfe3ba B

```

## \<rev1>...\<rev2>

Instead of two dots we can use three dots. This very similar syntax will give us
the _symmetric difference_ between the two revisions, it's slightly harder to
wrap your head around but an example or two should clear things up. In essence
it's the commits reachable from either `<rev1>` _or_ `<rev2>` but not both.

```
> git --no-pager log --oneline :/G...:/I
8c93571 (dev) I
d70837d H
93ffd00 G
3b3d402 (origin/master) F
dd81b17 E

```

The commit digram looks like this:

```
*--*-----E--F--G--*  <- master (HEAD)
    \      /
      *--*-----H--I  <- dev
```

Let's take this one revision at a time, all the commits reachable from `:/G`
are:

```
A--B-----E--F--G--*  <- master (HEAD)
    \      /
      C--D-----*--*  <- dev
```

And all commits reachable from `:/I` are:

```
A--B-----*--*--*--*  <- master (HEAD)
    \      /
      C--D-----H--I  <- dev
```

Here are the commits reachable from both:

```
A--B-----*--*--*--*  <- master (HEAD)
    \      /
      C--D-----*--*  <- dev
```

And these are the commits reachable from either revision but _not_ from both,
AKA the result of `:/G...:/I`:

```
*--*-----E--F--G--*  <- master (HEAD)
    \      /
      *--*-----H--I  <- dev
```

With both the double and triple dot range notation you can leave either
revision blank and it will default to `HEAD`. So `:/B...` means `:/B...HEAD` and
`...:/B` means `HEAD...:/B`.

## misc set shorthands

To finish off there are a couple of useful shorthands for referencing a commit
and its parents, you'd probably get the most use of these when working with
merge commits.

I'll repost the commit diagram again for reference.

```
A--B-----E--F--G--J  <- master (HEAD)
    \      /
      C--D-----H--I  <- dev
```

## rev^@

This one selects all the parents of `rev`. Nice and simple! Here are all the
parents of the merge commit `F`.

```
> git --no-pager show --oneline --name-only :/F^@
dd81b17 E
file
69fdef7 D
file
```

## rev^!

This will exclude all of the parents of `rev` but return `rev`, on its own it
represents `rev` and I'll be honest I'm not sure how useful this one is but it's
good to know I guess.

```
> git --no-pager show --oneline --name-only :/F^!
3b3d402 (origin/master) F

file

```

## rev^-\<n>

This one includes `rev`, excludes the n-th parent, and returns all other parents
of `rev`. Unlike the previous two it will return a set, i.e. commits reachable
from those commits. You can think of it as working like `rev^<n>..rev`.

```
> git --no-pager log --oneline :/F^-1
3b3d402 (origin/master) F
69fdef7 D
30a4fb3 C
```

`:/F^-1` returns all commits reachable from its second parents but not those
reachable from the first.

```
*--*-----*--F--*--*  <- master (HEAD)
    \      /
      C--D-----*--*  <- dev
```

Naturally if we exclude the second parent we should only get back `F` and `E`:

```
> git --no-pager log --oneline :/F^-2
3b3d402 (origin/master) F
dd81b17 E

```

And for completeness here is the commit diagram:

```
*--*-----E--F--*--*  <- master (HEAD)
    \      /
      *--*-----*--*  <- dev
```

## conclusion

Git certainly gives you enough tools to hone in on the exact commits you want to
work with or to look at underlying tree and blob objects and I hope I've
explained them well enough for you to understand them.  If you're ever stuck or
need a refresher definitely check out `man gitrevisions`, nothing beats reading
the fucking manual.
