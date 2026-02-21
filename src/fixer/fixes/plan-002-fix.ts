import type { FixProvider, Fix } from '../fix-types.js';
import type { Diagnostic } from '../../types/ast.js';

/** Fix for PLAN-002: Insert missing When:/Then: after Story heading */
export const plan002Fix: FixProvider = {
  ruleId: 'PLAN-002',
  getFixes(diagnostic: Diagnostic, sourceLines: string[]): Fix[] {
    const headingLine = diagnostic.range.start.line;
    const missingWhen = diagnostic.message.includes('When:');
    const missingThen = diagnostic.message.includes('Then:');

    // Find the insertion point: after existing behaviors/intents that follow the heading
    let insertIdx = headingLine; // 0-based: line after heading
    while (insertIdx < sourceLines.length) {
      const line = sourceLines[insertIdx].trim();
      if (line.startsWith('Goal:') || line.startsWith('Persona:') || line.startsWith('Metric:') ||
          line.startsWith('Given:') || line.startsWith('When:') || line.startsWith('Then:') ||
          line === '') {
        insertIdx++;
      } else {
        break;
      }
    }

    const fixes: Fix[] = [];

    if (missingWhen) {
      fixes.push({
        ruleId: 'PLAN-002',
        range: diagnostic.range,
        description: 'Story에 When: 삽입',
        apply(lines: string[]): string[] {
          const result = [...lines];
          result.splice(insertIdx, 0, 'When: ');
          return result;
        },
      });
    }

    if (missingThen) {
      fixes.push({
        ruleId: 'PLAN-002',
        range: diagnostic.range,
        description: 'Story에 Then: 삽입',
        apply(lines: string[]): string[] {
          const result = [...lines];
          result.splice(insertIdx, 0, 'Then:  [MUST]');
          return result;
        },
      });
    }

    return fixes;
  },
};
