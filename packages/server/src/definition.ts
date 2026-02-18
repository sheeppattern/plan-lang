/**
 * Go-to-Definition provider.
 * - [feat-id] → jump to the .plan file's Feature heading
 * - [feat-id#fragment] → jump to specific Story/Task within that file
 * - @actor → jump to Persona: definition
 */
import type { Definition, Position, Location as LspLocation } from 'vscode-languageserver';
import type { PlanDocument, StoryBlock, TaskBlock } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { getCursorContext } from './ast-query.js';
import { planRangeToLsp } from './position-utils.js';

export function getDefinition(
  uri: string,
  position: Position,
  docManager: DocumentManager,
): Definition | null {
  const state = docManager.get(uri);
  if (!state) return null;

  const ctx = getCursorContext(state.source, position);
  if (!ctx) return null;

  // 1. Plan reference: [feat-id] or [feat-id#fragment]
  if (ctx.reference && ctx.reference.kind === 'plan-reference') {
    const targetUri = docManager.getUriForId(ctx.reference.id);
    if (!targetUri) return null;

    const targetState = docManager.get(targetUri);
    if (!targetState?.doc) return null;

    // If there's a fragment, find the specific Story/Task
    if (ctx.reference.fragment) {
      const location = findFragment(targetState.doc, targetUri, ctx.reference.fragment);
      if (location) return location;
    }

    // Default: jump to the Feature heading
    if (targetState.doc.feature) {
      return {
        uri: targetUri,
        range: planRangeToLsp(targetState.doc.feature.range),
      };
    }

    return null;
  }

  // 2. Actor reference: @actor → Persona definition
  if (ctx.actor) {
    return findActorDefinitionLocation(ctx.actor.name, docManager);
  }

  return null;
}

/**
 * Find a fragment (Story or Task) within a document by matching title slugs.
 * Fragment format: "story-google" matches "Story: Google 계정으로 가입" via slug.
 */
function findFragment(
  doc: PlanDocument,
  targetUri: string,
  fragment: string,
): LspLocation | null {
  if (!doc.feature) return null;

  // Try matching stories
  for (const story of doc.feature.stories) {
    if (titleToSlug(story.title).includes(fragment) || fragment.includes(titleToSlug(story.title))) {
      return { uri: targetUri, range: planRangeToLsp(story.range) };
    }
  }

  // Try matching tasks
  for (const story of doc.feature.stories) {
    for (const task of story.tasks) {
      if (titleToSlug(task.title).includes(fragment) || fragment.includes(titleToSlug(task.title))) {
        return { uri: targetUri, range: planRangeToLsp(task.range) };
      }
    }
  }

  return null;
}

/** Convert a title to a URL-friendly slug for fragment matching. */
function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // remove non-word chars except spaces and hyphens
    .replace(/\s+/g, '-')      // spaces to hyphens
    .replace(/-+/g, '-')       // collapse consecutive hyphens
    .trim();
}

/**
 * Find the Persona: line where an actor is defined.
 */
function findActorDefinitionLocation(
  name: string,
  docManager: DocumentManager,
): LspLocation | null {
  for (const [, state] of docManager.all()) {
    const { doc, uri } = state;
    if (!doc.feature) continue;

    // Check feature intents
    for (const intent of doc.feature.intents) {
      if (intent.kind === 'persona' && intent.actor?.name === name) {
        return { uri, range: planRangeToLsp(intent.range) };
      }
    }

    // Check story intents
    for (const story of doc.feature.stories) {
      for (const intent of story.intents) {
        if (intent.kind === 'persona' && intent.actor?.name === name) {
          return { uri, range: planRangeToLsp(intent.range) };
        }
      }
    }
  }

  return null;
}
