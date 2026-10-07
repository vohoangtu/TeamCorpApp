import dgram from 'node:dgram';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { exec } from 'node:child_process';
import type { MeshNode, Project, MeshConfig, MeshAuditLog } from '../src/types';
import { projectStore } from './store';

const UDP_PORT = 4105;
const HTTP_PORT = 4100;
const BEACON_INTERVAL_MS = 3500;
const NODE_OFFLINE_TIMEOUT_MS = 12000;
const NODE_PRUNE_TIMEOUT_MS = 35000;

export class MeshDiscoveryService {
  private hostId: string;
  private socket: dgram.Socket | null = null;
  private broadcastTimer: NodeJS.Timeout | null = null;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private tailscaleTimer: NodeJS.Timeout | null = null;
  private peerFetchTimer: NodeJS.Timeout | null = null;

  private peers: Map<string, MeshNode> = new Map();
  private peerApps: Map<string, Project[]> = new Map();
  private broadcastFn: ((type: string, payload: any) => void) | null = null;

  private config: MeshConfig;
  private auditLogs: MeshAuditLog[] = [];
  private actionExecutor: ((projectId: string, action: 'restart' | 'sync' | 'stop' | 'start') => Promise<any>) | null = null;

  constructor() {
    this.hostId = this.getOrCreateHostId();
    this.config = this.loadConfig();
  }

  setBroadcast(fn: (type: string, payload: any) => void) {
    this.broadcastFn = fn;
  }

  private notify(type: string, payload: any) {
    if (this.broadcastFn) {
      this.broadcastFn(type, payload);
    }
  }

  private getOrCreateHostId(): string {
    const dataDir = path.join(os.homedir(), '.windev-hub');
    const idFile = path.join(dataDir, 'node-id.txt');
    try {
      if (fs.existsSync(idFile)) {
        const id = fs.readFileSync(idFile, 'utf-8').trim();
        if (id) return id;
      }
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const newId = `node_${os.hostname().toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 8)}`;
      fs.writeFileSync(idFile, newId, 'utf-8');
      return newId;
    } catch {
      return `node_${os.hostname().toLowerCase()}_${Date.now().toString(36)}`;
    }
  }

  // --- Configuration Management ---
  private loadConfig(): MeshConfig {
    const dataDir = path.join(os.homedir(), '.windev-hub');
    const configFile = path.join(dataDir, 'mesh-config.json');
    try {
      if (fs.existsSync(configFile)) {
        const raw = fs.readFileSync(configFile, 'utf-8');
        return {
          teamToken: 'windev-mesh-token-2026',
          allowRemoteControl: true,
          requireToken: true,
          ...JSON.parse(raw),
          hostId: this.hostId,
        };
      }
    } catch {}
    return {
      teamToken: 'windev-mesh-token-2026',
      allowRemoteControl: true,
      requireToken: true,
      hostId: this.hostId,
    };
  }

  public saveConfig(newConfig: Partial<MeshConfig>): MeshConfig {
    this.config = {
      ...this.config,
      ...newConfig,
      hostId: this.hostId,
    };
    try {
      const dataDir = path.join(os.homedir(), '.windev-hub');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const configFile = path.join(dataDir, 'mesh-config.json');
      fs.writeFileSync(configFile, JSON.stringify(this.config, null, 2), 'utf-8');
    } catch {}
    this.notify('mesh:config_updated', this.config);
    return this.config;
  }

  public getConfig(): MeshConfig {
    return this.config;
  }

  // --- Audit Trail Logging ---
  public getAuditLogs(): MeshAuditLog[] {
    return [...this.auditLogs];
  }

  public addAuditLog(item: Omit<MeshAuditLog, 'id' | 'timestamp'>): MeshAuditLog {
    const log: MeshAuditLog = {
      ...item,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.notify('mesh:audit_logs_updated', this.auditLogs);
    return log;
  }

  public clearAuditLogs(): void {
    this.auditLogs = [];
    this.notify('mesh:audit_logs_updated', this.auditLogs);
  }

  // --- Remote Execution Engine ---
  public setActionExecutor(fn: (projectId: string, action: 'restart' | 'sync' | 'stop' | 'start') => Promise<any>) {
    this.actionExecutor = fn;
  }

  public async executeLocalActionFromPeer(params: {
    actorIp: string;
    actorNodeId?: string;
    actorHostname?: string;
    actorUsername?: string;
    token?: string;
    projectId: string;
    action: 'restart' | 'sync' | 'stop' | 'start';
  }): Promise<{ success: boolean; message?: string; error?: string }> {
    const actorName = `${params.actorUsername || 'dev'}@${params.actorHostname || params.actorIp}`;
    const project = projectStore.get(params.projectId);
    const projectName = project ? project.name : params.projectId;

    // 1. Verify Team Token if required
    if (this.config.requireToken && params.token !== this.config.teamToken) {
      this.addAuditLog({
        action: params.action,
        actorIp: params.actorIp,
        actorHostname: params.actorHostname || 'unknown',
        actorUsername: params.actorUsername || 'unknown',
        targetProjectId: params.projectId,
        targetProjectName: projectName,
        status: 'rejected',
        reason: 'Team Token xác thực không hợp lệ',
      });
      return { success: false, error: 'Xác thực thất bại: Team Token không khớp' };
    }

    // 2. Check Remote Control Policy
    if (!this.config.allowRemoteControl) {
      this.addAuditLog({
        action: params.action,
        actorIp: params.actorIp,
        actorHostname: params.actorHostname || 'unknown',
        actorUsername: params.actorUsername || 'unknown',
        targetProjectId: params.projectId,
        targetProjectName: projectName,
        status: 'rejected',
        reason: 'Chủ máy đã tắt tính năng cho phép điều khiển từ xa',
      });
      return { success: false, error: 'Chủ máy đã tắt tính năng cho phép điều khiển từ xa' };
    }

    // 3. Check Project Existence
    if (!project) {
      this.addAuditLog({
        action: params.action,
        actorIp: params.actorIp,
        actorHostname: params.actorHostname || 'unknown',
        actorUsername: params.actorUsername || 'unknown',
        targetProjectId: params.projectId,
        targetProjectName: projectName,
        status: 'failed',
        reason: 'Không tìm thấy ứng dụng',
      });
      return { success: false, error: 'Không tìm thấy ứng dụng trên máy này' };
    }

    // 4. Check Action Executor Ready
    if (!this.actionExecutor) {
      return { success: false, error: 'Hệ thống chưa sẵn sàng xử lý tác vụ' };
    }

    try {
      await this.actionExecutor(params.projectId, params.action);

      this.addAuditLog({
        action: params.action,
        actorIp: params.actorIp,
        actorHostname: params.actorHostname || 'unknown',
        actorUsername: params.actorUsername || 'unknown',
        targetProjectId: params.projectId,
        targetProjectName: projectName,
        status: 'success',
      });

      // Send live notification to local user UI
      this.notify('mesh:remote_notification', {
        id: `notif_${Date.now()}`,
        timestamp: Date.now(),
        type: 'action_executed',
        title: 'Điều Khiển Từ Xa (Team Mesh)',
        message: `${actorName} vừa thực hiện lệnh [${params.action.toUpperCase()}] trên ứng dụng "${project.name}"`,
        actor: actorName,
        action: params.action,
        projectName: project.name,
      });

      return { success: true, message: `Thao tác [${params.action}] trên "${project.name}" thành công` };
    } catch (err: any) {
      this.addAuditLog({
        action: params.action,
        actorIp: params.actorIp,
        actorHostname: params.actorHostname || 'unknown',
        actorUsername: params.actorUsername || 'unknown',
        targetProjectId: params.projectId,
        targetProjectName: projectName,
        status: 'failed',
        reason: err.message,
      });
      return { success: false, error: err.message || 'Lỗi không xác định khi thực thi lệnh' };
    }
  }

  public async dispatchActionToPeer(
    targetNodeId: string,
    projectId: string,
    action: 'restart' | 'sync' | 'stop' | 'start'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const peer = this.peers.get(targetNodeId);
    if (!peer) {
      return { success: false, error: 'Không tìm thấy node đích hoặc node đã ngắt kết nối' };
    }

    return new Promise((resolve) => {
      const payload = JSON.stringify({ projectId, action });
      const options = {
        hostname: peer.ip,
        port: peer.port,
        path: '/api/mesh/execute-local-action',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'X-Mesh-Token': this.config.teamToken,
          'X-Mesh-Actor-NodeId': this.hostId,
          'X-Mesh-Actor-Hostname': os.hostname(),
          'X-Mesh-Actor-Username': os.userInfo().username || 'developer',
        },
        timeout: 8000,
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, message: 'Đã gửi lệnh thành công' });
            } else {
              resolve({ success: false, error: `Lỗi HTTP ${res.statusCode}: ${body || 'Không có phản hồi'}` });
            }
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: `Không thể kết nối tới node ${peer.name}: ${err.message}` });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, error: `Hết thời gian chờ phản hồi từ node ${peer.name} (timeout 8s)` });
      });

      req.write(payload);
      req.end();
    });
  }

  // Detects best local LAN IPv4 address (e.g. 192.168.x.x, 10.x.x.x)
  public getLocalLanIp(): string {
    const interfaces = os.networkInterfaces();
    let bestIp = '127.0.0.1';

    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name] || [];
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && !iface.internal) {
          // Ignore known virtual / container interfaces if physical exists
          const lowerName = name.toLowerCase();
          if (lowerName.includes('docker') || lowerName.includes('veth') || lowerName.includes('tailscale')) {
            continue;
          }
          // Prioritize standard home/office subnets
          if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.')) {
            return iface.address;
          }
          if (iface.address.startsWith('172.') && !lowerName.includes('wsl')) {
            bestIp = iface.address;
          } else if (bestIp === '127.0.0.1') {
            bestIp = iface.address;
          }
        }
      }
    }
    return bestIp;
  }

  // Detects Tailscale IPv4 address if present (starts with 100.)
  public getTailscaleIp(): string | null {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaceList = interfaces[name] || [];
      for (const iface of ifaceList) {
        if (iface.family === 'IPv4' && iface.address.startsWith('100.')) {
          return iface.address;
        }
      }
    }
    return null;
  }

  // Self node representation
  public getSelfNode(): MeshNode {
    const lanIp = this.getLocalLanIp();
    const tailscaleIp = this.getTailscaleIp();
    const sharedProjects = projectStore.getAll().filter((p) => p.shareToTeam !== false);

    return {
      id: this.hostId,
      name: `${os.userInfo().username || 'dev'}@${os.hostname()} (Local)`,
      hostname: os.hostname(),
      username: os.userInfo().username || 'developer',
      ip: tailscaleIp || lanIp,
      port: HTTP_PORT,
      connectionType: 'local',
      status: 'online',
      lastSeen: Date.now(),
      latencyMs: 0,
      sharedAppCount: sharedProjects.length,
      isSelf: true,
      apps: this.getSharedProjects(true),
    };
  }

  public start() {
    this.startUdpDiscovery();
    this.startTailscaleCheck();
    this.startPeerPolling();
  }

  public stop() {
    if (this.broadcastTimer) clearInterval(this.broadcastTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    if (this.tailscaleTimer) clearInterval(this.tailscaleTimer);
    if (this.peerFetchTimer) clearInterval(this.peerFetchTimer);

    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }

  // 1. LAN / WLAN UDP Multicast & Broadcast ZeroConf
  private startUdpDiscovery() {
    try {
      this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

      this.socket.on('error', (err) => {
        console.warn('[MeshDiscovery] UDP socket warning:', err.message);
      });

      this.socket.on('message', (msg, rinfo) => {
        try {
          const payload = JSON.parse(msg.toString('utf-8'));
          if (payload.type === 'WINDEV_HUB_BEACON' && payload.id && payload.id !== this.hostId) {
            this.handleIncomingBeacon(payload, rinfo.address);
          }
        } catch {
          // ignore corrupted packets
        }
      });

      this.socket.bind(UDP_PORT, () => {
        try {
          this.socket?.setBroadcast(true);
          console.log(`[MeshDiscovery] LAN Discovery listening on UDP :${UDP_PORT}`);
        } catch (e: any) {
          console.warn('[MeshDiscovery] Failed to setBroadcast:', e.message);
        }
      });

      // Periodic broadcast beacon
      this.broadcastTimer = setInterval(() => {
        this.sendBeacon();
      }, BEACON_INTERVAL_MS);

      // Periodic node health check and cleanup
      this.cleanupTimer = setInterval(() => {
        this.pruneOfflineNodes();
      }, 5000);

      // Trigger immediate first beacon
      setTimeout(() => this.sendBeacon(), 500);
    } catch (err: any) {
      console.warn('[MeshDiscovery] Could not initialize UDP socket:', err.message);
    }
  }

  private sendBeacon() {
    if (!this.socket) return;
    try {
      const lanIp = this.getLocalLanIp();
      const tailscaleIp = this.getTailscaleIp();
      const sharedCount = projectStore.getAll().filter((p) => p.shareToTeam !== false).length;

      const beacon = Buffer.from(
        JSON.stringify({
          type: 'WINDEV_HUB_BEACON',
          id: this.hostId,
          hostname: os.hostname(),
          username: os.userInfo().username || 'developer',
          port: HTTP_PORT,
          lanIp,
          tailscaleIp,
          sharedAppCount: sharedCount,
          timestamp: Date.now(),
        })
      );

      // Broadcast to standard subnet broadcast
      this.socket.send(beacon, 0, beacon.length, UDP_PORT, '255.255.255.255', (err) => {
        if (err && (err as any).code !== 'EPERM') {
          // ignore transient errors
        }
      });
    } catch {
      // ignore
    }
  }

  private handleIncomingBeacon(payload: any, senderAddress: string) {
    const existing = this.peers.get(payload.id);
    const resolvedIp = payload.lanIp || senderAddress;
    const now = Date.now();
    const calculatedLatency = Math.max(0, Math.min(999, now - (payload.timestamp || now)));

    const updatedNode: MeshNode = {
      id: payload.id,
      name: `${payload.username || 'dev'}@${payload.hostname || 'workstation'}`,
      hostname: payload.hostname || 'workstation',
      username: payload.username || 'dev',
      ip: resolvedIp,
      port: payload.port || HTTP_PORT,
      connectionType: 'lan',
      status: 'online',
      lastSeen: now,
      latencyMs: calculatedLatency < 2 ? 1 : calculatedLatency,
      sharedAppCount: payload.sharedAppCount || 0,
      isSelf: false,
      apps: existing?.apps || [],
    };

    const isNew = !existing;
    this.peers.set(payload.id, updatedNode);

    if (isNew) {
      console.log(`[MeshDiscovery] Discovered new peer on LAN: ${updatedNode.name} (${updatedNode.ip})`);
      // Immediately fetch apps from new peer
      this.fetchPeerApps(updatedNode);
      this.notify('mesh:nodes_updated', this.getAllNodes());
    }
  }

  // 2. Tailscale / WireGuard Remote Fallback
  private startTailscaleCheck() {
    const checkTailscale = () => {
      exec('tailscale status --json', { timeout: 4000 }, (err, stdout) => {
        if (err || !stdout) return;
        try {
          const data = JSON.parse(stdout);
          const peersObj = data.Peer || {};
          let changed = false;

          for (const key of Object.keys(peersObj)) {
            const p = peersObj[key];
            const tsIps: string[] = p.TailscaleIPs || [];
            const ipv4 = tsIps.find((ip) => ip.startsWith('100.'));
            if (!ipv4) continue;

            const peerHost = p.HostName || p.DNSName?.split('.')[0] || 'remote-node';
            const peerId = `tailscale_${peerHost}_${ipv4.replace(/\./g, '_')}`;

            // If already discovered via LAN, prioritize LAN!
            const hasLanPeer = Array.from(this.peers.values()).some(
              (node) => node.connectionType === 'lan' && node.hostname.toLowerCase() === peerHost.toLowerCase()
            );
            if (hasLanPeer) continue;

            const existing = this.peers.get(peerId);
            const isOnline = Boolean(p.Online);

            const node: MeshNode = {
              id: peerId,
              name: `${peerHost} (Remote Tailscale)`,
              hostname: peerHost,
              username: 'remote-dev',
              ip: ipv4,
              port: HTTP_PORT,
              connectionType: 'remote_tailscale',
              status: isOnline ? 'online' : 'offline',
              lastSeen: Date.now(),
              latencyMs: 15,
              sharedAppCount: existing?.sharedAppCount || 0,
              isSelf: false,
              apps: existing?.apps || [],
            };

            this.peers.set(peerId, node);
            changed = true;
          }

          if (changed) {
            this.notify('mesh:nodes_updated', this.getAllNodes());
          }
        } catch {
          // ignore parse errors
        }
      });
    };

    // Run Tailscale check every 15s
    this.tailscaleTimer = setInterval(checkTailscale, 15000);
    setTimeout(checkTailscale, 2000);
  }

  // 3. Periodic Poll Peer Shared Apps
  private startPeerPolling() {
    this.peerFetchTimer = setInterval(async () => {
      for (const peer of this.peers.values()) {
        if (peer.status === 'online') {
          await this.fetchPeerApps(peer);
        }
      }
    }, 8000);
  }

  public async fetchPeerApps(peer: MeshNode): Promise<Project[]> {
    return new Promise((resolve) => {
      const req = http.get(
        `http://${peer.ip}:${peer.port}/api/mesh/shared-apps`,
        { timeout: 2000 },
        (res) => {
          if (res.statusCode !== 200) {
            resolve([]);
            return;
          }
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const apps: Project[] = JSON.parse(data);
              // Enrich with peer metadata and safe remote URLs
              const enriched = apps.map((app) => ({
                ...app,
                nodeId: peer.id,
                nodeName: peer.name,
                isRemote: true,
                connectionType: peer.connectionType,
                remoteUrl: app.port ? `http://${peer.ip}:${app.port}` : undefined,
              }));

              peer.apps = enriched;
              peer.sharedAppCount = enriched.length;
              this.peerApps.set(peer.id, enriched);
              resolve(enriched);
              this.notify('mesh:catalog_updated', this.getTeamCatalog());
            } catch {
              resolve([]);
            }
          });
        }
      );

      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
    });
  }

  // Prune dead nodes
  private pruneOfflineNodes() {
    const now = Date.now();
    let updated = false;

    for (const [id, node] of this.peers.entries()) {
      const diff = now - node.lastSeen;
      if (diff > NODE_PRUNE_TIMEOUT_MS) {
        this.peers.delete(id);
        this.peerApps.delete(id);
        updated = true;
      } else if (diff > NODE_OFFLINE_TIMEOUT_MS && node.status === 'online') {
        node.status = 'offline';
        updated = true;
      }
    }

    if (updated) {
      this.notify('mesh:nodes_updated', this.getAllNodes());
      this.notify('mesh:catalog_updated', this.getTeamCatalog());
    }
  }

  // Get all active nodes (including self)
  public getAllNodes(): MeshNode[] {
    const self = this.getSelfNode();
    const peerList = Array.from(this.peers.values());
    return [self, ...peerList];
  }

  // Local apps formatted for sharing (Secrets strictly masked)
  public getSharedProjects(forLocal = false): Project[] {
    const projects = projectStore.getAll();
    const hostLanIp = this.getLocalLanIp();
    const hostTailIp = this.getTailscaleIp();
    const selfIp = hostTailIp || hostLanIp;

    return projects
      .filter((p) => forLocal || p.shareToTeam !== false)
      .map((p) => ({
        ...p,
        nodeId: this.hostId,
        nodeName: `${os.userInfo().username}@${os.hostname()}`,
        isRemote: !forLocal,
        remoteUrl: p.port ? `http://${selfIp}:${p.port}` : undefined,
        connectionType: forLocal ? 'local' : 'lan',
      }));
  }

  // Toggle sharing for a local project
  public toggleProjectShare(projectId: string): boolean {
    const proj = projectStore.get(projectId);
    if (!proj) return false;
    const current = proj.shareToTeam !== false; // default true
    proj.shareToTeam = !current;
    projectStore.set(proj);
    this.notify('mesh:catalog_updated', this.getTeamCatalog());
    this.notify('mesh:nodes_updated', this.getAllNodes());
    return proj.shareToTeam;
  }

  // Team Catalog = Local Apps + All Remote Apps
  public getTeamCatalog(): Project[] {
    const localShared = this.getSharedProjects(false);
    const remoteShared: Project[] = [];

    for (const apps of this.peerApps.values()) {
      remoteShared.push(...apps);
    }

    return [...localShared, ...remoteShared];
  }
}

export const meshDiscovery = new MeshDiscoveryService();
