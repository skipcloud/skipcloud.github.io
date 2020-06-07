---
layout: post
title: "Ruby: Blocks, Procs, and Lambdas"
date: 2020-06-07 11:59:16+01:00
categories: [blog]
tags: [ruby, blocks, procs, lambdas]
---

You can't talk about ruby without covering blocks, when you start out you are
introduced to them from the get-go. Procs and lambdas, however, aren't mentioned
when you're starting to learn ruby which is understandable because you can get
away with writing ruby without ever really knowing what they are.

I am here to throw a ton of information about blocks, procs, and lambdas at you
as well as a generous helping of code examples, let's see what sticks.

## blocks

Let's start off with blocks. A block in ruby is a section of code you can pass
to a method to be called later, a block can be written in two different ways.
The multi-line `do end` version:

```ruby
3.times do
  puts "hello"
end
```

Or the nicely succinct single line `{}` version:

```ruby
3.times { puts "hello" }
```

A block can of course take arguments.

```ruby
3.times do |num|
  puts "hello #{num}"
end

3.times {|num| puts "hello #{num}" }
```

There isn't much to them, you pass them to methods and depending on how the
method was defined the block can be called once, multiple times, or not at all.

### ampersand

If you are writing your own method and want to accept a block you can use the
`&` symbol on the last parameter and your block will be stored in this variable.
You can then call the block with the `:call` method.

```ruby
def do_thing(&my_block)
  my_block.call "hello"
end

do_thing {|var| var}
# => "hello"
```

These methods can, of course, accept other arguments along side a block.

```ruby
def do_thing(name, &my_block)
  my_block.call "hello #{name}"
end

do_thing("skip") {|var| var}
# => "hello skip"
```

Notice that I had to include parentheses when calling `:do_thing`, leaving them
out is a syntax error. If a multi-line `do end` block is used instead you can
leave off the parentheses.

```ruby
do_thing "skip" do |var|
  var
end
# => "hello skip"
```

### :block_given?

The code above assumes there is always going to be a block provided when the
method is called, not passing a block would result in a `NoMethodError` because
`my_block` would be `nil`. You can check if there was a block provided by using the
`:block_given?` method.

```ruby
def check_block_given(&my_block)
  return my_block.call if block_given?
  "no block given"
end

check_block_given { "block given" }
# => "block given"
check_block_given
# => "no block given"
```

### alternatives to :call

It wouldn't be ruby if there weren't multiple different ways to achieve the same
thing, so naturally there are a few ways you can call a block. One funky
alternative is the `.()` syntax

```ruby
def call_block(&my_block)
  my_block.("oh hi")
end

call_block {|var| var}
# => "oh hi"
```

Instead of storing the block in a variable to call manually there is also the
`yield` keyword that will call a block that was provided when the method is
called. A block saved in a variable is called an explicit block whereas a block
called with `yield` is known as an implicit block. As with the other examples
you can pass arguments to `yield` which are then passed on to the block.

```ruby
def yield_block
  yield
end

yield_block { "hello" }
# => "hello"

def yield_block
  yield 100
end

yield_block {|num| "number #{num}" }
# => "number 100"
```

You can call yield as many times as you like but calling yield when
no block has been provided results in a `LocalJumpError`.

## procs

I mentioned that blocks are sections of code you can pass _to a method_, that
means you cannot do something like this:

```ruby
my_block = { "hello" }
```

Doing so will result in a `SyntaxError` and we don't like those. What you need
in your life is a [`Proc`](https://ruby-doc.org/core-2.6/Proc.html). A proc is
an object representation of a block of code, and seeing as it's an object you
can pass them around your code freely.

There are a few ways to create a proc:

```ruby
my_proc = Proc.new { "hello" }
my_proc = proc { "hello" }
```

There is one more way you can create a proc, and this way sheds a little more
light on what happens to a block when you pass it to a method.

```ruby
def create_a_proc(&block)
  block
end

my_proc = create_a_proc { "hello" }
my_proc.class
# => Proc
```
Those examples above result in exactly the same thing, we could then call
the proc using any of the methods I mentioned before, e.g. `:call` or `.()`.
There is some other weirder syntax you can use, for completions sake here they
are.

```ruby
my_block.===
# => "hello"
my_block[]
# => "hello"
```

If you have a proc and you want to pass it to a method as a block you can use our old
friend `&` to do just that.

```ruby
def yield_block
  yield
end

my_proc = proc { "hello" }
yield_block &my_proc
# => "hello"
```

In other words can use `&` to either turn a block into a proc, or use it to turn a proc
back into a block.

You don't need to always turn a proc into a block to feed it into a method,
because procs are objects they can just be passed as simple arguments.

```ruby
def call_args(*args)
  args.each(&:call)
end

p1 = proc {puts "hi"}
p2 = proc {puts "there"}
call_args p1, p2
# => "hi"
#    "there"
```

That example leads me nicely into the next section.

## ampersand trickery

When writing code there comes a time when you want to iterate over a collection
of items and call a method on each of them, the most obvious way of doing this
is with a method like `:map` if it's an array.

```ruby
arr = ["hi", "there"]
arr.map {|word| word.upcase}
# => ["HI", "THERE"]
```

There is a much more compact syntax that you can use which involves the
ampersand and ruby symbols. I'll demonstrate by re-writing the previous code

```ruby
arr.map(&:upcase)
# => ["HI", "THERE"]
```

`&:upcase` is just a fancy way of calling `:to_proc` on the symbol, so
`&:upcase` is similar to `:upcase.to_proc`. It's worth noting that the
ampersand syntax only works in relation to a method call, and you cannot use
`:to_proc` with a method call. To put it simply:

* Use `&` during a method call
* Use `:to_proc` if you want to store the resulting proc in a variable

Here is a recreation of what's happening under the hood when using `&` with a
symbol to really take the magic out of the syntax.

```ruby
class Symbol
  def to_proc
    Proc.new {|arg| arg.send(self)}
  end
end
```

## other classes

`Symbol` isn't the only class in ruby that has a `:to_proc` method defined, for
example `Hash` has a `:to_proc` method defined and it can be used to quickly
look up multiple keys.

```ruby
fav_foods = {
  skip:  "burrito",
  tom:   "milk",
  jerry: "cheese"
}

names = [:skip, :jerry]
names.map(&fav_foods)
# => ["burrito", "cheese"]
```

This means you can define your own `:to_proc` method in your classes and use it
until the cows come home.

```ruby
class Person
  attr_reader :name

  def initialize(name)
    @name = name
  end

  def self.to_proc
    Proc.new {|p| p.name }
  end
end

people = 3.times.map {|num| Person.new("person #{num}")}
# => [#<Person:0x0000561520c28130 @name="person 0">,
#     #<Person:0x0000561520c280b8 @name="person 1">,
#     #<Person:0x0000561520c28040 @name="person 2">]
people.map(&Person)
# => ["person 0", "person 1", "person 2"]
```

I could've simply written `people.map(&:name)` instead but this way you can
see how it all fits together.

## lambdas

We've covered blocks, we've covered procs, so what the hell is a lambda? Would
you be surprised if I told you a lambda is just a proc? There is a method called
`:lambda?` defined in `Proc` which you can use to see if a proc is a real proc
or a lambda.

```ruby
my_proc = proc { "hi" }
my_proc.lambda?
# => false
```

I'll get into what exactly a lambda is in just a moment, here are the two ways
you can create a lambda:

```ruby
my_lambda = lambda { "hello" }
my_lambda = -> { "hello" }
```

If you want to be able to pass arguments to your lambdas you can do so.

```ruby
my_lambda = lambda {|name| "hello #{name}"}
my_lambda = -> (name) { "hello #{name}" }
```

You can call a lambda with any of the various ways I mentioned before when
talking about procs, after all a lambda is just a special proc.

## lambda or proc?

There are two main differences between a proc and a lambda and those are:

* How they handle arity (number of arguments)
* How they return

### arity

To put it simply, a proc doesn't care about the number of arguments you pass it.
You can pass too many, just the right amount, or too few. As long as you aren't
doing something in your proc that requires these missing arguments, for example
calling a method on the argument, then everything will run smoothly.

```ruby
my_proc = proc {|arg1, arg2, arg3| "hello"}
my_proc.call
# => "hello"
```

A lambda on the other hand gets incredibly pissy when you don't provide exactly
what it expects when it comes to the number of arguments. In that respect it's
much closer to a method than a proc is.

```ruby
my_lambda = lambda {|arg1, arg2, arg3| "hello"}
my_lambda.call
# => ArgumentError: wrong number of arguments (given 0, expected 3)
#    from (pry):97:in 'block in __pry__'
my_lambda.call 1,2,3,4
# => ArgumentError: wrong number of arguments (given 4, expected 3)
#    from (pry):97:in 'block in __pry__'
my_lambda.call 1,2,3
# => "hello"
```

### return

The other way that lambdas and procs differ is how they act when you call
`return`. A proc will try to return from the calling context whereas a lambda
will only return from the code block that you defined. As always a short example
will help demonstrate what I mean.

```ruby
my_lambda = lambda { return }
my_proc = proc { return }

lambda.call
# => nil
my_proc.call
# => LocalJumpError: unexpected return
#    from (pry):101:in 'block in __pry__'
```

I'm getting a `LocalJumpError` here because we called the proc from the
top-level context and the proc is trying to return from `main` which is a no-no.
If we instead define and call the lambda and proc inside methods you can see how
they work without proc causing a `LocalJumpError`.

```ruby

def call_lambda
  my_lambda = lambda { return "from lambda" }
  my_lambda.call
  "end of method"
end

def call_proc
  my_proc = proc { return "from proc" }
  my_proc.call
  "end of method"
end

call_lambda
# => "end of method"
call_proc
# => "from proc"
```

## closures

One last thing before I finish up: blocks, procs, and lambdas in ruby capture
their surrounding context when you define them, so that means they can carry
local variables along for the ride and reference them later.

```ruby
def yield_block
  count = 100
  yield
end

count = 1
my_proc = proc { puts count }
my_lambda = -> { puts count }

yield_block &my_proc
# => 1
yield_block &lambda
# => 1
yield_block { puts count }
# => 1
```

## conclusion

Blocks, procs, and lambdas are incredibly similar things yet different in some
big ways. You can get away with writing ruby without ever really knowing what a
proc or a lambda is but I guarantee there will come a time when a proc or a
lambda can really help simplify your code.

Here are the important high-level points you should take away from this post:

* Blocks are sections of code that you can pass to a method
* Procs and lambdas are object representations of blocks
* Procs and lambdas can be turned into blocks and passed to methods
* Procs don't care about arity
* Procs will return from the calling context
* Lambdas do care about arity
* Lambdas will only return from its own code block


