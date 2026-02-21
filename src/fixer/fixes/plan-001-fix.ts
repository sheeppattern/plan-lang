import type { FixProvider, Fix } from '../fix-types.js';
import type { Diagnostic } from '../../types/ast.js';

/** Fix for PLAN-001: Insert Goal: after Feature heading */
export const plan001Fix: FixProvider = {
  ruleId: 'PLAN-001',
  getFixes(diagnostic: Diagnostic, sourceLines: string[]): Fix[] {
    // Find the feature heading line
    const headingLine = diagnostic.range.start.line;

    return [{
      ruleId: 'PLAN-001',
      range: diagnostic.range,
      description: 'Feature 헤딩 다음 줄에 Goal: 삽입',
      apply(lines: string[]): string[] {
        const result = [...lines];
        // Insert after the heading line (0-based index = headingLine)
        result.splice(headingLine, 0, 'Goal: ');
        return result;
      },
    }];
  },
};
