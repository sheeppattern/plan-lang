// Public API
export type {
  PlanDocument,
  FeatureBlock,
  StoryBlock,
  TaskBlock,
  EdgeBlock,
  UncertaintyBlock,
  Frontmatter,
  Diagnostic,
  Severity,
  IntentLine,
  BehaviorLine,
  DependencyLine,
  TaskKeywordLine,
  TextLine,
  UncertaintyMarker,
  UncertaintyType,
  Obligation,
  ObligationLevel,
  Reference,
  ActorReference,
  PlanReference,
  ExternalReference,
  DocReference,
  ParseError,
  ClassifiedLine,
  RawLine,
  LineType,
  Location,
  Range,
  Status,
  Priority,
  PlanType,
  GoalLine,
  PersonaLine,
  MetricLine,
  GivenLine,
  WhenLine,
  ThenLine,
  NeedsLine,
  BlocksLine,
  AssignLine,
  VerifyLine,
} from './types/ast.js';

export { parsePlanFile, scan, classifyLine, classifyLines, parseFrontmatter, parse } from './parser/index.js';
export { LintEngine } from './linter/index.js';
export type { LintRule, LintContext } from './linter/index.js';
export { walkAST } from './linter/visitor.js';
export type { ASTVisitor } from './linter/visitor.js';
export { loadProject } from './project/project-loader.js';
export type { ProjectLoadResult } from './project/project-loader.js';
export { resolveReferences } from './project/cross-file-resolver.js';
export type { ResolvedReference, UnresolvedReference } from './project/cross-file-resolver.js';
export { collectUncertainty, formatUncertaintyReport } from './reporters/uncertainty-reporter.js';
export { formatTextReport } from './reporters/text-reporter.js';
export { formatJsonReport } from './reporters/json-reporter.js';

// Inline parser utilities
export {
  parseUncertaintyMarkers,
  parseObligation,
  parseActorReferences,
  parseReferences,
} from './parser/inline-parser.js';
