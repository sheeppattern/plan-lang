import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { loadProject } from '../../src/project/project-loader.js';
import { resolveReferences } from '../../src/project/cross-file-resolver.js';
import { LintEngine } from '../../src/linter/index.js';

const FIXTURES = path.resolve(__dirname, '../fixtures');

describe('Project Loader', () => {
  it('loads all .plan files from fixtures directory', () => {
    const { documents, errors } = loadProject(FIXTURES);
    expect(errors).toHaveLength(0);
    expect(documents.size).toBeGreaterThanOrEqual(4);
    expect(documents.has('feat-social-login')).toBe(true);
    expect(documents.has('feat-payment')).toBe(true);
    expect(documents.has('feat-email-auth')).toBe(true);
  });
});

describe('Cross-File Reference Resolver', () => {
  const { documents } = loadProject(FIXTURES);

  it('resolves existing references', () => {
    const { resolved } = resolveReferences(documents);
    expect(resolved.length).toBeGreaterThanOrEqual(1);
    // feat-social-login Needs [feat-email-auth]
    const socialToEmail = resolved.find(
      r => r.sourceId === 'feat-social-login' && r.targetId === 'feat-email-auth',
    );
    expect(socialToEmail).toBeDefined();
  });

  it('reports unresolved references', () => {
    const { unresolved } = resolveReferences(documents);
    // feat-payment Needs [feat-plan-management] which doesn't exist
    const paymentMissing = unresolved.find(
      r => r.targetId === 'feat-plan-management',
    );
    expect(paymentMissing).toBeDefined();
  });
});

describe('Cross-File Lint Rules', () => {
  const { documents, sources } = loadProject(FIXTURES);
  const engine = new LintEngine();

  it('PLAN-009: reports missing Needs reference', () => {
    const resultMap = engine.lintProject(documents, sources);

    // feat-payment references [feat-plan-management] which doesn't exist
    const paymentDiags = resultMap.get('feat-payment') || [];
    const plan009 = paymentDiags.filter(d => d.ruleId === 'PLAN-009');
    expect(plan009.length).toBeGreaterThanOrEqual(1);
    expect(plan009[0].message).toContain('feat-plan-management');
  });

  it('PLAN-008: reports Blocks target in draft status', () => {
    const resultMap = engine.lintProject(documents, sources);

    // feat-email-auth Blocks [feat-social-login] which is draft
    const emailDiags = resultMap.get('feat-email-auth') || [];
    const plan008 = emailDiags.filter(d => d.ruleId === 'PLAN-008');
    expect(plan008.length).toBeGreaterThanOrEqual(1);
  });
});
