/**
 * AST query utilities: find the AST node at a given cursor position.
 */
import type { Position } from 'vscode-languageserver';
import {
  classifyLine,
  parseReferences,
  parseActorReferences,
  parseObligation,
  parseUncertaintyMarkers,
} from 'plan-lang';
import type {
  PlanDocument,
  ClassifiedLine,
  Reference,
  ActorReference,
  Obligation,
  UncertaintyMarker,
} from 'plan-lang';
import { planRangeContainsLspPosition } from './position-utils.js';

export interface CursorContext {
  /** The classified line at the cursor. */
  line: ClassifiedLine;
  /** Raw text of the line. */
  rawText: string;
  /** 0-based character offset of cursor. */
  character: number;
  /** Reference at cursor, if any. */
  reference?: Reference;
  /** Actor reference at cursor, if any. */
  actor?: ActorReference;
  /** Obligation at cursor, if any. */
  obligation?: Obligation;
  /** Uncertainty marker at cursor, if any. */
  uncertainty?: UncertaintyMarker;
}

/**
 * Analyze the cursor position against the document source.
 */
export function getCursorContext(
  source: string,
  position: Position,
): CursorContext | null {
  const lines = source.split(/\r?\n/);
  const lineIndex = position.line; // 0-based
  if (lineIndex < 0 || lineIndex >= lines.length) return null;

  const rawText = lines[lineIndex];
  const lineNumber = lineIndex + 1; // 1-based for plan-lang

  const classified = classifyLine({ lineNumber, text: rawText });

  // Find inline elements at cursor
  const reference = findReferenceAtCursor(rawText, lineNumber, position);
  const actor = findActorAtCursor(rawText, lineNumber, position);
  const obligation = findObligationAtCursor(rawText, lineNumber, position);
  const uncertainty = findUncertaintyAtCursor(rawText, lineNumber, position);

  return {
    line: classified,
    rawText,
    character: position.character,
    reference,
    actor,
    obligation,
    uncertainty,
  };
}

function findReferenceAtCursor(
  text: string,
  lineNumber: number,
  position: Position,
): Reference | undefined {
  const refs = parseReferences(text, lineNumber);
  return refs.find((r) => planRangeContainsLspPosition(r.range, position));
}

function findActorAtCursor(
  text: string,
  lineNumber: number,
  position: Position,
): ActorReference | undefined {
  const actors = parseActorReferences(text, lineNumber);
  return actors.find((a) => planRangeContainsLspPosition(a.range, position));
}

function findObligationAtCursor(
  text: string,
  lineNumber: number,
  position: Position,
): Obligation | undefined {
  const obl = parseObligation(text, lineNumber);
  if (obl && planRangeContainsLspPosition(obl.range, position)) return obl;
  return undefined;
}

function findUncertaintyAtCursor(
  text: string,
  lineNumber: number,
  position: Position,
): UncertaintyMarker | undefined {
  const markers = parseUncertaintyMarkers(text, lineNumber);
  return markers.find((m) => planRangeContainsLspPosition(m.range, position));
}
