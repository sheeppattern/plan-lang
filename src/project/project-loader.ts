import fs from 'node:fs';
import path from 'node:path';
import type { PlanDocument } from '../types/ast.js';
import { parsePlanFile } from '../parser/index.js';

export interface ProjectLoadResult {
  documents: Map<string, PlanDocument>;
  sources: Map<string, string>;
  errors: string[];
  /** Map of duplicate IDs → file paths where each ID appears */
  duplicateIds: Map<string, string[]>;
}

/**
 * Recursively find all .plan files in a directory and parse them.
 * The map key is the frontmatter id.
 */
export function loadProject(dirPath: string): ProjectLoadResult {
  const documents = new Map<string, PlanDocument>();
  const sources = new Map<string, string>();
  const errors: string[] = [];
  const duplicateIds = new Map<string, string[]>();

  // Track which files have each ID (for duplicate detection)
  const idToFiles = new Map<string, string[]>();

  const planFiles = findPlanFiles(dirPath);

  for (const filePath of planFiles) {
    try {
      const source = fs.readFileSync(filePath, 'utf-8');
      const doc = parsePlanFile(source, filePath);

      if (doc.frontmatter?.id) {
        const id = doc.frontmatter.id;

        // Track file paths per ID for duplicate detection
        if (!idToFiles.has(id)) {
          idToFiles.set(id, []);
        }
        idToFiles.get(id)!.push(filePath);

        documents.set(id, doc);
        sources.set(id, source);
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

  // Build duplicateIds map (only IDs that appear in multiple files)
  for (const [id, files] of idToFiles) {
    if (files.length > 1) {
      duplicateIds.set(id, files);
    }
  }

  return { documents, sources, errors, duplicateIds };
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
