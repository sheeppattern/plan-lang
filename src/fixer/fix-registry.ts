import type { FixProvider } from './fix-types.js';
import { plan001Fix } from './fixes/plan-001-fix.js';
import { plan002Fix } from './fixes/plan-002-fix.js';
import { plan003Fix } from './fixes/plan-003-fix.js';
import { plan006Fix } from './fixes/plan-006-fix.js';
import { plan010Fix } from './fixes/plan-010-fix.js';

const registry = new Map<string, FixProvider>();

function register(provider: FixProvider) {
  registry.set(provider.ruleId, provider);
}

register(plan001Fix);
register(plan002Fix);
register(plan003Fix);
register(plan006Fix);
register(plan010Fix);

export function getFixProvider(ruleId: string): FixProvider | undefined {
  return registry.get(ruleId);
}

export function getFixableRuleIds(): string[] {
  return [...registry.keys()];
}
