import { describe, it, expect } from 'vitest';
import { planRangeToLsp, lspPositionToPlan, planRangeContainsLspPosition } from '../src/position-utils.js';

describe('position-utils', () => {
  describe('planRangeToLsp', () => {
    it('converts 1-based plan range to 0-based LSP range', () => {
      const planRange = {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 10 },
      };
      const lsp = planRangeToLsp(planRange);
      expect(lsp.start.line).toBe(0);
      expect(lsp.start.character).toBe(0);
      expect(lsp.end.line).toBe(0);
      expect(lsp.end.character).toBe(9);
    });

    it('handles multi-line ranges', () => {
      const planRange = {
        start: { line: 5, column: 3 },
        end: { line: 10, column: 15 },
      };
      const lsp = planRangeToLsp(planRange);
      expect(lsp.start.line).toBe(4);
      expect(lsp.start.character).toBe(2);
      expect(lsp.end.line).toBe(9);
      expect(lsp.end.character).toBe(14);
    });
  });

  describe('lspPositionToPlan', () => {
    it('converts 0-based LSP position to 1-based plan location', () => {
      const lspPos = { line: 0, character: 0 };
      const plan = lspPositionToPlan(lspPos);
      expect(plan.line).toBe(1);
      expect(plan.column).toBe(1);
    });

    it('handles non-zero offsets', () => {
      const lspPos = { line: 4, character: 7 };
      const plan = lspPositionToPlan(lspPos);
      expect(plan.line).toBe(5);
      expect(plan.column).toBe(8);
    });
  });

  describe('roundtrip conversion', () => {
    it('planRange → lsp → plan preserves coordinates', () => {
      const original = {
        start: { line: 3, column: 5 },
        end: { line: 3, column: 20 },
      };
      const lsp = planRangeToLsp(original);
      const startBack = lspPositionToPlan(lsp.start);
      const endBack = lspPositionToPlan(lsp.end);

      expect(startBack.line).toBe(original.start.line);
      expect(startBack.column).toBe(original.start.column);
      expect(endBack.line).toBe(original.end.line);
      expect(endBack.column).toBe(original.end.column);
    });
  });

  describe('planRangeContainsLspPosition', () => {
    const range = {
      start: { line: 5, column: 3 },
      end: { line: 5, column: 15 },
    };

    it('returns true for position inside range', () => {
      // LSP position (4, 5) → plan (5, 6) which is inside (5,3)-(5,15)
      expect(planRangeContainsLspPosition(range, { line: 4, character: 5 })).toBe(true);
    });

    it('returns true for position at range start', () => {
      // LSP position (4, 2) → plan (5, 3) which is the start
      expect(planRangeContainsLspPosition(range, { line: 4, character: 2 })).toBe(true);
    });

    it('returns false for position before range', () => {
      expect(planRangeContainsLspPosition(range, { line: 4, character: 0 })).toBe(false);
    });

    it('returns false for position at range end (exclusive)', () => {
      // LSP (4, 14) → plan (5, 15) which is the end (exclusive)
      expect(planRangeContainsLspPosition(range, { line: 4, character: 14 })).toBe(false);
    });

    it('returns false for position on different line', () => {
      expect(planRangeContainsLspPosition(range, { line: 5, character: 5 })).toBe(false);
    });
  });
});
