export default {
  description: 'a literal quote character inside a mini-notation pattern is unrepairable and must fail fast',
  raw: '```javascript\nnote(\'<"Am7" "Dm7">\').sound("epiano")\n```',
  expectValid: false,
  expectErrorMatch: /parse error/,
};
