import type { LintRule } from '../rule.js';

/** PLAN-014: Story has no Task: children */
export const plan014StoryNoTask: LintRule = {
  id: 'PLAN-014',
  severity: 'warning',
  description: 'Story에 Task가 하나도 없음',
  check({ document }) {
    const feature = document.feature;
    if (!feature) return [];

    return feature.stories
      .filter(story => story.tasks.length === 0)
      .map(story => ({
        ruleId: 'PLAN-014',
        severity: 'warning' as const,
        message: `Story "${story.title}"에 Task가 정의되지 않았습니다`,
        range: story.range,
        filePath: document.filePath,
      }));
  },
};
