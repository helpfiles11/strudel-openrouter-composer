// Known-nonexistent method names a model has been observed writing,
// mapped to their real equivalents. Verified against the real
// @strudel/core controls.mjs and pattern.mjs source (see
// controls-data.js) — every entry here is confirmed ABSENT from
// KNOWN_METHODS. Do not add .size( or .velocity( here: both are real,
// registered Strudel methods (registerControl('roomsize', 'size', ...)
// and registerControl('velocity', 'vel')) — a previous version of this
// table rewrote/deleted them incorrectly, silently altering the reverb
// size and velocity behavior of real user tracks.
const METHOD_RENAMES = {
  '.delayFeedback(': '.delayfeedback(',
  '.delayTime(': '.delaytime(',
  // .phase() doesn't exist on signals (sine/saw/etc); .early() is the
  // real equivalent for shifting a periodic signal in time.
  '.phase(': '.early(',
  // .mult() doesn't exist — the real pattern-arithmetic multiply is
  // .mul() (registered in pattern.mjs's COMPOSERS object).
  '.mult(': '.mul(',
  // .masterGain() doesn't exist — .gain() is the real equivalent,
  // applied to a whole stack(...) the same way it's used per-layer.
  '.masterGain(': '.gain(',
};

export function renameKnownBadMethods(code) {
  let result = code;
  for (const [wrong, right] of Object.entries(METHOD_RENAMES)) {
    result = result.split(wrong).join(right);
  }
  return result;
}

// A raw line break inside "..."/'...' (e.g. for readability) is invalid
// JavaScript — only backtick strings allow embedded newlines — and
// breaks the ENTIRE track, not just that line. Scoped to note(/n(/s(/
// sound( pattern strings specifically, not every quoted string in the
// file, so this can't accidentally mangle an apostrophe inside a //
// comment elsewhere.
export function collapseMultilinePatternStrings(code) {
  return code.replace(
    /\b(note|n|s|sound)\(\s*(["'])((?:(?!\2)[\s\S])*?)\2/g,
    (match, fn, quote, inner) => {
      if (!inner.includes('\n')) return match;
      const fixed = inner.replace(/\s*\n\s*/g, ' ').trim();
      return `${fn}(${quote}${fixed}${quote}`;
    },
  );
}

// A backtick template literal that is PURE interpolation — one or more
// `${expr}` holes with no literal characters anywhere around/between
// them, e.g. `${root}${oct}` — is a trap: Strudel's transpiler treats
// every backtick string as mini-notation source text (same mechanism as
// double-quoted strings), NOT plain JS template evaluation. A model
// reaching for backticks to concatenate JS values (thinking it's
// ordinary JS) instead hands the raw `${a}${b}` text to the
// mini-notation parser, which substitutes each hole's runtime value
// back into the pattern stream — a string value like "a" comes back
// with literal quote marks around it, which the grammar can't consume.
// Genuine mini-notation embedded-expression usage (e.g. `bd(${n},8)`)
// has real literal pattern text around the hole and is left untouched.
export function fixPureInterpolationBackticks(code) {
  return code.replace(/`((?:\$\{[^}]*\})+)`/g, (match, holes) => {
    const exprs = holes.match(/\$\{([^}]*)\}/g).map((h) => h.slice(2, -1));
    return `(${exprs.join(' + ')})`;
  });
}

export function repair(code) {
  let result = collapseMultilinePatternStrings(code);
  result = fixPureInterpolationBackticks(result);
  result = renameKnownBadMethods(result);
  return result;
}
