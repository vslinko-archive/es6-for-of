var esprima = require('esprima');
var recast = require('recast');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

var ES6ForOf = recast.Visitor.extend({
  visitForOfStatement: function(expr) {
    var block;

    if (n.BlockStatement.check(expr.body)) {
      block = expr.body;
    } else {
      block = b.blockStatement([
        expr.body
      ])
    }

    block.body.unshift(b.variableDeclaration(
      'var',
      [b.variableDeclarator(
        expr.left.declarations[0].id,
        b.memberExpression(
          b.identifier('__iterator__'),
          b.identifier('__key__'),
          true
        )
      )]
    ));

    expr = b.expressionStatement(
      b.callExpression(
        b.callExpression(
          b.memberExpression(
            b.functionExpression(
              null,
              [],
              b.blockStatement([
                b.variableDeclaration(
                  'var',
                  [b.variableDeclarator(
                    b.identifier('__iterator__'),
                    expr.right
                  )]
                ),
                b.forStatement(
                  b.variableDeclaration(
                    'var',
                    [b.variableDeclarator(
                      b.identifier('__key__'),
                      b.literal(0)
                    )]
                  ),
                  b.binaryExpression(
                    '<',
                    b.identifier('__key__'),
                    b.memberExpression(
                      b.identifier('__iterator__'),
                      b.identifier('length'),
                      false
                    )
                  ),
                  b.updateExpression(
                    '++',
                    b.identifier('__key__'),
                    false
                  ),
                  block
                )
              ])
            ),
            b.identifier('bind'),
            false
          ),
          [b.thisExpression()]
        ),
        []
      )
    );

    this.genericVisit(expr);

    return expr;
  }
});

function transform(ast) {
  (new ES6ForOf()).visit(ast);
  return ast;
}

function compile(code, options) {
  options = options || {};

  var recastOptions = {
    esprima: esprima,
    sourceFileName: options.sourceFileName,
    sourceMapName: options.sourceMapName
  };

  var ast = recast.parse(code, recastOptions);
  return recast.print(transform(ast), recastOptions);
}

module.exports = function () {
  var data = '';

  function write(buf) {
    data += buf;
  }

  function end() {
    this.queue(compile(data).code);
    this.queue(null);
  }

  return through(write, end);
};

module.exports.transform = transform;
module.exports.compile = compile;
