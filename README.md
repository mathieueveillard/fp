# Functional Programming

An introduction to functional programming in JavaScript.

- [Why functional programming?](#why-functional-programming)
- [A shift of paradigm](#a-shift-of-paradigm)
- [Functions are first-class citizens](#functions-are-first-class-citizens)
- [Closures](#closures)
- [Pure Functions](#pure-functions)
- [The case for immutability](#the-case-for-immutability)
- [Working with arrays](#working-with-arrays)
- [Composing functions](#composing-functions)

## Why functional programming?

## A shift of paradigm

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

class Item {
  constructor(private reference: Reference, private quantity: number) {}

  public computeTotalPrice(): number {
    return this.reference.getPrice() * this.quantity;
  }
}

export class Invoice {
  private items: Item[] = [];

  public addReference(reference: Reference, quantity: number): void {
    this.items.push(new Item(reference, quantity));
  }

  public computeTotalPrice(): number {
    let totalPrice: number = 0;
    this.items.forEach(item => {
      totalPrice += item.computeTotalPrice();
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
invoice.computeTotalPrice(); // 130
```

### Functional Programming

```typescript
interface Reference {
  id: string;
  price: number;
}

interface Item {
  reference: Reference;
  quantity: number;
}

export interface Invoice {
  items: Item[];
}

function computeItemPrice({ reference: { price }, quantity }: Item): number {
  return price * quantity;
}

function sum(a: number, b: number): number {
  return a + b;
}

export function computeTotalPrice({ items }: Invoice): number {
  return items.map(computeItemPrice).reduce(sum, 0);
}
```

```typescript
const invoice: Invoice = {
  items: [
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
computeTotalPrice(invoice); // 130
```

## Functions are first-class citizens

...meaning that one can do everything with functions that they do with language primitives and objects:

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

Higher-order functions: a higher-order function is a function that receives or returns one or more other functions. `increment` and `toPower` are higher-order functions.

## Closures

You know, closures? A closure is what you use to deal with this classic of JavaScript job-interviews (or you could simply replace `var` by `let`, but that's another story):

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

Explanation: `createClosure` is a function. Each time it is invoked with `i`, a new scope is created and `v` is given the value of `i`. The function it returns, `closure`, has access to `v` and hence returns the value of `i` at the time it was created.

More generally, we should consider an "inner" function returned by an "outer" function: a closure is the fact that the inner function has access to the scope of the outer function.

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

Let's take an example and build a counter. You could do it that way:

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

### Side causes

#### Context

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

The naming (`increment`) doesn't let you know that the result depends of the "state of the world", that is to say the context of execution. As a consequence, it may be surprising that `increment(0);` returns `1` the first time and `2` the second time. You would normally expect that, given the same arguments, it returns the same result.

#### Randomness

Don't:

```javascript
function generateZeroOrOne() {
  return Math.random() < 0.5 ? 0 : 1;
}
generateZeroOrOne();
```

Do:

```javascript
function generateZeroOrOne(generator) {
  return generator() < 0.5 ? 0 : 1;
}
generateZeroOrOne(Math.random);
```

Why:

How would you test `generateZeroOrOne`? Well, it's difficult since its output is _either_ `0` or `1`. [Property-based testing](https://jsverify.github.io/) could be a solution, indeed, but you'll probably want to test more accurately the following cases:

- If `Math.random()` returns `0.35`, `generateZeroOrOne` returns `0` (for instance);
- If `Math.random()` returns `0.6`, `generateZeroOrOne` returns `1` (for instance);
- If `Math.random()` returns `0.5`, `generateZeroOrOne` returns `1`, not `0` (edge case).

By the way, providing a random number `generator` as argument allows for a better separation of concerns: `generateZeroOrOne` is only responsible for rounding to `0` or `1`. Generating a random number is another concern, which could involve another probability distribution.

#### Time

Don't:

```javascript
```

Do:

```javascript
```

Why:

### Side effects

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

Or:

```javascript
function add(a, b, callback) {
  const result = a + b;
  callback(result);
  return result;
}
add(1, 1, console.log);
```

Or:

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

A function `f` is said to be idempotent if whatever `x`, `f(x); f(x);` (`f` called two times on `x`) results in the same state of the world as `f(x);` (`f` called one time only on `x`).

A function without side effects is idempotent. Conversely, a function that has side effects might or might not be idempotent:

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

### Pure Functions

The two definitions of a pure function are equivalent:

- A function that has no side causes nor side effects;
- A function that is referencially transparent.

Attention: a pure function produces the same output given the same inputs, but that's not sufficient as a definition. Indeed, it doesn't prevent from side effects:

```javascript
function sum(a, b) {
  console.log("Side effect");
  return a + b;
}
```

Functional programmers value pure functions because they are predictable and can be treated in isolation. When integrating a pure function in a larger system, its behavior won't change, nor will the behavior of the system.

## The case for immutability

We've studied various [side effects](#side-effects) and it has become clear that a function should not modify its arguments nor its enclosing context. As a consequence, we value immutability.

But how do you ensure immutability?

### const

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

This, of course, is a contrived example, which is only there to show you that the benefit of using `const` is to gain a clear control of the moment the mutation happens. Later, we'll talk about hexagonal architecture as a "functional core in an imperative shell".

Of course, we cannot satisfy ourselves with this code, and we would refactor it with concepts that we'll cover later in this document (don't pay too much attention to this):

```javascript
import * as R from "ramda";

const append = R.curry(function(multipleOf, stringToAppend, n, currentString) {
  if (n % multipleOf === 0) {
    return currentString + stringToAppend;
  }
  return currentString;
});

export function fizzbuzz(n) {
  return R.pipe(append(3)("Fizz")(n), append(5)("Buzz")(n))("");
}

fizzbuzz(6); // "Fizz"
fizzbuzz(10); // "Buzz"
fizzbuzz(15); // "FizzBuzz"
```

`const` guarantees immutability on primitives (boolean, number, string etc.) but not on objects: JavaScript doesn't enforce immutability, as opposed to other languages.

```javascript
const fraction = {
  numerator: 5,
  denominator: 3
};

function substract(fraction, { numerator, denominator }) {
  // fake implementation
  fraction.numerator = fraction.numerator - numerator;
}

substract(fraction, { numerator: 1, denominator: 3 });
fraction; // { numerator: 4, denominator: 3 }
```

So, how to proceed?

### By hand, spreading objects

Write immutable code by hand is the fastest way, using the spread operator `...`:

```javascript
const fraction = {
  numerator: 5,
  denominator: 3
};

function substract(fraction, { numerator, denominator }) {
  // fake implementation
  return {
    ...fraction,
    numerator: fraction.numerator - numerator
  };
}

substract(fraction, { numerator: 1, denominator: 3 });
fraction; // { numerator: 5, denominator: 3 }
```

However, this approach doesn't scale well:

- It's error prone: sooner or later, mutations will happen;
- It's tedious: you must do it each time;
- It's even more tedious with deeply nested objects.

Indeed, consider the following example of a purchase invoice. As the client orders 10 units of the first reference, you would like to apply a discount on the unit price, turning 50 into 45:

```javascript
const invoice = {
  items: [
    {
      reference: {
        id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
        price: 50
      },
      quantity: 10
    },
    {
      reference: {
        id: "5f8e5092-22fe-4e4f-897f-2948e3b4d507",
        price: 30
      },
      quantity: 1
    }
  ],
  clientId: "ec68e60e-1f55-4f28-90b4-c3df125f0e14"
};

const [firstItem, ...remainingItems] = invoice.items;

const updatedInvoice = {
  ...invoice,
  items: [
    {
      ...firstItem,
      reference: {
        ...firstItem.reference,
        price: 45
      }
    },
    ...remainingItems
  ]
};
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

In addition to immutability, those non-native objects offer a [rich API](https://immutable-js.github.io/immutable-js/docs/#/Map) and lots of functionalities that you would usually write by yourself or for which you would require another third-part library like. Lodash.

#### Immer JS

As opposed to ImmutableJS, Immer doesn't bring its own types: it's plain JavaScript. Immutability is ensured by the use of a `produce` function. This function creates a `draft`, a proxy of the object you're willing to update. You make imperative updates to the `draft` through a `draft -> void` function. Finally, you pass the current object and the update function to Immer's `produce` function, which is in charge of creating a new object without modifying the original one.

Under the hood, Immer relies on structural sharing, that is to say it refers to the previous state for the unmodified parts, as in a chain of prototypes.

(from [Michel Weststrate](https://gist.github.com/mweststrate/7d6c6fe7748486bf137839b7db876402#file-producer-js))

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

It is true, immutability has a negative impact on memory usage, since it ends up in creating more objects (especially when working with arrays, as we'll see right after).

However, one should always keep in mind the old programming adage: "make it work, then make it better, then make it fast". In other words, you should seek for optimization only if there are good reasons to. Otherwise, and in most cases, the benefits of immutability (less bugs) overcome the drawbacks (memory consumption).

## Working with arrays

There are 3 fundamentals in working with arrays in JavaScript: `map`, `filter` and `reduce`. [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) makes a great job describing how they work, so bellow is only a quick recap:

### map

```javascript
[0, 1, 2, 3, 4].map(n => n + 1); // [1, 2, 3, 4, 5]
```

### filter

```javascript
[0, 1, 2, 3, 4].filter(n => n % 2 === 0); // [0, 2, 4]
```

### reduce

```javascript
[0, 1, 2, 3, 4].reduce((accumulator, n) => accumulator + n, 0); // 10
```

### map vs. forEach

You should not produce side effects using `map`, since it is intended to consume pure functions. Using `map` would work, indeed, but you're fooling the reader. If you need to produce side effects (probably, once again in the imperative shell surrouding your functional core), please use `forEach`:

Don't:

```javascript
[0, 1, 2, 3, 4].map(n => console.log(n));
```

Do:

```javascript
[0, 1, 2, 3, 4].forEach(n => console.log(n));
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

Now we can leverage what we've learned on functions being first-class citizens and pure functions for the purpose of composing functions.

## Composing functions

### Chaining Functions

Arrays:

```javascript
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(n => n + 1)
  .filter(n => n % 3 === 0)
  .reduce((accumulator, n) => accumulator + n, 0); // 18
```

Non-arrays:

```javascript
import * as R from "ramda";

const f = R.pipe(
  (n, p) => n ** p,
  n => -n,
  n => n + 1
);
f(2, 3); // -7
```

This is a good first step, but one could wish better legibility. What about:

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

Better, right?

But now, assume that `isMultipleOf3` is not what you need anymore, because `3` results of a computation. You would need to write the following:

```javascript
function isMultipleOf(modulo, n) {
  return n % modulo === 0;
}
```

There, you have no choice but writing:

```javascript
// ...
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(increment)
  .filter(n => isMultipleOf(3, n))
  .reduce(sum); // 18
```

Too bad, isn't it?

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
// ...
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  .map(increment)
  .filter(isMultipleOf(3))
  .reduce(sum); // 18
```

But what if `isMultipleOf` comes from a third-part library, and you can't change it?

### Partial application

Partial application to the rescue!

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

Partial application is one of the fundamentals of functional programming. As such, it is implemented by all libraries, and you'll probably want to use `R.partial` ([Ramda](https://ramdajs.com/docs/#partial)) or `_.partial` ([Lodash FP](https://lodash.com/docs/4.17.15#partial)) rather than writting your own implementation.

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

What would be really usefull is auto-currying, as in most functional languages. With auto-currying, defining a function `f` as `(x, y) -> z` is the same thing as defining `f` as `x -> y -> z`. Hence you can invoke `f` with 1 argument and it returns a function `y -> z`, or with 2 arguments and it returns `z`.

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

But what if you want to compute `2^2`, `2^3`, `2^4` instead? In this other use case, `n` (`2`, `2`, `2`) is more stable than `exponent` (`2`, `3`, `4`). Here, you would better define `toPower` as follows:

```javascript
function toPower(n, exponent) {
  return n ** exponent;
}
```

...allowing you to make the proper partial application:

```javascript
import * as R from "ramda";
const twoToPower = R.partial(toPower, 2);
```

In the case you didn't define `toPower` by yourself but you still must "freeze" `n`, you could make a partial-right application:

```javascript
function partial(fn, lastArgument) {
  return function(...args) {
    return fn(...args, lastArgument);
  };
}
```
