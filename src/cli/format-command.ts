import fs from 'node:fs';
import { formatPlanSource } from '../formatter/index.js';

export interface FormatCommandOptions {
  write?: boolean;
  check?: boolean;
}

export function runFormatCommand(files: string[], options: FormatCommandOptions): void {
  let needsFormatting = false;

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf-8');
    const result = formatPlanSource(source, filePath);

    if (options.check) {
      if (result.changed) {
        console.log(`${filePath}: needs formatting`);
        needsFormatting = true;
      }
    } else if (options.write) {
      if (result.changed) {
        fs.writeFileSync(filePath, result.formatted, 'utf-8');
        console.log(`${filePath}: formatted`);
      } else {
        console.log(`${filePath}: already formatted`);
      }
    } else {
      // Default: output to stdout
      process.stdout.write(result.formatted);
    }
  }

  if (options.check && needsFormatting) {
    process.exitCode = 1;
  }
}
