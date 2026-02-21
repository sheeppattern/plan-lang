import type { PlanDocument } from '../types/ast.js';
import type { ConvertFormat, Converter } from './converter-types.js';
import { jsonConverter } from './converters/json-converter.js';
import { markdownConverter } from './converters/markdown-converter.js';
import { csvConverter } from './converters/csv-converter.js';

export type { ConvertFormat, Converter } from './converter-types.js';

const converters = new Map<ConvertFormat, Converter>();
converters.set('json', jsonConverter);
converters.set('markdown', markdownConverter);
converters.set('csv', csvConverter);

/**
 * Convert a PlanDocument to the specified format.
 */
export function convert(doc: PlanDocument, source: string, format: ConvertFormat): string {
  const converter = converters.get(format);
  if (!converter) {
    throw new Error(`Unsupported format: ${format}. Supported: ${getSupportedFormats().join(', ')}`);
  }
  return converter.convert(doc, source);
}

/**
 * Get list of supported conversion formats.
 */
export function getSupportedFormats(): ConvertFormat[] {
  return [...converters.keys()];
}
