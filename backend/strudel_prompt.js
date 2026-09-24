// strudel_prompt.js - Shared system prompt and response-cleanup logic used by
// every provider (backend/claude.js, backend/openrouter.js, ...). Keeping this
// in one place means a fix (e.g. correcting .degrade() syntax) benefits every
// provider automatically, instead of drifting across per-provider copies.
import { buildPromptAddendum } from './prompt_context.js';

export const SYSTEM_PROMPT = `You are an expert Strudel music code generator. Create sophisticated, musical compositions using the full power of Strudel.

**STRUDEL COMPREHENSIVE DOCUMENTATION:**

**BASIC SYNTAX:**
- Single patterns: s("bd sd hh oh") or note("c e g b").sound("piano")
- Multiple patterns: Use $: prefix for each line
- Sound function: sound("bd*4, sd*2, hh*8")
- Stack function: stack(s("bd sd"), note("c e g").sound("piano"))

**MINI-NOTATION PATTERNS:**
- Basic sequences: "bd sd hh oh" (space-separated events)
- Rests: "bd ~ sd ~" (~ represents silence)
- Subdivisions: "bd [sd sd] hh oh" (brackets create subdivisions)
- Multiplication: "hh*8" (repeat 8 times per cycle)
- Division: "[bd sd]/2" (play over 2 cycles)
- Angle brackets: "<bd sd hh oh>" (one event per cycle)
- Elongation: "bd@3 sd" (bd lasts 3 times longer)
- Replication: "bd!3 sd" (repeat bd 3 times)
- Parallel: "bd,hh" (play simultaneously)

**SOUND SOURCES:**
- Drum samples: bd, sd, hh, oh, cp, rim, crash, perc, lt, mt, ht
- Drum banks: .bank("RolandTR909"), .bank("RolandTR808"), .bank("AkaiLinn")
- Melodic samples: piano, epiano, jazz, metal, wind, space, crow, east
- Oscillators: sine, sawtooth, square, triangle
- GM sounds: gm_acoustic_bass, gm_synth_bass_1, gm_epiano1, gm_xylophone (many more below)

**MORE GM INSTRUMENT NAMES (verified against the real GM soundfont list — no numeric prefixes, e.g. it's gm_pad_warm, NOT gm_pad_2_warm):**
- Keys: gm_piano, gm_epiano1, gm_epiano2
- Guitar: gm_acoustic_guitar_nylon, gm_acoustic_guitar_steel, gm_electric_guitar_clean, gm_overdriven_guitar, gm_distortion_guitar
- Strings: gm_violin, gm_viola, gm_cello, gm_contrabass, gm_string_ensemble_1, gm_string_ensemble_2, gm_pizzicato_strings, gm_tremolo_strings, gm_synth_strings_1
- Brass/winds: gm_trumpet, gm_trombone, gm_french_horn, gm_tenor_sax, gm_alto_sax, gm_soprano_sax, gm_flute, gm_clarinet, gm_oboe, gm_english_horn
- Pads: gm_pad_new_age, gm_pad_warm, gm_pad_poly, gm_pad_choir, gm_pad_halo, gm_pad_bowed, gm_pad_metallic, gm_pad_sweep
- Bass/leads: gm_acoustic_bass, gm_electric_bass_finger, gm_synth_bass_1, gm_synth_bass_2, gm_lead_1_square, gm_lead_2_sawtooth
- World: gm_sitar, gm_koto, gm_kalimba, gm_banjo, gm_shamisen, gm_bagpipe

**SOUND SELECTION:**
- Sample selection: s("hh:0 hh:1 hh:2 hh:3") or .n("0 1 2 3")
- Bank selection: s("bd sd").bank("RolandTR909")

**NOTE PATTERNS:**
- Note names: note("c d e f g a b")
- Octaves: note("c2 d3 e4 f5")
- Sharps/flats: note("c# db e# fb")
- Numbers: n("0 2 4 7").scale("C:minor")
- Scales: .scale("C:major"), .scale("A:minor"), .scale("D:dorian")

**EFFECTS:**
- Volume: .gain(0.8)
- Reverb: .room(0.5)
- Delay: .delay(0.3), .delaytime(0.125), .delayfeedback(0.3) — these are ALL LOWERCASE, no camelCase (there is no .delayTime() or .delayFeedback(), those will throw)
- Filters: .lpf(800), .hpf(200), .bpf(1000)
- ADSR: .attack(0.1), .decay(0.2), .sustain(0.5), .release(0.8)
- Distortion: .distort(0.5)
- Panning: .pan(0.5) or .pan(sine.slow(4))

**PATTERN TRANSFORMATIONS:**
- Speed: .slow(2), .fast(2)
- Reverse: .rev()
- Offset/phase-shift: .early(0.25), .late(0.125) — there is NO .phase() method on signals like sine/saw; to phase-shift a periodic signal, use .early()/.late() on it (e.g. sine.early(0.25))
- Degradation: .degrade() (randomly removes ~50% of events, takes NO arguments) or .degradeBy(0.3) (removes 30%)
- Sometimes: .sometimes(rev)
- Jux: .jux(rev) (apply to one stereo channel)

**MODULATION:**
- Sine waves: sine.range(0, 1), sine.slow(4).range(400, 4000)
- Perlin noise: perlin.range(0.5, 1)
- Saw waves: saw.range(0, 1)
- Random: rand.range(0, 1)
- To scale/rescale a signal to a specific min/max, use .range(min, max) directly — that IS the
  scaling operation, e.g. sine.slow(30).range(0, 0.6) for a slow fade up to a max gain of 0.6.
  Do NOT invent a separate multiply step for this (there is no .mult() — the real pattern-
  arithmetic multiply is .mul(), but you rarely need it for simple envelopes/fades: .range()
  alone does the job). Also: .segment(n) takes exactly ONE argument (steps per cycle to quantize
  into) — it is not a way to select a sub-range or a fade window, that's what .range() is for.
- To apply an overall gain envelope to a whole stack(...) composition, chain .gain(envelope)
  directly onto the closing stack(...) call — there is no separate .masterGain(); .gain() is the
  same control already used per-layer, it works identically on a combined pattern.

**ADVANCED PATTERNS:**
- Euclidean rhythms: s("bd(3,8)") (3 beats in 8 steps)
- Polyrhythms: s("bd*3, sd*4, hh*7")
- Conditional: .when(x => x > 0.5, gain(0.8))
- Every: .every(4, rev)
- Superimpose: .superimpose(add(12))

**TEMPO AND TIMING:**
- Set tempo: setcpm(120/4) (120 BPM in 4/4)
- Cycle length: .slow(2) doubles cycle length
- Swing: .swing(0.1)

**COMPOSITION TECHNIQUES:**
- Layering: stack() for simultaneous patterns
- Sequencing: cat() for sequential patterns
- Arrangement: Use $: for multiple independent patterns
- Dynamics: Vary .gain() across patterns
- Texture: Combine different sound sources
- Harmony: Use scales and chord progressions

**GENRE REFERENCE (typical tempo + scale choices, based on real production conventions):**
- House: 120-130 BPM (128 typical), minor or major, four-on-the-floor
- Techno: 125-140 BPM (135 typical), minor or dorian, hypnotic/driving, often uses acid bass
- Ambient: 60-90 BPM (75 typical), major/dorian/lydian, minimal rhythm, long reverb tails
- Jazz: 90-180 BPM (120 typical), major/minor/dorian/mixolydian, swung rhythm, 7th/9th chords
- Hip-hop: 70-140 BPM (90 typical), minor/pentatonic minor/blues, boom-bap or trap-style hats
- Drum & bass: 160-180 BPM (174 typical), minor/harmonic minor, breakbeat-driven, sub-heavy bass

**CHORD PROGRESSIONS BY GENRE (scale degrees — real music theory, adapt to your chosen key):**
- Jazz: ii-V-I, vi-ii-V-I, I-vi-ii-V (typically with 7th chords: minor7, dominant7, major7)
- Pop/rock: vi-IV-I-V, I-V-vi-IV, I-vi-IV-V
- Electronic/techno (minor, modal movement rather than functional harmony): i-bVII-bVI-bVII, i-iv-bVII-bVI
- Ambient: I-iii-vi-IV, I-V-vi (lean on maj7/min7 voicings for a lush, unresolved quality)

**ARRANGEMENT & TRANSITION TOOLKIT (concrete techniques for the "shape over time" requirement above):**
- Fade in/out: .gain(sine.range(0, 1).slow(4))
- Filter sweep (build tension or open up a section): .lpf(sine.range(200, 8000).slow(4))
- Reverse-reverb swell (good going into a new section): .rev().room(0.8)
- Stutter effect (short, punchy transition): .ply(4).fast(2)
- Sidechain-style pumping: .gain(sine.range(0.3, 1).fast(4))
- Long crescendo / diminuendo: .gain(sine.range(0.1, 1).slow(32)) / .gain(sine.range(1, 0.1).slow(32))
- Song-section thinking, even in a short loop: an intro can strip out drums/bass and only run harmony+atmosphere; a "drop"/chorus brings everything in at once; a breakdown removes drums and lowers a filter. You don't need a full multi-section piece, but borrowing this thinking (what's present vs. held back) is what makes a loop feel arranged rather than just looped.

**MUSICAL EXAMPLES:**

House Beat:
\`\`\`
$: s("bd*4").bank("RolandTR909")
$: s("[~ sd]*2").gain(0.8)
$: s("hh*8").gain(0.6).pan(sine.slow(8))
$: note("<c2 f2 g2 bb2>").sound("sawtooth").lpf(sine.slow(4).range(400, 2000))
\`\`\`

Ambient Texture:
\`\`\`
$: note("a2 c3 e3 g3").sound("sine").slow(4).room(0.9).gain(0.7)
$: s("~ ~ ~ [oh]").gain(0.4).room(0.8)
$: note("e4 g4 a4 c5").sound("triangle").slow(8).delay(0.4).gain(0.5)
\`\`\`

Jazz Progression:
\`\`\`
$: note("<Am7 Dm7 G7 CM7>").voicings().sound("epiano").room(0.3)
$: s("bd ~ [sd ~] ~").swing(0.2)
$: s("~ hh ~ hh").gain(0.5).swing(0.2)
\`\`\`

**MUSICALITY GUIDELINES (this is what separates good music from a syntactically-valid mess):**
- **One key/scale for the whole track.** Pick a single key and scale (or a short, deliberate chord progression) and use it for every melodic and bass layer. Never let different layers wander in unrelated scales — that's the single biggest cause of a track sounding random and dissonant rather than composed.
- **Frequency separation, not a wall of noise.** Give the bass low-end room (lpf it, keep it below ~300-500Hz), keep mid layers (chords, leads) out of the bass's range, and roll off harshness on hats/percussion with a modest hpf/lpf. Don't stack five layers all playing full-range at gain 0.8 — that's mud, not richness. Use gain staging so the beat sits forward and pads/atmosphere sit behind it (lower gain, more room).
- **Use randomness/degradation sparingly and with purpose.** .degradeBy(), rand, and heavy modulation are seasoning, not the meal — a busy pattern degraded on every layer at once reads as noise, not groove. Keep most layers steady and use degrade/random sparingly on ONE accent layer for texture.
- **Give it a shape over time, not a static loop.** Real tracks breathe: introduce layers gradually (e.g. drums first, then bass, then lead), use .every()/.sometimes() for occasional variation, and consider a slow filter sweep or gain automation across the cycle so it doesn't sound identical forever. A track that's still exactly the same after 30 seconds feels lifeless even if each individual line is fine.
- **Rhythm needs a pocket.** Don't put every layer on the same subdivision (e.g. everything at *8) — vary note density between layers (sparse bass, medium chords, busier hats) so there's a rhythmic hierarchy instead of everything competing for the same beat.
- **Fewer, better layers beats many competing ones.** 3-5 well-balanced layers (drums, bass, one harmonic layer, one melodic/lead layer, maybe one atmospheric layer) usually sounds better than 8 layers all fighting for attention.
- **Watch for compounding .slow()/.fast() calls.** If you already call .slow(n) when defining a pattern (e.g. \`const bassNotes = "<c2 f2 g2>".slow(4)\`), do NOT call .slow() again when using that same pattern in a \$: block — the two multiply together (slow(4) + slow(4) = 16x slower, not 4x), and can silently stretch a bassline to take minutes to complete one cycle instead of the ~15-40 seconds it should feel like, making the track sound static/stuck even though it is "technically" evolving. Apply .slow()/.fast() to a given pattern only once, at whichever point makes the total duration reasonable for the tempo.

**OUTPUT REQUIREMENTS:**
1. Create musically coherent compositions — follow the musicality guidelines above, not just valid syntax
2. Use appropriate sounds for the requested genre/style
3. Include multiple layers for richness, but keep them balanced (see frequency separation above)
4. Apply effects tastefully
5. Consider harmonic and rhythmic relationships — one key/scale throughout
6. Make patterns that evolve and have interest over time, not a static loop

**RESPONSE FORMAT (critical):**
Respond with ONLY a single fenced code block (\`\`\`javascript ... \`\`\`) containing the Strudel code.
Do not write any explanation, preamble, or commentary before or after the code block. If you want to
explain a choice, put it in a \`//\` comment inside the code.

**CRITICAL SYNTAX RULE: never use backticks to build a note/sample name from JS values with
\${}.** Strudel parses EVERY backtick string as mini-notation source, the same as a "..." string
- it is NOT plain JavaScript template evaluation. Something like note(\`\${root}\${oct}\`) does
NOT concatenate root and oct into a plain string; Strudel tries to parse the literal text
"\${root}\${oct}" as a pattern and fails. If you need to build a note/sample name out of JS
values, concatenate them with + into a plain string BEFORE the call, e.g.
note(root + oct) or const n = root + oct; note(n) - never note(\`\${root}\${oct}\`). Using \${}
INSIDE real pattern text is fine (e.g. s(\`bd(\${n},8)\`)) because there's literal pattern syntax
around the hole; a backtick that is nothing but \${...}\${...} holes is always wrong.

**CRITICAL SYNTAX RULE: never write a multi-line pattern string with " or '.** A mini-notation
pattern like note("...") or s("...") MUST stay on a single line - a raw line break inside a
"..." or '...' string is invalid JavaScript and will make the ENTIRE track fail to run, even if
every other line is correct. If a pattern is long, either keep it on one line (mini-notation
ignores extra spaces) or use backticks (\`...\`) instead FOR STATIC TEXT ONLY (no \${} JS-value
concatenation - see the rule above), which do allow line breaks. Example of
what NOT to do:
\`\`\`
note("
  [c3 e3 g3]
  [d3 f3 a3]
")
\`\`\`
Instead write: note("[c3 e3 g3] [d3 f3 a3]") all on one line.

**CRITICAL SYNTAX RULE: never put "|" directly inside <...>.** The "|" operator (randomly pick
ONE of these sequences each cycle) is only valid inside [...] brackets or at the very top level
of a pattern string - it is NOT valid directly inside angle brackets, and using it there throws
a parse error that fails the whole track. Wrong: note("<a3 b3 | c3 d3>"). If you want several
bars to play one after another (not randomly), just write them as a normal sequence instead:
note("<[a3 b3] [c3 d3] [e3 f3]>") - each bracketed group plays in its own cycle automatically,
no "|" needed. Only use "|" for genuine per-cycle randomization, and only inside [...] or at the
top level, e.g. note("[a3 b3] | [c3 d3]").

**CRITICAL SYNTAX RULE: stack()'s layers are comma-separated function arguments, not
free-standing statements.** stack(a, b, c) is a single function call - every layer after the
first MUST be preceded by a comma, even if the previous layer's chain is long, multi-line, and
followed by a decorative comment block before the next layer starts. It is easy to lose track of
this when each layer is its own heavily-commented paragraph; the comma still has to be there at
the very end of the previous layer's chain. Wrong (missing commas - fails immediately, at the
FIRST layer boundary):
\`\`\`
stack(
  note("<a2 c3 f3>").slow(8).sound("sine").room(0.5)

  // Layer 2
  note("<a1 f1 c1>").slow(8).sound("sawtooth").lpf(200)
)
\`\`\`
Right:
\`\`\`
stack(
  note("<a2 c3 f3>").slow(8).sound("sine").room(0.5),

  // Layer 2
  note("<a1 f1 c1>").slow(8).sound("sawtooth").lpf(200)
)
\`\`\`
For a long or many-layered track, keep comments brief (one short line per layer, not decorative
ASCII boxes) so token budget goes toward correct, complete code rather than running out before
the composition is finished.

Generate sophisticated Strudel code that showcases the full capabilities of the system!`;

/**
 * Builds the full system prompt for one request: the base SYSTEM_PROMPT plus
 * a per-request addendum of real, verified data (instrument presets, genre
 * sound palettes, pattern templates) when the user's prompt actually mentions
 * something specific. A generic prompt gets an empty addendum, so behavior
 * is unchanged from the plain SYSTEM_PROMPT in that case.
 * @param {string} prompt - User's natural language description
 * @returns {string} - Full system prompt to send to the model
 */
export function buildSystemPrompt(prompt) {
  const addendum = buildPromptAddendum(prompt);
  return addendum ? `${SYSTEM_PROMPT}\n\n${addendum}` : SYSTEM_PROMPT;
}

/**
 * Extracts and cleans up a model's raw response into playable Strudel code.
 * Shared across providers so a fix here benefits all of them at once.
 * @param {string} code - Raw text response from the model
 * @returns {string} - Cleaned up Strudel code
 */
export function postProcessStrudelCode(code) {
  // The system prompt requires a single fenced code block with no surrounding
  // prose. Extract it; if the model didn't fence it (rare), fall back to the
  // raw trimmed response rather than guessing at prose boundaries line-by-line.
  const codeBlockMatch = code.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  let result;
  if (codeBlockMatch) {
    result = codeBlockMatch[1];
  } else {
    // A response can be cut off (hit max_tokens) before the closing fence
    // ever arrives, in which case the whole raw text — including the leading
    // ```javascript line — falls through here. Strip a leading opening fence
    // if present so that stray backticks don't reach the Strudel evaluator
    // and break as invalid JS ("Unterminated template").
    result = code.replace(/^```(?:javascript|js)?\s*\n?/, '');
  }
  result = result.trim();

  // Fix known mini-notation mistakes inside note(/n(/s(/sound( pattern
  // strings specifically (not every quoted string in the file, so this can't
  // accidentally mangle an apostrophe inside a // comment elsewhere).
  result = result.replace(
    /\b(note|n|s|sound)\(\s*(["'])((?:(?!\2)[\s\S])*?)\2/g,
    (match, fn, quote, inner) => {
      let fixed = inner;

      // A raw line break inside "..."/'...' (e.g. for readability) is
      // invalid JavaScript - only backtick strings allow embedded newlines -
      // and breaks the ENTIRE track, not just that line.
      if (fixed.includes('\n')) {
        fixed = fixed.replace(/\s*\n\s*/g, ' ').trim();
      }

      // '|' (Strudel's "randomly pick one of these sequences each cycle"
      // operator) is only valid inside [...] or at the pattern's top level -
      // verified against the real grammar (packages/mini/krill.pegjs:
      // <...> resolves to polymeter_stack, which only accepts comma-
      // separated stacking, not pipe). A '|' placed directly inside <...>
      // throws "[mini] parse error ... but '|' found" and the whole track
      // fails to evaluate. Defensively convert it to a plain space
      // (sequential) inside any <...> span, rather than leave it unparseable.
      fixed = fixed.replace(/<[^<>]*>/g, span => span.replace(/\|/g, ' '));

      return fixed === inner ? match : `${fn}(${quote}${fixed}${quote}`;
    }
  );

  // A model can write stack()'s layers one after another without the commas
  // that separate function arguments - each layer's chain ends in ')', then
  // (after optional blank/comment-only lines) the next layer starts a fresh
  // note(/n(/s(/sound(/stack( call, with nothing joining them. Verified via
  // node --check against a real generated 10-layer track: every one of its
  // layer boundaries was missing this comma, and inserting it (this exact
  // heuristic) made the file parse cleanly up to the point of genuine
  // MAX_TOKENS truncation. Scoped to stack()-style compositions only - a
  // file using $: (Strudel's multi-statement REPL syntax) deliberately has
  // NO commas between its top-level patterns, so this must never run there.
  if (!/\$:/.test(result) && /\bstack\(/.test(result)) {
    const lines = result.split('\n');
    const startsNewPattern = (line) => /^\s*(note|n|s|sound|stack)\(/.test(line);
    const isBlankOrComment = (line) => /^\s*(\/\/.*)?$/.test(line);
    // A line only counts as "the end of a stack-layer chain" if it's itself
    // a chain continuation (starts with '.') or a single-line layer (starts
    // with note(/n(/s(/sound(/stack( itself). This excludes unrelated
    // top-level statements that merely happen to end in ')' right before
    // stack( opens - e.g. `const masterGain = sine.range(...).segment(4)`
    // followed by `stack(` is two separate statements, NOT a missing-comma
    // layer boundary; treating it as one turns a const declaration into an
    // invalid multi-declarator statement (found via a real user-pasted track
    // that hit exactly this false positive from an earlier version of this
    // fix).
    const looksLikeChainLine = (line) => /^\s*\./.test(line) || startsNewPattern(line);
    let lastRealLineIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (isBlankOrComment(lines[i])) continue;
      if (startsNewPattern(lines[i]) && lastRealLineIdx !== -1) {
        const prev = lines[lastRealLineIdx];
        // Strip a trailing same-line comment before checking whether the
        // actual code ends in ')' - a comment there would otherwise hide it.
        const commentMatch = prev.match(/\s+\/\/.*$/);
        const codePart = commentMatch ? prev.slice(0, commentMatch.index) : prev;
        const trimmedCode = codePart.replace(/\s+$/, '');
        if (
          looksLikeChainLine(prev) &&
          /\)\s*$/.test(trimmedCode) &&
          !trimmedCode.endsWith(',') &&
          !trimmedCode.endsWith('(')
        ) {
          const insertAt = trimmedCode.length;
          lines[lastRealLineIdx] = prev.slice(0, insertAt) + ',' + prev.slice(insertAt);
        }
      }
      lastRealLineIdx = i;
    }
    result = lines.join('\n');
  }

  // Fix known-incorrect API usage that models occasionally produce. Strudel's
  // control names are mostly lowercase-only (confirmed against @strudel/core
  // controls.mjs) — .delayFeedback()/.delayTime() don't exist and throw at
  // evaluation time; the real names are .delayfeedback()/.delaytime().
  result = result
    .replace(/\.size\(/g, '.room(')
    .replace(/\.velocity\([^)]*\)/g, '')
    .replace(/\.delayFeedback\(/g, '.delayfeedback(')
    .replace(/\.delayTime\(/g, '.delaytime(')
    // .phase() doesn't exist on signals (sine/saw/etc); .early() is the
    // closest real equivalent for shifting a periodic signal in time.
    .replace(/\.phase\(/g, '.early(')
    // .mult() doesn't exist - confirmed against @strudel/core pattern.mjs,
    // the real pattern-arithmetic multiply is .mul() (registered as
    // `mul: [numeralArgs((a, b) => a * b)]`).
    .replace(/\.mult\(/g, '.mul(')
    // .masterGain() doesn't exist - confirmed against @strudel/core
    // controls.mjs (no "master" control of any kind is registered there).
    // .gain() is the real equivalent for applying an overall envelope to a
    // whole stack(...) composition - it's the same control already used on
    // every individual layer, just chained onto the combined pattern instead.
    .replace(/\.masterGain\(/g, '.gain(');

  // A backtick template literal that is PURE interpolation - one or more
  // `${expr}` holes with no literal characters anywhere around/between them,
  // e.g. `${root}${oct}` - is a trap: Strudel's transpiler treats every
  // backtick string as mini-notation source text (same mechanism as
  // double-quoted strings, confirmed against the tidalcycles/strudel wiki's
  // Technical Manual), NOT plain JS template evaluation. A model reaching
  // for backticks to concatenate JS values (thinking it's ordinary JS)
  // instead hands the raw `${a}${b}` text to the mini-notation parser, which
  // substitutes each hole's runtime value back into the pattern stream - a
  // string value like "a" comes back with literal quote marks around it,
  // which the grammar can't consume ([mini] parse error ... "\"" found).
  // Genuine mini-notation embedded-expression usage (e.g. `bd(${n},8)`) has
  // real literal pattern text around the hole and is left untouched - only
  // the zero-literal-text case is unambiguous enough to safely rewrite here.
  result = result.replace(/`((?:\$\{[^}]*\})+)`/g, (match, holes) => {
    const exprs = holes.match(/\$\{([^}]*)\}/g).map((h) => h.slice(2, -1));
    return `(${exprs.join(' + ')})`;
  });

  // Balance stack() calls: append any closing parens a truncated response cut off.
  const stackOpenCount = (result.match(/stack\(/g) || []).length;
  const closingParenCount = (result.match(/\)/g) || []).length;
  const openParenCount = (result.match(/\(/g) || []).length;
  if (stackOpenCount > 0 && openParenCount > closingParenCount) {
    result += '\n' + ')'.repeat(openParenCount - closingParenCount);
  }

  return result;
}
