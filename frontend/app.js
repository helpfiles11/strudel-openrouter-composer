// app.js - Frontend logic for the Strudel + OpenRouter text-to-music generator

let currentCode = '';

// DOM elements
const generateBtn = document.getElementById('generate-btn');
const promptInput = document.getElementById('prompt-input');
const playBtn = document.getElementById('playBtn');
const stopBtn = document.getElementById('stopBtn');
const restartBtn = document.getElementById('restartBtn');
const loadingSpinner = document.getElementById('loading-spinner');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');

// Event listeners
if (generateBtn) generateBtn.addEventListener('click', generateMusic);
if (playBtn) playBtn.addEventListener('click', runInStrudel);
if (stopBtn) stopBtn.addEventListener('click', stopMusic);
if (restartBtn) restartBtn.addEventListener('click', restartMusic);

// Initialize Strudel REPL when page loads
document.addEventListener('DOMContentLoaded', initializeStrudel);

async function initializeStrudel() {
    try {
        if (document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve));
        }

        // Wait for the <strudel-editor> component to be genuinely ready, not
        // just present in the DOM. The tag can exist well before the
        // component finishes its own internal async setup (audio engine,
        // samples, etc.) — setting `.code` before that's done can silently
        // get overwritten once the component's own initialization completes.
        // `.editor` only appears once that setup has happened.
        const maxAttempts = 40; // 20 seconds total
        let attempts = 0;
        await new Promise(resolve => {
            const checkStrudel = () => {
                attempts++;
                const el = document.getElementById('strudelEditor');
                if (el?.editor) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('Strudel editor did not finish initializing after maximum attempts');
                    resolve(); // Continue anyway
                } else {
                    setTimeout(checkStrudel, 500);
                }
            };
            checkStrudel();
        });

        // Note: we don't set an initial starter pattern here — the component
        // ships with its own default code, and setting `.code` also triggers
        // autoplay, which we don't want to fire before the user interacts.

        // The REPL's own evaluate() swallows pattern runtime errors internally
        // (e.g. calling a control that doesn't exist) rather than rejecting —
        // our await never sees them. It does dispatch a real 'update' DOM
        // event with the error on `detail.error` whenever this happens, so
        // that's the only way to surface these to the user at all.
        const strudelEditor = document.getElementById('strudelEditor');
        if (strudelEditor) {
            strudelEditor.addEventListener('update', (e) => {
                if (e.detail?.error) {
                    console.error('Strudel evaluation error:', e.detail.error);
                    updateStatus('error', 'Strudel error: ' + e.detail.error.message);
                }
            });
        }

        if (generateBtn) generateBtn.disabled = false;
        updateStatus('ready', 'Ready to generate music');
    } catch (error) {
        console.error('Error initializing Strudel:', error);
        updateStatus('error', 'Failed to initialize Strudel');
    }
}

async function generateMusic() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        alert('Please enter a description of the music you want to create.');
        return;
    }

    updateStatus('loading', 'Generating music code...');
    generateBtn.disabled = true;
    loadingSpinner.style.display = 'block';

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
        }
        currentCode = data.code;

        // loadCodeIntoStrudel sets its own 'playing'/'error' status and
        // rethrows on failure — don't overwrite it with a blanket "success"
        // regardless of whether loading into the editor actually worked.
        await loadCodeIntoStrudel(currentCode);
    } catch (error) {
        console.error('Error generating music:', error);
        updateStatus('error', error.message || 'Failed to generate music. Please try again.');
    } finally {
        generateBtn.disabled = false;
        loadingSpinner.style.display = 'none';
    }
}

// Loads code into the Strudel editor and plays it.
//
// This uses the officially documented @strudel/repl API (see
// https://codeberg.org/uzu/strudel/src/branch/main/packages/repl/README.md,
// "Interacting with the REPL"): `strudelEditor.editor` is the underlying
// StrudelMirror instance, which exposes `setCode()`, `evaluate()`, `stop()`.
// Note `strudelEditor.code` (a plain property on the custom element) is NOT
// part of that API and setting it has no effect — the component only reacts
// to `code` as an HTML *attribute* (via attributeChangedCallback) or through
// `editor.setCode()` directly.
async function loadCodeIntoStrudel(code) {
    const strudelEditor = document.getElementById('strudelEditor');
    if (!strudelEditor?.editor) {
        console.error('Strudel editor not found or not initialized');
        return;
    }

    try {
        strudelEditor.editor.setCode(cleanStrudelCode(code));
        await strudelEditor.editor.evaluate();

        updateStatus('playing', 'Music loaded and playing');
        if (playBtn) playBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (restartBtn) restartBtn.disabled = false;
    } catch (error) {
        console.error('Error loading code into Strudel:', error);
        updateStatus('error', 'Failed to load music: ' + error.message);
        throw error;
    }
}

// Re-evaluates whatever is currently in the editor pane — including any
// manual edits you made directly there, not just the last AI-generated code.
// `evaluate()` reads the editor's own current code state, so this naturally
// respects live edits without us needing to read the pane text ourselves.
async function runInStrudel() {
    const strudelEditor = document.getElementById('strudelEditor');
    if (!strudelEditor?.editor) {
        console.error('Strudel editor not found');
        updateStatus('error', 'Strudel editor not found');
        return;
    }

    try {
        await strudelEditor.editor.evaluate();
        updateStatus('playing', 'Music is playing!');
        if (playBtn) playBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (restartBtn) restartBtn.disabled = false;
    } catch (error) {
        console.error('Error starting playback:', error);
        updateStatus('error', 'Failed to start playback: ' + error.message);
    }
}

function stopMusic() {
    const strudelEditor = document.getElementById('strudelEditor');
    if (!strudelEditor?.editor) {
        console.error('Strudel editor not found');
        return;
    }

    try {
        strudelEditor.editor.stop();
        updateStatus('stopped', 'Music stopped');
        if (playBtn) playBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (restartBtn) restartBtn.disabled = true;
    } catch (error) {
        console.error('Error stopping music:', error);
        updateStatus('error', 'Failed to stop music');
    }
}

async function restartMusic() {
    const strudelEditor = document.getElementById('strudelEditor');
    if (!strudelEditor?.editor || !currentCode) {
        console.error('Strudel editor not found or no current code');
        updateStatus('error', 'Cannot restart: missing editor or code');
        return;
    }

    try {
        strudelEditor.editor.stop();
        // Reload the last AI-generated code specifically (not whatever's
        // currently in the pane) — that's the point of "restart".
        // loadCodeIntoStrudel sets its own status on success/failure.
        await loadCodeIntoStrudel(currentCode);
    } catch (error) {
        console.error('Error restarting music:', error);
        updateStatus('error', 'Failed to restart music: ' + error.message);
    }
}

// Helper function to clean and validate Strudel code
function cleanStrudelCode(code) {
    if (!code || typeof code !== 'string') {
        console.warn('Invalid code provided to cleanStrudelCode, using default');
        return 'note("c4 e4 g4 c5").sound("piano").slow(2)';
    }

    // Fix common syntax errors
    return code
        // Fix .degrade() syntax - remove parameters
        .replace(/\.degrade\s*\([^)]+\)/g, '.degrade()')
        // Add a default parameter if .degradeBy() was left empty
        .replace(/\.degradeBy\s*\(\s*\)/g, '.degradeBy(0.5)');
}

function updateStatus(type, message) {
    if (statusDot && statusText) {
        statusDot.className = `status-dot ${type}`;
        statusText.textContent = message;
    }
}
