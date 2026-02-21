import type { PlanDocument, DependencyLine } from '../types/ast.js';

export interface DependencyEdge {
  sourceId: string;
  targetId: string;
  kind: 'needs' | 'blocks';
  line: DependencyLine;
}

/**
 * Collect all dependency edges from a single document.
 * - Needs: [B] in A → edge A→B
 * - Blocks: [B] in A → edge B→A (B depends on A)
 * Only plan-references are included (external/doc references are skipped).
 */
export function collectAllDependencies(
  docId: string,
  doc: PlanDocument,
): DependencyEdge[] {
  const edges: DependencyEdge[] = [];

  function processDeps(deps: DependencyLine[]) {
    for (const dep of deps) {
      if (!dep.reference) continue;
      if (dep.reference.kind !== 'plan-reference') continue;

      const targetId = dep.reference.id;

      // Skip self-references (internal fragment references like [feat-email-auth#task-jwt-module])
      if (targetId === docId) continue;

      if (dep.kind === 'needs') {
        // A needs B → A depends on B → edge A→B
        edges.push({ sourceId: docId, targetId, kind: 'needs', line: dep });
      } else if (dep.kind === 'blocks') {
        // A blocks B → B depends on A → edge B→A
        edges.push({ sourceId: targetId, targetId: docId, kind: 'blocks', line: dep });
      }
    }
  }

  if (!doc.feature) return edges;

  processDeps(doc.feature.dependencies);
  for (const story of doc.feature.stories) {
    processDeps(story.dependencies);
    for (const task of story.tasks) {
      processDeps(task.dependencies);
    }
  }

  return edges;
}

/**
 * Build a dependency graph from all project documents.
 * Returns adjacency list: sourceId → [targetId, ...]
 * Direction: source depends on target (source → target means source needs target).
 */
export function buildDependencyGraph(
  documents: Map<string, PlanDocument>,
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const [id, doc] of documents) {
    const deps = collectAllDependencies(id, doc);
    for (const edge of deps) {
      if (!graph.has(edge.sourceId)) {
        graph.set(edge.sourceId, []);
      }
      graph.get(edge.sourceId)!.push(edge.targetId);
    }
  }

  return graph;
}

/**
 * Detect cycles in the dependency graph that include a given node.
 * Returns cycle paths as arrays of IDs (e.g., ['A', 'B', 'C', 'A']).
 */
export function detectCycles(
  graph: Map<string, string[]>,
  startId: string,
): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string) {
    if (path.includes(nodeId)) {
      // Found a cycle — extract it
      const cycleStart = path.indexOf(nodeId);
      const cycle = [...path.slice(cycleStart), nodeId];
      // Only include if the cycle contains our startId
      if (cycle.includes(startId)) {
        cycles.push(cycle);
      }
      return;
    }

    if (visited.has(nodeId)) return;

    path.push(nodeId);
    const neighbors = graph.get(nodeId) || [];
    for (const next of neighbors) {
      dfs(next);
    }
    path.pop();
    visited.add(nodeId);
  }

  // Reset visited for startId's exploration
  dfs(startId);
  return cycles;
}
