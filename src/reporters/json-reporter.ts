import type { Diagnostic } from '../types/ast.js';

export interface JsonReport {
  totalCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  diagnostics: Diagnostic[];
}

export function formatJsonReport(diagnostics: Diagnostic[]): string {
  const report: JsonReport = {
    totalCount: diagnostics.length,
    errorCount: diagnostics.filter(d => d.severity === 'error').length,
    warningCount: diagnostics.filter(d => d.severity === 'warning').length,
    infoCount: diagnostics.filter(d => d.severity === 'info').length,
    diagnostics,
  };
  return JSON.stringify(report, null, 2);
}
