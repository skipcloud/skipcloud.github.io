---
layout: post
title: Ruby Modules
date: 2020-09-26 08:36:31+01:00
categories: [blog]
tags: [ruby, modules, mixin]
---

Modules are everywhere in Ruby, they are an important part of the [Ruby Object
Model]({% post_url 2020-05-17-ruby-object-model %}) but if you only interact
with Ruby here and there (perhaps you have a ruby app you support in work) they
can be a little illusive.

You can `include`, `extend`, and `prepend` modules, but what does that actually
mean? How does a module differ from a class? What tricks can you do with them?

I hope to layout the usefulness of modules as well as showing you how Ruby and
Rails uses module callbacks to do some pretty clever stuff. Let's get stuck in.

## class or module?

Right off the bat let's just go over the difference between a class and a module
in Ruby, after all both can contain methods and constants so what's the
difference?

In short a class...

- can generate instances (objects)
- can have per-instance state (instance variables)
- can inherit from another class but not a module
- cannot be mixed into anything

And a module...

- cannot generate instances (objects)
- cannot have per-instance state (instance variables)
- cannot inherit from anything
- can be mixed into classes and other modules

Pretty simple, keep those points in mind as we move on here, let me explain the
two main uses for modules.

## dual duty

Modules serve two purposes in Ruby:

- 1) They can namespace your code to prevent clashes.
- 2) They can be mixed into classes, modules, and objects to add functionality.

### namespaces

Say we have a file `human.rb` which has a function called `hello`:

```ruby
# human.rb
def hello
  "hello from human"
end
```

And we also have another file `person.rb` which also has a function called
`hello`:

```ruby
# person.rb
def hello
  "hello from person"
end
```

Say there's other functionality in these files we want to use in a ruby script
we are writing, so we require these files:

```ruby
# skip.rb
require_relative 'person'
require_relative 'human'

# code ...
puts hello
# more code ...
```

Well when we run the code in `skip.rb` the code in `person.rb` is loaded and
`hello` is defined but then the `human.rb` file is loaded and its `hello` method
definition overwrites the previous definition:

```sh
$ ruby skip.rb
"hello from human"
```

Modules to the rescue! Modules let you namespace methods and constants to
prevent these sorts of clashes.

The syntax for defining a module is:

```ruby
module Example
  # constants
  EXAMPLE = true

  # methods
  def Example.example_method
    puts "A module method"
  end
  # or
  def example_method
    puts "A module method"
  end
end
```

A module name, just like a class name, starts with an uppercase letter, in this
case I've went with the original name of `Example`.  Constants are defined in a
module exactly the same way as you would define them in a class, all uppercase.

Methods can be defined on the module itself, much like a class
method, by using the syntax `def <module-name>.method_name` however you can also
use `def self.method_name` as `self` refers to the module, for more information
on how singleton methods work check out my previous blog post on [the Ruby
Object Model]({% post_url 2020-05-17-ruby-object-model %}).

The second way of defining a method in a module uses the syntax `def
method_name`, this is what's known as an _instance method_. I know I said
modules can't create instances but I'll explain why this is handy when I get to
_mixins_.

Let's update the code we were using before and make them into modules, while we
are at it let's also add some constants so we see how they work.

```ruby
# human.rb
module Human
  FOO = true

  def Human.hello
    "hello from human"
  end
end

# person.rb
module Person
  BAR = false

  def Person.hello
    "hello from person"
  end
end

# skip.rb
require_relative 'person'
require_relative 'human'

puts Person.hello
puts Human.hello
puts Human::FOO
puts Person::BAR
```

Now we have a way to call the specific function we are after and because they
are namespaced none of them are over written when we require the files. We can
call the methods just like class methods by using the module name and we can
reference constants using the module name and two colons.

```
$ ruby skip.rb
hello from person
hello from human
true
false
```

Being able to use modules as libraries is great, you could create a `Math`
module to hold all your mathematical functions for example but modules are
incredibly powerful things when you start mixing them into objects to extend
their functionality.

### mixins

Modules are great for code reuse, because Ruby doesn't support multiple class
inheritance you can define common functionality in a module and include that
functionality in your classes instead. You do this by defining _instance
methods_ in your modules, if you've got some constants defined then they also come
along for the ride.

### include

Let's create a small module with a constant and an instance method that says hello.

```ruby
module Hello
  FOO = "bar"

  def say_hello
    "Hello!"
  end
end
```

If you `include` this module in a class then instances of that class will then
have access to the  `FOO` constant and the `say_hello` method.

```ruby
class Skip
  include Hello
end

Skip.new.say_hello
# => "Hello!"
Skip::FOO
# => "bar"
```

It's worth noting that when you include a module it doesn't add methods to the
class, a reference to the module is just added to the ancestors chain just
after the class. During method look up each of these classes/modules are checked
for the method definition of whatever method has been called, in this instance
`say_hello` isn't found in the `Skip` class but it is found in the `Hello`
module right after `Skip`.

```ruby
Skip.ancestors
# => [Skip, Hello, Object, Kernel, BasicObject]
```

That means if we already have a method called `say_hello` in our `Skip` class
then including `Hello` won't overwrite it.

```ruby
class Skip
  include Hello

  def say_hello
    "Ahoy hoy!"
  end
end

Skip.new.say_hello
# => "Ahoy hoy!"
```

### prepend

What if we _do_ want to override methods when we include a module? Well given
what we know about the ancestor chain it makes sense that we should try put the
module before our class so the module is checked first during method look up.

Ruby gives us `prepend` to do exactly that.

```ruby
module Goodbye
  def say_goodbye
    "Goodbye!"
  end
end

class Skip
  prepend Goodbye

  def say_goodbye
    "See you later!"
  end
end

Skip.ancestors
# => [Goodbye, Skip, Object, Kernel, BasicObject]
```

So now if we call `say_goodbye` on an instance of `Skip` the `Goodbye` module will
be checked first for a method definition:

```ruby
Skip.new.say_goodbye
# => "Goodbye!"
```

### extend

Okay, so up until now we've been mixing functionality into class definitions,
what if we only want to add functionality to a particular object? To do this
we need to `extend` an object, first let's start with instances of a class then
I'll come back round to what happens when you extend a class itself.

#### instances

Let's create a module for this example with a method that let's an object
tell us its object ID.

```ruby
module ObjectID
  def my_object_id
    "My object ID is #{self.object_id}"
  end
end
```

And this time we can call `extend` on a particular object instead of messing
with its class:

```ruby
class Skip
end

s1 = Skip.new
s1.extend(ObjectID)
s1.my_object_id
# => "My object ID is 47289906505580"
```

Now only this particular `Skip` object has access to the `my_object_id` method,
if we try call it on another instance then we get a `NoMethodError`.

```ruby
s2 = Skip.new
s2.my_object_id
# => Traceback (most recent call last):
#            2: from /home/skip/.rbenv/versions/2.5.6/bin/irb:11:in `<main>'
#            1: from (irb):13
#    NoMethodError (undefined method `my_object_id' for #<Skip:0x00005605142290d8>)
```

If we check `Skip`'s ancestor chain we aren't going to find the `ObjectID`
module anywhere, it's nowhere to be seen. This makes sense though, we are
playing with individual objects and not the class itself when we call `extend`
on an instance of a class.

```ruby
Skip.ancestors
# => [Skip, Object, Kernel, BasicObject]
```

When you call `extend` on an object ruby includes the module in the singleton
class of the object (if you don't know what the singleton class is then go read
my [Ruby Object Model]({% post_url 2020-05-17-ruby-object-model %}) post). This
means that only that particular object will have been affected.

We can achieve the same result with `include` if we use it on an object's
singleton class:

```ruby
s3 = Skip.new
s3.singleton_class.include ObjectID
s3.my_object_id
# => "My object ID is 47289907200220"
```

#### classes

What happens then if we extend a class? Well, exactly the same thing happens.
The module's instance methods and constants are added to the singleton class of
the object.

```ruby
class Skip
  extend ObjectID
end

Skip.my_object_id
# => "My object ID is 47289906584860"
```

> Hold up, that looks like a class method!

Exactly right! That's all a class method is, it's a method defined on the object
itself, in other words it's defined on the singleton class of the object. It
just so happens our object here is a class. So by using `extend` you can add
class methods to a class from a module.

Knowing what we do now if we wanted to use a module to add class methods AND
instance methods we can use a mixture of `include`, `prepend`, and `extend`.

```ruby
module Shout
  def shout
    "OI!"
  end
end

class Skip
  include Shout
  extend Shout
end
Skip.shout
# => "OI!"
Skip.new.shout
# => "OI!"
```

## callbacks

`include`, `prepend`, and `extend` are really handy and
[`Module`](https://ruby-doc.org/core-2.5.0/Module.html) has (among other things)
callback methods that it invokes when you do either of those actions which you
can use to do interesting things when you include, prepend, or extend a module.
The methods that follow are usually empty and only exist for you, the person
writing code, to define and make use of in your code.

There is a method called
[`included`](https://ruby-doc.org/core-2.5.0/Module.html#method-i-included)
which is called when the module is included in another module or class, the
class or module that has included the module is passed into this method as an
argument.

```ruby
module A
  def self.included(base)
    puts "I was included in #{base.name}"
  end
end

module B; end
B.include(A)
# => I was included in B
```

There is also a callback called
[`prepended`](https://ruby-doc.org/core-2.5.0/Module.html#method-i-prepended)
which is called (can you guess?) when a module is prepended (shock!).

```ruby
module C
  def self.prepended(base)
    puts "I was prepended to #{base.name}"
  end
end

class D;end
D.prepend(C)
# => I was prepended to D
```

And yes, there is also a callback called
[`extended`](https://ruby-doc.org/core-2.5.0/Module.html#method-i-extended) that
you can define.

```ruby
module E
  def self.extended(base)
    puts "I extended #{base.name}"
  end
end

module F;end
F.extend(E)
# => I extended F
```

### a useful example

You can use these callbacks to your advantage, one way they are typically used
is to extend a class when the module is included, which means you can add
instance methods and class methods in one go.

```ruby
module A
  def self.included(base)
    base.extend ClassMethods
  end

  def a_method
    "I'm an instance method"
  end

  module ClassMethods
    def another_method
      "I'm a class method"
    end
  end
end

class Skip
  include A
end

Skip.new.a_method
# => "I'm an instance method"
Skip.another_method
# => "I'm a class method"
```

This is a very common and useful paradigm, it was used extensively in earlier
versions of Ruby on Rails, you can see it here in
[`ActiveRecord::Validations`](https://github.com/rails/rails/blob/v2.3.14/activerecord/lib/active_record/validations.rb#L384-L393).
It is not without its problems though, this problem becomes apparent when you
have multiple levels of inclusion.

## chained inclusion

To demonstrate this problem I'm going to need a couple of modules.

```ruby
module SecondLevel
  def self.included(base)
    base.extend ClassMethods
  end

  def second_level_instance_method; "hi"; end

  module ClassMethods
    def second_level_class_method; "hi"; end
  end
end

module FirstLevel
  def self.included(base)
    base.extend ClassMethods
  end

  def first_level_instance_method; "hi"; end

  module ClassMethods
    def first_level_class_method; "hi"; end
  end

  include SecondLevel
end
```

Here we have two modules and each defines an instance method and a class method,
each modules use the "include and extend" trick I explained earlier, but this
time `FirstLevel` includes the other module `SecondLevel` at the end.

Let's try the code out by including `FirstLevel` in a class.

```ruby
class Skip
  include FirstLevel
end

Skip.ancestors
# => [Skip, FirstLevel, SecondLevel, Object, Kernel, BasicObject]
s = Skip.new
s.first_level_instance_method
# => "hi"
s.second_level_instance_method
# => "hi"
```

All is well, the modules are in `Skip`'s ancestor chain so the instance methods
are found. What about the class methods?

```ruby
Skip.first_level_class_method
# => "hi"
Skip.second_level_class_method
# => Traceback (most recent call last):
#         2: from /home/skip/.rbenv/versions/2.5.6/bin/irb:11:in `<main>'
#         1: from (irb):34
#    NoMethodError (undefined method `second_level_class_method' for Skip:Class)
```

What's happened here? If you follow the code you should see what has happened.
When `SecondLevel` is included in `FirstLevel` it is `FirstLevel` that is passed
to the `included` callback, which makes `second_level_class_method` a module
method of `FirstClass` which isn't what we wanted.

```ruby
FirstLevel.second_level_class_method
# => "hi"
```

Ruby on Rails developers ended up coming up with a solution to this problem by
creating `ActiveSupport::Concern`.

## ActiveSupport::Concern

Here is
[`ActiveSupport::Concern`](https://github.com/rails/rails/blob/3e0cdbeaf4e769ebd356a2c06dfae13d22283b7c/activesupport/lib/active_support/concern.rb)
in action.

```ruby
module A
  extend ActiveSupport::Concern

  def a_instance_method; "hi"; end

  module ClassMethods
    def a_class_method; "hi"; end
  end
end

module B
  extend ActiveSupport::Concern

  def b_instance_method; "hi"; end

  module ClassMethods
    def b_class_method; "hi"; end
  end

  include A # <- including another module
end

class Skip
  include B
end

Skip.b_class_method
# => "hi"
Skip.a_class_method
# => "hi"
```

All we need to do is `extend` our modules with `ActiveSupport::Concern` and it
takes care of adding our `ClassMethods` as well as sorting out the problem of
where they are added, no need to mess around with callbacks.

`Skip` includes `B` which includes `A` and `Skip` then has both class methods.
How does it work then?

### extended

In the Rails source code for
[`ActiveSupport::Concern`](https://github.com/rails/rails/blob/3e0cdbeaf4e769ebd356a2c06dfae13d22283b7c/activesupport/lib/active_support/concern.rb#L123-L125)
we can see they have defined an `extended` method in the module:

```ruby
# activesupport/lib/active_support/concern.rb

module ActiveSupport
  module Concern
    def self.extended(base)
      base.instance_variable_set(:@_dependencies, [])
    end
```

All it does is set a class variable called `@_dependencies` on whatever object
it's extending, grand so what is that for? To understand its use we need to look
at a couple of other methods that `ActiveSupport::Concern` defines but to
understand those however we need to first look at Ruby's standard library.

### append_features

In the section on callbacks I mentioned the `included`, `prepended` and
`extended` callback methods are usually empty and need to be filled in by you in
order to do anything useful. Behind the scenes Ruby uses
[`append_features`](https://ruby-doc.org/core-2.5.0/Module.html#method-i-append_features)
to actually include the module in the ancestor chain, it checks if the module
already exists or not before adding it. `append_features` isn't supposed to be
overwritten but like every other method in Ruby we can go right ahead and mess
with it anyway.

```ruby
module A
  def self.append_features(base)
    false
  end
end

class Skip
  include A
end

Skip.ancestors
# => [Skip, Object, Kernel, BasicObject]
```

Notice how module `A` is missing from the ancestors chain? By returning `false`
in `append_features` we are telling Ruby not to include this module in the
ancestors chain. Knowing this we can switch back to talking about what
`ActiveSupport::Concern` does.

```ruby
# activesupport/lib/active_support/concern.rb
module ActiveSupport
  module Concern
    def append_features(base)
      if base.instance_variable_defined?(:@_dependencies)
        base.instance_variable_get(:@_dependencies) << self
        false
      else
        return false if base < self
        @_dependencies.each { |dep| base.include(dep) }
        super
        base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
        # ...
      end
    end

    # ...
  end
end
```

This is some pretty intense code but that's alright we can work through it
together. The basic premise of this code is to never include a concern within
another concern and when a concern is finally included in a module or class that
isn't a concern all of the dependencies are included in one go. Let's walk
through it.

Here is the code from before for reference, I'll remove the instance methods so
we can focus on the class methods.

```ruby
module A
  extend ActiveSupport::Concern

  module ClassMethods
    def a_class_method; "hi"; end
  end
end

module B
  extend ActiveSupport::Concern

  module ClassMethods
    def b_class_method; "hi"; end
  end

  include A # <- including another concern
end

class Skip
  include B
end
```

First off `append_features` is defined as an instance method in
`ActiveSupport::Concern` so if a module extends `ActiveSupport::Concern` it'll
get `append_features` as a class method (remember, singleton class!).

When module `B` includes module `A` `append_features` will be called on `A` and
`B` will be passed in as the `base` argument.

```ruby
def append_features(base)
  if base.instance_variable_defined?(:@_dependencies)
    base.instance_variable_get(:@_dependencies) << self
    false
    # ...
```

The code checks if `@_dependencies` is defined on `B` and if it is then it must
be a `Concern` so just add `self` to the array of dependencies, remember `self`
at this point refers to module `A`. Then return `false` so the ancestor chain
isn't altered.

Right now `B`'s class variable would look like this:

```ruby
B.instance_variable_get(:@_dependencies)
# => [A]
```

When `Skip` includes the module `B` `append_features` is called on `B` and
`Skip` is passed to the method as the `base` argument.

```ruby
def append_features(base)
  if base.instance_variable_defined?(:@_dependencies)
    # ...
  else
    # ...
```

`Skip` doesn't have a `@_dependencies` class variable defined so we move to the
`else` block.

```ruby
def append_features(base)
  # ...
  else
    return false if base < self
    @_dependencies.each { |dep| base.include(dep) }
    super
    base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
    # ...
  end
end
```

The first line uses the
[`<`](https://ruby-doc.org/core-2.5.0/Module.html#method-i-3C) method to check
if `base` (which in this case is `Skip`) is a subclass of `self` (`B`), which it isn't. Onto the next line:

```ruby
@_dependencies.each { |dep| base.include(dep) }
```

This next line iterates over `B`'s class variable `@_dependencies` and includes
everything on `base` AKA `Skip`. There's only one thing in this array right now
and that's `A`, so `dep` gets sets to `A` and is then included on `Skip`, at this point we need to shift focus back to
the `A` module.

Because `A` is being included on `Skip` that means `append_features` is called
on `A` by Ruby and `Skip` is passed in as `base`, so the `if` statement is
checked again.

```ruby
if base.instance_variable_defined?(:@_dependencies)
```

And `Skip` doesn't have this class variable set so we continue on to the `else`
statement of `append_features`.

```ruby
return false if base < self
@_dependencies.each { |dep| base.include(dep) }
super
base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
```

Is `Skip` a subclass of `A`? Nope, onto the next line.

Iterate over all the dependencies, but `A` doesn't have any dependencies so we
continue onto the next line which just calls `super`. Ruby will then look up the
call chain looking for the original `append_features` which will include `A` in
`Skip`'s ancestor chain.

And the last line on `A`'s journey here will just extend `Skip` with any
`ClassMethods` if there is a submodule defined in `A` with that name.

`A`'s journey ends there but remember we were in the middle of including `B`, so
let's head back to `B.append_features`, I believe we were in the middle of
including all of our dependencies:

```ruby
def append_features(base)
  # ...
  else
    return false if base < self
    @_dependencies.each { |dep| base.include(dep) }  # <- Here!
    super
    base.extend const_get(:ClassMethods) if const_defined?(:ClassMethods)
    # ...
  end
end
```

Then just like what happened with `A` `super` is called which adds `B` to
`Skip`'s ancestor chain and any `ClassMethods` are added to `Skip`.

And that's it!

## what about instance variables?

I'm pretty much done with modules now but there's one more thing I should add.
In ruby whenever the first instance of an `@` prefixed instance variable is
encountered an instance variable is created on the implicit `self`, which
means we can add these to our modules if we so wished. Along with that we could
add `attr_*` methods too.

```ruby
module Legs
  attr_reader :num_legs

  private

  def grow_legs
    @num_legs = 2
  end
end

class Skip
  include Legs

  def initialize
    grow_legs
    puts "Oh wow, I have #{num_legs} legs"
  end
end

Skip.new
# => Oh wow, I have 2 legs
```

You need to be careful with this though because if you include another module
which sets an instance variable of the same name it'll overwrite the previous
one, much like the trouble we had at the start of this post with methods
overwriting one another when we required the files. Be careful with this.

## Cool, now what?

That's completely up to you, I would advise reading the post I wrote on the
[Enumerable module]({% post_url 2020-08-16-ruby:-Enumerable-&-Enumerator %})
which shows a really useful module available to you in standard ruby.

Other than that go and play! Write some code, break shit, read source code and
see how others are making use of modules. They are really handy things.

