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

## Cleanup

- Removed a large, unused "musical intelligence" pipeline (`claude_enhanced.js` and its dependents) that the frontend never actually called, plus stale planning docs and throwaway test files
- Simplified the Claude response parser: replaced a ~130-line heuristic line-scanner with a straightforward fenced-code-block extraction
- Removed a duplicate "Generate" button and fixed status messages that were overwriting real errors with a false "success"
- Added a `LICENSE` file (AGPL-3.0-or-later, matching Strudel's own license) — the license was referenced in the README but the file itself was missing
