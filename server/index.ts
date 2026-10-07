import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { projectStore } from './store';
import { processManager } from './process-manager';
import { dockerManager } from './docker-manager';
import { gitManager } from './git-manager';
import { portManager } from './port-manager';
import { envManager } from './env-manager';
import { syncEngine } from './sync-engine';
import { detectProject } from './detector';
import { diskCleaner } from './disk-cleaner';
import { scriptsManager } from './scripts-manager';
import { dbInspector } from './db-inspector';
import { proxyManager } from './proxy-manager';
import { healthSentinel } from './health-sentinel';
import { aiCopilot } from './ai-copilot';
import { envDiffManager } from './env-diff-manager';
import { projectScaffold } from './project-scaffold';
import { analyticsTracker } from './analytics-tracker';
import { wslDockerCommander } from './wsl-docker-commander';
import { architectureGraphService } from './architecture-graph';
import { dependencyDoctor } from './dependency-doctor';
import { resourceMonitor } from './resource-monitor';
import { folderChooserService } from './folder-chooser';
import { logAggregator } from './log-aggregator';
import { gitMatrixService } from './git-matrix';
import { windowsTuningService } from './windows-tuning';
import { meshDiscovery } from './mesh-discovery';
import type { CreateProjectPayload, Project, LogEntry, ProcessPriority, MeshConfig, MeshAuditLog, TeamPortClash } from '../src/types';

const PORT = 4100;
const server = http.createServer();
const wss = new WebSocketServer({ noServer: true });

const clients = new Set<WebSocket>();

function broadcast(type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function sendProjectLog(projectId: string, log: LogEntry, target: 'windows' | 'wsl' | 'docker' = 'windows') {
  broadcast('project:log', { projectId, log });
  logAggregator.add(projectId, log, target);
}

syncEngine.setBroadcast(broadcast);
healthSentinel.setBroadcast(broadcast);
resourceMonitor.setBroadcast(broadcast);
resourceMonitor.startPolling(3000);
logAggregator.setBroadcast(broadcast);
meshDiscovery.setBroadcast(broadcast);
meshDiscovery.start();

// Remote action executor for peer requests (Phase 2)
meshDiscovery.setActionExecutor(async (projectId: string, action: 'restart' | 'sync' | 'stop' | 'start') => {
  const project = projectStore.get(projectId);
  if (!project) throw new Error('Không tìm thấy dự án');

  if (action === 'sync') {
    return await syncEngine.triggerSync(projectId);
  }

  const targetType = project.runtimeType === 'wsl2' ? 'wsl' : project.runtimeType === 'docker' ? 'docker' : 'windows';

  if (action === 'stop' || action === 'restart') {
    if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
      await processManager.stop(projectId);
    } else {
      await dockerManager.stop(projectId, project.sourcePath, (log) => sendProjectLog(projectId, log, 'docker'));
    }
    project.status = 'stopped';
    project.pid = undefined;
    project.cpuPercent = undefined;
    project.memoryMb = undefined;
    projectStore.set(project);
    broadcast('project:update', project);
  }

  if (action === 'start' || action === 'restart') {
    if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
      const { pid } = processManager.start(
        project.id,
        project.sourcePath,
        project.runCommand,
        (log) => sendProjectLog(project.id, log, targetType),
        (code) => {
          const p = projectStore.get(project.id);
          if (p) {
            p.status = code === 0 ? 'stopped' : 'error';
            p.pid = undefined;
            projectStore.set(p);
            broadcast('project:update', p);
          }
        },
        project.runtimeType
      );
      project.pid = pid;
      project.status = 'running';
    } else {
      dockerManager.start(
        project.id,
        project.sourcePath,
        project.runCommand,
        (log) => sendProjectLog(project.id, log, 'docker'),
        (code) => {
          const p = projectStore.get(project.id);
          if (p) {
            p.status = code === 0 ? 'stopped' : 'error';
            p.pid = undefined;
            projectStore.set(p);
            broadcast('project:update', p);
          }
        }
      );
      project.status = 'running';
    }
    projectStore.set(project);
    broadcast('project:update', project);
  }

  return { success: true };
});

let lastCpuMeasure = os.cpus();
function calculateCpuUsage(): number {
  const current = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;
  for (let i = 0; i < current.length; i++) {
    const prevTimes = lastCpuMeasure[i]?.times;
    const currTimes = current[i]?.times;
    if (prevTimes && currTimes) {
      const prevTotal = prevTimes.user + prevTimes.nice + prevTimes.sys + prevTimes.idle + prevTimes.irq;
      const currTotal = currTimes.user + currTimes.nice + currTimes.sys + currTimes.idle + currTimes.irq;
      totalDiff += currTotal - prevTotal;
      idleDiff += currTimes.idle - prevTimes.idle;
    }
  }
  lastCpuMeasure = current;
  if (totalDiff <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((totalDiff - idleDiff) / totalDiff) * 100)));
}

async function getSystemStats() {
  const dockerAvailable = await dockerManager.isAvailable();
  const cpus = os.cpus();
  return {
    dockerAvailable,
    totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024)),
    freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
    cpuUsage: calculateCpuUsage(),
    activeProcesses: projectStore.getAll().filter((p) => p.status === 'running').length,
    cpuModel: cpus[0]?.model?.trim() || 'Intel / AMD Processor',
    cpuCores: cpus.length,
    cpuSpeedMhz: cpus[0]?.speed || 0,
    osName: 'Windows 11',
    osRelease: os.release(),
    osArch: os.arch(),
    hostname: os.hostname(),
    uptimeSeconds: Math.round(os.uptime()),
  };
}

// WebSocket Connection handling
wss.on('connection', async (ws) => {
  clients.add(ws);

  // Send initial data
  ws.send(JSON.stringify({ type: 'projects:all', payload: projectStore.getAll() }));
  ws.send(JSON.stringify({ type: 'mesh:nodes_updated', payload: meshDiscovery.getAllNodes() }));
  ws.send(JSON.stringify({ type: 'mesh:catalog_updated', payload: meshDiscovery.getTeamCatalog() }));
  ws.send(JSON.stringify({ type: 'mesh:config_updated', payload: meshDiscovery.getConfig() }));
  ws.send(JSON.stringify({ type: 'mesh:audit_logs_updated', payload: meshDiscovery.getAuditLogs() }));

  // Send system stats immediately
  try {
    const stats = await getSystemStats();
    ws.send(JSON.stringify({ type: 'system:stats', payload: stats }));
  } catch (e) {
    console.error('Failed to send initial system stats', e);
  }

  ws.on('close', () => {
    clients.delete(ws);
  });
});

// Broadcast live telemetry every 3 seconds to active connected clients
setInterval(async () => {
  if (clients.size > 0) {
    try {
      const stats = await getSystemStats();
      broadcast('system:stats', stats);
    } catch (e) {
      // ignore
    }
  }
}, 3000);

// Upgrade HTTP to WS
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  if (url.pathname === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// Helper for parsing JSON body
function parseBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : ({} as T));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// REST Request handler
server.on('request', async (req, res) => {
  const parsedUrl = new URL(req.url || '', `http://${req.headers.host}`);
  const url = parsedUrl;
  const pathname = parsedUrl.pathname;
  const method = req.method?.toUpperCase();

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Mesh-Token, X-Mesh-Actor-NodeId, X-Mesh-Actor-Hostname, X-Mesh-Actor-Username');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // GET /api/projects
    if (method === 'GET' && pathname === '/api/projects') {
      res.writeHead(200);
      res.end(JSON.stringify(projectStore.getAll()));
      return;
    }

    // POST /api/detect-project
    if (method === 'POST' && pathname === '/api/detect-project') {
      const body = await parseBody<{ path: string }>(req);
      const detection = detectProject(body.path);
      res.writeHead(200);
      res.end(JSON.stringify(detection));
      return;
    }

    // POST /api/projects
    if (method === 'POST' && pathname === '/api/projects') {
      const body = await parseBody<CreateProjectPayload>(req);

      let targetPath = body.sourcePath;

      // If Git source, clone repo
      if (body.sourceType === 'git' && body.gitUrl) {
        targetPath = await gitManager.cloneRepo(
          body.gitUrl,
          body.gitBranch || 'main',
          body.gitToken,
          (log) => broadcast('project:log', { projectId: 'git-importer', log })
        );
      }

      const newProject: Project = {
        id: crypto.randomUUID(),
        name: body.name,
        sourceType: body.sourceType,
        sourcePath: targetPath,
        gitUrl: body.gitUrl,
        gitBranch: body.gitBranch,
        runtimeType: body.runtimeType,
        runCommand: body.runCommand,
        buildCommand: body.buildCommand,
        port: body.port,
        status: 'stopped',
        autoSync: !!body.autoSync,
        syncCount: 0,
        createdAt: new Date().toISOString(),
      };

      projectStore.set(newProject);
      if (newProject.autoSync) {
        syncEngine.registerWatcher(newProject);
      }

      broadcast('project:update', newProject);
      res.writeHead(201);
      res.end(JSON.stringify(newProject));
      return;
    }

    // Project action matches: /api/projects/:id/:action
    const match = pathname.match(/^\/api\/projects\/([^/]+)(?:\/([^/]+))?$/);
    if (match) {
      const id = match[1];
      const action = match[2];

      const project = projectStore.get(id);
      if (!project) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Project not found' }));
        return;
      }

      // DELETE /api/projects/:id
      if (method === 'DELETE' && !action) {
        if (project.status === 'running') {
          await processManager.stop(id);
        }
        syncEngine.unregisterWatcher(id);
        projectStore.delete(id);
        broadcast('project:removed', { id });
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // POST /api/projects/:id/start
      if (method === 'POST' && action === 'start') {
        project.status = 'running';

        const targetType = project.runtimeType === 'wsl2' ? 'wsl' : project.runtimeType === 'docker' ? 'docker' : 'windows';

        if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
          const { pid } = processManager.start(
            project.id,
            project.sourcePath,
            project.runCommand,
            (log) => sendProjectLog(project.id, log, targetType),
            (code) => {
              const p = projectStore.get(project.id);
              if (p) {
                p.status = code === 0 ? 'stopped' : 'error';
                p.pid = undefined;
                p.cpuPercent = undefined;
                p.memoryMb = undefined;
                projectStore.set(p);
                broadcast('project:update', p);
              }
            },
            project.runtimeType
          );
          project.pid = pid;

          // Auto-apply saved Windows Priority / EcoQoS if native
          if (project.runtimeType === 'native') {
            const tuning = windowsTuningService.getConfig(project.id);
            windowsTuningService.setProcessPriority(project.id, tuning.priority, tuning.isEcoMode).catch(() => {});
          }
        } else {
          dockerManager.start(
            project.id,
            project.sourcePath,
            project.runCommand,
            (log) => sendProjectLog(project.id, log, 'docker'),
            (code) => {
              const p = projectStore.get(project.id);
              if (p) {
                p.status = code === 0 ? 'stopped' : 'error';
                projectStore.set(p);
                broadcast('project:update', p);
              }
            }
          );
        }

        projectStore.set(project);
        broadcast('project:update', project);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, project }));
        return;
      }

      // POST /api/projects/:id/stop
      if (method === 'POST' && action === 'stop') {
        const targetType = project.runtimeType === 'wsl2' ? 'wsl' : project.runtimeType === 'docker' ? 'docker' : 'windows';
        if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
          await processManager.stop(id);
        } else {
          await dockerManager.stop(id, project.sourcePath, (log) =>
            sendProjectLog(id, log, 'docker')
          );
        }
        project.status = 'stopped';
        project.pid = undefined;
        project.cpuPercent = undefined;
        project.memoryMb = undefined;
        projectStore.set(project);
        broadcast('project:update', project);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, project }));
        return;
      }

      // POST /api/projects/:id/restart
      if (method === 'POST' && action === 'restart') {
        const targetType = project.runtimeType === 'wsl2' ? 'wsl' : project.runtimeType === 'docker' ? 'docker' : 'windows';
        if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
          await processManager.stop(id);
          const { pid } = processManager.start(
            id,
            project.sourcePath,
            project.runCommand,
            (log) => sendProjectLog(id, log, targetType),
            (code) => {
              const p = projectStore.get(id);
              if (p) {
                p.status = code === 0 ? 'stopped' : 'error';
                p.pid = undefined;
                projectStore.set(p);
                broadcast('project:update', p);
              }
            },
            project.runtimeType
          );
          project.pid = pid;

          if (project.runtimeType === 'native') {
            const tuning = windowsTuningService.getConfig(project.id);
            windowsTuningService.setProcessPriority(project.id, tuning.priority, tuning.isEcoMode).catch(() => {});
          }
        } else {
          await dockerManager.stop(id, project.sourcePath, (log) =>
            sendProjectLog(id, log, 'docker')
          );
          dockerManager.start(
            id,
            project.sourcePath,
            project.runCommand,
            (log) => sendProjectLog(id, log, 'docker'),
            () => {}
          );
        }
        project.status = 'running';
        projectStore.set(project);
        broadcast('project:update', project);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, project }));
        return;
      }

      // POST /api/projects/:id/target  --> 1-CLICK DYNAMIC TARGET SWITCHER
      if (method === 'POST' && action === 'target') {
        const body = await parseBody<{ target: 'native' | 'wsl2' | 'docker' }>(req);
        if (!['native', 'wsl2', 'docker'].includes(body.target)) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Mục tiêu không hợp lệ' }));
          return;
        }

        const wasRunning = project.status === 'running';
        if (wasRunning) {
          if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
            await processManager.stop(id);
          } else {
            await dockerManager.stop(id, project.sourcePath, () => {});
          }
        }

        project.runtimeType = body.target;
        project.pid = undefined;

        if (wasRunning) {
          if (project.runtimeType === 'native' || project.runtimeType === 'wsl2') {
            const { pid } = processManager.start(
              project.id,
              project.sourcePath,
              project.runCommand,
              (log) => broadcast('project:log', { projectId: project.id, log }),
              (code) => {
                const p = projectStore.get(project.id);
                if (p) {
                  p.status = code === 0 ? 'stopped' : 'error';
                  p.pid = undefined;
                  projectStore.set(p);
                  broadcast('project:update', p);
                }
              },
              project.runtimeType
            );
            project.pid = pid;
            project.status = 'running';
          } else {
            dockerManager.start(
              project.id,
              project.sourcePath,
              project.runCommand,
              (log) => broadcast('project:log', { projectId: project.id, log }),
              (code) => {
                const p = projectStore.get(project.id);
                if (p) {
                  p.status = code === 0 ? 'stopped' : 'error';
                  projectStore.set(p);
                  broadcast('project:update', p);
                }
              }
            );
            project.status = 'running';
          }
        }

        projectStore.set(project);
        broadcast('project:update', project);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, project }));
        return;
      }

      // GET /api/projects/:id/deployments
      if (method === 'GET' && action === 'deployments') {
        const history = syncEngine.getDeployments(id);
        res.writeHead(200);
        res.end(JSON.stringify(history));
        return;
      }

      // POST /api/projects/:id/sync  --> CORE TRIGGER DEPLOY ACTION
      if (method === 'POST' && action === 'sync') {
        const result = await syncEngine.triggerSync(id);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // POST /api/projects/:id/open-folder
      if (method === 'POST' && action === 'open-folder') {
        spawn('explorer.exe', [project.sourcePath], { detached: true });
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }

      // GET /api/projects/:id/env
      if (method === 'GET' && action === 'env') {
        const envData = envManager.getEnv(project.sourcePath);
        res.writeHead(200);
        res.end(JSON.stringify(envData));
        return;
      }

      // POST /api/projects/:id/env
      if (method === 'POST' && action === 'env') {
        const body = await parseBody<{ items: Array<{ key: string; value: string }> }>(req);
        const result = envManager.saveEnv(project.sourcePath, body.items || []);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // GET /api/projects/:id/git
      if (method === 'GET' && action === 'git') {
        const gitStatus = await gitManager.getRepoStatus(project.sourcePath);
        res.writeHead(200);
        res.end(JSON.stringify(gitStatus));
        return;
      }

      // POST /api/projects/:id/git-pull
      if (method === 'POST' && action === 'git-pull') {
        const pullResult = await gitManager.gitPull(project.sourcePath);
        res.writeHead(200);
        res.end(JSON.stringify(pullResult));
        return;
      }

      // GET /api/projects/:id/clean-scan (Disk Cleaner Scan)
      if (method === 'GET' && action === 'clean-scan') {
        const scan = diskCleaner.scanProject(project.sourcePath);
        res.writeHead(200);
        res.end(JSON.stringify(scan));
        return;
      }

      // POST /api/projects/:id/clean (Disk Cleaner Purge)
      if (method === 'POST' && action === 'clean') {
        const body = await parseBody<{ targets: string[] }>(req);
        const result = diskCleaner.cleanTargets(project.sourcePath, body.targets || []);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // GET /api/projects/:id/scripts (NPM Scripts list)
      if (method === 'GET' && action === 'scripts') {
        const result = scriptsManager.getScripts(project.sourcePath);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // POST /api/projects/:id/scripts/run (Run NPM Script)
      if (method === 'POST' && action === 'scripts' && url.searchParams.get('run') === 'true') {
        const body = await parseBody<{ scriptName: string; packageManager?: string }>(req);
        const runRes = await scriptsManager.runScript(project.sourcePath, body.scriptName, body.packageManager);
        res.writeHead(200);
        res.end(JSON.stringify(runRes));
        return;
      }

      // GET /api/projects/:id/db (Database Inspector)
      if (method === 'GET' && action === 'db') {
        const dbs = await dbInspector.inspectProject(project.sourcePath);
        res.writeHead(200);
        res.end(JSON.stringify(dbs));
        return;
      }

      // POST /api/projects/:id/db/redis-flush
      if (method === 'POST' && action === 'db' && url.searchParams.get('flush') === 'redis') {
        const body = await parseBody<{ host?: string; port?: number }>(req);
        const result = await dbInspector.flushRedis(body.host || 'localhost', body.port || 6379);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      // POST /api/projects/:id/sentinel/toggle
      if (method === 'POST' && action === 'sentinel' && url.searchParams.get('toggle') === 'auto-recovery') {
        const body = await parseBody<{ enabled: boolean }>(req);
        healthSentinel.setAutoRecovery(project.id, body.enabled);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, enabled: body.enabled }));
        return;
      }
    }

    // GET /api/ports/radar
    if (method === 'GET' && pathname === '/api/ports/radar') {
      const activeProjectPorts = projectStore.getAll().map((p) => p.port).filter(Boolean) as number[];
      const ports = await portManager.scanCommonPorts(activeProjectPorts);
      res.writeHead(200);
      res.end(JSON.stringify(ports));
      return;
    }

    // POST /api/ports/kill
    if (method === 'POST' && pathname === '/api/ports/kill') {
      const body = await parseBody<{ port: number }>(req);
      const result = await portManager.killPort(body.port);
      res.writeHead(result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // GET /api/ports/team-clashes (Phase 3: Cross-Node Port Radar)
    if (method === 'GET' && pathname === '/api/ports/team-clashes') {
      const allTeamProjects = meshDiscovery.getTeamCatalog();
      const portMap = new Map<number, Array<{
        id: string;
        name: string;
        nodeId?: string;
        nodeName?: string;
        isRemote?: boolean;
        ip?: string;
        status: string;
      }>>();

      for (const p of allTeamProjects) {
        if (!p.port) continue;
        const list = portMap.get(p.port) || [];
        list.push({
          id: p.id,
          name: p.name,
          nodeId: p.nodeId,
          nodeName: p.nodeName,
          isRemote: p.isRemote,
          ip: p.remoteUrl ? (() => { try { return new URL(p.remoteUrl).hostname; } catch { return undefined; } })() : undefined,
          status: p.status,
        });
        portMap.set(p.port, list);
      }

      const clashes: TeamPortClash[] = [];
      for (const [port, projs] of portMap.entries()) {
        if (projs.length > 1) {
          clashes.push({ port, projects: projs });
        }
      }

      res.writeHead(200);
      res.end(JSON.stringify(clashes));
      return;
    }

    // GET /api/sentinel/status
    if (method === 'GET' && pathname === '/api/sentinel/status') {
      const statuses = healthSentinel.getAllHealth();
      res.writeHead(200);
      res.end(JSON.stringify(statuses));
      return;
    }

    // POST /api/ai/diagnose
    if (method === 'POST' && pathname === '/api/ai/diagnose') {
      const body = await parseBody<{ logText: string; projectName?: string }>(req);
      const diagnosis = aiCopilot.diagnoseError(body.logText, body.projectName);
      res.writeHead(200);
      res.end(JSON.stringify(diagnosis));
      return;
    }

    // GET & POST /api/proxy/routes
    if (pathname === '/api/proxy/routes') {
      if (method === 'GET') {
        res.writeHead(200);
        res.end(JSON.stringify(proxyManager.getRoutes()));
        return;
      }
      if (method === 'POST') {
        const body = await parseBody<{
          domain: string;
          targetPort: number;
          targetHost?: string;
          isRemote?: boolean;
          nodeName?: string;
        }>(req);
        const route = proxyManager.addRoute(
          body.domain,
          body.targetPort,
          body.targetHost,
          body.isRemote,
          body.nodeName
        );
        res.writeHead(201);
        res.end(JSON.stringify(route));
        return;
      }
    }

    // DELETE /api/proxy/routes/:id
    const proxyDeleteMatch = pathname.match(/^\/api\/proxy\/routes\/([^/]+)$/);
    if (method === 'DELETE' && proxyDeleteMatch) {
      const success = proxyManager.deleteRoute(proxyDeleteMatch[1]);
      res.writeHead(200);
      res.end(JSON.stringify({ success }));
      return;
    }

    // GET /api/proxy/hosts-command
    if (method === 'GET' && pathname === '/api/proxy/hosts-command') {
      const domain = url.searchParams.get('domain') || 'app.local';
      const targetHost = url.searchParams.get('targetHost') || undefined;
      const cmd = proxyManager.getWindowsHostsCommand(domain, targetHost);
      res.writeHead(200);
      res.end(JSON.stringify({ domain, targetHost, command: cmd }));
      return;
    }

    // GET /api/env/diff?projectA=...&projectB=...
    if (method === 'GET' && pathname === '/api/env/diff') {
      const idA = url.searchParams.get('projectA');
      const idB = url.searchParams.get('projectB');
      const projA = idA ? projectStore.getById(idA) : null;
      const projB = idB ? projectStore.getById(idB) : null;
      if (!projA || !projB) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Vui lòng chọn 2 dự án hợp lệ để so sánh' }));
        return;
      }
      const diff = envDiffManager.compareEnvs(projA.sourcePath, projB.sourcePath);
      res.writeHead(200);
      res.end(JSON.stringify(diff));
      return;
    }

    // POST /api/env/sync-key
    if (method === 'POST' && pathname === '/api/env/sync-key') {
      const body = await parseBody<{ sourceProjectId: string; targetProjectId: string; key: string }>(req);
      const projA = projectStore.getById(body.sourceProjectId);
      const projB = projectStore.getById(body.targetProjectId);
      if (!projA || !projB) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Dự án không tồn tại' }));
        return;
      }
      const syncRes = envDiffManager.syncKeyToTarget(projA.sourcePath, projB.sourcePath, body.key);
      res.writeHead(200);
      res.end(JSON.stringify(syncRes));
      return;
    }

    // POST /api/projects/scaffold
    if (method === 'POST' && pathname === '/api/projects/scaffold') {
      const body = await parseBody<any>(req);
      const result = await projectScaffold.scaffoldProject(body);
      res.writeHead(result.success ? 201 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // GET /api/analytics
    if (method === 'GET' && pathname === '/api/analytics') {
      const summary = analyticsTracker.getSummary();
      res.writeHead(200);
      res.end(JSON.stringify(summary));
      return;
    }

    // GET /api/deployments/all
    if (method === 'GET' && pathname === '/api/deployments/all') {
      const allDeploys = syncEngine.getDeployments();
      res.writeHead(200);
      res.end(JSON.stringify(allDeploys));
      return;
    }

    // --- 🐳 DOCKER FLEET & WSL2 COMMANDER ---
    if (method === 'GET' && pathname === '/api/fleet/docker') {
      const data = await wslDockerCommander.getDockerFleet();
      res.writeHead(200);
      res.end(JSON.stringify(data));
      return;
    }

    if (method === 'POST' && pathname === '/api/fleet/docker/prune') {
      const result = await wslDockerCommander.pruneDocker();
      res.writeHead(result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    const dockerActionMatch = pathname.match(/^\/api\/fleet\/docker\/([^/]+)\/([^/]+)$/);
    if (method === 'POST' && dockerActionMatch) {
      const containerId = dockerActionMatch[1];
      const action = dockerActionMatch[2] as 'start' | 'stop' | 'restart' | 'remove';
      const result = await wslDockerCommander.containerAction(containerId, action);
      res.writeHead(result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    if (method === 'GET' && pathname === '/api/fleet/wsl') {
      const distros = await wslDockerCommander.getWslDistros();
      const config = wslDockerCommander.getWslConfig();
      res.writeHead(200);
      res.end(JSON.stringify({ ...distros, config }));
      return;
    }

    if (method === 'POST' && pathname === '/api/fleet/wsl/config') {
      const body = await parseBody<{ memory: string; processors: string }>(req);
      const result = wslDockerCommander.saveWslConfig(body.memory, body.processors);
      res.writeHead(result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // --- 🗺️ MICROSERVICES ARCHITECTURE GRAPH ---
    if (method === 'GET' && pathname === '/api/architecture/graph') {
      const topology = await architectureGraphService.getTopology();
      res.writeHead(200);
      res.end(JSON.stringify(topology));
      return;
    }

    // --- 🩹 DEPENDENCY VULNERABILITY & LOCKFILE DOCTOR ---
    const doctorMatch = pathname.match(/^\/api\/projects\/([^/]+)\/doctor(?:\/([^/]+))?$/);
    if (doctorMatch) {
      const projId = doctorMatch[1];
      const subAction = doctorMatch[2];
      const proj = projectStore.get(projId);
      if (!proj) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Project not found' }));
        return;
      }

      if (method === 'GET' && !subAction) {
        const report = await dependencyDoctor.audit(proj.sourcePath, proj.id);
        res.writeHead(200);
        res.end(JSON.stringify(report));
        return;
      }

      if (method === 'POST' && subAction === 'fix') {
        const fixResult = await dependencyDoctor.fix(proj.sourcePath);
        res.writeHead(fixResult.success ? 200 : 400);
        res.end(JSON.stringify(fixResult));
        return;
      }
    }

    // --- 📊 PER-APP LIVE RESOURCE MONITORING ---
    const resourceMatch = pathname.match(/^\/api\/projects\/([^/]+)\/resources$/);
    if (resourceMatch && method === 'GET') {
      const projId = resourceMatch[1];
      const telemetry = resourceMonitor.getProjectTelemetry(projId);
      res.writeHead(200);
      res.end(
        JSON.stringify(
          telemetry || {
            projectId: projId,
            cpuPercent: 0,
            memoryMb: 0,
            processCount: 0,
            processes: [],
            history: [],
          }
        )
      );
      return;
    }

    if (method === 'GET' && pathname === '/api/resources/summary') {
      const summary = resourceMonitor.getSummary();
      res.writeHead(200);
      res.end(JSON.stringify(summary));
      return;
    }

    // --- 📂 NATIVE WINDOWS FOLDER CHOOSER & DIRECTORY EXPLORER ---
    if (method === 'POST' && pathname === '/api/system/browse-folder') {
      const body = await parseBody<{ initialPath?: string }>(req);
      const result = await folderChooserService.openNativeDialog(body.initialPath);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    if (method === 'GET' && pathname === '/api/system/list-directories') {
      const targetPath = parsedUrl.searchParams.get('path') || undefined;
      const result = folderChooserService.listDirectory(targetPath);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    // =========================================================================
    // 📜 PILLAR 2: UNIFIED LOG AGGREGATOR ("LOCAL DATADOG" CHO MICROSERVICES)
    // =========================================================================
    if (pathname === '/api/logs/aggregated') {
      if (method === 'GET') {
        const projectIdsParam = parsedUrl.searchParams.get('projectIds');
        const levelsParam = parsedUrl.searchParams.get('levels');
        const search = parsedUrl.searchParams.get('search') || undefined;
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '500', 10);

        const projectIds = projectIdsParam ? projectIdsParam.split(',').filter(Boolean) : undefined;
        const levels = levelsParam ? (levelsParam.split(',').filter(Boolean) as any) : undefined;

        const logs = logAggregator.getLogs({ projectIds, levels, search, limit });
        res.writeHead(200);
        res.end(JSON.stringify(logs));
        return;
      }

      if (method === 'DELETE') {
        logAggregator.clear();
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
        return;
      }
    }

    if (method === 'GET' && pathname === '/api/logs/export') {
      const format = parsedUrl.searchParams.get('format') || 'text';
      const projectIdsParam = parsedUrl.searchParams.get('projectIds');
      const levelsParam = parsedUrl.searchParams.get('levels');
      const search = parsedUrl.searchParams.get('search') || undefined;
      const projectIds = projectIdsParam ? projectIdsParam.split(',').filter(Boolean) : undefined;
      const levels = levelsParam ? (levelsParam.split(',').filter(Boolean) as any) : undefined;

      const filter = { projectIds, levels, search };

      if (format === 'json') {
        const data = logAggregator.exportAsJson(filter);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="windev-logs.json"');
        res.writeHead(200);
        res.end(data);
        return;
      } else {
        const data = logAggregator.exportAsText(filter);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="windev-logs.log"');
        res.writeHead(200);
        res.end(data);
        return;
      }
    }

    // =========================================================================
    // 🌿 PILLAR 4: CROSS-REPO GIT MATRIX (ĐỒNG BỘ NHÁNH MICROSERVICES ĐA REPO)
    // =========================================================================
    if (pathname === '/api/git-matrix/status' && method === 'GET') {
      const status = await gitMatrixService.getMatrixStatus();
      res.writeHead(200);
      res.end(JSON.stringify(status));
      return;
    }

    if (pathname === '/api/git-matrix/checkout-all' && method === 'POST') {
      const body = await parseBody<{ branch: string; createIfMissing?: boolean }>(req);
      const results = await gitMatrixService.batchCheckout(body.branch, body.createIfMissing);
      res.writeHead(200);
      res.end(JSON.stringify(results));
      return;
    }

    if (pathname === '/api/git-matrix/pull-all' && method === 'POST') {
      const results = await gitMatrixService.batchPull();
      res.writeHead(200);
      res.end(JSON.stringify(results));
      return;
    }

    if (pathname === '/api/git-matrix/stash-all' && method === 'POST') {
      const body = await parseBody<{ message?: string }>(req);
      const results = await gitMatrixService.batchStash(body.message);
      res.writeHead(200);
      res.end(JSON.stringify(results));
      return;
    }

    const gitSingleMatch = pathname.match(/^\/api\/git-matrix\/([^/]+)\/(checkout|pull|stash)$/);
    if (gitSingleMatch && method === 'POST') {
      const projId = gitSingleMatch[1];
      const actionType = gitSingleMatch[2];

      if (actionType === 'checkout') {
        const body = await parseBody<{ branch: string; createIfMissing?: boolean }>(req);
        const result = await gitMatrixService.checkoutRepo(projId, body.branch, body.createIfMissing);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (actionType === 'pull') {
        const result = await gitMatrixService.pullRepo(projId);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }

      if (actionType === 'stash') {
        const body = await parseBody<{ message?: string }>(req);
        const result = await gitMatrixService.stashRepo(projId, body.message);
        res.writeHead(200);
        res.end(JSON.stringify(result));
        return;
      }
    }

    // =========================================================================
    // ⚡ PILLAR 5: WINDOWS 11 DEEP PERFORMANCE & DEV DRIVE (REFS) AUDIT
    // =========================================================================
    if (pathname === '/api/tuning/projects' && method === 'GET') {
      const status = await windowsTuningService.getProjectsPriorityStatus();
      res.writeHead(200);
      res.end(JSON.stringify(status));
      return;
    }

    if (pathname === '/api/tuning/project-priority' && method === 'POST') {
      const body = await parseBody<{ projectId: string; priority: ProcessPriority; isEcoMode?: boolean }>(req);
      const result = await windowsTuningService.setProcessPriority(body.projectId, body.priority, !!body.isEcoMode);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    if (pathname === '/api/tuning/batch-eco' && method === 'POST') {
      const body = await parseBody<{ enable: boolean }>(req);
      const result = await windowsTuningService.batchSetEcoMode(body.enable);
      res.writeHead(200);
      res.end(JSON.stringify(result));
      return;
    }

    if (pathname === '/api/tuning/dev-drive-audit' && method === 'GET') {
      const report = await windowsTuningService.auditDevDrives();
      res.writeHead(200);
      res.end(JSON.stringify(report));
      return;
    }

    // =========================================================================
    // 🌐 PILLAR 6: TEAM MESH & PEER DISCOVERY (LAN/WLAN & TAILSCALE)
    // =========================================================================
    if (pathname === '/api/mesh/nodes' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(meshDiscovery.getAllNodes()));
      return;
    }

    if (pathname === '/api/mesh/shared-apps' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(meshDiscovery.getSharedProjects(false)));
      return;
    }

    if (pathname === '/api/mesh/catalog' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(meshDiscovery.getTeamCatalog()));
      return;
    }

    if (pathname.startsWith('/api/mesh/projects/') && pathname.endsWith('/share') && method === 'POST') {
      const parts = pathname.split('/');
      const projectId = parts[4];
      const shared = meshDiscovery.toggleProjectShare(projectId);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, shared }));
      return;
    }

    // Phase 2: Mesh Security Config
    if (pathname === '/api/mesh/config' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(meshDiscovery.getConfig()));
      return;
    }

    if (pathname === '/api/mesh/config' && method === 'POST') {
      const body = await parseBody<Partial<MeshConfig>>(req);
      const updated = meshDiscovery.saveConfig(body);
      res.writeHead(200);
      res.end(JSON.stringify(updated));
      return;
    }

    // Phase 2: Mesh Audit Logs
    if (pathname === '/api/mesh/audit-logs' && method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify(meshDiscovery.getAuditLogs()));
      return;
    }

    if (pathname === '/api/mesh/audit-logs' && method === 'DELETE') {
      meshDiscovery.clearAuditLogs();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // Phase 2: Execute Local Action (called by remote peer via HTTP POST)
    if (pathname === '/api/mesh/execute-local-action' && method === 'POST') {
      const rawForwarded = req.headers['x-forwarded-for'];
      const actorIp = (Array.isArray(rawForwarded) ? rawForwarded[0] : rawForwarded) || req.socket.remoteAddress || 'unknown';
      const actorNodeId = req.headers['x-mesh-actor-nodeid'] as string;
      const actorHostname = req.headers['x-mesh-actor-hostname'] as string;
      const actorUsername = req.headers['x-mesh-actor-username'] as string;
      const token = req.headers['x-mesh-token'] as string;

      const body = await parseBody<{ projectId: string; action: 'restart' | 'sync' | 'stop' | 'start' }>(req);
      const result = await meshDiscovery.executeLocalActionFromPeer({
        actorIp,
        actorNodeId,
        actorHostname,
        actorUsername,
        token,
        projectId: body.projectId,
        action: body.action,
      });

      res.writeHead(result.success ? 200 : 403);
      res.end(JSON.stringify(result));
      return;
    }

    // Phase 2: Forward Remote Action to Peer (called by local frontend)
    const nodeActionMatch = pathname.match(/^\/api\/mesh\/nodes\/([^/]+)\/action$/);
    if (nodeActionMatch && method === 'POST') {
      const targetNodeId = nodeActionMatch[1];
      const body = await parseBody<{ projectId: string; action: 'restart' | 'sync' | 'stop' | 'start' }>(req);
      const result = await meshDiscovery.dispatchActionToPeer(targetNodeId, body.projectId, body.action);
      res.writeHead(result.success ? 200 : 400);
      res.end(JSON.stringify(result));
      return;
    }

    // Phase 4: Host endpoint - serve project logs to authenticated mesh peer
    const meshProjectLogsMatch = pathname.match(/^\/api\/mesh\/projects\/([^/]+)\/logs$/);
    if (meshProjectLogsMatch && method === 'GET') {
      const targetProjectId = meshProjectLogsMatch[1];
      const token = req.headers['x-mesh-token'] as string;
      if (meshDiscovery.getConfig().requireToken && token !== meshDiscovery.getConfig().teamToken) {
        res.writeHead(403);
        res.end(JSON.stringify({ error: 'Team Token xác thực không hợp lệ' }));
        return;
      }
      const rawLogs = logAggregator.getLogs({ projectIds: [targetProjectId], limit: 250 });
      const logs = rawLogs.map((entry) => ({
        id: entry.id,
        projectId: entry.projectId,
        timestamp: entry.timestamp,
        stream: entry.stream,
        text: entry.message,
      }));
      res.writeHead(200);
      res.end(JSON.stringify(logs));
      return;
    }

    // Phase 4: Local proxy endpoint - fetch project logs from remote peer
    const nodeProjectLogsMatch = pathname.match(/^\/api\/mesh\/nodes\/([^/]+)\/projects\/([^/]+)\/logs$/);
    if (nodeProjectLogsMatch && method === 'GET') {
      const targetNodeId = nodeProjectLogsMatch[1];
      const targetProjectId = nodeProjectLogsMatch[2];
      const logs = await meshDiscovery.fetchPeerProjectLogs(targetNodeId, targetProjectId);
      res.writeHead(200);
      res.end(JSON.stringify(logs));
      return;
    }

    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Endpoint not found' }));
  } catch (err: any) {
    console.error('API Error:', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 [WinDev Hub Server] Started on http://localhost:${PORT}`);
  console.log(`📡 WebSocket endpoint ready at ws://localhost:${PORT}/ws\n`);
});
