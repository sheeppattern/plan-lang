import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePlanFile } from '../../src/parser/index.js';

const FIXTURES = path.resolve(__dirname, '../fixtures');

function loadFixture(name: string): string {
  return fs.readFileSync(path.join(FIXTURES, name), 'utf-8');
}

describe('Parser — Full File Parsing', () => {
  describe('feat-social-login.plan', () => {
    const doc = parsePlanFile(loadFixture('feat-social-login.plan'), 'feat-social-login.plan');

    it('parses frontmatter', () => {
      expect(doc.frontmatter).not.toBeNull();
      expect(doc.frontmatter!.type).toBe('feature');
      expect(doc.frontmatter!.id).toBe('feat-social-login');
      expect(doc.frontmatter!.status).toBe('draft');
    });

    it('parses feature block', () => {
      expect(doc.feature).not.toBeNull();
      expect(doc.feature!.title).toBe('소셜 로그인');
    });

    it('parses feature intents', () => {
      const goals = doc.feature!.intents.filter(i => i.kind === 'goal');
      const personas = doc.feature!.intents.filter(i => i.kind === 'persona');
      const metrics = doc.feature!.intents.filter(i => i.kind === 'metric');
      expect(goals).toHaveLength(1);
      expect(personas).toHaveLength(1);
      expect(metrics).toHaveLength(2);
    });

    it('parses feature dependencies', () => {
      expect(doc.feature!.dependencies).toHaveLength(3);
      const needs = doc.feature!.dependencies.filter(d => d.kind === 'needs');
      const blocks = doc.feature!.dependencies.filter(d => d.kind === 'blocks');
      expect(needs).toHaveLength(2);
      expect(blocks).toHaveLength(1);
    });

    it('parses stories', () => {
      expect(doc.feature!.stories).toHaveLength(2);
      expect(doc.feature!.stories[0].title).toBe('Google 계정으로 가입');
      expect(doc.feature!.stories[1].title).toBe('Apple 계정으로 가입');
    });

    it('parses story behaviors (Google story)', () => {
      const story = doc.feature!.stories[0];
      const givens = story.behaviors.filter(b => b.kind === 'given');
      const whens = story.behaviors.filter(b => b.kind === 'when');
      const thens = story.behaviors.filter(b => b.kind === 'then');
      expect(givens.length).toBeGreaterThanOrEqual(1);
      expect(whens.length).toBeGreaterThanOrEqual(1);
      expect(thens.length).toBeGreaterThanOrEqual(1);
    });

    it('parses edge cases (Google story)', () => {
      const story = doc.feature!.stories[0];
      expect(story.edges.length).toBeGreaterThanOrEqual(3);
      expect(story.edges[0].description).toContain('이메일이 없는 경우');
    });

    it('parses tasks (Google story)', () => {
      const story = doc.feature!.stories[0];
      expect(story.tasks).toHaveLength(3);
      expect(story.tasks[0].title).toBe('OAuth 콜백 핸들러 구현');
      expect(story.tasks[0].assigns).toHaveLength(1);
      expect(story.tasks[0].verifies.length).toBeGreaterThanOrEqual(2);
    });

    it('parses uncertainty blocks (Apple story)', () => {
      const story = doc.feature!.stories[1];
      expect(story.uncertaintyBlocks).toHaveLength(1);
      expect(story.uncertaintyBlocks[0].type).toBe('pending');
    });

    it('has no parse errors', () => {
      expect(doc.errors).toHaveLength(0);
    });
  });

  describe('feat-payment.plan', () => {
    const doc = parsePlanFile(loadFixture('feat-payment.plan'), 'feat-payment.plan');

    it('parses frontmatter', () => {
      expect(doc.frontmatter!.id).toBe('feat-payment');
      expect(doc.frontmatter!.status).toBe('blocked');
      expect(doc.frontmatter!.priority).toBe('urgent');
    });

    it('parses all stories', () => {
      expect(doc.feature!.stories).toHaveLength(3);
    });

    it('parses uncertainty block (?alternative)', () => {
      const lastStory = doc.feature!.stories[2];
      expect(lastStory.uncertaintyBlocks).toHaveLength(1);
      expect(lastStory.uncertaintyBlocks[0].type).toBe('alternative');
    });

    it('parses inline uncertainty markers', () => {
      const metrics = doc.feature!.intents.filter(i => i.kind === 'metric');
      const withUncertainty = metrics.filter(m => m.uncertainty);
      expect(withUncertainty.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('feat-email-auth.plan', () => {
    const doc = parsePlanFile(loadFixture('feat-email-auth.plan'), 'feat-email-auth.plan');

    it('parses frontmatter', () => {
      expect(doc.frontmatter!.id).toBe('feat-email-auth');
      expect(doc.frontmatter!.status).toBe('in_progress');
    });

    it('parses stories', () => {
      expect(doc.feature!.stories).toHaveLength(2);
    });

    it('parses obligations in Then lines', () => {
      const story = doc.feature!.stories[0];
      const thens = story.behaviors.filter(b => b.kind === 'then');
      const withObligation = thens.filter(t => t.kind === 'then' && (t as any).obligation);
      expect(withObligation.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('project-index.plan', () => {
    const doc = parsePlanFile(loadFixture('project-index.plan'), 'project-index.plan');

    it('parses frontmatter', () => {
      expect(doc.frontmatter!.id).toBe('index');
      expect(doc.frontmatter!.status).toBe('in_progress');
    });

    it('parses feature', () => {
      expect(doc.feature).not.toBeNull();
      expect(doc.feature!.title).toBe('프로젝트 의존성 맵');
    });

    it('gracefully handles non-standard sections (mermaid, tables)', () => {
      // The parser should not crash on non-standard content
      expect(doc.errors).toHaveLength(0);
    });
  });
});

describe('Parser — Edge Cases', () => {
  it('handles empty file', () => {
    const doc = parsePlanFile('');
    expect(doc.frontmatter).toBeNull();
    expect(doc.feature).toBeNull();
    expect(doc.errors).toHaveLength(0);
  });

  it('handles frontmatter-only file', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---`);
    expect(doc.frontmatter).not.toBeNull();
    expect(doc.feature).toBeNull();
  });

  it('handles file with parse errors (no crash)', () => {
    const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
some random content before feature
# Feature: Test
Goal: something`);
    expect(doc.feature).not.toBeNull();
    expect(doc.feature!.title).toBe('Test');
  });
});
