import type { Converter } from '../converter-types.js';
import type {
  PlanDocument,
  FeatureBlock,
  StoryBlock,
  TaskBlock,
  EdgeBlock,
  IntentLine,
  BehaviorLine,
  DependencyLine,
} from '../../types/ast.js';

interface CleanFeature {
  title: string;
  goals: string[];
  personas: { text: string; actor?: string }[];
  metrics: string[];
  dependencies: { kind: string; text: string; target?: string }[];
  stories: CleanStory[];
}

interface CleanStory {
  title: string;
  goals: string[];
  behaviors: { kind: string; text: string; obligation?: string }[];
  edges: { description: string; behaviors: { kind: string; text: string; obligation?: string }[] }[];
  tasks: CleanTask[];
}

interface CleanTask {
  title: string;
  assignees: string[];
  verifications: string[];
  dependencies: { kind: string; text: string; target?: string }[];
}

function mapDependency(dep: DependencyLine) {
  const result: { kind: string; text: string; target?: string } = {
    kind: dep.kind,
    text: dep.text,
  };
  if (dep.reference && dep.reference.kind === 'plan-reference') {
    result.target = dep.reference.id + (dep.reference.fragment ? '#' + dep.reference.fragment : '');
  }
  return result;
}

function mapBehavior(b: BehaviorLine) {
  const result: { kind: string; text: string; obligation?: string } = {
    kind: b.kind,
    text: b.text,
  };
  if (b.kind === 'then' && b.obligation) {
    result.obligation = b.obligation.level;
  }
  return result;
}

function mapTask(task: TaskBlock): CleanTask {
  return {
    title: task.title,
    assignees: task.assigns.map(a => a.actor?.name ?? a.text),
    verifications: task.verifies.map(v => v.text),
    dependencies: task.dependencies.map(mapDependency),
  };
}

function mapEdge(edge: EdgeBlock) {
  return {
    description: edge.description,
    behaviors: edge.behaviors.map(mapBehavior),
  };
}

function mapStory(story: StoryBlock): CleanStory {
  return {
    title: story.title,
    goals: story.intents.filter(i => i.kind === 'goal').map(i => i.text),
    behaviors: story.behaviors.map(mapBehavior),
    edges: story.edges.map(mapEdge),
    tasks: story.tasks.map(mapTask),
  };
}

function mapFeature(feature: FeatureBlock): CleanFeature {
  return {
    title: feature.title,
    goals: feature.intents.filter(i => i.kind === 'goal').map(i => i.text),
    personas: feature.intents
      .filter(i => i.kind === 'persona')
      .map(i => ({
        text: i.text,
        actor: i.kind === 'persona' ? i.actor?.name : undefined,
      })),
    metrics: feature.intents.filter(i => i.kind === 'metric').map(i => i.text),
    dependencies: feature.dependencies.map(mapDependency),
    stories: feature.stories.map(mapStory),
  };
}

export const jsonConverter: Converter = {
  format: 'json',
  convert(doc: PlanDocument): string {
    const output: Record<string, unknown> = {};

    if (doc.frontmatter) {
      output.metadata = { ...doc.frontmatter };
    }

    if (doc.feature) {
      output.feature = mapFeature(doc.feature);
    }

    return JSON.stringify(output, null, 2);
  },
};
