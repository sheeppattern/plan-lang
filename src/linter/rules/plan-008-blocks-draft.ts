import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic, DependencyLine } from '../../types/ast.js';

/** PLAN-008: Blocks: references a file that is still draft */
export const plan008BlocksDraft: LintRule = {
  id: 'PLAN-008',
  severity: 'info',
  description: 'Blocks:로 참조된 파일이 아직 draft 상태',
  crossFile: true,
  check({ document, projectFiles }: LintContext): Diagnostic[] {
    if (!projectFiles || !document.feature) return [];

    const diagnostics: Diagnostic[] = [];

    function checkBlocksLines(deps: DependencyLine[]) {
      for (const dep of deps) {
        if (dep.kind !== 'blocks') continue;
        if (!dep.reference || dep.reference.kind !== 'plan-reference') continue;

        const targetId = dep.reference.id;
        const targetDoc = projectFiles!.get(targetId);
        if (targetDoc?.frontmatter?.status === 'draft') {
          diagnostics.push({
            ruleId: 'PLAN-008',
            severity: 'info',
            message: `Blocks: 대상 [${targetId}]이 아직 draft 상태입니다`,
            range: dep.range,
            filePath: document.filePath,
          });
        }
      }
    }

    checkBlocksLines(document.feature.dependencies);
    for (const story of document.feature.stories) {
      checkBlocksLines(story.dependencies);
      for (const task of story.tasks) {
        checkBlocksLines(task.dependencies);
      }
    }

    return diagnostics;
  },
};
