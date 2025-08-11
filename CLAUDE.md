# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnapDocs is a universal CLI tool that installs documentation systems in any programming language project. It generates beautiful HTML documentation from markdown files with theme support, working seamlessly across Go, Java, Python, Node.js, and other language ecosystems.

## Development Commands

### Build and Development
```bash
npm run build           # Compile TypeScript to JavaScript
npm run clean          # Remove dist/ directory
npm run dev            # Build and run the CLI tool
npm run typecheck      # TypeScript type checking without compilation
npm run prepare        # Runs before npm publish (runs build)
npm run prepublishOnly # Clean and build before publishing
```

### Testing
```bash
npm test               # No tests configured yet
```

### CLI Usage
```bash
# Use the built CLI directly
node dist/bin/snapdocs.js

# Or install and use globally
npm install -g .
snapdocs --help

# Universal setup command works in any project
snapdocs setup
```

## Architecture Overview

SnapDocs follows a modular TypeScript architecture designed for universal language support while maintaining the familiar npm workflow for documentation generation.

### Core Structure
- **`bin/`** - CLI entry point (`snapdocs.ts`)
- **`lib/`** - Core library code
  - **`commands/`** - Command implementation (setup only)
  - **`utils/`** - Utility classes (FileManager, PackageModifier, ConflictResolver)
  - **`index.ts`** - Main library exports
- **`templates/`** - Template files copied to user projects
- **`dist/`** - Compiled JavaScript output

### Universal Command Architecture

The single `setup` command handles all scenarios through intelligent auto-detection:

1. **Project Type Detection** - Automatically detects existing package.json or creates minimal one
2. **Language Agnostic Installation** - Works with any programming language project
3. **Conflict Resolution** - Handles existing documentation systems gracefully
4. **Backup Integration** - Protects existing configurations
5. **npm Workflow** - Ensures `npm run docs` works universally

### Key Features

#### Smart Package.json Handling
- **Node.js Projects**: Utilizes existing package.json and adds documentation scripts
- **Non-Node.js Projects**: Creates minimal package.json for documentation dependencies only
- **Dependency Management**: Installs only required documentation dependencies

#### Universal Language Support
```bash
# Works in any project type:
cd my-go-project/     && snapdocs setup  # ✅ Go
cd my-java-app/       && snapdocs setup  # ✅ Java  
cd my-python-project/ && snapdocs setup  # ✅ Python
cd my-node-app/       && snapdocs setup  # ✅ Node.js
```

#### Existing System Detection
- Automatically detects existing documentation systems
- Preserves user configurations and customizations
- Offers backup options before making changes
- Updates system files while maintaining settings

### Key Utility Classes
- **`FileManager`** (`lib/utils/file-manager.ts`) - Template copying and file operations
- **`PackageModifier`** (`lib/utils/package-modifier.ts`) - package.json manipulation with createMinimal() for non-Node.js projects
- **`ConflictResolver`** (`lib/utils/conflict-resolver.ts`) - Handle file conflicts during installation

### Template System
The `templates/` directory contains:
- **`generator/`** - Documentation generator scripts and themes
- **`CLAUDE.md`** - Documentation standards template for user projects
- **`package-scripts.json`** - Scripts to add to user's package.json

### Language and Internationalization
The codebase uses Korean for user-facing messages in command implementations, while maintaining English for technical interfaces, comments, and documentation.

## Development Workflow

### Setup Command Flow
1. **Environment Detection** - Finds project root and analyzes existing structure
2. **Package.json Strategy** - Creates minimal or enhances existing package.json
3. **Documentation System Installation** - Copies templates and configures system
4. **Dependency Management** - Installs required npm packages for documentation
5. **Integration** - Adds npm scripts and generates initial documentation

### User Experience Design
- **Single Command** - `snapdocs setup` works universally
- **Smart Defaults** - Intelligent detection reduces user input
- **Safe Operations** - Backup options and conflict resolution
- **Clear Feedback** - Progress indication and helpful error messages

## Development Notes

### TypeScript Configuration
- Target: ES2020, CommonJS modules
- Strict type checking enabled
- Compiled output goes to `dist/`
- Source maps and declarations generated

### Dependencies Architecture
- **Production**: CLI frameworks (commander, inquirer), file operations (fs-extra), markdown processing (marked, gray-matter), file watching (chokidar)
- **Development**: TypeScript toolchain, ESLint, Prettier

### Binary Distribution
The package provides CLI command:
- `snapdocs` - Universal setup command

### Universal Installation Strategy
- **Detection**: Automatically identifies project type and existing systems
- **Adaptation**: Creates appropriate package.json (minimal vs enhanced)
- **Integration**: Ensures `npm run docs` works regardless of project language
- **Preservation**: Maintains existing configurations and customizations

### File Management Strategy
- Templates are embedded in the package under `templates/`
- User projects get a `docs/generator/` directory with documentation tools
- Configuration is managed through `docs/generator/config.json`
- Themes are CSS files in `docs/generator/styles/`
- Works across all programming languages while maintaining npm-based workflow

## Testing and Validation

When testing changes:
1. Test in Node.js project (should enhance existing package.json)
2. Test in non-Node.js project (should create minimal package.json)
3. Test with existing documentation system (should preserve configs)
4. Verify `npm run docs` works in all scenarios
5. Check backup functionality and conflict resolution