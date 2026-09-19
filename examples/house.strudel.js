// Genre: House (provider: openrouter)
// Prompt: An uplifting, warm house track around 124 BPM with a rolling four-on-the-floor beat, a groovy filtered bassline, bright piano stabs, and airy hi-hats that build energy without feeling harsh.

// Uplifting Warm House - 124 BPM in F Major
setcpm(124/4)

// ===== DRUMS =====
// Four-on-the-floor kick with subtle variation
$: s("bd*4")
  .bank("RolandTR909")
  .gain(0.95)
  .lpf(120)

// Clap on 2 and 4 with occasional layer
$: s("<~ cp ~ cp>")
  .bank("RolandTR909")
  .gain(0.7)
  .hpf(200)
  .room(0.3)
  .sometimes(x => x.stack(s("cp:1").gain(0.3).delay(0.125)))

// Rolling closed hats - 16ths with velocity variation and slow filter opening
$: s("hh*16")
  .bank("RolandTR909")
  .gain(0.35)
  .hpf(sine.slow(32).range(400, 2000))
  .lpf(8000)
  .pan(sine.slow(8).range(-0.3, 0.3))
  .degradeBy(0.08)

// Open hat accents on offbeats - building energy
$: s("<~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ [oh oh]>")
  .bank("RolandTR909")
  .gain(0.4)
  .hpf(800)
  .room(0.6)
  .decay(sine.slow(64).range(0.3, 1.2))

// Subtle percussion groove
$: s("perc:2 ~ ~ perc:2 ~ ~ perc:2 ~ ~ ~ perc:1 ~ ~ ~")
  .bank("RolandTR909")
  .gain(0.25)
  .hpf(500)
  .pan(-0.4)

// ===== BASS =====
// Groovy filtered bassline in F minor pentatonic (works over F major for warmth)
$: note("<f1 ~ ~ f1 ~ ~ f1 c1> <f1 ~ ~ f1 ~ ~ f1 g1> <f1 ~ ~ f1 ~ ~ f1 bb1> <f1 ~ ~ f1 ~ ~ f1 c1>")
  .scale("F:minorPentatonic")
  .sound("gm_synth_bass_1")
  .gain(0.7)
  .lpf(sine.slow(16).range(180, 600))
  .attack(0.02)
  .decay(0.4)
  .sustain(0.3)
  .release(0.5)
  .distort(0.15)

// Sub bass reinforcement
$: note("f0*4")
  .sound("sine")
  .gain(0.4)
  .lpf(80)

// ===== PIANO STABS =====
// Bright piano chords on offbeats - F major progression
$: note("<[F3,A3,C4] ~ [Bb3,D4,F4] ~> <[Gm7] ~ [C7] ~> <[Am7] ~ [Dm7] ~> <[Gm7] ~ [C7] ~>")
  .voicings()
  .sound("piano")
  .gain(0.6)
  .hpf(150)
  .lpf(3000)
  .attack(0.01)
  .decay(0.25)
  .sustain(0.1)
  .release(0.8)
  .room(0.4)
  .delay(0.25)
  .delaytime(0.375)
  .delayfeedback(0.2)

// Higher piano stabs for sparkle
$: note("<[C5,E5,G5] ~ [F5,A5,C6] ~> <[D5,F5,A5] ~ [G5,B5,D6] ~> <[E5,G5,B5] ~ [A5,C6,E6] ~> <[D5,F5,A5] ~ [G5,B5,D6] ~>")
  .sound("piano")
  .gain(0.35)
  .hpf(400)
  .lpf(4000)
  .attack(0.005)
  .decay(0.15)
  .release(0.6)
  .room(0.5)
  .pan(sine.slow(4).range(-0.5, 0.5))

// ===== ATMOSPHERE / PAD =====
// Warm pad underneath - slow filter sweep
$: note("<F2,C3> <Bb2,F3> <G2,D3> <C3,G3>")
  .sound("sawtooth")
  .slow(4)
  .gain(0.25)
  .lpf(sine.slow(32).range(400, 1800))
  .hpf(80)
  .attack(1)
  .release(4)
  .room(0.8)
  .pan(sine.slow(12).range(-0.6, 0.6))

// Airy texture layer
$: s("~ ~ ~ ~")
  .sound("wind")
  .slow(8)
  .gain(0.15)
  .hpf(1000)
  .lpf(6000)
  .room(0.9)
  .pan(sine.slow(16).range(-0.8, 0.8))

// ===== LEAD / ARP (subtle, builds in second half) =====
// Arpeggiated lead - comes in gradually
$: note("<f4 c5 f5 a5> <g4 d5 g5 bb5> <c5 f5 a5 c6> <g4 d5 g5 bb5>")
  .sound("sine")
  .gain(0.18)
  .lpf(sine.slow(64).range(800, 3000))
  .attack(0.05)
  .release(0.8)
  .delay(0.3)
  .delaytime(0.25)
  .delayfeedback(0.25)
  .room(0.5)
  .pan(sine.slow(6).range(-0.4, 0.4))
  .degradeBy(0.1)

// ===== MASTER-LEVEL SHAPING (applied per-pattern above, but could add global) =====
// The track evolves through:
// - Hi-hat filter opening over 32 bars
// - Bass filter sweep over 16 bars  
// - Pad filter sweep over 32 bars
// - Lead arp filtering over 64 bars
// - Occasional degrade on percussion/hats for human feel
// - Delay throws on piano for space
