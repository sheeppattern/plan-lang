import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic, DependencyLine } from '../../types/ast.js';

/** PLAN-009: Needs: references an ID that doesn't exist in the project */
export const plan009NeedsExists: LintRule = {
  id: 'PLAN-009',
  severity: 'error',
  description: 'Needs:로 참조된 ID가 프로젝트 내에 존재하지 않음',
  crossFile: true,
  check({ document, projectFiles }: LintContext): Diagnostic[] {
    if (!projectFiles || !document.feature) return [];

    const diagnostics: Diagnostic[] = [];

    function checkNeedsLines(deps: DependencyLine[]) {
      for (const dep of deps) {
        if (dep.kind !== 'needs') continue;
        if (!dep.reference) continue;
        // Skip external references
        if (dep.reference.kind === 'external-reference') continue;
        if (dep.reference.kind === 'doc-reference') continue;
        if (dep.reference.kind !== 'plan-reference') continue;

        const targetId = dep.reference.id;
        if (!projectFiles!.has(targetId)) {
          diagnostics.push({
            ruleId: 'PLAN-009',
            severity: 'error',
            message: `Needs: 참조 [${targetId}]가 프로젝트 내에 존재하지 않습니다`,
            range: dep.range,
            filePath: document.filePath,
          });
        }
      }
    }

    checkNeedsLines(document.feature.dependencies);
    for (const story of document.feature.stories) {
      checkNeedsLines(story.dependencies);
      for (const task of story.tasks) {
        checkNeedsLines(task.dependencies);
      }
    }

    return diagnostics;
  },
};
