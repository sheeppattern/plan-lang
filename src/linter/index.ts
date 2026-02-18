import type { PlanDocument, Diagnostic } from '../types/ast.js';
import type { LintRule, LintContext } from './rule.js';
import { plan001FeatureGoal } from './rules/plan-001-feature-goal.js';
import { plan002StoryBehavior } from './rules/plan-002-story-behavior.js';
import { plan003TaskAssign } from './rules/plan-003-task-assign.js';
import { plan004ReadyPending } from './rules/plan-004-ready-pending.js';
import { plan005StoryEdge } from './rules/plan-005-story-edge.js';
import { plan006ThenObligation } from './rules/plan-006-then-obligation.js';
import { plan007StaleAssumption } from './rules/plan-007-stale-assumption.js';
import { plan008BlocksDraft } from './rules/plan-008-blocks-draft.js';
import { plan009NeedsExists } from './rules/plan-009-needs-exists.js';
import { plan010FeatureMetric } from './rules/plan-010-feature-metric.js';

export { type LintRule, type LintContext } from './rule.js';
export { walkAST } from './visitor.js';

const ALL_RULES: LintRule[] = [
  plan001FeatureGoal,
  plan002StoryBehavior,
  plan003TaskAssign,
  plan004ReadyPending,
  plan005StoryEdge,
  plan006ThenObligation,
  plan007StaleAssumption,
  plan008BlocksDraft,
  plan009NeedsExists,
  plan010FeatureMetric,
];

// Parse lint-disable/enable directives from comments
const LINT_DISABLE_RE = /<!--\s*@lint-disable\s+([\w-]+)\s*-->/;
const LINT_ENABLE_RE = /<!--\s*@lint-enable\s+([\w-]+)\s*-->/;

interface DisableRange {
  ruleId: string;
  startLine: number;
  endLine: number; // Infinity if never re-enabled
}

function parseDirectives(source: string): DisableRange[] {
  const lines = source.split(/\r?\n/);
  const ranges: DisableRange[] = [];
  const openDisables = new Map<string, number>();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const disableMatch = LINT_DISABLE_RE.exec(lines[i]);
    if (disableMatch) {
      openDisables.set(disableMatch[1], lineNum);
      continue;
    }
    const enableMatch = LINT_ENABLE_RE.exec(lines[i]);
    if (enableMatch) {
      const startLine = openDisables.get(enableMatch[1]);
      if (startLine !== undefined) {
        ranges.push({ ruleId: enableMatch[1], startLine, endLine: lineNum });
        openDisables.delete(enableMatch[1]);
      }
    }
  }

  // Unclosed disables extend to end of file
  for (const [ruleId, startLine] of openDisables) {
    ranges.push({ ruleId, startLine, endLine: Infinity });
  }

  return ranges;
}

export interface LintOptions {
  disabledRules?: string[];
  source?: string; // Raw source for directive parsing
}

export class LintEngine {
  private rules: LintRule[] = [...ALL_RULES];

  getRules(): readonly LintRule[] {
    return this.rules;
  }

  /**
   * Lint a single document.
   */
  lint(document: PlanDocument, options?: LintOptions): Diagnostic[] {
    return this.runRules({ document }, options);
  }

  /**
   * Lint all documents in a project (enables cross-file rules).
   */
  lintProject(
    documents: Map<string, PlanDocument>,
    sources?: Map<string, string>,
    options?: LintOptions,
  ): Map<string, Diagnostic[]> {
    const results = new Map<string, Diagnostic[]>();

    for (const [id, doc] of documents) {
      const ctx: LintContext = {
        document: doc,
        projectFiles: documents,
      };
      const fileSource = sources?.get(id);
      const fileOptions = { ...options, source: fileSource };
      results.set(id, this.runRules(ctx, fileOptions));
    }

    return results;
  }

  private runRules(ctx: LintContext, options?: LintOptions): Diagnostic[] {
    const disabledRules = new Set(options?.disabledRules || []);
    const directives = options?.source ? parseDirectives(options.source) : [];

    const diagnostics: Diagnostic[] = [];

    for (const rule of this.rules) {
      if (disabledRules.has(rule.id)) continue;
      if (rule.crossFile && !ctx.projectFiles) continue;

      try {
        const results = rule.check(ctx);
        // Filter by lint directives
        for (const d of results) {
          const isSuppressed = directives.some(
            dir =>
              (dir.ruleId === d.ruleId || dir.ruleId === 'all') &&
              d.range.start.line >= dir.startLine &&
              d.range.start.line <= dir.endLine,
          );
          if (!isSuppressed) {
            diagnostics.push(d);
          }
        }
      } catch {
        // Rule execution failure — skip silently
      }
    }

    return diagnostics;
  }
}
