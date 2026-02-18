import type {
  UncertaintyMarker,
  Obligation,
  ObligationLevel,
  ActorReference,
  Reference,
  PlanReference,
  ExternalReference,
  DocReference,
  UncertaintyType,
  Range,
} from '../types/ast.js';

function mkRange(line: number, col: number, endCol: number): Range {
  return {
    start: { line, column: col },
    end: { line, column: endCol },
  };
}

// ── Uncertainty Marker ────────────────────────────
// Matches: ?pending("...") or ?assumption("...") etc.
const UNCERTAINTY_INLINE_RE =
  /\?(pending|assumption|alternative|risk)\([""]([^""]*)[""]\)/g;

export function parseUncertaintyMarkers(
  text: string,
  lineNumber: number,
): UncertaintyMarker[] {
  const markers: UncertaintyMarker[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(UNCERTAINTY_INLINE_RE.source, 'g');
  while ((m = re.exec(text)) !== null) {
    markers.push({
      kind: 'uncertainty-marker',
      type: m[1] as UncertaintyType,
      message: m[2],
      range: mkRange(lineNumber, m.index + 1, m.index + m[0].length + 1),
    });
  }
  return markers;
}

// ── Obligation ────────────────────────────────────
// Matches: [MUST], [SHOULD], [MAY]
const OBLIGATION_RE = /\[(MUST|SHOULD|MAY)\]/g;

export function parseObligation(
  text: string,
  lineNumber: number,
): Obligation | undefined {
  const re = new RegExp(OBLIGATION_RE.source, 'g');
  const m = re.exec(text);
  if (!m) return undefined;
  return {
    kind: 'obligation',
    level: m[1] as ObligationLevel,
    range: mkRange(lineNumber, m.index + 1, m.index + m[0].length + 1),
  };
}

// ── Actor Reference ───────────────────────────────
// Matches: @identifier
const ACTOR_REF_RE = /@([a-zA-Z_][a-zA-Z0-9_-]*)/g;

export function parseActorReferences(
  text: string,
  lineNumber: number,
): ActorReference[] {
  const refs: ActorReference[] = [];
  const re = new RegExp(ACTOR_REF_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    refs.push({
      kind: 'actor-reference',
      name: m[1],
      range: mkRange(lineNumber, m.index + 1, m.index + m[0].length + 1),
    });
  }
  return refs;
}

// ── Plan Reference ────────────────────────────────
// Matches: [feat-social-login], [feat-auth#story-google], [external], [doc:api-design]
const PLAN_REF_RE = /\[([a-zA-Z][a-zA-Z0-9_:-]*(?:#[a-zA-Z0-9_-]+)?)\]/g;

export function parseReferences(
  text: string,
  lineNumber: number,
): Reference[] {
  const refs: Reference[] = [];
  const re = new RegExp(PLAN_REF_RE.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const content = m[1];
    const range = mkRange(lineNumber, m.index + 1, m.index + m[0].length + 1);

    // Skip obligation markers
    if (content === 'MUST' || content === 'SHOULD' || content === 'MAY') continue;

    if (content === 'external') {
      refs.push({ kind: 'external-reference', range });
    } else if (content.startsWith('doc:')) {
      refs.push({
        kind: 'doc-reference',
        id: content.slice(4),
        range,
      });
    } else {
      const hashIdx = content.indexOf('#');
      if (hashIdx >= 0) {
        refs.push({
          kind: 'plan-reference',
          id: content.slice(0, hashIdx),
          fragment: content.slice(hashIdx + 1),
          range,
        });
      } else {
        refs.push({
          kind: 'plan-reference',
          id: content,
          range,
        });
      }
    }
  }
  return refs;
}

/**
 * Strips inline uncertainty markers from text for clean display.
 */
export function stripUncertainty(text: string): string {
  return text.replace(/\s*\?(pending|assumption|alternative|risk)\([""][^""]*[""]\)/g, '').trim();
}

/**
 * Strips obligation markers from text.
 */
export function stripObligation(text: string): string {
  return text.replace(/\s*\[(MUST|SHOULD|MAY)\]/g, '').trim();
}
