# Functional Programming

An introduction to functional programming in JavaScript.

- [A shift of paradigm](#a-shift-of-paradigm)
- [Functions are first-class citizens](#functions-are-first-class-citizens)
- [Closures](#closures)
- [Pure Functions](#pure-functions)
- [The case for immutability](#the-case-for-immutability)
- [Working with arrays](#working-with-arrays)
- [Composing functions](#composing-functions)
- [Why functional programming?](#why-functional-programming)
- [Further readings](#further-readings)

## A shift of paradigm

Let's first compare the same program written in an object-oriented paradigm, then a functional paradigm.
The program helps calculating the price of a purchase invoice, which is made of lines. A line, in turn, is comprised of a certain amount of a given reference.

### Object-Oriented Programming

```typescript
export class Reference {
  constructor(private id: string, private price: number) {}

  public getId(): string {
    return this.id;
  }

  public getPrice(): number {
    return this.price;
  }
}

class InvoiceLine {
  constructor(private reference: Reference, private quantity: number) {}

  public computePrice(): number {
    return this.reference.getPrice() * this.quantity;
  }
}

export class Invoice {
  private lines: InvoiceLine[] = [];

  public addReference(reference: Reference, quantity: number): void {
    this.lines.push(new InvoiceLine(reference, quantity));
  }

  public computePrice(): number {
    let totalPrice: number = 0;
    this.lines.forEach(line => {
      totalPrice += line.computePrice();
    });
    return totalPrice;
  }
}
```

```typescript
const invoice = new Invoice();
const reference0 = new Reference("5f8e5092-22fe-4e4f-897f-2948e3b4d507", 50);
const reference1 = new Reference("b2cb27dc-339f-4eeb-aa94-31b4ddaa8e92", 30);
invoice.addReference(reference0, 2);
invoice.addReference(reference1, 1);
expect(invoice.computePrice()).toEqual(130);
```

### Functional Programming

```typescript
interface Reference {
  id: string;
  price: number;
}

interface InvoiceLine {
  reference: Reference;
  quantity: number;
}

export interface Invoice {
  lines: InvoiceLine[];
}

function computeInvoiceLinePrice({ reference: { price }, quantity }: InvoiceLine): number {
  return price * quantity;
}

function sum(a: number, b: number): number {
  return a + b;
}

export function computeInvoicePrice({ lines }: Invoice): number {
  return lines.map(computeInvoiceLinePrice).reduce(sum, 0);
}
```

```typescript
const invoice: Invoice = {
  lines: [
    {
      reference: {
        id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
        price: 50
      },
      quantity: 2
    },
    {
      reference: {
        id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
        price: 30
      },
      quantity: 1
    }
  ]
};
expect(computeInvoicePrice(invoice)).toEqual(130);
```

The two codebases look quite different. In the functional programming way, we can see that:

- Data (`Reference`, `InvoiceLine`, `Invoice`) and behavior (`computeInvoiceLinePrice`, `computeInvoicePrice`) are separated, while both are encapsulated in classes in the object-oriented way;
- No function ever returns `void`, while `addReference` returns `void` in the object-oriented way. In other words, there is no state other than inputs and outputs of functions. That's valuable when it comes to testing!
- There is no `let` keyword, as opposed to `let totalPrice: number = 0;` in the object-oriented way. That's not an absolute rule, but functional programming favors `const` over `let` and `var` thanks to `reduce`, `map` and `filter` functions;

## Functions are first-class citizens

...meaning that one can do everything with functions that they do with language primitives and objects, namely:

Assign a function to a variable:

```javascript
const increment = function(n) {
  return n + 1;
};
```

Pass a function as a callback to another function:

```javascript
function increment(n, callback) {
  const result = n + 1;
  callback(result);
  return result;
}
```

Return another function:

```javascript
function toPower(exponent) {
  return function(n) {
    return n ** exponent;
  };
}
```

A function that receives or returns another function (or many of them) is called a **higher-order function**. `increment` and `toPower` are higher-order functions.

## Closures

A closure is what you use to deal with in this classic of JavaScript job-interviews:

```javascript
const fns = [];

for (var i = 0; i < 3; i++) {
  const fn = function() {
    console.log(i);
  };
  fns.push(fn);
}

fns.forEach(fn => fn()); // 3 3 3... WTF?!
```

```javascript
const fns = [];

function createClosure(v) {
  return function closure() {
    console.log(v);
  };
}

for (var i = 0; i < 3; i++) {
  const fn = createClosure(i);
  fns.push(fn);
}

fns.forEach(fn => fn()); // 0 1 2
```

When `createClosure` is invoked with `i`, a new scope is created and `v` is given the value of `i`. Then this scope is used by `closure`, and while the value of `i` changes, the values of `v` does not.

Nota bene: in this very case, you could simply replace `var` by `let`, but that's another story (`let` is blocked-scoped, while `var` is only function-scoped).

More generally, considering an "inner" function returned by an "outer" function, **a closure is an inner function with the scope of an outer function**.

This is the simplest example of a closure:

```javascript
function outer() {
  const meaningOfLife = 42;
  return function inner() {
    return meaningOfLife;
  };
}

const inner = outer();
inner(); // 42
```

But... Wait. Why are we speaking of closures in the first place? Simply because closures are an alternative to objects.

Let's take an example and build a counter. You could do it this way:

```javascript
class Counter {
  constructor() {
    this.count = 0;
  }
  increment() {
    return ++this.count;
  }
}

const counter = new Counter();
counter.increment(); // 1
counter.increment(); // 2
```

or that other way:

```javascript
function makeCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
```

The latter way is usefull in our situation, where we prefer working with functions. Later, we'll see that closures are usefull for [partial application](#partial-application).

## Pure Functions

Pure functions are a programmer's best friend, because they are super easy to test. Given its inputs, a pure function always returns the same result, whatever the state of the world. In particular, there is **no** context. Furthermore, they do not change the state of the world either. For the programmer, this drastically lowers the cognitive load: a function does precisely what its name pretends it does.

### Side causes

Below are listed a few side causes, which must be avoided in order to write pure functions. A **side cause** is the fact that a function's behavior depends on the state of the world:

#### Context / State

Don't:

```javascript
let step;
function increment(value) {
  return value + step;
}

step = 1;
increment(0); // 1

step = 2;
increment(0); // 2
```

Do:

```javascript
function increment(step, value) {
  return value + step;
}

increment(1, 0); // 1
increment(2, 0); // 2
```

Why:

The naming (`increment`) doesn't let you know that the result depends of the "state of the world", that is the value of `step`. As a consequence, it may be surprising that `increment(0);` returns `1` the first time and `2` the second time. You would normally expect that, given the same arguments, it always returns the same result, no matter the context of execution.

#### Randomness

Don't:

```javascript
function generateZeroOrOne() {
  return Math.random() > 0.5 ? 1 : 0;
}
generateZeroOrOne();
```

Do:

```javascript
function generateZeroOrOne(generator) {
  return generator() > 0.5 ? 1 : 0;
}
generateZeroOrOne(Math.random);
```

Why:

How would you test `generateZeroOrOne`? Well, it's difficult since its output is _either_ `0` or `1`. [Property-based testing](https://jsverify.github.io/) could be a solution, indeed, but you'll probably want to test more accurately the following cases:

- If `Math.random()` returns `0.35`, `generateZeroOrOne` returns `0` (for instance);
- If `Math.random()` returns `0.6`, `generateZeroOrOne` returns `1` (for instance);
- If `Math.random()` returns `0.5`, `generateZeroOrOne` returns `0`, not `1` (edge case).

By the way, providing a random number `generator` as argument allows for a better separation of concerns: `generateZeroOrOne` is only responsible for rounding to `0` or `1`. Generating a random number is another concern, which could involve another probability distribution.

#### Time

Don't:

```javascript
async function doubleWinnersSavings(player1Savings, player2Savings) {
  const savings = await Promise.race([player1Savings, player2Savings]);
  return savings * 2; // Randomly 40000 or 60000
}

const player1Savings = new Promise(function(resolve, _reject) {
  setTimeout(resolve, Math.random() * 1000, 20000);
});

const player2Savings = new Promise(function(resolve, _reject) {
  setTimeout(resolve, Math.random() * 1000, 30000);
});

doubleWinnersSavings(player1Savings, player2Savings).then(console.log);
```

Do:

```javascript
function doubleWinnersSavings(savings) {
  return savings * 2; // Always 40000 or always 60000, depending on the input
}

const player1Savings = new Promise(function(resolve, _reject) {
  setTimeout(resolve, Math.random() * 1000, 20000);
});

const player2Savings = new Promise(function(resolve, _reject) {
  setTimeout(resolve, Math.random() * 1000, 30000);
});

Promise.race([player1Savings, player2Savings])
  .then(doubleWinnersSavings)
  .then(console.log);
```

Why: in the first version, `doubleWinnersSavings`'s result is not predictable, in addition of having more than one responsibility. For its result to be predictable, `doubleWinnersSavings` should not depend of time, that is not being in charge of declaring who the winner is (`Promise.race()`).

### Side effects

Now we come to side effects, which must also be avoided in order to write pure functions. A **side effect** is the fact that a function changes the state of the world:

Don't:

```javascript
let wealth = 0;
function capitalize(amount) {
  wealth += amount;
}
capitalize(1000);
```

Do:

```javascript
function capitalize(wealth, amount) {
  return wealth + amount;
}
let wealth = 0;
wealth += capitalize(wealth, 1000);
```

Why:

Side effects create cognitive load: when the reader reads `capitalize(1000);`, that is a function invocation without an assignement, they must read the function's implementation to understand what really happens. Then they discover that the `wealth` variable is updated. Too bad, isn't it?

For the same reason, a function should _never_ modify an object provided as an argument:

Don't:

```javascript
function increment(state) {
  state.count += 1;
}
const state = { count: 0 };
increment(state);
state.count; // 1
```

Do:

```javascript
function increment(state) {
  return {
    ...state,
    count: state.count + 1
  };
}
const state = { count: 0 };
const updatedState = increment(state);
state.count; // 0
updatedState.count; // 1
```

There are various possible side effects: `XHR`s, `console.log`s, you name it. Performing side effects should be the responsibility of the caller for the callee to be a pure function:

Don't:

```javascript
function add(a, b) {
  const result = a + b;
  console.log(result);
  return result;
}
```

Do:

```javascript
function add(a, b) {
  return a + b;
}
console.log(add(1, 1));
```

Or (same as previously, but in a reusable way):

```javascript
function withLogging(fn) {
  return function(...args) {
    const result = fn(...args);
    console.log(result);
    return result;
  };
}

function add(a, b) {
  return a + b;
}

const addAndLog = withLogging(add);
addAndLog(1, 1);
```

### Idempotence

A function having side effects is said to be idempotent if calling it twice (`f(x); f(x);`) results in the same state of the world as calling it once (`f(x)`).

Let us consider the following example:

Here, `capitalize` has a side effect and is not idempotent.

```javascript
let wealth = 0;
function capitalize(amount) {
  wealth += amount;
}
capitalize(1000);
wealth; // 1000
capitalize(1000);
wealth; // 2000
```

Now, `capitalize` still has a side effect but it has become idempotent.

```javascript
let wealth = 0;
function capitalize(amount) {
  wealth = amount;
}
capitalize(1000);
wealth; // 1000
capitalize(1000);
wealth; // 1000
```

A pure function is a function without side cause nor side effect. Idempotence is not pureness, for the reason expressed above, still, idempotence is generally considered as a good approximation of a function pureness.

### Referencial transparency

"Referential transparency is the assertion that a function call could be replaced by its output value, and the overall program behavior wouldn't change. In other words, it would be impossible to tell from the program's execution whether the function call was made or its return value was inlined in place of the function call." (in [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS/blob/master/manuscript/ch5.md/#there-or-not)).

Example of a non-referencially transparent function:

```javascript
let wealth = 0;
function capitalize(amount) {
  wealth += amount;
  return wealth;
}
```

```javascript
capitalize(1000);
wealth; // 1000
```

```javascript
1000;
wealth; // 0
```

Example of a referencially transparent function:

```javascript
function capitalize(wealth, amount) {
  return wealth + amount;
}
```

```javascript
const wealth = 0;
const updatedWealth = capitalize(wealth, 1000);
wealth; // 0
updatedWealth; // 1000
```

```javascript
const wealth = 0;
const updatedWealth = 1000;
wealth; // 0
updatedWealth; // 1000
```

Referencial transparency is equivalent to pureness.

### Let's sum up

The two definitions of a pure function are equivalent:

- A function that has no side causes nor side effects;
- A function that is referencially transparent.

Functional programmers value pure functions because they are predictable and can be treated in isolation. When integrating a pure function into a larger system, its behavior won't change, nor will the behavior of the system. Eric Elliott stated: "Pure functions describe structural relationships between data, not instructions for the computer to follow, so two different sets of conflicting instructions running at the same time can’t step on each other’s toes and cause problems" ([Composing Software: The Book](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc)).

For the same reasons, pure functions allow memoization and distribution (map-reduce algorithms).

## The case for immutability

We've studied various side effects and it has become clear that a function should not modify its arguments nor its enclosing context. As a consequence, we value immutability.

But how do we ensure immutability?

### `const`

There's almost no reason why you would declare variables using `let` or `var`: most expressions that involve a mutation could be written in an immutable way, even in the following case:

```javascript
function fizzbuzz(n) {
  let result = "";
  if (n % 3 === 0) {
    result += "Fizz";
  }
  if (n % 5 === 0) {
    result += "Buzz";
  }
  return result;
}
fizzbuzz(6); // "Fizz"
fizzbuzz(10); // "Buzz"
fizzbuzz(15); // "FizzBuzz"
```

This function could be refactored as follows:

```javascript
function appendFizzIfMultipleOf3(n, result) {
  if (n % 3 === 0) {
    return result + "Fizz";
  }
  return result;
}

function appendFizzIfMultipleOf5(n, result) {
  if (n % 5 === 0) {
    return result + "Buzz";
  }
  return result;
}

function fizzbuzz(n) {
  const result = "";
  const resultWithModulo3Part = appendFizzIfMultipleOf3(n, result);
  const resultWithModulo5Part = appendFizzIfMultipleOf5(n, resultWithModulo3Part);
  return resultWithModulo5Part;
}

fizzbuzz(6); // "Fizz"
fizzbuzz(10); // "Buzz"
fizzbuzz(15); // "FizzBuzz"
```

This, of course, is a contrived example, whose sole purpose is to show you that the benefits of using `const`. `const` allows a clear control of the moment the mutation happens. Later, we'll talk about hexagonal architecture as a "functional core in an imperative shell".

Of course, we cannot satisfy ourselves with this code, and we would refactor it with concepts that we'll cover later in this document (don't pay too much attention to this):

```javascript
function appendIfMultipleOf(multiple: number, stringToAppend: string, n: number) {
  return function(currentString: string): string {
    if (n % multiple === 0) {
      return currentString + stringToAppend;
    }
    return currentString;
  };
}

export function fizzbuzz(n: number) {
  const appendFizzIfMultipleOf3 = appendIfMultipleOf(3, "Fizz", n);
  const appendBuzzIfMultipleOf5 = appendIfMultipleOf(5, "Buzz", n);
  return appendBuzzIfMultipleOf5(appendFizzIfMultipleOf3(""));
}

fizzbuzz(6); // "Fizz"
fizzbuzz(10); // "Buzz"
fizzbuzz(15); // "FizzBuzz"
```

Nota bene: `const` guarantees immutability on primitives (boolean, number, string etc.) but not on objects: JavaScript doesn't enforce immutability, as opposed to some other languages.

So, how shall we proceed?

### By hand, spreading objects

Write immutable code by hand is the fastest way. For that, one needs to copy objects, using the spread operator `...`. This is a common practice in React and Redux. In the later, reducers are pure functions:

```javascript
function updateLocationReducer(state, location) {
  return {
    ...state,
    location
  };
}

const me = {
  name: {
    firstName: "Mathieu",
    lastName: "Eveillard"
  },
  location: "Paris"
};

const updatedMe = updateLocationReducer(me, "Berlin");
```

However, this approach doesn't scale well:

- It's error prone: sooner or later, mutations will happen (`state.location = "Paris"`);
- It's tedious: you must do it each time;
- It's even more tedious with deeply nested objects, as in:

```javascript
function updateNickNameReducer(state, nickName) {
  return {
    ...state,
    name: {
      ...state.name,
      nickName
    }
  };
}

const me = {
  name: {
    firstName: "Mathieu",
    lastName: "Eveillard",
    nickName: "Mat"
  },
  location: "Paris"
};

const updatedMe = updateNickNameReducer(me, "Math");
```

### Using third-part libraries

#### Immutable JS

```javascript
import { Map } from "immutable";
const map1 = Map({ a: 1, b: 2, c: 3 });
const map2 = map1.set("b", 50);
map1.b; // 2
map2.b; // 50
```

The functional core of the application you're building will use immutable types, but the external world will not. As a consequence, you'll need adapters to convert from and to regular types:

```javascript
const map = Map({ a: 1, b: 2, c: 3 });
map.toObject();
```

In addition to immutability, those non-native objects offer a [rich API](https://immutable-js.github.io/immutable-js/docs/#/Map) and lots of functionalities that you would usually write by yourself or for which you would require another third-part library like Lodash.

#### Immer JS

As opposed to ImmutableJS, Immer doesn't bring its own types: it's plain JavaScript. Immutability is ensured by the use of a `produce` function. This function creates a `draft`, a proxy of the object you're willing to update. You make imperative updates to the `draft` through a `draft -> void` function. Finally, you pass the current object and the update function to Immer's `produce` function, which is in charge of creating a new object without modifying the original one.

Under the hood, Immer relies on structural sharing. In other words, it refers to the previous state for the unmodified parts, as in a chain of prototypes (code crafted by [Michel Weststrate](https://gist.github.com/mweststrate/7d6c6fe7748486bf137839b7db876402#file-producer-js)):

```javascript
import produce from "immer";

const todos = [
  /* 2 todo objects in here */
];

const nextTodos = produce(todos, draft => {
  draft.push({ text: "learn immer", done: true });
  draft[1].done = true;
});

// old state is unmodified
todos.length; // 2
todos[1].done; // false

// new state reflects the draft
nextTodos.length; // 3
nextTodos[1].done; // true

// structural sharing
todos === nextTodos; // false
todos[0] === nextTodos[0]; // true
todos[1] === nextTodos[1]; // false
```

### The impact on memory usage

Indeed, immutability has a negative impact on memory usage, because it ends up in creating more objects (especially when working with arrays, as we'll see right after).

However, one should always keep in mind the old programming adage: "make it work, then make it better, then make it fast". This quote reminds us to seek for optimization only if there are good reasons to do so. In most cases, the benefits of immutability (less bugs) overcome the drawbacks (memory consumption).

Furthermore, functional programming has it own tools to cope with this: see [transducers](https://medium.com/javascript-scene/transducers-efficient-data-processing-pipelines-in-javascript-7985330fe73d).

## Working with arrays

There are 3 fundamentals in working with arrays in JavaScript: `map`, `filter` and `reduce`. [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) makes a great job describing how they work, so bellow is only a quick recap:

### `reduce`

```javascript
[0, 1, 2, 3, 4].reduce((accumulator, n) => accumulator + n, 0); // 10
```

The function provided as an argument to `reduce` is called a **reducer**. Its signature is `(accumulator, current) -> accumulator`.

### `map`

```javascript
[0, 1, 2, 3, 4].map(n => n + 1); // [1, 2, 3, 4, 5]
```

### `filter`

```javascript
[0, 1, 2, 3, 4].filter(n => n % 2 === 0); // [0, 2, 4]
```

### Under the hood

Under the hood, `map` and `filter` rely on `reduce`, as suggested by the alternative implementations bellow:

```javascript
function map(fn) {
  return function(accumulator, n) {
    return [...accumulator, fn(n)];
  };
}

[0, 1, 2, 3, 4].reduce(
  map(n => n + 1),
  []
); // [1, 2, 3, 4, 5]
```

```javascript
function filter(fn) {
  return function(accumulator, n) {
    if (fn(n)) {
      return [...accumulator, n];
    }
    return accumulator;
  };
}

[0, 1, 2, 3, 4].reduce(
  filter(n => n % 2 === 0),
  []
); // [0, 2, 4]
```

### `map` vs. `forEach`

You should not produce side effects using `map`, since it is intended to consume pure functions. Using `map` would work, indeed, but you're fooling the reader. If you need to produce side effects, please use `forEach`:

Don't:

```javascript
[0, 1, 2, 3, 4].map(n => console.log(n));
```

Do:

```javascript
[0, 1, 2, 3, 4].forEach(n => console.log(n));
```

Now we can leverage what we've learned on functions being first-class citizens and pure functions for the purpose of composing functions.

## Composing functions

### Chaining Functions

```javascript
function square(n) {
  return n ** 2;
}

function negate(n) {
  return -n;
}

function increment(n) {
  return n + 1;
}

function f(n) {
  return increment(negate(square(n)));
}

f(3); // -8
```

Well, good but we seek for an even more legible version. Let's introduce a `pipe` function for composition purpose:

```javascript
function pipe(...fns) {
  return function(n) {
    return fns.reduce((accumulator, fn) => fn(accumulator), n);
  };
}

const f = pipe(square, negate, increment);

f(3); // -8
```

The newly introduced function `pipe` is a basic tool of an FP programmer's toolbox. As such, it is implemented by all libraries, and you might want to use [Ramda](https://ramdajs.com/docs/#pipe):

```javascript
import * as R from "ramda";

const f = R.pipe(square, negate, increment);

f(3); // -8
```

With arrays, composition is completely natural thanks to `map`, `filter` and `reduce`:

```javascript
function increment(n) {
  return n + 1;
}

function isMultipleOf3(n) {
  return n % 3 === 0;
}

function sum(accumulator, n) {
  return accumulator + n;
}

[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(increment)
  .filter(isMultipleOf3)
  .reduce(sum); // 18
```

All that seems pretty straightforward, right? But now imagine that you need a more generic version of `isMultipleOf3`:

```javascript
function isMultipleOf(modulo, n) {
  return n % modulo === 0;
}
```

There, you have no choice but writing:

```javascript
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(increment)
  .filter(n => isMultipleOf(3, n))
  .reduce(sum); // 18
```

Hmmm... Not so good!

Well, here _you_ have defined `isMultipleOf`, so you're free to refactor it as needed:

```javascript
function isMultipleOf(modulo) {
  return function(n) {
    return n % modulo === 0;
  };
}
```

Now you can write:

```javascript
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(increment)
  .filter(isMultipleOf(3))
  .reduce(sum); // 18
```

But what if `isMultipleOf` comes from a third-part library, and you can't change it? Partial application to the rescue!

### Partial application

```javascript
function partial(fn, firstArgument) {
  return function(...args) {
    return fn(firstArgument, ...args);
  };
}

function isMultipleOf(modulo, n) {
  return n % modulo === 0;
}

const isMultipleOf3 = partial(isMultipleOf, 3);

isMultipleOf3(9); // true
```

`partial` returns a closure, that is an inner function with `firstArgument` in its scope. As a consequence, `firstArgument` doesn't need to be provided anymore, that's the whole point.

`partial` is a function that sets the first argument. It's called **partial-left application**, as opposed to **partial-right application** for a function that would set the last argument.

Partial application is also one of the fundamentals of functional programming.

### Currying

Currying is simply the successive partial applications on a function that accepts `n` arguments (arity: `n`) up to a function that accepts `1` single argument (arity: `1`), e.g.:

```javascript
import * as R from "ramda";

function readThreeDimensionalMatrix(matrix, x, y, z) {
  return matrix[x][y][z];
}

const curriedReadThreeDimensionalMatrix = R.curry(readThreeDimensionalMatrix);

const matrix = [
  [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ],
  [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ],
  [
    [0, 42, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]
];

curriedReadThreeDimensionalMatrix(matrix)(2)(0)(1); // 42
```

This is a convenience approach: it spares you writing successive partial applications, nothing more. However, from my personal experience, I almost never curry functions, because arities over 3 remain rare.

What would be really usefull is auto-currying, as in most _real_ functional languages. With auto-currying, defining a function `f` as `(x, y) -> z` is the same thing as defining `f` as `x -> y -> z`. Hence you can invoke `f` with 1 argument and it returns a function `y -> z`, or with 2 arguments and it returns `z`.

Bellow is an example in F#:

```fsharp
let toPower p n =
  n ** p;

let toPower3 = toPower 3.f;

printfn "%f" (toPower3 2.f); // 8.000000
```

### Order matters

The important point with partial application and currying is the order of arguments: you'll want your function to start with the most "stable" ones in the perspective of successive partial applications "freezing" these arguments one after the other. Consider the `toPower` function, again:

```javascript
function toPower(exponent, n) {
  return n ** exponent;
}
```

Assume you want to compute `2^2`, `3^2`, `4^2`, etc. In this specific use case, `exponent` (`2`, `2`, `2`) is more stable than `n` (`2`, `3`, `4`). A partial application will give you what you want:

```javascript
import * as R from "ramda";
const toPower2 = R.partial(toPower, 2);
```

But what if you want to compute `2^2`, `2^3`, `2^4` instead? In this other use case, `n` (`2`, `2`, `2`) is more stable than `exponent` (`2`, `3`, `4`). Here, it would be more suited to define `toPower` as follows:

```javascript
function toPower(n, exponent) {
  return n ** exponent;
}
```

...allowing you to make a regular partial-left application, instead of a partial-right one (which still remains a valid option):

```javascript
import * as R from "ramda";
const twoToPower = R.partial(toPower, 2);
```

The point here is that you should try and define functions providing first the more stable arguments. This allows you to stay consistent with mainly partial-left applications, and sometimes only partial-right ones.

## Why functional programming?

Programming in an object-oriented or a functional style is a matter of choice. However, functional programming allows a developer to work with very simple and predictable functions (pure functions). They do exactly what we expect them to do and are super easy to test. Hence they lower the developer's cognitive load, leading ultimately to less bugs. That's the very point of functional programming: it allows one the write code with less bugs.

This was only an introduction to functional programming in JavaScript. Its aim was to stress on the benefits of the paradigm. Take time to practice before learning more complicated things like Transducers, Functors and Monads.

## Further readings

- [Functional-Light JavaScript](https://github.com/getify/Functional-Light-JS/tree/master/manuscript)
- [Composing Software: The Book](https://medium.com/javascript-scene/composing-software-the-book-f31c77fc3ddc)
- [F# for fun and profit](https://fsharpforfunandprofit.com/)
