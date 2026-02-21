#!/usr/bin/env npx tsx
import { Command } from 'commander';
import { runParseCommand } from '../src/cli/parse-command.js';
import { runLintCommand } from '../src/cli/lint-command.js';
import { runLintProjectCommand } from '../src/cli/lint-project-command.js';
import { runUncertaintyCommand } from '../src/cli/uncertainty-command.js';
import { runFormatCommand } from '../src/cli/format-command.js';
import { runConvertCommand } from '../src/cli/convert-command.js';
import { runInitCommand } from '../src/cli/init-command.js';
import { runTemplatesCommand } from '../src/cli/templates-command.js';

const program = new Command();

program
  .name('plan')
  .description('Parser, linter, and CLI for the .plan specification language')
  .version('0.1.0');

program
  .command('parse <file>')
  .description('Parse a .plan file and display the AST')
  .option('--format <format>', 'Output format: text or json', 'text')
  .action((file, options) => {
    runParseCommand(file, options);
  });

program
  .command('lint <files...>')
  .description('Lint one or more .plan files (single-file rules only)')
  .option('--format <format>', 'Output format: text or json', 'text')
  .option('--quiet', 'Only output if there are diagnostics')
  .option('--disable <rules...>', 'Disable specific rules (e.g., PLAN-005 PLAN-006)')
  .option('--severity <level>', 'Minimum severity to report: error, warning, or info', 'info')
  .option('--fix', 'Automatically fix fixable issues')
  .action((files, options) => {
    runLintCommand(files, options);
  });

program
  .command('lint-project <dir>')
  .description('Lint all .plan files in a directory (includes cross-file rules)')
  .option('--format <format>', 'Output format: text or json', 'text')
  .option('--quiet', 'Only output if there are diagnostics')
  .option('--disable <rules...>', 'Disable specific rules')
  .option('--severity <level>', 'Minimum severity to report', 'info')
  .option('--fix', 'Automatically fix fixable issues')
  .action((dir, options) => {
    runLintProjectCommand(dir, options);
  });

program
  .command('uncertainty <files...>')
  .description('Generate an uncertainty report for .plan files')
  .option('--format <format>', 'Output format: text or json', 'text')
  .action((files, options) => {
    runUncertaintyCommand(files, options);
  });

program
  .command('format <files...>')
  .description('Format .plan files (frontmatter key order, whitespace normalization)')
  .option('--write', 'Write formatted output back to files')
  .option('--check', 'Check if files need formatting (exit code 1 if so)')
  .action((files, options) => {
    runFormatCommand(files, options);
  });

program
  .command('convert <file>')
  .description('Convert a .plan file to another format')
  .requiredOption('--to <format>', 'Target format: json, markdown, or csv')
  .option('--output <file>', 'Output file path (default: stdout)')
  .action((file, options) => {
    runConvertCommand(file, options);
  });

program
  .command('init <id>')
  .description('Create a new .plan file from a template')
  .option('--template <name>', 'Template to use: default, minimal, full, or custom', 'default')
  .option('--owner <name>', 'Owner name for the @owner field')
  .option('--force', 'Overwrite existing file')
  .action((id, options) => {
    runInitCommand(id, options);
  });

program
  .command('templates')
  .description('List available boilerplate templates')
  .action(() => {
    runTemplatesCommand();
  });

program.parse();
