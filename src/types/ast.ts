// ── Location ──────────────────────────────────────
export interface Location {
  line: number;   // 1-based
  column: number; // 1-based
}

export interface Range {
  start: Location;
  end: Location;
}

// ── Frontmatter ──────────────────────────────────
export type PlanType = 'feature' | 'story' | 'task';
export type Status = 'draft' | 'ready' | 'in_progress' | 'blocked' | 'done' | 'deprecated';
export type Priority = 'urgent' | 'high' | 'normal' | 'low';

export interface Frontmatter {
  type: PlanType;
  id: string;
  status: Status;
  version?: string;
  owner?: string;
  priority?: Priority;
  tags?: string[];
  created?: string;
  updated?: string;
  [key: string]: unknown;
}

// ── Inline Elements ──────────────────────────────
export type UncertaintyType = 'pending' | 'assumption' | 'alternative' | 'risk';

export interface UncertaintyMarker {
  kind: 'uncertainty-marker';
  type: UncertaintyType;
  message: string;
  range: Range;
}

export type ObligationLevel = 'MUST' | 'SHOULD' | 'MAY';

export interface Obligation {
  kind: 'obligation';
  level: ObligationLevel;
  range: Range;
}

export interface ActorReference {
  kind: 'actor-reference';
  name: string;
  range: Range;
}

export interface PlanReference {
  kind: 'plan-reference';
  id: string;
  fragment?: string;  // e.g. #story-google
  range: Range;
}

export interface ExternalReference {
  kind: 'external-reference';
  range: Range;
}

export interface DocReference {
  kind: 'doc-reference';
  id: string;
  range: Range;
}

export type Reference = PlanReference | ExternalReference | DocReference;

// ── Keyword Lines ────────────────────────────────
export interface GoalLine {
  kind: 'goal';
  text: string;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export interface PersonaLine {
  kind: 'persona';
  text: string;
  actor?: ActorReference;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export interface MetricLine {
  kind: 'metric';
  text: string;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export type IntentLine = GoalLine | PersonaLine | MetricLine;

export interface GivenLine {
  kind: 'given';
  text: string;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export interface WhenLine {
  kind: 'when';
  text: string;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export interface ThenLine {
  kind: 'then';
  text: string;
  obligation?: Obligation;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export type BehaviorLine = GivenLine | WhenLine | ThenLine;

export interface NeedsLine {
  kind: 'needs';
  text: string;
  reference?: Reference;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export interface BlocksLine {
  kind: 'blocks';
  text: string;
  reference?: Reference;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export type DependencyLine = NeedsLine | BlocksLine;

export interface AssignLine {
  kind: 'assign';
  text: string;
  actor?: ActorReference;
  uncertainty?: UncertaintyMarker;
  range: Range;
}

export interface VerifyLine {
  kind: 'verify';
  text: string;
  range: Range;
}

export type TaskKeywordLine = AssignLine | VerifyLine;

// ── Blocks ───────────────────────────────────────
export interface UncertaintyBlock {
  kind: 'uncertainty-block';
  type: UncertaintyType;
  message: string;
  children: (BehaviorLine | IntentLine | DependencyLine | TextLine)[];
  range: Range;
}

export interface TextLine {
  kind: 'text';
  text: string;
  range: Range;
}

export interface EdgeBlock {
  kind: 'edge';
  description: string;
  behaviors: BehaviorLine[];
  range: Range;
}

export interface TaskBlock {
  kind: 'task';
  title: string;
  assigns: AssignLine[];
  verifies: VerifyLine[];
  dependencies: DependencyLine[];
  uncertaintyMarkers: UncertaintyMarker[];
  uncertaintyBlocks: UncertaintyBlock[];
  range: Range;
}

export interface StoryBlock {
  kind: 'story';
  title: string;
  intents: IntentLine[];
  behaviors: BehaviorLine[];
  edges: EdgeBlock[];
  tasks: TaskBlock[];
  dependencies: DependencyLine[];
  uncertaintyMarkers: UncertaintyMarker[];
  uncertaintyBlocks: UncertaintyBlock[];
  range: Range;
}

export interface FeatureBlock {
  kind: 'feature';
  title: string;
  intents: IntentLine[];
  stories: StoryBlock[];
  dependencies: DependencyLine[];
  uncertaintyMarkers: UncertaintyMarker[];
  uncertaintyBlocks: UncertaintyBlock[];
  range: Range;
}

// ── Document ─────────────────────────────────────
export interface ParseError {
  message: string;
  range: Range;
}

export interface PlanDocument {
  kind: 'document';
  filePath?: string;
  frontmatter: Frontmatter | null;
  feature: FeatureBlock | null;
  errors: ParseError[];
  comments: Range[];
}

// ── Diagnostics (for Linter) ─────────────────────
export type Severity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  ruleId: string;
  severity: Severity;
  message: string;
  range: Range;
  filePath?: string;
}

// ── Scanner Types ────────────────────────────────
export interface RawLine {
  lineNumber: number;  // 1-based
  text: string;
}

export interface FrontmatterBounds {
  startLine: number;  // line of opening ---
  endLine: number;    // line of closing ---
  content: string;    // raw YAML text between ---
}

// ── Line Classifier Types ────────────────────────
export type LineType =
  | 'feature-heading'
  | 'story-heading'
  | 'task-heading'
  | 'intent'       // Goal: | Persona: | Metric:
  | 'behavior'     // Given: | When: | Then:
  | 'dependency'   // Needs: | Blocks:
  | 'task-keyword' // Assign: | Verify:
  | 'edge'         // Edge:
  | 'uncertainty-open'  // ?pending/assumption/alternative/risk "..."
  | 'uncertainty-close' // ?end
  | 'separator'    // ---
  | 'comment-open' // <!--
  | 'comment-close'// -->
  | 'comment-full' // <!-- ... -->
  | 'blank'
  | 'text';

export type IntentKeyword = 'Goal' | 'Persona' | 'Metric';
export type BehaviorKeyword = 'Given' | 'When' | 'Then';
export type DependencyKeyword = 'Needs' | 'Blocks';
export type TaskKeyword = 'Assign' | 'Verify';

export interface ClassifiedLine {
  lineNumber: number;
  text: string;
  type: LineType;
  keyword?: string;     // e.g. 'Goal', 'When', 'Edge', etc.
  value?: string;       // text after "Keyword: "
  indent: number;       // leading whitespace count
  headingTitle?: string; // for headings: extracted title after "Feature: " etc.
}
