# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
mdg --help             # Short alias
```

## Architecture Overview

SnapDocs is a CLI tool that generates HTML documentation from markdown files with theme support. The codebase follows a modular TypeScript architecture:

### Core Structure
- **`bin/`** - CLI entry point (`snapdocs.ts`)
- **`lib/`** - Core library code
  - **`commands/`** - Command implementations (init, setup, update)
  - **`utils/`** - Utility classes (FileManager, PackageModifier, ConflictResolver)
  - **`index.ts`** - Main library exports
- **`templates/`** - Template files copied to user projects
- **`dist/`** - Compiled JavaScript output

### Command Architecture
Each command (`init`, `setup`, `update`) follows a consistent pattern:
1. **Options Interface** - TypeScript interface for command options
2. **Interactive Prompts** - Using `inquirer` for user input
3. **File Operations** - Managed through utility classes
4. **Execution Flow** - Error handling with colored output via `chalk`

### Key Utility Classes
- **`FileManager`** (`lib/utils/file-manager.ts`) - Template copying and file operations
- **`PackageModifier`** (`lib/utils/package-modifier.ts`) - package.json manipulation
- **`ConflictResolver`** (`lib/utils/conflict-resolver.ts`) - Handle file conflicts during setup

### Template System
The `templates/` directory contains:
- **`generator/`** - Documentation generator scripts and themes
- **`CLAUDE.md`** - Documentation standards template
- **`package-scripts.json`** - Scripts to add to user's package.json

### Language and Internationalization
The codebase uses Korean for user-facing messages in command implementations, while maintaining English for technical interfaces, comments, and documentation.

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
The package provides two CLI aliases:
- `snapdocs` - Main command
- `mdg` - Short alias for "markdown docs generator"

### File Management Strategy
- Templates are embedded in the package under `templates/`
- User projects get a `docs/generator/` directory with documentation tools
- Configuration is managed through `docs/generator/config.json`
- Themes are CSS files in `docs/generator/styles/`