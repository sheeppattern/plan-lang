/**
 * Server capabilities declaration.
 */
import {
  TextDocumentSyncKind,
  CodeActionKind,
  type ServerCapabilities,
} from 'vscode-languageserver';
import { semanticTokensLegend } from './semantic-tokens.js';

export const serverCapabilities: ServerCapabilities = {
  textDocumentSync: TextDocumentSyncKind.Full,
  completionProvider: {
    triggerCharacters: [':', '[', '@', '?', '#'],
    resolveProvider: false,
  },
  hoverProvider: true,
  definitionProvider: true,
  documentSymbolProvider: true,
  foldingRangeProvider: true,
  referencesProvider: true,
  renameProvider: { prepareProvider: true },
  documentLinkProvider: { resolveProvider: false },
  codeActionProvider: { codeActionKinds: [CodeActionKind.QuickFix] },
  workspaceSymbolProvider: true,
  semanticTokensProvider: {
    legend: semanticTokensLegend,
    full: true,
    range: false,
  },
  codeLensProvider: { resolveProvider: true },
};
