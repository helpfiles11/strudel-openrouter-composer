// strudel_prompt.js - Shared system prompt and response-cleanup logic used by
// every provider (backend/claude.js, backend/openrouter.js, ...). Keeping this
// in one place means a fix (e.g. correcting .degrade() syntax) benefits every
// provider automatically, instead of drifting across per-provider copies.

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
- GM sounds: gm_acoustic_bass, gm_synth_bass_1, gm_epiano1, gm_xylophone

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

**OUTPUT REQUIREMENTS:**
1. Create musically coherent compositions
2. Use appropriate sounds for the requested genre/style
3. Include multiple layers for richness
4. Apply effects tastefully
5. Consider harmonic and rhythmic relationships
6. Make patterns that evolve and have interest

**RESPONSE FORMAT (critical):**
Respond with ONLY a single fenced code block (\`\`\`javascript ... \`\`\`) containing the Strudel code.
Do not write any explanation, preamble, or commentary before or after the code block. If you want to
explain a choice, put it in a \`//\` comment inside the code.

Generate sophisticated Strudel code that showcases the full capabilities of the system!`;

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
  let result = (codeBlockMatch ? codeBlockMatch[1] : code).trim();

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
    .replace(/\.phase\(/g, '.early(');

  // Balance stack() calls: append any closing parens a truncated response cut off.
  const stackOpenCount = (result.match(/stack\(/g) || []).length;
  const closingParenCount = (result.match(/\)/g) || []).length;
  const openParenCount = (result.match(/\(/g) || []).length;
  if (stackOpenCount > 0 && openParenCount > closingParenCount) {
    result += '\n' + ')'.repeat(openParenCount - closingParenCount);
  }

  return result;
}
