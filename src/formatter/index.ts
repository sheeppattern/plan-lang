import { formatFrontmatter } from './frontmatter-formatter.js';
import { formatBody } from './body-formatter.js';
import type { FormatResult } from './format-types.js';

export type { FormatOptions, FormatResult } from './format-types.js';

/**
 * Format a .plan file source string.
 * Returns the formatted output with:
 * - Frontmatter keys in canonical order
 * - Trailing whitespace removed
 * - Consecutive blank lines collapsed
 * - File ending with exactly one newline
 */
export function formatPlanSource(source: string, filePath?: string): FormatResult {
  const lines = source.split(/\n/);

  // Detect frontmatter boundaries
  let fmStart = -1;
  let fmEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      if (fmStart === -1) {
        fmStart = i;
      } else {
        fmEnd = i;
        break;
      }
    }
  }

  let resultLines: string[];

  if (fmStart !== -1 && fmEnd !== -1) {
    // Format frontmatter
    const fmContent = lines.slice(fmStart + 1, fmEnd);
    const formattedFm = formatFrontmatter(fmContent);

    // Format body (everything after closing ---)
    const bodyContent = lines.slice(fmEnd + 1);
    const formattedBody = formatBody(bodyContent);

    resultLines = [
      '---',
      ...formattedFm,
      '---',
      ...formattedBody,
    ];
  } else {
    // No frontmatter — just format body
    resultLines = formatBody(lines);
  }

  // Ensure trailing newline
  const formatted = resultLines.join('\n') + '\n';

  return {
    filePath,
    original: source,
    formatted,
    changed: source !== formatted,
  };
}
