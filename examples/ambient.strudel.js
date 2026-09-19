// Genre: Ambient (provider: openrouter)
// Prompt: A calm, spacious ambient soundscape for relaxing or focusing, with slow evolving pads, gentle bell-like textures, soft reverb, and no drums, in a warm major key.

// Calm Ambient Soundscape in C Major
// Warm, spacious, no drums - for relaxation & focus

setcpm(60/4) // Slow, spacious tempo

// ===== ROOT PAD: Slow evolving sine/saw blend =====
$: note("<c2 g1 f1 a1>")
  .sound("sine")
  .slow(16)           // 16-cycle chord progression
  .gain(0.35)
  .lpf(sine.slow(32).range(200, 800))  // Ultra-slow filter sweep
  .attack(4)
  .release(8)
  .room(0.85)
  .delay(0.2)
  .delaytime(0.5)
  .delayfeedback(0.4)

// ===== HARMONIC PAD: Rich sawtooth with voice leading =====
$: note("<c3 e3 g3 c4> <f3 a3 c4 f4> <g3 b3 d4 g4> <a3 c4 e4 a4>")
  .sound("sawtooth")
  .slow(8)
  .gain(0.18)
  .lpf(perlin.slow(16).range(400, 1200))  // Organic filter movement
  .hpf(100)
  .attack(3)
  .release(6)
  .room(0.9)
  .delay(0.15)
  .delaytime(0.75)
  .delayfeedback(0.3)
  .pan(sine.slow(64).range(-0.3, 0.3))   // Imperceptible stereo drift

// ===== SUB BASS: Felt more than heard =====
$: note("<c1 f1 g1 a1>")
  .sound("sine")
  .slow(16)
  .gain(0.25)
  .lpf(150)
  .attack(6)
  .release(10)
  .room(0.6)

// ===== BELL TEXTURES: Sparse, gentle, metallic =====
$: note("<c5 e5 g5> <f5 a5 c6> <g5 b5 d6> <a5 c6 e6>")
  .sound("gm_xylophone")
  .slow(32)              // Very sparse - one chord per 32 cycles
  .degradeBy(0.7)        // Mostly silence, occasional chimes
  .gain(0.4)
  .room(0.95)
  .delay(0.4)
  .delaytime(0.375)
  .delayfeedback(0.5)
  .lpf(3000)
  .pan(rand.range(-0.6, 0.6))

// ===== HIGH SHIMMER: Triangle wave harmonics =====
$: note("<c6 g6 c7> <f6 c7 f7> <g6 d7 g7> <a6 e7 a7>")
  .sound("triangle")
  .slow(64)
  .degradeBy(0.85)
  .gain(0.12)
  .lpf(sine.slow(128).range(2000, 6000))
  .hpf(2000)
  .attack(0.5)
  .release(12)
  .room(0.98)
  .delay(0.5)
  .delaytime(0.25)
  .delayfeedback(0.6)

// ===== TEXTURAL WHISPER: Wind-like noise =====
$: s("~ ~ ~ ~")  // Silent pattern as carrier for noise
  .sound("wind") // If unavailable, falls back gracefully
  .gain(0.08)
  .lpf(perlin.slow(8).range(800, 3000))
  .hpf(400)
  .room(0.7)
  .pan(sine.slow(32).range(-0.5, 0.5))

// ===== SUBTLE MOVEMENT: Occasional harmonic shifts =====
$: note("<c4 e4 g4> <f4 a4 c5> <g4 b4 d5> <a4 c5 e5>")
  .sound("piano")
  .slow(64)
  .degradeBy(0.9)      // Very rare notes
  .gain(0.25)
  .room(0.9)
  .delay(0.3)
  .delaytime(0.5)
  .delayfeedback(0.4)
  .lpf(2000)
  .attack(0.1)
  .release(8)
