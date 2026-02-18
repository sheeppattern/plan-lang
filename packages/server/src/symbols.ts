/**
 * Document Symbols provider for Outline panel.
 * Maps AST nodes to DocumentSymbol hierarchy.
 */
import {
  DocumentSymbol,
  SymbolKind,
} from 'vscode-languageserver';
import { walkAST } from 'plan-lang';
import type {
  PlanDocument,
  FeatureBlock,
  StoryBlock,
  TaskBlock,
  EdgeBlock,
  IntentLine,
  BehaviorLine,
} from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { planRangeToLsp } from './position-utils.js';

export function getDocumentSymbols(
  uri: string,
  docManager: DocumentManager,
): DocumentSymbol[] {
  const state = docManager.get(uri);
  if (!state) return [];

  const { doc } = state;
  return buildSymbols(doc);
}

function buildSymbols(doc: PlanDocument): DocumentSymbol[] {
  const result: DocumentSymbol[] = [];
  if (!doc.feature) return result;

  const featureSymbol = makeSymbol(
    doc.feature.title,
    'Feature',
    SymbolKind.Module,
    doc.feature.range,
  );

  // Feature-level intents
  for (const intent of doc.feature.intents) {
    featureSymbol.children!.push(intentToSymbol(intent));
  }

  // Stories
  for (const story of doc.feature.stories) {
    const storySymbol = makeSymbol(
      story.title,
      'Story',
      SymbolKind.Class,
      story.range,
    );

    // Story intents
    for (const intent of story.intents) {
      storySymbol.children!.push(intentToSymbol(intent));
    }

    // Story behaviors
    for (const beh of story.behaviors) {
      storySymbol.children!.push(behaviorToSymbol(beh));
    }

    // Edges
    for (const edge of story.edges) {
      storySymbol.children!.push(edgeToSymbol(edge));
    }

    // Tasks
    for (const task of story.tasks) {
      storySymbol.children!.push(taskToSymbol(task));
    }

    featureSymbol.children!.push(storySymbol);
  }

  result.push(featureSymbol);
  return result;
}

function makeSymbol(
  name: string,
  detail: string,
  kind: SymbolKind,
  range: { start: { line: number; column: number }; end: { line: number; column: number } },
): DocumentSymbol {
  const lspRange = planRangeToLsp(range);
  return {
    name,
    detail,
    kind,
    range: lspRange,
    selectionRange: lspRange,
    children: [],
  };
}

function intentToSymbol(intent: IntentLine): DocumentSymbol {
  const label = `${capitalize(intent.kind)}: ${intent.text}`;
  return makeSymbol(label, intent.kind, SymbolKind.Property, intent.range);
}

function behaviorToSymbol(beh: BehaviorLine): DocumentSymbol {
  const label = `${capitalize(beh.kind)}: ${beh.text}`;
  return makeSymbol(label, beh.kind, SymbolKind.Property, beh.range);
}

function edgeToSymbol(edge: EdgeBlock): DocumentSymbol {
  const sym = makeSymbol(
    edge.description,
    'Edge',
    SymbolKind.Interface,
    edge.range,
  );
  for (const beh of edge.behaviors) {
    sym.children!.push(behaviorToSymbol(beh));
  }
  return sym;
}

function taskToSymbol(task: TaskBlock): DocumentSymbol {
  return makeSymbol(
    task.title,
    'Task',
    SymbolKind.Function,
    task.range,
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
