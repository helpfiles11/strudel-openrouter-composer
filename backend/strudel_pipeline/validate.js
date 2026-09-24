import { Script } from 'node:vm';
import * as acorn from 'acorn';
import * as krill from './krill_parser.mjs';
import { KNOWN_METHODS } from './controls-data.js';

const PATTERN_FUNCTIONS = new Set(['note', 'n', 's', 'sound']);

// Minimal generic AST walker — visits every node reachable from `node`,
// including array-valued children (e.g. a CallExpression's `arguments`).
// Avoids adding acorn-walk as a further dependency for what's a ~15-line
// recursive traversal.
function walk(node, visit) {
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

function checkJsSyntax(code) {
  try {
    new Script(code);
    return [];
  } catch (err) {
    return [`JS syntax error: ${err.message}`];
  }
}

function extractPatternStringLiteral(argNode) {
  if (argNode.type === 'Literal' && typeof argNode.value === 'string') {
    return argNode.value;
  }
  if (argNode.type === 'TemplateLiteral' && argNode.expressions.length === 0) {
    return argNode.quasis.map((q) => q.value.cooked).join('');
  }
  return null;
}

function parseAstOrNull(code) {
  try {
    return acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
  } catch {
    // JS syntax errors are already reported by checkJsSyntax; nothing
    // further to check here.
    return null;
  }
}

function checkMiniNotation(ast) {
  const errors = [];
  walk(ast, (node) => {
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      PATTERN_FUNCTIONS.has(node.callee.name) &&
      node.arguments.length > 0
    ) {
      const patternText = extractPatternStringLiteral(node.arguments[0]);
      if (patternText === null) return;
      try {
        krill.parse(`"${patternText}"`);
      } catch (err) {
        // The compiled grammar (vendored directly from krill.pegjs) throws
        // a raw peggy SyntaxError with no prefix. Strudel's own runtime
        // wraps this same raw error as "[mini] parse error at line N:
        // <message>" (in @strudel/mini's JS layer, which isn't vendored
        // here — only the grammar is) — match that wording so our errors
        // read identically to what a user would see from the real REPL.
        errors.push(
          `${node.callee.name}("${patternText}") at line ${node.loc.start.line}: [mini] parse error: ${err.message}`,
        );
      }
    }
  });
  return errors;
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function checkControlNames(ast) {
  const errors = [];
  const knownSet = new Set(KNOWN_METHODS);
  walk(ast, (node) => {
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier'
    ) {
      const name = node.callee.property.name;
      if (knownSet.has(name)) return;
      const closeMatch = KNOWN_METHODS.find((known) => levenshtein(known, name) <= 2);
      if (closeMatch) {
        errors.push(
          `.${name}(...) at line ${node.loc.start.line}: not a real Strudel method — did you mean .${closeMatch}(...)?`,
        );
      }
    }
  });
  return errors;
}

export function validate(code) {
  const jsErrors = checkJsSyntax(code);
  if (jsErrors.length > 0) return jsErrors;
  const ast = parseAstOrNull(code);
  if (!ast) return [];
  return [...checkMiniNotation(ast), ...checkControlNames(ast)];
}
