import type { LintRule, LintContext } from '../rule.js';
import type { Diagnostic } from '../../types/ast.js';
import { parseActorReferences } from '../../parser/inline-parser.js';

/** PLAN-013: Persona declared but never referenced */
export const plan013UnusedPersona: LintRule = {
  id: 'PLAN-013',
  severity: 'warning',
  description: 'Persona:로 선언된 액터가 문서 내에서 참조되지 않음',
  check({ document }: LintContext): Diagnostic[] {
    const feature = document.feature;
    if (!feature) return [];

    // Collect declared persona actors
    const personas: { name: string; range: typeof feature.range }[] = [];
    for (const intent of feature.intents) {
      if (intent.kind === 'persona' && intent.actor) {
        personas.push({ name: intent.actor.name, range: intent.range });
      }
    }

    if (personas.length === 0) return [];

    // Collect all @actor references throughout the document
    const referencedActors = new Set<string>();

    function collectActorRefs(text: string) {
      const refs = parseActorReferences(text, 1);
      for (const ref of refs) {
        referencedActors.add(ref.name);
      }
    }

    // Scan stories, tasks, behaviors, edges
    for (const story of feature.stories) {
      for (const b of story.behaviors) {
        collectActorRefs(b.text);
      }
      for (const edge of story.edges) {
        for (const b of edge.behaviors) {
          collectActorRefs(b.text);
        }
      }
      for (const task of story.tasks) {
        for (const a of task.assigns) {
          if (a.actor) referencedActors.add(a.actor.name);
        }
        for (const dep of task.dependencies) {
          collectActorRefs(dep.text);
        }
      }
      for (const ub of story.uncertaintyBlocks) {
        for (const child of ub.children) {
          collectActorRefs(child.text);
        }
      }
      for (const dep of story.dependencies) {
        collectActorRefs(dep.text);
      }
    }

    // Feature-level dependencies and uncertainty blocks
    for (const dep of feature.dependencies) {
      collectActorRefs(dep.text);
    }
    for (const ub of feature.uncertaintyBlocks) {
      for (const child of ub.children) {
        collectActorRefs(child.text);
      }
    }

    // Report personas that are declared but not referenced
    return personas
      .filter(p => !referencedActors.has(p.name))
      .map(p => ({
        ruleId: 'PLAN-013',
        severity: 'warning' as const,
        message: `Persona @${p.name}이(가) 선언되었지만 문서 내에서 참조되지 않습니다`,
        range: p.range,
        filePath: document.filePath,
      }));
  },
};
