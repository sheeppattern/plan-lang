/**
 * Coordinate conversion between plan-lang (1-based line/column) and LSP (0-based line/character).
 */
import type { Range as LspRange, Position as LspPosition } from 'vscode-languageserver';
import type { Range as PlanRange, Location as PlanLocation } from 'plan-lang';

/** Convert a plan-lang Range (1-based) to an LSP Range (0-based). */
export function planRangeToLsp(range: PlanRange): LspRange {
  return {
    start: {
      line: range.start.line - 1,
      character: range.start.column - 1,
    },
    end: {
      line: range.end.line - 1,
      character: range.end.column - 1,
    },
  };
}

/** Convert an LSP Position (0-based) to a plan-lang Location (1-based). */
export function lspPositionToPlan(position: LspPosition): PlanLocation {
  return {
    line: position.line + 1,
    column: position.character + 1,
  };
}

/** Check if a plan-lang Range (1-based) contains an LSP Position (0-based). */
export function planRangeContainsLspPosition(range: PlanRange, position: LspPosition): boolean {
  const planLine = position.line + 1;
  const planCol = position.character + 1;

  if (planLine < range.start.line || planLine > range.end.line) return false;
  if (planLine === range.start.line && planCol < range.start.column) return false;
  if (planLine === range.end.line && planCol >= range.end.column) return false;
  return true;
}

/** Create an LSP Range for a full line (0-based line number). */
export function fullLineRange(lineNumber0: number): LspRange {
  return {
    start: { line: lineNumber0, character: 0 },
    end: { line: lineNumber0, character: Number.MAX_SAFE_INTEGER },
  };
}
