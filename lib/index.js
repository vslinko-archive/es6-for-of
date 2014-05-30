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
  var arrayIterator = injectArrayIterator(this.scope.getGlobalScope());
  var getIterator = injectGetIterator(this.scope.getGlobalScope(), arrayIterator);
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
          b.callExpression(
            getIterator,
            [node.right]
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

function injectArrayIterator(scope) {
  return util.injectShared(scope, 'arrayIterator', b.functionExpression(
    null,
    [b.identifier('array')],
    b.blockStatement([
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(
          b.identifier('index'),
          b.literal(0)
        )]
      ),
      b.returnStatement(
        b.objectExpression([
          b.property(
            'init',
            b.identifier('next'),
            b.functionExpression(
              null,
              [],
              b.blockStatement([
                b.ifStatement(
                  b.binaryExpression(
                    '>=',
                    b.identifier('index'),
                    b.memberExpression(
                      b.identifier('array'),
                      b.identifier('length'),
                      false
                    )
                  ),
                  b.blockStatement([
                    b.returnStatement(
                      b.objectExpression([
                        b.property(
                          'init',
                          b.identifier('done'),
                          b.literal(true)
                        ),
                        b.property(
                          'init',
                          b.identifier('value'),
                          b.unaryExpression(
                            'void',
                            b.literal(0),
                            true
                          )
                        )
                      ])
                    )
                  ]),
                  b.blockStatement([
                    b.returnStatement(
                      b.objectExpression([
                        b.property(
                          'init',
                          b.identifier('done'),
                          b.literal(false)
                        ),
                        b.property(
                          'init',
                          b.identifier('value'),
                          b.memberExpression(
                            b.identifier('array'),
                            b.updateExpression(
                              '++',
                              b.identifier('index'),
                              false
                            ),
                            true
                          )
                        )
                      ])
                    )
                  ])
                )
              ])
            )
          )
        ])
      )
    ])
  ));
}

function injectGetIterator(scope, arrayIterator) {
  return util.injectShared(scope, 'getIterator', b.functionExpression(
    null,
    [b.identifier('iterable')],
    b.blockStatement([
      b.variableDeclaration(
        'var',
        [b.variableDeclarator(
          b.identifier('sym'),
          b.logicalExpression(
            '||',
            b.logicalExpression(
              '&&',
              b.binaryExpression(
                '===',
                b.unaryExpression(
                  'typeof',
                  b.identifier('Symbol'),
                  true
                ),
                b.literal('function')
              ),
              b.memberExpression(
                b.identifier('Symbol'),
                b.identifier('iterator'),
                false
              )
            ),
            b.literal('@@iterator')
          )
        )]
      ),
      b.ifStatement(
        b.binaryExpression(
          '===',
          b.unaryExpression(
            'typeof',
            b.memberExpression(
              b.identifier('iterable'),
              b.identifier('sym'),
              true
            ),
            true
          ),
          b.literal('function')
        ),
        b.blockStatement([
          b.returnStatement(
            b.callExpression(
              b.memberExpression(
                b.identifier('iterable'),
                b.identifier('sym'),
                true
              ),
              []
            )
          )
        ]),
        b.ifStatement(
          b.binaryExpression(
            '===',
            b.callExpression(
              b.memberExpression(
                b.memberExpression(
                  b.memberExpression(
                    b.identifier('Object'),
                    b.identifier('prototype'),
                    false
                  ),
                  b.identifier('toString'),
                  false
                ),
                b.identifier('call'),
                false
              ),
              [b.identifier('iterable')]
            ),
            b.literal('[object Array]')
          ),
          b.blockStatement([
            b.returnStatement(
              b.callExpression(
                arrayIterator,
                [b.identifier('iterable')]
              )
            )
          ]),
          b.blockStatement([
            b.throwStatement(
              b.newExpression(
                b.identifier('TypeError'),
                []
              )
            )
          ])
        )
      )
    ])
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
