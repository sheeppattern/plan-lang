export type BuiltinTemplateName = 'default' | 'minimal' | 'full';

export interface TemplateVariables {
  id: string;
  date: string;
  owner: string;
}

export interface TemplateDefinition {
  name: string;
  description: string;
  content: string;
}

export interface GenerateOptions {
  template?: string;
  owner?: string;
}

export interface GenerateResult {
  content: string;
  templateName: string;
}
