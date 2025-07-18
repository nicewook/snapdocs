const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { exec } = require('child_process');
const { promisify } = require('util');

const FileManager = require('../utils/file-manager');
const PackageModifier = require('../utils/package-modifier');
const ConflictResolver = require('../utils/conflict-resolver');

const execAsync = promisify(exec);

/**
 * 기존 문서 생성 시스템 업데이트
 */
async function updateCommand(options = {}) {
  const {
    theme,
    force = false,
    backup = false
  } = options;

  console.log(chalk.blue.bold('\n🔄 문서 생성 시스템 업데이트\n'));

  const fileManager = new FileManager();
  const conflictResolver = new ConflictResolver({ force, backup });
  
  // 1. 프로젝트 루트 확인
  const projectRoot = fileManager.findProjectRoot();
  console.log(chalk.green(`📁 프로젝트 루트: ${projectRoot}`));

  const packageModifier = new PackageModifier(projectRoot);
  const docsDir = path.join(projectRoot, 'docs');
  const generatorDir = path.join(docsDir, 'generator');

  // 2. 기존 시스템 확인
  if (!(await fs.pathExists(generatorDir))) {
    console.log(chalk.red('❌ 기존 문서 생성 시스템을 찾을 수 없습니다'));
    console.log(chalk.yellow('💡 "setup" 명령을 사용하여 새로 설치하세요'));
    return;
  }

  // 3. 기존 설정 읽기
  const configPath = path.join(generatorDir, 'config.json');
  let currentConfig = {};
  
  if (await fs.pathExists(configPath)) {
    try {
      currentConfig = await fs.readJson(configPath);
      console.log(chalk.green('✅ 기존 설정 발견'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  기존 설정 읽기 실패, 기본값 사용'));
    }
  }

  // 4. 업데이트 옵션 확인
  let updateConfig = { ...currentConfig };
  
  if (!force) {
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'updateFiles',
        message: '시스템 파일을 최신 버전으로 업데이트하시겠습니까?',
        default: true
      },
      {
        type: 'confirm',
        name: 'updateConfig',
        message: '설정을 수정하시겠습니까?',
        default: false
      }
    ]);

    if (answers.updateConfig) {
      const configAnswers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: '문서 제목:',
          default: currentConfig.title || 'Project Documentation'
        },
        {
          type: 'input',
          name: 'subtitle',
          message: '문서 부제목:',
          default: currentConfig.subtitle || 'Project Documentation'
        },
        {
          type: 'list',
          name: 'theme',
          message: '기본 테마:',
          choices: [
            { name: '기본 테마 (밝은 색상)', value: 'default' },
            { name: '다크 테마 (어두운 색상)', value: 'dark' },
            { name: 'GitHub 테마 (GitHub 스타일)', value: 'github' }
          ],
          default: currentConfig.theme || 'default'
        }
      ]);
      
      updateConfig = { ...updateConfig, ...configAnswers };
    }

    if (theme) {
      updateConfig.theme = theme;
    }

    if (!answers.updateFiles) {
      console.log(chalk.yellow('파일 업데이트를 건너뜁니다'));
      
      // 설정만 업데이트
      if (answers.updateConfig || theme) {
        console.log(chalk.blue('📝 설정 업데이트 중...'));
        await fileManager.copyTemplate('generator/config.json', configPath, updateConfig);
        console.log(chalk.green('✅ 설정 업데이트 완료'));
      }
      
      return;
    }
  } else {
    if (theme) {
      updateConfig.theme = theme;
    }
  }

  // 5. 백업 생성
  if (backup) {
    console.log(chalk.blue('📦 백업 생성 중...'));
    
    const backupDir = path.join(projectRoot, `docs-backup-${Date.now()}`);
    await fs.copy(generatorDir, backupDir);
    console.log(chalk.yellow(`📦 백업 생성: ${path.relative(projectRoot, backupDir)}`));
  }

  // 6. 시스템 파일 업데이트
  console.log(chalk.blue('🔄 시스템 파일 업데이트 중...'));
  
  // 기존 파일 정보 수집
  const existingFiles = {
    generator: await fs.pathExists(path.join(generatorDir, 'docs-generator.js')),
    config: await fs.pathExists(configPath),
    styles: await fs.pathExists(path.join(generatorDir, 'styles')),
    claude: await fs.pathExists(path.join(docsDir, 'CLAUDE.md'))
  };

  console.log(chalk.blue('📋 기존 파일 상태:'));
  Object.entries(existingFiles).forEach(([key, exists]) => {
    const status = exists ? chalk.green('✅') : chalk.red('❌');
    console.log(`   - ${key}: ${status}`);
  });

  // 7. 템플릿 파일 업데이트
  try {
    await fileManager.copyTemplate('generator', generatorDir, updateConfig);
    
    if (!existingFiles.claude) {
      await fileManager.copyTemplate('CLAUDE.md', path.join(docsDir, 'CLAUDE.md'), updateConfig);
    }
    
    console.log(chalk.green('✅ 시스템 파일 업데이트 완료'));
  } catch (error) {
    console.error(chalk.red('❌ 파일 업데이트 실패:'), error.message);
    return;
  }

  // 8. package.json 스크립트 확인 및 업데이트
  console.log(chalk.blue('📦 package.json 스크립트 확인 중...'));
  
  const packageData = await packageModifier.read();
  const hasDocsScripts = packageData.scripts && 
    ['docs', 'docs:watch', 'docs:dark', 'docs:github'].some(script => 
      packageData.scripts[script]);

  if (!hasDocsScripts) {
    console.log(chalk.yellow('⚠️  문서 스크립트가 없습니다. 추가합니다.'));
    
    const scriptsPath = path.join(fileManager.templatesPath, 'package-scripts.json');
    const scripts = await fs.readJson(scriptsPath);
    
    await packageModifier.addScripts(scripts);
  } else {
    console.log(chalk.green('✅ 문서 스크립트가 이미 존재합니다'));
  }

  // 9. 의존성 확인
  console.log(chalk.blue('📦 의존성 확인 중...'));
  
  const requiredDeps = {
    'chokidar': '^4.0.3',
    'gray-matter': '^4.0.3',
    'marked': '^16.0.0'
  };

  const existingDeps = { ...packageData.dependencies, ...packageData.devDependencies };
  const missingDeps = Object.keys(requiredDeps).filter(dep => !existingDeps[dep]);

  if (missingDeps.length > 0) {
    console.log(chalk.yellow('📦 누락된 의존성을 추가합니다:'));
    missingDeps.forEach(dep => {
      console.log(chalk.yellow(`   - ${dep}: ${requiredDeps[dep]}`));
    });

    await packageModifier.addDependencies(
      Object.fromEntries(missingDeps.map(dep => [dep, requiredDeps[dep]])),
      true
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
    console.log(chalk.green('✅ 모든 의존성이 최신입니다'));
  }

  // 10. 문서 재생성
  console.log(chalk.blue('📄 문서 재생성 중...'));
  
  try {
    await execAsync('npm run docs', { cwd: projectRoot });
    console.log(chalk.green('✅ 문서 재생성 완료'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  문서 생성 실패. 수동으로 실행해주세요:'));
    console.log(chalk.yellow('   npm run docs'));
  }

  // 11. 업데이트 요약
  console.log(chalk.green.bold('\n🎉 업데이트 완료!\n'));
  
  console.log(chalk.blue('📋 업데이트 요약:'));
  console.log(`   - 시스템 파일: ${chalk.green('업데이트됨')}`);
  console.log(`   - 설정: ${updateConfig.title ? chalk.green('업데이트됨') : chalk.yellow('변경 없음')}`);
  console.log(`   - 테마: ${updateConfig.theme || '기본값'}`);
  console.log(`   - 의존성: ${missingDeps.length > 0 ? chalk.green('추가됨') : chalk.green('최신')}`);
  
  if (backup) {
    console.log(chalk.blue('\n📦 백업 정보:'));
    console.log(`   - 백업 위치: docs-backup-${Date.now()}`);
    console.log('   - 복원 방법: 백업 폴더를 docs/generator로 복사');
  }
  
  console.log(chalk.blue('\n🚀 다음 단계:'));
  console.log('1. 문서 확인: VS Code Live Server로 index.html 열기');
  console.log('2. 실시간 감시: npm run docs:watch');
  console.log('3. 다른 테마 시도: npm run docs:dark 또는 npm run docs:github');
  
  // 12. 버전 정보 (향후 구현)
  console.log(chalk.gray('\n📌 현재 버전: 1.0.0'));
  console.log(chalk.gray('💡 최신 업데이트 정보: https://github.com/your-username/markdown-docs-generator'));
}

module.exports = updateCommand;