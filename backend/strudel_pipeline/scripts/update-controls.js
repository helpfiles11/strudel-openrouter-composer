#!/usr/bin/env node
// GENERATED-FILE PRODUCER — regenerates controls-data.js from Strudel's
// real packages/core source. Run manually whenever Strudel's core API
// changes upstream:
//   node backend/strudel_pipeline/scripts/update-controls.js
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'controls-data.js');

// Curated list of packages/*.mjs files confirmed to register chainable
// Pattern methods via register()/registerControl()/registerMultiControl(),
// or (pattern.mjs only) to define the COMPOSERS object of
// pattern-arithmetic methods (.mul(), .add(), etc). Not exhaustive by
// construction — the controls cross-check this feeds is advisory
// (near-miss typo detection), not a hard reject of unrecognized names, so
// an occasional miss here is low-risk (though it can produce a false-
// positive typo warning, as .transpose()/.voicings() did before
// packages/tonal/ was added here — found via the examples/ regression
// suite in index.test.js). Extend this list if a future false-positive
// turns out to name a real method that just isn't registered in one of
// these files.
const CORE_FILES = [
  'core/controls.mjs',
  'core/pattern.mjs',
  'core/signal.mjs',
  'core/euclid.mjs',
  'core/impure.mjs',
  'core/pick.mjs',
  'core/repl.mjs',
  'core/cyclist.mjs',
  'core/neocyclist.mjs',
  'tonal/tonal.mjs',
  'tonal/voicings.mjs',
];
const BASE_URL = 'https://codeberg.org/uzu/strudel/raw/branch/main/packages/';

// Uses curl rather than fetch() — see update-grammar.js for why (Node's
// fetch doesn't honor HTTP_PROXY/HTTPS_PROXY here, and this script is
// dev-only, never imported at runtime).
function fetchText(url) {
  return execFileSync('curl', ['-sL', '--fail', '--max-time', '20', url], { encoding: 'utf8' });
}

function extractRegisterNames(src, fnNames) {
  const names = new Set();
  const re = new RegExp(`export const (\\{[^}]+\\}|\\w+)\\s*=\\s*(?:${fnNames.join('|')})\\(`, 'g');
  let m;
  while ((m = re.exec(src))) {
    const lhs = m[1];
    if (lhs.startsWith('{')) {
      lhs
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((n) => names.add(n));
    } else {
      names.add(lhs);
    }
  }
  return names;
}

function extractComposerKeys(src) {
  const block = src.match(/const COMPOSERS = \{([\s\S]*?)\n\};/);
  if (!block) return new Set();
  const names = new Set();
  const re = /^\s*(\w+):/gm;
  let m;
  while ((m = re.exec(block[1]))) names.add(m[1]);
  return names;
}

// A fourth registration shape (pattern.mjs's Pattern class): shorthand
// methods defined directly in the class body, e.g. `cat(...pats) { ... }`
// — not registered via register()/registerControl() or the COMPOSERS
// object, so the two extractors above miss them entirely (found via the
// examples/ regression suite flagging a real .cat() call as an unknown
// method). Scoped to lines beginning with exactly two spaces then an
// identifier then "(" — the same style used throughout this class body —
// and bounded by a closing "}" alone at the start of a line, matching the
// convention already relied on for extractComposerKeys above (safe here
// because this file's JSDoc {Type} annotations are always inline within a
// comment, never a bare "}" alone on its own line).
function extractClassMethodNames(src, className) {
  const startMatch = src.match(new RegExp(`export class ${className} \\{\\n`));
  if (!startMatch) return new Set();
  const afterStart = src.slice(startMatch.index + startMatch[0].length);
  const endMatch = afterStart.match(/^\}/m);
  const classBody = endMatch ? afterStart.slice(0, endMatch.index) : afterStart;
  const names = new Set();
  const re = /^ {2}([a-zA-Z_][a-zA-Z0-9_]*)\(/gm;
  let m;
  while ((m = re.exec(classBody))) {
    if (m[1] !== 'constructor') names.add(m[1]);
  }
  return names;
}

// A fifth registration shape: direct `Pattern.prototype.name = function`
// assignments OUTSIDE the class body (e.g. .mask(), .maskAll(), .struct(),
// .structAll(), .reset(), .restart() and their *All variants, .hush(),
// .tag(), and others scattered through pattern.mjs). Missed by all three
// extractors above. Found via a real production bug: .mask() (a
// well-documented, commonly-used method) was flagged as an unknown
// method - "did you mean .as(...)?" - because this shape was identified
// early during this rewrite but never actually implemented.
function extractPrototypeAssignments(src, className) {
  const names = new Set();
  const re = new RegExp(`${className}\\.prototype\\.(\\w+)\\s*=\\s*function`, 'g');
  let m;
  while ((m = re.exec(src))) names.add(m[1]);
  return names;
}

const allNames = new Set();
for (const file of CORE_FILES) {
  const src = fetchText(BASE_URL + file);
  if (!src) {
    throw new Error(`Failed to fetch ${file}`);
  }
  extractRegisterNames(src, ['registerControl', 'registerMultiControl', 'register']).forEach((n) =>
    allNames.add(n),
  );
  extractComposerKeys(src).forEach((n) => allNames.add(n));
  extractClassMethodNames(src, 'Pattern').forEach((n) => allNames.add(n));
  extractPrototypeAssignments(src, 'Pattern').forEach((n) => allNames.add(n));
}

const sorted = [...allNames].sort();
const header = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node backend/strudel_pipeline/scripts/update-controls.js
// Ground-truth chainable Pattern/control method names, extracted from
// Strudel's real packages/core source files:
// ${CORE_FILES.map((f) => BASE_URL + f).join('\n// ')}

`;
const body = `export const KNOWN_METHODS = ${JSON.stringify(sorted, null, 2)};\n`;

writeFileSync(OUTPUT_PATH, header + body);
console.log(`Wrote ${OUTPUT_PATH} (${sorted.length} names)`);
