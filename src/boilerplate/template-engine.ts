import type { TemplateVariables } from './boilerplate-types.js';

/**
 * Substitute {{variable}} placeholders in a template string.
 * Unknown variables are left as-is.
 */
export function renderTemplate(template: string, variables: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key as keyof TemplateVariables];
    return value !== undefined ? value : match;
  });
}
