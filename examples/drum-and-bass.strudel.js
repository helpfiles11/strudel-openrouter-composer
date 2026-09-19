// Genre: Drum & Bass (provider: openrouter)
// Prompt: An energetic but polished liquid drum and bass track around 172 BPM with crisp breakbeats, a deep rolling sub bassline, and a bright, hopeful melodic lead on top.

setcpm(172/4)

// ── Crisp breakbeat layer ──
$: s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR909").gain(0.9)
$: s("[~ sd]*2").bank("RolandTR909").gain(0.75).pan(0.4)
$: s("hh*8").bank("RolandTR909").gain(0.45).pan(sine.slow(2).range(0.3,0.7))
$: s("oh*4").bank("RolandTR909").gain(0.35).room(0.2).pan(sine.slow(4).range(0.6,0.9))
$: s("[~ ~ ~ [hh:2 ~]]").bank("RolandTR909").gain(0.5).swing(0.08)

// ── Deep rolling sub bassline ──
$: note("<a1 e2 c2 g1>*2").sound("sine").sustain(0.8).release(0.2).gain(0.85)
  .lpf(sine.slow(8).range(80, 160))
$: note("<a1 a1 e2 e2 c2 c2 g1 g1>").sound("sine").sustain(0.4).release(0.1).gain(0.6)
  .late(0.25).degradeBy(0.3)

// ── Bright hopeful melodic lead ──
$: note("<a4 c5 e5 g5> <b4 d5 e5 a5> <c5 e5 g5 c6> <b4 d5 g5 b5>")
  .sound("sawtooth").gain(0.4).room(0.35).delay(0.25).delaytime(0.375)
  .lpf(sine.slow(4).range(2000, 6000))
  .attack(0.02).release(0.4).pan(sine.slow(6).range(0.35,0.65))
  .superimpose(x => x.add(12).gain(0.2).sound("triangle"))

// ── Arpeggiated sparkle layer ──
$: note("a5 c6 e6 g6").sound("triangle").fast(4).gain(0.25)
  .room(0.5).delay(0.3).delaytime(0.375).delayfb(0.4)
  .lpf(8000).hpf(2000).degradeBy(0.2)
  .every(8, rev).every(4, x => x.add(7))

// ── Atmospheric pad ──
$: note("<a3 c4 e4 g4>").sound("sine").slow(4).gain(0.3).room(0.8)
  .attack(1.5).release(2).lpf(sine.slow(16).range(400, 1200))
  .pan(sine.slow(10).range(0.2, 0.8))

// ── Percussive fills & accents ──
$: s("[~ ~ ~ ~ ~ ~ ~ [cp ~]]").bank("RolandTR909").gain(0.5).room(0.4).every(4, rev)
$: s("rim*3").bank("RolandTR909").gain(0.3).fast(2).every(7, x => x.slow(2))
  .pan(sine.slow(3).range(0.2,0.8)).degradeBy(0.4)

// ── Crash on phrase boundaries ──
$: s("crash").bank("RolandTR909").gain(0.3).room(0.6).slow(4).late(0.5)
  .hpf(3000).pan(sine.slow(8).range(0.3,0.7))
