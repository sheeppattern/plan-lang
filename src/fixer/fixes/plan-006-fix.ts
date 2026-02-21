import type { FixProvider, Fix } from '../fix-types.js';
import type { Diagnostic } from '../../types/ast.js';

/** Fix for PLAN-006: Append [MUST] to Then: line */
export const plan006Fix: FixProvider = {
  ruleId: 'PLAN-006',
  getFixes(diagnostic: Diagnostic, sourceLines: string[]): Fix[] {
    const lineIdx = diagnostic.range.start.line - 1; // 0-based

    return [{
      ruleId: 'PLAN-006',
      range: diagnostic.range,
      description: 'Then: 줄 끝에 [MUST] 추가',
      apply(lines: string[]): string[] {
        const result = [...lines];
        if (lineIdx >= 0 && lineIdx < result.length) {
          result[lineIdx] = result[lineIdx].trimEnd() + ' [MUST]';
        }
        return result;
      },
    }];
  },
};
