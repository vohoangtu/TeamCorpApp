import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import { projectStore } from './store';
import type { GitMatrixRepo, GitMatrixBatchResult } from '../src/types';

const execFileAsync = promisify(execFile);

// Helper to determine git executable
function getGitExecutable(): string {
  // Check common GitHub Desktop or standard git paths on Windows if needed
  return process.platform === 'win32' ? 'git.cmd' : 'git';
}

async function runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const gitCmd = getGitExecutable();
  try {
    const { stdout, stderr } = await execFileAsync(gitCmd, args, {
      cwd,
      windowsHide: true,
      timeout: 15000,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0', // Do not hang waiting for password
      },
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (error: any) {
    // If git.cmd fails, try fallback to 'git'
    if (error.code === 'ENOENT' && gitCmd === 'git.cmd') {
      try {
        const { stdout, stderr } = await execFileAsync('git', args, {
          cwd,
          windowsHide: true,
          timeout: 15000,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
      } catch (err2: any) {
        return {
          stdout: err2.stdout ? err2.stdout.trim() : '',
          stderr: err2.stderr ? err2.stderr.trim() : err2.message,
          exitCode: err2.code || 1,
        };
      }
    }
    return {
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : error.message,
      exitCode: error.code || 1,
    };
  }
}

export class GitMatrixService {
  async getMatrixStatus(): Promise<GitMatrixRepo[]> {
    const projects = projectStore.getAll();
    const results: GitMatrixRepo[] = [];

    for (const project of projects) {
      const gitDir = path.join(project.sourcePath, '.git');
      const isGitRepo = fs.existsSync(gitDir);

      if (!isGitRepo) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          sourcePath: project.sourcePath,
          isGitRepo: false,
          currentBranch: '',
          localBranches: [],
          aheadCount: 0,
          behindCount: 0,
          dirtyFilesCount: 0,
          untrackedCount: 0,
          hasConflict: false,
        });
        continue;
      }

      try {
        // 1. Current Branch
        const branchRes = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], project.sourcePath);
        const currentBranch = branchRes.exitCode === 0 ? branchRes.stdout : 'HEAD detached';

        // 2. Local Branches
        const branchesRes = await runGit(['for-each-ref', '--format=%(refname:short)', 'refs/heads/'], project.sourcePath);
        const localBranches = branchesRes.exitCode === 0 && branchesRes.stdout
          ? branchesRes.stdout.split('\n').map((b) => b.trim()).filter(Boolean)
          : [currentBranch];

        // 3. Status Porcelain
        const statusRes = await runGit(['status', '--porcelain'], project.sourcePath);
        let dirtyFilesCount = 0;
        let untrackedCount = 0;
        let hasConflict = false;

        if (statusRes.exitCode === 0 && statusRes.stdout) {
          const lines = statusRes.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
          for (const line of lines) {
            if (line.startsWith('??')) {
              untrackedCount++;
            } else if (line.startsWith('UU') || line.startsWith('AA') || line.startsWith('DD')) {
              hasConflict = true;
              dirtyFilesCount++;
            } else {
              dirtyFilesCount++;
            }
          }
        }

        // 4. Ahead / Behind upstream
        let aheadCount = 0;
        let behindCount = 0;
        const abRes = await runGit(['rev-list', '--left-right', '--count', 'HEAD...@{u}'], project.sourcePath);
        if (abRes.exitCode === 0 && abRes.stdout) {
          const parts = abRes.stdout.split(/\s+/);
          if (parts.length >= 2) {
            aheadCount = parseInt(parts[0], 10) || 0;
            behindCount = parseInt(parts[1], 10) || 0;
          }
        }

        // 5. Last commit info
        let lastCommit: GitMatrixRepo['lastCommit'] = undefined;
        const commitRes = await runGit(['log', '-1', '--format=%h|%an|%s|%cI'], project.sourcePath);
        if (commitRes.exitCode === 0 && commitRes.stdout) {
          const [hash, author, message, date] = commitRes.stdout.split('|');
          if (hash) {
            lastCommit = {
              hash,
              author: author || 'Unknown',
              message: message || '',
              date: date || new Date().toISOString(),
            };
          }
        }

        results.push({
          projectId: project.id,
          projectName: project.name,
          sourcePath: project.sourcePath,
          isGitRepo: true,
          currentBranch,
          localBranches,
          aheadCount,
          behindCount,
          dirtyFilesCount,
          untrackedCount,
          lastCommit,
          hasConflict,
        });
      } catch (err: any) {
        results.push({
          projectId: project.id,
          projectName: project.name,
          sourcePath: project.sourcePath,
          isGitRepo: true,
          currentBranch: 'error',
          localBranches: [],
          aheadCount: 0,
          behindCount: 0,
          dirtyFilesCount: 0,
          untrackedCount: 0,
          hasConflict: false,
        });
      }
    }

    return results;
  }

  async checkoutRepo(projectId: string, branchName: string, createIfMissing: boolean = false): Promise<GitMatrixBatchResult> {
    const project = projectStore.get(projectId);
    if (!project) {
      return { projectId, projectName: 'Unknown', action: 'checkout', success: false, message: 'Dự án không tồn tại' };
    }

    // Try standard checkout
    let res = await runGit(['checkout', branchName], project.sourcePath);
    if (res.exitCode !== 0 && createIfMissing) {
      // Try checkout -b
      res = await runGit(['checkout', '-b', branchName], project.sourcePath);
    }

    const success = res.exitCode === 0;
    const message = success
      ? `Đã chuyển sang nhánh '${branchName}'`
      : res.stderr || res.stdout || 'Lỗi chuyển nhánh';

    return {
      projectId,
      projectName: project.name,
      action: 'checkout',
      success,
      message,
    };
  }

  async pullRepo(projectId: string): Promise<GitMatrixBatchResult> {
    const project = projectStore.get(projectId);
    if (!project) {
      return { projectId, projectName: 'Unknown', action: 'pull', success: false, message: 'Dự án không tồn tại' };
    }

    const res = await runGit(['pull'], project.sourcePath);
    const success = res.exitCode === 0;
    const message = success
      ? (res.stdout.includes('Already up to date') ? 'Đã cập nhật (Up to date)' : 'Đã pull cập nhật mới thành công')
      : res.stderr || res.stdout || 'Lỗi git pull';

    return {
      projectId,
      projectName: project.name,
      action: 'pull',
      success,
      message,
    };
  }

  async stashRepo(projectId: string, stashMessage?: string): Promise<GitMatrixBatchResult> {
    const project = projectStore.get(projectId);
    if (!project) {
      return { projectId, projectName: 'Unknown', action: 'stash', success: false, message: 'Dự án không tồn tại' };
    }

    const msg = stashMessage || `WinDev Hub stash at ${new Date().toLocaleTimeString()}`;
    const res = await runGit(['stash', 'push', '-u', '-m', msg], project.sourcePath);
    const success = res.exitCode === 0;
    const message = success
      ? (res.stdout.includes('No local changes to save') ? 'Không có thay đổi cần stash' : 'Đã stash thay đổi an toàn')
      : res.stderr || res.stdout || 'Lỗi git stash';

    return {
      projectId,
      projectName: project.name,
      action: 'stash',
      success,
      message,
    };
  }

  async batchCheckout(branchName: string, createIfMissing: boolean = false): Promise<GitMatrixBatchResult[]> {
    const matrix = await this.getMatrixStatus();
    const gitRepos = matrix.filter((r) => r.isGitRepo);
    const promises = gitRepos.map((repo) => this.checkoutRepo(repo.projectId, branchName, createIfMissing));
    return Promise.all(promises);
  }

  async batchPull(): Promise<GitMatrixBatchResult[]> {
    const matrix = await this.getMatrixStatus();
    const gitRepos = matrix.filter((r) => r.isGitRepo);
    const promises = gitRepos.map((repo) => this.pullRepo(repo.projectId));
    return Promise.all(promises);
  }

  async batchStash(stashMessage?: string): Promise<GitMatrixBatchResult[]> {
    const matrix = await this.getMatrixStatus();
    const gitRepos = matrix.filter((r) => r.isGitRepo && (r.dirtyFilesCount > 0 || r.untrackedCount > 0));
    if (gitRepos.length === 0) {
      return [];
    }
    const promises = gitRepos.map((repo) => this.stashRepo(repo.projectId, stashMessage));
    return Promise.all(promises);
  }
}

export const gitMatrixService = new GitMatrixService();
