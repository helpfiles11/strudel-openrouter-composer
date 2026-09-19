// sounds.js - Modern Strudel sound library (v2.0)
// Based on official Strudel documentation analysis (June 2025)

// DRUM SAMPLES - Core drum sounds confirmed working
export const DRUM_SAMPLES = {
  // Basic drums (confirmed working)
  bd: 'Bass drum',
  sd: 'Snare drum', 
  hh: 'Hi-hat',
  oh: 'Open hi-hat',
  cp: 'Clap',
  rim: 'Rimshot',
  
  // Extended drums (confirmed in docs)
  lt: 'Low tom',
  mt: 'Middle tom', 
  ht: 'High tom',
  rd: 'Ride cymbal',
  cr: 'Crash cymbal',
  
  // Legacy aliases (still working)
  kick: 'Kick drum variations',
  snare: 'Snare variations',
  hat: 'Hat variations',
  crash: 'Crash cymbal',
  ride: 'Ride cymbal',
  tom: 'Tom drums',
  
  // Electronic drums
  drum: 'Electronic drum kit',
  electro: 'Electro drum sounds',
  tech: 'Techno drums',
  house: 'House drums',
  
  // World percussion
  tabla: 'Indian tabla',
  bongo: 'Bongo drums',
  conga: 'Conga drums',
  djembe: 'Djembe',
  
  // Specialty
  perc: 'Percussion sounds',
  click: 'Click sounds',
  tick: 'Tick sounds'
};

// MELODIC SAMPLES - Confirmed working melodic sounds
export const MELODIC_SAMPLES = [
  // Confirmed working melodic samples
  'piano', 'epiano', 'casio', 'metal', 'jazz', 'wind', 'east', 'crow', 'space', 'numbers', 'insect'
  
  // NOTE: For atmospheric textures, use synthesis with effects:
  // triangle.room(0.8).lpf(400) for warm pads
  // square.room(0.9).delay(0.5) for ambient textures  
  // sine.slow(8).room(0.7) for atmospheric drones
];

// GM Sounds (General MIDI) - CONFIRMED WORKING ONLY
export const GM_SOUNDS = [
  // Bass sounds (confirmed working)
  'gm_acoustic_bass',
  'gm_synth_bass_1',
  'gm_synth_bass_2',

  // Lead sounds (confirmed working)
  'gm_lead_1_square',
  'gm_lead_2_sawtooth',

  // Piano/Keys (confirmed working)
  'gm_epiano1',
  'gm_xylophone'

  // NOTE: GM pad sounds DO exist (verified against the real GM soundfont
  // source, packages/soundfonts/gm.mjs) but WITHOUT a numeric prefix, e.g.
  // gm_pad_warm, NOT gm_pad_2_warm. See GENRE_SOUNDS below for real examples.
];

// Oscillator waveforms registered by Strudel's synth engine (verified against
// packages/superdough/synth.mjs's registerSynthSounds()).
export const SYNTH_WAVEFORMS = ['sine', 'sawtooth', 'square', 'triangle'];

// Combine all sounds for validation. MELODIC_SAMPLES/GM_SOUNDS are arrays, so
// they're converted to name->name entries here rather than spread directly
// (spreading an array into an object literal produces numeric-index keys,
// not the sound-name keys this map and /api/sounds's consumers need).
export const ALL_SOUNDS = {
  ...DRUM_SAMPLES,
  ...Object.fromEntries(MELODIC_SAMPLES.map(name => [name, name])),
  ...Object.fromEntries(GM_SOUNDS.map(name => [name, name]))
};

// Get sounds by genre
export function getSoundsByGenre(genre) {
  return GENRE_SOUNDS[genre] || null;
}

// Validate if a sound exists
export function isValidSound(sound) {
  return sound in ALL_SOUNDS || SYNTH_WAVEFORMS.includes(sound);
}

// MODERN GENRE MAPPING - Updated with drum banks and confirmed sounds.
// All GM names below verified against the real GM soundfont source
// (packages/soundfonts/gm.mjs) - the original data used several names that
// don't exist (gm_pad_1_new_age, gm_electric_piano_1, gm_acoustic_grand_piano,
// bare 'subbass'), now corrected to their real equivalents.
export const GENRE_SOUNDS = {
  house: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp'],
    drumBank: 'RolandTR909',
    bass: ['gm_synth_bass_1', 'gm_acoustic_bass'],
    leads: ['gm_lead_2_sawtooth', 'triangle'],
    pads: ['gm_pad_new_age', 'square'],
    effects: ['space', 'wind']
  },

  techno: {
    drums: ['bd', 'sd', 'hh', 'cp', 'perc'],
    drumBank: 'RolandTR909',
    bass: ['gm_synth_bass_2', 'sawtooth'],
    leads: ['gm_lead_1_square', 'gm_lead_2_sawtooth'],
    pads: ['gm_pad_warm', 'triangle'],
    effects: ['metal', 'space']
  },

  hip_hop: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp'],
    drumBank: 'RolandTR808',
    bass: ['gm_synth_bass_1', 'sine'],
    leads: ['gm_lead_1_square', 'piano'],
    melodic: ['gm_epiano1', 'jazz'],
    effects: ['numbers', 'crow']
  },

  ambient: {
    drums: ['perc', 'click', 'tick'],
    drumBank: 'ViscoSpaceDrum',
    bass: ['gm_acoustic_bass', 'sine'],
    pads: ['gm_pad_new_age', 'gm_pad_warm'],
    melodic: ['gm_xylophone', 'wind', 'space'],
    effects: ['insect', 'east']
  },

  jazz: {
    drums: ['bd', 'sd', 'hh', 'ride', 'brush'],
    drumBank: 'AkaiLinn',
    bass: ['gm_acoustic_bass', 'gm_electric_bass_finger'],
    piano: ['gm_piano', 'gm_epiano1'],
    brass: ['gm_trumpet', 'gm_trombone', 'gm_alto_sax'],
    strings: ['gm_string_ensemble_1', 'gm_violin'],
    effects: ['jazz', 'numbers']
  },

  drum_and_bass: {
    drums: ['bd', 'sd', 'hh', 'cp', 'perc'],
    drumBank: 'RolandTR909',
    bass: ['gm_synth_bass_2', 'sawtooth'],
    leads: ['gm_lead_1_square', 'gm_lead_2_sawtooth'],
    effects: ['metal', 'space']
  },

  electronic: {
    drums: ['electro', 'tech', 'house', 'bd', 'sd'],
    drumBank: 'RolandTR707',
    bass: ['gm_synth_bass_1', 'gm_synth_bass_2'],
    leads: ['gm_lead_1_square', 'gm_lead_2_sawtooth'],
    synth: ['triangle', 'sawtooth', 'square'],
    effects: ['metal', 'space', 'casio']
  }
};
