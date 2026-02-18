/**
 * LSP Server entry point for plan-lang.
 */
import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  type InitializeParams,
  type InitializeResult,
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { serverCapabilities } from './capabilities.js';
import { DocumentManager } from './document-manager.js';
import { publishDiagnostics, publishProjectDiagnostics } from './diagnostics.js';
import { getDocumentSymbols } from './symbols.js';
import { getFoldingRanges } from './folding.js';
import { getHover } from './hover.js';
import { getDefinition } from './definition.js';
import { getCompletions } from './completion.js';

// Create connection and text document manager
const connection = createConnection(ProposedFeatures.all);
const textDocuments = new TextDocuments(TextDocument);
const docManager = new DocumentManager();

// Debounce map for didChange
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 200;

// ── Initialize ────────────────────────────────────────────────
connection.onInitialize((params: InitializeParams): InitializeResult => {
  const workspaceFolders = params.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootUri = workspaceFolders[0].uri;
    try {
      const rootPath = new URL(rootUri).pathname;
      // On Windows, remove leading slash from /C:/...
      const normalized = process.platform === 'win32'
        ? rootPath.replace(/^\/([a-zA-Z]:)/, '$1')
        : rootPath;
      docManager.setWorkspaceRoot(normalized);
    } catch {
      // fallback
    }
  }
  return { capabilities: serverCapabilities };
});

connection.onInitialized(() => {
  // Load all .plan files from workspace
  docManager.loadWorkspace();
  // Publish initial diagnostics for all loaded files
  publishProjectDiagnostics(docManager, connection);
});

// ── Document Lifecycle ────────────────────────────────────────

textDocuments.onDidOpen((event) => {
  const doc = event.document;
  docManager.update(doc.uri, doc.getText(), doc.version);
  publishDiagnostics(doc.uri, docManager, connection);
});

textDocuments.onDidChangeContent((event) => {
  const doc = event.document;
  const uri = doc.uri;

  // Debounce: delay parsing to avoid excessive work while typing
  const existing = debounceTimers.get(uri);
  if (existing) clearTimeout(existing);

  debounceTimers.set(
    uri,
    setTimeout(() => {
      debounceTimers.delete(uri);
      // Re-fetch document from textDocuments to get latest content
      const latest = textDocuments.get(uri);
      if (latest) {
        docManager.update(uri, latest.getText(), latest.version);
        publishDiagnostics(uri, docManager, connection);
      }
    }, DEBOUNCE_MS),
  );
});

textDocuments.onDidSave((event) => {
  const doc = event.document;
  docManager.update(doc.uri, doc.getText(), doc.version);
  // Run project-wide lint on save
  publishProjectDiagnostics(docManager, connection);
});

textDocuments.onDidClose((event) => {
  const { uri } = event.document;
  debounceTimers.get(uri) && clearTimeout(debounceTimers.get(uri));
  debounceTimers.delete(uri);
  docManager.remove(uri);
  // Clear diagnostics for closed file
  connection.sendDiagnostics({ uri, diagnostics: [] });
});

// ── Features ──────────────────────────────────────────────────

connection.onDocumentSymbol((params) => {
  return getDocumentSymbols(params.textDocument.uri, docManager);
});

connection.onFoldingRanges((params) => {
  return getFoldingRanges(params.textDocument.uri, docManager);
});

connection.onHover((params) => {
  return getHover(params.textDocument.uri, params.position, docManager);
});

connection.onDefinition((params) => {
  return getDefinition(params.textDocument.uri, params.position, docManager);
});

connection.onCompletion((params) => {
  return getCompletions(params.textDocument.uri, params.position, docManager);
});

// ── Start ─────────────────────────────────────────────────────
textDocuments.listen(connection);
connection.listen();
