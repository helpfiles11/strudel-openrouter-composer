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
