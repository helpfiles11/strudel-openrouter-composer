// generate_examples.mjs - Regenerates examples/*.strudel.js using whichever
// provider PROVIDER selects in .env (openrouter by default). This is the
// single source of truth for example generation — it calls the real app
// code (backend/provider.js), not a duplicated copy of it.
//
// Optionally pass one or more track filenames (or genre substrings, case
// insensitive) as CLI args to regenerate only those, e.g.:
//   node scripts/generate_examples.mjs ambient lofi cinematic-strings
// With no args, all tracks are regenerated.
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile, mkdir } from 'fs/promises';
import { generateStrudelCode, activeProvider } from '../backend/provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tracks = [
  { file: 'house.strudel.js', genre: 'House', prompt: 'An uplifting, warm house track around 124 BPM with a rolling four-on-the-floor beat, a groovy filtered bassline, bright piano stabs, and airy hi-hats that build energy without feeling harsh.' },
  { file: 'ambient.strudel.js', genre: 'Ambient', prompt: 'A calm, spacious ambient soundscape for relaxing or focusing, with slow evolving pads that noticeably shift every 15-20 seconds (not once every few minutes), gentle bell-like textures, soft reverb, and no drums, in a warm major key.' },
  { file: 'jazz.strudel.js', genre: 'Jazz', prompt: 'A cozy, late-night jazz piano trio piece with a walking bassline, swung brushed drums, and a smooth ii-V-I chord progression that feels warm and inviting rather than dissonant.' },
  { file: 'drum-and-bass.strudel.js', genre: 'Drum & Bass', prompt: 'An energetic but polished liquid drum and bass track around 172 BPM with crisp breakbeats, a deep rolling sub bassline, and a bright, hopeful melodic lead on top.' },

  // Added to exercise backend/prompt_context.js's new genre/instrument
  // detection and injection - each targets a different code path there.
  { file: 'techno.strudel.js', genre: 'Techno', prompt: 'A hypnotic, driving techno track around 135 BPM with a relentless four-on-the-floor kick, a resonant acid bassline, and a slow filter sweep that builds tension over time.' },
  { file: 'trap.strudel.js', genre: 'Trap / Hip-Hop', prompt: 'A modern trap beat with rapid hi-hat rolls, a deep sliding 808 sub bass, and sparse, moody piano stabs.' },
  { file: 'lofi-hiphop.strudel.js', genre: 'Lo-fi Hip-Hop', prompt: 'A dreamy, relaxed lo-fi hip hop beat with a warm electric piano melody, a laid-back boom-bap drum groove, a deep sub-bass kept well below the piano in both pitch and volume, and a nostalgic, dusty feel.' },
  { file: 'cinematic-strings.strudel.js', genre: 'Cinematic', prompt: 'A sweeping, emotional cinematic piece featuring soaring strings and a warm french horn melody over a slow, dramatic chord progression.' },
];

const filters = process.argv.slice(2).map(f => f.toLowerCase());
const selectedTracks = filters.length === 0
  ? tracks
  : tracks.filter(t => filters.some(f => t.file.toLowerCase().includes(f) || t.genre.toLowerCase().includes(f)));

if (filters.length > 0 && selectedTracks.length === 0) {
  console.error(`No tracks matched: ${filters.join(', ')}`);
  console.error(`Available: ${tracks.map(t => t.file).join(', ')}`);
  process.exit(1);
}

const outDir = path.join(__dirname, '..', 'examples');
await mkdir(outDir, { recursive: true });

console.log(`Using provider: ${activeProvider}\n`);

for (const track of selectedTracks) {
  process.stdout.write(`Generating ${track.genre}...\n`);
  try {
    const code = await generateStrudelCode(track.prompt);
    const filePath = path.join(outDir, track.file);
    await writeFile(filePath, `// Genre: ${track.genre} (provider: ${activeProvider})\n// Prompt: ${track.prompt}\n\n${code}\n`);
    process.stdout.write(`  -> wrote examples/${track.file} (${code.length} chars)\n`);
  } catch (err) {
    process.stdout.write(`  -> FAILED: ${err.message}\n`);
  }
}
