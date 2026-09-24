export default {
  description:
    'a file ending in a const declaration (not an expression) crashes older Strudel transpiler builds with "unexpected ast format without body expression"; must be repaired by appending a trailing expression',
  raw:
    '```javascript\n' +
    '$: s("bd sd")\n' +
    'const masterFade = sine.slow(256).range(0, 1)\n' +
    '  .segment(256)\n' +
    '```',
  expectValid: true,
  mustContain: ['silence'],
};
