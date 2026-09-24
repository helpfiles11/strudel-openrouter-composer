import { Script } from 'node:vm';
import * as acorn from 'acorn';
import * as krill from './krill_parser.mjs';
import { KNOWN_METHODS } from './controls-data.js';
import { walk } from './ast-walk.js';

const PATTERN_FUNCTIONS = new Set(['note', 'n', 's', 'sound']);

function checkJsSyntax(code) {
  try {
    new Script(code);
    return [];
  } catch (err) {
    return [`JS syntax error: ${err.message}`];
  }
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

function checkPatternText(text, line, label, errors) {
  try {
    krill.parse(`"${text}"`);
  } catch (err) {
    // The compiled grammar (vendored directly from krill.pegjs) throws a
    // raw peggy SyntaxError with no prefix. Strudel's own runtime wraps
    // this same raw error as "[mini] parse error at line N: <message>"
    // (in @strudel/mini's JS layer, which isn't vendored here — only the
    // grammar is) — match that wording so our errors read identically to
    // what a user would see from the real REPL.
    errors.push(`${label} at line ${line}: [mini] parse error: ${err.message}`);
  }
}

function checkMiniNotation(ast) {
  const errors = [];
  walk(ast, (node) => {
    // Strudel's transpiler treats EVERY double-quoted string literal in
    // the file as mini-notation source, unconditionally — regardless of
    // whether it's ever passed to note()/n()/s()/sound(), assigned to an
    // unused const, or passed to an unrelated function. Verified against
    // the real plugin-mini.mjs source (isStringWithDoubleQuotes: any
    // Literal node whose raw text starts with '"' gets wrapped). A real
    // production bug: `const whisperRhythm = "(3,16)"` — an unused
    // variable! — broke the whole track, because Euclidean syntax needs a
    // preceding atom and none was there.
    if (node.type === 'Literal' && typeof node.value === 'string' && node.raw?.[0] === '"') {
      checkPatternText(node.value, node.loc.start.line, `"${node.value}"`, errors);
      return;
    }
    // Backtick literals get the same unconditional treatment. Only ones
    // with zero `${}` holes reach here — any with interpolation have
    // already been rewritten to plain JS concatenation by
    // repair.js's fixBacktickInterpolation earlier in the pipeline.
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
      const text = node.quasis.map((q) => q.value.cooked).join('');
      checkPatternText(text, node.loc.start.line, `\`${text}\``, errors);
      return;
    }
    // Single-quoted strings are never statically wrapped by the
    // transpiler — Strudel leaves them as plain JS strings everywhere
    // else in the file. They only become mini-notation when
    // note()/n()/s()/sound() reify() them at RUNTIME, so only check them
    // in that specific position.
    if (
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      PATTERN_FUNCTIONS.has(node.callee.name) &&
      node.arguments.length > 0 &&
      node.arguments[0].type === 'Literal' &&
      typeof node.arguments[0].value === 'string' &&
      node.arguments[0].raw?.[0] === "'"
    ) {
      const arg = node.arguments[0];
      checkPatternText(arg.value, node.loc.start.line, `${node.callee.name}('${arg.value}')`, errors);
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

// Common String/Array/Object/Number/Promise/Function prototype methods a
// generated track's plain JS helper code can legitimately call on a
// non-Pattern value (e.g. a helper trimming/formatting a sample name
// before passing it to note()/s()). There's no static type system here to
// tell "called on a Pattern" apart from "called on a plain JS value", so
// checkControlNames() below would otherwise flag any of these that happen
// to land within edit-distance 2 of an obscure real Strudel control name
// - e.g. .trim() is genuinely valid JS but is distance 2 from the real
// control "rdim" (a chord-voicing quality), and got false-flagged as "did
// you mean .rdim(...)?" in production. Exclude the common ones outright
// rather than trying to infer the receiver's type.
const JS_BUILTIN_METHOD_NAMES = new Set([
  'trim', 'trimStart', 'trimEnd', 'toString', 'valueOf', 'toLowerCase', 'toUpperCase',
  'slice', 'splice', 'split', 'join', 'concat', 'includes', 'indexOf', 'lastIndexOf',
  'replace', 'replaceAll', 'repeat', 'padStart', 'padEnd', 'charAt', 'charCodeAt',
  'codePointAt', 'match', 'matchAll', 'search', 'startsWith', 'endsWith', 'normalize', 'at',
  'map', 'filter', 'reduce', 'reduceRight', 'forEach', 'find', 'findIndex', 'findLast',
  'findLastIndex', 'some', 'every', 'sort', 'reverse', 'fill', 'flat', 'flatMap', 'push',
  'pop', 'shift', 'unshift', 'keys', 'values', 'entries', 'hasOwnProperty', 'isPrototypeOf',
  'propertyIsEnumerable', 'then', 'catch', 'finally', 'toFixed', 'toPrecision',
  'toExponential', 'apply', 'call', 'bind',
]);

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
      if (knownSet.has(name) || JS_BUILTIN_METHOD_NAMES.has(name)) return;
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
