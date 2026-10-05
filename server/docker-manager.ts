import { spawn } from 'node:child_process';
import type { LogEntry } from '../src/types';

export class DockerManager {
  private activeDockerProjects: Set<string> = new Set();

  async isAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const p = spawn('docker', ['version'], { shell: true, windowsHide: true });
      p.on('close', (code) => resolve(code === 0));
      p.on('error', () => resolve(false));
    });
  }

  start(
    projectId: string,
    cwd: string,
    command: string,
    onLog: (log: LogEntry) => void,
    onExit: (code: number | null) => void
  ) {
    onLog({
      id: crypto.randomUUID(),
      projectId,
      timestamp: new Date().toISOString(),
      stream: 'system',
      text: `[WinDev Hub Docker] Running: ${command} in ${cwd}`,
    });

    const child = spawn('cmd.exe', ['/d', '/s', '/c', command], {
      cwd,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
      windowsHide: true,
    });

    this.activeDockerProjects.add(projectId);

    child.stdout?.on('data', (chunk) => {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'stdout',
        text: chunk.toString(),
      });
    });

    child.stderr?.on('data', (chunk) => {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'stderr',
        text: chunk.toString(),
      });
    });

    child.on('close', (code) => {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[WinDev Hub Docker] Process ended with code ${code}`,
      });
      onExit(code);
    });

    return { pid: child.pid || 0 };
  }

  async stop(projectId: string, cwd: string, onLog: (log: LogEntry) => void): Promise<boolean> {
    return new Promise((resolve) => {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[WinDev Hub Docker] Stopping containers: docker compose down...`,
      });

      const child = spawn('cmd.exe', ['/d', '/s', '/c', 'docker compose down'], {
        cwd,
        windowsHide: true,
      });

      child.stdout?.on('data', (chunk) => {
        onLog({
          id: crypto.randomUUID(),
          projectId,
          timestamp: new Date().toISOString(),
          stream: 'stdout',
          text: chunk.toString(),
        });
      });

      child.stderr?.on('data', (chunk) => {
        onLog({
          id: crypto.randomUUID(),
          projectId,
          timestamp: new Date().toISOString(),
          stream: 'stderr',
          text: chunk.toString(),
        });
      });

      child.on('close', () => {
        this.activeDockerProjects.delete(projectId);
        resolve(true);
      });
    });
  }

  async syncReload(projectId: string, cwd: string, onLog: (log: LogEntry) => void): Promise<boolean> {
    return new Promise((resolve) => {
      onLog({
        id: crypto.randomUUID(),
        projectId,
        timestamp: new Date().toISOString(),
        stream: 'system',
        text: `[WinDev Hub Docker] Hot-syncing containers: docker compose up -d --build...`,
      });

      const child = spawn('cmd.exe', ['/d', '/s', '/c', 'docker compose up -d --build'], {
        cwd,
        windowsHide: true,
      });

      child.stdout?.on('data', (chunk) => {
        onLog({
          id: crypto.randomUUID(),
          projectId,
          timestamp: new Date().toISOString(),
          stream: 'stdout',
          text: chunk.toString(),
        });
      });

      child.stderr?.on('data', (chunk) => {
        onLog({
          id: crypto.randomUUID(),
          projectId,
          timestamp: new Date().toISOString(),
          stream: 'stderr',
          text: chunk.toString(),
        });
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }
}

export const dockerManager = new DockerManager();
