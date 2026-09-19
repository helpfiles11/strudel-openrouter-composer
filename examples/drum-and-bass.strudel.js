// Genre: Drum & Bass (provider: openrouter)
// Prompt: An energetic but polished liquid drum and bass track around 172 BPM with crisp breakbeats, a deep rolling sub bassline, and a bright, hopeful melodic lead on top.

// Liquid DnB @ 172 BPM — F Major (bright, hopeful)
// Frequency separation: sub <100Hz, bass 100-300Hz, lead 1-4kHz, hats >6kHz
// Gain staging: drums forward, bass solid, lead present, pads back

setcpm(172/4)

// ── DRUMS: programmed breakbeat with ghost notes & variation ─────────────────
$: s("bd*2 [~ bd] sd*2").bank("RolandTR909").gain(1.0)          // kick/snare backbone
$: s("~ sd ~ [sd sd]").bank("RolandTR909").gain(0.7).degradeBy(0.15) // ghost snares
$: s("hh*16").bank("RolandTR909").gain(0.35).hpf(7000).pan(sine.slow(8).range(-0.3, 0.3)) // 16th hats
$: s("[~ oh]*4").bank("RolandTR909").gain(0.25).hpf(5000).room(0.4) // open hat accents
$: s("cp*2").bank("RolandTR909").gain(0.3).delay(0.15).delaytime(0.25).delayfeedback(0.2) // claps on 2&4

// occasional fill every 8 cycles
$: s("bd sd bd sd bd*4").bank("RolandTR909").gain(0.9).every(8, x => x.rev().fast(2))

// ── SUB BASS: deep rolling sine, locked to kick, filter movement ─────────────
$: note("<f1 [f1 c2] f1 [f1 bb1] f1 [f1 c2] f1 [f1 a1]>")
  .sound("sine")
  .gain(0.85)
  .lpf(sine.slow(4).range(80, 180))          // slow filter sweep
  .attack(0.01)
  .decay(0.15)
  .sustain(0.3)
  .release(0.4)
  .room(0.1)

// ── MID BASS: light texture layer an octave up, subtle distortion ────────────
$: note("<f2 [f2 c3] f2 [f2 bb2] f2 [f2 c3] f2 [f2 a2]>")
  .sound("sawtooth")
  .gain(0.25)
  .lpf(300)
  .hpf(80)
  .distort(0.15)
  .attack(0.02)
  .decay(0.1)
  .sustain(0.2)
  .release(0.3)
  .room(0.15)

// ── LEAD: bright hopeful supersaw melody, F major pentatonic + 9th ──────────
$: note("<f4 a4 c5 f5 a5> [c5 a4 f4 a4] <f4 a4 c5 f5 g5> [a4 f4 c5 a4]")
  .sound("sawtooth")
  .gain(0.45)
  .lpf(sine.slow(6).range(1800, 3500))       // bright filter motion
  .hpf(400)
  .attack(0.03)
  .decay(0.2)
  .sustain(0.4)
  .release(0.6)
  .delay(0.3)
  .delaytime(0.125)
  .delayfeedback(0.25)
  .room(0.35)
  .pan(sine.slow(12).range(-0.4, 0.4))
  .every(4, x => x.transpose(12))            // occasional octave jump

// ── PAD: warm sustained chords behind lead, very back in mix ────────────────
$: note("<Fmaj7 Am7 Gm7 C9>").voicings()
  .sound("sine")
  .slow(2)
  .gain(0.18)
  .lpf(800)
  .attack(0.8)
  .release(1.5)
  .room(0.7)
  .pan(sine.slow(3).range(-0.6, 0.6))

// ── ATMOSPHERE: sparse high shimmer, random but musical ─────────────────────
$: note("<f5 a5 c6 f6>").sound("triangle")
  .gain(0.12)
  .degradeBy(0.7)
  .fast(2)
  .lpf(6000)
  .hpf(3000)
  .delay(0.5)
  .delaytime(0.375)
  .delayfeedback(0.4)
  .room(0.8)
  .pan(rand.range(-1, 1))

// ── SUBTLE VINYL CRACKLE TEXTURE (optional warmth) ──────────────────────────
// $: s("perc").bank("AkaiLinn").gain(0.05).degradeBy(0.9).room(0.5).hpf(2000)
