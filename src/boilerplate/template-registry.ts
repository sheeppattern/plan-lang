import fs from 'node:fs';
import path from 'node:path';
import type { TemplateDefinition } from './boilerplate-types.js';
import { defaultTemplate } from './templates/default.js';
import { minimalTemplate } from './templates/minimal.js';
import { fullTemplate } from './templates/full.js';

const builtinTemplates = new Map<string, TemplateDefinition>();
builtinTemplates.set('default', defaultTemplate);
builtinTemplates.set('minimal', minimalTemplate);
builtinTemplates.set('full', fullTemplate);

/**
 * Get a template by name (built-in or custom).
 */
export function getTemplate(name: string, customDir?: string): TemplateDefinition | undefined {
  const builtin = builtinTemplates.get(name);
  if (builtin) return builtin;

  if (customDir) {
    const customs = loadCustomTemplates(customDir);
    return customs.find(t => t.name === name);
  }
  return undefined;
}

/**
 * List all available templates (built-in + optional custom).
 */
export function listTemplates(customDir?: string): TemplateDefinition[] {
  const all = [...builtinTemplates.values()];
  if (customDir) {
    all.push(...loadCustomTemplates(customDir));
  }
  return all;
}

/**
 * Load custom templates from a directory.
 * Each file becomes a template with the filename (without extension) as the name.
 */
export function loadCustomTemplates(dir: string): TemplateDefinition[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const templates: TemplateDefinition[] = [];

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const ext = path.extname(entry.name);
    if (ext !== '.plan-template' && ext !== '.txt') continue;

    const name = path.basename(entry.name, ext);
    const content = fs.readFileSync(path.join(dir, entry.name), 'utf-8');
    templates.push({ name, description: `Custom template: ${name}`, content });
  }

  return templates;
}

/**
 * Find a similar template name using simple substring matching.
 */
export function findSimilarTemplate(name: string, available: string[]): string | undefined {
  const lower = name.toLowerCase();
  // Exact prefix match
  const prefixMatch = available.find(a => a.startsWith(lower));
  if (prefixMatch) return prefixMatch;
  // Substring match
  const substringMatch = available.find(a => a.includes(lower) || lower.includes(a));
  if (substringMatch) return substringMatch;
  return undefined;
}
