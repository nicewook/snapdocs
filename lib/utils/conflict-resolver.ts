import * as fs from 'fs-extra';
import * as path from 'path';
import * as chalk from 'chalk';
import inquirer from 'inquirer';

export interface ConflictResolverOptions {
  force?: boolean;
  backup?: boolean;
  [key: string]: any;
}

export interface ConflictInfo {
  path: string;
  type: 'file' | 'directory';
  size: number;
  mtime: Date;
  relativePath: string;
}

export type ResolutionAction = 'proceed' | 'overwrite' | 'backup_and_overwrite' | 'skip' | 'cancel';

export interface ResolutionResult {
  action: ResolutionAction;
  conflicts: ConflictInfo[];
}

export interface ConflictSummary {
  total: number;
  files: number;
  directories: number;
  totalSize: number;
}

export class ConflictResolver {
  private options: ConflictResolverOptions;
  private force: boolean;
  private backup: boolean;

  constructor(options: ConflictResolverOptions = {}) {
    this.options = options;
    this.force = options.force || false;
    this.backup = options.backup || false;
  }

  /**
   * 충돌 감지 및 해결
   */
  async resolveConflicts(targetPath: string, sourcePath?: string): Promise<ResolutionResult> {
    const conflicts = await this.detectConflicts(targetPath);
    
    if (conflicts.length === 0) {
      return { action: 'proceed', conflicts: [] };
    }

    if (this.force) {
      return { action: 'overwrite', conflicts };
    }

    return await this.promptUser(conflicts);
  }

  /**
   * 충돌 감지
   */
  async detectConflicts(targetPath: string): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];
    
    if (await fs.pathExists(targetPath)) {
      const stats = await fs.stat(targetPath);
      
      conflicts.push({
        path: targetPath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        mtime: stats.mtime,
        relativePath: path.relative(process.cwd(), targetPath)
      });

      // 디렉터리인 경우 내부 파일들도 확인
      if (stats.isDirectory()) {
        const innerConflicts = await this.detectDirectoryConflicts(targetPath);
        conflicts.push(...innerConflicts);
      }
    }

    return conflicts;
  }

  /**
   * 디렉터리 내부 충돌 감지
   */
  private async detectDirectoryConflicts(dirPath: string): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];
    
    try {
      const items = await fs.readdir(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);
        
        conflicts.push({
          path: itemPath,
          type: stats.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          mtime: stats.mtime,
          relativePath: path.relative(process.cwd(), itemPath)
        });
      }
    } catch (error) {
      // 디렉터리 읽기 실패 시 무시
      console.warn(chalk.yellow(`⚠️  디렉터리 읽기 실패: ${dirPath}`));
    }

    return conflicts;
  }

  /**
   * 사용자 입력 프롬프트
   */
  private async promptUser(conflicts: ConflictInfo[]): Promise<ResolutionResult> {
    console.log(chalk.yellow('\n⚠️  기존 파일/디렉터리가 발견되었습니다:'));
    
    conflicts.forEach(conflict => {
      const typeIcon = conflict.type === 'directory' ? '📁' : '📄';
      const sizeInfo = conflict.type === 'file' ? 
        ` (${this.formatFileSize(conflict.size)})` : '';
      
      console.log(chalk.yellow(`   ${typeIcon} ${conflict.relativePath}${sizeInfo}`));
    });

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '어떻게 처리하시겠습니까?',
        choices: [
          { name: '🔄 덮어쓰기', value: 'overwrite' },
          { name: '📦 백업 후 덮어쓰기', value: 'backup_and_overwrite' },
          { name: '🚫 건너뛰기', value: 'skip' },
          { name: '❌ 취소', value: 'cancel' }
        ]
      }
    ]);

    return { action: answers.action as ResolutionAction, conflicts };
  }

  /**
   * 충돌 해결 실행
   */
  async executeResolution(resolution: ResolutionResult, sourcePath?: string, targetPath?: string): Promise<boolean> {
    const { action, conflicts } = resolution;
    
    switch (action) {
      case 'proceed':
        // 충돌 없음, 그대로 진행
        break;
        
      case 'overwrite':
        console.log(chalk.green('🔄 파일 덮어쓰기 중...'));
        break;
        
      case 'backup_and_overwrite':
        console.log(chalk.blue('📦 백업 생성 중...'));
        for (const conflict of conflicts) {
          await this.createBackup(conflict.path);
        }
        console.log(chalk.green('🔄 파일 덮어쓰기 중...'));
        break;
        
      case 'skip':
        console.log(chalk.yellow('🚫 파일 설치 건너뛰기'));
        return false;
        
      case 'cancel':
        console.log(chalk.red('❌ 설치 취소'));
        return false;
        
      default:
        throw new Error(`알 수 없는 액션: ${action}`);
    }

    return true;
  }

  /**
   * 백업 생성
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
   * 파일 크기 포맷팅
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 충돌 요약 정보
   */
  summarizeConflicts(conflicts: ConflictInfo[]): ConflictSummary {
    const summary: ConflictSummary = {
      total: conflicts.length,
      files: conflicts.filter(c => c.type === 'file').length,
      directories: conflicts.filter(c => c.type === 'directory').length,
      totalSize: conflicts
        .filter(c => c.type === 'file')
        .reduce((sum, c) => sum + c.size, 0)
    };

    return summary;
  }

  /**
   * 배치 모드에서 자동 해결
   */
  async resolveBatch(conflicts: ConflictInfo[], defaultAction: ResolutionAction = 'skip'): Promise<ResolutionResult> {
    console.log(chalk.blue(`🔄 배치 모드: ${conflicts.length}개 충돌 자동 해결`));
    
    const resolution: ResolutionResult = {
      action: defaultAction,
      conflicts
    };

    return resolution;
  }
}

export default ConflictResolver;