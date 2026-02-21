import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { formatPlanSource } from '../../src/formatter/index.js';

const FIXTURES = path.resolve(__dirname, '../fixtures');

describe('Formatter', () => {
  describe('Frontmatter key ordering', () => {
    it('reorders frontmatter keys to canonical order', () => {
      const source = `---
owner: @max
status: draft
tags: [test]
id: test-id
type: feature
priority: normal
created: 2026-01-01
version: 0.1.0
---
# Feature: Test
Goal: test`;
      const result = formatPlanSource(source);
      const lines = result.formatted.split('\n');

      // Find frontmatter content (between --- lines)
      const fmStart = lines.indexOf('---');
      const fmEnd = lines.indexOf('---', fmStart + 1);
      const fmKeys = lines.slice(fmStart + 1, fmEnd)
        .filter(l => l.match(/^[a-z]/))
        .map(l => l.split(':')[0]);

      // Expected canonical order: type, id, status, version, owner, priority, tags, created
      expect(fmKeys).toEqual(['type', 'id', 'status', 'version', 'owner', 'priority', 'tags', 'created']);
      expect(result.changed).toBe(true);
    });

    it('does not change already ordered frontmatter', () => {
      const source = `---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test
`;
      const result = formatPlanSource(source);
      expect(result.changed).toBe(false);
    });
  });

  describe('Trailing whitespace', () => {
    it('removes trailing whitespace', () => {
      const source = '---\ntype: feature  \nid: test\nstatus: draft\n---\n# Feature: Test   \nGoal: test  \n';
      const result = formatPlanSource(source);
      const lines = result.formatted.split('\n');
      for (const line of lines) {
        if (line.length > 0) {
          expect(line).toBe(line.trimEnd());
        }
      }
    });
  });

  describe('Blank line normalization', () => {
    it('collapses consecutive blank lines', () => {
      const source = `---
type: feature
id: test
status: draft
---


# Feature: Test

Goal: test



## Story: Test`;
      const result = formatPlanSource(source);
      // Should not have 3+ consecutive newlines
      expect(result.formatted).not.toMatch(/\n\n\n/);
    });
  });

  describe('File ending', () => {
    it('ensures file ends with exactly one newline', () => {
      const source = `---
type: feature
id: test
status: draft
---
# Feature: Test
Goal: test`;
      const result = formatPlanSource(source);
      expect(result.formatted.endsWith('\n')).toBe(true);
      expect(result.formatted.endsWith('\n\n')).toBe(false);
    });
  });

  describe('Integration with fixture', () => {
    it('formats unformatted.plan fixture', () => {
      const source = fs.readFileSync(path.join(FIXTURES, 'unformatted.plan'), 'utf-8');
      const result = formatPlanSource(source, 'unformatted.plan');
      expect(result.changed).toBe(true);

      // Verify frontmatter key order
      const lines = result.formatted.split('\n');
      const fmStart = lines.indexOf('---');
      const fmEnd = lines.indexOf('---', fmStart + 1);
      const fmKeys = lines.slice(fmStart + 1, fmEnd)
        .filter(l => l.match(/^[a-z]/))
        .map(l => l.split(':')[0]);

      expect(fmKeys[0]).toBe('type');
      expect(fmKeys[1]).toBe('id');
      expect(fmKeys[2]).toBe('status');
    });
  });
});
