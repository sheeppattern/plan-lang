import type { Diagnostic } from '../types/ast.js';
import { loadProject } from '../project/project-loader.js';
import { LintEngine } from '../linter/index.js';
import { formatTextReport } from '../reporters/text-reporter.js';
import { formatJsonReport } from '../reporters/json-reporter.js';

export interface LintProjectCommandOptions {
  format?: string;
  quiet?: boolean;
  disable?: string[];
  severity?: string;
}

export function runLintProjectCommand(dirPath: string, options: LintProjectCommandOptions): void {
  const { documents, sources, errors } = loadProject(dirPath);

  if (errors.length > 0) {
    for (const err of errors) {
      console.error(err);
    }
  }

  if (documents.size === 0) {
    console.log('No .plan files found.');
    return;
  }

  const engine = new LintEngine();
  const resultMap = engine.lintProject(documents, sources, {
    disabledRules: options.disable,
  });

  let allDiagnostics: Diagnostic[] = [];
  for (const diags of resultMap.values()) {
    allDiagnostics.push(...diags);
  }

  // Filter by severity
  if (options.severity) {
    const severityOrder = { error: 0, warning: 1, info: 2 };
    const minOrder = severityOrder[options.severity as keyof typeof severityOrder] ?? 2;
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
