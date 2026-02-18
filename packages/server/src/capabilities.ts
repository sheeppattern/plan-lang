/**
 * Server capabilities declaration.
 */
import {
  TextDocumentSyncKind,
  type ServerCapabilities,
} from 'vscode-languageserver';

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
};
