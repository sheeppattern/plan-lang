/**
 * Document manager: maintains parsed AST cache and project state.
 */
import { parsePlanFile, loadProject } from 'plan-lang';
import type { PlanDocument } from 'plan-lang';
import { URL } from 'node:url';

export interface DocumentState {
  uri: string;
  source: string;
  doc: PlanDocument;
  version: number;
}

export class DocumentManager {
  /** uri → DocumentState */
  private documents = new Map<string, DocumentState>();
  /** frontmatter.id → uri */
  private idToUri = new Map<string, string>();
  /** uri → frontmatter.id */
  private uriToId = new Map<string, string>();

  private workspaceRoot: string | null = null;

  setWorkspaceRoot(root: string | null): void {
    this.workspaceRoot = root;
  }

  getWorkspaceRoot(): string | null {
    return this.workspaceRoot;
  }

  /** Parse and cache a document. */
  update(uri: string, source: string, version: number): DocumentState {
    const filePath = uriToFilePath(uri);
    const doc = parsePlanFile(source, filePath);
    const state: DocumentState = { uri, source, doc, version };

    // Remove old id mapping
    const oldId = this.uriToId.get(uri);
    if (oldId) {
      this.idToUri.delete(oldId);
    }

    this.documents.set(uri, state);

    // Update id mappings
    if (doc.frontmatter?.id) {
      this.idToUri.set(doc.frontmatter.id, uri);
      this.uriToId.set(uri, doc.frontmatter.id);
    }

    return state;
  }

  /** Remove a document from cache. */
  remove(uri: string): void {
    const id = this.uriToId.get(uri);
    if (id) this.idToUri.delete(id);
    this.uriToId.delete(uri);
    this.documents.delete(uri);
  }

  /** Get cached document state. */
  get(uri: string): DocumentState | undefined {
    return this.documents.get(uri);
  }

  /** Get all cached documents. */
  all(): Map<string, DocumentState> {
    return this.documents;
  }

  /** Get URI for a frontmatter id. */
  getUriForId(id: string): string | undefined {
    return this.idToUri.get(id);
  }

  /** Get a map of id → PlanDocument for all cached docs. */
  getProjectDocuments(): Map<string, PlanDocument> {
    const result = new Map<string, PlanDocument>();
    for (const [uri, state] of this.documents) {
      const id = this.uriToId.get(uri) ?? uri;
      result.set(id, state.doc);
    }
    return result;
  }

  /** Get a map of id → source for all cached docs. */
  getProjectSources(): Map<string, string> {
    const result = new Map<string, string>();
    for (const [uri, state] of this.documents) {
      const id = this.uriToId.get(uri) ?? uri;
      result.set(id, state.source);
    }
    return result;
  }

  /** Load all .plan files from workspace root into cache. */
  loadWorkspace(): void {
    if (!this.workspaceRoot) return;

    const result = loadProject(this.workspaceRoot);
    for (const [id, doc] of result.documents) {
      const source = result.sources.get(id) ?? '';
      const filePath = doc.filePath ?? '';
      const uri = filePathToUri(filePath);

      this.documents.set(uri, { uri, source, doc, version: 0 });
      if (doc.frontmatter?.id) {
        this.idToUri.set(doc.frontmatter.id, uri);
        this.uriToId.set(uri, doc.frontmatter.id);
      }
    }
  }

  /** Get all known frontmatter IDs. */
  getAllIds(): string[] {
    return Array.from(this.idToUri.keys());
  }

  /** Get all known actor names from the project. */
  getAllActors(): string[] {
    const actors = new Set<string>();
    for (const [, state] of this.documents) {
      const { doc } = state;
      if (!doc.feature) continue;
      // Collect from feature intents
      for (const intent of doc.feature.intents) {
        if (intent.kind === 'persona' && intent.actor) {
          actors.add(intent.actor.name);
        }
      }
      // Collect from stories
      for (const story of doc.feature.stories) {
        for (const intent of story.intents) {
          if (intent.kind === 'persona' && intent.actor) {
            actors.add(intent.actor.name);
          }
        }
        for (const task of story.tasks) {
          for (const assign of task.assigns) {
            if (assign.actor) actors.add(assign.actor.name);
          }
        }
      }
    }
    return Array.from(actors);
  }
}

function uriToFilePath(uri: string): string {
  try {
    const url = new URL(uri);
    let filePath = decodeURIComponent(url.pathname);
    // On Windows, remove leading slash from /C:/...
    if (process.platform === 'win32' && /^\/[a-zA-Z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }
    return filePath;
  } catch {
    return uri;
  }
}

function filePathToUri(filePath: string): string {
  if (filePath.startsWith('file://')) return filePath;
  // Normalize to file:// URI
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    return `file://${normalized}`;
  }
  return `file:///${normalized}`;
}
