// Genre: Cinematic (provider: openrouter)
// Prompt: A sweeping, emotional cinematic piece featuring soaring strings and a warm french horn melody over a slow, dramatic chord progression.

// Cinematic emotional piece in D minor - slow, sweeping, dramatic
setcpm(72/4)

// Chord progression: Dm - Bb - F - C (i - VI - III - VII) - each chord 4 cycles = 16 cycles total
// Using slow(16) on the chord pattern means each chord lasts 4 cycles at this CPM

// ===== STRINGS ENSEMBLE - lush sustained chords =====
$: note("<d2 f2 a2> <bb1 d2 f2> <f1 a1 c2> <c1 e1 g1>")
  .slow(16)
  .sound("gm_string_ensemble_1")
  .attack(1.5)
  .release(3)
  .lpf(sine.range(800, 3500).slow(16))
  .room(0.85)
  .gain(0.55)

// ===== CELLO BASS - deep foundation =====
$: note("<d1> <bb0> <f0> <c0>")
  .slow(16)
  .sound("gm_cello")
  .attack(1)
  .release(2.5)
  .lpf(400)
  .room(0.6)
  .gain(0.45)

// ===== FRENCH HORN MELODY - soaring, expressive =====
// Melody follows the chord tones with emotional phrasing
$: note("<d4 f4 a4 c5> <bb3 d4 f4 a4> <f3 a3 c4 e4> <c3 e3 g3 c4>")
  .slow(16)
  .sound("gm_french_horn")
  .attack(0.3)
  .release(1.5)
  .lpf(sine.range(1800, 3500).slow(8))
  .room(0.75)
  .chorus(0.15)
  .gain(0.6)

// ===== FRENCH HORN COUNTER-MELODY - responds in the spaces =====
$: note("<~ a4 ~ f4> <~ f4 ~ d4> <~ c4 ~ a3> <~ g3 ~ e3>")
  .slow(16)
  .sound("gm_french_horn")
  .attack(0.4)
  .release(1.2)
  .lpf(2800)
  .room(0.7)
  .gain(0.35)
  .pan(-0.3)

// ===== VIOLIN SOLO - high emotional peaks =====
$: note("<~ ~ ~ a5> <~ ~ ~ f5> <~ ~ ~ c5> <~ ~ ~ g4>")
  .slow(16)
  .sound("gm_violin")
  .attack(0.5)
  .release(2)
  .lpf(sine.range(2000, 5000).slow(16))
  .vibrato(5)
  .room(0.8)
  .gain(0.3)
  .pan(0.4)

// ===== ATMOSPHERIC PAD - subtle texture underneath =====
$: note("<d3 a3 d4> <bb2 f3 bb3> <f2 c3 f3> <c2 g2 c3>")
  .slow(16)
  .sound("gm_pad_warm")
  .attack(3)
  .release(4)
  .lpf(sine.range(600, 2000).slow(32))
  .room(0.9)
  .gain(0.25)

// ===== SUBTLE PERCUSSION TEXTURE - very sparse, cinematic =====
$: s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ perc:2")
  .slow(16)
  .bank("AkaiLinn")
  .gain(0.15)
  .room(0.9)
  .lpf(2000)

// ===== SWELL CRESCENDO - automated filter opening over the full 16-cycle arc =====
// Applied via the lpf modulation on strings/horn already, but adding a global swell feel:
// The sine.range on strings lpf goes 800->3500 over 16 cycles (one full progression)
// The horn lpf goes 1800->3500 over 8 cycles (two swells per progression)
// Violin lpf goes 2000->5000 over 16 cycles
// Pad lpf goes 600->2000 over 32 cycles (super slow)

// ===== MASTER-LEVEL REVERB TAIL - all elements already have room, but this unifies =====
// Strudel applies room per-pattern, which is perfect for orchestral separation
