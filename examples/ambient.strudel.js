// Genre: Ambient (provider: openrouter)
// Prompt: A calm, spacious ambient soundscape for relaxing or focusing, with slow evolving pads, gentle bell-like textures, soft reverb, and no drums, in a warm major key.

// Calm, spacious ambient soundscape — warm C major, no drums
setcpm(140/4) // ~70 BPM, very slow and breathing

// Slow evolving pad — root and fifth drone with gentle harmonic shifts
$: note("<c2 c2 g2 c2 f2 f2 c2 g2>@4")
  .sound("sawtooth")
  .lpf(sine.slow(16).range(300, 1200))
  .attack(4).release(8)
  .gain(0.35)
  .room(0.9).roomsize(0.9)
  .pan(sine.slow(12).range(0.3, 0.7))

// Warm mid pad — chord tones drifting, low gain, soft filter movement
$: note("<e3 g3 a3 g3 c3 e3 g3 a3>@4")
  .sound("triangle")
  .lpf(sine.slow(10).range(500, 1800))
  .attack(6).release(10)
  .gain(0.22)
  .room(0.85)
  .pan(sine.slow(8).range(0.2, 0.8))

// Gentle bell-like textures — sparse, high, sparkling
$: note("c5 ~ ~ e5 ~ ~ g5 ~ a5 ~ ~ g5 ~ e5 ~ ~")
  .sound("sine")
  .attack(0.01).decay(2).sustain(0.1).release(6)
  .gain(0.18)
  .room(0.95).roomsize(0.95)
  .delay(0.45).delaytime(0.75).delayfeedback(0.5)
  .pan(rand.range(0.15, 0.85))
  .sometimes(rev)

// Second bell layer — different register, even sparser
$: note("~ ~ b4 ~ ~ ~ d5 ~ ~ f5 ~ ~ ~ ~ c5 ~")
  .sound("sine")
  .attack(0.01).decay(3).sustain(0.05).release(8)
  .gain(0.14)
  .room(0.95)
  .delay(0.5).delaytime(1.25).delayfeedback(0.4)
  .pan(rand.range(0.1, 0.9))

// Subtle shimmer — very high faint tones for sparkle
$: note("<c6 e6 g6 c7>@8")
  .sound("sine")
  .attack(8).release(12)
  .gain(0.06)
  .room(0.9)
  .hpf(2000)
  .pan(sine.slow(20).range(0.25, 0.75))

// Slow filter sweep texture — airy movement underneath
$: note("c3 ~ ~ ~ g3 ~ ~ ~")
  .sound("sawtooth")
  .lpf(sine.slow(20).range(200, 600))
  .attack(2).release(6)
  .gain(0.12)
  .room(0.9)
  .pan(0.5)

// Occasional low rumble for warmth and depth
$: note("<c1 c1 g1 c1>@16")
  .sound("sine")
  .attack(6).release(10)
  .gain(0.2)
  .room(0.7)
  .pan(0.5)
