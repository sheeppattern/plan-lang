import fs from 'node:fs';
import type { Diagnostic } from '../types/ast.js';
import { parsePlanFile } from '../parser/index.js';
import { LintEngine } from '../linter/index.js';
import { formatTextReport } from '../reporters/text-reporter.js';
import { formatJsonReport } from '../reporters/json-reporter.js';
import { getFixesForDiagnostics, applyFixes } from '../fixer/index.js';

export interface LintCommandOptions {
  format?: string;
  quiet?: boolean;
  disable?: string[];
  severity?: string;
  fix?: boolean;
}

export function runLintCommand(files: string[], options: LintCommandOptions): void {
  const engine = new LintEngine();
  let allDiagnostics: Diagnostic[] = [];

  for (const filePath of files) {
    let source = fs.readFileSync(filePath, 'utf-8');
    let doc = parsePlanFile(source, filePath);
    let diagnostics = engine.lint(doc, {
      disabledRules: options.disable,
      source,
    });

    if (options.fix && diagnostics.length > 0) {
      const sourceLines = source.split(/\n/);
      const fixes = getFixesForDiagnostics(diagnostics, sourceLines);

      if (fixes.length > 0) {
        const { output, applied } = applyFixes(source, fixes);
        fs.writeFileSync(filePath, output, 'utf-8');

        // Re-lint to get remaining diagnostics
        source = output;
        doc = parsePlanFile(source, filePath);
        const remaining = engine.lint(doc, {
          disabledRules: options.disable,
          source,
        });

        console.log(`${filePath}: Fixed ${applied.length} issue(s) (${remaining.length} remaining)`);
        diagnostics = remaining;
      }
    }

    allDiagnostics.push(...diagnostics);
  }

  // Filter by severity
  if (options.severity) {
    const minSeverity = options.severity;
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const minOrder = severityOrder[minSeverity as keyof typeof severityOrder] ?? 2;
    allDiagnostics = allDiagnostics.filter(
      d => (severityOrder[d.severity] ?? 2) <= minOrder,
    );
  }

  if (options.quiet && allDiagnostics.length === 0) return;

  if (options.format === 'json') {
    console.log(formatJsonReport(allDiagnostics));
  } else {
    console.log(formatTextReport(allDiagnostics));
  }

  if (allDiagnostics.some(d => d.severity === 'error')) {
    process.exitCode = 1;
  }
}
