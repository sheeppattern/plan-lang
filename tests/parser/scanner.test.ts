import { describe, it, expect } from 'vitest';
import { scan } from '../../src/parser/scanner.js';

describe('Scanner', () => {
  it('splits source into lines with 1-based line numbers', () => {
    const result = scan('line1\nline2\nline3');
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0]).toEqual({ lineNumber: 1, text: 'line1' });
    expect(result.lines[2]).toEqual({ lineNumber: 3, text: 'line3' });
  });

  it('handles Windows line endings', () => {
    const result = scan('line1\r\nline2\r\n');
    expect(result.lines[0].text).toBe('line1');
    expect(result.lines[1].text).toBe('line2');
  });

  it('extracts frontmatter bounds', () => {
    const source = `---
type: feature
id: test
status: draft
---
# Feature: Test`;
    const result = scan(source);
    expect(result.frontmatter).not.toBeNull();
    expect(result.frontmatter!.startLine).toBe(1);
    expect(result.frontmatter!.endLine).toBe(5);
    expect(result.frontmatter!.content).toContain('type: feature');
  });

  it('returns null frontmatter if no opening ---', () => {
    const result = scan('# Feature: Test\nGoal: do stuff');
    expect(result.frontmatter).toBeNull();
  });

  it('returns null frontmatter if no closing ---', () => {
    const result = scan('---\ntype: feature\nid: test');
    expect(result.frontmatter).toBeNull();
  });

  it('handles empty source', () => {
    const result = scan('');
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].text).toBe('');
    expect(result.frontmatter).toBeNull();
  });
});
