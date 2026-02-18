import fs from 'node:fs';
import { parsePlanFile } from '../parser/index.js';
import {
  collectUncertainty,
  formatUncertaintyReport,
} from '../reporters/uncertainty-reporter.js';

export interface UncertaintyCommandOptions {
  format?: string;
}

export function runUncertaintyCommand(files: string[], options: UncertaintyCommandOptions): void {
  const summaries = files.map(filePath => {
    const source = fs.readFileSync(filePath, 'utf-8');
    const doc = parsePlanFile(source, filePath);
    return collectUncertainty(doc);
  });

  if (options.format === 'json') {
    console.log(JSON.stringify(summaries, null, 2));
  } else {
    console.log(formatUncertaintyReport(summaries));
  }
}
