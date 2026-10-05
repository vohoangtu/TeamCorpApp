import { spawn, ChildProcess } from 'node:child_process';
import treeKill from 'tree-kill';
import type { LogEntry } from '../src/types';

interface RunningProcess {
  process: ChildProcess;
  pid: number;
}

export class ProcessManager {
  private processes: Map<string, RunningProcess> = new Map();

  start(
    projectId: string,
    cwd: string,
    command: string,
    onLog: (log: LogEntry) => void,
    onExit: (code: number | null) => void,
    target: 'native' | 'wsl2' = 'native'
  ): { pid: number } {
    // If already running, kill first
    if (this.processes.has(projectId)) {
      this.stop(projectId);
    }

    const isWindows = process.platform === 'win32';
    const isWsl = target === 'wsl2';

    let shell = isWindows ? 'cmd.exe' : '/bin/sh';
    let shellArgs = isWindows ? ['/d', '/s', '/c', command] : ['-c', command];
    let spawnCwd = cwd;

    if (isWsl) {
      // Convert Windows path C:\Users\... to WSL /mnt/c/Users/...
      const wslCwd = cwd.replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`).replace(/\\/g, '/');
      shell = 'wsl.exe';
      shellArgs = ['--', 'bash', '-c', `cd "${wslCwd}" && ${command}`];
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[WinDev Hub Deployer] 🐧 Deploying to WSL2 Linux Sandbox... (cd "${wslCwd}" && ${command})`,
      });
    } else {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[WinDev Hub Deployer] 🪟 Deploying to Windows Native Process... (${command}) in ${cwd}`,
      });
    }

    const child = spawn(shell, shellArgs, {
      cwd: spawnCwd,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
      windowsHide: true,
    });

    const pid = child.pid || 0;
    this.processes.set(projectId, { process: child, pid });

    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'stdout',
        text,
      });
    });

    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'stderr',
        text,
      });
    });

    child.on('close', (code) => {
      this.processes.delete(projectId);
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[WinDev Hub] Process exited with code ${code}`,
      });
      onExit(code);
    });

    child.on('error', (err) => {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'stderr',
        text: `[WinDev Hub Process Error] ${err.message}`,
      });
    });

    return { pid };
  }

  async stop(projectId: string): Promise<boolean> {
    const running = this.processes.get(projectId);
    if (!running) return false;

    return new Promise((resolve) => {
      treeKill(running.pid, 'SIGKILL', (err) => {
        if (err) {
          console.warn(`[ProcessManager] treeKill error on PID ${running.pid}:`, err);
        }
        this.processes.delete(projectId);
        resolve(true);
      });
    });
  }

  isRunning(projectId: string): boolean {
    return this.processes.has(projectId);
  }

  getPid(projectId: string): number | undefined {
    return this.processes.get(projectId)?.pid;
  }
}

export const processManager = new ProcessManager();
