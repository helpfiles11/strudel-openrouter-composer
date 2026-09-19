# Changelog

Technical detail on what changed in this fork, for anyone curious about the specifics. The [README](README.md) keeps the high-level story; this is the "what and why" for each change.

## New provider architecture

- Added OpenRouter as a provider (`backend/openrouter.js`), selectable via `PROVIDER`, so the app can run against free models instead of requiring paid Anthropic API credits
- Extracted the shared prompt/parsing logic (`backend/strudel_prompt.js`) so both providers stay in sync automatically

## Fixes found through live testing

These were all found by actually running the app end-to-end and verifying against the real, deployed `@strudel/repl` component and Strudel's own source ([codeberg.org/uzu/strudel](https://codeberg.org/uzu/strudel), the project's current home — it moved off GitHub a while back):

- **Playback wasn't wired up correctly.** The frontend was setting `strudelEditor.code = ...`, which isn't a real setter on the component — it silently did nothing. The documented, working API is `strudelEditor.editor.setCode()` / `.evaluate()` / `.stop()` (confirmed against the `@strudel/repl` README's own "Interacting with the REPL" section).
- **Failed generations looked like successes.** Strudel's `repl.evaluate()` catches pattern runtime errors internally and never rethrows them — a broken pattern (e.g. calling a control that doesn't exist) used to fail completely silently, with the UI reporting "success" and no sound. Fixed by listening for the component's `update` DOM event and surfacing `event.detail.error` directly in the status bar.
- **Layout looked broken but wasn't a rendering bug.** `<strudel-editor>` inserts its real UI (canvas + code editor) as a *sibling* `<div>`, not a child (confirmed in `repl-component.mjs`). Styling the now-empty custom element itself as a full-height block made that empty shell render as a big blank box, with the real editor squeezed below it.
- **A few Strudel syntax patterns that read as plausible JS but don't exist**, each verified against `@strudel/core`'s actual source:
  - `.degrade(amount)` — `.degrade()` takes no arguments; use `.degradeBy(amount)`
  - `.delayFeedback()` / `.delayTime()` — the real names are all-lowercase: `.delayfeedback()` / `.delaytime()`
  - `.phase()` — doesn't exist on signals like `sine`; use `.early()` / `.late()`

  All three are now documented explicitly in the system prompt, with defensive auto-fixes in `postProcessStrudelCode()` in case a model still gets them wrong.
- **A hardcoded, since-retired Claude model id**, and a brittle assumption that Claude's response content is always at `content[0]`.
- **An OpenRouter request could throw a raw, unwrapped `DOMException`** if the response body was still arriving when the timeout fired (`fetch()` resolves on headers, not body) — now wrapped consistently into a clear error message.
- **A free "reasoning" model could exhaust its entire token budget on internal chain-of-thought** and return empty content with no error — now detected and reported explicitly, with a higher token budget and lower reasoning effort requested by default.

- **A status race hid real errors behind a false "success."** Strudel's `evaluate()` dispatches its `update` event (with any error already set) *before* our own `await evaluate()` resolves - code right after that await was unconditionally writing a "success" status, silently overwriting the real error the event had just reported. Fixed by routing all success/error status text through a single handler driven by that event, ignoring mid-flight (`pending: true`) events that can carry a stale result from the *previous* evaluation.
- **A response cut off by the token limit could leak a raw, unclosed code fence into the editor**, breaking as invalid JS ("Unterminated template"). `postProcessStrudelCode()` now strips a dangling opening fence even when no closing fence ever arrived.
- **Two more real mini-notation/JS syntax traps**, found by actually listening to generated tracks and one failing outright:
  - A model can write a pattern string with a raw line break inside `"..."`/`'...'` (e.g. for readability) - only backtick strings allow embedded newlines, so this is invalid JavaScript and silently breaks the *entire* track, not just that line.
  - `|` (Strudel's "randomly pick one of these sequences each cycle" operator) is only valid inside `[...]` or at a pattern's top level - verified directly against Strudel's own grammar (`packages/mini/krill.pegjs`). A model can place it directly inside `<...>`, which throws `[mini] parse error ... but "|" found` and fails the whole track. Both are now called out explicitly in the system prompt, with defensive auto-fixes in `postProcessStrudelCode()` for when a model still gets them wrong.
- **A compounding `.slow()`/`.fast()` bug that reads as a "static, unevolving" track rather than a crash**: applying `.slow(4)` once when defining a pattern and *again* when using it multiplies rather than adds (16x slower, not 4x) - one generated ambient track had a bassline that, doing the math, held each note for about a minute before changing. Now called out explicitly in the musicality guidelines.
- **`stack()`'s layers written without the commas that separate its function arguments** - found on an unusually long (7-minute, 10-layer) generation that failed with `Unexpected token`/`missing ) after argument list`. `node --check` traced it to the exact spot: each layer's long, heavily-commented chain ended in `)`, then the next layer's `note(...)` began on a fresh line with nothing joining them - every one of the 9 layer boundaries in that file had the same gap, most likely because each layer read as its own paragraph rather than as one entry in a comma-separated argument list. Now an explicit rule in the system prompt (with a right/wrong example), plus a defensive line-based fix in `postProcessStrudelCode()` that detects "chain-ending `)`, then a fresh `note(`/`n(`/`s(`/`sound(`/`stack(` line" and inserts the missing comma - scoped to skip any file using Strudel's `$:` multi-statement syntax, which deliberately has no commas between its top-level patterns. Verified against the real failing file (all 9 boundaries fixed) and regression-tested against all 8 example tracks (no changes - no false positives).
- **The same long generation also hit `MAX_TOKENS` before finishing** its final layer, leaving a dangling comment and no closing brackets. Raised the token budget for both providers (`claude.js` 2000→4000, `openrouter.js` 4000→6000) and added a prompt note to keep per-layer comments brief on long/complex tracks so token budget goes to code, not decorative comment boxes.

## Dynamic instrument/genre-aware generation

The repo had several data modules (`synthesis_presets.js`'s realistic instrument presets, `sounds.js`/`expanded_sounds.js`'s genre sound palettes, `patterns.js`'s pattern templates) that were only reachable through browsing-only API endpoints the frontend never called - the same "built but never wired up" pattern as the removed musical intelligence pipeline, just smaller in scope. Added `backend/prompt_context.js`, which detects instruments and genres actually mentioned in a user's prompt and injects matching real data into *that specific request's* system prompt (via a new `buildSystemPrompt()` in `strudel_prompt.js`) - a generic prompt that mentions nothing specific still gets the exact unmodified base prompt.

Building this surfaced a much bigger problem: **`synthesis_presets.js` and `expanded_sounds.js`'s VCSL/melodic sample documentation were substantially fabricated.** Checked every claimed sample name (`violin`, `cello`, `trumpet`, `saxophone`, `guitar_electric`, `sitar`, `gamelan`, `koto`, `piano_grand`, bare `bass`/`subbass`, and more) against every sample source Strudel actually loads (`vcsl.json`, `Dirt-Samples.json`, `tidal-drum-machines.json`, `mridangam.json`, `piano.json`) - none of those names exist in any of them. Rewrote both files to use real GM soundfont voices instead (`gm_violin`, `gm_cello`, `gm_trumpet`, `gm_tenor_sax`, `gm_acoustic_guitar_steel`, `gm_sitar`, `gm_koto`, etc.), each individually verified against the real GM instrument list before being used. `didgeridoo` was the one sample name that turned out to be genuinely real.

Also fixed while touching these modules:
- `sounds.js`: `isValidSound()`/`getSoundsByCategory('synth')` referenced an undefined `SYNTH_WAVEFORMS`, and `ALL_SOUNDS` was built by spreading arrays into an object literal (producing numeric-index keys, not sound-name keys) - both threw or silently returned wrong data whenever called.
- `patterns.js`: `getPatternsByGenre()`'s `COMPLETE_PATTERNS` branch compared an array to a string with `===`, which is never true - that half of the function was always silently empty.
- Inconsistent genre-key spelling across files (`hiphop` vs `hip-hop`) unified to `hip_hop`, and a missing `drum_and_bass` entry added where it was absent.
- Removed several dead exports found to have zero callers anywhere in the live codebase (`getPresetCode`, `isValidDrumMachine`, `isValidMelodicSample`, `DRUM_BANKS`, a duplicate `getSoundsByCategory`, two redundant `export default` blocks).

## Cleanup

- Removed a large, unused "musical intelligence" pipeline (`claude_enhanced.js` and its dependents) that the frontend never actually called, plus stale planning docs and throwaway test files
- Simplified the Claude response parser: replaced a ~130-line heuristic line-scanner with a straightforward fenced-code-block extraction
- Removed a duplicate "Generate" button and fixed status messages that were overwriting real errors with a false "success"
- Removed unused Prism.js includes from the frontend - nothing ever called `Prism.highlightElement()`, generated code goes straight into the Strudel editor
- Added a `LICENSE` file (AGPL-3.0-or-later, matching Strudel's own license) — the license was referenced in the README but the file itself was missing
