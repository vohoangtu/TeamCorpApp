import chokidar, { FSWatcher } from 'chokidar';
import { spawn } from 'node:child_process';
import { projectStore } from './store';
import { processManager } from './process-manager';
import { dockerManager } from './docker-manager';
import type { LogEntry, Project, DeploymentRecord } from '../src/types';

export class SyncEngine {
  private watchers: Map<string, FSWatcher> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private broadcastFn?: (type: string, payload: any) => void;
  private deployments: DeploymentRecord[] = [];

  setBroadcast(fn: (type: string, payload: any) => void) {
    this.broadcastFn = fn;
  }

  private broadcast(type: string, payload: any) {
    this.broadcastFn?.(type, payload);
  }

  private emitLog(projectId: string, stream: 'stdout' | 'stderr' | 'system', text: string) {
    const log: LogEntry = {
      id: crypto.randomUUID(),
      projectId,
      timestamp: new Date().toISOString(),
      stream,
      text,
    };
    this.broadcast('project:log', { projectId, log });
  }

  getDeployments(projectId?: string): DeploymentRecord[] {
    if (projectId) {
      return this.deployments.filter((d) => d.projectId === projectId);
    }
    return this.deployments;
  }

  async triggerSync(
    projectId: string,
    trigger: 'manual' | 'auto-watch' = 'manual'
  ): Promise<{ success: boolean; durationMs: number }> {
    const project = projectStore.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    const startTime = performance.now();
    const targetLabel = project.runtimeType === 'docker' ? '🐳 Docker' : project.runtimeType === 'wsl2' ? '🐧 WSL2' : '🪟 Windows';

    // 1. Set status to syncing (Deploying)
    project.status = 'syncing';
    projectStore.set(project);
    this.broadcast('project:update', project);

    this.emitLog(
      projectId,
      'system',
      `🚀 [DEPLOY PIPELINE] Bắt đầu triển khai từ Windows Source sang Target: ${targetLabel} (${trigger})...`
    );

    let currentStage: 'validate_build' | 'dispatch_target' | 'health_probe' = 'validate_build';

    try {
      // --- STAGE 1: VALIDATE & BUILD ---
      if (project.buildCommand && project.buildCommand.trim()) {
        this.emitLog(projectId, 'system', `  [Stage 1: Build & Validate] $ ${project.buildCommand}`);
        const buildSuccess = await this.runBuildCommand(projectId, project.sourcePath, project.buildCommand);
        if (!buildSuccess) {
          throw new Error('Build command failed in Stage 1');
        }
      } else {
        this.emitLog(projectId, 'system', `  [Stage 1: Build & Validate] Bỏ qua build step (chế độ direct live-reload)`);
      }

      // --- STAGE 2: DISPATCH TO TARGET ---
      currentStage = 'dispatch_target';
      this.emitLog(projectId, 'system', `  [Stage 2: Target Dispatch] Khởi tạo instance trên ${targetLabel}...`);

      if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
        // Cleanly stop previous process tree
        await processManager.stop(projectId);

        // Start new process on selected target
        const { pid } = processManager.start(
          projectId,
          project.sourcePath,
          project.runCommand,
          (log) => this.broadcast('project:log', { projectId, log }),
          (code) => {
            const current = projectStore.get(projectId);
            if (current && current.status === 'running') {
              current.status = code === 0 ? 'stopped' : 'error';
              current.pid = undefined;
              projectStore.set(current);
              this.broadcast('project:update', current);
            }
          },
          project.runtimeType
        );

        project.pid = pid;
        project.status = 'running';
      } else {
        // Docker reload
        const ok = await dockerManager.syncReload(
          projectId,
          project.sourcePath,
          (log) => this.broadcast('project:log', { projectId, log })
        );
        project.status = ok ? 'running' : 'error';
      }

      // --- STAGE 3: HEALTH PROBE ---
      currentStage = 'health_probe';
      this.emitLog(projectId, 'system', `  [Stage 3: Health Probe] Kiểm tra cổng kết nối :${project.port || 'default'}...`);

      const durationMs = Math.round(performance.now() - startTime);
      project.syncCount = (project.syncCount || 0) + 1;
      project.lastSyncTime = new Date().toISOString();
      project.lastSyncDurationMs = durationMs;
      projectStore.set(project);

      // Record deployment
      const record: DeploymentRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        projectName: project.name,
        timestamp: new Date().toISOString(),
        durationMs,
        target: project.runtimeType,
        status: 'success',
        stage: 'health_probe',
        trigger,
        message: `Triển khai thành công tới ${targetLabel} trong ${durationMs}ms`,
      };
      this.deployments.unshift(record);
      if (this.deployments.length > 50) this.deployments.pop();

      this.emitLog(
        projectId,
        'system',
        `✅ [DEPLOY COMPLETED] Triển khai hoàn tất trong ${durationMs}ms! Target ${targetLabel} đã sẵn sàng.`
      );

      this.broadcast('project:update', project);
      this.broadcast('deployment:new', record);
      return { success: true, durationMs };
    } catch (err: any) {
      const durationMs = Math.round(performance.now() - startTime);
      project.status = 'error';
      projectStore.set(project);

      const record: DeploymentRecord = {
        id: crypto.randomUUID(),
        projectId: project.id,
        projectName: project.name,
        timestamp: new Date().toISOString(),
        durationMs,
        target: project.runtimeType,
        status: 'failed',
        stage: currentStage,
        trigger,
        message: `Lỗi tại ${currentStage}: ${err.message}`,
      };
      this.deployments.unshift(record);
      if (this.deployments.length > 50) this.deployments.pop();

      this.emitLog(projectId, 'stderr', `❌ [DEPLOY FAILED] Thất bại tại [${currentStage}]: ${err.message}`);
      this.broadcast('project:update', project);
      this.broadcast('deployment:new', record);
      return { success: false, durationMs };
    }
  }

  private runBuildCommand(projectId: string, cwd: string, command: string): Promise<boolean> {
    return new Promise((resolve) => {
      const child = spawn('cmd.exe', ['/d', '/s', '/c', command], {
        cwd,
        env: { ...process.env, FORCE_COLOR: '1' },
        windowsHide: true,
      });

      child.stdout?.on('data', (d) => {
        this.emitLog(projectId, 'stdout', d.toString());
      });

      child.stderr?.on('data', (d) => {
        this.emitLog(projectId, 'stderr', d.toString());
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.on('error', (err) => {
        this.emitLog(projectId, 'stderr', `Build error: ${err.message}`);
        resolve(false);
      });
    });
  }

  // Setup auto-sync watcher
  registerWatcher(project: Project) {
    if (!project.autoSync) {
      this.unregisterWatcher(project.id);
      return;
    }

    if (this.watchers.has(project.id)) {
      this.unregisterWatcher(project.id);
    }

    const watcher = chokidar.watch(project.sourcePath, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/.next/**',
        '**/__pycache__/**',
        '**/.venv/**',
      ],
      ignoreInitial: true,
      persistent: true,
    });

    watcher.on('all', (event, filePath) => {
      // Debounce sync trigger by 500ms
      const existingTimer = this.debounceTimers.get(project.id);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(() => {
        this.emitLog(
          project.id,
          'system',
          `[Auto-Watcher] Phát hiện thay đổi file (${event}: ${filePath.split('\\').pop()}) -> Tự động trigger sync...`
        );
        this.triggerSync(project.id);
      }, 500);

      this.debounceTimers.set(project.id, timer);
    });

    this.watchers.set(project.id, watcher);
  }

  unregisterWatcher(projectId: string) {
    const watcher = this.watchers.get(projectId);
    if (watcher) {
      watcher.close();
      this.watchers.delete(projectId);
    }
    const timer = this.debounceTimers.get(projectId);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(projectId);
    }
  }
}

export const syncEngine = new SyncEngine();
