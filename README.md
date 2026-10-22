# L++ - Made to be enjoyed
## 1. Introduction
**L++ is a simple systems programming language that is strongly and statically typed**<br>
It follows a single philosophy: "*Programming should be enjoyable, easy, and simple*".
## 2. Installation
To install L++ you need to install [Node.js](https://nodejs.org/en) to run L++, and [git](https://git-scm.com/install/) to clone the repo
First we'll clone the repo and tell it to put it inside a folder named lpp:<br>
```
git clone https://github.com/silliestbiddlebuddy-dotcom/LPP-lang.git lpp
cd lpp
```
After that you'll want to install the project's dependencies and link the CLI:
```
npm install
npm link
```
And voila you can now do ```lpp coolFile.lpp``` anywhere on your machine!
## 3. Examples
### [Hello, world! Program](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/hello.lpp)
Very simple program that prints "Hello, world!
### [Variables Showcase](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/variables.lpp)
Simple program showcasing variables
### [Conditionals Showcase](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/conditionals.lpp)
Simple program that Showcases control-flow
### [Functions Showcase](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/functions.lpp)
Program showcasing functions
### [Loops Showcase](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/loops.lpp)
Program showcasing loops
### [Types Showcase](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/types.lpp)
Program showcasing type declarations
### [Generics Showcase](github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/generics.lpp)
Program showcasing generics (type parameters)
### [Classes Showcase](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/Examples/generics.lpp)
Program showcasing classes

## 4. Syntax 101 
L++ syntax comes mostly from Luau, however it adds the things it's missing, native classes, interfaces and a better type system - that's what L++ made possible
and just a little bit from C++
also, all statements require a statement terminator (;) except for block based statements like functions or loops in which statement terminators are optional (they're still required inside the body)
### Comments
L++ currently supports only single-line comments, they are written like in C-style languages.
```// HelloWorld(print)```
### Declaring variables
In L++ to declare variables we use this form:<br>`<Modifier> <Scope> <Name> = <Value>;`.<br>
For example:<br> `const local foo: barType = bar;`<br>
Keep in mind that in L++ you must always annotate your variables.
### Assignment
To assign a value to an already existing variable we can do:<br> `foo = baz`
### Functions
To define a function in L++ we can write:<br>
```
function foo<T: constraint>(param: paramType): returnType {
    const local foo: barType = bar;
}
```
as you can see L++ functions must also always be annotated, they support parameters, which must also be annotated as well as type parameters, if you do not care about what type a type parameter is you can annotate it with any as such:<br> `function foo<T: any>(): returnType {} `<br>
in L++ the built-in any type disables type checking for whatever is annotated as any, the only time we recommend annotating your values as any is in a type parameter constraint, in other places you can use an union type!!!
### Loops
in L++ (like any other programming languages), loops are essential.
#### For-Loops
L++ for loops are written as such:<br>
```
for (initializer; condition; update) do {

};
```
#### While-Loops
L++ while loops are written as such:<br>
```
while (cond) do {

};
```
#### Other Loops
Since L++ is still WIP, it doesn't have some QoL features such as do-while loops or for-of loops
### If Statements
In L++ an if statement looks like:<br>
```
if (cond) do {

} elseif (cond) do {

} else {

};
```
as you can see L++ is very verbose (java reference 😭✌️🥀)
### Type Declarations
In L++ there are two types of type declarations: Type aliases and user-defined-types also named UDT (they're just objects ✌️)
type declarations can have type parameters too!<br>
here is an example of both:<br>

```
type fooAlias<T: any> = T;
type fooUDT = {
  foo: int,
  bimbimbambam: hackerType
};
```
### Types
L++ has a lot of types such as: Literal types (```type greeting = "hi";```), Union types (```type greeting = "hi" | "hello";```),  Object types (```type greetingA = {coolGreeting: "hi"};```), Intersection types (```type greeting = greetingA & greetingB;```), and Type references (```type greeting = int;```).
### Modifiers
Before we go into classes we have to talk about modifiers, there are two type of modifiers:
#### General Modifiers
Modifiers such as ```export``` or ```declare``` are general modifiers, they can be put before a declaration as such:<br>
```export local foo: barType = bar;```<br>
#### Access Modifiers
Modifiers such as ```public``` or ```private``` are access modifiers, they can only be used in classes.
#### Object Modifiers
Modifiers such as ```readonly``` are object modifiers, they can only be used in objects as such:<br>
```
type foo = {
    readonly bar: int
}
const local baz: foo = {
    readonly bar: 1 // you dont actually have to put the readonly if in the object type it uses readonly.
}
// also ive just realized youll always have to create a type for object types but whatever, trust me your code will look better and besides you can reuse the type
```
#### Class Modifiers
Modifiers such as ```abstract``` or ```static``` are class modifiers, they can only be used in classes.
### Classes
In L++ classes are very simple, they can have type parameters like functions too!
here is an example:<br>
```
class foo<T: any> {
    public property: T
    public function foo(property: T) { //constructor
        this.property = property;
    }
    private function fooMethod(bar: barType) {
      
    }
};
```


## 7. [License](https://github.com/silliestbiddlebuddy-dotcom/LPP-lang/blob/main/LICENSE)

