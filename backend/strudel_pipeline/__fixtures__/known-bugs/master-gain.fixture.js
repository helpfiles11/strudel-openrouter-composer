export default {
  description: '.masterGain() does not exist; should be rewritten to .gain()',
  raw: '```javascript\nstack(\n  note("c e g").sound("piano"),\n  s("bd sd")\n)\n.masterGain(sine.range(0.2, 0.8))\n```',
  expectValid: true,
  mustContain: ['.gain('],
};
