import { describe, it, expect } from 'vitest';
import { SymbolKind } from 'vscode-languageserver';
import { DocumentManager } from '../src/document-manager.js';
import { getDocumentSymbols } from '../src/symbols.js';

const SAMPLE = `---
type: feature
id: test-symbols
status: draft
---

# Feature: Symbol Test Feature

Goal: test the outline
Persona: @tester — a test user
Metric: coverage > 80%

## Story: First Story

Given: initial state
When: user acts
Then: expected outcome [MUST]

Edge: "edge case scenario"
  When: edge trigger
  Then: edge result [MUST]

### Task: Implement Feature

Assign: @dev
Verify: tests pass

## Story: Second Story

When: another action
Then: another result [MUST]

Edge: "another edge"
  When: edge trigger 2
  Then: edge result 2 [MUST]
`;

describe('symbols', () => {
  it('returns Feature as top-level Module symbol', () => {
    const dm = new DocumentManager();
    dm.update('file:///test.plan', SAMPLE, 1);
    const symbols = getDocumentSymbols('file:///test.plan', dm);

    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe('Symbol Test Feature');
    expect(symbols[0].kind).toBe(SymbolKind.Module);
  });

  it('includes Stories as Class symbols under Feature', () => {
    const dm = new DocumentManager();
    dm.update('file:///test.plan', SAMPLE, 1);
    const symbols = getDocumentSymbols('file:///test.plan', dm);
    const feature = symbols[0];

    const stories = feature.children!.filter(c => c.kind === SymbolKind.Class);
    expect(stories).toHaveLength(2);
    expect(stories[0].name).toBe('First Story');
    expect(stories[1].name).toBe('Second Story');
  });

  it('includes Tasks as Function symbols under Story', () => {
    const dm = new DocumentManager();
    dm.update('file:///test.plan', SAMPLE, 1);
    const symbols = getDocumentSymbols('file:///test.plan', dm);
    const feature = symbols[0];

    const firstStory = feature.children!.find(c => c.name === 'First Story');
    const tasks = firstStory!.children!.filter(c => c.kind === SymbolKind.Function);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('Implement Feature');
  });

  it('includes Edges as Interface symbols under Story', () => {
    const dm = new DocumentManager();
    dm.update('file:///test.plan', SAMPLE, 1);
    const symbols = getDocumentSymbols('file:///test.plan', dm);
    const feature = symbols[0];

    const firstStory = feature.children!.find(c => c.name === 'First Story');
    const edges = firstStory!.children!.filter(c => c.kind === SymbolKind.Interface);
    expect(edges).toHaveLength(1);
  });

  it('includes intent lines as Property symbols under Feature', () => {
    const dm = new DocumentManager();
    dm.update('file:///test.plan', SAMPLE, 1);
    const symbols = getDocumentSymbols('file:///test.plan', dm);
    const feature = symbols[0];

    const props = feature.children!.filter(c => c.kind === SymbolKind.Property);
    // Goal, Persona, Metric = 3 intent properties at feature level
    expect(props.length).toBeGreaterThanOrEqual(3);
  });

  it('returns empty array for document without feature', () => {
    const dm = new DocumentManager();
    dm.update('file:///empty.plan', '---\ntype: feature\nid: empty\nstatus: draft\n---\n', 1);
    const symbols = getDocumentSymbols('file:///empty.plan', dm);
    expect(symbols).toHaveLength(0);
  });
});
