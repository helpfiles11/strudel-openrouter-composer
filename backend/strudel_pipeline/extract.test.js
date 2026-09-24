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
