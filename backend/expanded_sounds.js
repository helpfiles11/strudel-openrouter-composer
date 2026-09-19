// expanded_sounds.js - Comprehensive Strudel Sound Library
// Based on extensive research of Strudel ecosystem (June 2025)
// Includes: tidal-drum-machines, VCSL samples, dough-samples, and more

// MASSIVE DRUM MACHINE COLLECTION
const DRUM_MACHINES = {
  // Classic Roland Machines
  RolandTR808: {
    description: 'Legendary hip-hop/trap drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'rs', 'cb', 'cy', 'ma', 'cl'],
    genres: ['hip-hop', 'trap', 'electronic', 'pop']
  },
  RolandTR909: {
    description: 'House/techno classic drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'rs', 'cb', 'cy', 'rd', 'cr'],
    genres: ['house', 'techno', 'electronic', 'dance']
  },
  RolandTR707: {
    description: 'Digital drum machine with Latin sounds',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'qu', 'ag', 'wh'],
    genres: ['latin', 'electronic', 'pop']
  },
  RolandTR606: {
    description: 'Compact analog drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cy'],
    genres: ['electronic', 'new-wave', 'synth-pop']
  },
  
  // Linn Machines
  LinnDrum: {
    description: 'Classic 80s drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd', 'sh'],
    genres: ['80s', 'pop', 'rock', 'new-wave']
  },
  Linn9000: {
    description: 'Advanced Linn drum machine/sampler',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd', 'lt', 'mt', 'ht'],
    genres: ['80s', 'pop', 'rock', 'funk']
  },
  
  // Akai MPC Series
  MPC60: {
    description: 'Hip-hop production legend',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd'],
    genres: ['hip-hop', 'r&b', 'jazz', 'electronic']
  },
  MPC3000: {
    description: 'Enhanced MPC with better sound quality',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd', 'lt', 'mt', 'ht'],
    genres: ['hip-hop', 'r&b', 'electronic', 'experimental']
  },
  
  // Oberheim
  OberheimDMX: {
    description: 'Early digital drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr'],
    genres: ['early-electronic', 'new-wave', 'experimental']
  },
  
  // Sequential Circuits
  DrumTraks: {
    description: 'Sequential Circuits drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd'],
    genres: ['80s', 'electronic', 'pop']
  },
  
  // E-mu
  EmuSP12: {
    description: 'E-mu SP-12 sampling drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd'],
    genres: ['hip-hop', 'electronic', 'experimental']
  },
  EmuSP1200: {
    description: 'Classic hip-hop sampler',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd', 'lt', 'mt', 'ht'],
    genres: ['hip-hop', 'r&b', 'electronic']
  },
  
  // Alesis
  AlesisHR16: {
    description: 'Affordable digital drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr', 'rd'],
    genres: ['rock', 'pop', 'electronic']
  },
  
  // Boss
  BossDR55: {
    description: 'Early Boss drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb'],
    genres: ['early-electronic', 'experimental']
  },
  BossDR110: {
    description: 'Compact Boss drum machine',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy'],
    genres: ['electronic', 'pop', 'new-wave']
  },
  
  // Yamaha
  YamahaDX5: {
    description: 'Yamaha DX5 drum sounds',
    sounds: ['bd', 'sd', 'hh', 'oh', 'cp', 'cb', 'cy', 'cr'],
    genres: ['80s', 'pop', 'electronic']
  }
};

// VCSL INSTRUMENT SAMPLES (Versilian Community Sample Library).
// Every key below verified against the real vcsl.json sample manifest that
// Strudel actually loads (packages/repl/prebake.mjs -> dough-samples/vcsl.json).
// The previous version of this list (violin, cello, trumpet, saxophone,
// guitar_electric, sitar, gamelan, koto, etc.) did not match VCSL's real
// contents at all - none of those sample names exist in the loaded set, so
// every entry here was replaced with what VCSL actually provides.
const VCSL_INSTRUMENTS = {
  // Percussion
  bongo: 'Bongo drums',
  conga: 'Conga drums',
  darbuka: 'Middle Eastern darbuka',
  framedrum: 'Frame drum',
  cajon: 'Cajon',
  cowbell: 'Cowbell',
  tambourine: 'Tambourine',
  woodblock: 'Woodblock',
  timpani: 'Orchestral timpani',
  timpani_roll: 'Timpani roll',
  snare_modern: 'Modern snare drum',
  snare_rim: 'Snare rim shot',
  tom_mallet: 'Tom with mallet',
  tom_stick: 'Tom with stick',

  // Mallet / tuned percussion
  marimba: 'Marimba',
  vibraphone: 'Vibraphone',
  glockenspiel: 'Glockenspiel',
  balafon: 'African balafon',
  kalimba: 'Kalimba (thumb piano)',
  xylophone_hard_ff: 'Xylophone, hard mallet, loud',
  tubularbells: 'Tubular bells',
  handbells: 'Handbells',

  // Winds
  sax: 'Saxophone',
  saxello: 'Saxello (curved soprano sax)',
  recorder_alto_sus: 'Alto recorder, sustained',
  recorder_bass_sus: 'Bass recorder, sustained',
  harmonica: 'Harmonica',
  ocarina: 'Ocarina',

  // Piano & keys
  piano1: 'Acoustic piano',
  steinway: 'Steinway grand piano',
  fmpiano: 'FM electric piano',
  kawai: 'Kawai electric piano',
  organ_8inch: 'Pipe organ, 8-inch stop',
  pipeorgan_loud: 'Pipe organ, loud registration',

  // Plucked & bowed strings (VCSL has no violin/cello family - these are
  // its actual string-adjacent instruments)
  harp: 'Concert harp',
  folkharp: 'Folk harp',
  psaltery_pluck: 'Plucked psaltery',
  psaltery_bow: 'Bowed psaltery',
  strumstick: 'Strumstick (fretted dulcimer)',
  dantranh: 'Vietnamese monochord zither',

  // World
  didgeridoo: 'Australian didgeridoo'
};

// MELODIC SAMPLES - confirmed against the actual Dirt-Samples.json/piano.json
// manifests Strudel loads (same verified set documented in sounds.js). The
// previous version of this list included many names (rhodes, wurli, pad,
// string, choir, voice, bass, subbass, lead, arp, pluck, noise, vinyl, tape,
// glitch, sitar, tabla, gamelan, koto, granular, fm, am, ring) that don't
// exist in any sample set Strudel actually loads - removed rather than
// guessing at substitutes. For pads/leads/bass, use the real gm_pad_*/
// gm_lead_*/gm_synth_bass_* names documented in strudel_prompt.js instead.
const MELODIC_SAMPLES = {
  piano: 'Acoustic piano samples',
  epiano: 'Electric piano',
  space: 'Spacey synthesizer sounds',
  wind: 'Wind synthesizer',
  metal: 'Metallic synthesizer',
  jazz: 'Jazz synthesizer sounds',
  crow: 'Crow/bird sounds',
  insect: 'Insect sounds',
  numbers: 'Spoken numbers',
  casio: 'Casio-style synthesizer sounds'
};

// COMPREHENSIVE GENRE MAPPING. `melodic`/`effects` arrays trimmed to only
// verified-real sample names (see MELODIC_SAMPLES/VCSL_INSTRUMENTS above) -
// the previous version referenced many names (lead, bass, arp, pad, noise,
// vinyl, tape, glitch, granular, fm, am, ring, guitar_electric, sitar,
// gamelan, koto, choir, string, rhodes, pluck) that don't exist in any
// sample set Strudel loads. Left empty rather than guessing where nothing
// real substitutes; real GM-based leads/bass/pads are documented in
// backend/strudel_prompt.js instead.
const EXPANDED_GENRE_SOUNDS = {
  house: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp'],
    banks: ['RolandTR909', 'RolandTR808'],
    melodic: ['piano', 'epiano'],
    effects: []
  },
  techno: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp', 'cy'],
    banks: ['RolandTR909', 'RolandTR808', 'RolandTR707'],
    melodic: ['metal'],
    effects: []
  },
  hip_hop: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp'],
    banks: ['RolandTR808', 'MPC60', 'MPC3000', 'EmuSP1200'],
    melodic: ['piano', 'epiano', 'jazz'],
    effects: []
  },
  trap: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp'],
    banks: ['RolandTR808', 'MPC60'],
    melodic: ['piano'],
    effects: []
  },
  ambient: {
    drums: ['bd', 'sd', 'hh'],
    banks: ['RolandTR909'],
    melodic: ['space', 'wind', 'piano'],
    effects: []
  },
  jazz: {
    drums: ['bd', 'sd', 'hh', 'oh', 'rd', 'cr'],
    banks: ['LinnDrum', 'AlesisHR16'],
    melodic: ['piano', 'epiano', 'jazz'],
    effects: []
  },
  rock: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cr', 'rd'],
    banks: ['LinnDrum', 'AlesisHR16', 'BossDR110'],
    melodic: ['piano'],
    effects: []
  },
  drum_and_bass: {
    drums: ['bd', 'sd', 'hh', 'cp'],
    banks: ['RolandTR909', 'RolandTR808'],
    melodic: ['metal'],
    effects: []
  },
  electronic: {
    drums: ['bd', 'sd', 'hh', 'oh', 'cp', 'cy'],
    banks: ['RolandTR909', 'RolandTR808', 'RolandTR707'],
    melodic: ['space', 'metal'],
    effects: []
  },
  world: {
    drums: ['bongo', 'conga', 'darbuka', 'framedrum'],
    banks: ['RolandTR707'],
    melodic: ['didgeridoo'],
    effects: []
  },
  experimental: {
    drums: ['bd', 'sd', 'hh', 'perc'],
    banks: ['OberheimDMX', 'EmuSP12'],
    melodic: [],
    effects: []
  }
};

// UTILITY FUNCTIONS
function getAllDrumMachines() {
  return Object.keys(DRUM_MACHINES);
}

function getDrumMachinesByGenre(genre) {
  return Object.entries(DRUM_MACHINES)
    .filter(([name, machine]) => machine.genres.includes(genre))
    .map(([name]) => name);
}

function getSoundsForGenre(genre) {
  const genreData = EXPANDED_GENRE_SOUNDS[genre];
  if (!genreData) return null;
  
  return {
    drums: genreData.drums,
    banks: genreData.banks,
    melodic: genreData.melodic,
    effects: genreData.effects,
    allSounds: [
      ...genreData.drums,
      ...genreData.melodic,
      ...genreData.effects
    ]
  };
}

function getRandomSoundsForGenre(genre, count = 5) {
  const sounds = getSoundsForGenre(genre);
  if (!sounds) return [];
  
  const allSounds = sounds.allSounds;
  const shuffled = allSounds.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// COMPREHENSIVE SOUND LIBRARY EXPORT
const COMPREHENSIVE_SOUND_LIBRARY = {
  drumMachines: DRUM_MACHINES,
  vcslInstruments: VCSL_INSTRUMENTS,
  melodicSamples: MELODIC_SAMPLES,
  genreSounds: EXPANDED_GENRE_SOUNDS,
  
  // Helper methods
  getAllSounds() {
    return {
      ...MELODIC_SAMPLES,
      ...VCSL_INSTRUMENTS
    };
  },
  
  getSoundsByCategory(category) {
    switch(category) {
      case 'drums':
        return Object.keys(DRUM_MACHINES);
      case 'melodic':
        return Object.keys(MELODIC_SAMPLES);
      case 'instruments':
        return Object.keys(VCSL_INSTRUMENTS);
      default:
        return [];
    }
  }
};

export {
  DRUM_MACHINES,
  VCSL_INSTRUMENTS,
  MELODIC_SAMPLES,
  EXPANDED_GENRE_SOUNDS,
  getAllDrumMachines,
  getDrumMachinesByGenre,
  getSoundsForGenre,
  getRandomSoundsForGenre,
  COMPREHENSIVE_SOUND_LIBRARY
};
