// provider.js - Selects which AI provider generates Strudel code, via the
// PROVIDER env var. Defaults to OpenRouter (free-tier friendly); set
// PROVIDER=claude to use the Anthropic integration instead.
import { generateStrudelCode as generateWithOpenRouter } from './openrouter.js';
import { generateStrudelCode as generateWithClaude } from './claude.js';

const PROVIDER = (process.env.PROVIDER || 'openrouter').toLowerCase();

const PROVIDERS = {
  openrouter: generateWithOpenRouter,
  claude: generateWithClaude,
};

if (!PROVIDERS[PROVIDER]) {
  throw new Error(`Unknown PROVIDER "${PROVIDER}" — expected one of: ${Object.keys(PROVIDERS).join(', ')}`);
}

export const generateStrudelCode = PROVIDERS[PROVIDER];
export const activeProvider = PROVIDER;
