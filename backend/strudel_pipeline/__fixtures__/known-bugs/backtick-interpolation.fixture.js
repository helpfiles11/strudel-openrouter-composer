export default {
  description:
    'a backtick used to build a note name from JS values must be rewritten to plain JS concatenation, whether it is pure interpolation or has real pattern text mixed in',
  raw:
    '```javascript\n' +
    'const shamanDrone = (root, oct) => note(`${root}${oct}`).sound("sine")\n' +
    'shamanDrone("a", 1)\n' +
    'const kick = s(`bd(${1},8)`)\n' +
    '```',
  expectValid: true,
  mustContain: ['note(((root) + (oct)))', "s(('bd(' + (1) + ',8)'))"],
};
