// claude.js - Claude (Anthropic) provider for generating Strudel code
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSystemPrompt, postProcessStrudelCode } from './strudel_prompt.js';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Anthropic client
const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Anthropic periodically retires dated model snapshots, so this is configurable
// rather than hardcoded — override via CLAUDE_MODEL if the default is retired.
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

/**
 * Generates Strudel code from a natural language prompt using Claude API
 * @param {string} prompt - User's natural language description of desired music
 * @returns {Promise<string>} - Generated Strudel code
 */
export async function generateStrudelCode(prompt) {
  try {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: buildSystemPrompt(prompt),
      messages: [
        { role: "user", content: `User request: ${prompt}` }
      ],
    });

    // Don't assume content[0] is the text block — some models return other
    // block types (e.g. thinking) ahead of the text block in the array.
    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock) {
      throw new Error('Claude response did not include a text content block');
    }

    return postProcessStrudelCode(textBlock.text);
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw new Error(`Failed to generate Strudel code: ${error.message}`);
  }
}
