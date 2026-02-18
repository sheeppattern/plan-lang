import type { PlanDocument, ClassifiedLine } from '../types/ast.js';
import { scan } from './scanner.js';
import { classifyLines } from './line-classifier.js';
import { parseFrontmatter } from './frontmatter-parser.js';
import { parse } from './parser.js';

export { scan } from './scanner.js';
export { classifyLine, classifyLines } from './line-classifier.js';
export { parseFrontmatter } from './frontmatter-parser.js';
export { parse } from './parser.js';
export {
  parseUncertaintyMarkers,
  parseObligation,
  parseActorReferences,
  parseReferences,
} from './inline-parser.js';

/**
 * Convenience function: parse a .plan file source string into a PlanDocument AST.
 */
export function parsePlanFile(source: string, filePath?: string): PlanDocument {
  const { lines, frontmatter: fmBounds } = scan(source);
  const classified = classifyLines(lines);

  // Parse frontmatter
  let frontmatter = null;
  const fmErrors: PlanDocument['errors'] = [];
  if (fmBounds) {
    const result = parseFrontmatter(fmBounds);
    frontmatter = result.frontmatter;
    fmErrors.push(...result.errors);
  }

  // Filter out frontmatter lines (between the two --- lines)
  let bodyLines: ClassifiedLine[];
  if (fmBounds) {
    bodyLines = classified.filter(
      l => l.lineNumber > fmBounds.endLine,
    );
  } else {
    bodyLines = classified;
  }

  const doc = parse(bodyLines, frontmatter, filePath);
  doc.errors.unshift(...fmErrors);
  return doc;
}
