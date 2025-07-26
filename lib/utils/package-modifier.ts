import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  keywords?: string[];
  author?: string;
  license?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: any;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  packageData: PackageJson;
}

export interface BasicPackageOptions {
  name?: string;
  version?: string;
  description?: string;
  main?: string;
  author?: string;
  license?: string;
}

export class PackageModifier {
  private projectRoot: string;
  private packagePath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.packagePath = path.join(projectRoot, 'package.json');
  }

  /**
   * package.json 파일 존재 여부 확인
   */
  async exists(): Promise<boolean> {
    return await fs.pathExists(this.packagePath);
  }

  /**
   * package.json 읽기
   */
  async read(): Promise<PackageJson> {
    if (!(await this.exists())) {
      throw new Error('package.json 파일이 없습니다');
    }
    
    return await fs.readJson(this.packagePath);
  }

  /**
   * package.json 쓰기
   */
  async write(packageData: PackageJson): Promise<void> {
    await fs.writeJson(this.packagePath, packageData, { spaces: 2 });
    console.log(chalk.green('📦 package.json 업데이트 완료'));
  }

  /**
   * 스크립트 추가
   */
  async addScripts(newScripts: Record<string, string>): Promise<void> {
    const packageData = await this.read();
    
    if (!packageData.scripts) {
      packageData.scripts = {};
    }

    // 기존 스크립트 백업
    const existingScripts = Object.keys(packageData.scripts)
      .filter(key => key.startsWith('docs'));
    
    if (existingScripts.length > 0) {
      console.log(chalk.yellow('⚠️  기존 docs 스크립트 발견:'));
      existingScripts.forEach(script => {
        console.log(chalk.yellow(`   - ${script}: ${packageData.scripts![script]}`));
      });
    }

    // 새로운 스크립트 추가
    Object.assign(packageData.scripts, newScripts);
    
    await this.write(packageData);
    
    console.log(chalk.green('✅ 스크립트 추가 완료:'));
    Object.entries(newScripts).forEach(([key, value]) => {
      console.log(chalk.green(`   - ${key}: ${value}`));
    });
  }

  /**
   * 의존성 추가
   */
  async addDependencies(dependencies: Record<string, string>, isDev: boolean = false): Promise<void> {
    const packageData = await this.read();
    
    const targetKey = isDev ? 'devDependencies' : 'dependencies';
    
    if (!packageData[targetKey]) {
      packageData[targetKey] = {};
    }

    // 기존 의존성 확인
    const existing = Object.keys(packageData[targetKey]!)
      .filter(dep => dependencies[dep]);
    
    if (existing.length > 0) {
      console.log(chalk.yellow('⚠️  기존 의존성 발견:'));
      existing.forEach(dep => {
        console.log(chalk.yellow(`   - ${dep}: ${packageData[targetKey]![dep]}`));
      });
    }

    // 새로운 의존성 추가
    Object.assign(packageData[targetKey]!, dependencies);
    
    await this.write(packageData);
    
    console.log(chalk.green(`✅ ${isDev ? '개발' : '일반'} 의존성 추가 완료:`));
    Object.entries(dependencies).forEach(([key, value]) => {
      console.log(chalk.green(`   - ${key}: ${value}`));
    });
  }

  /**
   * 메타데이터 추가
   */
  async addMetadata(metadata: Record<string, any>): Promise<void> {
    const packageData = await this.read();
    
    // 기존 메타데이터 보존하면서 새로운 것 추가
    Object.assign(packageData, metadata);
    
    await this.write(packageData);
    
    console.log(chalk.green('✅ 메타데이터 추가 완료'));
  }

  /**
   * 스크립트 제거
   */
  async removeScripts(scriptNames: string[]): Promise<void> {
    const packageData = await this.read();
    
    if (!packageData.scripts) {
      return;
    }

    const removed: string[] = [];
    scriptNames.forEach(scriptName => {
      if (packageData.scripts![scriptName]) {
        delete packageData.scripts![scriptName];
        removed.push(scriptName);
      }
    });

    if (removed.length > 0) {
      await this.write(packageData);
      console.log(chalk.green(`✅ 스크립트 제거 완료: ${removed.join(', ')}`));
    }
  }

  /**
   * 의존성 제거
   */
  async removeDependencies(dependencyNames: string[], isDev: boolean = false): Promise<void> {
    const packageData = await this.read();
    
    const targetKey = isDev ? 'devDependencies' : 'dependencies';
    
    if (!packageData[targetKey]) {
      return;
    }

    const removed: string[] = [];
    dependencyNames.forEach(depName => {
      if (packageData[targetKey]![depName]) {
        delete packageData[targetKey]![depName];
        removed.push(depName);
      }
    });

    if (removed.length > 0) {
      await this.write(packageData);
      console.log(chalk.green(`✅ 의존성 제거 완료: ${removed.join(', ')}`));
    }
  }

  /**
   * 설정 검증
   */
  async validate(): Promise<ValidationResult> {
    const packageData = await this.read();
    
    const issues: string[] = [];
    
    // 기본 필드 확인
    if (!packageData.name) {
      issues.push('name 필드가 없습니다');
    }
    
    if (!packageData.version) {
      issues.push('version 필드가 없습니다');
    }

    // 스크립트 확인
    if (packageData.scripts) {
      const docsScripts = Object.keys(packageData.scripts)
        .filter(key => key.startsWith('docs'));
      
      if (docsScripts.length === 0) {
        issues.push('docs 관련 스크립트가 없습니다');
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      packageData
    };
  }

  /**
   * 백업 생성
   */
  async createBackup(): Promise<string> {
    const backupPath = `${this.packagePath}.backup.${Date.now()}`;
    await fs.copy(this.packagePath, backupPath);
    console.log(chalk.yellow(`📦 package.json 백업: ${path.basename(backupPath)}`));
    return backupPath;
  }

  /**
   * 기본 package.json 생성
   */
  async createBasic(options: BasicPackageOptions = {}): Promise<PackageJson> {
    const {
      name = path.basename(this.projectRoot),
      version = '1.0.0',
      description = '',
      main = 'index.js',
      author = '',
      license = 'ISC'
    } = options;

    const packageData: PackageJson = {
      name,
      version,
      description,
      main,
      scripts: {
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author,
      license
    };

    await this.write(packageData);
    console.log(chalk.green('✅ 기본 package.json 생성 완료'));
    
    return packageData;
  }

  /**
   * 문서용 최소 package.json 생성 (비 Node.js 프로젝트용)
   */
  async createMinimal(): Promise<PackageJson> {
    const packageData: PackageJson = {
      name: "docs-system",
      version: "1.0.0",
      private: true,
      description: "Documentation system for this project",
      scripts: {
        docs: "node docs/generator/docs-generator.js",
        "docs:watch": "node docs/generator/docs-generator.js --watch",
        "docs:dark": "node docs/generator/docs-generator.js --theme dark",
        "docs:github": "node docs/generator/docs-generator.js --theme github"
      },
      devDependencies: {
        "chokidar": "^4.0.3",
        "gray-matter": "^4.0.3",
        "marked": "^16.0.0"
      }
    };

    await this.write(packageData);
    console.log(chalk.green('✅ 문서용 package.json 생성 완료'));
    
    return packageData;
  }
}

export default PackageModifier;