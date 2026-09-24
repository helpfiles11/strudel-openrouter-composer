import * as acorn from 'acorn';

const MAX_ATTEMPTS = 5;

// Replaces a line-prefix/suffix heuristic that previously guessed where
// stack() layers were missing a separating comma — that heuristic caused
// a real regression (a spurious comma inserted into an unrelated const
// declaration). This version only ever acts on a location the REAL JS
// parser identified as broken: it parses the code, and if acorn throws a
// SyntaxError at a specific character offset immediately preceded by ')',
// that is exactly the shape of a missing comma between two call
// expressions (stack()'s layers) — insert a comma there and retry.
// Anything else (a genuine, unrelated syntax error) is left alone for
// validate.js to report with the real parser's own message.
export function repairStackCommas(code) {
  let current = code;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      acorn.parse(current, { ecmaVersion: 'latest', sourceType: 'module' });
      return current;
    } catch (err) {
      if (typeof err.pos !== 'number') {
        return current;
      }
      const before = current.slice(0, err.pos);
      const lastNonSpace = before.replace(/\s+$/, '');
      if (!lastNonSpace.endsWith(')')) {
        return current;
      }
      const insertAt = lastNonSpace.length;
      current = current.slice(0, insertAt) + ',' + current.slice(insertAt);
    }
  }
  return current;
}
