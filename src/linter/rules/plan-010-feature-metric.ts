import type { LintRule } from '../rule.js';

/** PLAN-010: Feature has no Metric: */
export const plan010FeatureMetric: LintRule = {
  id: 'PLAN-010',
  severity: 'warning',
  description: 'Feature에 Metric:이 없음',
  check({ document }) {
    const feature = document.feature;
    if (!feature) return [];

    const hasMetric = feature.intents.some(i => i.kind === 'metric');
    if (hasMetric) return [];

    return [{
      ruleId: 'PLAN-010',
      severity: 'warning',
      message: `Feature "${feature.title}"에 Metric:이 없습니다`,
      range: feature.range,
      filePath: document.filePath,
    }];
  },
};
