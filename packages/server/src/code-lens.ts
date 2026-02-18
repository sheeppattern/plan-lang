/**
 * Code Lens provider.
 * Shows reference count above Feature/Story headings.
 */
import type { CodeLens, Command } from 'vscode-languageserver';
import { parseReferences } from 'plan-lang';
import type { DocumentManager } from './document-manager.js';
import { planRangeToLsp } from './position-utils.js';

interface CodeLensData {
  type: 'feature' | 'story';
  id?: string;
  title: string;
  uri: string;
}

export function getCodeLenses(
  uri: string,
  docManager: DocumentManager,
): CodeLens[] {
  const state = docManager.get(uri);
  if (!state?.doc.feature) return [];

  const lenses: CodeLens[] = [];
  const feature = state.doc.feature;

  // Feature heading lens
  if (state.doc.frontmatter?.id) {
    lenses.push({
      range: planRangeToLsp(feature.range),
      data: {
        type: 'feature',
        id: state.doc.frontmatter.id,
        title: feature.title,
        uri,
      } satisfies CodeLensData,
    });
  }

  // Story heading lenses
  for (const story of feature.stories) {
    lenses.push({
      range: planRangeToLsp(story.range),
      data: {
        type: 'story',
        title: story.title,
        uri,
      } satisfies CodeLensData,
    });
  }

  return lenses;
}

export function resolveCodeLens(
  codeLens: CodeLens,
  docManager: DocumentManager,
): CodeLens {
  const data = codeLens.data as CodeLensData;

  if (data.type === 'feature' && data.id) {
    // Count all [feat-id] references across the project
    let count = 0;
    for (const [, state] of docManager.all()) {
      const lines = state.source.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const refs = parseReferences(lines[i], i + 1);
        for (const ref of refs) {
          if (ref.kind === 'plan-reference' && ref.id === data.id) {
            count++;
          }
        }
      }
    }

    codeLens.command = {
      title: count === 0 ? 'no references' : `${count} reference${count === 1 ? '' : 's'}`,
      command: '',
    };
  } else if (data.type === 'story') {
    // Count tasks + edges in this story
    const state = docManager.get(data.uri);
    if (state?.doc.feature) {
      const story = state.doc.feature.stories.find(s => s.title === data.title);
      if (story) {
        const taskCount = story.tasks.length;
        const edgeCount = story.edges.length;
        const parts: string[] = [];
        if (taskCount > 0) parts.push(`${taskCount} task${taskCount === 1 ? '' : 's'}`);
        if (edgeCount > 0) parts.push(`${edgeCount} edge${edgeCount === 1 ? '' : 's'}`);
        codeLens.command = {
          title: parts.length > 0 ? parts.join(', ') : 'no tasks',
          command: '',
        };
      }
    }

    if (!codeLens.command) {
      codeLens.command = { title: 'no tasks', command: '' };
    }
  }

  return codeLens;
}
