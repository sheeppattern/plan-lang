import type {
  PlanDocument,
  FeatureBlock,
  StoryBlock,
  TaskBlock,
  EdgeBlock,
  UncertaintyBlock,
} from '../types/ast.js';

export interface ASTVisitor {
  visitDocument?(doc: PlanDocument): void;
  visitFeature?(feature: FeatureBlock): void;
  visitStory?(story: StoryBlock): void;
  visitTask?(task: TaskBlock): void;
  visitEdge?(edge: EdgeBlock): void;
  visitUncertaintyBlock?(block: UncertaintyBlock): void;
}

export function walkAST(doc: PlanDocument, visitor: ASTVisitor): void {
  visitor.visitDocument?.(doc);

  if (!doc.feature) return;
  visitor.visitFeature?.(doc.feature);

  for (const block of doc.feature.uncertaintyBlocks) {
    visitor.visitUncertaintyBlock?.(block);
  }

  for (const story of doc.feature.stories) {
    visitor.visitStory?.(story);

    for (const block of story.uncertaintyBlocks) {
      visitor.visitUncertaintyBlock?.(block);
    }

    for (const edge of story.edges) {
      visitor.visitEdge?.(edge);
    }

    for (const task of story.tasks) {
      visitor.visitTask?.(task);

      for (const block of task.uncertaintyBlocks) {
        visitor.visitUncertaintyBlock?.(block);
      }
    }
  }
}
