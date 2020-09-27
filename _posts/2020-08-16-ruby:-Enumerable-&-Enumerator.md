---
layout: post
title: 'Ruby: Enumerable & Enumerator'
date: 2020-08-16 12:03:06+01:00
categories: [blog]
tags: [ruby, enumerator, enumerable]
---

It's been a while since I've had a chance to write any Ruby, which sucks because
I really like the language. That hasn't stopped me from reading about it though,
which means I've been inspired to share some knowledge on some lesser known
parts of the core library that I find interesting as fuck.

Last year I was sat at my terminal, dicking around in
[pry](https://github.com/pry/pry) when I realised I had no idea why I could
write the following in ruby and everything just works out.

```ruby
%w{hi there}.each.map {|word| word.upcase}
# => ["HI", "THERE"]

%w{hi there}.map.each {|word| word.upcase}
# => ["HI", "THERE"]
```

The result of both of these lines is exactly the same so why bother letting the
details of _what_ is happening get under your skin, right? Wrong. This is
exactly the sort of thing I end up nerd sniping myself with. Right in the face.
I can't just go to bed and get a solid 8 hours sleep knowing I can do the
following in ruby and not know why it works.

```ruby
%w{hi there}.each.map.select.map.reject.map {|word| word.upcase}
# => ["HI", "THERE"]
```

To understand what the hell is going on I would need to show you a class called
[Enumerator](https://ruby-doc.org/core-2.7.1/Enumerator.html), however that
would result in quite a short post so you lucky ducks will also learn about a
module called [Enumerable](https://ruby-doc.org/core-2.7.1/Enumerable.html) and
I'll briefly swing by a module called
[Comparable](https://ruby-doc.org/core-2.5.0/Comparable.html).

I'll save the big reveal for the end of the post, so keep your limbs inside the
car at all times and let's have a gander at Enumerable.

## Enumerable

As I mentioned Enumerable is a module, it's one that you can use to mix some
very useful functionality into your classes. This module will give the ability
to traverse, search, and sort through collections. The bare minimum you need for
it to work is an `:each` instance method. If you want to sort or find the
min/max then you'll also need to make sure the members of the collection you're
going to iterate over have the spaceship method `:<=>` defined, I'll get to that
later.

### each

If you've used ruby for more than 3 seconds you will have encountered the `:each`
method, probably when tinkering with an array. It's a simple little method that
will iterate over a collection and yield to the block passing in each element of
the collection in turn. The return value of `:each` is the original array.

```ruby
[1,2,3].each {|n| puts "#{n+10}"}
# => 11
# => 12
# => 13
# => [1, 2, 3]
```

Every single method that Enumerable provides builds on top of `:each` to create
a more powerful and useful method. I won't spend time listing the methods that
Enumerable gives you so do check out the documentation for the module.

Let's create a small class with a simple `:each` method.

```ruby
class Numbers
  def initialize
    @nums = [1,2,3,4]
  end

  def each
    return enum_for(:each) unless block_given?

    @nums.each do |n|
      yield n
    end
  end
end
```

Here we have a class with an instance variable `@nums` holding a small array of
integers and an `:each` instance method. This method first checks if a block has
been given and returns an enumerator if one hasn't, more on this later.

The rest of the method just iterates over `@nums` using `Array#each` passing
each integer to the block. Here it is in action, hold onto your seats.

```ruby
nums.each {|n| p n }
# => 1
# => 2
# => 3
# => 4
# => [1, 2, 3, 4]
```

I've printed out each integer, nothing mind blowing. We know this works so let's
spice things up by including the `Enumerable` module.

### include Enumerable

```ruby
class Numbers
  include Enumerable

  def initialize
    @nums = [1,2,3,4]
  end

  def each
    return enum_for(:each) unless block_given?

    @nums.each do |n|
      yield n
    end
  end
end
```

Using the same `nums` object from before we should now have access to the
`Enumerable#map` method.

```ruby
nums.map {|n| n+1 }
# => [2, 3, 4, 5]
```

`:map` is like `:each` in that it iterates over a collection but the difference
is it creates a new array for you substituting each element with the result from
the block then returns that array to you.

Here is a recreation of `:map` in our `Numbers` class so you've an idea of what
it's doing under the hood. Notice that it uses `:each` and just like `:each` if
a block isn't given then an enumerator is returned instead.

```ruby
class Numbers
  include Enumerable

  # other methods excluded for brevity

  def map
    return enum_for(:map) unless block_given?

    arr = []
    @nums.each {|n| arr << (yield n)}
    arr
  end
end
```

Since we included Enumerable we don't just have access to `:map`, we now have
access to all of the methods from Enumerable.

```ruby
nums.select(&:even?)
# => [2, 4]
nums.reject(&:even?)
# => [1, 3]
nums.partition(&:even?)
# => [[2, 4], [1, 3]]
nums.sort
# => [1, 2, 3, 4]
```

`:sort` works here because the `Integer`s in the collection already have the
ability to be compared, if we have an array that contains members without this
ability then `:sort`, `:min`, and `:max` will complain.

```ruby
Thing = Struct.new(:value)
[Thing.new(2), Thing.new(1)].sort
# => ArgumentError: comparison of Thing with Thing failed
# => from (pry):161:in `sort'
```

To compare objects they need to have an `:<=>` method defined. Let's quickly
look at this operator before we get onto `Enumerator`.

## Comparable

The `<=>` operator is needed by the Comparable module, if an object has this
method defined on it then the Comparable module will allow you to compare
objects using operators like `<`, `>`, `==` etc, meaning it will allow
`Enumerable#sort`, `Enumerable#min`, and `Enumerable#max` to work.

The `:<=>` method should take one argument, the object being compared with the
receiver, and return `-1`, `0`, or `1` if the receiver is less than, equal to,
or greater than the "other" object respectively.

Let's create two classes to round out our excursion through Enumerable and
Comparable and hopefully clearly demonstrate it all working nicely together.

```ruby
class Person
  def initialize(name, age)
    @age = age
    @name = name
  end

  def <=>(other)
    self.age <=> other.age
  end
end
```

In this simple `Person` class we've just got an initialize method and the
spaceship operator method `:<=>`, because integers can already be compared I've
just compared the ages using the spaceship operator that `Integer` knows about.

```ruby
class Crowd
  include Enumerable

  def initialize
    @people = (1..5).map do |n|
      Person.new("Meatbag #{n}", rand(100))
    end
  end

  def each
    return enum_for(:each) unless block_given?

    @people.each do |person|
      yield person
    end
  end
end
```

In this `Crowd` class I generate a small crowd of people in the initialize
method giving them a name a random age and storing the array in an instance
variable. I've also defined an `:each` method that the included Enumerable
module needs, the method iterates over all the people.

Seeing as we have the spaceship operator defined for the members of our Crowd
collection we should now be able to sort them.

```ruby
crowd = Crowd.new
crowd.sort
# => [#<Person:0x0000561af17512e8 @age=24, @name="Meatbag 1">,
#  #<Person:0x0000561af1751180 @age=33, @name="Meatbag 4">,
#  #<Person:0x0000561af17511f8 @age=36, @name="Meatbag 3">,
#  #<Person:0x0000561af1751108 @age=45, @name="Meatbag 5">,
#  #<Person:0x0000561af1751270 @age=63, @name="Meatbag 2">]
```

Sweet, we've got some _very_ useful functionality in our classes now just
because we defined two methods and included a module. Fantastic. I think it's
time I explained what `enum_for` does.

## enum_for

In my past examples I made sure to include the line `return enum_for(:each)
unless block_given?`, this was to mirror the behaviour of proper `:each` methods.

```ruby
crowd.each
# => #<Enumerator: ...>
[].each
# => #<Enumerator: ...>
```

That's dandy, but what the hell does that mean?

An `Enumerator` is a class that "allows for both internal and external
iteration" and you can get an enumerator by using `Object#to_enum`,
`Object#enum_for`, or `Enumerator#new`. Each of those methods takes the name of
a method you would like an enumerator for.

In essence an enumerator will use the method you've specified as its `:each`
method.

```ruby
my_enum = [1,2,3,4].enum_for(:map)
# => #<Enumerator: ...>
my_enum.each {|n| n*10}
# => [10, 20, 30, 40]
```

It's that simple, armed with that knowledge we should now understand how these
two lines produce the same output.

```ruby
%w{hi there}.each.map {|word| word.upcase}
%w{hi there}.map.each {|word| word.upcase}
```

On the first line the call to `:each` returns an enumerator which uses the
method `:each` as its `:each` method, and then we call `:map` on it with a block
and map does its thing. That first line could be written like this as that's
essentially all it's doing.

```ruby
%w{hi there}.map {|word| word.upcase}
```

The second line is a little more interesting, when we call `:map` without a
block it returns an enumerator which uses the `:map` method as it's `:each`
method. So when we call `:each` it's really running `:map` code, so you could
think of it actually doing something like this.

```ruby
%w{hi there}.map.map {|word| word.upcase}
```

That wasn't too difficult to understand, let's finish off by looking at a few
methods that `Enumerator` gives you for iteration.

## iterate like you mean it

Enumerators are great if you want to build your own method that iterates over a
collection, you can use `:next` to return the next element.

```ruby
enum = [1,2,3].to_enum
# => #<Enumerator: ...>
enum.next
# => 1
enum.next
# => 2
```

You can use `:rewind` to go back to the start of the collection

```ruby
enum.next
# => 3
enum.rewind
# => #<Enumerator: ...>
enum.next
# => 1
```

You can use `:peek` to peek forward and see what element is coming up.

```ruby
enum.peek
# => 2
enum.next
# => 2
```

If you iterate too far a `StopIteration` error will be raised.

```ruby
enum.next
# => 3
enum.next
# => StopIteration: iteration reached an end
#    from (pry):240:in `next'
```

The Enumerable module has a method `:cycle` that we can use if we want to cycle
back round to the start of the collection when we reach the end.

```ruby
enum = [1,2,3].enum_for(:cycle)
# => #<Enumerator: ...>
enum.next
# => 1
enum.next
# => 2
enum.next
# => 3
enum.next
# => 1
```

Here is a concrete example monkeypatching String using an enumerator to
implement some simple encryption, XORing a string with a key that we pass in.

```ruby
class String
  def^(key)
    key_enum = key.bytes.cycle
    bytes.map {|b| b ^ key_enum.next}.pack('C*')
  end
end
str = "my secret"
key = "k3y"
str ^ key
# => "\x06JY\x18V\x1A\x19V\r"
```

If you XOR the results again you get back the original key. Not very secure
but it's cool to know we can do this thanks to Enumerable and Enumerator.

```ruby
"\x06JY\x18V\x1A\x19V\r" ^ key
# => "my secret"
```

## fin

There you have it `Enumerable`, `Enumerator`, and `Comparable`: some incredibly
useful pieces of core Ruby.

