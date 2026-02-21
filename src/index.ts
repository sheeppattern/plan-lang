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
  stripUncertainty,
  stripObligation,
} from './parser/inline-parser.js';

// Fixer
export { applyFixes, getFixesForDiagnostics, getFixableRuleIds } from './fixer/index.js';
export type { Fix, FixProvider, FixResult } from './fixer/fix-types.js';

// Formatter
export { formatPlanSource } from './formatter/index.js';
export type { FormatOptions, FormatResult } from './formatter/format-types.js';

// Converter
export { convert, getSupportedFormats } from './converter/index.js';
export type { ConvertFormat, Converter } from './converter/converter-types.js';

// Boilerplate
export { generatePlanFile, validateId, renderTemplate, getTemplate, listTemplates, loadCustomTemplates, findSimilarTemplate } from './boilerplate/index.js';
export type { BuiltinTemplateName, TemplateVariables, TemplateDefinition, GenerateOptions, GenerateResult } from './boilerplate/index.js';
