# Supported language

Microvium compiles a subset of ECMAScript. It is not an ECMAScript-conforming
implementation. The compiler parses source with Babel, then rejects syntax it
does not lower. Successful parsing alone does not mean a feature is supported.
See the [ECMAScript specification](https://tc39.es/ecma262/) for the full
language and the [end-to-end tests](../test/end-to-end/tests) for executable
examples of Microvium behavior.

## Supported syntax

- Declarations: `var`, `let`, `const`, function declarations, and class
  declarations. Variable names and function parameters must use simple
  identifiers; destructuring, rest parameters, and default parameters are not
  supported.
- Functions: anonymous function expressions, arrow functions, nested
  functions, and closures. Async functions and `await` inside an async function
  are supported. Named function expressions, generators, and top-level `await`
  are rejected.
- Control flow: blocks, `if`/`else`, `while`, `do`/`while`, and `for` loops.
  Any `for` initializer, test, or update clause may be omitted. `switch` uses
  strict equality for case matching and supports fallthrough. Unlabelled
  `break`, `return`, and `throw` are supported.
- Exceptions: `try`/`catch`, including `catch` without a binding. `finally` is
  not supported.
- Modules: static named, default, namespace, and side-effect imports; direct
  exports of variable, function, and class declarations. The host resolves
  imported modules while compiling. Named host imports and exports use the
  separate [named FFI interface](../docs/named-ffi.md).
- Values and expressions: booleans, numbers, strings, `null`, `undefined`,
  arrays (including elisions), plain object literals, computed and ordinary
  property access, calls, `new`, `this`, conditional expressions, `&&`, `||`,
  and untagged template literals.
- Operators: arithmetic, bitwise and shift operators, strict equality,
  relational comparisons, unary `+`, `-`, `!`, `~`, `typeof`, and prefix or
  postfix `++`/`--`. Numeric conversion and arithmetic details are described
  in [Numeric types](./numeric-types.md).
- Limited class declarations: constructors, methods, and instance or static
  fields with simple, non-computed names. The implementation does not support
  inheritance.

## Restrictions

- Object literal properties must have simple identifier keys. Object methods,
  computed keys, and spread properties are unsupported. Shorthand properties
  such as `{ value }` are supported.
- Array and call spread are unsupported. Arrays can contain holes; iteration
  syntax is not implemented.
- Class expressions, `extends`, `super`, computed class names, private class
  names, decorators, getters, setters, async methods, and generator methods are
  unsupported.
- Only unlabelled `break` is supported. `continue`, labels, `for...in`, and
  `for...of` are unsupported.
- Export lists, re-exports, and default exports are unsupported. Dynamic
  `import()` and CommonJS `require` are unsupported.
- `==`, `!=`, `in`, `instanceof`, `??`, `void`, and `delete` are unsupported.
  Optional chaining (`?.`) and the `with` statement are unsupported.
  Increment and decrement targets are limited to variables and non-computed
  property chains rooted in a variable or `this`; `obj[key]++` and targets
  rooted in a computed expression are unsupported.
- `arguments`, `eval`, regular expressions, BigInt literals, symbols,
  `WeakMap`, destructuring, and tagged template literals are unsupported.
- Relational operators coerce non-number operands to numbers. In particular,
  string-to-string comparisons do not use ECMAScript's lexicographic ordering.
- The built-in library is small. See [Supported builtins](./supported-builtins.md)
  for the provided globals and methods; standard JavaScript builtins not listed
  there are not implied to exist.

These lists describe the current compiler surface, not a promise of future
ECMAScript compatibility. Microvium also has a deliberate numeric-flavor
extension: `iN`, `uN`, `f32`, and `f64` values remain JavaScript `number` values
but use Microvium-specific arithmetic and conversion rules. See
[Numeric types](./numeric-types.md).
