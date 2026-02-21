import fs from 'node:fs';
import path from 'node:path';
import { generatePlanFile, validateId, findSimilarTemplate, listTemplates } from '../boilerplate/index.js';

export interface InitCommandOptions {
  template?: string;
  owner?: string;
  force?: boolean;
}

export function runInitCommand(id: string, options: InitCommandOptions): void {
  const idError = validateId(id);
  if (idError) {
    console.error(idError);
    process.exitCode = 1;
    return;
  }

  const filePath = path.resolve(`${id}.plan`);
  if (fs.existsSync(filePath) && !options.force) {
    console.error(`File already exists: ${filePath}`);
    console.error('Use --force to overwrite.');
    process.exitCode = 1;
    return;
  }

  let result;
  try {
    result = generatePlanFile(id, {
      template: options.template,
      owner: options.owner,
    });
  } catch (err) {
    const templateName = options.template ?? 'default';
    const available = listTemplates().map(t => t.name);
    const suggestion = findSimilarTemplate(templateName, available);
    console.error(`Unknown template: "${templateName}".`);
    if (suggestion) {
      console.error(`Did you mean "${suggestion}"?`);
    }
    console.error(`Available templates: ${available.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(filePath, result.content, 'utf-8');
  console.log(`Created: ${filePath} (template: ${result.templateName})`);
}
