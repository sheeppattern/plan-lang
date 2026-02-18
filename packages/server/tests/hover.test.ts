import { describe, it, expect } from 'vitest';
import { DocumentManager } from '../src/document-manager.js';
import { getHover } from '../src/hover.js';

const SAMPLE = `---
type: feature
id: feat-hover-test
status: draft
---

# Feature: Hover Test

Goal: test hover functionality
Persona: @tester — a test persona description
Metric: test_metric > 100

Needs: [feat-other] some dependency

## Story: Test Story

Given: some precondition
When: user performs action
Then: expected result [MUST]
Then: optional result [MAY]

Edge: "edge scenario"
  When: edge condition
  Then: edge result [SHOULD]

### Task: Test Task

Assign: @dev_agent
Verify: all tests pass ?assumption("assuming stable API")
`;

describe('hover', () => {
  function createManager() {
    const dm = new DocumentManager();
    dm.update('file:///hover.plan', SAMPLE, 1);
    return dm;
  }

  it('shows keyword description when hovering over Goal:', () => {
    const dm = createManager();
    // "Goal:" is on line 8 (0-based), char 0
    const hover = getHover('file:///hover.plan', { line: 8, character: 1 }, dm);
    expect(hover).toBeTruthy();
    expect(hover!.contents).toBeTruthy();
  });

  it('shows obligation description when hovering over [MUST]', () => {
    const dm = createManager();
    // "Then: expected result [MUST]" — find the line
    const lines = SAMPLE.split('\n');
    const mustLine = lines.findIndex(l => l.includes('[MUST]'));
    if (mustLine >= 0) {
      const mustCol = lines[mustLine].indexOf('[MUST]');
      const hover = getHover('file:///hover.plan', { line: mustLine, character: mustCol + 1 }, dm);
      expect(hover).toBeTruthy();
      const value = typeof hover!.contents === 'string'
        ? hover!.contents
        : 'value' in hover!.contents ? hover!.contents.value : '';
      expect(value).toContain('MUST');
    }
  });

  it('shows obligation description when hovering over [MAY]', () => {
    const dm = createManager();
    const lines = SAMPLE.split('\n');
    const mayLine = lines.findIndex(l => l.includes('[MAY]'));
    if (mayLine >= 0) {
      const mayCol = lines[mayLine].indexOf('[MAY]');
      const hover = getHover('file:///hover.plan', { line: mayLine, character: mayCol + 1 }, dm);
      expect(hover).toBeTruthy();
      const value = typeof hover!.contents === 'string'
        ? hover!.contents
        : 'value' in hover!.contents ? hover!.contents.value : '';
      expect(value).toContain('MAY');
    }
  });

  it('shows actor info when hovering over @tester', () => {
    const dm = createManager();
    const lines = SAMPLE.split('\n');
    const actorLine = lines.findIndex(l => l.includes('@tester'));
    if (actorLine >= 0) {
      const actorCol = lines[actorLine].indexOf('@tester');
      const hover = getHover('file:///hover.plan', { line: actorLine, character: actorCol + 1 }, dm);
      expect(hover).toBeTruthy();
      const value = typeof hover!.contents === 'string'
        ? hover!.contents
        : 'value' in hover!.contents ? hover!.contents.value : '';
      expect(value).toContain('@tester');
    }
  });

  it('shows uncertainty info when hovering over ?assumption', () => {
    const dm = createManager();
    const lines = SAMPLE.split('\n');
    const uncLine = lines.findIndex(l => l.includes('?assumption'));
    if (uncLine >= 0) {
      const uncCol = lines[uncLine].indexOf('?assumption');
      const hover = getHover('file:///hover.plan', { line: uncLine, character: uncCol + 1 }, dm);
      expect(hover).toBeTruthy();
      const value = typeof hover!.contents === 'string'
        ? hover!.contents
        : 'value' in hover!.contents ? hover!.contents.value : '';
      expect(value).toContain('assumption');
    }
  });

  it('shows unresolved reference for unknown [feat-id]', () => {
    const dm = createManager();
    const lines = SAMPLE.split('\n');
    const refLine = lines.findIndex(l => l.includes('[feat-other]'));
    if (refLine >= 0) {
      const refCol = lines[refLine].indexOf('[feat-other]');
      const hover = getHover('file:///hover.plan', { line: refLine, character: refCol + 2 }, dm);
      expect(hover).toBeTruthy();
      const value = typeof hover!.contents === 'string'
        ? hover!.contents
        : 'value' in hover!.contents ? hover!.contents.value : '';
      expect(value).toContain('unresolved');
    }
  });

  it('returns null for position with no special element', () => {
    const dm = createManager();
    // Empty line (after frontmatter close)
    const hover = getHover('file:///hover.plan', { line: 5, character: 0 }, dm);
    expect(hover).toBeNull();
  });
});
