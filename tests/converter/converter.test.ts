import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePlanFile } from '../../src/parser/index.js';
import { convert, getSupportedFormats } from '../../src/converter/index.js';

const FIXTURES = path.resolve(__dirname, '../fixtures');

function loadFixture(name: string) {
  const source = fs.readFileSync(path.join(FIXTURES, name), 'utf-8');
  const doc = parsePlanFile(source, path.join(FIXTURES, name));
  return { doc, source };
}

describe('Converter', () => {
  describe('getSupportedFormats', () => {
    it('returns json, markdown, csv', () => {
      const formats = getSupportedFormats();
      expect(formats).toContain('json');
      expect(formats).toContain('markdown');
      expect(formats).toContain('csv');
    });
  });

  describe('JSON Converter', () => {
    it('converts feat-social-login to valid JSON', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'json');
      const parsed = JSON.parse(output);

      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.id).toBe('feat-social-login');
      expect(parsed.metadata.status).toBe('draft');
      expect(parsed.feature).toBeDefined();
      expect(parsed.feature.title).toBe('소셜 로그인');
      expect(parsed.feature.stories).toHaveLength(2);
    });

    it('includes feature goals and metrics', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'json');
      const parsed = JSON.parse(output);

      expect(parsed.feature.goals.length).toBeGreaterThan(0);
      expect(parsed.feature.metrics.length).toBeGreaterThan(0);
    });

    it('includes tasks with assignees', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'json');
      const parsed = JSON.parse(output);

      const tasks = parsed.feature.stories[0].tasks;
      expect(tasks.length).toBeGreaterThan(0);
      expect(tasks[0].assignees.length).toBeGreaterThan(0);
    });
  });

  describe('Markdown Converter', () => {
    it('converts feat-social-login to readable Markdown', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'markdown');

      expect(output).toContain('# 소셜 로그인');
      expect(output).toContain('**Goal**:');
      expect(output).toContain('## Google 계정으로 가입');
      expect(output).toContain('- **Given**:');
      expect(output).toContain('- **When**:');
      expect(output).toContain('- **Then**:');
    });

    it('includes metadata table', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'markdown');

      expect(output).toContain('| Field | Value |');
      expect(output).toContain('feat-social-login');
    });

    it('strips uncertainty markers', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'markdown');

      // Should not contain raw uncertainty markers
      expect(output).not.toContain('?assumption(');
      expect(output).not.toContain('?pending(');
    });
  });

  describe('CSV Converter', () => {
    it('converts feat-social-login to CSV', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'csv');

      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThan(1);

      // Check header
      expect(lines[0]).toBe('Level,Title,Goal,When,Then,Assignee,Status,Dependencies');

      // Check feature row
      expect(lines[1]).toContain('Feature');
    });

    it('has correct row count (Feature + Stories + Tasks)', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      const output = convert(doc, source, 'csv');
      const lines = output.split('\n');

      // Header + 1 Feature + 2 Stories + 3 Tasks = 7
      expect(lines.length).toBe(7);
    });

    it('properly escapes fields with commas', () => {
      const doc = parsePlanFile(`---
type: feature
id: test
status: draft
---
# Feature: Test, with comma
Goal: test goal, with comma`);
      const output = convert(doc, '', 'csv');
      // Fields with commas should be quoted
      expect(output).toContain('"Test, with comma"');
    });
  });

  describe('Unsupported format', () => {
    it('throws for unsupported format', () => {
      const { doc, source } = loadFixture('feat-social-login.plan');
      expect(() => convert(doc, source, 'xml' as any)).toThrow('Unsupported format');
    });
  });
});
