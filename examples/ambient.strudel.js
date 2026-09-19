// Genre: Ambient (provider: openrouter)
// Prompt: A calm, spacious ambient soundscape for relaxing or focusing, with slow evolving pads that noticeably shift every 15-20 seconds (not once every few minutes), gentle bell-like textures, soft reverb, and no drums, in a warm major key.

// Calm, spacious ambient soundscape - warm C major
// Pads evolve every ~16-20 seconds, gentle bell textures, no drums

setcpm(50/4)

// Root key: C major - all layers share this harmonic foundation
const root = "c2"
const scale = "C:major"

// ---- LAYER 1: Deep warm pad foundation (slow chord progression, 16-sec cycle) ----
$: note("<c2 f2 g2 a1>") // C - F - G - Am (slow IV-V-vi movement)
  .slow(4)                    // 4 cycles per chord = ~19 sec per chord at 50 BPM
  .sound("gm_pad_warm")
  .gain(0.35)
  .room(0.85)
  .lpf(sine.range(400, 1200).slow(8))  // Very slow filter sweep (32 cycles = ~2.5 min)
  .attack(2)
  .release(4)
  .sustain(0.7)

// ---- LAYER 2: Mid pad with gentle movement (8-sec chord changes) ----
$: note("<c3 e3 g3> [f3 a3 c4] [g3 d4] [a3 e4]") // Cmaj, Fmaj, Gsus2, Am7
  .slow(2)                    // 2 cycles per chord = ~10 sec per chord
  .sound("gm_pad_new_age")
  .gain(0.25)
  .room(0.8)
  .hpf(150)
  .lpf(sine.range(800, 2500).slow(6))
  .attack(1.5)
  .release(3)
  .pan(sine.slow(12).range(-0.3, 0.3))  // Ultra-slow stereo drift

// ---- LAYER 3: High shimmer pad (ethereal, very slow) ----
$: note("<c4 e4 g4 c5> [f4 a4 c5] [g4 d5] [a4 e5]")
  .slow(8)                    // 8 cycles per chord = ~38 sec per chord
  .sound("sine")
  .gain(0.15)
  .room(0.9)
  .lpf(sine.range(2000, 6000).slow(16))
  .attack(3)
  .release(6)
  .delay(0.4)
  .delaytime(0.5)
  .delayfeedback(0.4)

// ---- LAYER 4: Gentle bell-like textures (sparse, evolving) ----
// Using gm_glockenspiel for bell tone, with perlin-controlled timing
$: note("c5 e5 g5 c6 e6 g6 c7")
  .slow(16)                   // One note every 16 cycles (~77 sec per full sequence)
  .sound("gm_glockenspiel")
  .gain(perlin.range(0.15, 0.35).slow(4))  // Perlin modulates velocity
  .room(0.7)
  .lpf(4000)
  .attack(0.02)
  .release(3)
  .delay(0.3)
  .delaytime(0.375)
  .delayfeedback(0.25)
  .degradeBy(0.6)            // Only ~40% of notes trigger - sparse, organic

// ---- LAYER 5: Celesta-like high bells (different rhythm) ----
$: note("<e5 g5 c6 e6> [a5 c6 e6] [d6 g6] [e6 a6]")
  .slow(6)                    // Chord change every 6 cycles (~29 sec)
  .sound("gm_celesta")
  .gain(perlin.range(0.1, 0.25).slow(5))
  .room(0.6)
  .hpf(800)
  .lpf(5000)
  .attack(0.01)
  .release(2.5)
  .pan(sine.slow(7).range(-0.5, 0.5))
  .degradeBy(0.7)

// ---- LAYER 6: Subtle atmospheric texture (wind/space-like) ----
$: s("~ ~ ~ ~")              // Silent pattern as carrier for modulated noise
  .sound("wind")             // Using wind sample as texture source
  .gain(sine.range(0.02, 0.08).slow(10))   // Very slow swell (10 cycles = ~48 sec)
  .room(0.95)
  .lpf(sine.range(300, 1500).slow(12))
  .hpf(100)
  .delay(0.5)
  .delaytime(0.75)
  .delayfeedback(0.5)

// ---- LAYER 7: Sub-bass drone (felt more than heard) ----
$: note("c1")
  .sound("sine")
  .gain(0.12)
  .lpf(80)
  .room(0.4)
  .attack(8)
  .release(8)
  .sustain(0.9)

// ---- LAYER 8: Occasional harmonic sparkle (very sparse) ----
$: note("c6 e6 g6 c7 e7")
  .slow(24)                   // Extremely slow - one note every ~2 min
  .sound("triangle")
  .gain(rand.range(0.08, 0.18))
  .room(0.8)
  .lpf(3000)
  .attack(0.5)
  .release(5)
  .delay(0.25)
  .delaytime(0.5)
  .delayfeedback(0.3)
  .degradeBy(0.85)           // Only ~15% trigger - rare magical moments
  .pan(rand.range(-0.6, 0.6))
