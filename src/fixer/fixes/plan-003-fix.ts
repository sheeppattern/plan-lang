import type { FixProvider, Fix } from '../fix-types.js';
import type { Diagnostic } from '../../types/ast.js';

/** Fix for PLAN-003: Insert Assign: after Task heading */
export const plan003Fix: FixProvider = {
  ruleId: 'PLAN-003',
  getFixes(diagnostic: Diagnostic, sourceLines: string[]): Fix[] {
    const headingLine = diagnostic.range.start.line;

    return [{
      ruleId: 'PLAN-003',
      range: diagnostic.range,
      description: 'Task 헤딩 다음 줄에 Assign: @ 삽입',
      apply(lines: string[]): string[] {
        const result = [...lines];
        result.splice(headingLine, 0, 'Assign: @');
        return result;
      },
    }];
  },
};
