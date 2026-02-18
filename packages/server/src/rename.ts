/**
 * Rename Symbol provider.
 * Renames [feat-id] or @actor across the entire project.
 */
import type {
  Position,
  Range as LspRange,
  WorkspaceEdit,
  TextEdit,
} from 'vscode-languageserver';
import { parseReferences, parseActorReferences } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { getCursorContext } from './ast-query.js';
import { planRangeToLsp } from './position-utils.js';

export function prepareRename(
  uri: string,
  position: Position,
  docManager: DocumentManager,
): { range: LspRange; placeholder: string } | null {
  const state = docManager.get(uri);
  if (!state) return null;

  const ctx = getCursorContext(state.source, position);
  if (!ctx) return null;

  if (ctx.reference && ctx.reference.kind === 'plan-reference') {
    return {
      range: planRangeToLsp(ctx.reference.range),
      placeholder: ctx.reference.id,
    };
  }

  if (ctx.actor) {
    return {
      range: planRangeToLsp(ctx.actor.range),
      placeholder: ctx.actor.name,
    };
  }

  return null;
}

export function getRename(
  uri: string,
  position: Position,
  newName: string,
  docManager: DocumentManager,
): WorkspaceEdit | null {
  const state = docManager.get(uri);
  if (!state) return null;

  const ctx = getCursorContext(state.source, position);
  if (!ctx) return null;

  // 1. Rename plan-reference [old-id] → [new-id]
  if (ctx.reference && ctx.reference.kind === 'plan-reference') {
    return renamePlanReference(ctx.reference.id, newName, docManager);
  }

  // 2. Rename actor @old → @new
  if (ctx.actor) {
    return renameActor(ctx.actor.name, newName, docManager);
  }

  return null;
}

function renamePlanReference(
  oldId: string,
  newId: string,
  docManager: DocumentManager,
): WorkspaceEdit {
  const changes: Record<string, TextEdit[]> = {};

  for (const [, state] of docManager.all()) {
    const edits: TextEdit[] = [];
    const lines = state.source.split(/\r?\n/);

    // Rename frontmatter id: line
    if (state.doc.frontmatter?.id === oldId) {
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^id:\s*(.+)$/);
        if (match && match[1].trim() === oldId) {
          const idStart = lines[i].indexOf(oldId);
          edits.push({
            range: {
              start: { line: i, character: idStart },
              end: { line: i, character: idStart + oldId.length },
            },
            newText: newId,
          });
          break;
        }
      }
    }

    // Rename all [old-id] and [old-id#frag] references
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const refs = parseReferences(lines[i], lineNumber);
      for (const ref of refs) {
        if (ref.kind === 'plan-reference' && ref.id === oldId) {
          // Replace only the ID part inside brackets: [old-id] or [old-id#frag]
          const lspRange = planRangeToLsp(ref.range);
          // The range covers the full [...] including brackets
          // We need to replace just the id part: after [ and before ] or #
          const refText = ref.fragment ? `[${newId}#${ref.fragment}]` : `[${newId}]`;
          edits.push({
            range: lspRange,
            newText: refText,
          });
        }
      }
    }

    if (edits.length > 0) {
      changes[state.uri] = edits;
    }
  }

  return { changes };
}

function renameActor(
  oldName: string,
  newName: string,
  docManager: DocumentManager,
): WorkspaceEdit {
  const changes: Record<string, TextEdit[]> = {};

  for (const [, state] of docManager.all()) {
    const edits: TextEdit[] = [];
    const lines = state.source.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const actors = parseActorReferences(lines[i], lineNumber);
      for (const actor of actors) {
        if (actor.name === oldName) {
          edits.push({
            range: planRangeToLsp(actor.range),
            newText: `@${newName}`,
          });
        }
      }
    }

    if (edits.length > 0) {
      changes[state.uri] = edits;
    }
  }

  return { changes };
}
