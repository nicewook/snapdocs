import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
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


/**
 * 모든 프로젝트에 문서 생성 시스템 설치 (언어 무관)
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
  const docsDir = path.join(projectRoot, 'docs');
  const generatorDir = path.join(docsDir, 'generator');

  // 2. 기존 문서 시스템 감지
  const existingSystem = await fs.pathExists(generatorDir);
  let currentConfig: any = {};

  if (existingSystem) {
    console.log(chalk.blue('📚 기존 문서 시스템 발견'));
    
    // 기존 설정 로드
    const configPath = path.join(generatorDir, 'config.json');
    if (await fs.pathExists(configPath)) {
      try {
        currentConfig = await fs.readJson(configPath);
        console.log(chalk.green(`✅ 기존 설정 로드 완료 (테마: ${currentConfig.theme || 'default'})`));
      } catch (error) {
        console.log(chalk.yellow('⚠️  기존 설정 읽기 실패, 기본값 사용'));
      }
    }

    // 백업 옵션 제공 (backup 플래그가 없고 force가 아닌 경우)
    if (!backup && !force) {
      const shouldBackup = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'backup',
          message: '기존 설정을 백업하시겠습니까?',
          default: true
        }
      ]);
      
      if (shouldBackup.backup) {
        const backupDir = path.join(projectRoot, `docs-backup-${Date.now()}`);
        await fs.copy(generatorDir, backupDir);
        console.log(chalk.yellow(`📦 백업 생성: ${path.relative(projectRoot, backupDir)}`));
      }
    } else if (backup) {
      const backupDir = path.join(projectRoot, `docs-backup-${Date.now()}`);
      await fs.copy(generatorDir, backupDir);
      console.log(chalk.yellow(`📦 백업 생성: ${path.relative(projectRoot, backupDir)}`));
    }
  }
  
  // 동적으로 테마 선택지 가져오기
  const themeChoices = fileManager.getThemeChoices();

  // 3. package.json 확인/생성
  const isNewPackageJson = !(await packageModifier.exists());
  
  if (isNewPackageJson) {
    console.log(chalk.blue('📦 package.json이 없습니다. 문서용 package.json을 생성합니다.'));
    console.log(chalk.gray('   (비 Node.js 프로젝트를 위한 최소 설정)'));
    
    await packageModifier.createMinimal();
  } else {
    console.log(chalk.green('📦 기존 package.json을 활용합니다.'));
  }

  // 4. 설정 프롬프트 (force 모드가 아닌 경우)
  let config: SetupConfig = { 
    theme: currentConfig.theme || theme, 
    title: currentConfig.title || 'Project Documentation', 
    subtitle: currentConfig.subtitle || 'Project Documentation' 
  };
  
  if (!force) {
    if (existingSystem) {
      console.log(chalk.blue('\n📝 기존 설정 업데이트 (기존값 유지하려면 엔터를 누르세요)'));
    }
    
    const answers = await inquirer.prompt<SetupConfig>([
      {
        type: 'input',
        name: 'title',
        message: existingSystem ? 
          `문서 제목을 입력하세요: (${currentConfig.title || 'Project Documentation'})` :
          '문서 제목을 입력하세요:',
        default: currentConfig.title || 'Project Documentation'
      },
      {
        type: 'input',
        name: 'subtitle',
        message: existingSystem ?
          `문서 부제목을 입력하세요: (${currentConfig.subtitle || 'Project Documentation'})` :
          '문서 부제목을 입력하세요:',
        default: currentConfig.subtitle || 'Project Documentation'
      },
      {
        type: 'list',
        name: 'theme',
        message: '기본 테마를 선택하세요:',
        choices: themeChoices,
        default: currentConfig.theme || theme
      }
    ]);
    
    config = { ...config, ...answers };
  }

  // 5. 충돌 확인 및 해결 (새 설치인 경우에만)
  if (!existingSystem) {
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
  }

  // 6. 템플릿 파일 복사/업데이트
  console.log(chalk.blue(existingSystem ? '🔄 템플릿 파일 업데이트 중...' : '📋 템플릿 파일 복사 중...'));
  
  await fs.ensureDir(docsDir);
  await fileManager.copyTemplate('generator', generatorDir, config);
  await fileManager.copyTemplate('CLAUDE.md', path.join(docsDir, 'CLAUDE.md'), config);

  // 7. package.json 스크립트 추가 (기존 프로젝트의 경우에만)
  if (!isNewPackageJson) {
    console.log(chalk.blue('📦 package.json 스크립트 추가 중...'));
    
    const scriptsPath = path.join(fileManager['templatesPath'], 'package-scripts.json');
    const scripts = await fs.readJson(scriptsPath);
    
    await packageModifier.addScripts(scripts);
  } else {
    console.log(chalk.green('✅ 문서 스크립트가 이미 포함되어 있습니다'));
  }

  // 8. 의존성 확인 및 설치
  if (install) {
    if (isNewPackageJson) {
      // 새로 생성된 package.json의 경우 바로 설치
      console.log(chalk.blue('📦 문서 의존성 설치 중...'));
      
      try {
        await execAsync('npm install', { cwd: projectRoot });
        console.log(chalk.green('✅ 의존성 설치 완료'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  npm install 실패. 수동으로 실행해주세요:'));
        console.log(chalk.yellow(`   cd ${projectRoot} && npm install`));
      }
    } else {
      // 기존 Node.js 프로젝트의 경우 의존성 확인
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
  if (existingSystem) {
    console.log(chalk.green.bold('\n🎉 문서 생성 시스템 업데이트 완료!\n'));
  } else if (isNewPackageJson) {
    console.log(chalk.green.bold('\n🎉 문서 생성 시스템 설치 완료!\n'));
    console.log(chalk.blue('💡 비 Node.js 프로젝트에 npm을 통한 문서 시스템이 추가되었습니다.'));
  } else {
    console.log(chalk.green.bold('\n🎉 문서 생성 시스템 설치 완료!\n'));
  }
  
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