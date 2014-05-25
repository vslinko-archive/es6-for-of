var expect = require('chai').expect;
var compile = require('..').compile;

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
      '  for (var c of b) d.push(c);',
      '}'
    ].join('\n');

    var result = [
      '(function() {',
      '  var __iterator__ = a;',
      '',
      '  for (var __key__ = 0; __key__ < __iterator__.length; __key__++) {',
      '    var b = __iterator__[__key__];',
      '',
      '    (function() {',
      '      var __iterator__ = b;',
      '',
      '      for (var __key__ = 0; __key__ < __iterator__.length; __key__++) {',
      '        var c = __iterator__[__key__];',
      '        d.push(c);',
      '      }',
      '    })();',
      '  }',
      '})();'
    ].join('\n');

    expectTransform(code, result);

    var a = [[1, 2, 3], [4, 5, 6]];
    var d = [];
    eval(result);
    expect(d).to.eql([1, 2, 3, 4, 5, 6]);
  });
});
