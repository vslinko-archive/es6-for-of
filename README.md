# es6-for-of

Compiles JavaScript written using ES6 for-of to ES4 syntax.
For example, this:

```js
for (var a of b) {
  console.log(a);
}
```

compiles to this:

```js
(function() {
  var __iterator__ = b;

  for (var __key__ = 0; __key__ < __iterator__.length; __key__++) {
    var a = __iterator__[__key__];
    console.log(a);
  }
})();
```

## Install

```
$ npm install es6-for-of
```

## Browserify

Browserify support is built in.

```
$ npm install es6-for-of  # install local dependency
$ browserify -t es6-for-of $file
```

### Setup

First, install the development dependencies:

```
$ npm install
```

Then, try running the tests:

```
$ npm test
```
