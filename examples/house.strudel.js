// Genre: House (provider: openrouter)
// Prompt: An uplifting, warm house track around 124 BPM with a rolling four-on-the-floor beat, a groovy filtered bassline, bright piano stabs, and airy hi-hats that build energy without feeling harsh.

// Uplifting Warm House — 124 BPM, A minor
// Rolling four-on-the-floor, groovy filtered bass, bright piano stabs, airy hats with energy build

setcpm(124/4)

// --- DRUMS ---------------------------------------------------------------
// Kick: solid four-on-the-floor with subtle velocity variation
$:
  s("bd*4")
  .bank("RolandTR909")
  .gain(0.95)
  .lpf(80)

// Clap/Snare on 2 & 4 with occasional ghost hit
$:
  s("<~ cp ~ cp> <~ cp ~ [cp cp]>") // variation every 4 bars
  .bank("RolandTR909")
  .gain(0.7)
  .room(0.25)
  .hpf(200)

// Closed hats: 16ths with slow filter opening over 32 cycles (energy build)
$:
  s("hh*16")
  .bank("RolandTR909")
  .gain(0.35)
  .hpf(300)
  .lpf(sine.range(3000, 12000).slow(32)) // gradual brightening
  .pan(sine.slow(8).range(-0.3, 0.3))

// Open hats on off-beats for groove, filtered to avoid harshness
$:
  s("~ oh ~ oh ~ oh ~ oh")
  .bank("RolandTR909")
  .gain(0.28)
  .hpf(400)
  .lpf(6000)
  .room(0.4)
  .decay(0.3)

// Subtle ride/cymbal texture every 8 bars for lift
$:
  s("<~ ~ ~ ~ ~ ~ ~ crash>").bank("RolandTR909").gain(0.4).room(0.6).hpf(800)

// --- BASS -----------------------------------------------------------------
// Rolling 16th-note bassline in A minor, filtered with envelope movement
$:
  note("<a1 a1 a1 a1  g1 g1 g1 g1  f1 f1 f1 f1  e1 e1 e1 e1>")
  .sound("gm_synth_bass_1")
  .gain(0.7)
  .lpf(sine.range(180, 600).slow(4)) // filter grooves per bar
  .attack(0.01)
  .decay(0.15)
  .sustain(0.3)
  .release(0.2)
  .distort(0.15)

// Sub-bass reinforcement (sine) for weight
$:
  note("<a0 a0 a0 a0  g0 g0 g0 g0  f0 f0 f0 f0  e0 e0 e0 e0>")
  .sound("sine")
  .gain(0.45)
  .lpf(80)
  .attack(0.02)
  .release(0.3)

// --- PIANO STABS ----------------------------------------------------------
// Bright, rhythmic piano chords (Amin9, Fmaj9, Cmaj9, G9) — uplifting progression
$:
  note("<Am9 Fmaj9 Cmaj9 G9>")
  .sound("gm_piano")
  .gain(0.55)
  .attack(0.005)
  .release(0.25)
  .lpf(sine.range(2500, 6000).slow(8)) // filter breathes with the track
  .room(0.35)
  .delay(0.125)
  .delayfeedback(0.2)
  .delaytime(0.375)

// Higher octave stab answer — adds sparkle, plays every 2 bars offset
$:
  note("<~ ~ ~ ~  c4 e4 g4 b4  ~ ~ ~ ~  e4 g4 b4 d5>")
  .sound("gm_piano")
  .gain(0.35)
  .attack(0.003)
  .release(0.15)
  .hpf(800)
  .lpf(8000)
  .room(0.4)
  .delay(0.18)
  .delaytime(0.25)

// --- ATMOSPHERE / PAD -----------------------------------------------------
// Warm pad swelling slowly underneath, adds depth without clutter
$:
  note("<a2 c3 e3 g3  f2 a2 c3 e3  c2 e2 g2 b2  g1 b1 d2 f2>")
  .sound("gm_pad_warm")
  .slow(4)
  .gain(0.25)
  .room(0.7)
  .attack(1.5)
  .release(2)
  .lpf(sine.range(800, 3500).slow(16))
  .pan(sine.slow(6).range(-0.5, 0.5))

// --- TRANSITION / EAR CANDY ----------------------------------------------
// Occasional vocal chop / texture hit every 16 bars
$:
  s("<~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ perc>")
  .bank("RolandTR909")
  .n("<0 1 2 3>")
  .gain(0.3)
  .room(0.5)
  .hpf(1000)
  .lpf(5000)

// Filter sweep riser every 32 cycles (big section marker)
$:
  s("<~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ crash>")
  .bank("RolandTR909")
  .gain(0.5)
  .room(0.8)
  .lpf(sine.range(200, 12000).slow(32))
  .hpf(sine.range(20, 500).slow(32))
