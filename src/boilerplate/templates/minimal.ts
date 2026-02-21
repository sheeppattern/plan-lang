import type { TemplateDefinition } from '../boilerplate-types.js';

export const minimalTemplate: TemplateDefinition = {
  name: 'minimal',
  description: 'Frontmatter and Feature heading only',
  content: `---
type: feature
id: {{id}}
status: draft
created: {{date}}
updated: {{date}}
---

# Feature: {{id}}

Goal: (describe the goal of this feature)
`,
};
