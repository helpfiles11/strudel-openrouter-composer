// generate_examples.mjs - Regenerates examples/*.strudel.js using whichever
// provider PROVIDER selects in .env (openrouter by default). This is the
// single source of truth for example generation — it calls the real app
// code (backend/provider.js), not a duplicated copy of it.
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFile, mkdir } from 'fs/promises';
import { generateStrudelCode, activeProvider } from '../backend/provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const tracks = [
  { file: 'house.strudel.js', genre: 'House', prompt: 'An uplifting, warm house track around 124 BPM with a rolling four-on-the-floor beat, a groovy filtered bassline, bright piano stabs, and airy hi-hats that build energy without feeling harsh.' },
  { file: 'ambient.strudel.js', genre: 'Ambient', prompt: 'A calm, spacious ambient soundscape for relaxing or focusing, with slow evolving pads, gentle bell-like textures, soft reverb, and no drums, in a warm major key.' },
  { file: 'jazz.strudel.js', genre: 'Jazz', prompt: 'A cozy, late-night jazz piano trio piece with a walking bassline, swung brushed drums, and a smooth ii-V-I chord progression that feels warm and inviting rather than dissonant.' },
  { file: 'drum-and-bass.strudel.js', genre: 'Drum & Bass', prompt: 'An energetic but polished liquid drum and bass track around 172 BPM with crisp breakbeats, a deep rolling sub bassline, and a bright, hopeful melodic lead on top.' },
];

const outDir = path.join(__dirname, '..', 'examples');
await mkdir(outDir, { recursive: true });

console.log(`Using provider: ${activeProvider}\n`);

for (const track of tracks) {
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
