import * as vscode from 'vscode';
import { generatePlanFile, validateId } from '../../../src/boilerplate/index.js';

export async function newPlanFileCommand(uri?: vscode.Uri): Promise<void> {
  const targetFolder = uri
    ? uri
    : vscode.workspace.workspaceFolders?.[0]?.uri;

  if (!targetFolder) {
    vscode.window.showErrorMessage('No workspace folder open.');
    return;
  }

  const id = await vscode.window.showInputBox({
    prompt: 'Enter plan file ID (kebab-case, e.g., feat-user-auth)',
    placeHolder: 'feat-my-feature',
    validateInput: (value) => validateId(value) ?? null,
  });

  if (!id) return;

  const templateChoice = await vscode.window.showQuickPick(
    [
      { label: 'default', description: 'Feature with Story and Task' },
      { label: 'minimal', description: 'Frontmatter and Feature heading only' },
      { label: 'full', description: 'Full template with Edge, deps, uncertainty' },
    ],
    { placeHolder: 'Select a template' },
  );

  const templateName = templateChoice?.label ?? 'default';
  const result = generatePlanFile(id, { template: templateName });

  const fileUri = vscode.Uri.joinPath(targetFolder, `${id}.plan`);

  try {
    await vscode.workspace.fs.stat(fileUri);
    const overwrite = await vscode.window.showWarningMessage(
      `File ${id}.plan already exists. Overwrite?`,
      'Overwrite',
      'Cancel',
    );
    if (overwrite !== 'Overwrite') return;
  } catch {
    // File doesn't exist, proceed
  }

  await vscode.workspace.fs.writeFile(fileUri, Buffer.from(result.content, 'utf-8'));

  const doc = await vscode.workspace.openTextDocument(fileUri);
  const editor = await vscode.window.showTextDocument(doc);

  // Position cursor at first placeholder
  const text = doc.getText();
  const match = text.match(/\(describe/);
  if (match?.index !== undefined) {
    const pos = doc.positionAt(match.index);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos));
  }
}
