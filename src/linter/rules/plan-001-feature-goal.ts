import type { LintRule } from '../rule.js';

/** PLAN-001: Feature must have a Goal: */
export const plan001FeatureGoal: LintRule = {
  id: 'PLAN-001',
  severity: 'error',
  description: 'Feature에 Goal:이 없음',
  check({ document }) {
    const feature = document.feature;
    if (!feature) return [];

    const hasGoal = feature.intents.some(i => i.kind === 'goal');
    if (hasGoal) return [];

    return [{
      ruleId: 'PLAN-001',
      severity: 'error',
      message: `Feature "${feature.title}"에 Goal:이 없습니다`,
      range: feature.range,
      filePath: document.filePath,
    }];
  },
};
