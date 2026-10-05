import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import type { LogEntry } from '../src/types';

const WORKSPACE_DIR = path.join(os.homedir(), '.windev-hub', 'repos');

export class GitManager {
  constructor() {
    if (!fs.existsSync(WORKSPACE_DIR)) {
      fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
    }
  }

  async cloneRepo(
    url: string,
    branch: string = 'main',
    token?: string,
    onLog?: (log: LogEntry) => void
  ): Promise<string> {
    const rawName = url.replace(/\/$/, '').split('/').pop()?.replace(/\.git$/, '') || `repo-${Date.now()}`;
    const targetDir = path.join(WORKSPACE_DIR, rawName);

    // If directory already exists, return it
    if (fs.existsSync(targetDir) && fs.existsSync(path.join(targetDir, '.git'))) {
      onLog?.({
        id: crypto.randomUUID(),
        projectId: 'git-importer',
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[Git] Repository already cloned at ${targetDir}, pulling latest updates...`,
      });
      return targetDir;
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    onLog?.({
      id: crypto.randomUUID(),
      projectId: 'git-importer',
      timestamp: new Date().toISOString(),
      stream: 'system',
      text: `[Git] Cloning ${url} (${branch}) into ${targetDir}...`,
    });

    await git.clone({
      fs,
      http,
      dir: targetDir,
      url,
      ref: branch,
      singleBranch: true,
      depth: 1,
      onAuth: () => {
        if (token) {
          return { username: token, password: '' };
        }
        return undefined;
      },
      onProgress: (progress) => {
        if (progress.phase) {
          onLog?.({
            id: crypto.randomUUID(),
            projectId: 'git-importer',
            timestamp: new Date().toISOString(),
            stream: 'stdout',
            text: `[Git ${progress.phase}] ${progress.loaded}/${progress.total || '?'}`,
          });
        }
      },
    });

    onLog?.({
      id: crypto.randomUUID(),
      projectId: 'git-importer',
      timestamp: new Date().toISOString(),
      stream: 'system',
      text: `[Git] Clone finished successfully: ${targetDir}`,
    });

    return targetDir;
  }

  // Get current git status (branch, clean/dirty state)
  async getRepoStatus(dir: string): Promise<{ isGit: boolean; branch?: string; uncommittedCount?: number }> {
    const gitDir = path.join(dir, '.git');
    if (!fs.existsSync(gitDir)) {
      return { isGit: false };
    }

    try {
      // 1. Read current branch directly from .git/HEAD for sub-millisecond response
      const headFile = path.join(gitDir, 'HEAD');
      let branch = 'main';
      if (fs.existsSync(headFile)) {
        const headContent = fs.readFileSync(headFile, 'utf-8').trim();
        if (headContent.startsWith('ref: refs/heads/')) {
          branch = headContent.replace('ref: refs/heads/', '');
        } else {
          branch = headContent.slice(0, 7); // detached commit hash
        }
      }

      // 2. Count uncommitted modifications
      let uncommittedCount = 0;
      try {
        const matrix = await git.statusMatrix({ fs, dir });
        // In statusMatrix: [filepath, head, workdir, stage]
        // If head !== workdir, work tree has changed
        uncommittedCount = matrix.filter((row) => row[1] !== row[2]).length;
      } catch {
        uncommittedCount = 0;
      }

      return {
        isGit: true,
        branch,
        uncommittedCount,
      };
    } catch {
      return { isGit: true, branch: 'main', uncommittedCount: 0 };
    }
  }

  // Pull latest updates from remote repository
  async gitPull(dir: string): Promise<{ success: boolean; message: string }> {
    const gitDir = path.join(dir, '.git');
    if (!fs.existsSync(gitDir)) {
      return { success: false, message: 'Thư mục không phải là git repository.' };
    }

    try {
      await git.pull({
        fs,
        http,
        dir,
        singleBranch: true,
        author: { name: 'WinDev Hub', email: 'windev@local' },
      });
      return { success: true, message: 'Đã cập nhật repository mới nhất thành công.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Lỗi khi thực hiện git pull' };
    }
  }
}

export const gitManager = new GitManager();
