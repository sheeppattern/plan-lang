import type { Range, Diagnostic } from '../types/ast.js';

export interface Fix {
  ruleId: string;
  range: Range;           // 1-based position of the diagnostic
  description: string;
  apply(lines: string[]): string[];  // Returns new array (immutable)
}

export interface FixProvider {
  ruleId: string;
  getFixes(diagnostic: Diagnostic, sourceLines: string[]): Fix[];
}

export interface FixResult {
  filePath: string;
  totalDiagnostics: number;
  fixedCount: number;
  unfixable: Diagnostic[];
  appliedFixes: string[];
}
