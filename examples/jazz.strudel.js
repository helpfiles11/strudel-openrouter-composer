// Genre: Jazz (provider: openrouter)
// Prompt: A cozy, late-night jazz piano trio piece with a walking bassline, swung brushed drums, and a smooth ii-V-I chord progression that feels warm and inviting rather than dissonant.

// Cozy Late-Night Jazz Piano Trio in F Major
// ii-V-I progression: Gm7 | C7 | FM7 | Gm7 C7 (turnaround)
// Walking bass, brushed drums, warm piano comping

setcpm(70/4) // Relaxed ballad tempo ~70 BPM

// ===== DRUMS: Brushed swing feel =====
$: s("<~ sd:2 ~ sd:2>").bank("RolandTR808").gain(0.35).hpf(300).lpf(3000).room(0.4).delay(0.15).delaytime(0.25).delayfeedback(0.2)
  // Brushed snare on 2 & 4 (using sd:2 for softer timbre)

$: s("bd*2").bank("RolandTR808").gain(0.25).lpf(200).room(0.3)
  // Light kick on 1 & 3

$: s("hh*4").bank("RolandTR808").gain(0.18).hpf(2000).lpf(6000).room(0.3).pan(sine.slow(4).range(-0.3, 0.3))
  // Soft ride/hat pattern, subtle stereo movement

$: s("oh:1").bank("RolandTR808").gain(0.12).hpf(1500).room(0.5).slow(4)
  // Occasional open hat for texture (every 4 cycles)

// ===== WALKING BASS: Quarter notes outlining changes =====
$: note("g1 b1 d2 f2 | c1 e1 g1 bb1 | f1 a1 c2 e2 | g1 b1 d2 g1")
  .sound("gm_acoustic_bass")
  .gain(0.7)
  .lpf(400)
  .room(0.2)
  .attack(0.02)
  .release(0.4)
  // Walking bass: Gm7 | C7 | FM7 | Gm7 (turnaround to top)

// ===== PIANO COMPING: Warm voicings on off-beats =====
$: note("<[g1 d2 f2 b2] [c1 e1 g1 bb1] [f1 a1 c2 e2] [g1 b1 d2 f2]>")
  .sound("piano")
  .gain(0.55)
  .lpf(sine.slow(8).range(1200, 2500)) // Gentle filter warmth
  .room(0.5)
  .attack(0.03)
  .release(1.2)
  .delay(0.2)
  .delaytime(0.375)
  .delayfeedback(0.25)
  // Chords: Gm7 | C7 | FM7 | Gm7 (voiced for smooth voice-leading)

// ===== PIANO MELODY: Sparse, lyrical fills =====
$: note("~ ~ ~ ~ | ~ ~ f3 ~ | e3 d3 c3 ~ | ~ ~ ~ ~")
  .sound("piano")
  .gain(0.45)
  .lpf(2000)
  .room(0.6)
  .attack(0.02)
  .release(1.5)
  .delay(0.15)
  .delaytime(0.25)
  .delayfeedback(0.2)
  // Simple melodic response in gaps (F major pentatonic-ish)

// ===== SUBTLE ATMOSPHERE: Very quiet pad for warmth =====
$: note("<f2 c3>").sound("sine").slow(4).gain(0.08).lpf(600).room(0.9).attack(2).release(4)
  // Subtle sine pad doubling root/5th, barely audible

// ===== OCCASIONAL VARIATIONS (every 8 cycles) =====
$: s("sd:2*2").bank("RolandTR808").gain(0.25).hpf(300).lpf(3000).room(0.4).every(8, x => x.rev())
  // Snare fill variation

$: note("g1 b1 d2 f2 | c1 e1 g1 bb1 | f1 a1 c2 e2 | d1 f1 a1 c2")
  .sound("gm_acoustic_bass")
  .gain(0.7)
  .lpf(400)
  .room(0.2)
  .every(8, x => x.transpose(12).gain(0.3)) // Octave jump on turnaround occasionally
