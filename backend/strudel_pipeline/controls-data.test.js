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
