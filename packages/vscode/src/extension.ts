/**
 * VS Code extension entry point: starts the plan-lang LSP client.
 */
import * as path from 'node:path';
import type { ExtensionContext } from 'vscode';
import {
  LanguageClient,
  TransportKind,
  type LanguageClientOptions,
  type ServerOptions,
} from 'vscode-languageclient/node.js';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext): void {
  // Server bundled inside extension under server/
  const serverModule = context.asAbsolutePath(
    path.join('server', 'server.js'),
  );

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'plan' }],
    synchronize: {
      fileEvents: undefined, // We use textDocumentSync instead
    },
  };

  client = new LanguageClient(
    'planLanguageServer',
    'Plan Language Server',
    serverOptions,
    clientOptions,
  );

  client.start();
}

export function deactivate(): Promise<void> | undefined {
  if (!client) return undefined;
  return client.stop();
}
