import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic } from '../../types/ast.js';
import { buildDependencyGraph, detectCycles } from '../utils.js';

/** PLAN-012: Circular dependency detected in project */
export const plan012CircularDependency: LintRule = {
  id: 'PLAN-012',
  severity: 'error',
  description: '순환 의존성이 감지됨',
  crossFile: true,
  check({ document, projectFiles }: LintContext): Diagnostic[] {
    if (!projectFiles || !document.frontmatter?.id) return [];

    const docId = document.frontmatter.id;
    const graph = buildDependencyGraph(projectFiles);
    const cycles = detectCycles(graph, docId);

    if (cycles.length === 0) return [];

    // Deduplicate cycles by their string representation
    const seen = new Set<string>();
    const diagnostics: Diagnostic[] = [];

    for (const cycle of cycles) {
      const cycleStr = cycle.join(' → ');
      if (seen.has(cycleStr)) continue;
      seen.add(cycleStr);

      diagnostics.push({
        ruleId: 'PLAN-012',
        severity: 'error',
        message: `순환 의존성이 감지되었습니다: ${cycleStr}`,
        range: document.feature?.range ?? { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
        filePath: document.filePath,
      });
    }

    return diagnostics;
  },
};
