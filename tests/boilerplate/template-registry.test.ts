import { describe, it, expect } from 'vitest';
import { getTemplate, listTemplates, findSimilarTemplate } from '../../src/boilerplate/template-registry.js';

describe('getTemplate', () => {
  it('returns "default" template', () => {
    const t = getTemplate('default');
    expect(t).toBeDefined();
    expect(t!.name).toBe('default');
    expect(t!.content).toContain('{{id}}');
  });

  it('returns "minimal" template', () => {
    const t = getTemplate('minimal');
    expect(t).toBeDefined();
    expect(t!.name).toBe('minimal');
  });

  it('returns "full" template', () => {
    const t = getTemplate('full');
    expect(t).toBeDefined();
    expect(t!.name).toBe('full');
    expect(t!.content).toContain('?pending');
  });

  it('returns undefined for unknown template', () => {
    expect(getTemplate('nonexistent')).toBeUndefined();
  });
});

describe('listTemplates', () => {
  it('lists all 3 built-in templates', () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(3);
    const names = templates.map(t => t.name);
    expect(names).toContain('default');
    expect(names).toContain('minimal');
    expect(names).toContain('full');
  });

  it('includes description for each template', () => {
    const templates = listTemplates();
    for (const t of templates) {
      expect(t.description.length).toBeGreaterThan(0);
    }
  });
});

describe('findSimilarTemplate', () => {
  const available = ['default', 'minimal', 'full'];

  it('suggests "default" for "def"', () => {
    expect(findSimilarTemplate('def', available)).toBe('default');
  });

  it('suggests "minimal" for "min"', () => {
    expect(findSimilarTemplate('min', available)).toBe('minimal');
  });

  it('suggests "full" for "ful"', () => {
    expect(findSimilarTemplate('ful', available)).toBe('full');
  });

  it('returns undefined when no match is close enough', () => {
    expect(findSimilarTemplate('xyz', available)).toBeUndefined();
  });
});
