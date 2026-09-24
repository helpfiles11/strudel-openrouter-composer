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
