import { execFile } from 'node:child_process';
import os from 'node:os';
import pidusage from 'pidusage';
import type { DeploymentTarget } from '../src/types';
import { projectStore } from './store';
import { processManager } from './process-manager';

export interface ProcessResourceStat {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface ProjectResourceTelemetry {
  projectId: string;
  projectName?: string;
  pid?: number;
  cpuPercent: number;
  memoryMb: number;
  processCount: number;
  target: DeploymentTarget;
  processes: ProcessResourceStat[];
  history: Array<{ timestamp: number; cpu: number; memoryMb: number }>;
}

export interface ResourcesSummary {
  totalAppMemoryMb: number;
  totalAppCpu: number;
  activeCount: number;
  systemTotalMemoryMb: number;
  systemFreeMemoryMb: number;
  topMemoryApp?: { name: string; memoryMb: number };
  topCpuApp?: { name: string; cpuPercent: number };
}

interface RawProcessItem {
  pid: number;
  ppid: number;
  name: string;
}

export class ResourceMonitor {
  private historyMap: Map<string, Array<{ timestamp: number; cpu: number; memoryMb: number }>> = new Map();
  private latestTelemetry: Map<string, ProjectResourceTelemetry> = new Map();
  private isPolling = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private onBroadcast?: (type: string, payload: any) => void;

  constructor(broadcastFn?: (type: string, payload: any) => void) {
    this.onBroadcast = broadcastFn;
  }

  public setBroadcast(fn: (type: string, payload: any) => void) {
    this.onBroadcast = fn;
  }

  public startPolling(intervalMs = 3000) {
    if (this.intervalTimer) return;
    this.intervalTimer = setInterval(() => {
      this.poll().catch((err) => {
        console.warn('[ResourceMonitor] Poll error:', err.message);
      });
    }, intervalMs);
    // Execute first tick immediately
    this.poll().catch(() => {});
  }

  public stopPolling() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private async fetchWindowsProcessTree(): Promise<RawProcessItem[]> {
    return new Promise((resolve) => {
      execFile(
        'powershell',
        ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name | ConvertTo-Json'],
        { maxBuffer: 10 * 1024 * 1024, timeout: 4500 },
        (err, stdout) => {
          if (err || !stdout) return resolve([]);
          try {
            const parsed = JSON.parse(stdout);
            const list = Array.isArray(parsed) ? parsed : [parsed];
            const result: RawProcessItem[] = list.map((item: any) => ({
              pid: Number(item.ProcessId || 0),
              ppid: Number(item.ParentProcessId || 0),
              name: String(item.Name || ''),
            }));
            resolve(result);
          } catch {
            resolve([]);
          }
        }
      );
    });
  }

  private async fetchDockerStats(): Promise<Map<string, { cpuPercent: number; memoryMb: number }>> {
    const map = new Map<string, { cpuPercent: number; memoryMb: number }>();
    return new Promise((resolve) => {
      execFile(
        'docker',
        ['stats', '--no-stream', '--format', '{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'],
        { timeout: 2000 },
        (err, stdout) => {
          if (err || !stdout) return resolve(map);
          const lines = stdout.split('\n');
          for (const line of lines) {
            const parts = line.trim().split('\t');
            if (parts.length >= 3) {
              const name = parts[0].trim();
              const cpuStr = parts[1].replace('%', '').trim();
              const memStr = parts[2].split('/')[0].trim(); // e.g. "45.2MiB" or "1.2GiB"

              const cpu = parseFloat(cpuStr) || 0;
              let memMb = 0;
              if (memStr.includes('GiB')) {
                memMb = parseFloat(memStr.replace('GiB', '')) * 1024;
              } else if (memStr.includes('MiB')) {
                memMb = parseFloat(memStr.replace('MiB', ''));
              } else if (memStr.includes('KiB')) {
                memMb = parseFloat(memStr.replace('KiB', '')) / 1024;
              }
              map.set(name, {
                cpuPercent: Math.round(cpu * 10) / 10,
                memoryMb: Math.round(memMb * 10) / 10,
              });
            }
          }
          resolve(map);
        }
      );
    });
  }

  public async poll() {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const allProjects = projectStore.getAll();
      const runningProjects = allProjects.filter((p) => p.status === 'running');

      // If no running projects, clear metrics
      if (runningProjects.length === 0) {
        let changed = false;
        for (const p of allProjects) {
          if (p.cpuPercent !== undefined || p.memoryMb !== undefined) {
            p.cpuPercent = undefined;
            p.memoryMb = undefined;
            projectStore.set(p);
            changed = true;
          }
        }
        if (changed && this.onBroadcast) {
          this.onBroadcast('project:resource_stats', []);
        }
        this.isPolling = false;
        return;
      }

      // 1. Separate native/wsl vs docker
      const nativeAndWsl = runningProjects.filter(
        (p) => (p.runtimeType === 'native' || p.runtimeType === 'wsl2') && p.pid
      );
      const dockerProjects = runningProjects.filter((p) => p.runtimeType === 'docker');

      // 2. Windows / WSL child process tree query
      let processTree: RawProcessItem[] = [];
      if (nativeAndWsl.length > 0 && process.platform === 'win32') {
        processTree = await this.fetchWindowsProcessTree();
      }

      // Map root PIDs to all descendant PIDs
      const projectProcessMap = new Map<string, Array<{ pid: number; name: string }>>();
      const allTargetPids: number[] = [];

      for (const proj of nativeAndWsl) {
        const rootPid = proj.pid!;
        const descendants: Array<{ pid: number; name: string }> = [];
        const queue = [rootPid];
        const visited = new Set<number>([rootPid]);

        const rootItem = processTree.find((p) => p.pid === rootPid);
        descendants.push({
          pid: rootPid,
          name: rootItem?.name || 'app-root',
        });
        allTargetPids.push(rootPid);

        while (queue.length > 0) {
          const curr = queue.shift()!;
          for (const item of processTree) {
            if (item.ppid === curr && !visited.has(item.pid)) {
              visited.add(item.pid);
              queue.push(item.pid);
              descendants.push({ pid: item.pid, name: item.name });
              allTargetPids.push(item.pid);
            }
          }
        }
        projectProcessMap.set(proj.id, descendants);
      }

      // 3. Query pidusage on all target PIDs
      let pidStatsMap: Record<number, { cpu: number; memory: number }> = {};
      if (allTargetPids.length > 0) {
        try {
          const rawStats = await pidusage(allTargetPids);
          pidStatsMap = rawStats as any;
        } catch (e) {
          // Fallback: query individual PIDs if batch fails
          for (const pid of allTargetPids) {
            try {
              const single = await pidusage(pid);
              pidStatsMap[pid] = single;
            } catch {
              // process likely exited
            }
          }
        }
      }

      // 4. Query docker stats if any docker projects
      let dockerStatsMap = new Map<string, { cpuPercent: number; memoryMb: number }>();
      if (dockerProjects.length > 0) {
        dockerStatsMap = await this.fetchDockerStats();
      }

      // 5. Aggregate metrics per project
      const now = Date.now();
      const telemetryList: ProjectResourceTelemetry[] = [];

      for (const proj of runningProjects) {
        let totalMemMb = 0;
        let totalCpu = 0;
        const processDetails: ProcessResourceStat[] = [];

        if (proj.runtimeType === 'docker') {
          // Find container matching project id or name
          const containerName = `windev-${proj.id.slice(0, 8)}`;
          const dStat = dockerStatsMap.get(containerName) || dockerStatsMap.get(proj.name);
          if (dStat) {
            totalMemMb = dStat.memoryMb;
            totalCpu = dStat.cpuPercent;
            processDetails.push({
              pid: 0,
              name: `container (${containerName})`,
              cpuPercent: totalCpu,
              memoryMb: totalMemMb,
            });
          }
        } else {
          // Native / WSL2
          const procList = projectProcessMap.get(proj.id) || [];
          for (const p of procList) {
            const stat = pidStatsMap[p.pid];
            if (stat) {
              const memMb = Math.round((stat.memory / (1024 * 1024)) * 10) / 10;
              const cpu = Math.round((stat.cpu || 0) * 10) / 10;
              totalMemMb += memMb;
              totalCpu += cpu;
              processDetails.push({
                pid: p.pid,
                name: p.name,
                cpuPercent: cpu,
                memoryMb: memMb,
              });
            }
          }
        }

        totalMemMb = Math.round(totalMemMb * 10) / 10;
        totalCpu = Math.round(totalCpu * 10) / 10;

        // Update project store
        proj.cpuPercent = totalCpu;
        proj.memoryMb = totalMemMb;
        projectStore.set(proj);

        // Update history
        let history = this.historyMap.get(proj.id);
        if (!history) {
          history = [];
          this.historyMap.set(proj.id, history);
        }
        history.push({ timestamp: now, cpu: totalCpu, memoryMb: totalMemMb });
        if (history.length > 30) history.shift();

        const telemetryItem: ProjectResourceTelemetry = {
          projectId: proj.id,
          projectName: proj.name,
          pid: proj.pid,
          cpuPercent: totalCpu,
          memoryMb: totalMemMb,
          processCount: processDetails.length || 1,
          target: proj.runtimeType,
          processes: processDetails,
          history: [...history],
        };

        this.latestTelemetry.set(proj.id, telemetryItem);
        telemetryList.push(telemetryItem);
      }

      // Broadcast telemetry to connected clients
      if (this.onBroadcast) {
        this.onBroadcast('project:resource_stats', telemetryList);

        // Also broadcast summary
        const summary = this.getSummary();
        this.onBroadcast('system:resources_summary', summary);
      }
    } finally {
      this.isPolling = false;
    }
  }

  public getProjectTelemetry(projectId: string): ProjectResourceTelemetry | null {
    return this.latestTelemetry.get(projectId) || null;
  }

  public getSummary(): ResourcesSummary {
    const totalMem = Math.round(os.totalmem() / (1024 * 1024));
    const freeMem = Math.round(os.freemem() / (1024 * 1024));

    let totalAppMemoryMb = 0;
    let totalAppCpu = 0;
    let activeCount = 0;

    let topMemoryApp: { name: string; memoryMb: number } | undefined;
    let topCpuApp: { name: string; cpuPercent: number } | undefined;

    for (const tel of this.latestTelemetry.values()) {
      totalAppMemoryMb += tel.memoryMb;
      totalAppCpu += tel.cpuPercent;
      activeCount++;

      if (!topMemoryApp || tel.memoryMb > topMemoryApp.memoryMb) {
        topMemoryApp = { name: tel.projectName || tel.projectId, memoryMb: tel.memoryMb };
      }
      if (!topCpuApp || tel.cpuPercent > topCpuApp.cpuPercent) {
        topCpuApp = { name: tel.projectName || tel.projectId, cpuPercent: tel.cpuPercent };
      }
    }

    return {
      totalAppMemoryMb: Math.round(totalAppMemoryMb * 10) / 10,
      totalAppCpu: Math.round(totalAppCpu * 10) / 10,
      activeCount,
      systemTotalMemoryMb: totalMem,
      systemFreeMemoryMb: freeMem,
      topMemoryApp,
      topCpuApp,
    };
  }
}

export const resourceMonitor = new ResourceMonitor();
