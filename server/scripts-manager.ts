import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

export interface PackageScript {
  name: string;
  command: string;
  category: 'dev' | 'build' | 'test' | 'lint' | 'other';
}

export class ScriptsManager {
  getScripts(projectPath: string): { exists: boolean; scripts: PackageScript[]; packageManager: string } {
    const pkgPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      return { exists: false, scripts: [], packageManager: 'npm' };
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const rawScripts: Record<string, string> = pkg.scripts || {};
      
      let pm = 'npm';
      if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) pm = 'pnpm';
      else if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) pm = 'yarn';
      else if (fs.existsSync(path.join(projectPath, 'bun.lockb')) || fs.existsSync(path.join(projectPath, 'bun.lock'))) pm = 'bun';

      const scripts: PackageScript[] = Object.entries(rawScripts).map(([name, command]) => {
        let category: PackageScript['category'] = 'other';
        const lower = name.toLowerCase();
        if (lower.includes('dev') || lower.includes('start') || lower.includes('serve')) category = 'dev';
        else if (lower.includes('build') || lower.includes('bundle')) category = 'build';
        else if (lower.includes('test') || lower.includes('coverage') || lower.includes('spec')) category = 'test';
        else if (lower.includes('lint') || lower.includes('format') || lower.includes('check') || lower.includes('type')) category = 'lint';

        return { name, command, category };
      });

      return { exists: true, scripts, packageManager: pm };
    } catch {
      return { exists: false, scripts: [], packageManager: 'npm' };
    }
  }

  runScript(projectPath: string, scriptName: string, packageManager: string = 'npm', onData?: (text: string) => void): Promise<{ success: boolean; exitCode: number }> {
    return new Promise((resolve) => {
      const cmd = process.platform === 'win32' ? `${packageManager}.cmd` : packageManager;
      const args = packageManager === 'npm' ? ['run', scriptName] : ['run', scriptName];

      const child = spawn(cmd, args, {
        cwd: projectPath,
        shell: true,
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      child.stdout?.on('data', (d) => onData?.(d.toString()));
      child.stderr?.on('data', (d) => onData?.(d.toString()));

      child.on('close', (code) => {
        resolve({ success: code === 0, exitCode: code ?? 0 });
      });

      child.on('error', (err) => {
        onData?.(`\n[Execution Error]: ${err.message}\n`);
        resolve({ success: false, exitCode: 1 });
      });
    });
  }
}

export const scriptsManager = new ScriptsManager();
