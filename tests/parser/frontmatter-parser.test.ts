import { describe, it, expect } from 'vitest';
import { parseFrontmatter } from '../../src/parser/frontmatter-parser.js';
import type { FrontmatterBounds } from '../../src/types/ast.js';

function makeBounds(content: string): FrontmatterBounds {
  return { startLine: 1, endLine: content.split('\n').length + 2, content };
}

describe('Frontmatter Parser', () => {
  it('parses valid frontmatter', () => {
    const result = parseFrontmatter(makeBounds(`type: feature
id: feat-social-login
status: draft
version: 0.1.0
owner: "@max"
priority: high
tags: [auth, onboarding, mvp]`));

    expect(result.errors).toHaveLength(0);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.type).toBe('feature');
    expect(result.frontmatter!.id).toBe('feat-social-login');
    expect(result.frontmatter!.status).toBe('draft');
    expect(result.frontmatter!.priority).toBe('high');
  });

  it('reports error for missing type', () => {
    const result = parseFrontmatter(makeBounds(`id: test
status: draft`));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('type');
  });

  it('reports error for missing id', () => {
    const result = parseFrontmatter(makeBounds(`type: feature
status: draft`));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('id');
  });

  it('reports error for missing status', () => {
    const result = parseFrontmatter(makeBounds(`type: feature
id: test`));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('status');
  });

  it('reports error for invalid type', () => {
    const result = parseFrontmatter(makeBounds(`type: invalid
id: test
status: draft`));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Invalid type');
  });

  it('reports error for invalid status', () => {
    const result = parseFrontmatter(makeBounds(`type: feature
id: test
status: pending`));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Invalid status');
  });

  it('reports error for invalid YAML', () => {
    const result = parseFrontmatter(makeBounds(`[invalid yaml:`));
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.frontmatter).toBeNull();
  });

  it('handles all valid statuses', () => {
    for (const status of ['draft', 'ready', 'in_progress', 'blocked', 'done', 'deprecated']) {
      const result = parseFrontmatter(makeBounds(`type: feature\nid: test\nstatus: ${status}`));
      expect(result.frontmatter?.status).toBe(status);
    }
  });
});
