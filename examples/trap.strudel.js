// Genre: Trap / Hip-Hop (provider: openrouter)
// Prompt: A modern trap beat with rapid hi-hat rolls, a deep sliding 808 sub bass, and sparse, moody piano stabs.

// Modern Trap Beat — D minor, 140 BPM
// Layers: 808 sub bass (sliding), trap drums (808 kit), rapid hi-hat rolls, sparse moody piano stabs, atmospheric texture

setcpm(140/4)

// ===== 808 SUB BASS — deep, sliding, locked to D minor =====
$:
  // Sliding 808 using sine wave with pitch glide via n() pattern + portamento feel
  n("<d1 ~ ~ ~  [d1 f1]  ~ ~ ~  [a0 ~ c1]  ~ ~ ~  [g0 ~ bb0]  ~ ~ ~ >")
    .scale("D:minor")
    .sound("sine")
    .gain(1.1)
    .lpf(180)
    .attack(0.01)
    .decay(0.8)
    .sustain(0.3)
    .release(1.2)
    // Slow filter sweep for movement across 8-bar phrase
    .lpf(sine.slow(8).range(120, 300))
    // Subtle pitch drift for analog feel
    .note(sine.slow(16).range(-0.02, 0.02))

// ===== KICK & SNARE — Roland TR-808 style, punchy =====
$:
  s("bd ~ ~ ~  bd bd ~ ~  ~ ~ ~ ~  bd ~ ~ ~")
    .bank("RolandTR808")
    .gain(1.0)
    .lpf(120)
    .attack(0.001)
    .decay(0.6)

$:
  s("~ ~ sd ~  ~ ~ ~ sd  ~ ~ sd ~  ~ ~ ~ ~")
    .bank("RolandTR808")
    .gain(0.85)
    .hpf(150)
    .lpf(4000)
    .decay(0.3)
    // Occasional snare variation every 4 cycles
    .every(4, x => x.cat(s("~ ~ ~ [sd sd]")))

// ===== RAPID HI-HAT ROLLS — 1/32, 1/64 triplets, with humanization =====
$:
  // Main 16th-note hats with velocity variation
  s("hh*16")
    .bank("RolandTR808")
    .gain(0.35)
    .hpf(6000)
    .lpf(14000)
    .pan(sine.slow(4).range(-0.3, 0.3))
    // Degrade for human feel (not too much — keep pocket)
    .degradeBy(0.12)
    // Velocity accents on off-beats
    .gain("<0.35 0.25 0.3 0.28  0.4 0.22 0.35 0.25  0.3 0.28 0.4 0.25  0.35 0.25 0.3 0.28>")

$:
  // Rapid rolls on beat 4 of every 2 bars — 32nd note bursts
  s("<~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ [hh*8]>")
    .bank("RolandTR808")
    .gain(0.28)
    .hpf(7000)
    .lpf(16000)
    .fast(2)
    .pan(0.4)

$:
  // Triplet roll fill every 8 bars
  s("<~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ [hh*12]/3>")
    .bank("RolandTR808")
    .gain(0.22)
    .hpf(8000)
    .fast(3)
    .pan(-0.35)

// ===== SPARSE MOODY PIANO STABS — D minor, rhythmically sparse =====
$:
  // Stabs on beat 1 and the "and" of 3, with occasional suspensions
  n("<d3 ~ ~ ~  ~ ~ f3 ~  ~ ~ ~ ~  ~ ~ g3 ~  >")
    .scale("D:minor")
    .sound("gm_piano")
    .gain(0.65)
    .attack(0.005)
    .decay(0.4)
    .release(1.5)
    .lpf(3500)
    .room(0.6)
    .delay(0.25)
    .delaytime(0.375) // dotted 8th
    .delayfeedback(0.3)
    // Slight harmonic variation every 4 cycles
    .every(4, x => x.transpose(12).gain(0.4).lpf(4500))

$:
  // Lower octave answer phrase — every 4 bars, sparse
  n("<~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ ~  a2 ~ ~ ~ >")
    .scale("D:minor")
    .sound("gm_piano")
    .gain(0.5)
    .attack(0.01)
    .decay(0.6)
    .release(2)
    .lpf(2500)
    .room(0.7)
    .pan(-0.2)

// ===== ATMOSPHERIC TEXTURE — vinyl crackle / dark pad for depth =====
$:
  s("perc").bank("RolandTR808").gain(0.15).lpf(800).room(0.9).slow(4)
  // Or use a slow sine pad for sub-atmosphere
  // note("d1").sound("sine").slow(8).gain(0.15).lpf(80).room(0.9)

// ===== OCCASIONAL EAR CANDY — reverse cymbal swell into bar 1 =====
$:
  s("<~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ ~  crash:1>").bank("RolandTR808")
    .gain(0.4)
    .rev()
    .room(0.5)
    .lpf(sine.range(200, 8000).slow(4))
    .delay(0.3)
    .delaytime(0.25)
