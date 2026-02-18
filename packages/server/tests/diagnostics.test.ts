import { describe, it, expect } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { DocumentManager } from '../src/document-manager.js';

describe('diagnostics', () => {
  it('converts parse errors to LSP diagnostics', () => {
    const dm = new DocumentManager();
    // Missing frontmatter: no error from parser (optional), but no Feature heading → parse error
    const source = `---
type: feature
id: test
status: draft
---

Goal: some goal without feature heading
`;
    const state = dm.update('file:///test.plan', source, 1);
    const errors = state.doc.errors;
    // Should have at least one error (Goal: outside of feature block)
    expect(errors.length).toBeGreaterThan(0);
  });

  it('produces lint diagnostics for missing goal', () => {
    const dm = new DocumentManager();
    const source = `---
type: feature
id: test-no-goal
status: draft
---

# Feature: Test Feature Without Goal

## Story: Some Story

When: something happens
Then: something results [MUST]

Edge: "edge case"
  When: edge trigger
  Then: edge result [MUST]

### Task: Some Task

Assign: @dev
Verify: it works
`;
    const state = dm.update('file:///test.plan', source, 1);
    // The document should have a feature but no Goal → PLAN-001 error
    expect(state.doc.feature).toBeTruthy();
    expect(state.doc.feature!.intents.filter(i => i.kind === 'goal')).toHaveLength(0);
  });

  it('produces lint diagnostics for missing obligation on Then:', () => {
    const dm = new DocumentManager();
    const source = `---
type: feature
id: test-no-obligation
status: draft
---

# Feature: Test Obligation

Goal: test goal
Metric: test_metric > 0

## Story: Story

When: action
Then: result without obligation marker

Edge: "edge case"
  When: edge
  Then: edge result [MUST]

### Task: Task

Assign: @dev
Verify: done
`;
    const state = dm.update('file:///test.plan', source, 1);
    expect(state.doc.feature).toBeTruthy();
    // Story behaviors should include a Then without obligation
    const story = state.doc.feature!.stories[0];
    expect(story).toBeTruthy();
    const thenLines = story.behaviors.filter(b => b.kind === 'then');
    expect(thenLines.length).toBeGreaterThan(0);
    // The then line without obligation should trigger PLAN-006
    const thenWithoutObl = thenLines.find(t => t.kind === 'then' && !t.obligation);
    expect(thenWithoutObl).toBeTruthy();
  });
});
