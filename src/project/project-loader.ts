import fs from 'node:fs';
import path from 'node:path';
import type { PlanDocument } from '../types/ast.js';
import { parsePlanFile } from '../parser/index.js';

export interface ProjectLoadResult {
  documents: Map<string, PlanDocument>;
  sources: Map<string, string>;
  errors: string[];
}

/**
 * Recursively find all .plan files in a directory and parse them.
 * The map key is the frontmatter id.
 */
export function loadProject(dirPath: string): ProjectLoadResult {
  const documents = new Map<string, PlanDocument>();
  const sources = new Map<string, string>();
  const errors: string[] = [];

  const planFiles = findPlanFiles(dirPath);

  for (const filePath of planFiles) {
    try {
      const source = fs.readFileSync(filePath, 'utf-8');
      const doc = parsePlanFile(source, filePath);

      if (doc.frontmatter?.id) {
        documents.set(doc.frontmatter.id, doc);
        sources.set(doc.frontmatter.id, source);
      } else {
        // Use filename as fallback key
        const basename = path.basename(filePath, '.plan');
        documents.set(basename, doc);
        sources.set(basename, source);
      }
    } catch (e) {
      errors.push(`Failed to load ${filePath}: ${(e as Error).message}`);
    }
  }

  return { documents, sources, errors };
}

function findPlanFiles(dirPath: string): string[] {
  const results: string[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        results.push(...findPlanFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.plan')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory read error — skip
  }

  return results;
}
