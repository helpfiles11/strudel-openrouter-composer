// Genre: Techno (provider: openrouter)
// Prompt: A hypnotic, driving techno track around 135 BPM with a relentless four-on-the-floor kick, a resonant acid bassline, and a slow filter sweep that builds tension over time.

setcpm(135/4)

// Four-on-the-floor kick - relentless and punchy
$: s("bd*4")
  .bank("RolandTR909")
  .gain(0.95)
  .distort(0.15)
  .lpf(80)

// Clap on 2 and 4 with slight variation
$: s("<~ cp ~ cp>")
  .bank("RolandTR909")
  .gain(0.7)
  .room(0.15)
  .hpf(300)

// Hi-hats - 16ths with subtle accent pattern and high-pass movement
$: s("hh*16")
  .bank("RolandTR909")
  .gain(sine.range(0.25, 0.45).slow(2))
  .hpf(perlin.range(5000, 12000).slow(8))
  .pan(sine.slow(16).range(-0.3, 0.3))

// Off-beat open hat for groove
$: s("~ oh ~ oh")
  .bank("RolandTR909")
  .gain(0.35)
  .hpf(6000)
  .room(0.2)

// Acid bassline - classic 303-style pattern in A minor
// Slow filter sweep from dark to bright over 32 cycles (tension build)
$: note("a1 a1 a1 a1  a1 a1 g1 g1  a1 a1 a1 a1  a1 a1 c2 c2")
  .sound("sawtooth")
  .lpf(sine.slow(32).range(180, 2800))  // slow sweep: ~180Hz -> 2.8kHz over 32 cycles
  .gain(0.55)
  .distort(0.35)
  .attack(0.005)
  .decay(0.12)
  .sustain(0.3)
  .release(0.15)
  .room(0.1)

// Sub-bass reinforcement - stays low, supports the acid
$: note("<a0 a0 a0 a0>")
  .sound("sine")
  .gain(0.45)
  .lpf(100)
  .attack(0.02)
  .release(0.3)

// Atmospheric pad - enters slowly, adds harmonic depth
$: note("<a2 c3 e3> <g2 c3 e3> <f2 a2 c3> <e2 g2 b2>")
  .sound("sine")
  .slow(4)
  .gain(sine.range(0, 0.25).slow(16))  // fades in over 16 cycles
  .lpf(800)
  .room(0.6)
  .delay(0.25)
  .delayfeedback(0.3)

// Percussive accent - occasional rim for texture
$: s("~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ ~  ~ ~ ~ [rim]")
  .bank("RolandTR909")
  .gain(0.3)
  .hpf(2000)
  .room(0.2)
  .degradeBy(0.7)
