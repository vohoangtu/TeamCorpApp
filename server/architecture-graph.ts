import { projectStore } from './store';
import { envManager } from './env-manager';
import { dbInspector } from './db-inspector';
import { healthSentinel } from './health-sentinel';
import { meshDiscovery } from './mesh-discovery';
import type { GraphNode, GraphEdge, ArchitectureTopology } from '../src/types';

export class ArchitectureGraphService {
  async getTopology(): Promise<ArchitectureTopology> {
    const localProjects = projectStore.getAll();
    const teamCatalog = meshDiscovery.getTeamCatalog();
    const selfNode = meshDiscovery.getSelfNode();
    const healthMap = new Map(healthSentinel.getAllHealth().map((h) => [h.projectId, h]));
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const dbMap = new Map<string, GraphNode>();

    // 1. Create Local Project Nodes
    for (const p of localProjects) {
      const isRunning = p.status === 'running';
      const health = healthMap.get(p.id);
      
      const port = p.port || 3000;
      let category: GraphNode['category'] = 'backend';
      let icon = '🚀';

      const lowerName = (p.name + p.runCommand).toLowerCase();
      if (lowerName.includes('vite') || lowerName.includes('react') || lowerName.includes('next') || lowerName.includes('vue') || lowerName.includes('web') || lowerName.includes('client')) {
        category = 'frontend';
        icon = '⚛️';
      } else if (lowerName.includes('api') || lowerName.includes('server') || lowerName.includes('express') || lowerName.includes('nest') || lowerName.includes('fastify')) {
        category = 'backend';
        icon = '⚡';
      }

      nodes.push({
        id: p.id,
        label: p.name,
        subLabel: `${p.runtimeType === 'docker' ? 'Docker' : 'Node.js'} • :${port}`,
        category,
        port,
        status: isRunning ? (health?.status === 'degraded' ? 'degraded' : 'online') : 'offline',
        icon,
        latencyMs: health?.latencyMs || (isRunning ? 18 : undefined),
        nodeId: selfNode.id,
        nodeName: 'Máy của tôi (Local)',
        isRemote: false,
        connectionType: 'local',
        ip: selfNode.ip,
      });

      // Parse local .env to detect links
      const envData = envManager.getEnv(p.sourcePath);
      for (const item of envData.items) {
        const key = item.key.toUpperCase();
        const val = item.value;

        // API Connection link (Frontend -> Backend Local or Remote Peer)
        if (key.includes('API_URL') || key.includes('BASE_URL') || key.includes('BACKEND')) {
          const portMatch = val.match(/:(\d{3,5})/);
          if (portMatch) {
            const targetPort = parseInt(portMatch[1], 10);
            
            // Check local projects first
            const targetLocal = localProjects.find((x) => x.port === targetPort);
            if (targetLocal && targetLocal.id !== p.id) {
              edges.push({
                id: `edge-${p.id}-${targetLocal.id}`,
                source: p.id,
                target: targetLocal.id,
                label: 'REST API (Local)',
                protocol: 'HTTP',
                status: isRunning && targetLocal.status === 'running' ? 'active' : 'inactive',
                isCrossNode: false,
              });
            } else {
              // Check remote peer services
              const targetRemote = teamCatalog.find((x) => x.isRemote && x.nodeId !== selfNode.id && x.port === targetPort);
              if (targetRemote) {
                const isLan = targetRemote.connectionType === 'lan';
                edges.push({
                  id: `edge-${p.id}-remote-${targetRemote.id}`,
                  source: p.id,
                  target: `remote-${targetRemote.id}`,
                  label: isLan ? 'LAN Mesh (<1ms)' : 'Tailscale VPN',
                  protocol: isLan ? 'LAN Mesh' : 'Tailscale VPN',
                  status: isRunning && targetRemote.status === 'running' ? 'active' : 'inactive',
                  isCrossNode: true,
                });
              }
            }
          }
        }

        // Database link (Backend -> Postgres/MySQL/SQLite)
        if (key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('MYSQL') || key.includes('SQLITE')) {
          const dbId = 'db-postgres-5432';
          if (!dbMap.has(dbId)) {
            dbMap.set(dbId, {
              id: dbId,
              label: 'PostgreSQL Database',
              subLabel: 'localhost:5432',
              category: 'database',
              port: 5432,
              status: 'online',
              icon: '🐘',
              latencyMs: 7,
              nodeId: selfNode.id,
              nodeName: 'Local DB',
              isRemote: false,
              connectionType: 'local',
            });
          }
          edges.push({
            id: `edge-${p.id}-${dbId}`,
            source: p.id,
            target: dbId,
            label: 'SQL / Prisma',
            protocol: 'TCP',
            status: isRunning ? 'active' : 'inactive',
            isCrossNode: false,
          });
        }

        // Redis link
        if (key.includes('REDIS')) {
          const redisId = 'cache-redis-6379';
          if (!dbMap.has(redisId)) {
            dbMap.set(redisId, {
              id: redisId,
              label: 'Redis KV & Cache',
              subLabel: 'localhost:6379',
              category: 'cache',
              port: 6379,
              status: 'online',
              icon: '⚡',
              latencyMs: 3,
              nodeId: selfNode.id,
              nodeName: 'Local Cache',
              isRemote: false,
              connectionType: 'local',
            });
          }
          edges.push({
            id: `edge-${p.id}-${redisId}`,
            source: p.id,
            target: redisId,
            label: 'Pub/Sub Cache',
            protocol: 'TCP',
            status: isRunning ? 'active' : 'inactive',
            isCrossNode: false,
          });
        }
      }
    }

    // 2. Add Remote Peer Projects from Team Catalog (excluding self)
    const remoteProjects = teamCatalog.filter((p) => p.isRemote && p.nodeId !== selfNode.id);
    for (const rp of remoteProjects) {
      const isRunning = rp.status === 'running';
      const port = rp.port || 3000;
      let category: GraphNode['category'] = 'backend';
      let icon = '⚡';

      const lowerName = (rp.name + (rp.runCommand || '')).toLowerCase();
      if (lowerName.includes('vite') || lowerName.includes('react') || lowerName.includes('next') || lowerName.includes('vue') || lowerName.includes('web') || lowerName.includes('client')) {
        category = 'frontend';
        icon = '⚛️';
      } else if (lowerName.includes('db') || lowerName.includes('postgres') || lowerName.includes('mysql')) {
        category = 'database';
        icon = '🐘';
      }

      nodes.push({
        id: `remote-${rp.id}`,
        label: rp.name,
        subLabel: `${rp.nodeName || 'Peer'} • :${port}`,
        category,
        port,
        status: isRunning ? 'online' : 'offline',
        icon,
        latencyMs: rp.connectionType === 'lan' ? 1 : 15,
        nodeId: rp.nodeId,
        nodeName: rp.nodeName,
        isRemote: true,
        connectionType: rp.connectionType,
      });
    }

    // Add unique database/cache nodes
    for (const dbNode of dbMap.values()) {
      nodes.push(dbNode);
    }

    const onlineNodes = nodes.filter((n) => n.status === 'online').length;
    const healthyPercent = nodes.length > 0 ? Math.round((onlineNodes / nodes.length) * 100) : 100;
    const activeConns = edges.filter((e) => e.status === 'active').length;
    const crossNodeCount = edges.filter((e) => e.isCrossNode && e.status === 'active').length;

    return {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        activeConnections: activeConns,
        healthyPercent,
        crossNodeConnections: crossNodeCount,
      },
    };
  }
}

export const architectureGraph = new ArchitectureGraphService();
export const architectureGraphService = architectureGraph;
