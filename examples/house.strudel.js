// Genre: House (provider: openrouter)
// Prompt: An uplifting, warm house track around 124 BPM with a rolling four-on-the-floor beat, a groovy filtered bassline, bright piano stabs, and airy hi-hats that build energy without feeling harsh.

setcpm(124/4)

// Warm, uplifting house — 124 BPM

// ── Rolling four-on-the-floor kick ─────────────────────────────
$: s("bd*4").bank("RolandTR909")
  .gain(0.9)
  .room(0.15)
  .release(0.35)

// ── Clap on 2 & 4 with subtle layering ────────────────────────
$: s("[~ cp]*2").bank("RolandTR909")
  .gain(0.55)
  .room(0.35)
  .pan(0.5)
  .late(0.005)

// ── Airy hi-hats — open & closed, gentle swing ───────────────
$: s("hh*8").bank("RolandTR909")
  .gain(0.28)
  .pan(sine.slow(8).range(0.35, 0.65))
  .hpf(6000)
  .swing(0.08)

$: s("[~ ~ ~ oh] ~ ~ [~ oh] ~").bank("RolandTR909")
  .gain(0.22)
  .room(0.4)
  .hpf(4000)
  .delay(0.18)
  .pan(0.6)

// ── Groovy filtered bassline — deep & rolling ────────────────
$: note("<c2 c2 g2 a2> <g2 f2 e2 f2>")
  .sound("sawtooth")
  .slow(2)
  .lpf(sine.slow(8).range(180, 600))
  .attack(0.02).decay(0.18).sustain(0.6).release(0.2)
  .gain(0.7)
  .distort(0.15)
  .pan(0.5)

// Sub-bass underpinning for warmth
$: note("<c1 c1 g1 a1> <g1 f1 e1 f1>")
  .sound("sine")
  .slow(2)
  .attack(0.03).release(0.3)
  .gain(0.5)
  .room(0.1)

// ── Bright piano stabs — uplifting chord jabs ────────────────
$: note("<[c4 e4 g4 b4] [c4 e4 g4 a4] [g3 b3 d4 f4] [a3 c4 e4 g4]>")
  .sound("piano")
  .slow(2)
  .gain(0.42)
  .room(0.5)
  .delay(0.22)
  .attack(0.005).release(0.4)
  .pan(sine.slow(4).range(0.4, 0.6))

// Off-beat piano accent for groove
$: note("[~ [f4 a4 c5]]*2")
  .sound("piano")
  .gain(0.3)
  .room(0.45)
  .delay(0.15)
  .release(0.3)
  .late(0.25)

// ── Shimmering top synth pad — airy uplift ───────────────────
$: note("<[e5 g5 b5] [e5 g5 a5] [d5 f5 a5] [c5 e5 g5]>")
  .sound("triangle")
  .slow(4)
  .gain(0.18)
  .room(0.85)
  .delay(0.5)
  .attack(0.8).release(1.5)
  .lpf(8000)
  .hpf(2000)
  .pan(sine.slow(6).range(0.3, 0.7))

// ── Percussive ride / tambourine for energy build ────────────
$: s("[~ perc]*4").bank("RolandTR909")
  .gain(0.2)
  .hpf(5000)
  .swing(0.1)
  .every(8, gain(0.35))

// ── Crash on phrase starts for uplift ────────────────────────
$: s("crash ~ ~ ~ ~ ~ ~ ~").bank("RolandTR909")
  .gain(0.3)
  .room(0.6)
  .hpf(3000)
  .delay(0.3)

// ── Subtle filter sweep on hats for building energy ──────────
$: s("hh*16").bank("RolandTR909")
  .gain(0.15)
  .hpf(sine.slow(16).range(5000, 9000))
  .pan(sine.slow(4).range(0.3, 0.7))
  .sometimes(degradeBy(0.3))
  .every(16, gain(0.25))
