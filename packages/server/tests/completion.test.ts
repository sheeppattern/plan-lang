import { describe, it, expect } from 'vitest';
import { CompletionItemKind, InsertTextFormat } from 'vscode-languageserver';
import { DocumentManager } from '../src/document-manager.js';
import { getCompletions } from '../src/completion.js';

const SAMPLE = `---
type: feature
id: feat-comp-test
status: draft
---

# Feature: Completion Test

Goal: test completions
Persona: @tester — test persona
Metric: metric > 0

## Story: Comp Story

Given: precondition
When: trigger
Then: result [MUST]

Edge: "edge"
  When: edge trigger
  Then: edge result [MUST]

### Task: Comp Task

Assign: @dev
Verify: done
`;

describe('completion', () => {
  function createManager() {
    const dm = new DocumentManager();
    dm.update('file:///comp.plan', SAMPLE, 1);
    return dm;
  }

  it('provides frontmatter status values after "status: "', () => {
    const dm = new DocumentManager();
    const source = `---
type: feature
id: test
status:
---
`;
    dm.update('file:///fm.plan', source, 1);
    const items = getCompletions('file:///fm.plan', { line: 3, character: 8 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('draft');
    expect(labels).toContain('ready');
    expect(labels).toContain('in_progress');
    expect(labels).toContain('blocked');
    expect(labels).toContain('done');
    expect(labels).toContain('deprecated');
  });

  it('provides frontmatter type values after "type: "', () => {
    const dm = new DocumentManager();
    const source = `---
type:
id: test
status: draft
---
`;
    dm.update('file:///fm2.plan', source, 1);
    const items = getCompletions('file:///fm2.plan', { line: 1, character: 6 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('feature');
    expect(labels).toContain('story');
    expect(labels).toContain('task');
  });

  it('provides frontmatter priority values after "priority: "', () => {
    const dm = new DocumentManager();
    const source = `---
type: feature
id: test
status: draft
priority:
---
`;
    dm.update('file:///fm3.plan', source, 1);
    const items = getCompletions('file:///fm3.plan', { line: 4, character: 10 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('urgent');
    expect(labels).toContain('high');
    expect(labels).toContain('normal');
    expect(labels).toContain('low');
  });

  it('provides keyword completions on empty line inside story', () => {
    const dm = createManager();
    const lines = SAMPLE.split('\n');
    const storyIdx = lines.findIndex(l => l.includes('## Story'));
    const items = getCompletions('file:///comp.plan', { line: storyIdx + 1, character: 0 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('Given:');
    expect(labels).toContain('When:');
    expect(labels).toContain('Then:');
  });

  it('provides keyword completions even in unknown context', () => {
    const dm = new DocumentManager();
    const source = '\n';
    dm.update('file:///empty.plan', source, 1);
    const items = getCompletions('file:///empty.plan', { line: 0, character: 0 }, dm);
    const labels = items.map(i => i.label);
    // unknown context should still offer keywords
    expect(labels).toContain('Goal:');
    expect(labels).toContain('Given:');
    // and headings
    expect(labels).toContain('# Feature:');
  });

  it('provides reference completions after [', () => {
    const dm = createManager();
    const source = SAMPLE + '\nNeeds: [';
    dm.update('file:///comp2.plan', source, 1);
    const lineIdx = source.split('\n').length - 1;
    const items = getCompletions('file:///comp2.plan', { line: lineIdx, character: 8 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('feat-comp-test');
    expect(labels).toContain('external');
    // Should have textEdit
    const refItem = items.find(i => i.label === 'feat-comp-test');
    expect(refItem?.textEdit).toBeDefined();
  });

  it('provides actor completions after @', () => {
    const dm = createManager();
    const source = SAMPLE + '\nAssign: @';
    dm.update('file:///comp3.plan', source, 1);
    const lineIdx = source.split('\n').length - 1;
    const items = getCompletions('file:///comp3.plan', { line: lineIdx, character: 9 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('@tester');
    expect(labels).toContain('@dev');
    // Should have textEdit
    const actorItem = items.find(i => i.label === '@tester');
    expect(actorItem?.textEdit).toBeDefined();
  });

  it('provides uncertainty marker completions after ?', () => {
    const dm = createManager();
    const source = SAMPLE + '\nThen: result ?';
    dm.update('file:///comp4.plan', source, 1);
    const lineIdx = source.split('\n').length - 1;
    const items = getCompletions('file:///comp4.plan', { line: lineIdx, character: 14 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('?pending("...")');
    expect(labels).toContain('?assumption("...")');
    expect(labels).toContain('?alternative("...")');
    expect(labels).toContain('?risk("...")');
  });

  it('provides obligation completions on Then: line', () => {
    const dm = createManager();
    const source = SAMPLE + '\nThen: some result ';
    dm.update('file:///comp5.plan', source, 1);
    const lineIdx = source.split('\n').length - 1;
    const items = getCompletions('file:///comp5.plan', { line: lineIdx, character: 19 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('[MUST]');
    expect(labels).toContain('[SHOULD]');
    expect(labels).toContain('[MAY]');
  });

  it('provides heading completions when typing # with textEdit', () => {
    const dm = createManager();
    const source = SAMPLE + '\n## ';
    dm.update('file:///comp6.plan', source, 1);
    const lineIdx = source.split('\n').length - 1;
    const items = getCompletions('file:///comp6.plan', { line: lineIdx, character: 3 }, dm);
    const labels = items.map(i => i.label);
    expect(labels).toContain('## Story:');
    // Should use textEdit to replace from line start
    const storyItem = items.find(i => i.label === '## Story:');
    expect(storyItem?.textEdit).toBeDefined();
  });
});
