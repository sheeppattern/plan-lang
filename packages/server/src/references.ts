/**
 * Find All References provider.
 * Returns all locations where a [feat-id] or @actor is used across the project.
 */
import type { Location as LspLocation, Position, ReferenceContext } from 'vscode-languageserver';
import { parseReferences, parseActorReferences } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { getCursorContext } from './ast-query.js';
import { planRangeToLsp } from './position-utils.js';

export function getReferences(
  uri: string,
  position: Position,
  context: ReferenceContext,
  docManager: DocumentManager,
): LspLocation[] | null {
  const state = docManager.get(uri);
  if (!state) return null;

  const ctx = getCursorContext(state.source, position);
  if (!ctx) return null;

  // 1. Plan reference: find all usages of [feat-id] across project
  if (ctx.reference && ctx.reference.kind === 'plan-reference') {
    const targetId = ctx.reference.id;
    return findAllPlanReferences(targetId, context.includeDeclaration, docManager);
  }

  // 2. Actor reference: find all usages of @actor across project
  if (ctx.actor) {
    return findAllActorReferences(ctx.actor.name, context.includeDeclaration, docManager);
  }

  return null;
}

function findAllPlanReferences(
  targetId: string,
  includeDeclaration: boolean,
  docManager: DocumentManager,
): LspLocation[] {
  const locations: LspLocation[] = [];

  for (const [, state] of docManager.all()) {
    const lines = state.source.split(/\r?\n/);

    // Include declaration: frontmatter id: line
    if (includeDeclaration && state.doc.frontmatter?.id === targetId) {
      // Find the id: line in frontmatter
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^id:\s*(.+)$/);
        if (match && match[1].trim() === targetId) {
          locations.push({
            uri: state.uri,
            range: {
              start: { line: i, character: 4 },
              end: { line: i, character: 4 + targetId.length },
            },
          });
          break;
        }
      }
    }

    // Find all [targetId] references in this document
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const refs = parseReferences(lines[i], lineNumber);
      for (const ref of refs) {
        if (ref.kind === 'plan-reference' && ref.id === targetId) {
          locations.push({
            uri: state.uri,
            range: planRangeToLsp(ref.range),
          });
        }
      }
    }
  }

  return locations;
}

function findAllActorReferences(
  name: string,
  includeDeclaration: boolean,
  docManager: DocumentManager,
): LspLocation[] {
  const locations: LspLocation[] = [];

  for (const [, state] of docManager.all()) {
    const lines = state.source.split(/\r?\n/);

    // Include declaration: Persona: lines defining this actor
    if (includeDeclaration && state.doc.feature) {
      for (const intent of state.doc.feature.intents) {
        if (intent.kind === 'persona' && intent.actor?.name === name) {
          locations.push({
            uri: state.uri,
            range: planRangeToLsp(intent.range),
          });
        }
      }
      for (const story of state.doc.feature.stories) {
        for (const intent of story.intents) {
          if (intent.kind === 'persona' && intent.actor?.name === name) {
            locations.push({
              uri: state.uri,
              range: planRangeToLsp(intent.range),
            });
          }
        }
      }
    }

    // Find all @name references in this document
    for (let i = 0; i < lines.length; i++) {
      const lineNumber = i + 1;
      const actors = parseActorReferences(lines[i], lineNumber);
      for (const actor of actors) {
        if (actor.name === name) {
          // Skip if this is a Persona: declaration line and we already included it
          if (includeDeclaration) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('Persona:')) continue;
          }
          locations.push({
            uri: state.uri,
            range: planRangeToLsp(actor.range),
          });
        }
      }
    }
  }

  return locations;
}
