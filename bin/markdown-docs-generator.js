#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');

// Import commands
const initCommand = require('../lib/commands/init');
const setupCommand = require('../lib/commands/setup');
const updateCommand = require('../lib/commands/update');

// Configure CLI
program
  .name('markdown-docs-generator')
  .description('Generate beautiful HTML documentation from markdown files')
  .version(version);

// Init command - Create new project with docs system
program
  .command('init')
  .description('Initialize a new project with markdown documentation system')
  .option('-t, --theme <theme>', 'Default theme (default, dark, github)', 'default')
  .option('-f, --force', 'Overwrite existing files')
  .option('--no-install', 'Skip npm install')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🚀 Initializing markdown documentation system...'));
      await initCommand(options);
      console.log(chalk.green('✅ Documentation system initialized successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Error during initialization:'), error.message);
      process.exit(1);
    }
  });

// Setup command - Add docs system to existing project
program
  .command('setup')
  .description('Add markdown documentation system to existing project')
  .option('-t, --theme <theme>', 'Default theme (default, dark, github)', 'default')
  .option('-f, --force', 'Overwrite existing files')
  .option('--no-install', 'Skip npm install')
  .option('--backup', 'Create backup of existing files')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔧 Setting up markdown documentation system...'));
      await setupCommand(options);
      console.log(chalk.green('✅ Documentation system setup complete!'));
    } catch (error) {
      console.error(chalk.red('❌ Error during setup:'), error.message);
      process.exit(1);
    }
  });

// Update command - Update existing docs system
program
  .command('update')
  .description('Update existing markdown documentation system')
  .option('-t, --theme <theme>', 'Update to specific theme')
  .option('-f, --force', 'Force update without confirmation')
  .option('--backup', 'Create backup of existing files')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔄 Updating markdown documentation system...'));
      await updateCommand(options);
      console.log(chalk.green('✅ Documentation system updated successfully!'));
    } catch (error) {
      console.error(chalk.red('❌ Error during update:'), error.message);
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
    console.log('  npx markdown-docs-generator <command> [options]\n');
    
    console.log(chalk.bold('Commands:'));
    console.log('  init     Initialize new project with docs system');
    console.log('  setup    Add docs system to existing project');
    console.log('  update   Update existing docs system');
    console.log('  help     Show this help message\n');
    
    console.log(chalk.bold('Options:'));
    console.log('  -t, --theme <theme>   Theme to use (default, dark, github)');
    console.log('  -f, --force          Overwrite existing files');
    console.log('  --no-install         Skip npm install');
    console.log('  --backup             Create backup of existing files');
    console.log('  -h, --help           Show help');
    console.log('  -V, --version        Show version\n');
    
    console.log(chalk.bold('Examples:'));
    console.log('  npx markdown-docs-generator setup');
    console.log('  npx markdown-docs-generator setup --theme dark');
    console.log('  npx markdown-docs-generator init --force');
    console.log('  npx markdown-docs-generator update --backup\n');
    
    console.log(chalk.gray('For more information, visit: https://github.com/USERNAME/markdown-docs-generator'));
  });

// Handle unknown commands
program.on('command:*', (operands) => {
  console.error(chalk.red(`❌ Unknown command: ${operands[0]}`));
  console.log(chalk.yellow('💡 Run "markdown-docs-generator help" for available commands'));
  process.exit(1);
});

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}