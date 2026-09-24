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
