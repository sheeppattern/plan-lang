import { scan } from '../parser/scanner.js';
import { classifyLines } from '../parser/line-classifier.js';

/**
 * Format the body of a .plan file:
 * - Trim trailing whitespace
 * - Normalize blank lines between blocks (exactly 1 blank line)
 * - Collapse consecutive blank lines
 * - Ensure file ends with exactly one newline
 */
export function formatBody(bodyLines: string[]): string[] {
  const result: string[] = [];
  let prevBlank = false;

  for (let i = 0; i < bodyLines.length; i++) {
    const line = bodyLines[i].trimEnd();
    const isBlank = line === '';

    // Collapse consecutive blank lines
    if (isBlank && prevBlank) continue;

    result.push(line);
    prevBlank = isBlank;
  }

  // Remove trailing blank lines
  while (result.length > 0 && result[result.length - 1] === '') {
    result.pop();
  }

  return result;
}
