import type { FixProvider, Fix } from '../fix-types.js';
import type { Diagnostic } from '../../types/ast.js';

/** Fix for PLAN-010: Insert Metric: after Feature heading */
export const plan010Fix: FixProvider = {
  ruleId: 'PLAN-010',
  getFixes(diagnostic: Diagnostic, sourceLines: string[]): Fix[] {
    const headingLine = diagnostic.range.start.line;

    // Find insertion point after existing intents (Goal:, Persona:, etc.)
    let insertIdx = headingLine; // 0-based: line after heading
    while (insertIdx < sourceLines.length) {
      const line = sourceLines[insertIdx].trim();
      if (line.startsWith('Goal:') || line.startsWith('Persona:') || line.startsWith('Metric:') || line === '') {
        insertIdx++;
      } else {
        break;
      }
    }

    return [{
      ruleId: 'PLAN-010',
      range: diagnostic.range,
      description: 'Feature에 Metric: 삽입',
      apply(lines: string[]): string[] {
        const result = [...lines];
        result.splice(insertIdx, 0, 'Metric: ');
        return result;
      },
    }];
  },
};
