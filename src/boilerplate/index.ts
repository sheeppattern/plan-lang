export type {
  BuiltinTemplateName,
  TemplateVariables,
  TemplateDefinition,
  GenerateOptions,
  GenerateResult,
} from './boilerplate-types.js';

export { renderTemplate } from './template-engine.js';
export { getTemplate, listTemplates, loadCustomTemplates, findSimilarTemplate } from './template-registry.js';

import type { GenerateOptions, GenerateResult, TemplateVariables } from './boilerplate-types.js';
import { renderTemplate } from './template-engine.js';
import { getTemplate } from './template-registry.js';

const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/**
 * Validate a plan ID (kebab-case).
 * Returns an error message if invalid, undefined if valid.
 */
export function validateId(id: string): string | undefined {
  if (!ID_PATTERN.test(id)) {
    const suggested = id
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return `Invalid ID: "${id}". IDs must be kebab-case (e.g., "${suggested || 'feat-my-feature'}").`;
  }
  return undefined;
}

/**
 * Generate .plan file content from a template.
 * Pure function — no filesystem I/O.
 */
export function generatePlanFile(id: string, options?: GenerateOptions): GenerateResult {
  const templateName = options?.template ?? 'default';
  const template = getTemplate(templateName);
  if (!template) {
    throw new Error(`Unknown template: "${templateName}".`);
  }

  const today = new Date().toISOString().slice(0, 10);
  const variables: TemplateVariables = {
    id,
    date: today,
    owner: options?.owner ?? 'owner',
  };

  const content = renderTemplate(template.content, variables);
  return { content, templateName };
}
