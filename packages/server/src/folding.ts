/**
 * Folding Ranges provider.
 * Foldable regions: frontmatter, story blocks, task blocks, edge blocks,
 * uncertainty blocks (?pending...?end), and multi-line comments.
 */
import {
  FoldingRange,
  FoldingRangeKind,
} from 'vscode-languageserver';
import { walkAST } from 'plan-lang';
import type { PlanDocument } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';

export function getFoldingRanges(
  uri: string,
  docManager: DocumentManager,
): FoldingRange[] {
  const state = docManager.get(uri);
  if (!state) return [];

  const { doc, source } = state;
  const ranges: FoldingRange[] = [];

  // Frontmatter folding
  addFrontmatterFolding(source, ranges);

  // AST-based folding
  if (doc.feature) {
    // Feature block itself (from heading to end)
    addBlockFolding(doc.feature.range, ranges);

    // Feature uncertainty blocks
    for (const ub of doc.feature.uncertaintyBlocks) {
      addBlockFolding(ub.range, ranges);
    }

    for (const story of doc.feature.stories) {
      addBlockFolding(story.range, ranges);

      for (const ub of story.uncertaintyBlocks) {
        addBlockFolding(ub.range, ranges);
      }

      for (const edge of story.edges) {
        addBlockFolding(edge.range, ranges);
      }

      for (const task of story.tasks) {
        addBlockFolding(task.range, ranges);

        for (const ub of task.uncertaintyBlocks) {
          addBlockFolding(ub.range, ranges);
        }
      }
    }
  }

  // Comment folding
  addCommentFolding(doc, ranges);

  return ranges;
}

function addFrontmatterFolding(source: string, ranges: FoldingRange[]): void {
  const lines = source.split(/\r?\n/);
  if (lines.length < 2 || lines[0].trim() !== '---') return;

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      ranges.push({
        startLine: 0,
        endLine: i,
        kind: FoldingRangeKind.Region,
      });
      break;
    }
  }
}

function addBlockFolding(
  range: { start: { line: number }; end: { line: number } },
  ranges: FoldingRange[],
): void {
  const startLine = range.start.line - 1; // convert 1-based to 0-based
  const endLine = range.end.line - 1;
  if (endLine > startLine) {
    ranges.push({
      startLine,
      endLine,
      kind: FoldingRangeKind.Region,
    });
  }
}

function addCommentFolding(doc: PlanDocument, ranges: FoldingRange[]): void {
  for (const commentRange of doc.comments) {
    const startLine = commentRange.start.line - 1;
    const endLine = commentRange.end.line - 1;
    if (endLine > startLine) {
      ranges.push({
        startLine,
        endLine,
        kind: FoldingRangeKind.Comment,
      });
    }
  }
}
