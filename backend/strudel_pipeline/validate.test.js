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
