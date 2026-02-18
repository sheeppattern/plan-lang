#!/usr/bin/env npx tsx
import { Command } from 'commander';
import { runParseCommand } from '../src/cli/parse-command.js';
import { runLintCommand } from '../src/cli/lint-command.js';
import { runLintProjectCommand } from '../src/cli/lint-project-command.js';
import { runUncertaintyCommand } from '../src/cli/uncertainty-command.js';

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

program.parse();
