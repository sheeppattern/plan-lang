import { describe, it, expect } from 'vitest';
import { parsePlanFile } from '../../src/parser/index.js';
import { LintEngine } from '../../src/linter/index.js';
import type { PlanDocument } from '../../src/types/ast.js';

const engine = new LintEngine();

describe('PLAN-013: Unused Persona', () => {
  it('passes when persona is referenced in behaviors', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
Persona: @user — 일반 사용자
## Story: Test
Given: @user가 로그인한 상태
When: action
Then: result [MUST]`);
    const diags = engine.lint(doc);
    expect(diags.filter(d => d.ruleId === 'PLAN-013')).toHaveLength(0);
  });

  it('warns when persona is declared but not referenced', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
Persona: @ghost_user — 사용되지 않는 페르소나
## Story: Test
When: action
Then: result [MUST]`);
    const diags = engine.lint(doc);
    const plan013 = diags.filter(d => d.ruleId === 'PLAN-013');
    expect(plan013).toHaveLength(1);
    expect(plan013[0].message).toContain('ghost_user');
  });

  it('passes when persona is referenced in task assigns', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
Persona: @dev — 개발자
## Story: Test
When: action
Then: result [MUST]
### Task: Impl
Assign: @dev`);
    const diags = engine.lint(doc);
    expect(diags.filter(d => d.ruleId === 'PLAN-013')).toHaveLength(0);
  });

  it('skips persona declarations without actor', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
Persona: 일반 사용자 (no actor reference)
## Story: Test
When: action
Then: result [MUST]`);
    const diags = engine.lint(doc);
    expect(diags.filter(d => d.ruleId === 'PLAN-013')).toHaveLength(0);
  });
});

describe('PLAN-014: Story without Task', () => {
  it('warns when story has no tasks', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: No Tasks
When: action
Then: result [MUST]`);
    const diags = engine.lint(doc);
    const plan014 = diags.filter(d => d.ruleId === 'PLAN-014');
    expect(plan014).toHaveLength(1);
    expect(plan014[0].message).toContain('No Tasks');
  });

  it('passes when story has tasks', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Has Tasks
When: action
Then: result [MUST]
### Task: Do Something
Assign: @dev`);
    const diags = engine.lint(doc);
    expect(diags.filter(d => d.ruleId === 'PLAN-014')).toHaveLength(0);
  });

  it('warns even when story has edges but no tasks', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Edges Only
When: action
Then: result [MUST]
Edge: "Some edge case"
  When: edge condition
  Then: edge result [MUST]`);
    const diags = engine.lint(doc);
    expect(diags.filter(d => d.ruleId === 'PLAN-014')).toHaveLength(1);
  });
});

describe('PLAN-011: Duplicate Feature ID (cross-file)', () => {
  it('errors when duplicate IDs exist', () => {
    const doc1 = parsePlanFile(`---
type: feature
id: duplicate-id
status: draft
---
# Feature: First
Goal: test`, '/path/file1.plan');

    const doc2 = parsePlanFile(`---
type: feature
id: duplicate-id
status: draft
---
# Feature: Second
Goal: test`, '/path/file2.plan');

    const documents = new Map<string, PlanDocument>();
    documents.set('duplicate-id', doc1);

    const duplicateIds = new Map<string, string[]>();
    duplicateIds.set('duplicate-id', ['/path/file1.plan', '/path/file2.plan']);

    const resultMap = engine.lintProject(documents, undefined, undefined, duplicateIds);
    const diags = resultMap.get('duplicate-id') ?? [];
    const plan011 = diags.filter(d => d.ruleId === 'PLAN-011');
    expect(plan011).toHaveLength(1);
    expect(plan011[0].message).toContain('duplicate-id');
  });

  it('passes when IDs are unique', () => {
    const doc = parsePlanFile(`---
type: feature
id: unique-id
status: draft
---
# Feature: Unique
Goal: test`, '/path/unique.plan');

    const documents = new Map<string, PlanDocument>();
    documents.set('unique-id', doc);

    const duplicateIds = new Map<string, string[]>();

    const resultMap = engine.lintProject(documents, undefined, undefined, duplicateIds);
    const diags = resultMap.get('unique-id') ?? [];
    expect(diags.filter(d => d.ruleId === 'PLAN-011')).toHaveLength(0);
  });
});

describe('PLAN-012: Circular Dependency (cross-file)', () => {
  it('detects circular dependencies', () => {
    const docA = parsePlanFile(`---
type: feature
id: feat-a
status: draft
---
# Feature: A
Goal: test
Needs: [feat-b]`, '/path/a.plan');

    const docB = parsePlanFile(`---
type: feature
id: feat-b
status: draft
---
# Feature: B
Goal: test
Needs: [feat-a]`, '/path/b.plan');

    const documents = new Map<string, PlanDocument>();
    documents.set('feat-a', docA);
    documents.set('feat-b', docB);

    const resultMap = engine.lintProject(documents);
    const diagsA = resultMap.get('feat-a') ?? [];
    const plan012A = diagsA.filter(d => d.ruleId === 'PLAN-012');
    expect(plan012A.length).toBeGreaterThanOrEqual(1);
    expect(plan012A[0].message).toContain('feat-a');
    expect(plan012A[0].message).toContain('feat-b');
  });

  it('detects 3-node cycles', () => {
    const docA = parsePlanFile(`---
type: feature
id: feat-a
status: draft
---
# Feature: A
Goal: test
Needs: [feat-b]`, '/path/a.plan');

    const docB = parsePlanFile(`---
type: feature
id: feat-b
status: draft
---
# Feature: B
Goal: test
Needs: [feat-c]`, '/path/b.plan');

    const docC = parsePlanFile(`---
type: feature
id: feat-c
status: draft
---
# Feature: C
Goal: test
Needs: [feat-a]`, '/path/c.plan');

    const documents = new Map<string, PlanDocument>();
    documents.set('feat-a', docA);
    documents.set('feat-b', docB);
    documents.set('feat-c', docC);

    const resultMap = engine.lintProject(documents);
    const diagsA = resultMap.get('feat-a') ?? [];
    const plan012A = diagsA.filter(d => d.ruleId === 'PLAN-012');
    expect(plan012A.length).toBeGreaterThanOrEqual(1);
  });

  it('passes when no cycles exist', () => {
    const docA = parsePlanFile(`---
type: feature
id: feat-a
status: draft
---
# Feature: A
Goal: test
Needs: [feat-b]`, '/path/a.plan');

    const docB = parsePlanFile(`---
type: feature
id: feat-b
status: draft
---
# Feature: B
Goal: test`, '/path/b.plan');

    const documents = new Map<string, PlanDocument>();
    documents.set('feat-a', docA);
    documents.set('feat-b', docB);

    const resultMap = engine.lintProject(documents);
    const diagsA = resultMap.get('feat-a') ?? [];
    expect(diagsA.filter(d => d.ruleId === 'PLAN-012')).toHaveLength(0);
  });
});
