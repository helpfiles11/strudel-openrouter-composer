import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  renameKnownBadMethods,
  collapseMultilinePatternStrings,
  fixBacktickInterpolation,
  ensureTrailingExpression,
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
  assert.equal(fixBacktickInterpolation(input), 'note(((root) + (oct)))');
});

test('rewrites a backtick with real text around a hole too — the real Strudel transpiler discards everything after the first ${, this is NOT safe usage', () => {
  const input = 's(`bd(${n},8)`)';
  // Reconstructed literal pieces MUST be single-quoted, not double-quoted:
  // Strudel treats every double-quoted string as mini-notation source
  // unconditionally, so a double-quoted piece like "bd(" would itself get
  // individually (and invalidly) re-parsed as its own pattern.
  assert.equal(fixBacktickInterpolation(input), "s(('bd(' + (n) + ',8)'))");
});

test('leaves a backtick with no interpolation at all untouched', () => {
  const input = 's(`bd sd hh`)';
  assert.equal(fixBacktickInterpolation(input), input);
});

test('fixBacktickInterpolation leaves unparseable code untouched (validate.js reports the real syntax error)', () => {
  const input = 'note(`${';
  assert.equal(fixBacktickInterpolation(input), input);
});

test('appends a silence expression when the file ends in a non-expression statement', () => {
  // Strudel's transpiler appends `return <expr>` to the LAST top-level
  // statement for REPL evaluation - if that statement isn't an
  // ExpressionStatement (e.g. a trailing const), older transpiler builds
  // throw "unexpected ast format without body expression" outright (a
  // real production bug: a track ending in `const masterFade = ...`).
  const input = 'stack(note("c"))\nconst masterFade = sine.slow(4)';
  const result = ensureTrailingExpression(input);
  assert.ok(result.trim().endsWith('silence'));
});

test('leaves a file that already ends in an expression untouched', () => {
  const input = 'const x = sine.slow(4)\nstack(note("c"))';
  assert.equal(ensureTrailingExpression(input), input);
});

test('ensureTrailingExpression leaves unparseable code untouched (validate.js reports the real syntax error)', () => {
  const input = 'const x = (';
  assert.equal(ensureTrailingExpression(input), input);
});

test('repair() applies the multi-line collapse and method-rename fixes in one pass', () => {
  const input = 'stack(\n  note("\n  c e g\n").masterGain(g)\n)';
  const result = repair(input);
  assert.ok(!result.includes('\n  c e g\n'));
  assert.ok(result.includes('.gain(g)'));
});
