import fs from 'node:fs';
import { parsePlanFile } from '../parser/index.js';
import { convert } from '../converter/index.js';
import type { ConvertFormat } from '../converter/converter-types.js';

export interface ConvertCommandOptions {
  to: string;
  output?: string;
}

export function runConvertCommand(file: string, options: ConvertCommandOptions): void {
  const format = options.to as ConvertFormat;
  const validFormats = ['json', 'markdown', 'csv'];

  if (!validFormats.includes(format)) {
    console.error(`Unsupported format: ${format}. Supported: ${validFormats.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const source = fs.readFileSync(file, 'utf-8');
  const doc = parsePlanFile(source, file);
  const output = convert(doc, source, format);

  if (options.output) {
    fs.writeFileSync(options.output, output, 'utf-8');
    console.log(`Converted to ${format}: ${options.output}`);
  } else {
    process.stdout.write(output);
  }
}
