import type { PlanDocument, Diagnostic, Severity } from '../types/ast.js';

export interface LintContext {
  document: PlanDocument;
  /** Available only during project-level linting */
  projectFiles?: Map<string, PlanDocument>;
  /** Map of duplicate IDs → file paths (project-level only) */
  duplicateIds?: Map<string, string[]>;
}

export interface LintRule {
  id: string;
  severity: Severity;
  description: string;
  /** If true, requires projectFiles to run (cross-file rule) */
  crossFile?: boolean;
  check(ctx: LintContext): Diagnostic[];
}
