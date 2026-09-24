// Minimal generic AST walker shared across the pipeline - visits every
// node reachable from `node`, including array-valued children (e.g. a
// CallExpression's `arguments`). A single shared implementation avoids
// each module (validate.js, repair.js) growing its own near-identical copy.
export function walk(node, visit) {
  if (!node || typeof node !== 'object') return;
  if (typeof node.type === 'string') visit(node);
  for (const key in node) {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((child) => walk(child, visit));
    } else if (value && typeof value === 'object') {
      walk(value, visit);
    }
  }
}
