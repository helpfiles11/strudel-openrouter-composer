#!/usr/bin/env node
// GENERATED-FILE PRODUCER — regenerates krill_parser.mjs from Strudel's
// real mini-notation grammar. Run manually whenever Strudel's grammar
// changes upstream:
//   node backend/strudel_pipeline/scripts/update-grammar.js
// krill_parser.mjs is committed to the repo, not built at install/runtime.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import peggy from 'peggy';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GRAMMAR_URL = 'https://codeberg.org/uzu/strudel/raw/branch/main/packages/mini/krill.pegjs';
const OUTPUT_PATH = path.join(__dirname, '..', 'krill_parser.mjs');

// Uses curl rather than fetch(): Node's built-in fetch (undici) does not
// automatically honor HTTP_PROXY/HTTPS_PROXY environment variables, while
// curl does — and adding undici's ProxyAgent as an explicit dependency
// would be a third new dependency beyond the two (acorn, peggy) this
// rewrite intentionally limits itself to. This script is dev-only,
// never imported at runtime, so shelling out here has no runtime cost.
const grammarSource = execFileSync('curl', ['-sL', '--fail', '--max-time', '20', GRAMMAR_URL], {
  encoding: 'utf8',
});
if (!grammarSource) {
  throw new Error(`Failed to fetch grammar from ${GRAMMAR_URL}`);
}

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
