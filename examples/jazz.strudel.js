// Genre: Jazz (provider: openrouter)
// Prompt: A cozy, late-night jazz piano trio piece with a walking bassline, swung brushed drums, and a smooth ii-V-I chord progression that feels warm and inviting rather than dissonant.

setcpm(95/4)

// ===== PIANO: Warm comping over ii-V-I in F major =====
$: note("<[Gm7 C7] [FM7 Dm7] [Gm7 C7] [FM7]>")
  .sound("gm_piano")
  .attack(0.01)
  .lpf(3500)
  .room(0.6)
  .gain(0.65)
  .swing(0.35)
  .sometimes(x => x.early(0.08)) // subtle humanization

// ===== WALKING BASS: Upright bass, quarter-note pulse =====
$: note("< G2 Bb2 C3 D3  F2 D2 C2 Bb2   C2 E2 G2 A2  Bb1 A1 G1 E1   F2 A2 C3 D3  E2 D2 C2 A1   D2 F2 G2 A2  C2 A1 G1 F1 >")
  .sound("gm_acoustic_bass")
  .attack(0.02)
  .lpf(800)
  .room(0.3)
  .gain(0.75)
  .swing(0.35)

// ===== BRUSHED DRUMS: Ride pattern + brush snare + soft kick =====
// Ride cymbal: classic swing pattern (spang-a-lang)
$: s("hh*4")
  .bank("AkaiLinn")
  .gain(0.35)
  .room(0.4)
  .hpf(2000)
  .lpf(8000)
  .swing(0.35)
  .pan(-0.3)

// Brush snare on 2 and 4 (swung)
$: s("~ sd ~ sd")
  .bank("AkaiLinn")
  .gain(0.5)
  .room(0.5)
  .lpf(4000)
  .swing(0.35)
  .pan(0.1)

// Soft kick on 1 and 3, occasional ghost
$: s("bd ~ bd ~")
  .bank("AkaiLinn")
  .gain(0.45)
  .room(0.3)
  .lpf(200)
  .swing(0.35)

// Occasional brush sweep / texture
$: s("~ ~ ~ [~ rd]")
  .bank("AkaiLinn")
  .gain(0.25)
  .room(0.6)
  .lpf(6000)
  .swing(0.35)
  .degradeBy(0.7)

// ===== SUBTLE ATMOSPHERE: Very soft pad for warmth =====
$: note("<F2 C3>")
  .sound("gm_pad_warm")
  .slow(4)
  .attack(2)
  .release(3)
  .lpf(1200)
  .room(0.8)
  .gain(0.15)
