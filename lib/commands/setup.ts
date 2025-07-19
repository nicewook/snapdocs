import * as fs from 'fs-extra';
import * as path from 'path';
import * as chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { promisify } from 'util';

import { FileManager } from '../utils/file-manager';
import { PackageModifier } from '../utils/package-modifier';
import { ConflictResolver } from '../utils/conflict-resolver';

const execAsync = promisify(exec);

export interface SetupCommandOptions {
  theme?: 'default' | 'dark' | 'github';
  force?: boolean;
  backup?: boolean;
  install?: boolean;
}

interface SetupConfig {
  theme: 'default' | 'dark' | 'github';
  title: string;
  subtitle: string;
}

interface CreatePackageAnswer {
  create: boolean;
}

/**
 * 기존 프로젝트에 문서 생성 시스템 설정
 */
export async function setupCommand(options: SetupCommandOptions = {}): Promise<void> {
  const {
    theme = 'default',
    force = false,
    backup = false,
    install = true
  } = options;

  console.log(chalk.blue.bold('\n📚 Markdown Documentation Generator Setup\n'));

  const fileManager = new FileManager();
  const conflictResolver = new ConflictResolver({ force, backup });
  
  // 1. 프로젝트 루트 확인
  const projectRoot = fileManager.findProjectRoot();
  console.log(chalk.green(`📁 프로젝트 루트: ${projectRoot}`));

  const packageModifier = new PackageModifier(projectRoot);

  // 2. package.json 확인
  if (!(await packageModifier.exists())) {
    const createPackage = await inquirer.prompt<CreatePackageAnswer>([
      {
        type: 'confirm',
        name: 'create',
        message: 'package.json 파일이 없습니다. 새로 생성하시겠습니까?',
        default: true
      }
    ]);

    if (createPackage.create) {
      await packageModifier.createBasic({
        name: path.basename(projectRoot),
        version: '1.0.0',
        description: 'Project with markdown documentation system'
      });
    } else {
      throw new Error('package.json이 필요합니다');
    }
  }

  // 3. 설정 프롬프트 (force 모드가 아닌 경우)
  let config: SetupConfig = { theme, title: 'Project Documentation', subtitle: 'Project Documentation' };
  
  if (!force) {
    const answers = await inquirer.prompt<SetupConfig>([
      {
        type: 'input',
        name: 'title',
        message: '문서 제목을 입력하세요:',
        default: 'Project Documentation'
      },
      {
        type: 'input',
        name: 'subtitle',
        message: '문서 부제목을 입력하세요:',
        default: 'Project Documentation'
      },
      {
        type: 'list',
        name: 'theme',
        message: '기본 테마를 선택하세요:',
        choices: [
          { name: '기본 테마 (밝은 색상)', value: 'default' },
          { name: '다크 테마 (어두운 색상)', value: 'dark' },
          { name: 'GitHub 테마 (GitHub 스타일)', value: 'github' }
        ],
        default: theme
      }
    ]);
    
    config = { ...config, ...answers };
  }

  // 4. 디렉터리 구조 생성
  const docsDir = path.join(projectRoot, 'docs');
  const generatorDir = path.join(docsDir, 'generator');

  // 5. 충돌 확인 및 해결
  const conflicts = await conflictResolver.detectConflicts(generatorDir);
  
  if (conflicts.length > 0) {
    console.log(chalk.yellow(`⚠️  ${conflicts.length}개의 충돌이 발견되었습니다`));
    
    const resolution = await conflictResolver.resolveConflicts(generatorDir);
    const proceed = await conflictResolver.executeResolution(resolution, '', generatorDir);
    
    if (!proceed) {
      console.log(chalk.red('설치가 취소되었습니다'));
      return;
    }
  }

  // 6. 템플릿 파일 복사
  console.log(chalk.blue('📋 템플릿 파일 복사 중...'));
  
  await fs.ensureDir(docsDir);
  await fileManager.copyTemplate('generator', generatorDir, config);
  await fileManager.copyTemplate('CLAUDE.md', path.join(docsDir, 'CLAUDE.md'), config);

  // 7. package.json 스크립트 추가
  console.log(chalk.blue('📦 package.json 스크립트 추가 중...'));
  
  const scriptsPath = path.join(fileManager['templatesPath'], 'package-scripts.json');
  const scripts = await fs.readJson(scriptsPath);
  
  await packageModifier.addScripts(scripts);

  // 8. 의존성 확인 및 설치
  if (install) {
    console.log(chalk.blue('📦 의존성 확인 중...'));
    
    const requiredDeps: Record<string, string> = {
      'chokidar': '^4.0.3',
      'gray-matter': '^4.0.3',
      'marked': '^16.0.0'
    };

    const packageData = await packageModifier.read();
    const existingDeps = { ...packageData.dependencies, ...packageData.devDependencies };
    
    const missingDeps = Object.keys(requiredDeps).filter(dep => !existingDeps[dep]);

    if (missingDeps.length > 0) {
      console.log(chalk.yellow('📦 누락된 의존성을 설치합니다:'));
      missingDeps.forEach(dep => {
        console.log(chalk.yellow(`   - ${dep}: ${requiredDeps[dep]}`));
      });

      await packageModifier.addDependencies(
        Object.fromEntries(missingDeps.map(dep => [dep, requiredDeps[dep]])),
        true // devDependencies에 추가
      );

      try {
        console.log(chalk.blue('📦 npm install 실행 중...'));
        await execAsync('npm install', { cwd: projectRoot });
        console.log(chalk.green('✅ 의존성 설치 완료'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  npm install 실패. 수동으로 실행해주세요:'));
        console.log(chalk.yellow(`   cd ${projectRoot} && npm install`));
      }
    } else {
      console.log(chalk.green('✅ 모든 의존성이 이미 설치되어 있습니다'));
    }
  }

  // 9. 초기 문서 생성
  console.log(chalk.blue('📄 초기 문서 생성 중...'));
  
  try {
    await execAsync('npm run docs', { cwd: projectRoot });
    console.log(chalk.green('✅ 초기 문서 생성 완료'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  문서 생성 실패. 수동으로 실행해주세요:'));
    console.log(chalk.yellow('   npm run docs'));
  }

  // 10. 완료 메시지
  console.log(chalk.green.bold('\n🎉 문서 생성 시스템 설정 완료!\n'));
  
  console.log(chalk.blue('📋 다음 단계:'));
  console.log('1. 문서 생성: npm run docs');
  console.log('2. 실시간 감시: npm run docs:watch');
  console.log('3. 다른 테마: npm run docs:dark 또는 npm run docs:github');
  console.log('4. VS Code Live Server로 index.html 열기');
  
  console.log(chalk.blue('\n📁 생성된 파일들:'));
  console.log(`   - ${path.relative(projectRoot, generatorDir)}/`);
  console.log(`   - ${path.relative(projectRoot, docsDir)}/CLAUDE.md`);
  console.log(`   - index.html (생성됨)`);
  
  console.log(chalk.blue('\n🔧 설정 정보:'));
  console.log(`   - 테마: ${config.theme}`);
  console.log(`   - 제목: ${config.title}`);
  console.log(`   - docs 디렉터리: ${path.relative(projectRoot, docsDir)}`);
}

export default setupCommand;