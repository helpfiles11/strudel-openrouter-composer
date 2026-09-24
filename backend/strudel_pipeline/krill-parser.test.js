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
