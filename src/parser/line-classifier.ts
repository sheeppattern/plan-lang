import type { RawLine, ClassifiedLine, LineType } from '../types/ast.js';

interface PatternRule {
  pattern: RegExp;
  type: LineType;
  keyword?: string;
  extractValue?: boolean;
  extractTitle?: boolean;
}

const HEADING_PATTERNS: PatternRule[] = [
  { pattern: /^#\s+Feature:\s*(.+)$/, type: 'feature-heading', extractTitle: true },
  { pattern: /^##\s+Story:\s*(.+)$/, type: 'story-heading', extractTitle: true },
  { pattern: /^###\s+Task:\s*(.+)$/, type: 'task-heading', extractTitle: true },
];

const KEYWORD_PATTERNS: PatternRule[] = [
  { pattern: /^\s*Goal:\s*(.*)$/, type: 'intent', keyword: 'Goal', extractValue: true },
  { pattern: /^\s*Persona:\s*(.*)$/, type: 'intent', keyword: 'Persona', extractValue: true },
  { pattern: /^\s*Metric:\s*(.*)$/, type: 'intent', keyword: 'Metric', extractValue: true },
  { pattern: /^\s*Given:\s*(.*)$/, type: 'behavior', keyword: 'Given', extractValue: true },
  { pattern: /^\s*When:\s*(.*)$/, type: 'behavior', keyword: 'When', extractValue: true },
  { pattern: /^\s*Then:\s*(.*)$/, type: 'behavior', keyword: 'Then', extractValue: true },
  { pattern: /^\s*Needs:\s*(.*)$/, type: 'dependency', keyword: 'Needs', extractValue: true },
  { pattern: /^\s*Blocks:\s*(.*)$/, type: 'dependency', keyword: 'Blocks', extractValue: true },
  { pattern: /^\s*Assign:\s*(.*)$/, type: 'task-keyword', keyword: 'Assign', extractValue: true },
  { pattern: /^\s*Verify:\s*(.*)$/, type: 'task-keyword', keyword: 'Verify', extractValue: true },
  { pattern: /^\s*Edge:\s*(.*)$/, type: 'edge', keyword: 'Edge', extractValue: true },
];

const UNCERTAINTY_OPEN = /^\s*\?(pending|assumption|alternative|risk)\s+["""]([^"""]*)["""]?\s*$/;
const UNCERTAINTY_CLOSE = /^\s*\?end\s*$/;
const SEPARATOR = /^---\s*$/;
const COMMENT_FULL = /^\s*<!--.*-->\s*$/;
const COMMENT_OPEN = /^\s*<!--/;
const COMMENT_CLOSE = /-->\s*$/;
const BLANK = /^\s*$/;

export function classifyLine(raw: RawLine): ClassifiedLine {
  const { lineNumber, text } = raw;
  const indent = text.length - text.trimStart().length;
  const trimmed = text.trim();

  // Blank
  if (BLANK.test(text)) {
    return { lineNumber, text, type: 'blank', indent };
  }

  // Separator (---)
  if (SEPARATOR.test(trimmed)) {
    return { lineNumber, text, type: 'separator', indent };
  }

  // Full comment <!-- ... -->
  if (COMMENT_FULL.test(text)) {
    return { lineNumber, text, type: 'comment-full', indent };
  }

  // Comment open <!--
  if (COMMENT_OPEN.test(text) && !COMMENT_CLOSE.test(text)) {
    return { lineNumber, text, type: 'comment-open', indent };
  }

  // Comment close -->
  if (COMMENT_CLOSE.test(text) && !COMMENT_OPEN.test(text)) {
    return { lineNumber, text, type: 'comment-close', indent };
  }

  // Uncertainty close
  if (UNCERTAINTY_CLOSE.test(trimmed)) {
    return { lineNumber, text, type: 'uncertainty-close', indent };
  }

  // Uncertainty open
  const uncMatch = UNCERTAINTY_OPEN.exec(trimmed);
  if (uncMatch) {
    return {
      lineNumber,
      text,
      type: 'uncertainty-open',
      keyword: uncMatch[1],
      value: uncMatch[2],
      indent,
    };
  }

  // Headings (must be checked on untrimmed text for # counting)
  for (const rule of HEADING_PATTERNS) {
    const m = rule.pattern.exec(text);
    if (m) {
      return {
        lineNumber,
        text,
        type: rule.type,
        headingTitle: m[1]?.trim(),
        indent,
      };
    }
  }

  // Keyword lines
  for (const rule of KEYWORD_PATTERNS) {
    const m = rule.pattern.exec(text);
    if (m) {
      return {
        lineNumber,
        text,
        type: rule.type,
        keyword: rule.keyword,
        value: m[1]?.trim(),
        indent,
      };
    }
  }

  // Default: text
  return { lineNumber, text, type: 'text', indent };
}

export function classifyLines(lines: RawLine[]): ClassifiedLine[] {
  return lines.map(classifyLine);
}
