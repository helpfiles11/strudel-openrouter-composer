// openrouter.js - OpenRouter provider for generating Strudel code.
// Lets the app run against any model available on openrouter.ai, including
// free-tier models, as an alternative to the Anthropic-only backend/claude.js.
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSystemPrompt } from './strudel_prompt.js';
import { processStrudelCode } from './strudel_pipeline/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// OpenRouter's model catalog and free-tier availability change often — check
// https://openrouter.ai/models for what's currently free and pick the exact
// model id from a model's own "API" tab rather than guessing. GLM 5.2 was
// picked after live-testing: unlike some free reasoning models (e.g. DeepSeek
// V4 Flash), it reliably produces actual Strudel code within a normal token
// budget instead of exhausting it on internal chain-of-thought.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'z-ai/glm-5.2:free';

// Free-tier models can generate much slower than Claude, so give requests
// real headroom. Some free models are "reasoning" models that spend tokens on
// an internal chain-of-thought before writing the actual answer — if that
// reasoning alone exceeds max_tokens, the response comes back with content:
// null and finish_reason: "length" with zero actual code. So max_tokens has
// to budget for reasoning AND the answer, and we ask the model to keep
// reasoning effort low (harmless no-op on models that don't support it).
const REQUEST_TIMEOUT_MS = 180000;
// Verbose, heavily-commented multi-layer tracks can run well past 3000
// tokens; too low a budget truncates mid-response, which used to leak a
// dangling ```javascript fence into the editor (see strudel_pipeline/extract.js).
const MAX_TOKENS = 6000;

/**
 * Generates Strudel code from a natural language prompt using an OpenRouter model.
 * @param {string} prompt - User's natural language description of desired music
 * @returns {Promise<string>} - Generated Strudel code
 */
export async function generateStrudelCode(prompt) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set. Add it to .env (see .env.example).');
  }

  const MAX_RETRIES = 2;

  // Everything — the fetch AND reading its body — is wrapped in one try/catch.
  // fetch()'s promise resolves once headers arrive; reading the body
  // (.json()/.text()) is a separate async step that can still be aborted by
  // the same timeout signal if the body is still arriving. A try/catch around
  // only the fetch() call misses that case and lets a raw DOMException escape.
  try {
    let response;
    let lastErrorDetail;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          max_tokens: MAX_TOKENS,
          reasoning: { effort: 'low' },
          messages: [
            { role: 'system', content: buildSystemPrompt(prompt) },
            { role: 'user', content: `User request: ${prompt}` },
          ],
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      // 429 from the upstream provider (not our own rate limit) is often
      // transient and self-reports a retry delay — worth one or two retries
      // before giving up, rather than failing a whole generation over it.
      if (response.status === 429 && attempt < MAX_RETRIES) {
        lastErrorDetail = await response.text();
        let retryAfterSeconds = 5;
        try {
          retryAfterSeconds = JSON.parse(lastErrorDetail)?.error?.metadata?.retry_after_seconds ?? retryAfterSeconds;
        } catch {
          // fall back to default retry delay
        }
        await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
        continue;
      }

      break;
    }

    if (!response.ok) {
      const detail = response.status === 429 ? lastErrorDetail : await response.text();
      console.error('Error calling OpenRouter API:', detail);
      throw new Error(`Failed to generate Strudel code: OpenRouter returned ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content;
    if (!text) {
      if (choice?.finish_reason === 'length') {
        throw new Error('Failed to generate Strudel code: model used its entire token budget on internal reasoning and never wrote an answer — raise MAX_TOKENS in backend/openrouter.js or switch to a less reasoning-heavy OPENROUTER_MODEL');
      }
      throw new Error('Failed to generate Strudel code: OpenRouter response had no message content');
    }
    if (choice.finish_reason === 'length') {
      // Not fatal — extractCodeBlock() strips a dangling opening fence
      // if present — but the resulting track is likely cut off mid-pattern.
      // Worth knowing about rather than discovering only from a broken track.
      console.warn(`OpenRouter response was truncated at MAX_TOKENS (${MAX_TOKENS}) — generated code may be incomplete`);
    }

    return processStrudelCode(text);
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new Error(`Failed to generate Strudel code: request timed out after ${REQUEST_TIMEOUT_MS / 1000}s (model may be overloaded — try again or change OPENROUTER_MODEL)`);
    }
    if (error.message?.startsWith('Failed to generate Strudel code')) {
      throw error; // already a well-formed error from above, don't double-wrap
    }
    console.error('Error calling OpenRouter API:', error);
    throw new Error(`Failed to generate Strudel code: ${error.message}`);
  }
}
