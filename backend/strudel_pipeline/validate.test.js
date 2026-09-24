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

test('does not flag standard JS String.prototype methods, even when they happen to be edit-distance-close to an obscure real Strudel control', () => {
  // "rdim" is a real registered Strudel control (a chord-voicing quality) -
  // and "trim" is edit-distance 2 from it, so plain JS String#trim() used
  // in a helper function was previously false-flagged as "not a real
  // Strudel method - did you mean .rdim(...)?" (a real production bug).
  const code = 'const clean = (s) => s.trim().toLowerCase();\nnote(clean("c "))';
  assert.deepEqual(validate(code), []);
});

test('still flags a genuine near-miss even when checking a JS builtin name is not the concern', () => {
  const code = 'note("c")._slow(2)';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /did you mean \.slow/);
});

test('flags an invalid double-quoted string even when it is never passed to note/n/s/sound at all', () => {
  // Real production bug: Strudel's transpiler treats EVERY double-quoted
  // string in the file as mini-notation source, unconditionally - even an
  // UNUSED variable. `const whisperRhythm = "(3,16)"` (Euclidean syntax
  // needs a preceding atom) broke the whole track even though
  // whisperRhythm was never referenced anywhere else.
  const code = 'const whisperRhythm = "(3,16)"\ns("bd sd")';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /parse error/);
});

test('flags an invalid double-quoted string passed to an unrelated function', () => {
  const code = 's("bd sd").bank("(bad")';
  const errors = validate(code);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /parse error/);
});

test('does not flag an ordinary double-quoted word used as a non-pattern argument (e.g. a bank name)', () => {
  const code = 's("bd sd").bank("RolandTR909")';
  assert.deepEqual(validate(code), []);
});

test('does not flag an invalid-looking single-quoted string that is never passed to note/n/s/sound', () => {
  // Single-quoted strings are only ever mini-notation-parsed when
  // note()/n()/s()/sound() reify() them at runtime; elsewhere they stay
  // plain JS strings forever, regardless of content.
  const code = "const label = '(this is just a plain JS string)'\ns(\"bd sd\")";
  assert.deepEqual(validate(code), []);
});
