import type { Converter } from '../converter-types.js';
import type { PlanDocument, BehaviorLine } from '../../types/ast.js';
import { stripUncertainty, stripObligation } from '../../parser/inline-parser.js';

function cleanText(text: string): string {
  return stripObligation(stripUncertainty(text));
}

function formatBehavior(b: BehaviorLine): string {
  const label = b.kind.charAt(0).toUpperCase() + b.kind.slice(1);
  return `- **${label}**: ${cleanText(b.text)}`;
}

export const markdownConverter: Converter = {
  format: 'markdown',
  convert(doc: PlanDocument): string {
    const lines: string[] = [];

    // Metadata table
    if (doc.frontmatter) {
      const fm = doc.frontmatter;
      lines.push('| Field | Value |');
      lines.push('|-------|-------|');
      if (fm.id) lines.push(`| ID | ${fm.id} |`);
      if (fm.status) lines.push(`| Status | ${fm.status} |`);
      if (fm.version) lines.push(`| Version | ${fm.version} |`);
      if (fm.owner) lines.push(`| Owner | ${fm.owner} |`);
      if (fm.priority) lines.push(`| Priority | ${fm.priority} |`);
      if (fm.tags) lines.push(`| Tags | ${Array.isArray(fm.tags) ? fm.tags.join(', ') : fm.tags} |`);
      lines.push('');
    }

    const feature = doc.feature;
    if (!feature) return lines.join('\n');

    // Feature heading
    lines.push(`# ${feature.title}`);
    lines.push('');

    // Goals, Personas, Metrics
    for (const intent of feature.intents) {
      if (intent.kind === 'goal') {
        lines.push(`**Goal**: ${cleanText(intent.text)}`);
      } else if (intent.kind === 'persona') {
        lines.push(`**Persona**: ${cleanText(intent.text)}`);
      } else if (intent.kind === 'metric') {
        lines.push(`**Metric**: ${cleanText(intent.text)}`);
      }
    }

    // Dependencies
    if (feature.dependencies.length > 0) {
      lines.push('');
      for (const dep of feature.dependencies) {
        const label = dep.kind === 'needs' ? 'Needs' : 'Blocks';
        lines.push(`- **${label}**: ${cleanText(dep.text)}`);
      }
    }

    // Stories
    for (const story of feature.stories) {
      lines.push('');
      lines.push(`## ${story.title}`);
      lines.push('');

      for (const intent of story.intents) {
        if (intent.kind === 'goal') {
          lines.push(`**Goal**: ${cleanText(intent.text)}`);
        }
      }

      if (story.behaviors.length > 0) {
        lines.push('');
        for (const b of story.behaviors) {
          lines.push(formatBehavior(b));
        }
      }

      // Edges
      for (const edge of story.edges) {
        lines.push('');
        lines.push(`### Edge: ${edge.description}`);
        lines.push('');
        for (const b of edge.behaviors) {
          lines.push(formatBehavior(b));
        }
      }

      // Tasks
      for (const task of story.tasks) {
        lines.push('');
        lines.push(`### ${task.title}`);
        lines.push('');
        if (task.assigns.length > 0) {
          const assignees = task.assigns.map(a => a.actor ? `@${a.actor.name}` : cleanText(a.text));
          lines.push(`**Assignee**: ${assignees.join(', ')}`);
        }
        if (task.verifies.length > 0) {
          lines.push('');
          lines.push('**Verification**:');
          for (const v of task.verifies) {
            lines.push(`- ${cleanText(v.text)}`);
          }
        }
        if (task.dependencies.length > 0) {
          lines.push('');
          for (const dep of task.dependencies) {
            const label = dep.kind === 'needs' ? 'Needs' : 'Blocks';
            lines.push(`- **${label}**: ${cleanText(dep.text)}`);
          }
        }
      }
    }

    lines.push('');
    return lines.join('\n');
  },
};
