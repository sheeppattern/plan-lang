import fs from 'node:fs';
import { parsePlanFile } from '../parser/index.js';

export function runParseCommand(filePath: string, options: { format?: string }): void {
  const source = fs.readFileSync(filePath, 'utf-8');
  const doc = parsePlanFile(source, filePath);

  if (options.format === 'json') {
    console.log(JSON.stringify(doc, null, 2));
  } else {
    // Compact summary
    console.log(`File: ${filePath}`);
    if (doc.frontmatter) {
      console.log(`  type: ${doc.frontmatter.type}`);
      console.log(`  id: ${doc.frontmatter.id}`);
      console.log(`  status: ${doc.frontmatter.status}`);
    }
    if (doc.feature) {
      console.log(`  Feature: ${doc.feature.title}`);
      console.log(`    Intents: ${doc.feature.intents.length}`);
      console.log(`    Dependencies: ${doc.feature.dependencies.length}`);
      console.log(`    Stories: ${doc.feature.stories.length}`);
      for (const story of doc.feature.stories) {
        console.log(`      Story: ${story.title}`);
        console.log(`        Behaviors: ${story.behaviors.length}`);
        console.log(`        Edges: ${story.edges.length}`);
        console.log(`        Tasks: ${story.tasks.length}`);
      }
    }
    if (doc.errors.length > 0) {
      console.log(`  Parse errors: ${doc.errors.length}`);
      for (const err of doc.errors) {
        console.log(`    L${err.range.start.line}: ${err.message}`);
      }
    }
  }
}
