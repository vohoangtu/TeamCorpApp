import { projectStore } from './store';
import { envManager } from './env-manager';
import { dbInspector } from './db-inspector';
import { healthSentinel } from './health-sentinel';

export interface GraphNode {
  id: string;
  label: string;
  subLabel: string;
  category: 'frontend' | 'backend' | 'database' | 'cache' | 'service';
  port?: number;
  status: 'online' | 'offline' | 'degraded';
  icon: string;
  latencyMs?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol: 'HTTP' | 'WebSocket' | 'TCP' | 'IPC';
  status: 'active' | 'inactive';
}

export interface ArchitectureTopology {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    activeConnections: number;
    healthyPercent: number;
  };
}

export class ArchitectureGraphService {
  async getTopology(): Promise<ArchitectureTopology> {
    const projects = projectStore.getAll();
    const healthMap = new Map(healthSentinel.getAllHealth().map((h) => [h.projectId, h]));
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const dbMap = new Map<string, GraphNode>();

    // 1. Create project nodes
    for (const p of projects) {
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
      });

      // 2. Parse .env to detect outgoing links
      const envData = envManager.getEnv(p.sourcePath);
      for (const item of envData.items) {
        const key = item.key.toUpperCase();
        const val = item.value;

        // API Connection link (Frontend -> Backend)
        if (key.includes('API_URL') || key.includes('BASE_URL') || key.includes('BACKEND')) {
          const portMatch = val.match(/:(\d{3,5})/);
          if (portMatch) {
            const targetPort = parseInt(portMatch[1], 10);
            const targetProj = projects.find((x) => x.port === targetPort);
            if (targetProj && targetProj.id !== p.id) {
              edges.push({
                id: `edge-${p.id}-${targetProj.id}`,
                source: p.id,
                target: targetProj.id,
                label: 'REST API',
                protocol: 'HTTP',
                status: isRunning && targetProj.status === 'running' ? 'active' : 'inactive',
              });
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
            });
          }
          edges.push({
            id: `edge-${p.id}-${dbId}`,
            source: p.id,
            target: dbId,
            label: 'SQL / Prisma',
            protocol: 'TCP',
            status: isRunning ? 'active' : 'inactive',
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
            });
          }
          edges.push({
            id: `edge-${p.id}-${redisId}`,
            source: p.id,
            target: redisId,
            label: 'Pub/Sub Cache',
            protocol: 'TCP',
            status: isRunning ? 'active' : 'inactive',
          });
        }
      }
    }

    // Add unique database/cache nodes
    for (const dbNode of dbMap.values()) {
      nodes.push(dbNode);
    }

    const onlineNodes = nodes.filter((n) => n.status === 'online').length;
    const healthyPercent = nodes.length > 0 ? Math.round((onlineNodes / nodes.length) * 100) : 100;
    const activeConns = edges.filter((e) => e.status === 'active').length;

    return {
      nodes,
      edges,
      stats: {
        totalNodes: nodes.length,
        activeConnections: activeConns,
        healthyPercent,
      },
    };
  }
}

export const architectureGraph = new ArchitectureGraphService();
export const architectureGraphService = architectureGraph;
