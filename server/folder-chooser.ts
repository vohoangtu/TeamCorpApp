import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DirectoryItem {
  name: string;
  fullPath: string;
  isProject?: boolean;
  projectType?: string;
}

export interface DirectoryListResult {
  currentPath: string;
  parentPath: string | null;
  drives: string[];
  directories: DirectoryItem[];
  bookmarks: Array<{ label: string; path: string; icon: string }>;
}

export class FolderChooserService {
  private scriptPath = path.resolve(__dirname, '../scripts/browse-folder.ps1');

  public async openNativeDialog(initialPath?: string): Promise<{ success: boolean; path?: string; canceled?: boolean }> {
    return new Promise((resolve) => {
      const args = ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-File', this.scriptPath];
      if (initialPath && fs.existsSync(initialPath)) {
        args.push(initialPath);
      }

      execFile('powershell', args, { timeout: 120000 }, (err, stdout) => {
        if (err) {
          console.warn('[FolderChooser] Native dialog error or canceled:', err.message);
          return resolve({ success: false, canceled: true });
        }
        const selected = (stdout || '').trim();
        if (!selected) {
          return resolve({ success: true, canceled: true });
        }
        resolve({ success: true, path: selected });
      });
    });
  }

  public getAvailableDrives(): string[] {
    const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const drives: string[] = [];
    for (const letter of letters) {
      const drive = `${letter}:\\`;
      try {
        if (fs.existsSync(drive)) {
          drives.push(`${letter}:`);
        }
      } catch {}
    }
    return drives;
  }

  public getQuickBookmarks(): Array<{ label: string; path: string; icon: string }> {
    const home = os.homedir();
    const list: Array<{ label: string; path: string; icon: string }> = [
      { label: 'Scratch Projects', path: path.join(home, '.gemini', 'antigravity', 'scratch'), icon: '⚡' },
      { label: 'GitHub Repos', path: path.join(home, 'Documents', 'GitHub'), icon: '🐙' },
      { label: 'User Home (~)', path: home, icon: '🏠' },
      { label: 'Desktop', path: path.join(home, 'Desktop'), icon: '🖥️' },
      { label: 'Documents', path: path.join(home, 'Documents'), icon: '📁' },
    ];
    return list.filter((b) => {
      try {
        return fs.existsSync(b.path);
      } catch {
        return false;
      }
    });
  }

  public listDirectory(targetPath?: string): DirectoryListResult {
    const home = os.homedir();
    const resolvedPath = targetPath && fs.existsSync(targetPath) ? path.resolve(targetPath) : home;

    const drives = this.getAvailableDrives();
    const bookmarks = this.getQuickBookmarks();

    const parsed = path.parse(resolvedPath);
    const parentPath = resolvedPath === parsed.root ? null : path.dirname(resolvedPath);

    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
    } catch (e) {
      console.warn(`[FolderChooser] Cannot read ${resolvedPath}:`, e);
    }

    const directories: DirectoryItem[] = [];
    for (const ent of entries) {
      if (ent.isDirectory() && !ent.name.startsWith('$') && ent.name !== 'System Volume Information') {
        const full = path.join(resolvedPath, ent.name);
        let isProject = false;
        let projectType: string | undefined;

        try {
          if (fs.existsSync(path.join(full, 'package.json'))) {
            isProject = true;
            projectType = 'Node / JS';
          } else if (fs.existsSync(path.join(full, 'requirements.txt')) || fs.existsSync(path.join(full, 'pyproject.toml'))) {
            isProject = true;
            projectType = 'Python';
          } else if (fs.existsSync(path.join(full, 'Dockerfile')) || fs.existsSync(path.join(full, 'docker-compose.yml'))) {
            isProject = true;
            projectType = 'Docker';
          } else if (fs.existsSync(path.join(full, 'go.mod'))) {
            isProject = true;
            projectType = 'Go';
          } else if (fs.existsSync(path.join(full, '.git'))) {
            isProject = true;
            projectType = 'Git Repo';
          }
        } catch {}

        directories.push({
          name: ent.name,
          fullPath: full,
          isProject,
          projectType,
        });
      }
    }

    // Sort: projects first, then alphabetical
    directories.sort((a, b) => {
      if (a.isProject && !b.isProject) return -1;
      if (!a.isProject && b.isProject) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return {
      currentPath: resolvedPath,
      parentPath,
      drives,
      directories,
      bookmarks,
    };
  }
}

export const folderChooserService = new FolderChooserService();
