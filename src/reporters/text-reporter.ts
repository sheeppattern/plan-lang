import type { Diagnostic, Severity } from '../types/ast.js';

const SEVERITY_COLORS: Record<Severity, string> = {
  error: '\x1b[31m',   // red
  warning: '\x1b[33m', // yellow
  info: '\x1b[36m',    // cyan
};
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';

const SEVERITY_LABELS: Record<Severity, string> = {
  error: 'error',
  warning: 'warn ',
  info: 'info ',
};

export function formatTextReport(
  diagnostics: Diagnostic[],
  options?: { color?: boolean },
): string {
  const useColor = options?.color ?? true;

  if (diagnostics.length === 0) {
    return c('All checks passed.', '\x1b[32m');
  }

  // Group by file
  const byFile = new Map<string, Diagnostic[]>();
  for (const d of diagnostics) {
    const key = d.filePath || '<unknown>';
    if (!byFile.has(key)) byFile.set(key, []);
    byFile.get(key)!.push(d);
  }

  const lines: string[] = [];

  for (const [filePath, fileDiags] of byFile) {
    lines.push('');
    lines.push(c(filePath, BOLD));

    const sorted = [...fileDiags].sort((a, b) => a.range.start.line - b.range.start.line);

    for (const d of sorted) {
      const loc = `${d.range.start.line}:${d.range.start.column}`;
      const severity = c(SEVERITY_LABELS[d.severity], SEVERITY_COLORS[d.severity]);
      const rule = c(d.ruleId, DIM);
      lines.push(`  ${loc}\t${severity}\t${d.message}\t${rule}`);
    }
  }

  // Summary
  const errorCount = diagnostics.filter(d => d.severity === 'error').length;
  const warnCount = diagnostics.filter(d => d.severity === 'warning').length;
  const infoCount = diagnostics.filter(d => d.severity === 'info').length;

  lines.push('');
  const parts: string[] = [];
  if (errorCount > 0) parts.push(c(`${errorCount} error(s)`, SEVERITY_COLORS.error));
  if (warnCount > 0) parts.push(c(`${warnCount} warning(s)`, SEVERITY_COLORS.warning));
  if (infoCount > 0) parts.push(c(`${infoCount} info`, SEVERITY_COLORS.info));
  lines.push(parts.join(', '));

  return lines.join('\n');

  function c(text: string, code: string): string {
    if (!useColor) return text;
    return `${code}${text}${RESET}`;
  }
}
