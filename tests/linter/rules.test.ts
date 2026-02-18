import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePlanFile } from '../../src/parser/index.js';
import { LintEngine } from '../../src/linter/index.js';
import type { PlanDocument } from '../../src/types/ast.js';

const FIXTURES = path.resolve(__dirname, '../fixtures');

function loadFixture(name: string): { doc: PlanDocument; source: string } {
  const source = fs.readFileSync(path.join(FIXTURES, name), 'utf-8');
  return { doc: parsePlanFile(source, path.join(FIXTURES, name)), source };
}

const engine = new LintEngine();

describe('Lint Rules', () => {
  describe('PLAN-001: Feature must have Goal:', () => {
    it('passes when Goal exists', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const diags = engine.lint(doc, { source });
      expect(diags.filter(d => d.ruleId === 'PLAN-001')).toHaveLength(0);
    });

    it('errors when Goal is missing', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: No Goal Feature
Persona: @user`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-001')).toHaveLength(1);
    });
  });

  describe('PLAN-002: Story must have When: and Then:', () => {
    it('passes when both exist', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const diags = engine.lint(doc, { source });
      expect(diags.filter(d => d.ruleId === 'PLAN-002')).toHaveLength(0);
    });

    it('errors when When: is missing', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: No When
Given: some condition
Then: some result [MUST]`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-002')).toHaveLength(1);
    });

    it('errors when Then: is missing', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: No Then
When: user does something`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-002')).toHaveLength(1);
    });
  });

  describe('PLAN-003: Task must have Assign:', () => {
    it('passes when Assign exists', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const diags = engine.lint(doc, { source });
      expect(diags.filter(d => d.ruleId === 'PLAN-003')).toHaveLength(0);
    });

    it('errors when Assign is missing', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Test Story
When: user acts
Then: result [MUST]
### Task: No Assign
Verify: something`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-003')).toHaveLength(1);
    });
  });

  describe('PLAN-004: status:ready with ?pending markers', () => {
    it('passes when status is not ready', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const diags = engine.lint(doc, { source });
      expect(diags.filter(d => d.ruleId === 'PLAN-004')).toHaveLength(0);
    });

    it('errors when ready but has pending', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: ready
---
# Feature: Test
Goal: test
Metric: value ?pending("undecided")
## Story: Test
When: action
Then: result [MUST]`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-004')).toHaveLength(1);
    });
  });

  describe('PLAN-005: Story without Edge cases', () => {
    it('warns when story has no edges', () => {
      const { doc } = loadFixture('feat-email-auth.plan');
      const diags = engine.lint(doc);
      const plan005 = diags.filter(d => d.ruleId === 'PLAN-005');
      // "이메일 인증 코드 발송 개선" story has no edges
      expect(plan005.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PLAN-006: Then: without obligation level', () => {
    it('warns when Then has no obligation', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Test
When: action
Then: result without obligation`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-006')).toHaveLength(1);
    });

    it('passes when Then has obligation', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Test
When: action
Then: result [MUST]`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-006')).toHaveLength(0);
    });
  });

  describe('PLAN-010: Feature without Metric:', () => {
    it('passes when Metric exists', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const diags = engine.lint(doc, { source });
      expect(diags.filter(d => d.ruleId === 'PLAN-010')).toHaveLength(0);
    });

    it('warns when Metric is missing', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: No Metric
Goal: test`);
      const diags = engine.lint(doc);
      expect(diags.filter(d => d.ruleId === 'PLAN-010')).toHaveLength(1);
    });
  });

  describe('Lint Directives', () => {
    it('suppresses rules with @lint-disable', () => {
      const source = `---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
## Story: Test
When: action
<!-- @lint-disable PLAN-006 -->
Then: no obligation
<!-- @lint-enable PLAN-006 -->`;
      const doc = parsePlanFile(source);
      const diags = engine.lint(doc, { source });
      expect(diags.filter(d => d.ruleId === 'PLAN-006')).toHaveLength(0);
    });
  });
});

describe('Lint Rules — Example Files', () => {
  it('feat-social-login.plan: no errors', () => {
    const { doc, source } = loadFixture('feat-social-login.plan');
    const diags = engine.lint(doc, { source });
    const errors = diags.filter(d => d.severity === 'error');
    expect(errors).toHaveLength(0);
  });

  it('feat-email-auth.plan: PLAN-005 on "이메일 인증 코드 발송 개선"', () => {
    const { doc, source } = loadFixture('feat-email-auth.plan');
    const diags = engine.lint(doc, { source });
    const plan005 = diags.filter(d => d.ruleId === 'PLAN-005');
    expect(plan005.length).toBeGreaterThanOrEqual(1);
  });

  it('project-index.plan: PLAN-001 pass (has Goal)', () => {
    const { doc, source } = loadFixture('project-index.plan');
    const diags = engine.lint(doc, { source });
    expect(diags.filter(d => d.ruleId === 'PLAN-001')).toHaveLength(0);
  });
});
