export default {
  description:
    'a const declaration ending in ) immediately before stack( must NOT get a spurious comma (the Update-34 regression)',
  raw:
    '```javascript\n' +
    'const masterGain = sine.range(0.2, 0.8).segment(4)\n' +
    'stack(\n' +
    '  note("c e g")\n\n' +
    '  s("bd sd")\n' +
    ')\n' +
    '```',
  expectValid: true,
  mustContain: ['const masterGain = sine.range(0.2, 0.8).segment(4)\nstack('],
  mustNotContain: ['segment(4),'],
};
