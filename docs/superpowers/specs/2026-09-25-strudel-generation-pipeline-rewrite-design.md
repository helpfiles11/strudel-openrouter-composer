# Strudel Generation Pipeline Rewrite — Design

## Problem

`backend/strudel_prompt.js` currently mixes two unrelated concerns in one
file: the LLM system prompt, and a `postProcessStrudelCode()` function
that chain-applies seven regex-based "fixes" to raw LLM output before it
reaches the user's browser. Every fix was added reactively, after a real
user hit a specific bug (`.masterGain()` doesn't exist, missing commas
between `stack()` layers, pure-interpolation backticks producing stray
quote characters inside mini-notation, etc).

Three failures in a row (documented in this repo's `KLADDE.md` working
history) exposed the structural ceiling of this approach:

- The riskiest piece — a line-prefix/suffix heuristic that guesses where
  `stack()` layers are missing a separating comma — itself caused a
  regression (a spurious comma inserted into an unrelated `const`
  declaration) that had to be hot-patched with another guard clause.
- Every fix encodes one specific bug shape from memory of the grammar,
  never validated against the real grammar. Nothing catches an error
  outside the shapes we've personally hand-diagnosed.
- Nothing in the pipeline validates that the code it hands back is even
  syntactically valid JavaScript, or that a `note/n/s/sound(...)` pattern
  string is valid mini-notation, before it reaches the user. Every
  validation to date has been an ad hoc `node --check` run manually in a
  chat session, never wired into the actual code path.
- There is no automated regression suite — verification has been 100%
  manual, so nothing stops a future fix from silently breaking a past
  one.

## Goals

1. Validate generated code against Strudel's **real** grammar (mini-notation)
   and real JS syntax, not hand-maintained approximations of it — catch
   whole classes of errors, not just the specific shapes we've hit before.
2. Replace the riskiest heuristic (stack-comma guessing) with something
   driven by ground truth (a real parser's exact error location) instead
   of regex pattern-matching on line prefixes/suffixes.
3. Fail fast with a precise, actionable error when generated code can't be
   repaired, instead of silently shipping broken code to the user's
   browser.
4. Split one entangled file into small, single-purpose, independently
   testable modules.
5. Add an automated regression suite covering every real bug this project
   has hit, plus the bundled example tracks, so future changes can't
   silently regress past fixes.
6. Do all of this with the smallest reasonable footprint — this project
   currently has five runtime dependencies total; the rewrite should add
   as few as strictly necessary.

## Non-goals

- No LLM-in-the-loop auto-repair (send the parser's error back to the
  model for a second attempt). Decided against for now: adds latency and
  API cost to a fraction of generations for a benefit ("might get an
  automatically-corrected track instead of an error message") that's
  secondary to "never silently ship broken code." Revisit later if fail-fast
  proves too coarse in practice.
- No change to the `/api/generate` request/response contract, `server.js`,
  or `frontend/app.js`. (See "Error surfacing" below — the existing
  `{error, details}` path already does the right thing.)
- No change to the sound-library/preset/pattern data files
  (`expanded_sounds.js`, `sounds.js`, `patterns.js`, `synthesis_presets.js`,
  `prompt_context.js`) — out of scope for this pass.

## Spike findings (de-risking the design before committing to it)

Two feasibility questions were resolved by direct testing before writing
this spec, because they materially change what's buildable:

**Is a real mini-notation grammar validator actually usable server-side?**
`@strudel/mini` (the official package) depends on all of `@strudel/core`,
which in its currently-published version has a broken transitive import
(`@strudel/core` expects `@kabelsalat/web` to export `SalatRepl`; it
doesn't) — it fails to load in plain Node at all. Rather than depend on
that fragile packaging, the actual grammar source
(`packages/mini/krill.pegjs` in the Strudel repo, ~21KB, AGPL-licensed
same as this project) was fetched directly and compiled locally with
`peggy` (a standard, actively maintained PEG parser generator). The
compiled parser is a single ~68KB generated JS module with **zero runtime
dependencies of its own**. It was tested against known bug patterns and:
- Correctly parses valid mini-notation (`bd sd hh oh`, `<a3 b3>`, `bd(3,8)`).
- Correctly rejects the stray-quote case
  (`<"Am7" "Dm7">`) with an error message essentially identical to the
  one a real user hit: `Expected "<", "[", "^", "{", ... but "\"" found`.
- Correctly rejects the old pipe-inside-`<>` bug (`<a3 b3 | c3 d3>`).

**Does JS syntax validation need a dependency?** No — Node's built-in
`vm.Script` constructor throws a real `SyntaxError` (with message) on
invalid JS source without needing to execute it. Verified against
unbalanced parens and an unclosed `stack(` call.

Net effect: real-grammar validation ends up **lighter** than the current
regex-fix approach — one vendored generated file plus one dev-only
dependency (`peggy`, used only to regenerate the parser if Strudel's
grammar is ever updated), zero new runtime dependencies.

## Architecture

Replace `backend/strudel_prompt.js`'s repair logic with a new
`backend/strudel_pipeline/` directory. `strudel_prompt.js` itself shrinks
to just `SYSTEM_PROMPT` and `buildSystemPrompt()` — pure prompt-text
concerns — and imports the pipeline for post-processing.

```
backend/strudel_pipeline/
  index.js                 - orchestrates extract -> repair -> validate
  extract.js                - pull the fenced code block from raw LLM text
  repair.js                  - multi-line-string collapse, backtick pure-
                                interpolation fix, method-rename table
  stack-comma-repair.js      - acorn-driven, bounded-retry comma repair
  validate.js                 - JS syntax check, mini-notation check (via
                                krill_parser.mjs), controls cross-check
  controls-data.js            - generated list of real Strudel control names
  krill_parser.mjs            - vendored, generated (not hand-edited)
  scripts/
    update-grammar.js         - re-fetches krill.pegjs and recompiles
                                krill_parser.mjs via peggy (dev-time only)
    update-controls.js        - regenerates controls-data.js from the real
                                controls.mjs source (dev-time only)
  __fixtures__/
    known-bugs/                - one fixture per real bug this project has
                                hit (see Testing)
  extract.test.js
  repair.test.js
  stack-comma-repair.test.js
  validate.test.js
  index.test.js               - end-to-end tests over the whole pipeline
```

### `extract.js`

Unchanged behavior from the current lines 260-276: extract the fenced
` ```javascript ... ``` ` block; if absent (response truncated before the
closing fence), strip a leading opening fence from the raw text instead of
guessing at prose boundaries.

### `repair.js`

The narrow set of transformations that are safe and well-understood as
pure regex/string operations, each independently testable:

- **Multi-line pattern-string collapse**: a raw line break inside a
  `note("...")`/`s('...')` string is invalid JS; collapse to spaces.
  (Unchanged from current behavior, lines 281-291.)
- **Backtick pure-interpolation fix**: a backtick literal that is nothing
  but one or more `${expr}` holes with no literal text around them (e.g.
  `` `${root}${oct}` ``) gets rewritten to plain JS concatenation
  (`(root + oct)`), because Strudel's transpiler treats every backtick as
  mini-notation source and a plain string value substituted into a hole
  injects literal quote characters into the pattern stream. (Unchanged
  from the fix just shipped in commit `0418c2c`.)
- **Known-wrong-method-name table**: replaces the current 7 chained
  `.replace()` calls with one data table and one generic loop:
  ```js
  const METHOD_RENAMES = {
    '.size(': '.room(',
    '.delayFeedback(': '.delayfeedback(',
    '.delayTime(': '.delaytime(',
    '.phase(': '.early(',
    '.mult(': '.mul(',
    '.masterGain(': '.gain(',
  };
  ```
  (`.velocity(...)` removal stays as its own explicit regex — it deletes a
  whole call rather than renaming one, a different shape of fix.) Each
  entry keeps a one-line comment explaining why, same as today, but as
  table annotations rather than repeated inline comment blocks.

The `|`-inside-`<...>` fix from the current code is **not** carried
forward as a hand-coded regex — the real mini-notation validator in
`validate.js` now catches this (and every other grammar violation) as a
byproduct of real parsing, so a bespoke fix for this one specific shape is
redundant. (It remains as a `__fixtures__/known-bugs/` regression test
asserting the *validator* rejects it with a clear error, since fail-fast
was chosen over silent-fix for anything not in the safe `repair.js` list.)

### `stack-comma-repair.js`

Replaces the line-heuristic entirely (deleting current lines 306-355,
including the `looksLikeChainLine`/`startsNewPattern`/`isBlankOrComment`
guess-work and the false-positive guard that had to be bolted on after
the Update-34 regression).

New approach: parse the code with `acorn`. If it throws a `SyntaxError`
at a specific `line`/`column` (acorn reports both), and the character at
that position is consistent with a missing comma between two call
expressions (the same shape the old heuristic targeted), insert a comma
at that **exact, parser-reported location** and retry. Repeat up to 5
times; if still failing, stop and let `validate.js`'s JS-syntax check
surface the real error. This only ever acts on a location the real parser
identified as broken, so it structurally cannot repeat the Update-34
regression (a `const` declaration that merely precedes `stack(` was never
something acorn would flag as a parse error at that position).

### `validate.js`

Three checks, run in order, all failures collected (not just the first)
so a single validation error message can describe everything wrong at
once:

1. **JS syntax** — `new vm.Script(code)`. If this throws, stop here (no
   point checking pattern strings inside code that isn't valid JS) and
   surface the `SyntaxError` message plus line/column directly.
2. **Mini-notation syntax** — parse `code` with `acorn` to get a real AST
   (not regex), walk it for every `CallExpression` whose callee is
   `note`/`n`/`s`/`sound` (extensible list) and whose first argument is a
   string `Literal` or a `TemplateLiteral` with no expressions, extract
   that string plus its real source `line`/`column` from the AST node,
   and run it through `krill_parser.mjs`. Any parse failure is collected
   with the exact function call, line, and the real grammar's
   `expected`/`found` message.
3. **Controls cross-check** — walk the same AST for
   `MemberExpression`/`CallExpression` chains (`.foo(...)`) and compare
   `foo` against `controls-data.js`'s known-valid list; an unrecognized
   name that's a close match to a known one (edit-distance check) is
   flagged as a likely typo. This is advisory-only (still surfaces as a
   validation error, since it's better to catch a typo before shipping
   than after), but scoped conservatively — only flags names absent from
   the list, not e.g. user-defined helper functions (those aren't
   `.method()` chain calls off a pattern in the first place).

### `controls-data.js`

Generated once (and regenerable via `scripts/update-controls.js`) from
the real `@strudel/core` `controls.mjs` source, the same source already
being manually WebFetched by hand each time a new "method doesn't exist"
bug turns up. Turns a reactive, one-at-a-time list into ground truth that
can be refreshed with one script run.

### `index.js` — public API

```js
export function processStrudelCode(rawLLMText) {
  const extracted = extract(rawLLMText);
  const repaired = repair(extracted);
  const withCommasFixed = repairStackCommas(repaired);
  const errors = validate(withCommasFixed);
  if (errors.length > 0) {
    throw new StrudelValidationError(formatErrors(errors));
  }
  return withCommasFixed;
}
```

This is a drop-in replacement for the current `postProcessStrudelCode`
call sites in `claude.js` and `openrouter.js` — same input (raw LLM
text), same success-case output (a code string), the only behavior change
being a thrown, precisely-worded error on genuine validation failure
instead of silently returning broken code.

## Error surfacing

No changes needed to `server.js` or `frontend/app.js`. The `/api/generate`
route already wraps `generateStrudelCode(prompt)` in a try/catch and
responds `{error, details: error.message}` on any thrown error;
`frontend/app.js` already displays `data.details` to the user. A thrown
`StrudelValidationError` with a message like:

```
Strudel validation failed:
  note(`<"Am7" "Dm7">`) at line 12: [mini] parse error: Expected "<", "[", ...
  but "\"" found
```

flows through this existing path unchanged and reaches the user as a
precise, actionable message instead of a generic "it broke" or (worse)
silently-shipped broken code that only fails once the user's browser
evaluates it.

## Testing

- `node:test` + `node:assert/strict` — built into Node ≥18 (already this
  project's `engines` minimum in `package.json`), zero new dependency.
  `package.json` gets one new script: `"test": "node --test
  backend/strudel_pipeline"`.
- One test file per module, unit-testing it in isolation.
- `index.test.js` runs the full pipeline end-to-end against:
  - All 8 files in `examples/` (read directly from that directory, not
    duplicated, so fixtures can't drift from the real examples) — must
    produce zero validation errors.
  - `__fixtures__/known-bugs/`, one fixture per real bug this project has
    hit: `.masterGain()`, the stack-comma regression, the backtick
    pure-interpolation crash, the stray-quote crash, and the old
    pipe-inside-`<>` crash. Each fixture asserts either a correct
    auto-fix (code validates clean afterward) or, where fail-fast is the
    intended behavior (e.g. the pipe-in-`<>` case, no longer hand-fixed),
    the correct precise validation error.

## Dependencies

New:
- `acorn` (runtime) — JS AST parsing for comma-repair and mini-notation
  pattern-string extraction. Small, zero-dependency, the de facto
  standard JS parser (used by ESLint, Babel's tooling, etc).
- `peggy` (dev only) — compiles `krill.pegjs` into `krill_parser.mjs`.
  Never imported at runtime; only invoked by `scripts/update-grammar.js`.

Unchanged: no other new runtime dependencies. `vm` is a Node built-in.

## Migration summary

| | Before | After |
|---|---|---|
| Stack-comma fix | Line-prefix/suffix heuristic, caused a real regression | Acorn-error-location-driven, bounded retry |
| Wrong-method renames | 7 chained `.replace()` calls | 1 data table + 1 loop |
| `\|`-in-`<>` fix | Hand-coded regex for this one shape | Caught generically by real grammar validation |
| JS syntax validation | None (manual `node --check` in chat only) | `vm.Script`, wired into the actual request path |
| Mini-notation validation | None (regex fixes are blind guesses) | Real grammar (`krill_parser.mjs`), wired in |
| Unknown-method detection | None | Cross-checked against generated `controls-data.js` |
| On unrepairable error | Silently shipped to the user's browser | Thrown, precise, reaches user via existing error path |
| Tests | None, 100% manual verification | `node:test` suite + permanent regression fixtures |
| File structure | One file, prompt text + repair logic mixed | `strudel_prompt.js` (prompt only) + `strudel_pipeline/` (6 focused modules) |
