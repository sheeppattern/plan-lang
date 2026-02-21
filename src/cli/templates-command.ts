import path from 'node:path';
import { listTemplates } from '../boilerplate/index.js';

export function runTemplatesCommand(): void {
  const customDir = path.resolve('.plan-templates');
  const templates = listTemplates(customDir);

  console.log('Available templates:\n');
  for (const t of templates) {
    const marker = t.name === 'default' ? ' (default)' : '';
    console.log(`  ${t.name}${marker}`);
    console.log(`    ${t.description}`);
  }
}
