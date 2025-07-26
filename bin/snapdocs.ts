#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Import commands
import { setupCommand } from '../lib/commands/setup';

// Get package.json for version
const packageJsonPath = join(dirname(__filename), '../../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// Configure CLI
program
  .name('snapdocs')
  .description('Generate beautiful HTML documentation from markdown files')
  .version(packageJson.version);


// Setup command - Install docs system to any project
program
  .command('setup')
  .description('Install markdown documentation system to any project')
  .option('-t, --theme <theme>', 'Default theme (default, dark, github)', 'default')
  .option('-f, --force', 'Overwrite existing files')
  .option('--no-install', 'Skip npm install')
  .option('--backup', 'Create backup of existing files')
  .action(async (options) => {
    try {
      console.log(chalk.blue('📚 Installing markdown documentation system...'));
      await setupCommand(options);
      console.log(chalk.green('✅ Documentation system installed successfully!'));
    } catch (error: any) {
      console.error(chalk.red('❌ Error during installation:'), error.message);
      process.exit(1);
    }
  });


// Help command override
program
  .command('help')
  .description('Show help information')
  .action(() => {
    console.log(chalk.bold.blue('\n📚 Markdown Documentation Generator\n'));
    console.log('Generate beautiful HTML documentation from markdown files with theme support.\n');
    
    console.log(chalk.bold('Usage:'));
    console.log('  npx snapdocs <command> [options]\n');
    
    console.log(chalk.bold('Commands:'));
    console.log('  setup    Install documentation system to any project');
    console.log('  help     Show this help message\n');
    
    console.log(chalk.bold('Options:'));
    console.log('  -t, --theme <theme>   Theme to use (default, dark, github)');
    console.log('  -f, --force          Overwrite existing files');
    console.log('  --no-install         Skip npm install');
    console.log('  --backup             Create backup of existing files');
    console.log('  -h, --help           Show help');
    console.log('  -V, --version        Show version\n');
    
    console.log(chalk.bold('Examples:'));
    console.log('  npx snapdocs setup                # Install in any project');
    console.log('  npx snapdocs setup --backup       # Install/update with backup');
    console.log('  npx snapdocs setup --theme dark   # Install with dark theme');
    console.log('  npx snapdocs setup --force        # Force overwrite existing files\n');
    
    console.log(chalk.gray('For more information, visit: https://github.com/nicewook/snapdocs'));
  });

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('💡 Run "snapdocs help" for available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}