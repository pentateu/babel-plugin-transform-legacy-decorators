import template from "babel-template";
import bindifyDecorators from "babel-helper-bindify-decorators";
import * as defineMap from "babel-helper-define-map";
import explodeClass from "babel-helper-explode-class";

let buildClassDecorator = template(`
  CLASS_REF = DECORATOR(CLASS_REF) || CLASS_REF;
`);

export default function ({ types: t }) {
  function cleanDecorators(decorators) {
    return decorators.reverse().map(dec => dec.expression);
  }

  function transformClass(path, ref, state) {
    let nodes = [];

    state;

    let classDecorators = path.node.decorators;
    if (classDecorators) {
      path.node.decorators = null;
      classDecorators = cleanDecorators(classDecorators);

      for (let decorator of classDecorators) {
        nodes.push(buildClassDecorator({
          CLASS_REF: ref,
          DECORATOR: decorator
        }));
      }
    }

    let map = Object.create(null);

    for (let method of path.get("body.body")) {
      let decorators = method.node.decorators;
      if (!decorators) continue;

      let alias = t.toKeyAlias(method.node);
      map[alias] = map[alias] || [];
      map[alias].push(method.node);

      method.remove();
    }

    for (let alias in map) {
      let items = map[alias];

      items;
    }

    return nodes;
  }

  function hasDecorators(path) {
    if (path.isClass()) {
      if (path.node.decorators) return true;

      for (let method of (path.node.body.body: Array<Object>)) {
        if (method.decorators) {
          return true;
        }
      }
    } else if (path.isObjectExpression()) {
      for (let prop of (path.node.properties: Array<Object>)) {
        if (prop.decorators) {
          return true;
        }
      }
    }

    return false;
  }

  return {
    inherits: require("babel-plugin-syntax-decorators"),

    visitor: {
      ClassExpression(path) {
        if (!hasDecorators(path)) return;

        explodeClass(path);

        let ref = path.scope.generateDeclaredUidIdentifier("ref");
        let nodes = [];

        nodes.push(t.assignmentExpression("=", ref, path.node));

        nodes = nodes.concat(transformClass(path, ref, this));

        nodes.push(ref);

        path.replaceWith(t.sequenceExpression(nodes));
      },

      ClassDeclaration(path) {
        if (!hasDecorators(path)) return;

        explodeClass(path);

        let ref = path.node.id;
        let nodes = [];

        nodes = nodes.concat(transformClass(path, ref, this).map(expr => t.expressionStatement(expr)));
        nodes.push(t.expressionStatement(ref));

        path.insertAfter(nodes);
      },

      ObjectExpression(path, file) {
        if (!hasDecorators(path)) return;

        let mutatorMap = {}

        for (let prop of path.node.properties) {
          if (prop.decorators) {
            bindifyDecorators(prop.decorators);
          }

          if (prop.kind === "init" && !prop.method) {
            prop.kind = "";
            prop.value = t.functionExpression(null, [], t.blockStatement([
              t.returnStatement(prop.value),
            ]));
          }

          defineMap.push(mutatorMap, prop, "initializer", file);
        }

        let obj = defineMap.toClassObject(mutatorMap);
        obj = defineMap.toComputedObjectFromClass(obj);
        return t.callExpression(file.addHelper('create-decorated-object'), [obj]);
      }
    }
  };
}
