# Strudel + OpenRouter: AI-Powered Music Composition Tool

**Generate sophisticated Strudel music code using natural language, with any OpenRouter model — including free ones. Claude (Anthropic) is also supported.**

We love live coding, algorithmic music, and what the [Strudel](https://strudel.cc/) open source community has built. This project pairs Strudel's live coding environment with an LLM: describe the music you want, and it generates complex, playable Strudel code with layered patterns, modulation, and effects.

> This project is a fork of [etbars/strudel-claude-music-generator](https://github.com/etbars/strudel-claude-music-generator) — thank you to etbars for the original idea and implementation. This fork re-focuses on [OpenRouter](https://openrouter.ai/) as the primary provider so anyone can run it for free, while keeping the original Claude integration available as an option. See [CHANGELOG.md](CHANGELOG.md) for the technical details of what changed.

## Features

- **Two providers, your choice**: run against any [OpenRouter](https://openrouter.ai/) model (including free-tier ones) or Anthropic's Claude, switchable via a single env var
- **Advanced music generation**: layered patterns, polyrhythms, and harmonic progressions
- **Effects**: reverb, delay, filters, and spatial audio
- **Dynamic modulation**: evolving textures with sine waves, perlin noise, and complex modulation
- **Multi-layered arrangements**: drums, bass, leads, and atmospheric elements combined via `stack()`
- **Real-time playback**: integrated Strudel REPL for immediate audio feedback

## Quick Start

### Prerequisites
- Node.js v18 or higher
- An [OpenRouter](https://openrouter.ai/keys) API key (free tier available), and/or an [Anthropic](https://console.anthropic.com/) API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/strudel-openrouter-composer.git
   cd strudel-openrouter-composer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env: set PROVIDER=openrouter (default) or PROVIDER=claude,
   # and fill in the matching API key.
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Choosing a free OpenRouter model

OpenRouter's free-model lineup changes over time and popular models can be slow/queued. On [openrouter.ai/models](https://openrouter.ai/models):
1. Filter by **Free**
2. Sort by **Coding: High to Low** (this task is single-shot code generation, not agentic — skip agentic/domain-specialized models even if they rank well)
3. Copy the exact model id from that model's **API** tab into `OPENROUTER_MODEL` in `.env` — don't guess the id, model slugs and availability both change
4. Watch out for **reasoning models**: some free models (e.g. DeepSeek's reasoning variants) spend their entire token budget on an internal chain-of-thought before writing an actual answer, which can come back as an empty response with `finish_reason: "length"`. If that happens, either raise `MAX_TOKENS` in `backend/openrouter.js` well beyond the reasoning overhead, or just pick a different, less deliberative model — the latter is usually more reliable

## Example Generations

### Techno Track
**Prompt**: "driving hypnotic techno with an acid bassline"

```javascript
// Driving techno - hypnotic, dark, and built for the dancefloor
setcpm(135/4)

stack(
  // Relentless four-on-the-floor kick - the backbone, never touched
  s("bd*4").bank("RolandTR909").gain(0.95),

  // Backbeat clap and the classic techno "chick" - closed hats with offbeat opens
  s("~ cp ~ cp").bank("RolandTR909").gain(0.6).room(0.2),
  s("hh*8").bank("RolandTR909").gain(0.35).hpf(7000).sometimes(x => x.degradeBy(0.2)),
  s("~ oh ~ oh").bank("RolandTR909").gain(0.3).hpf(6000),

  // Acid bassline in C dorian - the resonant filter sweep does the real work
  note("c2 c2 eb2 c2 g1 c2 bb1 c2").sound("sawtooth")
    .lpf(perlin.slow(4).range(300, 2000)).lpq(12).distort(0.2).gain(0.8),

  // Sparse hypnotic stab, one hit per cycle - texture, not a melody
  note("<c4 eb4 g4 f4>").sound("square").lpf(1500).room(0.3).gain(0.3)
    .every(8, x => x.fast(2))
)
```

### Ambient Soundscape
**Prompt**: "atmospheric ambient soundscape with evolving textures"

```javascript
// Atmospheric ambient soundscape - slow, spacious, and gently evolving
setcpm(60/4)

stack(
  // Deep sub-bass drone, well below everything else
  note("<c1 ~ g1 ~>").sound("sine").slow(4).gain(0.5).room(0.6),

  // Warm mid pad - the harmonic core, a slowly shifting I-vi-IV-V in C major
  note("<[c3,e3,g3] [a2,c3,e3] [f2,a2,c3] [g2,b2,d3]>")
    .sound("space").slow(2).gain(0.45).room(0.85).attack(1.5).release(3),

  // Sparse melodic phrase, high and airy
  note("g4 ~ a4 [~ c5] ~ e5 ~ ~").s("piano").slow(2).gain(0.35).delay(0.5).room(0.7),

  // Occasional shimmer, barely-there texture
  s("~ ~ ~ hh").gain(0.15).room(0.8).hpf(4000)
).lpf(sine.slow(16).range(600, 4000))
```

More examples generated through this pipeline live in [`examples/`](examples/).

## Project Structure

```
strudel-openrouter-composer/
├── backend/
│   ├── server.js            # Express server with API endpoints
│   ├── provider.js          # Picks the active AI provider via PROVIDER env var
│   ├── openrouter.js        # OpenRouter provider (default)
│   ├── claude.js            # Claude/Anthropic provider (alternative)
│   ├── strudel_prompt.js    # Shared system prompt + response cleanup, used by both providers
│   ├── sounds.js            # Curated sound library with genre mapping
│   ├── patterns.js          # Verified pattern templates
│   ├── synthesis_presets.js # Instrument synthesis presets
│   └── expanded_sounds.js   # Extended drum machine / sample library
├── frontend/
│   ├── index.html         # Modern UI with Strudel REPL integration
│   ├── styles.css         # Clean, responsive styling
│   └── app.js            # Frontend logic with real-time feedback
├── examples/              # Sample generated tracks across genres
├── .env.example          # Environment configuration template
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

## API Endpoints

- `POST /api/generate` - Generate Strudel code from a natural-language prompt (used by the UI; goes through whichever provider `PROVIDER` selects)
- `GET /api/sounds` / `GET /api/sounds/expanded` - Sound library, with genre/category filtering
- `GET /api/drums/machines` - Available drum machines, optionally filtered by genre
- `GET /api/sounds/random/:genre` - Random sound suggestions for a genre
- `GET /api/patterns` - Pattern templates for different styles
- `GET /api/presets` - Synthesis presets by instrument
- `POST /api/validate/sound` - Sound compatibility validation

## Advanced Features

### Comprehensive Strudel Documentation
The shared system prompt (`backend/strudel_prompt.js`) teaches the model:
- **Mini-notation patterns**: subdivisions, rests, multiplication, angle brackets
- **Sound sources**: drums, melodic samples, oscillators, GM sounds
- **Effects processing**: reverb, delay, filters, ADSR, distortion
- **Pattern transformations**: speed, reverse, degradation, jux
- **Modulation**: sine waves, perlin noise, random values
- **Composition techniques**: layering, sequencing, dynamics, harmony

It also explicitly documents a handful of Strudel syntax traps verified against the real `@strudel/core` source, where an LLM's natural guess is wrong (e.g. assuming camelCase, or that every effect has a parameterized form) — see [CHANGELOG.md](CHANGELOG.md) for the specifics. `postProcessStrudelCode()` in `backend/strudel_prompt.js` also auto-corrects a few of these defensively in case a model still gets them wrong.

### Visible error reporting
Strudel's own `evaluate()` swallows pattern runtime errors internally rather than throwing — a broken pattern used to just fail silently with no sound and no explanation. The frontend now listens for the Strudel component's `update` event and shows `event.detail.error` directly in the status bar, so a bad generation is always visible instead of a silent dead end.

## Configuration

### Environment Variables
```bash
# Provider selection
PROVIDER=openrouter          # or "claude"

# OpenRouter (default provider)
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=z-ai/glm-5.2:free

# Claude / Anthropic (alternative provider)
CLAUDE_API_KEY=your_anthropic_api_key_here
# CLAUDE_MODEL=claude-sonnet-5

PORT=3000
STRUDEL_URL=http://localhost:3000
```

### Sound Library
The system includes a curated library of confirmed working sounds:
- **Synthesis**: triangle, sawtooth, square, sine
- **Drums**: bd, sd, hh, oh, cp, rim + bank support
- **Melodic**: piano, epiano, space, wind, metal, jazz
- **GM Sounds**: gm_acoustic_bass, gm_synth_bass_1/2, gm_lead_1/2

## Usage Tips

1. **Be specific**: "Dark techno with rolling bassline" works better than "make music"
2. **Mention genre**: house, ambient, jazz, drum & bass, etc.
3. **Request complexity**: ask for "polyrhythms", "modulation", or "multiple layers"
4. **Copy and test**: generated code should work directly in any Strudel environment — if a free OpenRouter model produces broken syntax, try a different `OPENROUTER_MODEL` or switch `PROVIDER=claude`

## About this fork

[etbars/strudel-claude-music-generator](https://github.com/etbars/strudel-claude-music-generator) had a great core idea — pairing an LLM with Strudel's live coding environment to turn a text description into real, playable music. This fork keeps that spirit and adds OpenRouter support so anyone can try it without needing paid API credits, along with a round of testing and bug fixes that came out of actually running the app end-to-end. See [CHANGELOG.md](CHANGELOG.md) for the full technical rundown.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later) - see the [LICENSE](LICENSE) file for details. This matches the license of [Strudel](https://codeberg.org/uzu/strudel) itself, which this project depends on.

## Acknowledgments

- [etbars/strudel-claude-music-generator](https://github.com/etbars/strudel-claude-music-generator) - the original project this was forked from
- [Strudel](https://strudel.cc/) - the live coding environment
- [OpenRouter](https://openrouter.ai/) - unified access to many LLMs, including free ones
- [Anthropic Claude](https://www.anthropic.com/) - supported as an alternative provider
- The live coding and algorithmic music communities

---

**Ready to create music with AI? Start generating sophisticated compositions now!**
