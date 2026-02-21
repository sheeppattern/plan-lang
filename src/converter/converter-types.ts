import type { PlanDocument } from '../types/ast.js';

export type ConvertFormat = 'json' | 'markdown' | 'csv';

export interface Converter {
  format: ConvertFormat;
  convert(doc: PlanDocument, source: string): string;
}
