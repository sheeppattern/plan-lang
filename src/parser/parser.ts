import type {
  PlanDocument,
  FeatureBlock,
  StoryBlock,
  TaskBlock,
  EdgeBlock,
  UncertaintyBlock,
  IntentLine,
  BehaviorLine,
  DependencyLine,
  TextLine,
  GoalLine,
  PersonaLine,
  MetricLine,
  GivenLine,
  WhenLine,
  ThenLine,
  NeedsLine,
  BlocksLine,
  AssignLine,
  VerifyLine,
  UncertaintyMarker,
  ParseError,
  ClassifiedLine,
  Range,
  Frontmatter,
} from '../types/ast.js';
import {
  parseUncertaintyMarkers,
  parseObligation,
  parseActorReferences,
  parseReferences,
} from './inline-parser.js';

class ParserState {
  private pos = 0;
  readonly errors: ParseError[] = [];
  readonly comments: Range[] = [];

  constructor(
    private readonly lines: ClassifiedLine[],
    private readonly startLineOffset: number = 0,
  ) {}

  peek(): ClassifiedLine | undefined {
    return this.lines[this.pos];
  }

  advance(): ClassifiedLine {
    return this.lines[this.pos++];
  }

  isAtEnd(): boolean {
    return this.pos >= this.lines.length;
  }

  previous(): ClassifiedLine | undefined {
    return this.pos > 0 ? this.lines[this.pos - 1] : undefined;
  }

  addError(message: string, line: ClassifiedLine): void {
    this.errors.push({
      message,
      range: mkLineRange(line),
    });
  }

  skipBlanksAndSeparators(): void {
    while (!this.isAtEnd()) {
      const cur = this.peek()!;
      if (cur.type === 'blank' || cur.type === 'separator') {
        this.advance();
      } else if (cur.type === 'comment-full') {
        this.comments.push(mkLineRange(cur));
        this.advance();
      } else if (cur.type === 'comment-open') {
        this.skipMultiLineComment();
      } else {
        break;
      }
    }
  }

  skipMultiLineComment(): void {
    const start = this.advance();
    const startLoc = mkLineRange(start);
    while (!this.isAtEnd()) {
      const cur = this.advance();
      if (cur.type === 'comment-close') {
        this.comments.push({
          start: startLoc.start,
          end: { line: cur.lineNumber, column: cur.text.length + 1 },
        });
        return;
      }
    }
    // Unclosed comment
    this.comments.push(startLoc);
  }
}

function mkLineRange(line: ClassifiedLine): Range {
  return {
    start: { line: line.lineNumber, column: 1 },
    end: { line: line.lineNumber, column: line.text.length + 1 },
  };
}

function mkSpanRange(startLine: ClassifiedLine, endLine: ClassifiedLine): Range {
  return {
    start: { line: startLine.lineNumber, column: 1 },
    end: { line: endLine.lineNumber, column: endLine.text.length + 1 },
  };
}

// ── Parse Feature ────────────────────────────────
function parseFeature(state: ParserState): FeatureBlock | null {
  state.skipBlanksAndSeparators();
  if (state.isAtEnd()) return null;

  const headingLine = state.peek()!;
  if (headingLine.type !== 'feature-heading') {
    // Try to find a feature heading
    while (!state.isAtEnd() && state.peek()!.type !== 'feature-heading') {
      const skipped = state.advance();
      if (skipped.type !== 'blank' && skipped.type !== 'separator' &&
          skipped.type !== 'comment-full' && skipped.type !== 'comment-open') {
        state.addError(`Unexpected line before Feature heading`, skipped);
      }
    }
    if (state.isAtEnd()) return null;
  }

  const heading = state.advance();
  const feature: FeatureBlock = {
    kind: 'feature',
    title: heading.headingTitle || '',
    intents: [],
    stories: [],
    dependencies: [],
    uncertaintyMarkers: [],
    uncertaintyBlocks: [],
    range: mkLineRange(heading),
  };

  let lastLine = heading;

  while (!state.isAtEnd()) {
    state.skipBlanksAndSeparators();
    if (state.isAtEnd()) break;

    const cur = state.peek()!;

    if (cur.type === 'story-heading') {
      const story = parseStory(state);
      if (story) {
        feature.stories.push(story);
        lastLine = state.previous() || cur;
      }
      continue;
    }

    if (cur.type === 'intent') {
      const intent = parseIntentLine(state);
      if (intent) {
        feature.intents.push(intent);
        collectUncertaintyMarkers(intent, feature.uncertaintyMarkers);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'dependency') {
      const dep = parseDependencyLine(state);
      if (dep) {
        feature.dependencies.push(dep);
        collectUncertaintyMarkers(dep, feature.uncertaintyMarkers);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'uncertainty-open') {
      const block = parseUncertaintyBlock(state);
      if (block) {
        feature.uncertaintyBlocks.push(block);
        lastLine = cur;
      }
      continue;
    }

    // Skip other lines at feature level (text, unknown keywords)
    if (cur.type === 'text') {
      state.advance();
      lastLine = cur;
      continue;
    }

    // Unexpected content — skip with error
    if (cur.type === 'feature-heading') break; // another feature
    state.addError(`Unexpected ${cur.type} at feature level: "${cur.text.trim()}"`, cur);
    state.advance();
    lastLine = cur;
  }

  feature.range = {
    start: { line: heading.lineNumber, column: 1 },
    end: { line: lastLine.lineNumber, column: lastLine.text.length + 1 },
  };

  return feature;
}

// ── Parse Story ──────────────────────────────────
function parseStory(state: ParserState): StoryBlock | null {
  const heading = state.advance();
  const story: StoryBlock = {
    kind: 'story',
    title: heading.headingTitle || '',
    intents: [],
    behaviors: [],
    edges: [],
    tasks: [],
    dependencies: [],
    uncertaintyMarkers: [],
    uncertaintyBlocks: [],
    range: mkLineRange(heading),
  };

  let lastLine = heading;

  while (!state.isAtEnd()) {
    state.skipBlanksAndSeparators();
    if (state.isAtEnd()) break;

    const cur = state.peek()!;

    // Exit on next story or feature heading
    if (cur.type === 'feature-heading' || cur.type === 'story-heading') break;

    if (cur.type === 'task-heading') {
      const task = parseTask(state);
      if (task) {
        story.tasks.push(task);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'edge') {
      const edge = parseEdge(state);
      if (edge) {
        story.edges.push(edge);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'intent') {
      const intent = parseIntentLine(state);
      if (intent) {
        story.intents.push(intent);
        collectUncertaintyMarkers(intent, story.uncertaintyMarkers);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'behavior') {
      const behavior = parseBehaviorLine(state);
      if (behavior) {
        story.behaviors.push(behavior);
        collectUncertaintyMarkers(behavior, story.uncertaintyMarkers);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'dependency') {
      const dep = parseDependencyLine(state);
      if (dep) {
        story.dependencies.push(dep);
        collectUncertaintyMarkers(dep, story.uncertaintyMarkers);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'uncertainty-open') {
      const block = parseUncertaintyBlock(state);
      if (block) {
        story.uncertaintyBlocks.push(block);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'text') {
      state.advance();
      lastLine = cur;
      continue;
    }

    state.advance();
    lastLine = cur;
  }

  story.range = {
    start: { line: heading.lineNumber, column: 1 },
    end: { line: lastLine.lineNumber, column: lastLine.text.length + 1 },
  };

  return story;
}

// ── Parse Task ───────────────────────────────────
function parseTask(state: ParserState): TaskBlock | null {
  const heading = state.advance();
  const task: TaskBlock = {
    kind: 'task',
    title: heading.headingTitle || '',
    assigns: [],
    verifies: [],
    dependencies: [],
    uncertaintyMarkers: [],
    uncertaintyBlocks: [],
    range: mkLineRange(heading),
  };

  let lastLine = heading;

  while (!state.isAtEnd()) {
    state.skipBlanksAndSeparators();
    if (state.isAtEnd()) break;

    const cur = state.peek()!;

    // Exit on any heading or edge
    if (
      cur.type === 'feature-heading' ||
      cur.type === 'story-heading' ||
      cur.type === 'task-heading' ||
      cur.type === 'edge'
    ) break;

    if (cur.type === 'task-keyword') {
      if (cur.keyword === 'Assign') {
        const assign = parseAssignLine(state);
        if (assign) {
          task.assigns.push(assign);
          collectUncertaintyMarkers(assign, task.uncertaintyMarkers);
          lastLine = cur;
        }
      } else if (cur.keyword === 'Verify') {
        const verify = parseVerifyLine(state);
        if (verify) {
          task.verifies.push(verify);
          lastLine = cur;
        }
      } else {
        state.advance();
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'dependency') {
      const dep = parseDependencyLine(state);
      if (dep) {
        task.dependencies.push(dep);
        collectUncertaintyMarkers(dep, task.uncertaintyMarkers);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'uncertainty-open') {
      const block = parseUncertaintyBlock(state);
      if (block) {
        task.uncertaintyBlocks.push(block);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'text') {
      state.advance();
      lastLine = cur;
      continue;
    }

    // Unexpected — skip
    state.advance();
    lastLine = cur;
  }

  task.range = {
    start: { line: heading.lineNumber, column: 1 },
    end: { line: lastLine.lineNumber, column: lastLine.text.length + 1 },
  };

  return task;
}

// ── Parse Edge ───────────────────────────────────
function parseEdge(state: ParserState): EdgeBlock | null {
  const edgeLine = state.advance();
  // Edge value is quoted description
  let description = edgeLine.value || '';
  // Strip surrounding quotes
  if ((description.startsWith('"') && description.endsWith('"')) ||
      (description.startsWith('\u201C') && description.endsWith('\u201D'))) {
    description = description.slice(1, -1);
  }

  const edge: EdgeBlock = {
    kind: 'edge',
    description,
    behaviors: [],
    range: mkLineRange(edgeLine),
  };

  let lastLine = edgeLine;

  while (!state.isAtEnd()) {
    state.skipBlanksAndSeparators();
    if (state.isAtEnd()) break;

    const cur = state.peek()!;

    // Exit on non-indented behavior or any heading/edge
    if (
      cur.type === 'feature-heading' ||
      cur.type === 'story-heading' ||
      cur.type === 'task-heading' ||
      cur.type === 'edge' ||
      cur.type === 'dependency' ||
      cur.type === 'intent' ||
      cur.type === 'uncertainty-open'
    ) break;

    // Behavior lines (usually indented under Edge)
    if (cur.type === 'behavior') {
      const behavior = parseBehaviorLine(state);
      if (behavior) {
        edge.behaviors.push(behavior);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'text') {
      state.advance();
      lastLine = cur;
      continue;
    }

    break;
  }

  edge.range = {
    start: { line: edgeLine.lineNumber, column: 1 },
    end: { line: lastLine.lineNumber, column: lastLine.text.length + 1 },
  };

  return edge;
}

// ── Parse Uncertainty Block ──────────────────────
function parseUncertaintyBlock(state: ParserState): UncertaintyBlock | null {
  const openLine = state.advance();
  const block: UncertaintyBlock = {
    kind: 'uncertainty-block',
    type: openLine.keyword as any,
    message: openLine.value || '',
    children: [],
    range: mkLineRange(openLine),
  };

  let lastLine = openLine;

  while (!state.isAtEnd()) {
    const cur = state.peek()!;

    if (cur.type === 'uncertainty-close') {
      lastLine = state.advance();
      break;
    }

    if (cur.type === 'blank') {
      state.advance();
      continue;
    }

    if (cur.type === 'behavior') {
      const behavior = parseBehaviorLine(state);
      if (behavior) {
        block.children.push(behavior);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'intent') {
      const intent = parseIntentLine(state);
      if (intent) {
        block.children.push(intent);
        lastLine = cur;
      }
      continue;
    }

    if (cur.type === 'dependency') {
      const dep = parseDependencyLine(state);
      if (dep) {
        block.children.push(dep);
        lastLine = cur;
      }
      continue;
    }

    // text or other
    const textLine: TextLine = {
      kind: 'text',
      text: cur.text,
      range: mkLineRange(cur),
    };
    block.children.push(textLine);
    state.advance();
    lastLine = cur;
  }

  block.range = {
    start: { line: openLine.lineNumber, column: 1 },
    end: { line: lastLine.lineNumber, column: lastLine.text.length + 1 },
  };

  return block;
}

// ── Intent Line Parsers ──────────────────────────
function parseIntentLine(state: ParserState): IntentLine | null {
  const line = state.advance();
  const value = line.value || '';
  const uncertainties = parseUncertaintyMarkers(value, line.lineNumber);
  const uncertainty = uncertainties[0];
  const range = mkLineRange(line);

  switch (line.keyword) {
    case 'Goal':
      return { kind: 'goal', text: value, uncertainty, range } satisfies GoalLine;
    case 'Persona': {
      const actors = parseActorReferences(value, line.lineNumber);
      return { kind: 'persona', text: value, actor: actors[0], uncertainty, range } satisfies PersonaLine;
    }
    case 'Metric':
      return { kind: 'metric', text: value, uncertainty, range } satisfies MetricLine;
    default:
      return null;
  }
}

// ── Behavior Line Parsers ────────────────────────
function parseBehaviorLine(state: ParserState): BehaviorLine | null {
  const line = state.advance();
  const value = line.value || '';
  const uncertainties = parseUncertaintyMarkers(value, line.lineNumber);
  const uncertainty = uncertainties[0];
  const obligation = parseObligation(value, line.lineNumber);
  const range = mkLineRange(line);

  switch (line.keyword) {
    case 'Given':
      return { kind: 'given', text: value, uncertainty, range } satisfies GivenLine;
    case 'When':
      return { kind: 'when', text: value, uncertainty, range } satisfies WhenLine;
    case 'Then':
      return { kind: 'then', text: value, obligation, uncertainty, range } satisfies ThenLine;
    default:
      return null;
  }
}

// ── Dependency Line Parsers ──────────────────────
function parseDependencyLine(state: ParserState): DependencyLine | null {
  const line = state.advance();
  const value = line.value || '';
  const refs = parseReferences(value, line.lineNumber);
  const uncertainties = parseUncertaintyMarkers(value, line.lineNumber);
  const range = mkLineRange(line);

  switch (line.keyword) {
    case 'Needs':
      return {
        kind: 'needs',
        text: value,
        reference: refs[0],
        uncertainty: uncertainties[0],
        range,
      } satisfies NeedsLine;
    case 'Blocks':
      return {
        kind: 'blocks',
        text: value,
        reference: refs[0],
        uncertainty: uncertainties[0],
        range,
      } satisfies BlocksLine;
    default:
      return null;
  }
}

// ── Task Keyword Parsers ─────────────────────────
function parseAssignLine(state: ParserState): AssignLine | null {
  const line = state.advance();
  const value = line.value || '';
  const actors = parseActorReferences(value, line.lineNumber);
  const uncertainties = parseUncertaintyMarkers(value, line.lineNumber);
  return {
    kind: 'assign',
    text: value,
    actor: actors[0],
    uncertainty: uncertainties[0],
    range: mkLineRange(line),
  };
}

function parseVerifyLine(state: ParserState): VerifyLine | null {
  const line = state.advance();
  return {
    kind: 'verify',
    text: line.value || '',
    range: mkLineRange(line),
  };
}

// ── Helpers ──────────────────────────────────────
function collectUncertaintyMarkers(
  node: { uncertainty?: UncertaintyMarker },
  markers: UncertaintyMarker[],
): void {
  if (node.uncertainty) {
    markers.push(node.uncertainty);
  }
}

// ── Main Parse Function ──────────────────────────
export function parse(
  classifiedLines: ClassifiedLine[],
  frontmatter: Frontmatter | null,
  filePath?: string,
): PlanDocument {
  // Filter out lines that belong to frontmatter (already parsed separately)
  const state = new ParserState(classifiedLines);
  const feature = parseFeature(state);

  return {
    kind: 'document',
    filePath,
    frontmatter,
    feature,
    errors: state.errors,
    comments: state.comments,
  };
}
