/**
 * Workspace Symbol Search provider.
 * Ctrl+T to search Feature/Story/Task/Edge across the entire project.
 */
import { SymbolInformation, SymbolKind } from 'vscode-languageserver';
import type { DocumentManager } from './document-manager.js';
import { planRangeToLsp } from './position-utils.js';

export function getWorkspaceSymbols(
  query: string,
  docManager: DocumentManager,
): SymbolInformation[] {
  const results: SymbolInformation[] = [];
  const lowerQuery = query.toLowerCase();

  for (const [, state] of docManager.all()) {
    const { doc, uri } = state;
    if (!doc.feature) continue;

    // Feature
    if (doc.feature.title.toLowerCase().includes(lowerQuery)) {
      results.push({
        name: doc.feature.title,
        kind: SymbolKind.Module,
        location: { uri, range: planRangeToLsp(doc.feature.range) },
        containerName: undefined,
      });
    }

    // Stories
    for (const story of doc.feature.stories) {
      if (story.title.toLowerCase().includes(lowerQuery)) {
        results.push({
          name: story.title,
          kind: SymbolKind.Class,
          location: { uri, range: planRangeToLsp(story.range) },
          containerName: doc.feature.title,
        });
      }

      // Tasks
      for (const task of story.tasks) {
        if (task.title.toLowerCase().includes(lowerQuery)) {
          results.push({
            name: task.title,
            kind: SymbolKind.Function,
            location: { uri, range: planRangeToLsp(task.range) },
            containerName: story.title,
          });
        }
      }

      // Edges
      for (const edge of story.edges) {
        if (edge.description.toLowerCase().includes(lowerQuery)) {
          results.push({
            name: edge.description,
            kind: SymbolKind.Interface,
            location: { uri, range: planRangeToLsp(edge.range) },
            containerName: story.title,
          });
        }
      }
    }
  }

  return results;
}
