import yaml from 'js-yaml';
import type { Frontmatter, ParseError, FrontmatterBounds } from '../types/ast.js';

export interface FrontmatterResult {
  frontmatter: Frontmatter | null;
  errors: ParseError[];
}

const VALID_TYPES = ['feature', 'story', 'task'];
const VALID_STATUSES = ['draft', 'ready', 'in_progress', 'blocked', 'done', 'deprecated'];
const VALID_PRIORITIES = ['urgent', 'high', 'normal', 'low'];

export function parseFrontmatter(bounds: FrontmatterBounds): FrontmatterResult {
  const errors: ParseError[] = [];

  let parsed: Record<string, unknown>;
  try {
    // Preprocess: quote @-prefixed values that YAML 1.1 treats as reserved
    const safeContent = bounds.content.replace(
      /^(\s*\w+:\s+)(@[^\s,\]]+.*)$/gm,
      (_, prefix, value) => `${prefix}"${value}"`,
    );
    parsed = yaml.load(safeContent) as Record<string, unknown>;
  } catch (e) {
    errors.push({
      message: `Invalid YAML in frontmatter: ${(e as Error).message}`,
      range: {
        start: { line: bounds.startLine, column: 1 },
        end: { line: bounds.endLine, column: 4 },
      },
    });
    return { frontmatter: null, errors };
  }

  if (!parsed || typeof parsed !== 'object') {
    errors.push({
      message: 'Frontmatter must be a YAML mapping',
      range: {
        start: { line: bounds.startLine, column: 1 },
        end: { line: bounds.endLine, column: 4 },
      },
    });
    return { frontmatter: null, errors };
  }

  const mkError = (msg: string): ParseError => ({
    message: msg,
    range: {
      start: { line: bounds.startLine, column: 1 },
      end: { line: bounds.endLine, column: 4 },
    },
  });

  // Required: type
  if (!parsed.type) {
    errors.push(mkError('Frontmatter missing required field: type'));
  } else if (!VALID_TYPES.includes(parsed.type as string)) {
    errors.push(mkError(`Invalid type "${parsed.type}". Must be one of: ${VALID_TYPES.join(', ')}`));
  }

  // Required: id
  if (!parsed.id) {
    errors.push(mkError('Frontmatter missing required field: id'));
  }

  // Required: status
  if (!parsed.status) {
    errors.push(mkError('Frontmatter missing required field: status'));
  } else if (!VALID_STATUSES.includes(parsed.status as string)) {
    errors.push(mkError(`Invalid status "${parsed.status}". Must be one of: ${VALID_STATUSES.join(', ')}`));
  }

  // Optional validation
  if (parsed.priority && !VALID_PRIORITIES.includes(parsed.priority as string)) {
    errors.push(mkError(`Invalid priority "${parsed.priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}`));
  }

  if (errors.length > 0 && (!parsed.type || !parsed.id || !parsed.status)) {
    return { frontmatter: null, errors };
  }

  return {
    frontmatter: parsed as unknown as Frontmatter,
    errors,
  };
}
