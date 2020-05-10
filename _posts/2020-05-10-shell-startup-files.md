---
layout: post
title: Shell Startup Files
date: 2020-05-10 07:07:54+01:00
categories: [blog]
tags: [bash, zsh, shell]
---

The shell is something people use every single day to interact with their
computer, and usually over time people like to customise their environment to
their liking.  Sure every time you open your terminal you could spend time
creating aliases, setting environment variables, adding things to your `PS1`
prompt until your terminal is 90% prompt, but that's just not practical.

What makes more sense is having a file that you could put commands in to
customise your shell, then have the shell read that file during start up. These
kinds of files are commonly referred to as "dot files" because they append a `.`
to the start of the name to hide the file, many programs have their own dot
files. Vim has `~/.vimrc`, pry has `~/.pryrc`, and bash has `~/.bashrc`. Bash
actually has many other dot files that it uses, for example `~/.bash_login` and
`~/.bash_profile`.

All shells have some sort of startup process where it will read certain dot
files in a particular order depending on what sort of shell you're starting. I
wanted to create a post to explain what these different files are because for
the longest time I had no idea what the difference was between `.bashrc`,
`.bash_profile`, `.bash_login`, `.profile`. With so many options to choose from,
where do you put your commands/definitions?

I will primarily be focusing on the [bash start
up](https://www.gnu.org/software/bash/manual/html_node/Bash-Startup-Files.html)
process, but seeing as I am a `zsh` user I will also cover the [zsh start
up](http://zsh.sourceforge.net/Intro/intro_3.html) process a little later on.
All shells follow a similar sort of process when sourcing startup files, they
_can_ differ though so it's a good idea to read your shells manual. To be fair
it's always a good idea to read the fucking manual.

## where did the files come from?

Before diving into what the different shells are and what different files do
here is a tiny bit of history.

Back when computers were big expensive things people needed to share computers.
There would be a computer somewhere in the building and people would connect to
it using their terminal. A system administrator could add some default set up
for terminals to `/etc/profile` that all users would get, then users could
customise their terminal further with their own `~/.profile` so when they logged
into their terminal they were in a familiar environment with their own custom
`PATH`, prompt etc.


## types of session

There are a few different types of session you can have with your shell, and
depending on what type of session it is certain files are read to set up the
environment.

### non-interactive non-login

Let's start with a simple one, a `non-interactive non-login` is a shell that you
don't interact with, it's right there in the name. For example this could be a
subshell that a process starts in order to do something, like run a command or
another script. More on this in a little bit.

### interactive login

An `interactive login` shell is one that you need to login to, generally when
you need to enter a username and a password you'll be getting an interactive
login experience. This includes things like SSH or the `su` command.

### interactive non-login

An `interactive non-login` shell is, as you can probably guess, an interactive
shell meaning it is attached to some terminal for you to interact with it. An
interactive shell is something you are very familiar with. The `non-login` part
just means you didn't need to login, you will have started this new shell from
an existing session.

## which files for which shell type

I'm going to run through some examples of each of these different shells to give
you some idea of how `bash` does things.

### non-interactive non-login files

Let's start with a `non-interactive non-login` shell. As previously mentioned
this isn't something you yourself would start, it is something the shell does.
When you run a command on the command line your shell actually starts a new
shell with a new environment to run the command, this shell is a
`non-interactive non-login` shell. This is why you need to export an environment
variable before it can be seen by commands you run, when you export a variable
it is made visible to all child processes of your shell.

When `bash` starts a non-interactive non-login shell it will look for an
environment variable called `BASH_ENV` which should hold the name of a file it
should use to get the environment set up. Generally this variable is not set
unless you've gone to the trouble of setting it.

Here I've created a tiny bash script, all it does is print out "hi from script",
it lives in a file I've called `my_script`.

```bash
#!/bin/bash
echo "hi from script"
```

I then created a file called `my_env` with a command to print out "hi from env".

```bash
echo 'hi from env'
```

Next I set the variable `BASH_ENV` to the path to `my_env` and run my script.

```
$ export BASH_ENV=$PWD/my_env
$ ./my_script
hi from env
hi from script
```

As you can see the shell ran the commands in `my_env` before running
`my_script`.

### interactive login files

This type of shell isn't one you tend to see very much throughout your day to
day unless you regularly need to login to your shell. This shell has a few
different files it tries to read to get your environment set up.

* First read `/etc/profile` and run whatever commands are in there
* Then look for `~/.bash_profile`, `~/.bash_login`, and `~/.profile`, in that
  order. It will run the commands in which ever file it finds first.
* When exiting a `login` session the shell will run the commands in the
  `~/.bash_logout` file if it exists.

As previously mentioned you can get a `login` shell by using SSH or `su - <user>`
to login as a user, you can also get a `login` shell by passing the option
`--login` when you start a shell, i.e. `/bin/bash --login`.

I added some lines to `/etc/profile` and `~/.bash_profile` to show the order
they are read. I also created `~/.bash_login` and `~/.profile` files to
demonstrate they aren't read.

```
$ sudoedit /etc/profile
[sudo] password for skip:
$ vim ~/.bash_profile
$ vim ~/.bash_login
$ vim ~/.profile
$ vim ~/.bash_profile
$ bash --login
hi from /etc/profile
hi from /home/skip/.bash_profile
```

I'll `mv` my `.bash_profile` to show the shell will look for `~/.bash_login` and
`~/.profile`.

```
$ mv ~/.bash_profile ~/.bash_profile.old
$ bash --login
hi from /etc/profile
hi from ~/.bash_login
$ rm ~/.bash_login
$ bash --login
hi from /etc/profile
hi from ~/.profile

```

And finally when you exit a `login` shell the `~/.bash_logout` file is read.

```
$ /bin/bash --login
hi from /etc/profile
hi from /home/skip/.bash_profile
$ exit
hi from /home/skip/.bash_logout
```

### interactive non-login files

When you're already logged in and you start a new shell session you get an
`interactive non-login` session. This is the session where `~/.bashrc` is
read. Side note for curious people like me, the `rc` in `bashrc` stands for "run
command", you can have that fact for free.  You can also call `/bin/bash` without
any arguments.

```
$ /bin/bash   # already logged in but let's start a new shell
hi from /home/skip/.bashrc
$             # same prompt but it's a new shell
$ exit        # exit leaves this shell and returns to the parent shell
$
```

You can tell bash not to run your `.bashrc` file by passing the `--norc`
options, note the lack of "hi from /home/skip/.bashrc" in the output. I'll print
out the process IDs so you clearly see they are different shells.

```
$ echo $$
31558
$ /bin/bash --norc
$ echo $$
32006
$ exit
exit
$ echo $$
31558
$
```

If you want you can also tell bash what file you want to use instead of the
usual `~/.bashrc` with the option `--rcfile`.

```
$ echo "echo 'hi from my_rcfile'" > my_rcfile
$ /bin/bash --rcfile my_rcfile
hi from my_rcfile
$
```

## zsh

`zsh` is another very popular shell, it's one that I personally use, and it has
its own files that it reads for different types of shells. Here are the startup
files `zsh` uses:

* `$ZDOTDIR/.zshenv`
* `$ZDOTDIR/.zprofile`
* `$ZDOTDIR/.zshrc`
* `$ZDOTDIR/.zlogin`
* `$ZDOTDIR/.zlogout`

If `$ZDOTDIR` isn't set then `$HOME` is used, there are also `/etc/zsh/...`
equivalents of all of the above files that are read before your personal files.
As before I have added some echo lines to the various files so when I start some
shells you can see the order the files are sourced.

### .zshenv

This file, unlike the `BASH_ENV` file, is one that is run for every invocation
of the shell, be it login, non-login, or non-interactive.

```
$ zsh
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
$ exit
$ zsh --login
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
$ ./my_script
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
hi from my_script
```

### .zshrc

The `.zshrc` file is sourced for every interactive shell, whether it is login or
non-login.

```
$ zsh
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
hi from /etc/zsh/zshrc
hi from /home/skip/.zshrc
$ exit
$ zsh --login
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
hi from /etc/zsh/zshrc
hi from /home/skip/.zshrc
```

### .zlogin and .zprofile

`~/.zlogin` is sourced for login shells, I think that much is obvious. There is
also a `~/.zprofile` file but, unlike `bash`,  `zsh` doesn't stop looking when
it finds the `~/.zlogin` file. It reads that file first then runs the
`~/.zprofile` before running the `~/.zshrc` file, however the `~/.zlogin` and
the `~/.zprofile` files aren't intended to be used together, `~/.zprofile` was
meant as an alternative to `~/.zlogin` for people used to `ksh`.

```
$ zsh           # interactive non-login shell
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
hi from /etc/zsh/zshrc
hi from /home/skip/.zshrc
$ exit
$ zsh --login  # interactive login shell
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
hi from /etc/zsh/zprofile
hi from /home/skip/.zprofile
hi from /etc/zsh/zshrc
hi from /home/skip/.zshrc
hi from /etc/zsh/zlogin
hi from /home/skip/.zlogin
$

```

### .zlogout

And last but not least the logout file, this one is sourced when you exit an
interactive login shell.

```
$ zsh --login
hi from /etc/zsh/zshenv
hi from /home/skip/.zshenv
hi from /etc/zsh/zprofile
hi from /home/skip/.zprofile
hi from /etc/zsh/zshrc
hi from /home/skip/.zshrc
hi from /etc/zsh/zlogin
hi from /home/skip/.zlogin
$ exit
hi from /home/skip/.zlogout
hi from /etc/zsh/zlogout
$
```

## what file should I use?

That's a lot of files, how do you know where to put things? Armed with the
knowledge I just bestowed upon you, for the majority of the files mentioned you
can probably figure out where to put commands. However here is a short overview.

### logging in

If you need something done when you are logging in then use `~/.bash_profile`
(or one of the other alternatives) if you use `bash` or `~/.zlogin` if you use
`zsh`. Generally you would keep commands in here that set things like the type
of terminal you are using and to run some external commands.

### logging out

This one is pretty simple, if you need something done when logging out then put
it in `~/.bash_logout` or `~/.zlogout`.

### setting the environment

This section really depends on what shell you are using. If you are using `zsh`
then `~/.zshenv` is run for every file, so put commands that set environment
variables like `PATH` in that file. Commands that produce output shouldn't go in
this file.

If you are using `bash` then you can set `BASH_ENV` so your environment is set
up correctly for non-interactive shells, otherwise for your interactive shells
put the commands that set up environment related things in either
`~/.bash_profile` or `~/.bashrc`. I recommend `~/.bashrc` and I shall explain
why in just a hot second.

### everything else?

The thing that made me want to write this post was seeing so many people just
putting everything in their `~/.bash_profile` files. I see it in READMEs all the
time, "add this line to your .bash_profile", given what I've just explained I
hope you can see why this is incorrect. `~/.bash_profile` isn't sourced for the
majority of shells that you will find yourself in, that job falls to `~/.bashrc`.

When it comes to `bash`, because there isn't a clear separation of concerns like
with `zsh` and its startup files I tend to keep everything in my `~/.bashrc` file.
All of my environment variables, `PATH` set up, functions, aliases go in there.
Then I just source my `~/.bashrc` in `~/.bash_profile`, here is my entire
`~/.bash_profile` file.

```bash
[ -e $HOME/.bashrc ] && source $HOME/.bashrc
```

This way if I login via SSH or by using `su - skip` I will have my shell set up
the same way every single time.

## don't you use zsh though?

I do! I actually use some weird mix of the dot files for both shells so I can
switch between `zsh` and `bash` and not be left scratching my head when certain
aliases or functions that I use everyday don't appear to work in whatever shell
I'm in.

As previously mentioned I have my `~/.bash_profile` loading my `~/.bashrc` so I
can use both interactive login and non-login bash shells. I then keep `zsh`
specific set up in my `~/.zshrc` and `~/.zshenv` files, remember that `zsh`
sources these two files for both interactive login and non-login shells. I put
all remaining `zsh` set up in `~/.zshrc`, for example all of the `oh-my-zsh`
related commands go in there. And finally I have a line at the end of my
`~/.zshrc` file sourcing my `~/.bashrc` file so I have all of my aliases.
Simple.

