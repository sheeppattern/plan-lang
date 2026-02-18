import type { PlanDocument, DependencyLine, Reference } from '../types/ast.js';

export interface UnresolvedReference {
  sourceId: string;
  targetId: string;
  line: DependencyLine;
}

export interface ResolvedReference {
  sourceId: string;
  targetId: string;
  targetDoc: PlanDocument;
  line: DependencyLine;
}

/**
 * Resolve cross-file references across a project.
 * Returns both resolved and unresolved references.
 */
export function resolveReferences(
  documents: Map<string, PlanDocument>,
): { resolved: ResolvedReference[]; unresolved: UnresolvedReference[] } {
  const resolved: ResolvedReference[] = [];
  const unresolved: UnresolvedReference[] = [];

  for (const [sourceId, doc] of documents) {
    const deps = collectAllDependencies(doc);

    for (const dep of deps) {
      if (!dep.reference) continue;
      if (dep.reference.kind !== 'plan-reference') continue;

      const targetId = dep.reference.id;
      const targetDoc = documents.get(targetId);

      if (targetDoc) {
        resolved.push({ sourceId, targetId, targetDoc, line: dep });
      } else {
        unresolved.push({ sourceId, targetId, line: dep });
      }
    }
  }

  return { resolved, unresolved };
}

function collectAllDependencies(doc: PlanDocument): DependencyLine[] {
  const deps: DependencyLine[] = [];
  if (!doc.feature) return deps;

  deps.push(...doc.feature.dependencies);
  for (const story of doc.feature.stories) {
    deps.push(...story.dependencies);
    for (const task of story.tasks) {
      deps.push(...task.dependencies);
    }
  }

  return deps;
}
