import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import * as Handlebars from 'handlebars';

export interface FileManagerOptions {
  [key: string]: any;
}

export interface ConflictInfo {
  path: string;
  isDirectory: boolean;
  size: number;
  mtime: Date;
}

export interface SafeCopyOptions {
  force?: boolean;
  backup?: boolean;
}

export interface DependencyInfo {
  hasPackageJson: boolean;
  dependencies: Record<string, string>;
  missing: string[];
  needsInstall: boolean;
}

export class FileManager {
  private options: FileManagerOptions;
  private templatesPath: string;

  constructor(options: FileManagerOptions = {}) {
    this.options = options;
    // dist/lib/utils에서 templates로 가려면 ../../../templates
    this.templatesPath = path.join(__dirname, '../../../templates');
  }

  /**
   * 프로젝트 루트 디렉터리 찾기
   */
  findProjectRoot(startDir: string = process.cwd()): string {
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
  async templateExists(templateName: string): Promise<boolean> {
    const templatePath = path.join(this.templatesPath, templateName);
    return await fs.pathExists(templatePath);
  }

  /**
   * 파일 백업 생성
   */
  async createBackup(filePath: string): Promise<string | null> {
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
  async copyTemplate(templateName: string, targetPath: string, variables: Record<string, any> = {}): Promise<void> {
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
  private async copyDirectory(sourceDir: string, targetDir: string, variables: Record<string, any> = {}): Promise<void> {
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
  private async copyFile(sourcePath: string, targetPath: string, variables: Record<string, any> = {}): Promise<void> {
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
  async checkConflicts(targetPath: string): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];
    
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
  async safeCopy(sourcePath: string, targetPath: string, options: SafeCopyOptions = {}): Promise<void> {
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
  shouldExclude(filePath: string, excludePatterns: string[] = []): boolean {
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
  async checkDependencies(): Promise<DependencyInfo | null> {
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!(await fs.pathExists(packagePath))) {
      return null;
    }

    const packageJson = await fs.readJson(packagePath);
    const dependencies: Record<string, string> = {
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

  /**
   * 사용 가능한 테마들을 동적으로 스캔
   */
  getAvailableThemes(): string[] {
    const stylesDir = path.join(this.templatesPath, 'generator', 'styles');
    if (fs.existsSync(stylesDir)) {
      return fs.readdirSync(stylesDir)
        .filter(file => file.endsWith('.css'))
        .map(file => file.replace('.css', ''))
        .sort();
    }
    return ['default']; // fallback
  }

  /**
   * 테마명을 사용자 친화적으로 포맷팅
   */
  formatThemeName(themeName: string): string {
    const nameMap: Record<string, string> = {
      'default': '기본 테마 (밝은 색상)',
      'dark': '다크 테마 (어두운 색상)',
      'github': 'GitHub 테마 (GitHub 스타일)'
    };
    
    // 매핑된 이름이 있으면 사용, 없으면 첫 글자 대문자화
    return nameMap[themeName] || (themeName.charAt(0).toUpperCase() + themeName.slice(1) + ' 테마');
  }

  /**
   * 테마 선택지 배열 생성
   */
  getThemeChoices(): Array<{ name: string; value: string }> {
    const themes = this.getAvailableThemes();
    return themes.map(theme => ({
      name: this.formatThemeName(theme),
      value: theme
    }));
  }
}

export default FileManager;