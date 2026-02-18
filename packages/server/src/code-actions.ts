/**
 * Code Actions / Quick Fix provider.
 * Suggests automatic fixes for lint warnings.
 */
import {
  CodeAction,
  CodeActionKind,
  TextEdit,
} from 'vscode-languageserver';
import type { CodeActionParams } from 'vscode-languageserver';
import type { DocumentManager } from './document-manager.js';

export function getCodeActions(
  uri: string,
  params: CodeActionParams,
  docManager: DocumentManager,
): CodeAction[] {
  const state = docManager.get(uri);
  if (!state) return [];

  const actions: CodeAction[] = [];
  const diagnostics = params.context.diagnostics;

  for (const diag of diagnostics) {
    if (diag.source !== 'plan-lang') continue;

    switch (diag.code) {
      case 'PLAN-001': {
        // Feature missing Goal: → insert "Goal: " after Feature heading
        actions.push(makeInsertAction(
          'Add Goal:',
          uri,
          diag.range.start.line + 1,
          'Goal: ',
          diag,
        ));
        break;
      }
      case 'PLAN-002': {
        // Story missing When/Then → insert missing keywords
        const msg = diag.message.toLowerCase();
        if (msg.includes('when')) {
          actions.push(makeInsertAction(
            'Add When:',
            uri,
            diag.range.start.line + 1,
            'When: ',
            diag,
          ));
        }
        if (msg.includes('then')) {
          actions.push(makeInsertAction(
            'Add Then:',
            uri,
            diag.range.start.line + 1,
            'Then: ',
            diag,
          ));
        }
        break;
      }
      case 'PLAN-003': {
        // Task missing Assign: → insert "Assign: @" after Task heading
        actions.push(makeInsertAction(
          'Add Assign:',
          uri,
          diag.range.start.line + 1,
          'Assign: @',
          diag,
        ));
        break;
      }
      case 'PLAN-006': {
        // Then: missing obligation → append [MUST] at end of line
        actions.push({
          title: 'Add [MUST] obligation',
          kind: CodeActionKind.QuickFix,
          diagnostics: [diag],
          edit: {
            changes: {
              [uri]: [
                TextEdit.insert(
                  { line: diag.range.start.line, character: diag.range.end.character },
                  ' [MUST]',
                ),
              ],
            },
          },
        });
        break;
      }
      case 'PLAN-010': {
        // Feature missing Metric: → insert "Metric: " after Feature heading
        actions.push(makeInsertAction(
          'Add Metric:',
          uri,
          diag.range.start.line + 1,
          'Metric: ',
          diag,
        ));
        break;
      }
    }
  }

  return actions;
}

function makeInsertAction(
  title: string,
  uri: string,
  insertLine: number,
  insertText: string,
  diag: CodeActionParams['context']['diagnostics'][0],
): CodeAction {
  return {
    title,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit: {
      changes: {
        [uri]: [
          TextEdit.insert(
            { line: insertLine, character: 0 },
            insertText + '\n',
          ),
        ],
      },
    },
  };
}
