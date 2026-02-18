import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic, ThenLine, StoryBlock, EdgeBlock } from '../../types/ast.js';

/** PLAN-006: Then: without [MUST/SHOULD/MAY] */
export const plan006ThenObligation: LintRule = {
  id: 'PLAN-006',
  severity: 'warning',
  description: 'Then:에 [MUST/SHOULD/MAY]가 없음',
  check({ document }: LintContext): Diagnostic[] {
    const feature = document.feature;
    if (!feature) return [];

    const diagnostics: Diagnostic[] = [];

    function checkThenLines(behaviors: { kind: string; text: string; obligation?: unknown; range: any }[]) {
      for (const b of behaviors) {
        if (b.kind === 'then') {
          const then = b as ThenLine;
          if (!then.obligation) {
            diagnostics.push({
              ruleId: 'PLAN-006',
              severity: 'warning',
              message: `Then: 절에 의무 수준([MUST], [SHOULD], [MAY])이 지정되지 않았습니다`,
              range: then.range,
              filePath: document.filePath,
            });
          }
        }
      }
    }

    for (const story of feature.stories) {
      checkThenLines(story.behaviors);
      for (const edge of story.edges) {
        checkThenLines(edge.behaviors);
      }
      // Check inside uncertainty blocks
      for (const ub of story.uncertaintyBlocks) {
        checkThenLines(ub.children.filter(c => c.kind === 'then') as any);
      }
    }

    return diagnostics;
  },
};
