A library for arbitrary precision decimal floating point arithmetic that can exactly represent all decimal fractions,
unlike JavaScript's number data type which is 64-bit binary floating point.

Based on the original work by Douglas Crockford: [howjavascriptworks](https://github.com/douglascrockford/howjavascriptworks).
This implementation is built upon the Google Chrome Labs' implementation of ECMAScript big integers: JSBI.

>NOTE: This is a compatibility package intended for older engines. If you are targeting a runtime that supports native bigints and the exponentiation operator(**), then you don't need JSBI and instead you should be using [bigfloat-esnext (npm)](https://www.npmjs.com/package/bigfloat-esnext) or [bigfloat (jsr)](https://jsr.io/@davidmartinez/bigfloat).

This library provides three ways to make bigfloat operations:
  - A set of functions for a functional style approach
  - A BigFloat class with an API similar to that of Decimal.js
  - An evaluate() function that parses and resolves an expression

# Basic usage
### Functional style
```typescript
const { make, string, sqrt } = require("bigfloat.js");

string(sqrt(make("2")));               // "1.41421"
```

### Class based
```typescript
const { BigFloat } = require("bigfloat.js");

new BigFloat("2").sqrt().toString();   // "1.41421"
```

### The evaluate() function
```typescript
evaluate(expression: string, precision?: number): string | boolean
```
>The first argument can be any valid arithmetic or relational expression, including scientific e-notation.
>(Optional) Precision should be a negative integer. Default is -5.
```typescript
const { evaluate } = require("bigfloat.js");

0.1 + 0.2 === 0.3;                     // false
evaluate("0.1 + 0.2 == 0.3");          // true

0.1 + 0.2;                             // 0.30000000000000004
evaluate("0.1 + 0.2");                 // "0.3"

1 + Number.EPSILON / 2;                // 1
evaluate(`1 + ${Number.EPSILON / 2}`); // "1.00000000000000011102230246251565"

evaluate("1 + 2.220446049250313e-16"); // "1.0000000000000002220446049250313"

evaluate(`4 >= ${Math.PI}`);           // true
```

Valid tokens:
  - Parenthesis: (,)
  - Number: Decimal, integer or scientific e-notation
  - Operator: Arithmetic +,-,/,%,*,** Relational =\=\=,=\=,!==,!=,<,>,<=,>=

### Change precision
```typescript
const { BigFloat } = require("bigfloat.js");

new BigFloat(2).sqrt().toString();     // "1.41421"
BigFloat.setPrecision(-10);
new BigFloat(2).sqrt().toString();     // "1.4142135623"
```
### The bigfloat object
```typescript
interface IBigFloat {
  coefficient: JSBI;
  exponent: number;
}
```
Valid bigfloat made from primitives:
```typescript
const bigfloat: IBigFloat {
  coefficient: JSBI.BigInt(522299),
  exponent: -4
};
```
### Alternative versions
>[bigfloat](https://jsr.io/@davidmartinez/bigfloat) - JSR · Node, Deno, Bun, browsers · Best for modern setups

>[bigfloat-esnext](https://www.npmjs.com/package/bigfloat-esnext) - NPM · ES modules

