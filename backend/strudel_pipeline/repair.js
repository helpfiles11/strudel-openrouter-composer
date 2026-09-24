import * as acorn from 'acorn';
import { walk } from './ast-walk.js';

// Known-nonexistent method names a model has been observed writing,
// mapped to their real equivalents. Verified against the real
// @strudel/core controls.mjs and pattern.mjs source (see
// controls-data.js) — every entry here is confirmed ABSENT from
// KNOWN_METHODS. Do not add .size( or .velocity( here: both are real,
// registered Strudel methods (registerControl('roomsize', 'size', ...)
// and registerControl('velocity', 'vel')) — a previous version of this
// table rewrote/deleted them incorrectly, silently altering the reverb
// size and velocity behavior of real user tracks.
const METHOD_RENAMES = {
  '.delayFeedback(': '.delayfeedback(',
  '.delayTime(': '.delaytime(',
  // .phase() doesn't exist on signals (sine/saw/etc); .early() is the
  // real equivalent for shifting a periodic signal in time.
  '.phase(': '.early(',
  // .mult() doesn't exist — the real pattern-arithmetic multiply is
  // .mul() (registered in pattern.mjs's COMPOSERS object).
  '.mult(': '.mul(',
  // .masterGain() doesn't exist — .gain() is the real equivalent,
  // applied to a whole stack(...) the same way it's used per-layer.
  '.masterGain(': '.gain(',
};

export function renameKnownBadMethods(code) {
  let result = code;
  for (const [wrong, right] of Object.entries(METHOD_RENAMES)) {
    result = result.split(wrong).join(right);
  }
  return result;
}

// A raw line break inside "..."/'...' (e.g. for readability) is invalid
// JavaScript — only backtick strings allow embedded newlines — and
// breaks the ENTIRE track, not just that line. Scoped to note(/n(/s(/
// sound( pattern strings specifically, not every quoted string in the
// file, so this can't accidentally mangle an apostrophe inside a //
// comment elsewhere.
export function collapseMultilinePatternStrings(code) {
  return code.replace(
    /\b(note|n|s|sound)\(\s*(["'])((?:(?!\2)[\s\S])*?)\2/g,
    (match, fn, quote, inner) => {
      if (!inner.includes('\n')) return match;
      const fixed = inner.replace(/\s*\n\s*/g, ' ').trim();
      return `${fn}(${quote}${fixed}${quote}`;
    },
  );
}

// ANY backtick template literal containing `${}` interpolation is unsafe
// as a mini-notation pattern - not just ones that are pure holes with no
// surrounding text. Verified directly against the real @strudel/transpiler
// plugin (plugin-mini.mjs): its backtick handling ALWAYS uses only
// `quasis[0].value.raw` - the literal text before the FIRST `${` - and
// silently discards every expression and every quasi after it. So
// `` `bd(${n},8)` `` does NOT become "bd(<n's value>,8)" as a model
// (reasonably) expects from ordinary JS template syntax; it becomes the
// truncated pattern "bd(" (a parse error), and `` `c ${x} e` `` silently
// becomes just "c " with "${x} e" discarded entirely - a *silent*
// correctness bug, not even an error. A backtick with NO `${}` at all
// (pure static text) is unaffected and works correctly.
// Fix: rewrite the whole template literal as plain JS string
// concatenation of its quasis and expressions, in source order - exactly
// the semantics a model intends when reaching for template-literal
// interpolation in the first place. AST-based (splicing at exact node
// positions, processed last-to-first so earlier positions don't shift)
// rather than regex, because a regex can't safely reconstruct arbitrary
// nested expressions inside `${...}`.
// Renders a plain string as a SINGLE-quoted JS literal. Deliberately not
// JSON.stringify() (which always produces double quotes): the pieces this
// produces get spliced back into the source as real string literals, and
// Strudel's transpiler treats EVERY double-quoted string as mini-notation
// source, unconditionally (see validate.js's checkMiniNotation) - so a
// double-quoted piece like "bd(" would itself get individually re-parsed
// as its own (invalid) mini-notation pattern. Single-quoted strings are
// never statically wrapped that way, which is exactly what's needed for
// a plain JS string fragment.
function toSingleQuotedLiteral(str) {
  return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n')}'`;
}

export function fixBacktickInterpolation(code) {
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    return code; // let validate.js's JS syntax check report the real error
  }
  const replacements = [];
  walk(ast, (node) => {
    if (node.type === 'TemplateLiteral' && node.expressions.length > 0) {
      const pieces = [];
      node.quasis.forEach((quasi, i) => {
        if (quasi.value.cooked !== '') pieces.push(toSingleQuotedLiteral(quasi.value.cooked));
        if (i < node.expressions.length) {
          const expr = node.expressions[i];
          pieces.push(`(${code.slice(expr.start, expr.end)})`);
        }
      });
      replacements.push({
        start: node.start,
        end: node.end,
        replacement: pieces.length > 0 ? `(${pieces.join(' + ')})` : "''",
      });
    }
  });
  replacements.sort((a, b) => b.start - a.start);
  let result = code;
  for (const { start, end, replacement } of replacements) {
    result = result.slice(0, start) + replacement + result.slice(end);
  }
  return result;
}

export function repair(code) {
  let result = collapseMultilinePatternStrings(code);
  result = renameKnownBadMethods(result);
  return result;
}

// Strudel's transpiler appends `return <expr>` to the file's LAST
// top-level statement so the REPL can evaluate it - that statement must
// therefore be an ExpressionStatement. If it's something else (a trailing
// const/let/function declaration - e.g. a model-written "master gain"
// helper left dangling at the end of the file), older transpiler builds
// throw "unexpected ast format without body expression" and the whole
// track fails, even though every individual statement is valid JS.
// Upstream Strudel later patched this exact case to gracefully fall back
// to appending a `silence` expression instead of throwing (confirmed
// against the real transpiler.mjs source); this replicates that same
// safe fallback here so it works regardless of which transpiler version
// is actually deployed. Called separately from repair() above, after
// stack-comma-repair.js, since it needs the code to already parse.
export function ensureTrailingExpression(code) {
  let ast;
  try {
    ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch {
    return code; // let validate.js's JS syntax check report the real error
  }
  const body = ast.body;
  if (body.length === 0) return code;
  const last = body[body.length - 1];
  if (last.type === 'ExpressionStatement') return code;
  return `${code}\nsilence`;
}
