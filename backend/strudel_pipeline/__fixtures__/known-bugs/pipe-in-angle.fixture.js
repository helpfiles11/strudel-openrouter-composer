export default {
  description:
    'a "|" directly inside <...> is invalid mini-notation grammar and must fail fast with a precise error',
  raw: '```javascript\nnote("<a3 b3 | c3 d3>").sound("piano")\n```',
  expectValid: false,
  expectErrorMatch: /parse error/,
};
