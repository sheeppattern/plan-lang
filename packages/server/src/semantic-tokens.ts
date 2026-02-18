/**
 * Semantic Tokens provider.
 * Provides context-aware highlighting more precise than TextMate grammar.
 */
import {
  SemanticTokensLegend,
  SemanticTokensBuilder,
  type SemanticTokens,
} from 'vscode-languageserver';
import {
  classifyLine,
  parseReferences,
  parseActorReferences,
  parseObligation,
  parseUncertaintyMarkers,
} from 'plan-lang';
import type { DocumentManager } from './document-manager.js';

// Token types — order matters (index used in builder)
const tokenTypes = [
  'keyword',      // 0: Goal:, When:, Assign: etc.
  'type',         // 1: Feature:, Story:, Task: heading keywords
  'string',       // 2: Edge description, uncertainty message
  'variable',     // 3: @actor
  'property',     // 4: frontmatter key
  'enumMember',   // 5: [MUST], [SHOULD], [MAY]
  'comment',      // 6: <!-- -->
  'namespace',    // 7: [feat-id]
  'macro',        // 8: ?pending, ?assumption etc.
];

const tokenModifiers: string[] = [];

export const semanticTokensLegend: SemanticTokensLegend = {
  tokenTypes,
  tokenModifiers,
};

// Token type indices
const TK_KEYWORD = 0;
const TK_TYPE = 1;
const TK_STRING = 2;
const TK_VARIABLE = 3;
const TK_PROPERTY = 4;
const TK_ENUM_MEMBER = 5;
const TK_COMMENT = 6;
const TK_NAMESPACE = 7;
const TK_MACRO = 8;

export function getSemanticTokens(
  uri: string,
  docManager: DocumentManager,
): SemanticTokens {
  const state = docManager.get(uri);
  const builder = new SemanticTokensBuilder();
  if (!state) return builder.build();

  const lines = state.source.split(/\r?\n/);
  let inFrontmatter = false;
  let inComment = false;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    const lineNumber = i + 1; // 1-based

    // Frontmatter boundaries
    if (text.trim() === '---') {
      if (!inFrontmatter && i < 3) {
        inFrontmatter = true;
        continue;
      }
      if (inFrontmatter) {
        inFrontmatter = false;
        continue;
      }
    }

    // Frontmatter keys
    if (inFrontmatter) {
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0) {
        builder.push(i, 0, colonIdx, TK_PROPERTY, 0);
      }
      continue;
    }

    // Comment handling
    const trimmed = text.trim();
    if (trimmed.startsWith('<!--') && trimmed.endsWith('-->')) {
      builder.push(i, text.indexOf('<!--'), text.length - text.indexOf('<!--'), TK_COMMENT, 0);
      continue;
    }
    if (trimmed.startsWith('<!--')) {
      inComment = true;
      builder.push(i, text.indexOf('<!--'), text.length - text.indexOf('<!--'), TK_COMMENT, 0);
      continue;
    }
    if (inComment) {
      builder.push(i, 0, text.length, TK_COMMENT, 0);
      if (trimmed.endsWith('-->')) {
        inComment = false;
      }
      continue;
    }

    // Classify the line
    const classified = classifyLine({ lineNumber, text });

    switch (classified.type) {
      case 'feature-heading': {
        // "# Feature:" — highlight the heading keyword
        const match = text.match(/^(#\s+Feature:)/);
        if (match) {
          builder.push(i, 0, match[1].length, TK_TYPE, 0);
        }
        break;
      }
      case 'story-heading': {
        const match = text.match(/^(##\s+Story:)/);
        if (match) {
          builder.push(i, 0, match[1].length, TK_TYPE, 0);
        }
        break;
      }
      case 'task-heading': {
        const match = text.match(/^(###\s+Task:)/);
        if (match) {
          builder.push(i, 0, match[1].length, TK_TYPE, 0);
        }
        break;
      }
      case 'intent':
      case 'behavior':
      case 'dependency':
      case 'task-keyword':
      case 'edge': {
        // Highlight the keyword portion (e.g. "Goal:", "When:", "Edge:")
        if (classified.keyword) {
          const kwPattern = new RegExp(`^(\\s*)(${classified.keyword}:)`);
          const kwMatch = kwPattern.exec(text);
          if (kwMatch) {
            const startChar = kwMatch[1].length;
            builder.push(i, startChar, kwMatch[2].length, TK_KEYWORD, 0);
          }
        }
        // Edge: highlight the description as string
        if (classified.type === 'edge' && classified.value) {
          const kwEnd = text.indexOf(':') + 1;
          const valueStart = text.indexOf(classified.value, kwEnd);
          if (valueStart >= 0) {
            builder.push(i, valueStart, classified.value.length, TK_STRING, 0);
          }
        }
        break;
      }
      case 'uncertainty-open': {
        // ?pending "msg" / ?assumption "msg" etc.
        const uncMatch = text.match(/(\?(pending|assumption|alternative|risk))/);
        if (uncMatch) {
          const start = text.indexOf(uncMatch[1]);
          builder.push(i, start, uncMatch[1].length, TK_MACRO, 0);
        }
        // Highlight the message in quotes
        const msgMatch = text.match(/["""](.*?)["""]/);
        if (msgMatch) {
          const msgStart = text.indexOf(msgMatch[0]);
          builder.push(i, msgStart, msgMatch[0].length, TK_STRING, 0);
        }
        break;
      }
      case 'uncertainty-close': {
        const endMatch = text.match(/(\?end)/);
        if (endMatch) {
          const start = text.indexOf(endMatch[1]);
          builder.push(i, start, endMatch[1].length, TK_MACRO, 0);
        }
        break;
      }
      default:
        break;
    }

    // Inline tokens — skip frontmatter and comments
    if (classified.type === 'blank' || classified.type === 'separator') continue;

    // [feat-id] references
    const refs = parseReferences(text, lineNumber);
    for (const ref of refs) {
      if (ref.kind === 'plan-reference') {
        const startChar = ref.range.start.column - 1;
        const length = ref.range.end.column - ref.range.start.column;
        builder.push(i, startChar, length, TK_NAMESPACE, 0);
      }
    }

    // @actor references
    const actors = parseActorReferences(text, lineNumber);
    for (const actor of actors) {
      const startChar = actor.range.start.column - 1;
      const length = actor.range.end.column - actor.range.start.column;
      builder.push(i, startChar, length, TK_VARIABLE, 0);
    }

    // [MUST], [SHOULD], [MAY] obligations
    const obl = parseObligation(text, lineNumber);
    if (obl) {
      const startChar = obl.range.start.column - 1;
      const length = obl.range.end.column - obl.range.start.column;
      builder.push(i, startChar, length, TK_ENUM_MEMBER, 0);
    }

    // ?pending("msg") inline markers
    const markers = parseUncertaintyMarkers(text, lineNumber);
    for (const marker of markers) {
      const startChar = marker.range.start.column - 1;
      const length = marker.range.end.column - marker.range.start.column;
      builder.push(i, startChar, length, TK_MACRO, 0);
    }
  }

  return builder.build();
}
