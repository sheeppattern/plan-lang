/**
 * Convert plan-lang ParseError + Lint diagnostics to LSP Diagnostics.
 */
import {
  DiagnosticSeverity,
  type Diagnostic as LspDiagnostic,
  type Connection,
} from 'vscode-languageserver';
import { LintEngine } from 'plan-lang';
import type { Diagnostic as PlanDiagnostic, Severity, ParseError } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { planRangeToLsp } from './position-utils.js';

const lintEngine = new LintEngine();

function severityToLsp(severity: Severity): DiagnosticSeverity {
  switch (severity) {
    case 'error': return DiagnosticSeverity.Error;
    case 'warning': return DiagnosticSeverity.Warning;
    case 'info': return DiagnosticSeverity.Information;
  }
}

function parseErrorToLsp(error: ParseError): LspDiagnostic {
  return {
    range: planRangeToLsp(error.range),
    severity: DiagnosticSeverity.Error,
    source: 'plan-lang',
    message: error.message,
  };
}

function lintDiagToLsp(diag: PlanDiagnostic): LspDiagnostic {
  return {
    range: planRangeToLsp(diag.range),
    severity: severityToLsp(diag.severity),
    code: diag.ruleId,
    source: 'plan-lang',
    message: diag.message,
  };
}

/** Publish diagnostics for a single document (parse errors + single-file lint). */
export function publishDiagnostics(
  uri: string,
  docManager: DocumentManager,
  connection: Connection,
): void {
  const state = docManager.get(uri);
  if (!state) return;

  const { doc, source } = state;
  const diagnostics: LspDiagnostic[] = [];

  // Parse errors
  for (const error of doc.errors) {
    diagnostics.push(parseErrorToLsp(error));
  }

  // Single-file lint
  const lintResults = lintEngine.lint(doc, { source });
  for (const diag of lintResults) {
    diagnostics.push(lintDiagToLsp(diag));
  }

  connection.sendDiagnostics({ uri, diagnostics });
}

/** Publish diagnostics for all project documents (includes cross-file rules). */
export function publishProjectDiagnostics(
  docManager: DocumentManager,
  connection: Connection,
): void {
  const projectDocs = docManager.getProjectDocuments();
  const projectSources = docManager.getProjectSources();

  const allResults = lintEngine.lintProject(projectDocs, projectSources);

  for (const [, state] of docManager.all()) {
    const { uri, doc } = state;
    const id = doc.frontmatter?.id ?? uri;
    const diagnostics: LspDiagnostic[] = [];

    // Parse errors
    for (const error of doc.errors) {
      diagnostics.push(parseErrorToLsp(error));
    }

    // Lint results (includes cross-file)
    const lintResults = allResults.get(id) ?? [];
    for (const diag of lintResults) {
      diagnostics.push(lintDiagToLsp(diag));
    }

    connection.sendDiagnostics({ uri, diagnostics });
  }
}
