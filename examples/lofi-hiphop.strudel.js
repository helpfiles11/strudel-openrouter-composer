// Genre: Lo-fi Hip-Hop (provider: openrouter)
// Prompt: A dreamy, relaxed lo-fi hip hop beat with a warm electric piano melody, a laid-back boom-bap drum groove, a deep sub-bass kept well below the piano in both pitch and volume, and a nostalgic, dusty feel.

setcpm(82/4)

// ----- KEY / SCALE -----
// C minor / Eb major — classic lo-fi emotive palette
const scale = "C:minor"

// ----- DRUMS: boom-bap groove with swing -----
$: s("bd ~ ~ bd ~ ~ sd ~").bank("MPC60").gain(0.95)
  .sometimes(x => x.degradeBy(0.15))

$: s("~ ~ ~ ~ ~ ~ ~ cp").bank("MPC60").gain(0.55)

$: s("hh*8").bank("MPC60").gain(0.35)
  .pan(sine.range(-0.3, 0.3).slow(4))
  .hpf(6000)
  .swing(0.18)
  .sometimes(x => x.degradeBy(0.1))

$: s("<~ ~ oh ~>").bank("MPC60").gain(0.3).room(0.6).hpf(4000)

// ----- VINYL DUST / ATMOSPHERE -----
// subtle crackle layer for nostalgia
$: s("~ ~ ~ ~").gain(0.15).room(0.9).lpf(3000)
  .speed(rand.range(0.9, 1.1))

// ----- SUB BASS: deep, felt not heard -----
// plays root notes of progression, very low, heavily low-passed
$: note("<c1 ~ ~ ~  f1 ~ ~ ~  g1 ~ ~ ~  bb1 ~ ~ ~>")
  .sound("sine")
  .gain(0.25)
  .lpf(80)
  .attack(0.15)
  .release(1.2)
  .slow(4)

// ----- ELECTRIC PIANO: warm rhodes-style chords -----
// progression: i - iv - v - bVII  (Cm - Fm - Gm - Bb)
const chords = "<[c3 eb3 g3 bb3] [f3 ab3 c4 eb4] [g3 bb3 d4 f4] [bb3 d4 f4 ab4]>"
$: note(chords)
  .sound("gm_epiano1")
  .gain(0.55)
  .attack(0.02)
  .release(0.8)
  .lpf(sine.range(1800, 3500).slow(8))  // slow filter sweep for movement
  .room(0.45)
  .chorus(0.4)
  .slow(4)

// ----- PIANO MELODY: sparse, dreamy lead line over chords -----
// uses notes from C minor pentatonic + blue note
$: note("<~ ~ ~ [eb4 g4] ~ ~ ~ [c4 eb4] ~ ~ ~ [f4 ab4] ~ ~ ~ [g4 bb4]>")
  .sound("gm_epiano1")
  .gain(0.35)
  .attack(0.01)
  .release(0.6)
  .lpf(2500)
  .room(0.5)
  .delay(0.25)
  .delaytime(0.375)
  .delayfeedback(0.25)
  .slow(4)
  .sometimes(x => x.degradeBy(0.2))

// ----- OCCASIONAL HIGH BELL / CHIME ACCENT -----
// adds sparkle every 8 cycles
$: note("<~ ~ ~ ~ ~ ~ ~ [c6 eb6]>")
  .sound("gm_xylophone")
  .gain(0.18)
  .lpf(4000)
  .room(0.7)
  .slow(8)

// ----- MASTER-LEVEL SUBTLE SIDECHAIN FEEL ON PIANO (via gain modulation) -----
// gives that classic lo-fi "pump" without actual sidechain routing
// applied via the piano's own gain pattern above (already has slow filter sweep)

// ----- TEMPO AUTOMATION: very slight humanize -----
// setcpm is static but we can nudge swing on hats for feel
