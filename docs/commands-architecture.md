# SnapDocs Commands Architecture Explained

## 📋 Overview

The `lib/commands` directory contains three core command implementations that form the heart of SnapDocs' CLI functionality. Each command follows a consistent architectural pattern while serving distinct purposes in the documentation system lifecycle.

```
lib/commands/
├── init.ts      # New project initialization
├── setup.ts     # Add docs to existing project  
├── update.ts    # Update existing doc system
```

## 🏗️ Architectural Pattern

### Common Design Philosophy

All three commands follow a **Template Method Pattern** with these consistent phases:

```typescript
// 1. Validation & Environment Check
// 2. User Input Collection (via inquirer)
// 3. Configuration Processing
// 4. File Operations (copy templates, modify files)
// 5. Dependency Management
// 6. System Integration (npm scripts, git)
// 7. Final Verification & User Guidance
```

### Shared Dependencies & Utilities

```typescript
// Common External Dependencies
import * as fs from 'fs-extra';           // File system operations
import * as path from 'path';            // Path handling
import chalk from 'chalk';               // Colored console output
import inquirer from 'inquirer';         // Interactive prompts
import { exec } from 'child_process';    // Shell command execution
import { promisify } from 'util';        // Promise conversion

// Internal Utility Classes
import { FileManager } from '../utils/file-manager';
import { PackageModifier } from '../utils/package-modifier';
import { ConflictResolver } from '../utils/conflict-resolver';
```

## 🚀 Command Deep Dive

### 1. Init Command (`init.ts`)

**Purpose**: Creates a brand new project with documentation system from scratch

**Key Features**:
- ✅ **Complete Project Setup**: Creates package.json, directory structure, basic files
- ✅ **Interactive Configuration**: Collects project name, description, theme, author, license
- ✅ **Git Integration**: Optional Git repository initialization with initial commit
- ✅ **Dependency Installation**: Automatically installs required npm packages
- ✅ **Documentation Generation**: Creates initial HTML documentation

**Workflow**:
```typescript
export async function initCommand(options: InitCommandOptions = {}): Promise<void> {
  // 1. Directory validation (warn if files exist)
  const hasFiles = files.length > 0;
  if (hasFiles && !force) {
    // Interactive confirmation prompt
  }

  // 2. Interactive project configuration
  const config = await inquirer.prompt<ProjectConfig>([
    { name: 'name', message: '프로젝트 이름:' },
    { name: 'description', message: '프로젝트 설명:' },
    { name: 'theme', type: 'list', choices: themeChoices }
    // ... more configuration options
  ]);

  // 3. File system operations
  await packageModifier.createBasic(config);
  await fs.ensureDir('src');
  await fs.ensureDir('docs');
  
  // 4. Template copying with config injection
  await fileManager.copyTemplate('generator', 'docs/generator', config);

  // 5. Dependency management
  await packageModifier.addDependencies(dependencies, true);
  await execAsync('npm install');
  
  // 6. Initial documentation generation
  await execAsync('npm run docs');
  
  // 7. Optional Git initialization
  if (initGit.git) {
    await execAsync('git init && git add . && git commit -m "Initial commit"');
  }
}
```

**Strengths**:
- **User-Friendly**: Clear prompts and progress indication
- **Resilient**: Handles existing files gracefully with confirmation
- **Complete**: Sets up entire project ecosystem in one command
- **Configurable**: Supports themes and customization options

---

### 2. Setup Command (`setup.ts`)

**Purpose**: Adds documentation system to an existing project

**Key Features**:
- ✅ **Non-Destructive**: Preserves existing project structure
- ✅ **Conflict Resolution**: Detects and handles file conflicts intelligently
- ✅ **Selective Installation**: Only installs missing dependencies
- ✅ **Package.json Integration**: Adds scripts without overwriting existing ones
- ✅ **Backup Support**: Optional backup creation before modifications

**Workflow**:
```typescript
export async function setupCommand(options: SetupCommandOptions = {}): Promise<void> {
  // 1. Project validation
  const projectRoot = fileManager.findProjectRoot();
  
  // 2. Package.json handling
  if (!(await packageModifier.exists())) {
    const createPackage = await inquirer.prompt(/* create package.json? */);
    if (createPackage.create) {
      await packageModifier.createBasic(/* minimal config */);
    }
  }

  // 3. Conflict detection and resolution
  const conflicts = await conflictResolver.detectConflicts(generatorDir);
  if (conflicts.length > 0) {
    const resolution = await conflictResolver.resolveConflicts(generatorDir);
    await conflictResolver.executeResolution(resolution);
  }

  // 4. Selective dependency installation
  const missingDeps = Object.keys(requiredDeps).filter(dep => !existingDeps[dep]);
  if (missingDeps.length > 0) {
    await packageModifier.addDependencies(missingDepsObj, true);
    await execAsync('npm install');
  }
}
```

**Strengths**:
- **Smart Integration**: Respects existing project configuration
- **Conflict Aware**: Handles file collisions gracefully
- **Selective Updates**: Only changes what's necessary
- **Backup Safety**: Protects existing work with backup options

---

### 3. Update Command (`update.ts`)

**Purpose**: Updates existing documentation system to latest version

**Key Features**:
- ✅ **Configuration Preservation**: Maintains user customizations
- ✅ **Selective Updates**: Choose what to update (files vs config)
- ✅ **Backup Integration**: Creates timestamped backups
- ✅ **Migration Support**: Handles schema changes gracefully
- ✅ **Dependency Synchronization**: Updates to latest compatible versions

**Workflow**:
```typescript
export async function updateCommand(options: UpdateCommandOptions = {}): Promise<void> {
  // 1. System validation
  if (!(await fs.pathExists(generatorDir))) {
    console.log('❌ 기존 문서 생성 시스템을 찾을 수 없습니다');
    return; // Graceful exit with guidance
  }

  // 2. Configuration preservation
  let currentConfig: any = {};
  if (await fs.pathExists(configPath)) {
    currentConfig = await fs.readJson(configPath);
  }

  // 3. Selective update prompts
  const answers = await inquirer.prompt<UpdateAnswers>([
    { name: 'updateFiles', message: '시스템 파일을 업데이트하시겠습니까?' },
    { name: 'updateConfig', message: '설정을 수정하시겠습니까?' }
  ]);

  // 4. Backup creation (if requested)
  if (backup) {
    const backupDir = `docs-backup-${Date.now()}`;
    await fs.copy(generatorDir, backupDir);
  }

  // 5. File system updates with validation
  await fileManager.copyTemplate('generator', generatorDir, updateConfig);
  
  // 6. Package.json script synchronization
  const hasDocsScripts = ['docs', 'docs:watch', 'docs:dark'].some(/* check existence */);
  if (!hasDocsScripts) {
    await packageModifier.addScripts(scripts);
  }
}
```

**Strengths**:
- **Non-Destructive**: Preserves user configuration and customizations  
- **Granular Control**: Users choose what aspects to update
- **Safety First**: Automatic backup creation prevents data loss
- **Migration Ready**: Handles version compatibility issues

## 🛠️ Shared Utility Integration

### FileManager Integration
```typescript
const fileManager = new FileManager();

// Dynamic theme discovery
const themeChoices = fileManager.getThemeChoices();

// Template copying with variable substitution
await fileManager.copyTemplate('generator', targetDir, config);
```

### PackageModifier Integration
```typescript
const packageModifier = new PackageModifier(projectRoot);

// Package.json operations
await packageModifier.createBasic(config);
await packageModifier.addScripts(scripts);
await packageModifier.addDependencies(deps, isDev);
```

### ConflictResolver Integration
```typescript
const conflictResolver = new ConflictResolver({ force, backup });

// Intelligent conflict handling
const conflicts = await conflictResolver.detectConflicts(targetDir);
const resolution = await conflictResolver.resolveConflicts(targetDir);
await conflictResolver.executeResolution(resolution);
```

## 🔄 User Experience Design

### Interactive Prompt Strategy

All commands use **Progressive Disclosure** - presenting information and choices at the right time:

```typescript
// 1. Safety prompts first
if (hasFiles && !force) {
  const proceed = await inquirer.prompt([{
    type: 'confirm',
    message: '계속 진행하시겠습니까?',
    default: false  // Safe default
  }]);
}

// 2. Configuration collection
const config = await inquirer.prompt([
  { name: 'name', default: intelligentDefault },     // Smart defaults
  { name: 'theme', type: 'list', choices: dynamic } // Dynamic choices
]);

// 3. Optional features last
const initGit = await inquirer.prompt([{
  type: 'confirm',
  message: 'Git 저장소를 초기화하시겠습니까?',
  default: true  // Commonly desired
}]);
```

### Visual Feedback System

Consistent use of **chalk** for status communication:

```typescript
// Progress indication
console.log(chalk.blue('📦 package.json 생성 중...'));

// Success confirmation  
console.log(chalk.green('✅ 의존성 설치 완료'));

// Warning messages
console.log(chalk.yellow('⚠️  npm install 실패. 수동으로 실행해주세요:'));

// Error handling
console.log(chalk.red('❌ Error:'), error.message);
```

### Error Handling Strategy

**Graceful Degradation** - operations continue even if non-critical steps fail:

```typescript
try {
  await execAsync('npm install', { cwd: currentDir });
  console.log(chalk.green('✅ 의존성 설치 완료'));
} catch (error) {
  // Don't fail completely - provide manual recovery
  console.log(chalk.yellow('⚠️  npm install 실패. 수동으로 실행해주세요:'));
  console.log(chalk.yellow('   npm install'));
}
```

## 📊 Performance Characteristics

### Execution Phases & Timing

| Command | Typical Duration | Heavy Operations |
|---------|------------------|------------------|
| **init** | 30-60s | `npm install`, file creation, git init |
| **setup** | 15-30s | conflict resolution, selective installs |
| **update** | 10-20s | file copying, dependency checks |

### Resource Usage Patterns

```typescript
// Memory efficient file operations
await fs.copy(source, dest);        // Streaming copy
await fs.readJson(path);           // JSON parsing
await fs.writeFile(path, content); // Async writes

// Process spawning for npm operations
const execAsync = promisify(exec); // Promise-based execution
await execAsync('npm install');   // External process
```

## 🎯 Design Patterns Implemented

### 1. **Template Method Pattern**
Each command follows the same high-level algorithm but implements steps differently.

### 2. **Strategy Pattern** 
Different conflict resolution strategies (force, backup, prompt) based on options.

### 3. **Builder Pattern**
Configuration objects are built incrementally through user interaction.

### 4. **Command Pattern**
Each file exports a command function that encapsulates the operation.

### 5. **Dependency Injection**
Utility classes are injected and configured per command needs.

## 💡 Key Insights

### Strengths
- **Consistent UX**: All commands follow similar interaction patterns
- **Resilient Design**: Graceful handling of edge cases and failures  
- **Modular Architecture**: Clean separation of concerns with utility classes
- **User-Centric**: Prioritizes safety and clear feedback over speed
- **Configurable**: Supports various themes and options flexibly

### Areas for Enhancement
- **Async Optimization**: Could parallelize independent operations
- **Progress Indicators**: Long-running operations could show progress
- **Rollback Capability**: Failed operations could auto-rollback changes
- **Configuration Validation**: More robust input validation and sanitization
- **Testing Coverage**: Command logic could benefit from comprehensive tests

The commands architecture demonstrates solid software engineering principles with a strong focus on user experience and operational reliability. Each command serves its distinct purpose while maintaining architectural consistency and code reuse through the shared utility layer.