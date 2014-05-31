var esprima = require('esprima');
var recast = require('recast');
var util = require('ast-util');
var through = require('through');
var b = recast.types.builders;
var n = recast.types.namedTypes;

function visitNode(node) {
  if (n.ForOfStatement.check(node)) {
    visitForOfStatement.call(this, node);
  }
}

function visitForOfStatement(node) {
  var iterator = util.uniqueIdentifier(this.scope);
  var item = util.uniqueIdentifier(this.scope);
  var body;

  if (n.BlockStatement.check(node.body)) {
    body = node.body;
  } else {
    body = b.blockStatement([
      node.body
    ]);
  }

  if (n.VariableDeclaration.check(node.left)) {
    body.body.unshift(b.variableDeclaration(
      node.left.kind,
      [b.variableDeclarator(
        node.left.declarations[0].id,
        b.memberExpression(
          item,
          b.identifier('value'),
          false
        )
      )]
    ));
  } else {
    body.body.unshift(b.expressionStatement(
      b.assignmentExpression(
        '=',
        node.left,
        b.memberExpression(
          item,
          b.identifier('value'),
          false
        )
      )
    ));
  }

  this.replace(b.forStatement(
    b.variableDeclaration(
      'var',
      [
        b.variableDeclarator(
          iterator,
          util.callGetIterator(
            this.scope.getGlobalScope(),
            node.right
          )
        ),
        b.variableDeclarator(
          item,
          null
        )
      ]
    ),
    b.unaryExpression(
      '!',
      b.memberExpression(
        b.assignmentExpression(
          '=',
          item,
          b.callExpression(
            b.memberExpression(
              iterator,
              b.identifier('next'),
              false
            ),
            []
          )
        ),
        b.identifier('done'),
        false
      ),
      true
    ),
    null,
    body
  ));
}

function transform(ast) {
  recast.types.traverse(ast, visitNode);
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
