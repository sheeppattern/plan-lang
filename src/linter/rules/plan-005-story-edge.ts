import type { LintRule } from '../rule.js';

/** PLAN-005: Story has no Edge: cases */
export const plan005StoryEdge: LintRule = {
  id: 'PLAN-005',
  severity: 'warning',
  description: 'Story에 Edge:가 하나도 없음',
  check({ document }) {
    const feature = document.feature;
    if (!feature) return [];

    return feature.stories
      .filter(story => story.edges.length === 0)
      .map(story => ({
        ruleId: 'PLAN-005',
        severity: 'warning' as const,
        message: `Story "${story.title}"에 Edge 케이스가 정의되지 않았습니다`,
        range: story.range,
        filePath: document.filePath,
      }));
  },
};
