import type { Converter } from '../converter-types.js';
import type { PlanDocument } from '../../types/ast.js';
import { stripUncertainty, stripObligation } from '../../parser/inline-parser.js';

function cleanText(text: string): string {
  return stripObligation(stripUncertainty(text));
}

/**
 * Escape a CSV field according to RFC 4180.
 * Fields containing commas, double quotes, or newlines are enclosed in double quotes.
 * Double quotes within fields are escaped by doubling them.
 */
function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

export const csvConverter: Converter = {
  format: 'csv',
  convert(doc: PlanDocument): string {
    const headers = ['Level', 'Title', 'Goal', 'When', 'Then', 'Assignee', 'Status', 'Dependencies'];
    const rows: string[][] = [headers];

    const feature = doc.feature;
    if (!feature) return headers.map(escapeCSV).join(',');

    const status = doc.frontmatter?.status ?? '';

    // Feature row
    const featureGoal = feature.intents
      .filter(i => i.kind === 'goal')
      .map(i => cleanText(i.text))
      .join('; ');
    const featureDeps = feature.dependencies
      .map(d => cleanText(d.text))
      .join('; ');
    rows.push(['Feature', feature.title, featureGoal, '', '', '', status, featureDeps]);

    // Story rows
    for (const story of feature.stories) {
      const storyGoal = story.intents
        .filter(i => i.kind === 'goal')
        .map(i => cleanText(i.text))
        .join('; ');
      const whens = story.behaviors
        .filter(b => b.kind === 'when')
        .map(b => cleanText(b.text))
        .join('; ');
      const thens = story.behaviors
        .filter(b => b.kind === 'then')
        .map(b => cleanText(b.text))
        .join('; ');
      const storyDeps = story.dependencies
        .map(d => cleanText(d.text))
        .join('; ');
      rows.push(['Story', story.title, storyGoal, whens, thens, '', '', storyDeps]);

      // Task rows
      for (const task of story.tasks) {
        const assignees = task.assigns
          .map(a => a.actor ? `@${a.actor.name}` : cleanText(a.text))
          .join('; ');
        const taskDeps = task.dependencies
          .map(d => cleanText(d.text))
          .join('; ');
        rows.push(['Task', task.title, '', '', '', assignees, '', taskDeps]);
      }
    }

    return rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  },
};
