"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (_ref) {
  var t = _ref.types;

  function cleanDecorators(decorators) {
    return decorators.reverse().map(function (dec) {
      return dec.expression;
    });
  }

  function transformClass(path, ref, state) {
    var nodes = [];

    state;

    var classDecorators = path.node.decorators;
    if (classDecorators) {
      path.node.decorators = null;
      classDecorators = cleanDecorators(classDecorators);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = classDecorators[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var decorator = _step.value;

          nodes.push(buildClassDecorator({
            CLASS_REF: ref,
            DECORATOR: decorator
          }));
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }

    var map = Object.create(null);

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = path.get("body.body")[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var method = _step2.value;

        var decorators = method.node.decorators;
        if (!decorators) continue;

        var alias = t.toKeyAlias(method.node);
        map[alias] = map[alias] || [];
        map[alias].push(method.node);

        method.remove();
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    for (var alias in map) {
      var items = map[alias];

      items;
    }

    return nodes;
  }

  function hasDecorators(path) {
    if (path.isClass()) {
      if (path.node.decorators) return true;

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = path.node.body.body[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var method = _step3.value;

          if (method.decorators) {
            return true;
          }
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    } else if (path.isObjectExpression()) {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = path.node.properties[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var prop = _step4.value;

          if (prop.decorators) {
            return true;
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }

    return false;
  }

  return {
    inherits: require("babel-plugin-syntax-decorators"),

    visitor: {
      ClassExpression: function ClassExpression(path) {
        if (!hasDecorators(path)) return;

        (0, _babelHelperExplodeClass2.default)(path);

        var ref = path.scope.generateDeclaredUidIdentifier("ref");
        var nodes = [];

        nodes.push(t.assignmentExpression("=", ref, path.node));

        nodes = nodes.concat(transformClass(path, ref, this));

        nodes.push(ref);

        path.replaceWith(t.sequenceExpression(nodes));
      },
      ClassDeclaration: function ClassDeclaration(path) {
        if (!hasDecorators(path)) return;

        (0, _babelHelperExplodeClass2.default)(path);

        var ref = path.node.id;
        var nodes = [];

        nodes = nodes.concat(transformClass(path, ref, this).map(function (expr) {
          return t.expressionStatement(expr);
        }));
        nodes.push(t.expressionStatement(ref));

        path.insertAfter(nodes);
      },
      ObjectExpression: function ObjectExpression(path, file) {
        if (!hasDecorators(path)) return;

        var mutatorMap = {};

        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
          for (var _iterator5 = path.node.properties[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
            var prop = _step5.value;

            if (prop.decorators) {
              (0, _babelHelperBindifyDecorators2.default)(prop.decorators);
            }

            if (prop.kind === "init" && !prop.method) {
              prop.kind = "";
              prop.value = t.functionExpression(null, [], t.blockStatement([t.returnStatement(prop.value)]));
            }

            defineMap.push(mutatorMap, prop, "initializer", file);
          }
        } catch (err) {
          _didIteratorError5 = true;
          _iteratorError5 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion5 && _iterator5.return) {
              _iterator5.return();
            }
          } finally {
            if (_didIteratorError5) {
              throw _iteratorError5;
            }
          }
        }

        var obj = defineMap.toClassObject(mutatorMap);
        obj = defineMap.toComputedObjectFromClass(obj);
        return t.callExpression(file.addHelper('create-decorated-object'), [obj]);
      }
    }
  };
};

var _babelTemplate = require("babel-template");

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelHelperBindifyDecorators = require("babel-helper-bindify-decorators");

var _babelHelperBindifyDecorators2 = _interopRequireDefault(_babelHelperBindifyDecorators);

var _babelHelperDefineMap = require("babel-helper-define-map");

var defineMap = _interopRequireWildcard(_babelHelperDefineMap);

var _babelHelperExplodeClass = require("babel-helper-explode-class");

var _babelHelperExplodeClass2 = _interopRequireDefault(_babelHelperExplodeClass);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var buildClassDecorator = (0, _babelTemplate2.default)("\n  CLASS_REF = DECORATOR(CLASS_REF) || CLASS_REF;\n");