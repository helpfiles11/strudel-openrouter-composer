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

// Curated list of packages/core/*.mjs files confirmed to register
// chainable Pattern methods via register()/registerControl()/
// registerMultiControl(), or (pattern.mjs only) to define the COMPOSERS
// object of pattern-arithmetic methods (.mul(), .add(), etc). Not
// exhaustive by construction — the controls cross-check this feeds is
// advisory (near-miss typo detection), not a hard reject of unrecognized
// names, so an occasional miss here is low-risk. Extend this list if a
// future false-positive typo warning turns out to name a real method
// that just isn't registered in one of these files.
const CORE_FILES = [
  'controls.mjs',
  'pattern.mjs',
  'signal.mjs',
  'euclid.mjs',
  'impure.mjs',
  'pick.mjs',
  'repl.mjs',
  'cyclist.mjs',
  'neocyclist.mjs',
];
const BASE_URL = 'https://codeberg.org/uzu/strudel/raw/branch/main/packages/core/';

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
