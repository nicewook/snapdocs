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
 * 새 프로젝트 초기화 (문서 생성 시스템 포함)
 */
async function initCommand(options = {}) {
  const {
    theme = 'default',
    force = false,
    install = true
  } = options;

  console.log(chalk.blue.bold('\n📚 새 프로젝트 초기화\n'));

  const currentDir = process.cwd();
  const projectName = path.basename(currentDir);
  
  // 1. 프로젝트 디렉터리 확인
  const files = await fs.readdir(currentDir);
  const hasFiles = files.length > 0;
  
  if (hasFiles && !force) {
    console.log(chalk.yellow('⚠️  현재 디렉터리에 파일이 있습니다:'));
    files.forEach(file => console.log(chalk.yellow(`   - ${file}`)));
    
    const proceed = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '계속 진행하시겠습니까?',
        default: false
      }
    ]);
    
    if (!proceed.continue) {
      console.log(chalk.red('초기화가 취소되었습니다'));
      return;
    }
  }

  // 2. 프로젝트 설정 입력
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '프로젝트 이름:',
      default: projectName,
      validate: (input) => {
        if (!input || !input.trim()) {
          return '프로젝트 이름을 입력해주세요';
        }
        return true;
      }
    },
    {
      type: 'input',
      name: 'description',
      message: '프로젝트 설명:',
      default: `${projectName} project with documentation system`
    },
    {
      type: 'input',
      name: 'title',
      message: '문서 제목:',
      default: `${projectName} Documentation`
    },
    {
      type: 'input',
      name: 'subtitle',
      message: '문서 부제목:',
      default: `${projectName} Project Documentation`
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
      default: theme
    },
    {
      type: 'input',
      name: 'author',
      message: '작성자:',
      default: ''
    },
    {
      type: 'list',
      name: 'license',
      message: '라이센스:',
      choices: ['MIT', 'ISC', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'],
      default: 'MIT'
    }
  ]);

  const config = { ...answers, theme: answers.theme };

  const fileManager = new FileManager();
  const packageModifier = new PackageModifier(currentDir);

  // 3. package.json 생성
  console.log(chalk.blue('📦 package.json 생성 중...'));
  
  await packageModifier.createBasic({
    name: config.name,
    version: '1.0.0',
    description: config.description,
    main: 'index.js',
    author: config.author,
    license: config.license
  });

  // 4. 기본 디렉터리 구조 생성
  console.log(chalk.blue('📁 디렉터리 구조 생성 중...'));
  
  await fs.ensureDir('src');
  await fs.ensureDir('docs');
  await fs.ensureDir('docs/generator');

  // 5. 기본 파일 생성
  console.log(chalk.blue('📄 기본 파일 생성 중...'));
  
  // README.md
  const readmeContent = `# ${config.name}

${config.description}

## 설치

\`\`\`bash
npm install
\`\`\`

## 사용법

\`\`\`bash
npm start
\`\`\`

## 문서

문서는 다음 명령어로 생성할 수 있습니다:

\`\`\`bash
npm run docs
\`\`\`

실시간 감시 모드:

\`\`\`bash
npm run docs:watch
\`\`\`

다른 테마:

\`\`\`bash
npm run docs:dark
npm run docs:github
\`\`\`

## 라이센스

${config.license}
`;

  await fs.writeFile('README.md', readmeContent);

  // index.js
  const indexContent = `console.log('Hello, ${config.name}!');
`;
  await fs.writeFile('index.js', indexContent);

  // .gitignore
  const gitignoreContent = `node_modules/
*.log
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
dist/
build/
coverage/
*.tgz
*.tar.gz
.nyc_output/
`;
  await fs.writeFile('.gitignore', gitignoreContent);

  // 6. 문서 생성 시스템 설정
  console.log(chalk.blue('📚 문서 생성 시스템 설정 중...'));
  
  await fileManager.copyTemplate('generator', 'docs/generator', config);
  await fileManager.copyTemplate('CLAUDE.md', 'docs/CLAUDE.md', config);

  // 7. package.json 스크립트 추가
  console.log(chalk.blue('📦 스크립트 추가 중...'));
  
  const scriptsPath = path.join(fileManager.templatesPath, 'package-scripts.json');
  const docsScripts = await fs.readJson(scriptsPath);
  
  const allScripts = {
    start: 'node index.js',
    test: 'echo "Error: no test specified" && exit 1',
    ...docsScripts
  };
  
  await packageModifier.addScripts(allScripts);

  // 8. 의존성 설치
  if (install) {
    console.log(chalk.blue('📦 의존성 설치 중...'));
    
    const dependencies = {
      'chokidar': '^4.0.3',
      'gray-matter': '^4.0.3',
      'marked': '^16.0.0'
    };

    await packageModifier.addDependencies(dependencies, true);

    try {
      console.log(chalk.blue('📦 npm install 실행 중...'));
      await execAsync('npm install', { cwd: currentDir });
      console.log(chalk.green('✅ 의존성 설치 완료'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  npm install 실패. 수동으로 실행해주세요:'));
      console.log(chalk.yellow('   npm install'));
    }
  }

  // 9. 초기 문서 생성
  console.log(chalk.blue('📄 초기 문서 생성 중...'));
  
  try {
    await execAsync('npm run docs', { cwd: currentDir });
    console.log(chalk.green('✅ 초기 문서 생성 완료'));
  } catch (error) {
    console.log(chalk.yellow('⚠️  문서 생성 실패. 수동으로 실행해주세요:'));
    console.log(chalk.yellow('   npm run docs'));
  }

  // 10. Git 저장소 초기화 (선택사항)
  const initGit = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'git',
      message: 'Git 저장소를 초기화하시겠습니까?',
      default: true
    }
  ]);

  if (initGit.git) {
    try {
      await execAsync('git init', { cwd: currentDir });
      await execAsync('git add .', { cwd: currentDir });
      await execAsync('git commit -m "Initial commit with documentation system"', { cwd: currentDir });
      console.log(chalk.green('✅ Git 저장소 초기화 완료'));
    } catch (error) {
      console.log(chalk.yellow('⚠️  Git 초기화 실패. 수동으로 실행해주세요:'));
      console.log(chalk.yellow('   git init && git add . && git commit -m "Initial commit"'));
    }
  }

  // 11. 완료 메시지
  console.log(chalk.green.bold('\n🎉 프로젝트 초기화 완료!\n'));
  
  console.log(chalk.blue('📋 프로젝트 정보:'));
  console.log(`   - 이름: ${config.name}`);
  console.log(`   - 설명: ${config.description}`);
  console.log(`   - 테마: ${config.theme}`);
  console.log(`   - 작성자: ${config.author || '(없음)'}`);
  console.log(`   - 라이센스: ${config.license}`);
  
  console.log(chalk.blue('\n📁 생성된 파일들:'));
  console.log('   - README.md');
  console.log('   - index.js');
  console.log('   - package.json');
  console.log('   - .gitignore');
  console.log('   - docs/generator/');
  console.log('   - docs/CLAUDE.md');
  console.log('   - index.html');
  
  console.log(chalk.blue('\n🚀 다음 단계:'));
  console.log('1. 프로젝트 시작: npm start');
  console.log('2. 문서 생성: npm run docs');
  console.log('3. 실시간 감시: npm run docs:watch');
  console.log('4. VS Code Live Server로 index.html 열기');
  console.log('5. docs/ 디렉터리에 마크다운 파일 추가');
}

module.exports = initCommand;