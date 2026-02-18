import type {
  PlanDocument,
  UncertaintyMarker,
  UncertaintyBlock,
  UncertaintyType,
} from '../types/ast.js';

export interface UncertaintySummary {
  filePath: string;
  id: string;
  status: string;
  counts: Record<UncertaintyType, number>;
  details: { type: UncertaintyType; message: string; line: number }[];
}

export function collectUncertainty(doc: PlanDocument): UncertaintySummary {
  const filePath = doc.filePath || '<unknown>';
  const id = doc.frontmatter?.id || '<no-id>';
  const status = doc.frontmatter?.status || 'unknown';
  const counts: Record<UncertaintyType, number> = {
    pending: 0,
    assumption: 0,
    alternative: 0,
    risk: 0,
  };
  const details: UncertaintySummary['details'] = [];

  function addMarker(m: UncertaintyMarker) {
    counts[m.type]++;
    details.push({ type: m.type, message: m.message, line: m.range.start.line });
  }

  function addBlock(b: UncertaintyBlock) {
    counts[b.type]++;
    details.push({ type: b.type, message: b.message, line: b.range.start.line });
  }

  if (doc.feature) {
    for (const m of doc.feature.uncertaintyMarkers) addMarker(m);
    for (const b of doc.feature.uncertaintyBlocks) addBlock(b);

    for (const story of doc.feature.stories) {
      for (const m of story.uncertaintyMarkers) addMarker(m);
      for (const b of story.uncertaintyBlocks) addBlock(b);

      for (const task of story.tasks) {
        for (const m of task.uncertaintyMarkers) addMarker(m);
        for (const b of task.uncertaintyBlocks) addBlock(b);
      }
    }
  }

  return { filePath, id, status, counts, details };
}

export function formatUncertaintyReport(
  summaries: UncertaintySummary[],
  options?: { color?: boolean },
): string {
  const useColor = options?.color ?? true;
  const lines: string[] = [];

  lines.push('[UNCERTAINTY REPORT]');
  lines.push('');

  const totals: Record<UncertaintyType, number> = {
    pending: 0, assumption: 0, alternative: 0, risk: 0,
  };

  for (const s of summaries) {
    lines.push(`${s.id} (${s.status})`);

    for (const type of ['pending', 'assumption', 'alternative', 'risk'] as UncertaintyType[]) {
      if (s.counts[type] > 0) {
        const label = `  ?${type}:`.padEnd(20);
        lines.push(`${label}${s.counts[type]}개`);
        totals[type] += s.counts[type];
      }
    }

    // Show details
    for (const d of s.details) {
      lines.push(`    L${d.line}: ?${d.type} — ${d.message}`);
    }

    lines.push('');
  }

  lines.push('─'.repeat(40));

  const totalParts: string[] = [];
  for (const type of ['pending', 'assumption', 'alternative', 'risk'] as UncertaintyType[]) {
    if (totals[type] > 0) {
      totalParts.push(`?${type} ${totals[type]}개`);
    }
  }
  lines.push(`총계: ${totalParts.join(' | ')}`);

  // Status transition warnings
  const blockedTransitions = summaries.filter(
    s => s.status === 'draft' && s.counts.pending > 0,
  );
  if (blockedTransitions.length > 0) {
    lines.push('');
    for (const s of blockedTransitions) {
      lines.push(`⚠ ${s.id}: draft → ready 전환에 ${s.counts.pending}개 ?pending 해소 필요`);
    }
  }

  return lines.join('\n');
}
