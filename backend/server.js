// server.js - Main Express server for the Strudel + OpenRouter text-to-music generator
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateStrudelCode, activeProvider } from './provider.js';
import {
  COMPREHENSIVE_SOUND_LIBRARY,
  DRUM_MACHINES, 
  VCSL_INSTRUMENTS, 
  MELODIC_SAMPLES, 
  EXPANDED_GENRE_SOUNDS,
  getSoundsForGenre,
  getRandomSoundsForGenre,
  getAllDrumMachines,
  getDrumMachinesByGenre
} from './expanded_sounds.js';
import { ALL_SOUNDS, getSoundsByGenre, isValidSound } from './sounds.js';
import { getPatternsByGenre, COMPLETE_PATTERNS } from './patterns.js';
import { getAllPresets, getPresetByInstrument, PRESET_CATEGORIES } from './synthesis_presets.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Proxy middleware for Strudel REPL
const strudelUrl = process.env.STRUDEL_URL || 'http://localhost:4321';
app.use('/strudel-proxy', createProxyMiddleware({
  target: strudelUrl,
  changeOrigin: true,
  pathRewrite: { '^/strudel-proxy': '' },
  onProxyRes: (proxyRes) => {
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept';
  },
  logLevel: 'debug'
}));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// API endpoint to provide configuration to frontend
app.get('/api/config', (req, res) => {
  try {
    // Use the proxy URL instead of the direct Strudel URL
    const baseUrl = `http://localhost:${PORT}`;
    res.json({
      strudelUrl: `${baseUrl}/strudel-proxy/`,
      directStrudelUrl: process.env.STRUDEL_URL || 'http://localhost:4321/'
    });
  } catch (error) {
    console.error('Error providing config:', error);
    res.status(500).json({ error: 'Failed to provide configuration' });
  }
});

// API endpoint to generate Strudel code from text
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const strudelCode = await generateStrudelCode(prompt);
    if (!strudelCode || !strudelCode.trim()) {
      // Providers can return a technically-successful response with empty
      // content (e.g. truncated right after an opening code fence) — without
      // this check that silently "succeeds" with a blank player and no
      // diagnostic trail at all, which is far worse than a clear error.
      throw new Error(`Provider (${activeProvider}) returned an empty response — try again, or try a different model/provider`);
    }
    console.log(`Generated ${strudelCode.length} chars of Strudel code via ${activeProvider}`);
    res.json({ code: strudelCode });
  } catch (error) {
    console.error('Error generating Strudel code:', error);
    res.status(500).json({ 
      error: 'Failed to generate Strudel code',
      details: error.message 
    });
  }
});

// Get expanded sound library
app.get('/api/sounds/expanded', (req, res) => {
  try {
    const { category, genre } = req.query;
    
    if (genre) {
      const genreSounds = getSoundsForGenre(genre);
      return res.json({
        success: true,
        genre,
        sounds: genreSounds
      });
    }
    
    if (category) {
      const sounds = COMPREHENSIVE_SOUND_LIBRARY.getSoundsByCategory(category);
      return res.json({
        success: true,
        category,
        sounds
      });
    }
    
    // Return full library
    res.json({
      success: true,
      library: {
        drumMachines: DRUM_MACHINES,
        vcslInstruments: VCSL_INSTRUMENTS,
        melodicSamples: MELODIC_SAMPLES,
        genreSounds: EXPANDED_GENRE_SOUNDS
      }
    });
  } catch (error) {
    console.error('Error fetching expanded sounds:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch expanded sound library' 
    });
  }
});

// Get drum machines
app.get('/api/drums/machines', (req, res) => {
  try {
    const { genre } = req.query;
    
    if (genre) {
      const machines = getDrumMachinesByGenre(genre);
      return res.json({
        success: true,
        genre,
        machines
      });
    }
    
    const allMachines = getAllDrumMachines();
    res.json({
      success: true,
      machines: allMachines,
      details: DRUM_MACHINES
    });
  } catch (error) {
    console.error('Error fetching drum machines:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch drum machines' 
    });
  }
});

// Generate random sounds for genre
app.get('/api/sounds/random/:genre', (req, res) => {
  try {
    const { genre } = req.params;
    const { count = 5 } = req.query;
    
    const randomSounds = getRandomSoundsForGenre(genre, parseInt(count));
    
    res.json({
      success: true,
      genre,
      count: randomSounds.length,
      sounds: randomSounds
    });
  } catch (error) {
    console.error('Error generating random sounds:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate random sounds' 
    });
  }
});


// Sound library endpoint
app.get('/api/sounds', (req, res) => {
  try {
    const { genre, category } = req.query;
    
    if (genre) {
      const genreSounds = getSoundsByGenre(genre);
      res.json({ sounds: genreSounds, genre });
    } else {
      res.json({ 
        sounds: ALL_SOUNDS,
        categories: ['drums', 'melodic', 'gm', 'synth']
      });
    }
  } catch (error) {
    console.error('Error fetching sounds:', error);
    res.status(500).json({ error: 'Failed to fetch sound library' });
  }
});

// Pattern library endpoint
app.get('/api/patterns', (req, res) => {
  try {
    const { genre } = req.query;
    
    if (genre) {
      const genrePatterns = getPatternsByGenre(genre);
      res.json({ patterns: genrePatterns, genre });
    } else {
      res.json({ patterns: COMPLETE_PATTERNS });
    }
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch pattern library' });
  }
});

// Synthesis preset library endpoint
app.get('/api/presets', (req, res) => {
  try {
    const { instrument } = req.query;
    
    if (instrument) {
      const instrumentPresets = getPresetByInstrument(instrument);
      res.json({ presets: instrumentPresets, instrument });
    } else {
      res.json({ presets: getAllPresets(), categories: PRESET_CATEGORIES });
    }
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch preset library' });
  }
});

// Sound validation endpoint
app.post('/api/validate/sound', (req, res) => {
  try {
    const { sound } = req.body;
    
    if (!sound) {
      return res.status(400).json({ error: 'Sound parameter is required' });
    }
    
    const isValid = isValidSound(sound);
    res.json({ sound, isValid });
  } catch (error) {
    console.error('Error validating sound:', error);
    res.status(500).json({ error: 'Failed to validate sound' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Active provider: ${activeProvider} (set PROVIDER=openrouter|claude in .env to switch)`);
  console.log(`Strudel URL: ${process.env.STRUDEL_URL || strudelUrl}`);
});
