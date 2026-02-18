/**
 * Hover provider: show contextual information when hovering over keywords,
 * references, obligations, uncertainty markers, and actors.
 */
import type { Hover, Position } from 'vscode-languageserver';
import type { DocumentManager } from './document-manager.js';
import { getCursorContext } from './ast-query.js';
import { planRangeToLsp } from './position-utils.js';

/** Descriptions for plan-lang keywords. */
const KEYWORD_DOCS: Record<string, string> = {
  Goal: '**Goal:** Declares the objective of the current Feature or Story. Answers "what do we want to achieve?"',
  Persona: '**Persona:** Identifies the primary user or actor for this Feature/Story. Format: `Persona: @actor — description`',
  Metric: '**Metric:** Defines a measurable success criterion. Format: `Metric: metric_name operator value`',
  Given: '**Given:** Describes the precondition or initial context for a behavior scenario.',
  When: '**When:** Describes the trigger action or event in a behavior scenario.',
  Then: '**Then:** Describes the expected outcome. Should include an obligation level: `[MUST]`, `[SHOULD]`, or `[MAY]`.',
  Needs: '**Needs:** Declares a dependency on another feature or external resource. Format: `Needs: [feat-id] description`',
  Blocks: '**Blocks:** Declares that this feature blocks another. Format: `Blocks: [feat-id] description`',
  Assign: '**Assign:** Assigns a task to an actor. Format: `Assign: @actor`',
  Verify: '**Verify:** Defines a verification criterion for a task. The task is done when all Verify conditions pass.',
  Edge: '**Edge:** Defines an edge case scenario within a Story. Contains When/Then behaviors for exceptional flows.',
};

const OBLIGATION_DOCS: Record<string, string> = {
  MUST: '**[MUST]** — Mandatory requirement. The system MUST satisfy this condition. Failure means the feature is broken.',
  SHOULD: '**[SHOULD]** — Strongly recommended. The system SHOULD satisfy this, but exceptions may exist with justification.',
  MAY: '**[MAY]** — Optional enhancement. The system MAY implement this if resources allow.',
};

const UNCERTAINTY_DOCS: Record<string, string> = {
  pending: '**?pending** — This section is awaiting external input or decision before it can be finalized.',
  assumption: '**?assumption** — This section is based on an assumption that needs validation.',
  alternative: '**?alternative** — This section describes an alternative approach being considered.',
  risk: '**?risk** — This section highlights a known risk that may affect the plan.',
};

export function getHover(
  uri: string,
  position: Position,
  docManager: DocumentManager,
): Hover | null {
  const state = docManager.get(uri);
  if (!state) return null;

  const ctx = getCursorContext(state.source, position);
  if (!ctx) return null;

  // 1. Obligation at cursor
  if (ctx.obligation) {
    const doc = OBLIGATION_DOCS[ctx.obligation.level];
    if (doc) {
      return {
        contents: { kind: 'markdown', value: doc },
        range: planRangeToLsp(ctx.obligation.range),
      };
    }
  }

  // 2. Uncertainty marker at cursor
  if (ctx.uncertainty) {
    const typeDoc = UNCERTAINTY_DOCS[ctx.uncertainty.type] ?? '';
    const content = `${typeDoc}\n\n> ${ctx.uncertainty.message}`;
    return {
      contents: { kind: 'markdown', value: content },
      range: planRangeToLsp(ctx.uncertainty.range),
    };
  }

  // 3. Plan reference at cursor
  if (ctx.reference && ctx.reference.kind === 'plan-reference') {
    const targetUri = docManager.getUriForId(ctx.reference.id);
    const targetState = targetUri ? docManager.get(targetUri) : undefined;
    if (targetState?.doc) {
      const { doc } = targetState;
      const lines: string[] = [];
      lines.push(`**[${ctx.reference.id}]**`);
      if (doc.frontmatter) {
        lines.push(`- **type:** ${doc.frontmatter.type}`);
        lines.push(`- **status:** ${doc.frontmatter.status}`);
        if (doc.frontmatter.priority) lines.push(`- **priority:** ${doc.frontmatter.priority}`);
      }
      if (doc.feature) {
        lines.push(`- **title:** ${doc.feature.title}`);
      }
      return {
        contents: { kind: 'markdown', value: lines.join('\n') },
        range: planRangeToLsp(ctx.reference.range),
      };
    }
    // Unresolved reference
    return {
      contents: { kind: 'markdown', value: `**[${ctx.reference.id}]** — _unresolved reference_` },
      range: planRangeToLsp(ctx.reference.range),
    };
  }

  // 4. External reference
  if (ctx.reference && ctx.reference.kind === 'external-reference') {
    return {
      contents: { kind: 'markdown', value: '**[external]** — External dependency (not tracked in this project)' },
      range: planRangeToLsp(ctx.reference.range),
    };
  }

  // 5. Actor reference at cursor
  if (ctx.actor) {
    const actorInfo = findActorDefinition(ctx.actor.name, docManager);
    const content = actorInfo
      ? `**@${ctx.actor.name}**\n\n${actorInfo}`
      : `**@${ctx.actor.name}** — _actor_`;
    return {
      contents: { kind: 'markdown', value: content },
      range: planRangeToLsp(ctx.actor.range),
    };
  }

  // 6. Keyword hover (when cursor is on the keyword itself)
  if (ctx.line.keyword && KEYWORD_DOCS[ctx.line.keyword]) {
    // Check if cursor is on the keyword portion of the line
    const keywordStart = ctx.rawText.indexOf(ctx.line.keyword + ':');
    if (keywordStart >= 0) {
      const keywordEnd = keywordStart + ctx.line.keyword.length + 1;
      if (position.character >= keywordStart && position.character <= keywordEnd) {
        return {
          contents: { kind: 'markdown', value: KEYWORD_DOCS[ctx.line.keyword] },
        };
      }
    }
  }

  // 7. Heading keyword hover
  if (ctx.line.type === 'feature-heading' || ctx.line.type === 'story-heading' || ctx.line.type === 'task-heading') {
    const headingType = ctx.line.type.replace('-heading', '');
    const headingKeyword = headingType.charAt(0).toUpperCase() + headingType.slice(1);
    const docs: Record<string, string> = {
      Feature: '**# Feature:** Top-level specification unit. Contains Goal, Persona, Metric intents, and Stories.',
      Story: '**## Story:** A user story within a Feature. Contains Given/When/Then behaviors, Edges, and Tasks.',
      Task: '**### Task:** An implementation unit within a Story. Contains Assign and Verify lines.',
    };
    if (docs[headingKeyword]) {
      return {
        contents: { kind: 'markdown', value: docs[headingKeyword] },
      };
    }
  }

  return null;
}

/** Find the Persona definition for an actor across the project. */
function findActorDefinition(name: string, docManager: DocumentManager): string | null {
  for (const [, state] of docManager.all()) {
    const { doc } = state;
    if (!doc.feature) continue;

    for (const intent of doc.feature.intents) {
      if (intent.kind === 'persona' && intent.actor?.name === name) {
        return `Defined in **${doc.feature.title}**:\n\n> Persona: @${name} — ${intent.text.replace(`@${name}`, '').replace(/^\s*—?\s*/, '')}`;
      }
    }
    for (const story of doc.feature.stories) {
      for (const intent of story.intents) {
        if (intent.kind === 'persona' && intent.actor?.name === name) {
          return `Defined in **${story.title}**:\n\n> Persona: @${name} — ${intent.text.replace(`@${name}`, '').replace(/^\s*—?\s*/, '')}`;
        }
      }
    }
  }
  return null;
}
