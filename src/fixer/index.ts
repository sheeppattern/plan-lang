import type { Diagnostic } from '../types/ast.js';
import type { Fix, FixResult } from './fix-types.js';
import { getFixProvider, getFixableRuleIds } from './fix-registry.js';

export type { Fix, FixProvider, FixResult } from './fix-types.js';
export { getFixProvider, getFixableRuleIds } from './fix-registry.js';

/**
 * Get applicable fixes for a list of diagnostics.
 */
export function getFixesForDiagnostics(
  diagnostics: Diagnostic[],
  sourceLines: string[],
): Fix[] {
  const fixes: Fix[] = [];

  for (const diag of diagnostics) {
    const provider = getFixProvider(diag.ruleId);
    if (provider) {
      fixes.push(...provider.getFixes(diag, sourceLines));
    }
  }

  return fixes;
}

/**
 * Apply fixes to source text.
 * Fixes are sorted bottom-up (highest line first) to avoid offset issues.
 * Returns the new source and list of applied fix descriptions.
 */
export function applyFixes(
  source: string,
  fixes: Fix[],
): { output: string; applied: string[] } {
  if (fixes.length === 0) {
    return { output: source, applied: [] };
  }

  let lines = source.split(/\n/);
  const applied: string[] = [];

  // Sort bottom-up: highest line first, same line → highest column first
  const sorted = [...fixes].sort((a, b) => {
    const lineDiff = b.range.start.line - a.range.start.line;
    if (lineDiff !== 0) return lineDiff;
    return b.range.start.column - a.range.start.column;
  });

  for (const fix of sorted) {
    lines = fix.apply(lines);
    applied.push(fix.description);
  }

  // Reverse to match application order (top to bottom)
  applied.reverse();

  return { output: lines.join('\n'), applied };
}
