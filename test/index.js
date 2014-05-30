var expect = require('chai').expect;
var compile = require('..').compile;
var vm = require('vm');

describe('ES6ForOf', function() {
  function transform(code) {
    return compile(code).code;
  }

  function expectTransform(code, result) {
    expect(transform(code)).to.eql(result);
  }

  it('should fix for-of statement', function() {
    var code = [
      'for (var b of a) {',
      '  for (c of b) d.push(c);',
      '}'
    ].join('\n');

    var result = [
      'var $__getIterator = function(iterable) {',
      '  var sym = typeof Symbol === "function" && Symbol.iterator || "@@iterator";',
      '',
      '  if (typeof iterable[sym] === "function") {',
      '    return iterable[sym]();',
      '  } else if (Object.prototype.toString.call(iterable) === "[object Array]") {',
      '    return $__arrayIterator(iterable);',
      '  } else {',
      '    throw new TypeError();',
      '  }',
      '};',
      '',
      'var $__arrayIterator = function(array) {',
      '  var index = 0;',
      '',
      '  return {',
      '    next: function() {',
      '      if (index >= array.length) {',
      '        return {',
      '          done: true,',
      '          value: void 0',
      '        };',
      '      } else {',
      '        return {',
      '          done: false,',
      '          value: array[index++]',
      '        };',
      '      }',
      '    }',
      '  };',
      '};',
      '',
      'for (var $__0 = $__getIterator(a), $__1; !($__1 = $__0.next()).done; ) {',
      '  var b = $__1.value;',
      '',
      '  for (var $__2 = $__getIterator(b), $__3; !($__3 = $__2.next()).done; ) {',
      '    c = $__3.value;',
      '    d.push(c);',
      '  }',
      '}'
    ].join('\n');

    expectTransform(code, result);

    var globalIndex = 1;

    var oneTwoThree = {
      "@@iterator": function() {
        var index = 0;

        return {
          next: function() {
            if (index >= 3) {
              return {done: true, value: void 0};
            } else {
              index++;
              return {done: false, value: globalIndex++};
            }
          }
        };
      }
    };

    var a = {
      "@@iterator": function() {
        var index = 0;

        return {
          next: function() {
            if (index >= 2) {
              return {done: true, value: void 0};
            } else {
              index++;
              return {done: false, value: oneTwoThree};
            }
          }
        };
      }
    };

    var d = [];
    vm.runInNewContext(result, { a: a, d: d, c: null });
    expect(d).to.eql([1, 2, 3, 4, 5, 6]);
  });
});
