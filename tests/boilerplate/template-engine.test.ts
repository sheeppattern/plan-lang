import { describe, it, expect } from 'vitest';
import { renderTemplate } from '../../src/boilerplate/template-engine.js';
import type { TemplateVariables } from '../../src/boilerplate/boilerplate-types.js';

const vars: TemplateVariables = {
  id: 'feat-login',
  date: '2026-02-21',
  owner: 'max',
};

describe('renderTemplate', () => {
  it('substitutes {{id}}', () => {
    expect(renderTemplate('id: {{id}}', vars)).toBe('id: feat-login');
  });

  it('substitutes {{date}}', () => {
    expect(renderTemplate('created: {{date}}', vars)).toBe('created: 2026-02-21');
  });

  it('substitutes {{owner}}', () => {
    expect(renderTemplate('owner: @{{owner}}', vars)).toBe('owner: @max');
  });

  it('substitutes all variables in a single pass', () => {
    const template = 'id: {{id}}, date: {{date}}, owner: {{owner}}';
    expect(renderTemplate(template, vars)).toBe('id: feat-login, date: 2026-02-21, owner: max');
  });

  it('leaves unknown {{placeholder}} unchanged', () => {
    expect(renderTemplate('{{unknown}} stays', vars)).toBe('{{unknown}} stays');
  });

  it('handles empty template string', () => {
    expect(renderTemplate('', vars)).toBe('');
  });

  it('handles template with no variables', () => {
    expect(renderTemplate('no variables here', vars)).toBe('no variables here');
  });

  it('handles multiple occurrences of same variable', () => {
    expect(renderTemplate('{{id}} and {{id}}', vars)).toBe('feat-login and feat-login');
  });
});
