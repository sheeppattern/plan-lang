import { describe, it, expect } from 'vitest';
import { generatePlanFile, validateId } from '../../src/boilerplate/index.js';
import { parsePlanFile } from '../../src/parser/index.js';
import { LintEngine } from '../../src/linter/index.js';

describe('validateId', () => {
  it('accepts valid kebab-case IDs', () => {
    expect(validateId('feat-login')).toBeUndefined();
    expect(validateId('feat-user-auth')).toBeUndefined();
    expect(validateId('a')).toBeUndefined();
    expect(validateId('feat123')).toBeUndefined();
  });

  it('rejects IDs with spaces', () => {
    expect(validateId('my feature')).toBeDefined();
  });

  it('rejects IDs with special characters', () => {
    expect(validateId('feat!')).toBeDefined();
    expect(validateId('feat@login')).toBeDefined();
  });

  it('rejects IDs starting with a number', () => {
    expect(validateId('1feat')).toBeDefined();
  });

  it('rejects IDs starting with a hyphen', () => {
    expect(validateId('-feat')).toBeDefined();
  });

  it('suggests kebab-case conversion in error message', () => {
    const msg = validateId('My Feature!');
    expect(msg).toContain('my-feature');
  });
});

describe('generatePlanFile', () => {
  it('generates content with correct id in frontmatter', () => {
    const result = generatePlanFile('feat-test');
    expect(result.content).toContain('id: feat-test');
  });

  it('includes current date', () => {
    const result = generatePlanFile('feat-test');
    const today = new Date().toISOString().slice(0, 10);
    expect(result.content).toContain(`created: ${today}`);
    expect(result.content).toContain(`updated: ${today}`);
  });

  it('includes owner when provided', () => {
    const result = generatePlanFile('feat-test', { owner: 'alice' });
    expect(result.content).toContain('@alice');
  });

  it('uses default owner when not provided', () => {
    const result = generatePlanFile('feat-test');
    expect(result.content).toContain('@owner');
  });

  it('throws on unknown template', () => {
    expect(() => generatePlanFile('feat-test', { template: 'nonexistent' })).toThrow();
  });
});

describe('Generated files pass lint', () => {
  const engine = new LintEngine();

  it('default template produces zero-error output', () => {
    const { content } = generatePlanFile('feat-test');
    const doc = parsePlanFile(content, 'feat-test.plan');
    const diagnostics = engine.lint(doc);
    const errors = diagnostics.filter(d => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('minimal template produces zero-error output', () => {
    const { content } = generatePlanFile('feat-test', { template: 'minimal' });
    const doc = parsePlanFile(content, 'feat-test.plan');
    const diagnostics = engine.lint(doc);
    const errors = diagnostics.filter(d => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('full template produces zero-error output', () => {
    const { content } = generatePlanFile('feat-test', { template: 'full' });
    const doc = parsePlanFile(content, 'feat-test.plan');
    const diagnostics = engine.lint(doc);
    const errors = diagnostics.filter(d => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });
});
