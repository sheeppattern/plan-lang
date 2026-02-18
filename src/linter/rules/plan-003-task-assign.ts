import type { LintRule } from '../rule.js';

/** PLAN-003: Task must have Assign: */
export const plan003TaskAssign: LintRule = {
  id: 'PLAN-003',
  severity: 'error',
  description: 'Task에 Assign:이 없음',
  check({ document }) {
    const feature = document.feature;
    if (!feature) return [];

    return feature.stories.flatMap(story =>
      story.tasks
        .filter(task => task.assigns.length === 0)
        .map(task => ({
          ruleId: 'PLAN-003',
          severity: 'error' as const,
          message: `Task "${task.title}"에 Assign:이 없습니다`,
          range: task.range,
          filePath: document.filePath,
        })),
    );
  },
};
