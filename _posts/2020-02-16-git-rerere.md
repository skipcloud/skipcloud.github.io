---
layout: post
title: "re: git rerere"
date: 2020-02-16 07:31:07+00:00
category: tips
tags: [git]
---

Have you ever tried to merge two branches only to end up in conflict hell? You
fix a bunch of conflicts only to run `git merge --continue` and be presented
with the same conflicts. Repeat this process and after a few iterations you give
up because _it just isn't worth the pain and effort_.

Would you be surprised to know that there is a git feature specifically for this
problem? It's called `rerere` and I'm going to enrich your life with it now.
(I'm going to talk specifically about merging but I think it also helps
rebasing)

`rerere` stands for Reuse Recorded Resolution. The TL;DR version is you ask git
to remember how you've resolved hunks in the past, and if the same one comes up
for a file in future just redo what you did last time.

To enable this feature just run this lovely command `git config --global
rerere.enabled true`. You can also turn it on by creating this directory in your
projects `.git/rr-cache`, although the global setting is much clearer and will
create this directory for you automatically.

I'll try to take you through an example of how this works, bear with me it might
get long.

We have our (tiny) project with only one file in it, which looks like this

```
.
└── user.rb

0 directories, 1 file
```

I branch off master to create a branch called `dev` and I add a line to
`user.rb`. Now I would like to stage this change so I pull down `staging` and
try to merge my `dev` branch but uh oh, someone has merged a change to staging
affecting the same line in `user.rb` that I am editing.

```
/tmp/example [staging] » git merge dev
Auto-merging user.rb
CONFLICT (content): Merge conflict in user.rb
Automatic merge failed; fix conflicts and then commit the result.
```

We've all seen this before, a run of the mill conflict message. However if you
were to have `rerere` enabled you would get this output

```
/tmp/example [staging] » git merge dev
Auto-merging user.rb
CONFLICT (content): Merge conflict in user.rb
Recorded preimage for 'user.rb'
Automatic merge failed; fix conflicts and then commit the result.
```

You can now see a new line saying `Recorded preimage for 'user.rb'`. Running
`git rerere diff` right now will give you the current state of the resolution
file:

```
/tmp/example [c013552] » git rerere diff
--- a/user.rb
+++ b/user.rb
@@ -1,5 +1,5 @@
-<<<<<<<
-hello
-=======
+<<<<<<< HEAD
 hi
 ->>>>>>>
 +=======
 +hello
 +>>>>>>> commit from dev
 ```

You go about the usual conflict workflow, choose which changes to keep, and
commit the result. If you run `git rerere diff` again, you see the recorded
resolution:

```
/tmp/example [c013552] » git rerere diff
--- a/user.rb
+++ b/user.rb
@@ -1,5 +1 @@
-<<<<<<<
 hello
-=======
-hi
->>>>>>>
```

Running `git merge --continue` will apply your commit and tell you about the new
resolution for our file:

```
/tmp/example [c013552] » git merge --continue
Recorded resolution for 'user.rb'.
```

Let's undo that merge with `git reset --hard HEAD^` and try merging the same
branches again, keeping in mind that before we had to manually fix the conflict:

```
/tmp/example [staging] » git merge dev
Auto-merging user.rb
CONFLICT (content): Merge conflict in user.rb
Resolved 'user.rb' using previous resolution.
Automatic merge failed; fix conflicts and then commit the result.
/tmp/example [staging] » git add .
/tmp/example [staging] » git merge --continue
[staging f4a7d36] Merge branch 'dev' into staging
```
The important line in this output is `Resolved 'user.rb' using previous
resolution.`. I didn't need to even look at the file, just commit the result.
This worked because git saw the conflict, looked in the `rr-cache` folder and
recognised this hunk from this file from a previous merge and applied your
decision from last time!

As always, I hope you found that useful.
