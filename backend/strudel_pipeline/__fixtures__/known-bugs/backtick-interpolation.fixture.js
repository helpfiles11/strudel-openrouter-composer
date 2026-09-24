export default {
  description:
    'a pure-interpolation backtick used to build a note name must be rewritten to plain JS concatenation',
  raw:
    '```javascript\n' +
    'const shamanDrone = (root, oct) => note(`${root}${oct}`).sound("sine")\n' +
    'shamanDrone("a", 1)\n' +
    '```',
  expectValid: true,
  mustContain: ['note((root + oct))'],
};
