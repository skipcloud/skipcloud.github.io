---
layout: post
title: "First post"
date:  2020-02-08 09:12:58 +00:00
category: blog
tags: [deliveroo, git]
---

Hi! Before getting into explaining what this blog is going to be about I feel
some background on who I am would be useful for anyone who might stumble across
this blog. My name is Skip, I've been working as a backend engineer for the
Consumer team at [Deliveroo](https://deliveroo.co.uk) in London for over two
years, since November 2017. I started teaching myself to code in 2015 and I did
so from scratch. All of this to say I've been a professional engineer for almost
four years at this point.

Like most people in this line of work I am an inquisitive person, I like to
learn new things and I get a real kick out of gaining a deep understanding of a
topic. Naturally I learn a lot of little things that help make my day-to-day
easier at work. We all have these little tips that we pick up along the way, like...

> did you know '-' holds the last directory you were in so you can use 'cd -' to
> alternate between two directories. And git also uses '-' to hold onto your last
> branch so you can flip between two branches with 'git checkout -'

These little things add up. The beauty of it is everyone learns at their own
pace, some might see that previous tip as shell 101 while some other senior
engineer might have just had their mind blown. We cannot know everything and we
learn at our own pace.

I've gotten into the habit recently of posting some sort of tip most mornings on
the engineering slack channel for the Consumer team at Deliveroo. I figured I
learn a lot of tiny things every day and others could benefit from them too.
Slack is a nice way to get information across but it gets lost very quickly,
especially in a company of our size. I made the decision to start putting the
tips in [Github Gists](https://gist.github.com/skipcloud) in an effort to have
some central place for them in case people wanted to refresh their memory. Gists
are cool and all but I think the best way I'm going to save this information in
a readable way is to make use of this domain and post them here.

So moving forward I'm going to do exactly that. I'm hoping this small blog can
become a place where I can brain dump tidbits and esoteric command line options
that will improve people's day just a smidgen. To kick it all off here is a
small one for you:

Can't remember what you did yesterday and stand up is a few minutes away? I
gotchu

```sh
> git log --author=$USER --since='9am yesterday' --format='%s'

ct-1234: WIP dear god please work
ct-1234: download extra RAM
ct-1234: add artificial sleep to make it look like service is doing work
ct-1234: hide cat gif in the codebase
```
