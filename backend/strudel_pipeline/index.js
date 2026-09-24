import { extractCodeBlock } from './extract.js';
import { repair, ensureTrailingExpression } from './repair.js';
import { repairStackCommas } from './stack-comma-repair.js';
import { validate } from './validate.js';

export class StrudelValidationError extends Error {
  constructor(errors) {
    super(`Strudel validation failed:\n${errors.map((e) => `  ${e}`).join('\n')}`);
    this.name = 'StrudelValidationError';
    this.errors = errors;
  }
}

export function processStrudelCode(rawLLMText) {
  const extracted = extractCodeBlock(rawLLMText);
  const repaired = repair(extracted);
  const withCommasFixed = repairStackCommas(repaired);
  const withTrailingExpression = ensureTrailingExpression(withCommasFixed);
  const errors = validate(withTrailingExpression);
  if (errors.length > 0) {
    throw new StrudelValidationError(errors);
  }
  return withTrailingExpression;
}
