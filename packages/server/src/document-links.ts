/**
 * Document Links provider.
 * Makes [feat-id] references clickable (underline + Ctrl+Click).
 */
import type { DocumentLink } from 'vscode-languageserver';
import { parseReferences } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { planRangeToLsp } from './position-utils.js';

export function getDocumentLinks(
  uri: string,
  docManager: DocumentManager,
): DocumentLink[] {
  const state = docManager.get(uri);
  if (!state) return [];

  const links: DocumentLink[] = [];
  const lines = state.source.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1; // 1-based for plan-lang
    const refs = parseReferences(lines[i], lineNumber);

    for (const ref of refs) {
      if (ref.kind !== 'plan-reference') continue;

      const targetUri = docManager.getUriForId(ref.id);
      if (!targetUri) continue;

      links.push({
        range: planRangeToLsp(ref.range),
        target: targetUri,
      });
    }
  }

  return links;
}
