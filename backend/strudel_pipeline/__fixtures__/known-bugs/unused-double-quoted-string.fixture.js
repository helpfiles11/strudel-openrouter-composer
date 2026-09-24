export default {
  description:
    'a double-quoted string containing invalid mini-notation must fail fast even when the variable holding it is never used anywhere else — Strudel\'s transpiler treats every double-quoted string in the file as mini-notation source, unconditionally',
  raw:
    '```javascript\n' +
    '// whisperRhythm is intentionally never referenced again below\n' +
    'const whisperRhythm = "(3,16)"\n' +
    's("bd sd")\n' +
    '```',
  expectValid: false,
  expectErrorMatch: /parse error/,
};
