/**
 * Completion provider: context-aware auto-completion for .plan files.
 *
 * Trigger characters: ':', '[', '@', '?', '#'
 *
 * Contexts:
 * - Line start (empty): keyword completions filtered by current block
 * - '#' at start: heading completions
 * - '[': project IDs + [external]
 * - '@': actor names from project
 * - '?': uncertainty marker snippets
 * - After 'Then:': obligation levels
 * - Frontmatter 'status:': status values
 * - Frontmatter 'type:': type values
 * - Frontmatter 'priority:': priority values
 */
import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  TextEdit,
  Range,
  type Position,
} from 'vscode-languageserver';
import type { DocumentManager } from './document-manager.js';

export function getCompletions(
  uri: string,
  position: Position,
  docManager: DocumentManager,
): CompletionItem[] {
  const state = docManager.get(uri);
  if (!state) return [];

  const lines = state.source.split(/\r?\n/);
  const lineIndex = position.line;
  if (lineIndex < 0 || lineIndex >= lines.length) return [];

  const lineText = lines[lineIndex];
  const textBefore = lineText.substring(0, position.character);

  // Check if we're in frontmatter
  if (isInFrontmatter(lines, lineIndex)) {
    return getFrontmatterCompletions(textBefore, position);
  }

  // '#' at line start → heading completions (replace entire line prefix)
  if (/^#{1,3}\s*$/.test(textBefore)) {
    return getHeadingCompletions(textBefore, position);
  }

  // '[' trigger → reference completions
  const refMatch = textBefore.match(/\[([^\]\s]*)$/);
  if (refMatch) {
    const prefixStart = position.character - refMatch[0].length;
    return getReferenceCompletions(docManager, position, prefixStart);
  }

  // '@' trigger → actor completions
  const actorMatch = textBefore.match(/@([\w-]*)$/);
  if (actorMatch) {
    const prefixStart = position.character - actorMatch[0].length;
    return getActorCompletions(docManager, position, prefixStart);
  }

  // '?' trigger → uncertainty completions
  const uncMatch = textBefore.match(/\?([\w]*)$/);
  if (uncMatch) {
    const prefixStart = position.character - uncMatch[0].length;
    return getUncertaintyCompletions(position, prefixStart);
  }

  // After 'Then:' text → obligation completions
  if (/^\s*Then:.*$/i.test(textBefore) && !textBefore.includes('[MUST]') && !textBefore.includes('[SHOULD]') && !textBefore.includes('[MAY]')) {
    return getObligationCompletions();
  }

  // Empty or whitespace-only line, or partially typed word → keyword completions
  if (/^\s*\w*$/.test(textBefore)) {
    return getKeywordCompletions(lines, lineIndex, textBefore, position);
  }

  return [];
}

function isInFrontmatter(lines: string[], lineIndex: number): boolean {
  if (lines[0]?.trim() !== '---') return false;
  // Find closing ---
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      return lineIndex > 0 && lineIndex < i;
    }
  }
  // No closing found → still in frontmatter (if after first ---)
  return lineIndex > 0;
}

function getFrontmatterCompletions(textBefore: string, position: Position): CompletionItem[] {
  const trimmed = textBefore.trimStart();

  // After 'status: '
  if (/^status:\s*\w*$/i.test(trimmed)) {
    return ['draft', 'ready', 'in_progress', 'blocked', 'done', 'deprecated'].map(
      (val, i) => ({
        label: val,
        kind: CompletionItemKind.EnumMember,
        sortText: String(i).padStart(2, '0'),
      }),
    );
  }

  // After 'type: '
  if (/^type:\s*\w*$/i.test(trimmed)) {
    return ['feature', 'story', 'task'].map(
      (val, i) => ({
        label: val,
        kind: CompletionItemKind.EnumMember,
        sortText: String(i).padStart(2, '0'),
      }),
    );
  }

  // After 'priority: '
  if (/^priority:\s*\w*$/i.test(trimmed)) {
    return ['urgent', 'high', 'normal', 'low'].map(
      (val, i) => ({
        label: val,
        kind: CompletionItemKind.EnumMember,
        sortText: String(i).padStart(2, '0'),
      }),
    );
  }

  // Frontmatter keys
  if (/^\w*$/.test(trimmed)) {
    return [
      { label: 'type', kind: CompletionItemKind.Property, insertText: 'type: ' },
      { label: 'id', kind: CompletionItemKind.Property, insertText: 'id: ' },
      { label: 'status', kind: CompletionItemKind.Property, insertText: 'status: ' },
      { label: 'version', kind: CompletionItemKind.Property, insertText: 'version: ' },
      { label: 'owner', kind: CompletionItemKind.Property, insertText: 'owner: ' },
      { label: 'priority', kind: CompletionItemKind.Property, insertText: 'priority: ' },
      { label: 'tags', kind: CompletionItemKind.Property, insertText: 'tags: [$1]', insertTextFormat: InsertTextFormat.Snippet },
      { label: 'created', kind: CompletionItemKind.Property, insertText: 'created: ' },
      { label: 'updated', kind: CompletionItemKind.Property, insertText: 'updated: ' },
    ];
  }

  return [];
}

function getHeadingCompletions(textBefore: string, position: Position): CompletionItem[] {
  const items: CompletionItem[] = [];
  // Replace from line start to cursor
  const replaceRange = Range.create(position.line, 0, position.line, position.character);

  items.push({
    label: '# Feature:',
    kind: CompletionItemKind.Snippet,
    detail: 'Feature heading',
    textEdit: TextEdit.replace(replaceRange, '# Feature: '),
    insertTextFormat: InsertTextFormat.PlainText,
    sortText: '0',
  });
  items.push({
    label: '## Story:',
    kind: CompletionItemKind.Snippet,
    detail: 'Story heading',
    textEdit: TextEdit.replace(replaceRange, '## Story: '),
    insertTextFormat: InsertTextFormat.PlainText,
    sortText: '1',
  });
  items.push({
    label: '### Task:',
    kind: CompletionItemKind.Snippet,
    detail: 'Task heading',
    textEdit: TextEdit.replace(replaceRange, '### Task: '),
    insertTextFormat: InsertTextFormat.PlainText,
    sortText: '2',
  });

  return items;
}

function getReferenceCompletions(
  docManager: DocumentManager,
  position: Position,
  prefixStart: number,
): CompletionItem[] {
  const ids = docManager.getAllIds();
  // Replace range: from '[' to cursor
  const replaceRange = Range.create(position.line, prefixStart, position.line, position.character);

  const items: CompletionItem[] = ids.map((id, i) => {
    const targetUri = docManager.getUriForId(id);
    const targetState = targetUri ? docManager.get(targetUri) : undefined;
    const title = targetState?.doc.feature?.title;
    return {
      label: id,
      kind: CompletionItemKind.Reference,
      detail: title ?? 'plan reference',
      filterText: `[${id}`,
      textEdit: TextEdit.replace(replaceRange, `[${id}]`),
      sortText: String(i).padStart(4, '0'),
    };
  });

  items.push({
    label: 'external',
    kind: CompletionItemKind.Reference,
    detail: 'External dependency',
    filterText: '[external',
    textEdit: TextEdit.replace(replaceRange, '[external]'),
    sortText: 'zzzz',
  });

  return items;
}

function getActorCompletions(
  docManager: DocumentManager,
  position: Position,
  prefixStart: number,
): CompletionItem[] {
  const actors = docManager.getAllActors();
  // Replace range: from '@' to cursor
  const replaceRange = Range.create(position.line, prefixStart, position.line, position.character);

  return actors.map((name, i) => ({
    label: `@${name}`,
    kind: CompletionItemKind.Variable,
    detail: 'actor',
    filterText: `@${name}`,
    textEdit: TextEdit.replace(replaceRange, `@${name}`),
    sortText: String(i).padStart(4, '0'),
  }));
}

function getUncertaintyCompletions(position: Position, prefixStart: number): CompletionItem[] {
  // Replace range: from '?' to cursor
  const replaceRange = Range.create(position.line, prefixStart, position.line, position.character);

  return [
    {
      label: '?pending("...")',
      kind: CompletionItemKind.Snippet,
      filterText: '?pending',
      textEdit: TextEdit.replace(replaceRange, '?pending("$1")'),
      insertTextFormat: InsertTextFormat.Snippet,
      detail: 'Pending decision or input',
      sortText: '0',
    },
    {
      label: '?assumption("...")',
      kind: CompletionItemKind.Snippet,
      filterText: '?assumption',
      textEdit: TextEdit.replace(replaceRange, '?assumption("$1")'),
      insertTextFormat: InsertTextFormat.Snippet,
      detail: 'Assumption needing validation',
      sortText: '1',
    },
    {
      label: '?alternative("...")',
      kind: CompletionItemKind.Snippet,
      filterText: '?alternative',
      textEdit: TextEdit.replace(replaceRange, '?alternative("$1")'),
      insertTextFormat: InsertTextFormat.Snippet,
      detail: 'Alternative approach',
      sortText: '2',
    },
    {
      label: '?risk("...")',
      kind: CompletionItemKind.Snippet,
      filterText: '?risk',
      textEdit: TextEdit.replace(replaceRange, '?risk("$1")'),
      insertTextFormat: InsertTextFormat.Snippet,
      detail: 'Known risk',
      sortText: '3',
    },
  ];
}

function getObligationCompletions(): CompletionItem[] {
  return [
    {
      label: '[MUST]',
      kind: CompletionItemKind.Keyword,
      detail: 'Mandatory requirement',
      sortText: '0',
    },
    {
      label: '[SHOULD]',
      kind: CompletionItemKind.Keyword,
      detail: 'Strongly recommended',
      sortText: '1',
    },
    {
      label: '[MAY]',
      kind: CompletionItemKind.Keyword,
      detail: 'Optional enhancement',
      sortText: '2',
    },
  ];
}

function getKeywordCompletions(
  lines: string[],
  lineIndex: number,
  textBefore: string,
  position: Position,
): CompletionItem[] {
  const context = detectBlockContext(lines, lineIndex);
  const items: CompletionItem[] = [];

  // Replace range: from line start (after leading whitespace) to cursor
  const indent = textBefore.match(/^(\s*)/)?.[1] ?? '';
  const replaceRange = Range.create(position.line, indent.length, position.line, position.character);

  const allKeywords = [
    { label: 'Goal:', detail: 'Objective declaration', contexts: ['feature', 'story', 'unknown'] },
    { label: 'Persona:', detail: 'User/actor definition', contexts: ['feature', 'story', 'unknown'] },
    { label: 'Metric:', detail: 'Success criterion', contexts: ['feature', 'unknown'] },
    { label: 'Given:', detail: 'Precondition', contexts: ['story', 'edge', 'unknown'] },
    { label: 'When:', detail: 'Trigger action', contexts: ['story', 'edge', 'unknown'] },
    { label: 'Then:', detail: 'Expected outcome', contexts: ['story', 'edge', 'unknown'] },
    { label: 'Needs:', detail: 'Dependency', contexts: ['feature', 'story', 'task', 'unknown'] },
    { label: 'Blocks:', detail: 'Blocks another feature', contexts: ['feature', 'story', 'task', 'unknown'] },
    { label: 'Assign:', detail: 'Task assignment', contexts: ['task', 'unknown'] },
    { label: 'Verify:', detail: 'Verification criterion', contexts: ['task', 'unknown'] },
    { label: 'Edge:', detail: 'Edge case scenario', contexts: ['story', 'unknown'] },
  ];

  for (const kw of allKeywords) {
    if (kw.contexts.includes(context)) {
      items.push({
        label: kw.label,
        kind: CompletionItemKind.Keyword,
        detail: kw.detail,
        textEdit: TextEdit.replace(replaceRange, `${kw.label} `),
        insertTextFormat: InsertTextFormat.PlainText,
        sortText: kw.label,
      });
    }
  }

  // Also suggest headings when on empty line
  if (/^\s*$/.test(textBefore)) {
    const headingReplace = Range.create(position.line, 0, position.line, position.character);
    items.push({
      label: '# Feature:',
      kind: CompletionItemKind.Snippet,
      detail: 'Feature heading',
      textEdit: TextEdit.replace(headingReplace, '# Feature: '),
      sortText: 'z0',
    });
    items.push({
      label: '## Story:',
      kind: CompletionItemKind.Snippet,
      detail: 'Story heading',
      textEdit: TextEdit.replace(headingReplace, '## Story: '),
      sortText: 'z1',
    });
    items.push({
      label: '### Task:',
      kind: CompletionItemKind.Snippet,
      detail: 'Task heading',
      textEdit: TextEdit.replace(headingReplace, '### Task: '),
      sortText: 'z2',
    });
  }

  return items;
}

type BlockContext = 'feature' | 'story' | 'task' | 'edge' | 'unknown';

function detectBlockContext(lines: string[], lineIndex: number): BlockContext {
  for (let i = lineIndex - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (/^###\s+Task:/.test(trimmed)) return 'task';
    if (/^Edge:/.test(trimmed)) return 'edge';
    if (/^##\s+Story:/.test(trimmed)) return 'story';
    if (/^#\s+Feature:/.test(trimmed)) return 'feature';
  }
  return 'unknown';
}
