export function extractCodeBlock(rawText) {
  const codeBlockMatch = rawText.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  // A response can be cut off (hit max_tokens) before the closing fence
  // ever arrives, in which case the whole raw text — including the
  // leading ```javascript line — falls through here. Strip a leading
  // opening fence if present so stray backticks don't reach later stages
  // as invalid JS ("Unterminated template").
  return rawText.replace(/^```(?:javascript|js)?\s*\n?/, '').trim();
}
