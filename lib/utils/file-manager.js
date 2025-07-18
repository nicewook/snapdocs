const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Handlebars = require('handlebars');

class FileManager {
  constructor(options = {}) {
    this.options = options;
    this.templatesPath = path.join(__dirname, '../../templates');
  }

  /**
   * 프로젝트 루트 디렉터리 찾기
   */
  findProjectRoot(startDir = process.cwd()) {
    let currentDir = startDir;
    while (currentDir !== path.dirname(currentDir)) {
      if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
      }
      currentDir = path.dirname(currentDir);
    }
    throw new Error('프로젝트 루트를 찾을 수 없습니다 (package.json 파일이 없음)');
  }

  /**
   * 템플릿 파일 존재 여부 확인
   */
  async templateExists(templateName) {
    const templatePath = path.join(this.templatesPath, templateName);
    return await fs.pathExists(templatePath);
  }

  /**
   * 파일 백업 생성
   */
  async createBackup(filePath) {
    if (await fs.pathExists(filePath)) {
      const backupPath = `${filePath}.backup.${Date.now()}`;
      await fs.copy(filePath, backupPath);
      console.log(chalk.yellow(`📦 백업 생성: ${path.basename(backupPath)}`));
      return backupPath;
    }
    return null;
  }

  /**
   * 디렉터리 복사 (템플릿 처리 포함)
   */
  async copyTemplate(templateName, targetPath, variables = {}) {
    const templatePath = path.join(this.templatesPath, templateName);
    
    if (!(await fs.pathExists(templatePath))) {
      throw new Error(`템플릿을 찾을 수 없습니다: ${templateName}`);
    }

    const stats = await fs.stat(templatePath);
    
    if (stats.isDirectory()) {
      // 디렉터리 복사
      await this.copyDirectory(templatePath, targetPath, variables);
    } else {
      // 파일 복사
      await this.copyFile(templatePath, targetPath, variables);
    }
  }

  /**
   * 디렉터리 재귀 복사
   */
  async copyDirectory(sourceDir, targetDir, variables = {}) {
    await fs.ensureDir(targetDir);
    
    const items = await fs.readdir(sourceDir);
    
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      
      const stats = await fs.stat(sourcePath);
      
      if (stats.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath, variables);
      } else {
        await this.copyFile(sourcePath, targetPath, variables);
      }
    }
  }

  /**
   * 파일 복사 (템플릿 처리)
   */
  async copyFile(sourcePath, targetPath, variables = {}) {
    const content = await fs.readFile(sourcePath, 'utf8');
    
    // Handlebars 템플릿 처리
    const template = Handlebars.compile(content);
    const processedContent = template(variables);
    
    // 타겟 디렉터리 생성
    await fs.ensureDir(path.dirname(targetPath));
    
    // 파일 쓰기
    await fs.writeFile(targetPath, processedContent, 'utf8');
    
    console.log(chalk.green(`📄 파일 생성: ${path.relative(process.cwd(), targetPath)}`));
  }

  /**
   * 파일/디렉터리 충돌 확인
   */
  async checkConflicts(targetPath) {
    const conflicts = [];
    
    if (await fs.pathExists(targetPath)) {
      const stats = await fs.stat(targetPath);
      conflicts.push({
        path: targetPath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime
      });
    }

    return conflicts;
  }

  /**
   * 안전한 파일 복사 (충돌 처리)
   */
  async safeCopy(sourcePath, targetPath, options = {}) {
    const { force = false, backup = false } = options;
    
    if (await fs.pathExists(targetPath)) {
      if (backup) {
        await this.createBackup(targetPath);
      }
      
      if (!force) {
        throw new Error(`파일이 이미 존재합니다: ${targetPath}`);
      }
    }
    
    await fs.copy(sourcePath, targetPath, { overwrite: force });
    console.log(chalk.green(`📄 파일 복사: ${path.relative(process.cwd(), targetPath)}`));
  }

  /**
   * 파일 패턴 필터링
   */
  shouldExclude(filePath, excludePatterns = []) {
    const fileName = path.basename(filePath);
    
    return excludePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern;
    });
  }

  /**
   * 의존성 정보 확인
   */
  async checkDependencies() {
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!(await fs.pathExists(packagePath))) {
      return null;
    }

    const packageJson = await fs.readJson(packagePath);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    const requiredDeps = ['chokidar', 'marked', 'gray-matter'];
    const missing = requiredDeps.filter(dep => !dependencies[dep]);

    return {
      hasPackageJson: true,
      dependencies,
      missing,
      needsInstall: missing.length > 0
    };
  }
}

module.exports = FileManager;