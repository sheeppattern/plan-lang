import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic } from '../../types/ast.js';

/** PLAN-007: ?assumption marker older than 30 days */
export const plan007StaleAssumption: LintRule = {
  id: 'PLAN-007',
  severity: 'warning',
  description: '?assumption 마커가 30일 이상 해소되지 않음',
  check({ document }: LintContext): Diagnostic[] {
    if (!document.frontmatter) return [];

    const created = document.frontmatter.created;
    const updated = document.frontmatter.updated;
    const dateStr = updated || created;
    if (!dateStr) return [];

    const fileDate = new Date(dateStr);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 30) return [];

    const feature = document.feature;
    if (!feature) return [];

    const diagnostics: Diagnostic[] = [];

    function checkMarkers(markers: { type: string; range: any }[]) {
      for (const m of markers) {
        if (m.type === 'assumption') {
          diagnostics.push({
            ruleId: 'PLAN-007',
            severity: 'warning',
            message: `?assumption 마커가 ${daysDiff}일 동안 해소되지 않았습니다 (최종 업데이트: ${dateStr})`,
            range: m.range,
            filePath: document.filePath,
          });
        }
      }
    }

    function checkBlocks(blocks: { type: string; range: any }[]) {
      for (const b of blocks) {
        if (b.type === 'assumption') {
          diagnostics.push({
            ruleId: 'PLAN-007',
            severity: 'warning',
            message: `?assumption 블록이 ${daysDiff}일 동안 해소되지 않았습니다`,
            range: b.range,
            filePath: document.filePath,
          });
        }
      }
    }

    checkMarkers(feature.uncertaintyMarkers);
    checkBlocks(feature.uncertaintyBlocks);

    for (const story of feature.stories) {
      checkMarkers(story.uncertaintyMarkers);
      checkBlocks(story.uncertaintyBlocks);
      for (const task of story.tasks) {
        checkMarkers(task.uncertaintyMarkers);
        checkBlocks(task.uncertaintyBlocks);
      }
    }

    return diagnostics;
  },
};
