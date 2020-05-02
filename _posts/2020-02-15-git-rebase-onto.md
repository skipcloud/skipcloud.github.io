---
layout: post
title: "git rebase --onto"
date: 2020-02-15 06:53:21+00:00
category: tips
tags: [git]
---

Have you ever branched off what you thought was master, done a bunch of work, only to then realise that you actually branched off staging, or some other branch? I have done that a few times and it's mighty annoying. I used to just created a new branch and cherry-picked the commits from my failed branch. As is always the case with git, there is a command to fix this scenario.

Before getting to the meat of this tip I think it's good to understand what happens when you rebase normally. The `git rebase` command takes two arguments `git rebase [<upstream>] [<branch>]`, if you don't supply the `<branch>` argument it will assume you want to use `HEAD` which is the current branch you're on. For example, say you are on branch `dev` and you want to rebase with `master` (the branch that you branched off originally), you could write `git rebase master dev` or `git rebase master`. Git then takes all of the commits from `dev`, puts them in a temporary area then reapplies them one by one to the end of the upstream branch. In essence your branch goes from this

```
A--B--C--D   <--master
   |
   \--E--F   <-- dev
```
To this
```
A--B--C--D   <--master
         |
         \--E--F   <-- dev
```
We have changed what the _base_ of our branch is, it used to be commit `B` and now it's commit `D`. Nice and simple.

Now, say I had branched off `dev` accidentally and done some work and commited a change on my new branch `dev2`. I actually wanted `master` to be my base. Here is how things look.

```
A--B--C--D   <--master
   |
   \--E--F   <-- dev
      |
      \--G   <-- dev2
```
`git rebase` has an option called `--onto` which takes *three* arguments: `git rebase [--onto <new base>] [<upstream> [<branch>]]`. As before you can leave off the `<branch>` argument and git assumes you want to use `HEAD`, your current branch.

In this example our `<new base>` would be `master`, and our `<upstream>` is the branch that we originally branched off, so `dev`. To fix this little oopsie you just need to issue this command `git rebase --onto master dev dev2` or `git rebase --onto master dev`.

After doing so branches will looks like this
```
A--B--C--D   <--master
   |     |
   |     \--G   <-- dev2
   |
   \--E--F   <-- dev
```

As always, I hope that is useful.
