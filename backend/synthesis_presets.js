// synthesis_presets.js - Realistic Instrument Presets
// Every sample name below is a real GM soundfont voice, verified against
// packages/soundfonts/gm.mjs (the actual GM instrument list Strudel loads).
// The previous version of this file used sample names (guitar_electric,
// violin, cello, trumpet, saxophone, sitar, piano_grand, bare "bass", etc.)
// that don't exist in ANY sample set Strudel actually loads - checked
// against vcsl.json, Dirt-Samples.json, tidal-drum-machines.json, and
// piano.json, none of which contain those names. Rewritten to use verified
// gm_* voices instead, keeping the original effects chains (lpf/vibrato/
// room/etc.) which are independently valid Strudel controls.

// GUITAR PRESETS - real GM guitar voices + effects
export const GUITAR_PRESETS = {
  electric: {
    name: "Electric Guitar",
    code: `s("gm_electric_guitar_clean").lpf(sine.range(800,3000).slow(4)).distort(0.3).delay(0.125).gain(0.7)`,
    description: "Clean electric guitar with dynamic filtering, distortion and delay",
    characteristics: ["authentic", "dynamic", "distorted", "spatial"]
  },
  acoustic: {
    name: "Acoustic Guitar",
    code: `s("gm_acoustic_guitar_steel").attack(0.01).decay(0.3).lpf(2000).room(0.4).gain(0.6)`,
    description: "Steel-string acoustic guitar with natural attack and room ambience",
    characteristics: ["warm", "natural", "organic", "intimate"]
  },
  nylon: {
    name: "Nylon String Guitar",
    code: `s("gm_acoustic_guitar_nylon").attack(0.02).lpf(1800).room(0.3).chorus(0.2).gain(0.65)`,
    description: "Classical nylon string guitar with subtle chorus",
    characteristics: ["classical", "warm", "mellow", "refined"]
  },
  chords: {
    name: "Guitar Chords",
    code: `stack(s("gm_electric_guitar_clean").note("c3 e3 g3").lpf(1200), s("gm_electric_guitar_clean").note("c4 e4 g4").attack(0.02)).room(0.3)`,
    description: "Layered guitar chord voicing with bass and treble components",
    characteristics: ["harmonic", "layered", "full", "rich"]
  },
  lead: {
    name: "Lead Guitar",
    code: `s("gm_overdriven_guitar").lpf(sine.range(1200,4000).slow(2)).distort(0.4).delay(0.25).delayfeedback(0.3).gain(0.8)`,
    description: "Expressive overdriven lead guitar with dynamic filtering and delay feedback",
    characteristics: ["expressive", "cutting", "dynamic", "soaring"]
  }
};

// PIANO PRESETS - real GM piano/keys voices
export const PIANO_PRESETS = {
  grand: {
    name: "Grand Piano",
    code: `s("gm_piano").attack(0.01).lpf(4000).room(0.5).gain(0.7)`,
    description: "Acoustic piano with natural room acoustics",
    characteristics: ["rich", "resonant", "classical", "expressive"]
  },
  upright: {
    name: "Upright Piano",
    code: `s("gm_piano").attack(0.02).lpf(3500).room(0.3).gain(0.65)`,
    description: "Same acoustic piano voice with a tighter, more intimate close-mic character",
    characteristics: ["intimate", "warm", "personal", "vintage"]
  },
  electric: {
    name: "Electric Piano",
    code: `s("gm_epiano1").attack(0.01).lpf(2500).chorus(0.3).room(0.4).gain(0.6)`,
    description: "Classic electric piano with chorus and ambience",
    characteristics: ["vintage", "smooth", "soulful", "warm"]
  },
  rhodes: {
    name: "Rhodes-style Piano",
    code: `s("gm_epiano2").attack(0.01).lpf(3000).chorus(0.4).delay(0.125).gain(0.65)`,
    description: "Second electric piano voice with chorus and delay, Rhodes-like character",
    characteristics: ["funky", "bell-like", "vintage", "smooth"]
  }
};

// BRASS PRESETS - real GM brass voices
export const BRASS_PRESETS = {
  trumpet: {
    name: "Trumpet",
    code: `s("gm_trumpet").attack(0.05).lpf(3500).room(0.4).vibrato(4).gain(0.8)`,
    description: "Trumpet with subtle vibrato and room",
    characteristics: ["bright", "cutting", "heroic", "expressive"]
  },
  trombone: {
    name: "Trombone",
    code: `s("gm_trombone").attack(0.08).lpf(2500).room(0.5).gain(0.7)`,
    description: "Deep trombone with natural attack and ambience",
    characteristics: ["deep", "powerful", "smooth", "majestic"]
  },
  horn: {
    name: "French Horn",
    code: `s("gm_french_horn").attack(0.1).lpf(2200).room(0.7).chorus(0.2).gain(0.6)`,
    description: "Warm French horn with orchestral room and subtle chorus",
    characteristics: ["warm", "mellow", "orchestral", "noble"]
  }
};

// STRING PRESETS - real GM string voices
export const STRING_PRESETS = {
  violin: {
    name: "Violin",
    code: `s("gm_violin").attack(0.2).lpf(sine.range(1500,4000).slow(8)).vibrato(6).room(0.6).gain(0.5)`,
    description: "Expressive violin with dynamic filtering and vibrato",
    characteristics: ["expressive", "lyrical", "dynamic", "emotional"]
  },
  viola: {
    name: "Viola",
    code: `s("gm_viola").attack(0.25).lpf(sine.range(1200,3000).slow(8)).vibrato(5).room(0.7).gain(0.55)`,
    description: "Rich viola with slower attack and warm filtering",
    characteristics: ["rich", "warm", "mellow", "expressive"]
  },
  cello: {
    name: "Cello",
    code: `s("gm_cello").attack(0.3).lpf(2000).room(0.8).chorus(0.2).gain(0.6)`,
    description: "Deep cello with slow attack and rich ambience",
    characteristics: ["deep", "rich", "resonant", "emotional"]
  },
  doublebass: {
    name: "Double Bass",
    code: `s("gm_contrabass").attack(0.05).lpf(800).room(0.5).gain(0.7)`,
    description: "Punchy double bass with quick attack",
    characteristics: ["deep", "punchy", "rhythmic", "foundational"]
  },
  section: {
    name: "String Section",
    code: `stack(s("gm_violin").note("c4").attack(0.4), s("gm_viola").note("g3").attack(0.5), s("gm_cello").note("c3").attack(0.6)).lpf(2500).room(0.9).chorus(0.3)`,
    description: "Layered string section with staggered attacks",
    characteristics: ["lush", "cinematic", "layered", "orchestral"]
  }
};

// WOODWIND PRESETS - real GM woodwind voices
export const WOODWIND_PRESETS = {
  flute: {
    name: "Flute",
    code: `s("gm_flute").attack(0.03).lpf(4000).room(0.4).vibrato(3).gain(0.5)`,
    description: "Pure flute with gentle vibrato and natural room",
    characteristics: ["pure", "airy", "ethereal", "gentle"]
  },
  clarinet: {
    name: "Clarinet",
    code: `s("gm_clarinet").attack(0.08).lpf(2800).room(0.5).gain(0.6)`,
    description: "Warm clarinet with natural woody character",
    characteristics: ["woody", "warm", "smooth", "expressive"]
  },
  oboe: {
    name: "Oboe",
    code: `s("gm_oboe").attack(0.06).lpf(3200).room(0.4).vibrato(4).gain(0.65)`,
    description: "Distinctive oboe with characteristic vibrato",
    characteristics: ["nasal", "penetrating", "expressive", "distinctive"]
  },
  saxophone: {
    name: "Saxophone",
    code: `s("gm_tenor_sax").attack(0.08).lpf(2500).vibrato(5).room(0.5).gain(0.7)`,
    description: "Smooth tenor saxophone with expressive vibrato",
    characteristics: ["smooth", "jazzy", "expressive", "soulful"]
  }
};

// WORLD INSTRUMENT PRESETS - real GM ethnic voices, plus one real VCSL sample
export const WORLD_PRESETS = {
  sitar: {
    name: "Sitar",
    code: `s("gm_sitar").attack(0.01).lpf(3000).delay(0.125).room(0.6).gain(0.6)`,
    description: "Indian sitar with natural resonance and delay",
    characteristics: ["exotic", "resonant", "melodic", "mystical"]
  },
  kalimba: {
    name: "Kalimba",
    code: `s("gm_kalimba").attack(0.01).lpf(2500).room(0.4).gain(0.7)`,
    description: "African thumb piano with crisp plucked attack",
    characteristics: ["percussive", "rhythmic", "crisp", "traditional"]
  },
  gamelan: {
    name: "Gamelan-style Bells",
    code: `s("gm_glockenspiel").attack(0.02).lpf(4000).delay(0.25).room(0.8).gain(0.5)`,
    description: "Metallic bell tones approximating gamelan's shimmering resonance (GM has no true gamelan voice)",
    characteristics: ["metallic", "resonant", "exotic", "shimmering"]
  },
  koto: {
    name: "Koto",
    code: `s("gm_koto").attack(0.01).lpf(3500).delay(0.125).room(0.5).gain(0.6)`,
    description: "Japanese koto with delicate plucked character",
    characteristics: ["delicate", "plucked", "traditional", "meditative"]
  },
  didgeridoo: {
    name: "Didgeridoo",
    code: `s("didgeridoo").attack(0.1).lpf(400).room(0.7).gain(0.8)`,
    description: "Australian didgeridoo with deep, droning character (real sample, verified in vcsl.json)",
    characteristics: ["deep", "droning", "primal", "atmospheric"]
  }
};

// COMPREHENSIVE PRESET CATEGORIES - Updated with real samples
export const PRESET_CATEGORIES = {
  guitar: GUITAR_PRESETS,
  piano: PIANO_PRESETS,
  brass: BRASS_PRESETS,
  strings: STRING_PRESETS,
  woodwinds: WOODWIND_PRESETS,
  world: WORLD_PRESETS,
  
  // Additional categories
  drums: {
    acoustic: {
      name: "Acoustic Drums",
      code: `s("bd sd hh oh").bank("AlesisHR16")`,
      description: "Natural acoustic drum kit",
      characteristics: ["natural", "punchy", "organic", "dynamic"]
    },
    electronic: {
      name: "Electronic Drums",
      code: `s("bd sd hh oh").bank("RolandTR909")`,
      description: "Classic electronic drum machine",
      characteristics: ["electronic", "punchy", "precise", "danceable"]
    },
    vintage: {
      name: "Vintage Drums",
      code: `s("bd sd hh oh").bank("LinnDrum")`,
      description: "80s vintage drum machine",
      characteristics: ["vintage", "punchy", "nostalgic", "classic"]
    }
  },
  
  bass: {
    electric: {
      name: "Electric Bass",
      code: `s("gm_electric_bass_finger").attack(0.01).lpf(800).gain(0.8)`,
      description: "Punchy electric bass guitar",
      characteristics: ["punchy", "deep", "rhythmic", "foundational"]
    },
    synth: {
      name: "Synth Bass",
      code: `s("gm_synth_bass_1").attack(0.02).lpf(400).distort(0.1).gain(0.7)`,
      description: "Electronic synthesizer bass",
      characteristics: ["electronic", "deep", "powerful", "modern"]
    }
  }
};

// UTILITY FUNCTIONS
export function getPresetByInstrument(instrument) {
  const category = Object.keys(PRESET_CATEGORIES).find(cat => 
    instrument.toLowerCase().includes(cat) || 
    Object.keys(PRESET_CATEGORIES[cat]).some(preset => 
      instrument.toLowerCase().includes(preset)
    )
  );
  
  if (category) {
    return PRESET_CATEGORIES[category];
  }
  
  return null;
}

export function getAllPresets() {
  const allPresets = {};
  Object.keys(PRESET_CATEGORIES).forEach(category => {
    Object.keys(PRESET_CATEGORIES[category]).forEach(preset => {
      const key = `${category}_${preset}`;
      allPresets[key] = {
        ...PRESET_CATEGORIES[category][preset],
        category,
        preset
      };
    });
  });
  return allPresets;
}

// SYNTHESIS GUIDELINES
export const SYNTHESIS_GUIDELINES = {
  attackRelease: "Always specify attack/release times for realistic instrument behavior",
  frequencyRanges: "Use appropriate frequency ranges for each instrument family", 
  layering: "Layer complementary waveforms for harmonic richness",
  effects: "Apply genre-appropriate effects and processing",
  voiceLeading: "Consider ensemble arrangements with proper voice leading",
  dynamics: "Use gain modulation for expressive dynamics",
  modulation: "Apply subtle modulation for organic, non-static sounds"
};

