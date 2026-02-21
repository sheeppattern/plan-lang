import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic } from '../../types/ast.js';

/** PLAN-011: Duplicate Feature ID across project files */
export const plan011DuplicateId: LintRule = {
  id: 'PLAN-011',
  severity: 'error',
  description: '프로젝트 내 Feature ID가 중복됨',
  crossFile: true,
  check({ document, duplicateIds }: LintContext): Diagnostic[] {
    if (!duplicateIds) return [];
    if (!document.frontmatter?.id) return [];

    const id = document.frontmatter.id;
    const files = duplicateIds.get(id);
    if (!files || files.length <= 1) return [];

    const otherFiles = files.filter(f => f !== document.filePath);
    if (otherFiles.length === 0) return [];

    return [{
      ruleId: 'PLAN-011',
      severity: 'error',
      message: `Feature ID "${id}"가 다른 파일과 중복됩니다: ${otherFiles.join(', ')}`,
      range: { start: { line: 1, column: 1 }, end: { line: 1, column: 1 } },
      filePath: document.filePath,
    }];
  },
};
