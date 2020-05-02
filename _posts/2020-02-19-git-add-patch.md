---
layout: post
title: "git add --patch"
date: 2020-02-19 05:54:37+00:00
category: tips
tags: [git]
---

A few posts ago I introduced `git commit --fixup` to help you better organise
your commits ([have a read if you didn't see it]({% post_url
2020-02-09-git-fixup %})) , but what if you have made two changes in the same
file that are better suited to being in different commits? `git add <file>` will
stage the entire file so that won't do, I think it's time we spoke about `git
add --patch`.

From the git man pages:

> Interactively choose hunks of patch between the index and the work tree and add
> them to the index. This gives
> the user a chance to review the difference before adding modified
> contents to the index.

Simple as that. You get to review changes for staging hunk by hunk. Let's
work through an example to show you why this option very handy.

We are editing a file and at the top of the file we have one change and somewhere
else in the file we have made another, we've decided we would like them to be in
separate commits because logically they don't belong together. Here is the diff
of our changes:

```
diff --git a/file.rb b/file.rb
index aca5ff2..805315e 100644
--- a/file.rb
+++ b/file.rb
@@ -1,3 +1,7 @@
+def first_new_function
+  # some excellently written code
+end
+
 def example
   puts 'excellent stuff'
 end
@@ -5,3 +9,7 @@ end
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
```

Running `git add file.rb` right now would add all of our changes to the staging
area, however if we use the `--patch` option we get some choices:

```
diff --git a/file.rb b/file.rb
index aca5ff2..805315e 100644
--- a/file.rb
+++ b/file.rb
@@ -1,3 +1,7 @@
+def first_new_function
+  # some excellently written code
+end
+
 def example
   puts 'excellent stuff'
 end
Stage this hunk [y,n,q,a,d,j,J,g,/,e,?]?
```

We are presented with the first distinct hunk of code, our cursor is left at the
end of the last line waiting for our decision. We have a few options here, if we
enter `?` git will tell us what those letters stand for:

```
y - stage this hunk
n - do not stage this hunk
q - quit; do not stage this hunk or any of the remaining ones
a - stage this hunk and all later hunks in the file
d - do not stage this hunk or any of the later hunks in the file
g - select a hunk to go to
/ - search for a hunk matching the given regex
j - leave this hunk undecided, see next undecided hunk
J - leave this hunk undecided, see next hunk
e - manually edit the current hunk
? - print help
```

Feel free to play around with other options on your machine I'm just giving you
the whistle stop tour. Let's enter `y` and see what happens next:

```
@@ -5,3 +9,7 @@ end
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
Stage this hunk [y,n,q,a,d,K,g,/,e,?]?
```

Unsurprisingly we are presented with the next distinct hunk, we don't want this
one so we enter `n` and we land back on the command line. Let's run `git status`
and see what we have:

```
/tmp/example [master] » git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        modified:   file.rb

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   file.rb

```

The same file is both staged and not staged which makes sense right? Our first
hunk has been staged and the second hunk hasn't. We go ahead and commit what we
have staged then decide to do a little more coding before committing anything
else. Run git diff and we get this:

```
diff --git a/file.rb b/file.rb
index 0826c63..b7c5e4b 100644
--- a/file.rb
+++ b/file.rb
@@ -9,3 +9,12 @@ end
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
+
+def another_unrelated_function
+  # alright, this code leaves a lot
+  # to be desired.
+end
```

We decide to compose another commit so let's run `git add -p` again:

```
diff --git a/file.rb b/file.rb
index 0826c63..b7c5e4b 100644
--- a/file.rb
+++ b/file.rb
@@ -9,3 +9,12 @@ end
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
+
+def another_unrelated_function
+  # alright, this code leaves a lot
+  # to be desired.
+end
Stage this hunk [y,n,q,a,d,e,?]?
```

Uh oh, git sees this as one distinct hunk. If you check out the options we have
`e` at our disposal, so let's edit this hunk. When we enter `e` vim is opened for
us:

```
# Manual hunk edit mode -- see bottom for a quick guide.
@@ -9,3 +9,12 @@ end
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
+
+def another_unrelated_function
+  # alright, this code leaves a lot
+  # to be desired.
+end
# ---
# To remove '-' lines, make them ' ' lines (context).
# To remove '+' lines, delete them.
# Lines starting with # will be removed.
#
# If the patch applies cleanly, the edited hunk will immediately be
# marked for staging.
# If it does not apply cleanly, you will be given an opportunity to
# edit again.  If all lines of the hunk are removed, then the edit is
# aborted and the hunk is left unchanged.
```

I won't reiterate what git is telling us above but if we delete the lines we
don't want to stage so our screen now looks like this...

```
# Manual hunk edit mode -- see bottom for a quick guide.
@@ -9,3 +9,12 @@ end
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
# ---
# To ...
...
```

...then save and exit vim, when we run `git status` again we see that the file
has both staged and unstaged changes just like we wanted:

```
/tmp/example [master] » git status
On branch master
Changes to be committed:
  (use "git reset HEAD <file>..." to unstage)

        modified:   file.rb

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git checkout -- <file>..." to discard changes in working directory)

        modified:   file.rb

```

There is one other option that `git add --patch` provides that I want to show
you. If we unstage those changes with `git reset` and add another few lines of
code, this time just slightly further up from the changes we have been talking
about and run `git add -p` again:

```
/tmp/example [master] » ga -p
diff --git a/file.rb b/file.rb
index 0826c63..f9265cf 100644
--- a/file.rb
+++ b/file.rb
@@ -6,6 +6,19 @@ def example
   puts 'excellent stuff'
 end

+def another_method
+
+end
+
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
+
+def logically_unrelated_function
+  # eye wateringly beautiful code
+end
+
+def another_unrelated_function
+  # alright, this code leaves a lot
+  # to be desired.
+end
Stage this hunk [y,n,q,a,d,s,e,?]?
```

We are presented with a hunk again but the `download_more_ram` function is
separating our two new changes. If you look at the options available there is a
new `s` option, this stands for split and will just split the new pieces of code
on the unchanged portions. Here is what is presented to us when we enter `s`:

```
Split into 2 hunks.
@@ -6,6 +6,10 @@
   puts 'excellent stuff'
 end

+def another_method
+
+end
+
 def download_more_ram
   http.get('http://moreramstore.com/256plz')
 end
Stage this hunk [y,n,q,a,d,j,J,g,/,e,?]?
```

Git is telling us at the top that the code was split into two and this is the
first part, the rest of the flow is exactly like we discussed beforehand. Cool,
right? This option is a must if you are serious about keep relevant changes
together in your commit history.

