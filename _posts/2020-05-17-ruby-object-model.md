---
layout: post
title: Ruby Object Model
date: 2020-05-17 09:24:49+01:00
categories: [blog]
tags: [ruby]
---

Ruby is pretty great, I think it's a magical language especially when you wrap
your head around the metaprogramming part. If you have used ruby before you will
know that everything in ruby is an object, so you can call methods on
everything, and yes that includes strings and integers.

```ruby
"hi there".reverse     # => "ereht ih"
1.even?                # => false
```

What really helped me understand ruby and its idiosyncrasies was learning the
Ruby Object Model, if you understand ruby's object model and how method look up
works it makes some other parts of the language much easier to understand. For
example, ruby's Eigenclass also known as Singleton class.

My goal here is to layout what ruby's object model is and along the way
hopefully help you to understand what more "advanced" syntax like this is doing:

```ruby
class MyClass
  class << self
    def my_method
      "wtf?"
    end
  end
end
```

## calling a method

Let's start with something very basic, I'll create a class and from that class
instantiate an object.

```ruby
class Person
  def speak
    "hola"
  end
end

skip = Person.new
# => #<Person:0x00005573832d0db0>
skip.speak
# => "hola"
```

I created a new `Person` and I made them speak, but how does ruby know where to
find the method `:speak`. In fact, what happens if we call a method that we
haven't defined in our class?

```ruby
skip.object_id
# => 46977305183960
skip.meep
# => NoMethodError: undefined method `meep' for #<Person:0x00005573832d0db0>
```

Interesting, so there appears to be more methods available than just the `speak`
method defined in `Person` and ruby is smart enough to tell us `meep` doesn't
exist.

There are three scenarios here:

* Calling a method defined in the objects class
* Calling a method defined elsewhere
* Calling a nonexistent method

Let's start with the first one

### method in the object's class

When we call `speak` on `skip` you can think of the message heading off to
the right of the object to check the object's class for the method.

<img src="/assets/img/2020-05-17/object-and-class.png" class="blog-image"/>

Ruby checks in this class for a method called `speak` and finds it so ruby runs
the code. Nice and easy so far. That diagram is too simple, let's see if we can
add some more to it.

### method defined elsewhere

What happens when we call a method which isn't defined in `Person`, i.e.
`:object_id`?

If ruby goes right into the object's class and cannot see the method it is
after, then it will go up the chain of superclasses searching each as it goes.
In other words it will check the parent of `Person`, and keep doing so until it
finds the method it is after.

<img src="/assets/img/2020-05-17/obj-class-superclasses.png" class="blog-image"/>

Ruby finds a method called `:object_id` in class `Object` so it runs that method.

Where did these classes come from? In ruby all classes inherit from `Object`,
there might be some modules or classes before that but generally if you go down
far enough you'll hit `Object` and `BasicObject`.

### calling a nonexistent method

This is all making sense so far, you call a method on an object and eventually
it is found and code is ran. What happens then if we call a method that ruby
cannot find, like `skip.meep` from earlier?

Ruby does its thing, right into the object's class then up the chain of
superclasses looking for `#meep`, it's a pointless endeavour though because that
method doesn't exist in our chain.

When ruby reaches `BasicObject` and cannot find `:meep` it then starts over by
calling `:method_missing` on the original receiver `skip` and the process starts
over. Right into the class, up the chain until it reaches `BasicObject` where it
finds `:method_missing` and the code is ran.

<img src="/assets/img/2020-05-17/method-missing.png" class="blog-image"/>

The astute amongst you might be wondering "if ruby goes through the chain again
looking for `:method_missing` could we define our own method called
`:method_missing` and have ruby run that instead?" and the
answer is fuck yes we can. In fact, this is starting to stray into
metaprogramming territory so I'll quit while I'm ahead. Here is an example of me
defining my own `:method_missing` method.

```ruby
def skip.method_missing(name)
  "Oops, no method #{name}"
end
# => :method_missing
skip.meep
# => "Oops, no method meep"
skip.really?
# => "Oops, no method really?"
```

## singleton class

In that last code block the `def skip.method_missing` syntax might've been new
to you. In fact, just looking at it it's not entirely clear where the method
ends up being defined.

Based off what I've said so far and how ruby looks up methods, that method
should live somewhere in the class or classes superclass, but a quick check in
`Person` shows the method is nowhere to be seen.

```ruby
Person.instance_methods(false)
# => [:speak]
```

I won't go to the hassle of showing you but there is no `method_missing` defined
anywhere in the chain I've described so far, except the original definition in
`BasicObject`. So what's the deal?

### no more lies

I purposefully mislead you in the beginning, ruby doesn't go right from an
object into its class to look for a method. There is an extra step missing, ruby
first goes right into the `singleton class` of an object, also known as the
`eigenclass` and _then_ goes up into the object's class.

<img src="/assets/img/2020-05-17/singleton-class.png" class="blog-image"/>

Previously when I used `def skip.method_missing` to define a new method, this
syntax creates the method in the singleton class of the object. The singleton
class is unique to the object in question, if I create a new `Person` they won't
have access to the method defined in `skips`'s singleton class.

```ruby
alan = Person.new
# => #<Person:0x0000557383d470c8>
alan.meep
# => NoMethodError: undefined method `meep' for #<Person:0x0000557383d470c8>
skip.meep
# => "Oops, no method meep"
```

"Eigen" in german means "own", so you can think of a singleton class
(eigenclass) as a class that only the object in question has access to. It is
its own class, completely separate from the object's parent class.

The trick of overriding the `method_missing` is used a lot by [Ruby on
Rails](https://rubyonrails.org/) and also by
[Hashie::Mash](https://github.com/hashie/hashie#mash), to name but a few
examples, in order to do some pretty cool things. This one little trick opens up
a whole world of possibility for metaprogramming.

## class methods

If you've worked with ruby at all then I'm here to tell you that you've been
writing singleton methods all this time and you might not have even known it.

Remember when I said everything in ruby is an object? Well, that includes
classes. Seeing as a class is an object we should also be able to define
singleton methods on one.

```ruby
def Person.hiya
  "Guten Tag"
end
# => :hiya
Person.hiya
# => "Guten Tag"
```

That to me looks an awful lot like a class method...in fact that's precisely
what it is. A class method is just a method that lives in a class's singleton
class.  This revelation throws our current understanding of method lookup and my
diagrams out of whack though, if you glance back you can see there isn't
anything to the right of a class for ruby to check inside.

## more lies?!

Let's extend the diagram from before to add some more clarity to this circus
show of lies and deceit.

<img src="/assets/img/2020-05-17/class-methods.png" class="blog-image"/>

As you can see there is a little more to the picture than I was letting on. When
you call a method on a class (which again is just an object) ruby still hops to
the right to look into the singleton class of the class, the only difference
then is that it will go up the chain looking in the singleton class of each
superclass.

I'll demonstrate by defining a method in the singleton class of `Object`.

```ruby
def Object.another_method
  "hello from Object"
end
# => :another_method
Person.another_method
# => "hello from Object"
```

<img src="/assets/img/2020-05-17/calling-class-method.png" class="blog-image"/>

Start in `Person` and go right into the singleton class, then up the chain of
singleton classes until you find the method you are looking for. This also means
that the singleton class of `BasicObject` has a `:missing_method` function
defined in there, so the same rules from earlier apply if a class method isn't found.

## demystifying syntax

You have probably seen class methods defined this way

```ruby
class Person
  def self.sleep
    "zzz"
  end
end
```

Seeing as `self` inside a class references the class itself you can see that
`def self.sleep` is exactly the same as `def Person.sleep`.

There is one other way you can define a singleton method on a class object:

```ruby
class Person
  class << self
    def sleep
      "zzz"
    end
  end
end
```

What `class << self` is doing here is opening up the singleton class of the
class you're in so you can define methods in there instead of needing to define
them on the object directly.

## turtles all the way down

A singleton class is just that, a class. And as previously mentioned classes are
objects, and what do objects have? Singleton classes. That means singleton
classes have singleton classes, and that logic continues on down so singleton
classes can have singleton classes that have singleton classes that have their
own singleton classes and so on.

```ruby
skip.singleton_class
# => #<Class:#<Person:0x00005573832d0db0>>
skip.singleton_class.singleton_class
# => #<Class:#<Class:#<Person:0x00005573832d0db0>>>
skip.singleton_class.singleton_class.singleton_class
# => #<Class:#<Class:#<Class:#<Person:0x00005573832d0db0>>>>
```

## in a nut shell

Here is a summary of everything that I just said, and if
you understand this then you are golden.

> The superclass of the singleton class of an object is the object's class. The
> superclass of a singleton class of a class is the singleton class of the
> class's superclass.

## but wait there's more

Objects, classes, and singleton classes aren't the only thing that you will find
in the object model, there is also modules. Modules can be 'prepended to' or
'included in' a class. When you prepend a module it is inserted into the
ancestor chain _before_ the class, if you include a module it comes after the
object.

```ruby
module Thing;end
# => nil
Person.ancestors
# => [Person, Object, Kernel BasicObject]
Person.include Thing
# => [Person, Thing, Object, Kernel BasicObject]
module Stuff;end
# => nil
Person.prepend Stuff
# => [Stuff, Person, Thing, Object, Kernel BasicObject]
```

And here is a visual representation of that hierarchy

<img src="/assets/img/2020-05-17/modules.png" class="blog-image"/>

## deliciously simple

My explanation in this post about the Ruby Object Model has been a simplified
one, there are more complex diagrams out there which reveal some more fun
information like every class's class is `Class` (yes, even `Class`'s class is `Class`).

```ruby
Person.class
# => Class
Person.class.class
# => Class
Person.class.superclass
# => Module
Person.class.superclass.class
# => Class
Person.class.superclass.superclass
# => Object
```

Here is one such diagram that I've found online

<img src="/assets/img/2020-05-17/object-model.png" class="blog-image"/>

I hope that little journey through the Ruby Object Model has been helpful and
eye opening for you. There is still more out there for you to learn but
everything I've mentioned in this post will be more than enough for you to have
a working knowledge of ruby's object model.

