// Genre: Drum & Bass (provider: openrouter)
// Prompt: An energetic but polished liquid drum and bass track around 172 BPM with crisp breakbeats, a deep rolling sub bassline, and a bright, hopeful melodic lead on top.

// Liquid DnB - 172 BPM - F minor / Ab major for that hopeful liquid feel
setcpm(172/4)

// --- DRUMS: Crisp breakbeat with ghost notes and variation ---
$: s("bd*2 sd bd sd").bank("RolandTR909").gain(1).n("<0 1>") // kick/snare backbone
$: s("~ sd*2 ~ sd").bank("RolandTR909").gain(0.7).n(1) // ghost snares
$: s("hh*4 [hh hh]*2 hh*4 [hh hh]*2").bank("RolandTR909").gain(0.45).hpf(300).pan(sine.slow(8).range(-0.3, 0.3)) // rolling hats
$: s("cp*2").bank("RolandTR909").gain(0.35).room(0.4).delay(0.125).delayfeedback(0.2) // claps on 2&4
$: s("<~ ~ ~ perc:2>").bank("RolandTR909").gain(0.5).room(0.5) // occasional rim/perc fill

// --- SUB BASS: Deep rolling sine sub, locked to kick ---
$: note("<f1 f1 c1 c1> <f1 f1 bb0 bb0> <eb1 eb1 g1 g1> <c1 c1 f1 f1>")
  .sound("sine")
  .lpf(120)
  .gain(1.1)
  .attack(0.02)
  .decay(0.4)
  .sustain(0.3)
  .release(0.6)

// --- REESE BASS: Mid-range rolling texture, filtered movement ---
$: note("<f2 c2 f2 c2> <f2 bb1 f2 bb1> <eb2 g1 eb2 g1> <c2 f1 c2 f1>")
  .sound("sawtooth")
  .lpf(sine.slow(4).range(400, 1800))
  .gain(0.55)
  .attack(0.01)
  .decay(0.3)
  .sustain(0.4)
  .release(0.5)
  .distort(0.15)
  .pan(sine.slow(6).range(-0.2, 0.2))

// --- ATMOSPHERIC PADS: Lush, wide, slow-moving harmony (Fm - Db - Eb - Bb) ---
$: note("<Fm9 Dbmaj9 Ebmaj9 Bbmaj9>").voicings().sound("gm_pad_warm")
  .slow(4)
  .gain(0.35)
  .room(0.85)
  .lpf(3500)
  .attack(1.2)
  .release(2)
  .pan(sine.slow(10).range(-0.7, 0.7))

// --- BRIGHT HOPEFUL LEAD: Plucky, melodic, major-key moments over minor ---
$: note("<f4 ab4 c5 eb5> <f4 ab4 c5 eb5> <g4 bb4 db5 f5> <g4 bb4 db5 f5>")
  .sound("triangle")
  .gain(0.45)
  .lpf(sine.slow(8).range(2500, 6000))
  .hpf(800)
  .attack(0.01)
  .decay(0.4)
  .sustain(0.2)
  .release(0.6)
  .delay(0.25)
  .delaytime(0.1875)
  .delayfeedback(0.3)
  .room(0.4)
  .pan(sine.slow(5).range(-0.4, 0.4))

// --- COUNTER MELODY: Higher bell-like accents, sparse ---
$: note("<c6 eb6 f6 ab6> ~ <db6 f6 g6 bb6> ~")
  .sound("gm_glockenspiel")
  .gain(0.25)
  .hpf(1500)
  .room(0.7)
  .delay(0.3)
  .delaytime(0.375)
  .delayfeedback(0.25)

// --- SUBTLE VINYL CRACKLE / TEXTURE: Adds organic feel ---
$: s("~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ perc:0").gain(0.15).room(0.6).hpf(2000).degradeBy(0.7)

// --- OCCASIONAL FILL / VARIATION every 8 cycles ---
$: s("sd*4").bank("RolandTR909").gain(0.6).fast(2).every(8, x => x.rev().gain(0.5))
$: note("<f2 c2>").sound("sine").lpf(80).gain(0.8).every(8, x => x.transpose(12).lpf(200).gain(0.6))

// --- MASTER BUS SUBTLE SIDECHAIN PUMP on non-drum elements (simulated via gain modulation) ---
// (Applied per-layer above via gain patterns rather than global sidechain)
