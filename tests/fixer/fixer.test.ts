import { describe, it, expect } from 'vitest';
import { parsePlanFile } from '../../src/parser/index.js';
import { LintEngine } from '../../src/linter/index.js';
import { getFixesForDiagnostics, applyFixes, getFixableRuleIds } from '../../src/fixer/index.js';

const engine = new LintEngine();

describe('Fix Registry', () => {
  it('has fixes for expected rules', () => {
    const fixable = getFixableRuleIds();
    expect(fixable).toContain('PLAN-001');
    expect(fixable).toContain('PLAN-002');
    expect(fixable).toContain('PLAN-003');
    expect(fixable).toContain('PLAN-006');
    expect(fixable).toContain('PLAN-010');
  });
});

describe('PLAN-001 Fix: Insert Goal:', () => {
  it('inserts Goal: after Feature heading', () => {
    const source = `---
type: feature
id: test
status: draft
---
# Feature: No Goal
Persona: @user`;
    const doc = parsePlanFile(source);
    const diags = engine.lint(doc).filter(d => d.ruleId === 'PLAN-001');
    expect(diags).toHaveLength(1);

    const sourceLines = source.split(/\n/);
    const fixes = getFixesForDiagnostics(diags, sourceLines);
    expect(fixes.length).toBeGreaterThanOrEqual(1);

    const { output } = applyFixes(source, fixes);
    expect(output).toContain('Goal: ');

    // Re-parse should have no PLAN-001
    const newDoc = parsePlanFile(output);
    const newDiags = engine.lint(newDoc).filter(d => d.ruleId === 'PLAN-001');
    expect(newDiags).toHaveLength(0);
  });
});

describe('PLAN-003 Fix: Insert Assign:', () => {
  it('inserts Assign: @ after Task heading', () => {
    const source = `---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Test
When: action
Then: result [MUST]
### Task: No Assign
Verify: something`;
    const doc = parsePlanFile(source);
    const diags = engine.lint(doc).filter(d => d.ruleId === 'PLAN-003');
    expect(diags).toHaveLength(1);

    const sourceLines = source.split(/\n/);
    const fixes = getFixesForDiagnostics(diags, sourceLines);
    const { output } = applyFixes(source, fixes);
    expect(output).toContain('Assign: @');

    // Re-parse should have no PLAN-003
    const newDoc = parsePlanFile(output);
    const newDiags = engine.lint(newDoc).filter(d => d.ruleId === 'PLAN-003');
    expect(newDiags).toHaveLength(0);
  });
});

describe('PLAN-006 Fix: Add [MUST] to Then:', () => {
  it('appends [MUST] to Then: line', () => {
    const source = `---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Test
When: action
Then: result without obligation`;
    const doc = parsePlanFile(source);
    const diags = engine.lint(doc).filter(d => d.ruleId === 'PLAN-006');
    expect(diags).toHaveLength(1);

    const sourceLines = source.split(/\n/);
    const fixes = getFixesForDiagnostics(diags, sourceLines);
    const { output } = applyFixes(source, fixes);
    expect(output).toContain('Then: result without obligation [MUST]');

    // Re-parse should have no PLAN-006
    const newDoc = parsePlanFile(output);
    const newDiags = engine.lint(newDoc).filter(d => d.ruleId === 'PLAN-006');
    expect(newDiags).toHaveLength(0);
  });
});

describe('PLAN-010 Fix: Insert Metric:', () => {
  it('inserts Metric: after Feature intents', () => {
    const source = `---
type: feature
id: test
status: draft
---
# Feature: No Metric
Goal: test goal`;
    const doc = parsePlanFile(source);
    const diags = engine.lint(doc).filter(d => d.ruleId === 'PLAN-010');
    expect(diags).toHaveLength(1);

    const sourceLines = source.split(/\n/);
    const fixes = getFixesForDiagnostics(diags, sourceLines);
    const { output } = applyFixes(source, fixes);
    expect(output).toContain('Metric: ');
  });
});

describe('applyFixes', () => {
  it('returns unchanged output when no fixes provided', () => {
    const source = 'line1\nline2\nline3';
    const { output, applied } = applyFixes(source, []);
    expect(output).toBe(source);
    expect(applied).toHaveLength(0);
  });

  it('applies multiple fixes bottom-up', () => {
    const source = `---
type: feature
id: test
status: draft
---
# Feature: Test
## Story: Test
When: action
Then: no obligation`;
    const doc = parsePlanFile(source);
    const diags = engine.lint(doc);
    const sourceLines = source.split(/\n/);
    const fixes = getFixesForDiagnostics(diags, sourceLines);
    const { output, applied } = applyFixes(source, fixes);
    expect(applied.length).toBeGreaterThan(0);
    // The output should have fixes applied
    expect(output).not.toBe(source);
  });
});
