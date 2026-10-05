import http from 'node:http';
import { projectStore } from './store';
import { processManager } from './process-manager';

export interface ProjectHealth {
  projectId: string;
  status: 'healthy' | 'degraded' | 'down' | 'idle';
  httpStatus?: number;
  latencyMs?: number;
  lastChecked: string;
  consecutiveFailures: number;
  autoRecoveryEnabled: boolean;
}

export class HealthSentinelService {
  private healthMap = new Map<string, ProjectHealth>();
  private autoRecoveryMap = new Map<string, boolean>();
  private checkInterval: NodeJS.Timeout | null = null;
  private broadcastFn: ((type: string, payload: any) => void) | null = null;

  constructor() {
    this.startWatchdog();
  }

  setBroadcast(fn: (type: string, payload: any) => void) {
    this.broadcastFn = fn;
  }

  setAutoRecovery(projectId: string, enabled: boolean) {
    this.autoRecoveryMap.set(projectId, enabled);
    const existing = this.healthMap.get(projectId);
    if (existing) {
      existing.autoRecoveryEnabled = enabled;
    }
  }

  isAutoRecoveryEnabled(projectId: string): boolean {
    return this.autoRecoveryMap.get(projectId) ?? true;
  }

  getAllHealth(): ProjectHealth[] {
    const projects = projectStore.getAll();
    return projects.map((p) => {
      const existing = this.healthMap.get(p.id);
      if (existing) return existing;
      return {
        projectId: p.id,
        status: p.status === 'running' ? 'healthy' : 'idle',
        lastChecked: new Date().toISOString(),
        consecutiveFailures: 0,
        autoRecoveryEnabled: this.isAutoRecoveryEnabled(p.id),
      };
    });
  }

  private pingProject(port: number, timeoutMs = 2500): Promise<{ ok: boolean; status?: number; latencyMs: number }> {
    return new Promise((resolve) => {
      const start = Date.now();
      const req = http.get(
        {
          host: '127.0.0.1',
          port,
          path: '/',
          timeout: timeoutMs,
        },
        (res) => {
          const latency = Date.now() - start;
          res.resume(); // consume response body
          resolve({ ok: res.statusCode !== undefined && res.statusCode < 500, status: res.statusCode, latencyMs: latency });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, latencyMs: timeoutMs });
      });

      req.on('error', () => {
        resolve({ ok: false, latencyMs: Date.now() - start });
      });
    });
  }

  private async checkAll() {
    const projects = projectStore.getAll();

    for (const project of projects) {
      if (project.status !== 'running' || !project.port) {
        this.healthMap.set(project.id, {
          projectId: project.id,
          status: 'idle',
          lastChecked: new Date().toISOString(),
          consecutiveFailures: 0,
          autoRecoveryEnabled: this.isAutoRecoveryEnabled(project.id),
        });
        continue;
      }

      const res = await this.pingProject(project.port);
      const current = this.healthMap.get(project.id) || {
        projectId: project.id,
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        consecutiveFailures: 0,
        autoRecoveryEnabled: this.isAutoRecoveryEnabled(project.id),
      };

      current.lastChecked = new Date().toISOString();
      current.httpStatus = res.status;
      current.latencyMs = res.latencyMs;

      if (res.ok) {
        current.status = res.latencyMs > 800 ? 'degraded' : 'healthy';
        current.consecutiveFailures = 0;
      } else {
        current.status = 'down';
        current.consecutiveFailures += 1;

        // Auto-Recovery Trigger: Restart process if down 2 times in a row
        if (current.consecutiveFailures >= 2 && current.autoRecoveryEnabled) {
          console.log(`🩺 [Health Sentinel] Project "${project.name}" is DOWN! Triggering Auto-Recovery restart...`);
          current.consecutiveFailures = 0;
          try {
            await processManager.restart(project);
            if (this.broadcastFn) {
              this.broadcastFn('sentinel:recovered', {
                projectId: project.id,
                projectName: project.name,
                message: `Đã tự động khởi động lại "${project.name}" sau sự cố mất kết nối port ${project.port}.`,
              });
            }
          } catch (err: any) {
            console.error(`Auto-recovery failed for ${project.name}:`, err.message);
          }
        }
      }

      this.healthMap.set(project.id, current);
    }

    if (this.broadcastFn) {
      this.broadcastFn('sentinel:update', this.getAllHealth());
    }
  }

  private startWatchdog() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.checkAll().catch(console.error);
    }, 12000);
  }
}

export const healthSentinel = new HealthSentinelService();
