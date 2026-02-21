import type { TemplateDefinition } from '../boilerplate-types.js';

export const fullTemplate: TemplateDefinition = {
  name: 'full',
  description: 'Full template with Edge, dependencies, and uncertainty examples',
  content: `---
type: feature
id: {{id}}
status: draft
version: 0.1.0
owner: @{{owner}}
priority: normal
tags: []
created: {{date}}
updated: {{date}}
---

# Feature: {{id}}

Goal: (describe the goal of this feature)
Persona: @(target user or actor)
Metric: (measurable success criterion)

Needs: [dependency-id]
Blocks: [blocked-id]

## Story: (story title)

Goal: (what this story achieves)
Given: (precondition)
When: (user action or trigger)
Then: (expected outcome) [MUST]
Then: (recommended outcome) [SHOULD]
Then: (optional outcome) [MAY]

Edge: "(edge case description)"
  When: (edge condition)
  Then: (expected handling) [MUST]

### Task: (task title)

Assign: @(assignee)
Verify: (verification criteria)

?pending "(describe what's undecided)"
(details about the pending item)
?end
`,
};
