---
layout: post
title: Default Text Width
date: 2020-05-24 09:47:41+01:00
categories: [blog]
tags: ['text width']
---

One of the things that I love about computers is even though we are hurtling
into the future at an astounding speed, they hold onto to relics of the past.
They have these idiosyncrasies that can only really be explained by looking
into the past.

```sh
Δ who
skip     tty2         2020-05-21 11:02 (tty2)
```

For example: Our terminals have the reference `tty` and `tty` stands for
[teletypewriter](https://en.wikipedia.org/wiki/Teleprinter), those screenless
beasts that people used to interact with computers before video terminals became
all the rage. The first UNIX operating system was written on a teletypewriter
using the line editor [ed](https://en.wikipedia.org/wiki/Ed_%28text_editor%29).
All these years later and our computers are still pretending to be a physical
terminal.

<img src="/assets/img/2020-05-24/asr-tty.png" alt="ASR 33 teletype"
class="blog-image"/>
<p class="picture-attribution">By <a
href="//commons.wikimedia.org/wiki/User:ArnoldReinhold"
title="User:ArnoldReinhold">ArnoldReinhold</a> - <span class="int-own-work"
lang="en">Own work</span>, <a
href="https://creativecommons.org/licenses/by-sa/3.0" title="Creative Commons
Attribution-Share Alike 3.0">CC BY-SA 3.0</a>, <a
href="https://commons.wikimedia.org/w/index.php?curid=31105488">Link</a></p>

## seeing patterns

I've been spending the past year or so trying to become more comfortable with
the command line, that has involved a lot of reading and being introduced to
programs I have never since needed to use. When I find out about a command I
tend to open up the man pages to see what sort of options are available for me
to use.

One thing that kept popping up in various manuals and settings was a default
text width of 72-80 characters. I'm the sort of guy who sees a pattern like this
and needs to know _why_.

### pr

`pr` is a program for converting text files into a sensible format for printing,
in its man page it states the default page width is 72 characters.

```
 -W, --page-width=PAGE_WIDTH
        set  page  width to PAGE_WIDTH (72) characters always, truncate
        lines, except -J option is set, no interference with -S or -s
```

### vim

`vim` has a whole bunch of settings that need a text width and will default to
80 if one isn't set.

```
6. Formatting text					*formatting*

:[range]ce[nter] [width]				*:ce* *:center*
			Center lines in [range] between [width] columns
			(default 'textwidth' or 80 when 'textwidth' is 0).
			{not in Vi}

:[range]ri[ght] [width]					*:ri* *:right*
			Right-align lines in [range] at [width] columns
			(default 'textwidth' or 80 when 'textwidth' is 0).
			{not in Vi}

```

### ps

`ps` is a command that produces a lot of output so some formatting options have
some information on default text width and wouldn't you know it, our friend 80
makes another appearance.

```
 args   COMMAND   command with all its arguments as a string.
                  ....the output width is undefined (it may
                  be 80, unlimited, determined by the TERM
                  variable, and so on).
                  ....
```


### language style guides

Not only can this trend be spotted in command line tools, even style guides for
prominent programming languages have a maximum desired line length.

* Python - 79
* Javascript - 80
* Ruby - 80

### the list goes on

I could continue giving examples but I hope I've convinced you that there is a
de facto standard here that programs fall back to. There are a couple of factors
in history that have led to this standard text width range becoming so
ubiquitous, pulling on one thread leads us down the path of [punch
cards](https://en.wikipedia.org/wiki/Punched_card) and the other involves
standard US letter sizes. Let's start with letter sizes and the Dutch in the 1600s.

## letters

The first part of this puzzle involves the US standard letter size of 8.5 inches
by 11 inches, the reason for this specific size of letter dates back in the
1600s when the Dutch invented a two-sheet mold for papermaking. To maximise
efficiency of making paper by hand they molded sheets 44 inches by 17 inches
which could then be divided into eight 8.5 inches by 11 inches.

This letter size wasn't the only letter size on the block, there were other
sizes that people used if they were feeling adventurous such as the illustrious
8 inches by 10.5 inches.

Life was chaos in the paper world in the United States for a long time, multiple
paper sizes were used in various departments across the country. We would need
to jump forward to the 1980s to see President Ronald Reagan make 8.5 inches by
11 inches the official US standard letter size. It was actually a toss up
between this size and a couple of others and involved committees being set up to
hash that shit out, but I'll let you research that on your own if you fancy
reading about US paper size standards.

## typewriters

Seeing as the letter size 8.5 inches by 11 inches has been kicking around since
the 1600s it's no surprise to find that it had a direct effect on the amount of
characters per line that a person could type. Typewriters are physical
machines that have a fixed character size, this isn't like software today where
you can change the font size to your liking, you were stuck with what the
machine was capable of.

Without adding a margin most typewriters could fit between 85 and 102 characters
on a line, this would vary depending on the font size the machine used and
generally they fell in the range of 10 to 12 characters per inch. Writing
letters all the way to the edge of the paper isn't ideal, only a madman would do
such a thing, so it was common to leave a margin of around 1 inch on either side.
Let's do some quick math here:

* 2 * 1 inch margin = 2 inches
* 2 * 10 characters per inch = 20 characters
* 20 characters - upper limit of line (say 95) = 75 characters per line

Here is a type writer that can fit 87 characters per line, check the ruler along
the carriage.

<img src="/assets/img/2020-05-24/particolare-olivetti-lettera-22.png"
alt="Particolare Lettera 22 with ruler showing a maximum of 87 characters per
line" class="blog-image"/>
<p class="picture-attribution">By <a
href="//commons.wikimedia.org/wiki/User:Pava" title="User:Pava">Pava</a> - <span
class="int-own-work" lang="en">Own work</span>, <a
href="https://creativecommons.org/licenses/by-sa/3.0/it/deed.en" title="Creative
Commons Attribution-Share Alike 3.0 it">CC BY-SA 3.0 it</a>, <a
href="https://commons.wikimedia.org/w/index.php?curid=17713570">Link</a></p>

Going just off standard paper sizes and the fact machinery was build around this
standard it's easy to see why it had a profound effect on how computers turned
out, even as printers were invented they were constrained by the physical
limitations of their parts so the characters per line limit came along for the
ride.

## punch cards

The other side of this tale involved punch card computing and a man who had a
fantastic moustache, [Herman
Hollerith](https://en.wikipedia.org/wiki/Herman_Hollerith). Hollerith is credited
with inventing a machine that could read input from holes punched on a card,
this machinery was used during the
[1890 US Census](https://en.wikipedia.org/wiki/1890_United_States_Census).

<img src="/assets/img/2020-05-24/hollerith-punch-card.jpg"
alt="An original Hollerith punch card" class="blog-image"/>
<p class="picture-attribution">By Herman Hollerith - Railroad Gazette, Public
Domain, <a
href="https://commons.wikimedia.org/w/index.php?curid=5034979">Link</a></p>

Hollerith had wanted there to be an array of card sizes for a variety of uses
but said that 3 inches by 5.5 inches "would be sufficient for all ordinary
purposes". At some point over the coming years the standard card size grew to
3.25 inches by 7.26 inches.

### IBM

Hollerith founded a company called Tabulating Machine Company in 1896, which
eventually ended up being made part of a company called
Computing-Tabulating-Recording Company (CTR) in 1911, which itself was later
renamed to International Business Machines Corporation (IBM) in 1924.

By the time we get to the 1920s people were itching to get more holes in
these cards to hold more data, up until then these punch cards needed round holes
and would only hold 45 columns. Later designs changed the hole to be rectangular
enabling up to 80 columns to fit on the card, the size of the card stayed the
same at 3.25 inches by 7.26 inches.

### to the future

I think it goes without saying that IBM did quite well for itself, today we
consider it one of the leading technology companies. They reached this status
through innovation, they didn't rest on their punch card laurels, with
technology rapidly advancing through the 20th century the company iterated on
computer designs with the purpose of reading and handling data that was input
using punch cards.

<img src="/assets/img/2020-05-24/ibm-3279.jpg"
alt="An IBM 3279 computer terminal" class="blog-image"/>
<p class="picture-attribution">By <a
href="https://www.wikidata.org/wiki/Special:EntityPage/Q18857750" class="extiw"
title="d:Special:EntityPage/Q18857750">Retro-Computing Society of Rhode
Island</a> - <span class="int-own-work" lang="en">Own work</span>, <a
href="https://creativecommons.org/licenses/by-sa/3.0" title="Creative Commons
Attribution-Share Alike 3.0">CC BY-SA 3.0</a>, <a
href="https://commons.wikimedia.org/w/index.php?curid=7354001">Link</a></p>

The initial terminals for computers dealing with punch cards had an 80 character
limit per line precisely due to the constraint of the punch card, however this
trait continued on as more general purpose terminals were created, like the IBM
3279 pictured above.  This screen size trend didn't just happen with IBM, other
companies who created computer terminals followed suit.

## present day

Those two quirks of history, standardised letter sizes and punch card
tabulation, have led to this default text width being found pretty much
everywhere you look when it comes to computers and formatting. Even though
earlier constraints are no longer a problem: our printers are capable of
printing fonts of any size, our screens have crazy resolutions, and we generally
don't need to make much use of punch cards in our day-to-day lives.

I love that you can follow these little threads back in time. On the surface
computers feel futuristic and modern, but if you do just a slight amount of
digging you'd be surprised at all of the history that makes up your computer.

## personal preference

Some people still stick to these default text widths and they do so for a
variety of reasons, personally I use a text width of 78 characters for all of my
documentation and git commits. Even the markdown I write my blog posts in
adheres to this text width, I just find it pleasing to read.

<img src="/assets/img/2020-05-24/vim-screenshot.png"
alt="A screenshot of this blog post in vim" class="blog-image"/>

