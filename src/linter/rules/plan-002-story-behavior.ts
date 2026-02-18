import type { LintRule } from '../rule.js';

/** PLAN-002: Story must have When: or Then: */
export const plan002StoryBehavior: LintRule = {
  id: 'PLAN-002',
  severity: 'error',
  description: 'Story에 When: 또는 Then:이 없음',
  check({ document }) {
    const feature = document.feature;
    if (!feature) return [];

    return feature.stories.flatMap(story => {
      const diagnostics = [];
      const hasWhen = story.behaviors.some(b => b.kind === 'when');
      const hasThen = story.behaviors.some(b => b.kind === 'then');

      // Also check inside uncertainty blocks
      const hasWhenInBlock = story.uncertaintyBlocks.some(ub =>
        ub.children.some(c => c.kind === 'when'),
      );
      const hasThenInBlock = story.uncertaintyBlocks.some(ub =>
        ub.children.some(c => c.kind === 'then'),
      );

      if (!hasWhen && !hasWhenInBlock) {
        diagnostics.push({
          ruleId: 'PLAN-002',
          severity: 'error' as const,
          message: `Story "${story.title}"에 When:이 없습니다`,
          range: story.range,
          filePath: document.filePath,
        });
      }
      if (!hasThen && !hasThenInBlock) {
        diagnostics.push({
          ruleId: 'PLAN-002',
          severity: 'error' as const,
          message: `Story "${story.title}"에 Then:이 없습니다`,
          range: story.range,
          filePath: document.filePath,
        });
      }
      return diagnostics;
    });
  },
};
