// prompt_context.js - Detects instruments/genre mentioned in a user's prompt
// and builds a short addendum of real, verified curated data (instrument
// presets, genre sound palettes, pattern templates) to append to the base
// system prompt for that one request. A generic prompt that matches nothing
// gets an empty addendum, so today's behavior is unchanged for those.
import { PRESET_CATEGORIES } from './synthesis_presets.js';
import { getSoundsForGenre } from './expanded_sounds.js';
import { getPatternsByGenre } from './patterns.js';

// Curated keyword -> PRESET_CATEGORIES key mapping. Deliberately hand-picked
// rather than derived from every preset variant name in synthesis_presets.js
// - several variant keys there (electric, lead, chords, section) are too
// generic and would false-positive on unrelated prompts (e.g. "electric"
// house track has nothing to do with an electric guitar).
const INSTRUMENT_KEYWORDS = {
  guitar: ['guitar'],
  piano: ['piano', 'keys', 'keyboard'],
  strings: ['string', 'violin', 'viola', 'cello', 'double bass', 'orchestral'],
  brass: ['brass', 'trumpet', 'trombone', 'french horn', 'horn'],
  woodwinds: ['flute', 'clarinet', 'oboe', 'saxophone', 'sax', 'woodwind'],
  world: ['sitar', 'kalimba', 'gamelan', 'koto', 'didgeridoo'],
};

const MAX_INSTRUMENT_MATCHES = 2;

/**
 * Finds instruments mentioned in a prompt and returns matching real presets.
 * @param {string} prompt
 * @returns {Array<{category: string, presetKey: string, preset: object}>}
 */
export function detectInstruments(prompt) {
  const lower = prompt.toLowerCase();
  const matches = [];

  for (const [category, keywords] of Object.entries(INSTRUMENT_KEYWORDS)) {
    if (matches.length >= MAX_INSTRUMENT_MATCHES) break;
    if (!keywords.some(kw => lower.includes(kw))) continue;

    const presets = PRESET_CATEGORIES[category];
    if (!presets) continue;

    // If a specific preset variant is also named (e.g. "violin" within the
    // matched "strings" category), use that one; otherwise fall back to the
    // category's first preset as a reasonable default.
    const presetKeys = Object.keys(presets);
    const specificKey = presetKeys.find(key => lower.includes(key.toLowerCase()));
    const presetKey = specificKey || presetKeys[0];

    matches.push({ category, presetKey, preset: presets[presetKey] });
  }

  return matches;
}

// Canonical genre keys, matching backend/strudel_prompt.js's "GENRE
// REFERENCE" section and the now-consistent genre keys across sounds.js/
// expanded_sounds.js/patterns.js. Checked in this fixed order for
// deterministic, single-match detection.
const GENRE_KEYWORDS = [
  ['drum_and_bass', ['drum and bass', 'drum & bass', 'dnb', 'jungle']],
  ['hip_hop', ['hip hop', 'hip-hop', 'hiphop', 'rap', 'trap']],
  ['house', ['house']],
  ['techno', ['techno']],
  ['ambient', ['ambient']],
  ['jazz', ['jazz']],
];

/**
 * Finds the first genre mentioned in a prompt, if any.
 * @param {string} prompt
 * @returns {string|null} one of the canonical genre keys, or null
 */
export function detectGenre(prompt) {
  const lower = prompt.toLowerCase();
  for (const [genre, keywords] of GENRE_KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) return genre;
  }
  return null;
}

/**
 * Builds a short, real-data addendum for the system prompt based on what the
 * user's prompt actually mentions. Returns '' if nothing matched, so a
 * generic prompt falls back to the unmodified base SYSTEM_PROMPT.
 * @param {string} prompt
 * @returns {string}
 */
export function buildPromptAddendum(prompt) {
  const sections = [];

  const instruments = detectInstruments(prompt);
  if (instruments.length > 0) {
    const blocks = instruments.map(({ preset }) =>
      `- ${preset.name}: \`${preset.code}\`\n  (${preset.description})`
    );
    sections.push(`**REAL INSTRUMENT PRESETS FOR THIS REQUEST** (use these exact sample names/technique, or adapt them - they're verified working code):\n${blocks.join('\n')}`);
  }

  const genre = detectGenre(prompt);
  if (genre) {
    const soundPalette = getSoundsForGenre(genre);
    if (soundPalette) {
      const paletteLines = [`Drums: ${soundPalette.drums.join(', ')}`, `Banks: ${soundPalette.banks.join(', ')}`];
      if (soundPalette.melodic.length > 0) paletteLines.push(`Melodic: ${soundPalette.melodic.join(', ')}`);
      sections.push(`**REAL SOUNDS FOR ${genre.toUpperCase().replace(/_/g, ' ')}** (prefer these verified working sounds for this genre):\n${paletteLines.join('\n')}`);
    }

    const genrePatterns = getPatternsByGenre(genre);
    const firstPatternKey = Object.keys(genrePatterns).find(key => key.startsWith('rhythm_'));
    if (firstPatternKey) {
      const pattern = genrePatterns[firstPatternKey];
      sections.push(`**EXAMPLE ${genre.toUpperCase().replace(/_/g, ' ')} PATTERN** (a real, working reference - don't copy verbatim, but match its style/quality):\n\`\`\`\n${pattern.pattern}\n\`\`\``);
    }
  }

  return sections.join('\n\n');
}
