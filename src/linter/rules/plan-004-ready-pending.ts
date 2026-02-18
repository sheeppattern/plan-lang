import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic, UncertaintyMarker, UncertaintyBlock } from '../../types/ast.js';

/** PLAN-004: status: ready but ?pending markers exist */
export const plan004ReadyPending: LintRule = {
  id: 'PLAN-004',
  severity: 'error',
  description: 'status: ready인데 ?pending 마커가 존재',
  check({ document }: LintContext): Diagnostic[] {
    if (!document.frontmatter || document.frontmatter.status !== 'ready') return [];
    if (!document.feature) return [];

    const pendingMarkers: (UncertaintyMarker | UncertaintyBlock)[] = [];

    function collectPending(markers: UncertaintyMarker[], blocks: UncertaintyBlock[]) {
      for (const m of markers) {
        if (m.type === 'pending') pendingMarkers.push(m);
      }
      for (const b of blocks) {
        if (b.type === 'pending') pendingMarkers.push(b);
      }
    }

    const f = document.feature;
    collectPending(f.uncertaintyMarkers, f.uncertaintyBlocks);
    for (const story of f.stories) {
      collectPending(story.uncertaintyMarkers, story.uncertaintyBlocks);
      for (const task of story.tasks) {
        collectPending(task.uncertaintyMarkers, task.uncertaintyBlocks);
      }
    }

    if (pendingMarkers.length === 0) return [];

    return [{
      ruleId: 'PLAN-004',
      severity: 'error',
      message: `status가 "ready"이지만 ?pending 마커가 ${pendingMarkers.length}개 존재합니다. draft → ready 전환 전에 모든 ?pending을 해소하세요.`,
      range: f.range,
      filePath: document.filePath,
    }];
  },
};
