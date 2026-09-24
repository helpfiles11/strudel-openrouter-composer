# Strudel Generation Pipeline Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `backend/strudel_prompt.js`'s regex-chain `postProcessStrudelCode()` with a modular pipeline in `backend/strudel_pipeline/` that validates generated code against Strudel's real mini-notation grammar and real JS syntax, fails fast with a precise error instead of silently shipping broken code, and is covered by an automated regression suite.

**Architecture:** `extract → repair → stack-comma-repair → validate`, each stage its own small module. Validation uses a locally-compiled copy of Strudel's real `krill.pegjs` mini-notation grammar (zero runtime deps) and Node's built-in `vm.Script` for JS syntax — not hand-maintained regex approximations of the grammar.

**Tech Stack:** Node.js (`type: module`, ESM throughout), `acorn` (JS AST parsing, new runtime dependency), `peggy` (grammar compiler, new dev-only dependency), `node:test` + `node:assert/strict` (built-in test runner, no new dependency).

**Spec:** `docs/superpowers/specs/2026-09-25-strudel-generation-pipeline-rewrite-design.md`

## Global Constraints

- Node engines floor stays `>=18.0.0` (from `package.json`) — every new API used (`node:test`, `node:vm`, global `fetch`) must work on Node 18.
- No changes to `server.js`, `frontend/app.js`, or the `/api/generate` request/response contract — the existing `{error, details}` error path already surfaces a thrown error's `.message` to the user.
- Add only the two new dependencies named in the spec: `acorn` (runtime), `peggy` (dev-only, never imported at runtime).
- Generated files (`krill_parser.mjs`, `controls-data.js`) are committed to the repo and regenerated only by their `scripts/update-*.js` script, never hand-edited.
- All 8 files in `examples/` must process through the full pipeline with zero validation errors at every task from Task 8 onward.
- `.size(` and `.velocity(` are real Strudel methods (confirmed against the real `controls.mjs` source: `registerControl('roomsize', 'size', 'sz', 'rsize')` and `registerControl('velocity', 'vel')`) — they must never be rewritten or deleted by `repair.js`. The previous version of this code did both incorrectly; this plan corrects it.

---

### Task 1: Add dependencies and test script

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `npm test` script wired to `node --test backend/strudel_pipeline` (won't run meaningfully until Task 4 adds the first test file — Node's test runner exits non-zero against a directory with zero matching test files, so there is nothing useful to verify yet in this task beyond the dependencies being installed).

- [ ] **Step 1: Add the two new dependencies and the test script to `package.json`**

Edit the `dependencies` object to add `acorn`, the `devDependencies` object to add `peggy`, and add a `"test"` entry to `scripts`:

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.54.0",
    "acorn": "^8.15.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "http-proxy-middleware": "^3.0.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "peggy": "^5.1.0"
  },
  "scripts": {
    "start": "node backend/server.js",
    "dev": "nodemon backend/server.js",
    "test": "node --test backend/strudel_pipeline",
    "strudel": "cd strudel && pnpm dev",
    "setup": "npm install && git clone https://codeberg.org/uzu/strudel.git && cd strudel && pnpm i"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: completes with no errors; `acorn` and `peggy` now appear in `node_modules`.

- [ ] **Step 3: Verify the dependencies resolved**

Run: `npm ls acorn peggy`
Expected: both listed with the installed versions, no `UNMET DEPENDENCY` errors.

- [ ] **Step 4: Create the pipeline directory**

Run: `mkdir -p backend/strudel_pipeline/scripts backend/strudel_pipeline/__fixtures__/known-bugs`

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add acorn and peggy for the Strudel pipeline rewrite"
```

---

### Task 2: Vendor the real mini-notation grammar

**Files:**
- Create: `backend/strudel_pipeline/scripts/update-grammar.js`
- Create: `backend/strudel_pipeline/krill_parser.mjs` (generated, run the script to produce it)
- Test: `backend/strudel_pipeline/krill-parser.test.js`

**Interfaces:**
- Produces: `backend/strudel_pipeline/krill_parser.mjs` exporting `parse(source: string): ASTNode` (throws a `SyntaxError`-like error with a `.message` describing what was expected/found on invalid mini-notation). Callers must wrap the pattern content in double quotes before calling, matching Strudel's own calling convention: `parse('"bd sd"')`, not `parse('bd sd')`.

- [ ] **Step 1: Write the grammar-fetch-and-compile script**

```js
#!/usr/bin/env node
// GENERATED-FILE PRODUCER — regenerates krill_parser.mjs from Strudel's
// real mini-notation grammar. Run manually whenever Strudel's grammar
// changes upstream:
//   node backend/strudel_pipeline/scripts/update-grammar.js
// krill_parser.mjs is committed to the repo, not built at install/runtime.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import peggy from 'peggy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRAMMAR_URL = 'https://codeberg.org/uzu/strudel/raw/branch/main/packages/mini/krill.pegjs';
const OUTPUT_PATH = path.join(__dirname, '..', 'krill_parser.mjs');

const response = await fetch(GRAMMAR_URL);
if (!response.ok) {
  throw new Error(`Failed to fetch grammar from ${GRAMMAR_URL}: HTTP ${response.status}`);
}
const grammarSource = await response.text();

const parserSource = peggy.generate(grammarSource, {
  format: 'es',
  output: 'source',
});

const header = `// GENERATED FILE — do not edit by hand.
// Regenerate with: node backend/strudel_pipeline/scripts/update-grammar.js
// Compiled from Strudel's real mini-notation grammar:
// ${GRAMMAR_URL}

`;

writeFileSync(OUTPUT_PATH, header + parserSource);
console.log(`Wrote ${OUTPUT_PATH} (${parserSource.length} bytes)`);
```

- [ ] **Step 2: Run it to generate the parser**

Run: `node backend/strudel_pipeline/scripts/update-grammar.js`
Expected: `Wrote .../krill_parser.mjs (NNNNN bytes)` — a file roughly 60-70KB appears at `backend/strudel_pipeline/krill_parser.mjs`. Requires network access to `codeberg.org`.

- [ ] **Step 3: Write the failing smoke test**

```js
// krill-parser.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as krill from './krill_parser.mjs';

test('parses valid mini-notation', () => {
  assert.doesNotThrow(() => krill.parse('"bd sd hh oh"'));
  assert.doesNotThrow(() => krill.parse('"<a3 b3>"'));
  assert.doesNotThrow(() => krill.parse('"bd(3,8)"'));
});

test('rejects a stray double-quote character inside the pattern', () => {
  assert.throws(() => krill.parse('"<\\"Am7\\" \\"Dm7\\">"'), /found/);
});

test('rejects a pipe directly inside angle brackets', () => {
  assert.throws(() => krill.parse('"<a3 b3 | c3 d3>"'));
});
```

- [ ] **Step 4: Run the test to verify it passes** (the parser already exists from Step 2, so this confirms the generated file behaves correctly, not that it's missing)

Run: `node --test backend/strudel_pipeline/krill-parser.test.js`
Expected: `# pass 3`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/strudel_pipeline/scripts/update-grammar.js backend/strudel_pipeline/krill_parser.mjs backend/strudel_pipeline/krill-parser.test.js
git commit -m "Vendor Strudel's real mini-notation grammar as a compiled parser"
```

---

### Task 3: Generate ground-truth control/method names

**Files:**
- Create: `backend/strudel_pipeline/scripts/update-controls.js`
- Create: `backend/strudel_pipeline/controls-data.js` (generated, run the script to produce it)
- Test: `backend/strudel_pipeline/controls-data.test.js`

**Interfaces:**
- Produces: `backend/strudel_pipeline/controls-data.js` exporting `KNOWN_METHODS: string[]` — every real chainable Pattern/control method name Strudel registers.

- [ ] **Step 1: Write the controls-fetch-and-extract script**

```js
#!/usr/bin/env node
// GENERATED-FILE PRODUCER — regenerates controls-data.js from Strudel's
// real packages/core source. Run manually whenever Strudel's core API
// changes upstream:
//   node backend/strudel_pipeline/scripts/update-controls.js
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  const response = await fetch(BASE_URL + file);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${file}: HTTP ${response.status}`);
  }
  const src = await response.text();
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
```

- [ ] **Step 2: Run it to generate the data file**

Run: `node backend/strudel_pipeline/scripts/update-controls.js`
Expected: `Wrote .../controls-data.js (NNN names)` where NNN is at least 500. Requires network access to `codeberg.org`.

- [ ] **Step 3: Write the failing test**

```js
// controls-data.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { KNOWN_METHODS } from './controls-data.js';

const known = new Set(KNOWN_METHODS);

test('includes real control names this project has previously mis-flagged as invalid', () => {
  for (const name of ['size', 'velocity', 'roomsize', 'gain', 'room', 'delayfeedback', 'delaytime']) {
    assert.ok(known.has(name), `expected KNOWN_METHODS to include "${name}"`);
  }
});

test('includes real core Pattern methods, not just controls', () => {
  for (const name of ['slow', 'fast', 'every', 'mul', 'add', 'degradeBy', 'early', 'late', 'jux']) {
    assert.ok(known.has(name), `expected KNOWN_METHODS to include "${name}"`);
  }
});

test('excludes the genuinely nonexistent method names this project has hit as real bugs', () => {
  for (const name of ['masterGain', 'delayFeedback', 'delayTime', 'phase', 'mult']) {
    assert.ok(!known.has(name), `expected KNOWN_METHODS to NOT include "${name}"`);
  }
});
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test backend/strudel_pipeline/controls-data.test.js`
Expected: `# pass 3`, `# fail 0`. If any assertion fails, re-check `CORE_FILES` in Step 1 for a missing source file rather than hand-editing the generated output.

- [ ] **Step 5: Commit**

```bash
git add backend/strudel_pipeline/scripts/update-controls.js backend/strudel_pipeline/controls-data.js backend/strudel_pipeline/controls-data.test.js
git commit -m "Generate ground-truth Strudel control/method names from the real source"
```

---

### Task 4: `extract.js`

**Files:**
- Create: `backend/strudel_pipeline/extract.js`
- Test: `backend/strudel_pipeline/extract.test.js`

**Interfaces:**
- Produces: `extractCodeBlock(rawText: string): string`

- [ ] **Step 1: Write the failing tests**

```js
// extract.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractCodeBlock } from './extract.js';

test('extracts code from a fenced javascript block', () => {
  const input = 'Here is the code:\n```javascript\nconst x = 1;\n```\nDone.';
  assert.equal(extractCodeBlock(input), 'const x = 1;');
});

test('extracts code from a fence with no language tag', () => {
  const input = '```\nconst x = 1;\n```';
  assert.equal(extractCodeBlock(input), 'const x = 1;');
});

test('strips a leading opening fence when the closing fence is missing (truncated response)', () => {
  const input = '```javascript\nconst x = 1;\nstack(\n  note("a")';
  assert.equal(extractCodeBlock(input), 'const x = 1;\nstack(\n  note("a")');
});

test('falls back to the raw trimmed text when there is no fence at all', () => {
  const input = '  const x = 1;  ';
  assert.equal(extractCodeBlock(input), 'const x = 1;');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test backend/strudel_pipeline/extract.test.js`
Expected: FAIL — `Cannot find module './extract.js'`.

- [ ] **Step 3: Write the implementation**

```js
// extract.js
export function extractCodeBlock(rawText) {
  const codeBlockMatch = rawText.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // A response can be cut off (hit max_tokens) before the closing fence
  // ever arrives, in which case the whole raw text — including the
  // leading ```javascript line — falls through here. Strip a leading
  // opening fence if present so stray backticks don't reach later stages
  // as invalid JS ("Unterminated template").
  return rawText.replace(/^```(?:javascript|js)?\s*\n?/, '').trim();
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test backend/strudel_pipeline/extract.test.js`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/strudel_pipeline/extract.js backend/strudel_pipeline/extract.test.js
git commit -m "Add extract.js: pull the fenced code block from raw LLM output"
```

---

### Task 5: `repair.js`

**Files:**
- Create: `backend/strudel_pipeline/repair.js`
- Test: `backend/strudel_pipeline/repair.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `repair(code: string): string`, plus its three named sub-functions (`renameKnownBadMethods`, `collapseMultilinePatternStrings`, `fixPureInterpolationBackticks`) each independently exported and testable.

- [ ] **Step 1: Write the failing tests**

```js
// repair.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renameKnownBadMethods,
  collapseMultilinePatternStrings,
  fixPureInterpolationBackticks,
  repair,
} from './repair.js';

test('renames known-nonexistent methods to their real equivalents', () => {
  const input = 'x.delayFeedback(0.3).delayTime(0.2).phase(0.1).mult(2).masterGain(g)';
  assert.equal(
    renameKnownBadMethods(input),
    'x.delayfeedback(0.3).delaytime(0.2).early(0.1).mul(2).gain(g)',
  );
});

test('does not touch .size( or .velocity( — both are real Strudel methods', () => {
  const input = 'x.size(0.5).velocity(".4 1")';
  assert.equal(renameKnownBadMethods(input), input);
});

test('collapses a raw line break inside a note() pattern string to a space', () => {
  const input = 'note("\n  c e g\n")';
  assert.equal(collapseMultilinePatternStrings(input), 'note("c e g")');
});

test('leaves a single-line pattern string untouched', () => {
  const input = 'note("c e g")';
  assert.equal(collapseMultilinePatternStrings(input), input);
});

test('rewrites a pure-interpolation backtick to plain JS concatenation', () => {
  const input = 'note(`${root}${oct}`)';
  assert.equal(fixPureInterpolationBackticks(input), 'note((root + oct))');
});

test('leaves a backtick with real mini-notation text around a hole untouched', () => {
  const input = 's(`bd(${n},8)`)';
  assert.equal(fixPureInterpolationBackticks(input), input);
});

test('repair() applies all three fixes in one pass', () => {
  const input = 'stack(\n  note("\n  c e g\n").masterGain(g),\n  note(`${root}${oct}`)\n)';
  const result = repair(input);
  assert.ok(!result.includes('\n  c e g\n'));
  assert.ok(result.includes('.gain(g)'));
  assert.ok(result.includes('(root + oct)'));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test backend/strudel_pipeline/repair.test.js`
Expected: FAIL — `Cannot find module './repair.js'`.

- [ ] **Step 3: Write the implementation**

```js
// repair.js
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

// A backtick template literal that is PURE interpolation — one or more
// `${expr}` holes with no literal characters anywhere around/between
// them, e.g. `${root}${oct}` — is a trap: Strudel's transpiler treats
// every backtick string as mini-notation source text (same mechanism as
// double-quoted strings), NOT plain JS template evaluation. A model
// reaching for backticks to concatenate JS values (thinking it's
// ordinary JS) instead hands the raw `${a}${b}` text to the
// mini-notation parser, which substitutes each hole's runtime value
// back into the pattern stream — a string value like "a" comes back
// with literal quote marks around it, which the grammar can't consume.
// Genuine mini-notation embedded-expression usage (e.g. `bd(${n},8)`)
// has real literal pattern text around the hole and is left untouched.
export function fixPureInterpolationBackticks(code) {
  return code.replace(/`((?:\$\{[^}]*\})+)`/g, (match, holes) => {
    const exprs = holes.match(/\$\{([^}]*)\}/g).map((h) => h.slice(2, -1));
    return `(${exprs.join(' + ')})`;
  });
}

export function repair(code) {
  let result = collapseMultilinePatternStrings(code);
  result = fixPureInterpolationBackticks(result);
  result = renameKnownBadMethods(result);
  return result;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test backend/strudel_pipeline/repair.test.js`
Expected: `# pass 7`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/strudel_pipeline/repair.js backend/strudel_pipeline/repair.test.js
git commit -m "Add repair.js: multi-line collapse, backtick fix, method-rename table"
```

---

### Task 6: `stack-comma-repair.js`

**Files:**
- Create: `backend/strudel_pipeline/stack-comma-repair.js`
- Test: `backend/strudel_pipeline/stack-comma-repair.test.js`

**Interfaces:**
- Consumes: `acorn` (npm package, added in Task 1).
- Produces: `repairStackCommas(code: string): string`

- [ ] **Step 1: Write the failing tests**

```js
// stack-comma-repair.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as acorn from 'acorn';
import { repairStackCommas } from './stack-comma-repair.js';

function isValidJS(code) {
  try {
    acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    return true;
  } catch {
    return false;
  }
}

test('inserts a missing comma between two stack() layers', () => {
  const input = 'stack(\n  note("a").slow(2)\n\n  note("b").fast(3)\n)';
  const result = repairStackCommas(input);
  assert.ok(isValidJS(result));
  assert.ok(result.includes('note("a").slow(2),'));
});

test('does not touch code that is already valid JS (regression guard for the Update-34 false positive)', () => {
  const input =
    'const masterGain = sine.range(0,1).segment(4)\nstack(\n  note("a"),\n  note("b")\n)';
  assert.equal(repairStackCommas(input), input);
});

test('fixes multiple missing commas across several layer boundaries', () => {
  const input = 'stack(\n  note("a")\n\n  note("b")\n\n  note("c")\n)';
  const result = repairStackCommas(input);
  assert.ok(isValidJS(result));
});

test('gives up and returns the input unchanged when the code is broken in an unrelated way', () => {
  const input = 'stack(\n  note("a"\n)'; // missing closing paren, not a comma issue
  const result = repairStackCommas(input);
  assert.ok(!isValidJS(result));
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test backend/strudel_pipeline/stack-comma-repair.test.js`
Expected: FAIL — `Cannot find module './stack-comma-repair.js'`.

- [ ] **Step 3: Write the implementation**

```js
// stack-comma-repair.js
import * as acorn from 'acorn';

const MAX_ATTEMPTS = 5;

// Replaces a line-prefix/suffix heuristic that previously guessed where
// stack() layers were missing a separating comma — that heuristic caused
// a real regression (a spurious comma inserted into an unrelated const
// declaration). This version only ever acts on a location the REAL JS
// parser identified as broken: it parses the code, and if acorn throws a
// SyntaxError at a specific character offset immediately preceded by ')',
// that is exactly the shape of a missing comma between two call
// expressions (stack()'s layers) — insert a comma there and retry.
// Anything else (a genuine, unrelated syntax error) is left alone for
// validate.js to report with the real parser's own message.
export function repairStackCommas(code) {
  let current = code;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      acorn.parse(current, { ecmaVersion: 'latest', sourceType: 'module' });
      return current;
    } catch (err) {
      if (typeof err.pos !== 'number') {
        return current;
      }
      const before = current.slice(0, err.pos);
      const lastNonSpace = before.replace(/\s+$/, '');
      if (!lastNonSpace.endsWith(')')) {
        return current;
      }
      const insertAt = lastNonSpace.length;
      current = current.slice(0, insertAt) + ',' + current.slice(insertAt);
    }
  }
  return current;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test backend/strudel_pipeline/stack-comma-repair.test.js`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/strudel_pipeline/stack-comma-repair.js backend/strudel_pipeline/stack-comma-repair.test.js
git commit -m "Add stack-comma-repair.js: acorn-error-driven comma repair"
```

---

### Task 7: `validate.js`

**Files:**
- Create: `backend/strudel_pipeline/validate.js`
- Test: `backend/strudel_pipeline/validate.test.js`

**Interfaces:**
- Consumes: `acorn` (Task 1), `node:vm` (built-in), `./krill_parser.mjs` (`parse`, Task 2), `./controls-data.js` (`KNOWN_METHODS`, Task 3).
- Produces: `validate(code: string): string[]` — an array of human-readable error strings, empty when the code is fully valid.

- [ ] **Step 1: Write the failing tests**

```js
// validate.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from './validate.js';

test('returns no errors for valid Strudel code', () => {
  const code = 'stack(\n  note("c e g"),\n  s("bd sd")\n)';
  assert.deepEqual(validate(code), []);
});

test('reports a JS syntax error and stops before checking patterns', () => {
  const code = 'const x = (';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /JS syntax error/);
});

test('reports the real mini-notation parse error for a stray quote inside a pattern', () => {
  const code = 'note(\'<"Am7" "Dm7">\')';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /parse error/);
  assert.match(errors[0], /found/);
});

test('reports the real mini-notation parse error for a pipe inside angle brackets', () => {
  const code = 'note("<a3 b3 | c3 d3>")';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /parse error/);
});

test('flags a near-miss unknown method name as a likely typo', () => {
  const code = 'note("c").gainn(0.5)';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /did you mean/);
});

test('does not flag .size( or .velocity( — both are real methods', () => {
  const code = 'note("c").size(0.5).velocity(0.8)';
  assert.deepEqual(validate(code), []);
});

test('does not flag calls to a user-defined helper function', () => {
  const code = 'const shamanDrone = (root, oct) => note(root + oct);\nshamanDrone("a", 1)';
  assert.deepEqual(validate(code), []);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test backend/strudel_pipeline/validate.test.js`
Expected: FAIL — `Cannot find module './validate.js'`.

- [ ] **Step 3: Write the implementation**

```js
// validate.js
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
        errors.push(
          `${node.callee.name}("${patternText}") at line ${node.loc.start.line}: ${err.message}`,
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --test backend/strudel_pipeline/validate.test.js`
Expected: `# pass 7`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add backend/strudel_pipeline/validate.js backend/strudel_pipeline/validate.test.js
git commit -m "Add validate.js: real JS syntax, mini-notation, and controls checks"
```

---

### Task 8: `index.js`, known-bugs fixtures, and full regression suite

**Files:**
- Create: `backend/strudel_pipeline/index.js`
- Create: `backend/strudel_pipeline/__fixtures__/known-bugs/master-gain.fixture.js`
- Create: `backend/strudel_pipeline/__fixtures__/known-bugs/stack-comma-regression.fixture.js`
- Create: `backend/strudel_pipeline/__fixtures__/known-bugs/backtick-interpolation.fixture.js`
- Create: `backend/strudel_pipeline/__fixtures__/known-bugs/stray-quote.fixture.js`
- Create: `backend/strudel_pipeline/__fixtures__/known-bugs/pipe-in-angle.fixture.js`
- Test: `backend/strudel_pipeline/index.test.js`

**Interfaces:**
- Consumes: `extractCodeBlock` (Task 4), `repair` (Task 5), `repairStackCommas` (Task 6), `validate` (Task 7).
- Produces: `processStrudelCode(rawLLMText: string): string` (throws `StrudelValidationError` on unrepairable validation failure), `StrudelValidationError` (an `Error` subclass with an `.errors: string[]` property). This is the public API `claude.js`/`openrouter.js` will call in Task 9.

- [ ] **Step 1: Write the five known-bugs fixtures**

```js
// __fixtures__/known-bugs/master-gain.fixture.js
export default {
  description: '.masterGain() does not exist; should be rewritten to .gain()',
  raw: '```javascript\nstack(\n  note("c e g").sound("piano"),\n  s("bd sd")\n)\n.masterGain(sine.range(0.2, 0.8))\n```',
  expectValid: true,
  mustContain: ['.gain('],
};
```

```js
// __fixtures__/known-bugs/stack-comma-regression.fixture.js
export default {
  description:
    'a const declaration ending in ) immediately before stack( must NOT get a spurious comma (the Update-34 regression)',
  raw:
    '```javascript\n' +
    'const masterGain = sine.range(0.2, 0.8).segment(4)\n' +
    'stack(\n' +
    '  note("c e g")\n\n' +
    '  s("bd sd")\n' +
    ')\n' +
    '```',
  expectValid: true,
  mustContain: ['const masterGain = sine.range(0.2, 0.8).segment(4)\nstack('],
  mustNotContain: ['segment(4),'],
};
```

```js
// __fixtures__/known-bugs/backtick-interpolation.fixture.js
export default {
  description:
    'a pure-interpolation backtick used to build a note name must be rewritten to plain JS concatenation',
  raw:
    '```javascript\n' +
    'const shamanDrone = (root, oct) => note(`${root}${oct}`).sound("sine")\n' +
    'shamanDrone("a", 1)\n' +
    '```',
  expectValid: true,
  mustContain: ['note((root + oct))'],
};
```

```js
// __fixtures__/known-bugs/stray-quote.fixture.js
export default {
  description: 'a literal quote character inside a mini-notation pattern is unrepairable and must fail fast',
  raw: '```javascript\nnote(\'<"Am7" "Dm7">\').sound("epiano")\n```',
  expectValid: false,
  expectErrorMatch: /parse error/,
};
```

```js
// __fixtures__/known-bugs/pipe-in-angle.fixture.js
export default {
  description:
    'a "|" directly inside <...> is invalid mini-notation grammar and must fail fast with a precise error',
  raw: '```javascript\nnote("<a3 b3 | c3 d3>").sound("piano")\n```',
  expectValid: false,
  expectErrorMatch: /parse error/,
};
```

- [ ] **Step 2: Write the failing end-to-end tests**

```js
// index.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { processStrudelCode, StrudelValidationError } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('every bundled example in examples/ processes with zero validation errors', () => {
  const examplesDir = path.join(__dirname, '..', '..', 'examples');
  const files = readdirSync(examplesDir).filter((f) => f.endsWith('.strudel.js'));
  assert.ok(files.length > 0, 'expected at least one example file');
  for (const file of files) {
    const src = readFileSync(path.join(examplesDir, file), 'utf8');
    const raw = '```javascript\n' + src + '\n```';
    assert.doesNotThrow(() => processStrudelCode(raw), `${file} should validate cleanly`);
  }
});

test('known-bugs fixtures behave as expected', async () => {
  const fixturesDir = path.join(__dirname, '__fixtures__', 'known-bugs');
  const files = readdirSync(fixturesDir).filter((f) => f.endsWith('.fixture.js'));
  assert.ok(files.length > 0, 'expected at least one known-bugs fixture');
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(fixturesDir, file)).href);
    const fixture = mod.default;
    if (fixture.expectValid) {
      const result = processStrudelCode(fixture.raw);
      for (const substr of fixture.mustContain ?? []) {
        assert.ok(result.includes(substr), `${file}: expected result to contain ${JSON.stringify(substr)}`);
      }
      for (const substr of fixture.mustNotContain ?? []) {
        assert.ok(!result.includes(substr), `${file}: expected result to NOT contain ${JSON.stringify(substr)}`);
      }
    } else {
      assert.throws(
        () => processStrudelCode(fixture.raw),
        (err) => err instanceof StrudelValidationError && fixture.expectErrorMatch.test(err.message),
        `${file}: expected a StrudelValidationError matching ${fixture.expectErrorMatch}`,
      );
    }
  }
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test backend/strudel_pipeline/index.test.js`
Expected: FAIL — `Cannot find module './index.js'`.

- [ ] **Step 4: Write the implementation**

```js
// index.js
import { extractCodeBlock } from './extract.js';
import { repair } from './repair.js';
import { repairStackCommas } from './stack-comma-repair.js';
import { validate } from './validate.js';

export class StrudelValidationError extends Error {
  constructor(errors) {
    super(`Strudel validation failed:\n${errors.map((e) => `  ${e}`).join('\n')}`);
    this.name = 'StrudelValidationError';
    this.errors = errors;
  }
}

export function processStrudelCode(rawLLMText) {
  const extracted = extractCodeBlock(rawLLMText);
  const repaired = repair(extracted);
  const withCommasFixed = repairStackCommas(repaired);
  const errors = validate(withCommasFixed);
  if (errors.length > 0) {
    throw new StrudelValidationError(errors);
  }
  return withCommasFixed;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test backend/strudel_pipeline/index.test.js`
Expected: `# pass 2`, `# fail 0`.

- [ ] **Step 6: Run the full pipeline test suite**

Run: `npm test`
Expected: every test file in `backend/strudel_pipeline` passes — `# fail 0` in the final summary.

- [ ] **Step 7: Commit**

```bash
git add backend/strudel_pipeline/index.js backend/strudel_pipeline/index.test.js backend/strudel_pipeline/__fixtures__
git commit -m "Add index.js orchestration, known-bugs fixtures, and examples regression suite"
```

---

### Task 9: Wire the pipeline into the providers and remove the old code

**Files:**
- Modify: `backend/claude.js`
- Modify: `backend/openrouter.js`
- Modify: `backend/strudel_prompt.js`

**Interfaces:**
- Consumes: `processStrudelCode` from `./strudel_pipeline/index.js` (Task 8).

- [ ] **Step 1: Update `backend/claude.js`'s import and call site**

Find the import line:
```js
import { buildSystemPrompt, postProcessStrudelCode } from './strudel_prompt.js';
```
Replace with:
```js
import { buildSystemPrompt } from './strudel_prompt.js';
import { processStrudelCode } from './strudel_pipeline/index.js';
```

Find the call site (`return postProcessStrudelCode(textBlock.text);`) and replace with:
```js
    return processStrudelCode(textBlock.text);
```

- [ ] **Step 2: Update `backend/openrouter.js`'s import and call site**

Find the import line:
```js
import { buildSystemPrompt, postProcessStrudelCode } from './strudel_prompt.js';
```
Replace with:
```js
import { buildSystemPrompt } from './strudel_prompt.js';
import { processStrudelCode } from './strudel_pipeline/index.js';
```

Find the call site (`return postProcessStrudelCode(text);`) and replace with:
```js
    return processStrudelCode(text);
```

- [ ] **Step 3: Remove `postProcessStrudelCode` from `backend/strudel_prompt.js`**

Delete the entire `postProcessStrudelCode` function and its JSDoc comment (everything from the `/**` block immediately above `export function postProcessStrudelCode(code) {` down to that function's closing `}`) — `strudel_prompt.js` should now contain only `SYSTEM_PROMPT` and `buildSystemPrompt()`.

- [ ] **Step 4: Confirm no leftover references**

Run: `grep -rn "postProcessStrudelCode" backend/ frontend/`
Expected: no output (nothing left referencing the removed function).

- [ ] **Step 5: Run the full test suite one more time**

Run: `npm test`
Expected: `# fail 0`.

- [ ] **Step 6: Start the server and sanity-check it boots**

Run: `npm start` (in the background, or in a separate terminal)
Expected: `Server running on http://localhost:3000` (or configured `PORT`) with no import errors printed. Stop the server after confirming.

- [ ] **Step 7: Commit**

```bash
git add backend/claude.js backend/openrouter.js backend/strudel_prompt.js
git commit -m "Wire strudel_pipeline into both providers; remove the old regex pipeline"
```
