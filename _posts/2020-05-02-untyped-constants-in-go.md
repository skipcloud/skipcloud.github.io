---
layout: post
title: Untyped Constants In Go
date: 2020-05-02 07:37:39+01:00
category: blog
tags: [Go]
---

For the majority of the time in my life that I've been programming I've worked
with interpreted dynamically typed languages like Python or Ruby. I tried to
learn some C about a year after setting out to learn how to code but I didn't
know enough then about how computers worked to fully grasp the concepts. Trying
to learn C was my first exposure to a compiled statically typed language.

## dynamic and static

Real quick, a dynamically typed programming language is a language where you
don't need to specify what type of value is being held in a variable. You can
put anything you want in a variable and the interpreter won't complain.

```ruby
my_variable = {key: 'value'}
my_variable = 1234
my_variable = Object.new      # All of this is completel legal
```

In a statically typed language you need to say up front what the variable will
be holding, and this type cannot hold anything other than a value of that type.

```go
var myVariable string

myVariable = "hi there"    // legal
myVariable = 1234          // illegal, this code will not compile
```

There are pros and cons to these different approaches, I won't get into that in
this post. I just wanted to point out that in a typed language like Go you can't
just put any old value in a variable. There are rules.

## types in Go

Go has many types [defined in its spec](https://golang.org/ref/spec#Types) and
as you would expect it has all the usual primitives such as `string`, `int`,
`float64` etc.

As in the Go example above you can define a variable and its type before
assigning a value to it, you can also use the shorthand notation and have Go
infer the type from the value you pass in.

```go
x := "hi"      // this syntax is the same as the next two lines

var y string
y = "hi"
```

This all makes sense, a string is a string right? What if we were to do the same
with an integer which comes in many different flavours? If we let Go infer the
type, what type would the variable hold?

```go
var i int64
i = 1       // legal, the type of i is int64

j := 1      // also legal, except now the type is int (trust me)
```

How come assigning the same value, just in different ways, gives us two
different types? If you hadn't twigged on by now the reason is constant
expressions in Go are untyped. The type is inferred by the compiler at compile
time.

## untyped in a typed world

[Constants](https://golang.org/ref/spec#Constants), specifically [constant
expressions](https://golang.org/ref/spec#Constant_expressions), like strings and
numbers are interesting because although they are untyped they _do_ have a
*default* type.  For example integers have the default type of `int` and floats
have the default type `float64`. In fact here are all the default types in Go:
`bool`, `rune`, `int`, `float64`, `complex128` or `string`. You can probably
piece together which default types go with which constant, `rune` is Go's
version of a character.

Although constants have their own default type you can set a type for a constant
as long as it makes sense to do so.

```go
type MyInt int16

var i int64 = 3.0
var j float32 = 7
var k MyInt = 9
```

All of the above are perfectly legal, `i` is of type `int64` and holds the value
`3`, `j` is of type `float32` and holds the value `7.0`, and `k` is of type
`MyInt` and holds the value `9`. The last example there works because `MyInt`
has an underlying type `int16` that makes sense with an integer constant. Trying
to set `k` to something like a `bool` would not compile.

## watch you don't trip

Understanding the untyped nature of constants in Go really helps you avoid
common pitfalls such as the following.

```go
func main() {
  fmt.Printf("Gimme %s", getDuration(3))
}

func getDuration(sec int) time.Duration {
  return time.Second * sec
}
```

This code will fail to compile, whereas the following is perfectly legal.

```go
func main() {
  fmt.Printf("Gimme %s", time.Second*3)
}
```

In the first example `3` is passed to `getDuration` and is assigned to the
variable `sec` which is of type `int`, whereas the `time` package has defined a
custom type `Duration` and `time.Second` is of type `time.Duration`.
`time.Duration` has an underlying type of `int64`, however even if we were to
change the parameter value's type to `int64` we would still run into the same
problem.

The second example works precisely because `3` is an untyped constant
expression, in situations like this the compiler sees `time.Second * 3` and it
knows the underlying type of `time.Second` is something `3` can be cast to. The
compiler does its thing and you don't need to worry.

Back to the first example, trying to use operands of two differing types like
this is not allowed, but knowing it's a type problem you have two ways you can
get around it. You could either change the parameter type in the original
function to `time.Duration`:

```go
func main() {
  fmt.Printf("Gimme %s", getDuration(3))
}

func getDuration(sec time.Duration) time.Duration {
  return time.Second * sec
}
```

Or you can cast the argument to `time.Duration`


```go
func main() {
  fmt.Printf("Gimme %s", getDuration(3))
}

func getDuration(sec int) time.Duration {
  return time.Second * time.Duration(sec)
}
```

## losing precision

To finish up I want to stray slightly from the talk of default types and bring
up casting seeing as I brought it up 5 seconds ago, more specifically how you
can lose precision when casting. As always I'll demonstrate it with a simple
example.

You can cast a value to a type that has smaller precision, for example from
`int64` to `int8`

```go
func main() {
  var i int64 = 1000000000000000001
  println(int8(i))
}
```

The above is fine, it will compile and run but only the number `1` will be
printed out. An `int64` has 64 bits it can use to represent a number, so the
number `1,000,000,000,000,000,001` looks like this in binary:

```
00001101 11100000 10110110 10110011 10100111 01100100 00000000 00000001
```

`int8` however can only hold 8 bits, so when you cast an `int64` to `int8` the higher
order bits just get lopped off and you are left with this:

```
00000001
```

Which equals `1`.

## conclusion

Coming to a statically typed language from something like Ruby takes some
getting used to, it can feel incredibly restrictive, I know I struggled a lot
when I started.

In saying that I have come to really like the typed nature of Go, it's like a
safety blanket that stops you doing something stupid and generally catches a lot
of bugs before you get anywhere near production.

Learn to love the types.
