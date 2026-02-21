import type { TemplateDefinition } from '../boilerplate-types.js';

export const defaultTemplate: TemplateDefinition = {
  name: 'default',
  description: 'Feature with Story and Task skeleton',
  content: `---
type: feature
id: {{id}}
status: draft
version: 0.1.0
owner: @{{owner}}
created: {{date}}
updated: {{date}}
---

# Feature: {{id}}

Goal: (describe the goal of this feature)
Persona: @(target user or actor)
Metric: (measurable success criterion)

## Story: (story title)

Goal: (what this story achieves)
Given: (precondition)
When: (user action or trigger)
Then: (expected outcome) [MUST]

### Task: (task title)

Assign: @(assignee)
Verify: (verification criteria)
`,
};
