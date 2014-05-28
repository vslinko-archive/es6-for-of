# es6-for-of

Compiles JavaScript written using ES6 for-of to ES3 syntax.
For example, this:

```js
for (var a of b) {
  console.log(a);
}
```

compiles to this:

```js
var $__getIterator = function(iterable) {
  var sym = (typeof Symbol === "function" ? Symbol.iterator : "@@iterator");

  if (typeof iterable[sym] === "function") {
    return iterable[sym]();
  } else if (Object.prototype.toString.call(iterable) === "[object Array]") {
    return $__arrayIterator(iterable);
  } else {
    throw new TypeError();
  }
};

var $__arrayIterator = function(array) {
  var index = 0;

  return {
    next: function() {
      if (index >= array.length) {
        return {
          done: true,
          value: void 0
        };
      } else {
        return {
          done: false,
          value: array[index++]
        };
      }
    }
  };
};

for (var $__0 = $__getIterator(b), $__1; !($__1 = $__0.next()).done; ) {
  var a = $__1.value;
  console.log(a);
}
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
