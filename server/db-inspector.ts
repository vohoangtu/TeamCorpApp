import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { envManager } from './env-manager';

export interface DatabaseTarget {
  id: string;
  type: 'postgres' | 'mysql' | 'redis' | 'mongodb' | 'sqlite' | 'unknown';
  name: string;
  urlMasked: string;
  host: string;
  port: number;
  status: 'connected' | 'disconnected' | 'checking';
  latencyMs?: number;
  details?: string;
}

export class DatabaseInspector {
  private testTcpConnection(host: string, port: number, timeoutMs = 2500): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    return new Promise((resolve) => {
      const start = Date.now();
      const socket = new net.Socket();

      socket.setTimeout(timeoutMs);

      socket.connect(port, host, () => {
        const latency = Date.now() - start;
        socket.destroy();
        resolve({ ok: true, latencyMs: latency });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ ok: false, latencyMs: Date.now() - start, error: err.message });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ ok: false, latencyMs: timeoutMs, error: 'Connection timed out' });
      });
    });
  }

  private sendRedisCommand(host: string, port: number, commandResp: string): Promise<{ success: boolean; reply?: string; error?: string }> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);

      socket.connect(port, host, () => {
        socket.write(commandResp);
      });

      socket.on('data', (data) => {
        const reply = data.toString();
        socket.destroy();
        resolve({ success: reply.startsWith('+') || reply.startsWith('$') || reply.startsWith(':'), reply });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ success: false, error: err.message });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, error: 'Redis command timeout' });
      });
    });
  }

  async inspectProject(projectPath: string): Promise<DatabaseTarget[]> {
    const envData = envManager.getEnv(projectPath);
    const targets: DatabaseTarget[] = [];

    // Also check standard local dev databases
    const envItems = envData.items || [];
    
    for (const item of envItems) {
      const key = item.key.toUpperCase();
      const val = item.value;

      if (key.includes('DATABASE') || key.includes('POSTGRES') || key.includes('PG_')) {
        const match = val.match(/^(?:postgresql|postgres):\/\/(?:[^:]+:[^@]+@)?([^:/]+)(?::(\d+))?(?:\/(.+))?/);
        const host = match ? match[1] : 'localhost';
        const port = match && match[2] ? parseInt(match[2], 10) : 5432;
        const dbName = match && match[3] ? match[3].split('?')[0] : 'postgres';

        const test = await this.testTcpConnection(host, port);
        targets.push({
          id: `pg-${key}`,
          type: 'postgres',
          name: `PostgreSQL (${dbName})`,
          urlMasked: val.replace(/:([^:@]+)@/, ':••••••@'),
          host,
          port,
          status: test.ok ? 'connected' : 'disconnected',
          latencyMs: test.latencyMs,
          details: test.ok ? `Connected to ${host}:${port}` : test.error,
        });
      } else if (key.includes('REDIS')) {
        const match = val.match(/^(?:redis|rediss):\/\/(?:[^:]+:[^@]+@)?([^:/]+)(?::(\d+))?/);
        const host = match ? match[1] : 'localhost';
        const port = match && match[2] ? parseInt(match[2], 10) : 6379;

        const test = await this.testTcpConnection(host, port);
        targets.push({
          id: `redis-${key}`,
          type: 'redis',
          name: 'Redis Cache & KV',
          urlMasked: val.replace(/:([^:@]+)@/, ':••••••@'),
          host,
          port,
          status: test.ok ? 'connected' : 'disconnected',
          latencyMs: test.latencyMs,
          details: test.ok ? `Active Redis Instance on ${port}` : test.error,
        });
      } else if (key.includes('MYSQL')) {
        const match = val.match(/^mysql:\/\/(?:[^:]+:[^@]+@)?([^:/]+)(?::(\d+))?(?:\/(.+))?/);
        const host = match ? match[1] : 'localhost';
        const port = match && match[2] ? parseInt(match[2], 10) : 3306;
        const dbName = match && match[3] ? match[3].split('?')[0] : 'mysql';

        const test = await this.testTcpConnection(host, port);
        targets.push({
          id: `mysql-${key}`,
          type: 'mysql',
          name: `MySQL (${dbName})`,
          urlMasked: val.replace(/:([^:@]+)@/, ':••••••@'),
          host,
          port,
          status: test.ok ? 'connected' : 'disconnected',
          latencyMs: test.latencyMs,
          details: test.ok ? `Connected to ${host}:${port}` : test.error,
        });
      } else if (key.includes('SQLITE')) {
        const filePath = path.isAbsolute(val) ? val : path.join(projectPath, val);
        const exists = fs.existsSync(filePath);
        let size = 0;
        if (exists) {
          try { size = fs.statSync(filePath).size; } catch {}
        }
        targets.push({
          id: `sqlite-${key}`,
          type: 'sqlite',
          name: `SQLite (${path.basename(val)})`,
          urlMasked: val,
          host: 'Local File',
          port: 0,
          status: exists ? 'connected' : 'disconnected',
          latencyMs: exists ? 1 : undefined,
          details: exists ? `File Size: ${(size / 1024).toFixed(1)} KB` : 'Database file not found',
        });
      }
    }

    // If no databases configured in .env, check default local ports (5432 Postgres, 6379 Redis)
    if (targets.length === 0) {
      const pgTest = await this.testTcpConnection('localhost', 5432, 1000);
      if (pgTest.ok) {
        targets.push({
          id: 'default-pg',
          type: 'postgres',
          name: 'Local PostgreSQL Server',
          urlMasked: 'postgresql://postgres:••••••@localhost:5432/postgres',
          host: 'localhost',
          port: 5432,
          status: 'connected',
          latencyMs: pgTest.latencyMs,
          details: 'Detected active local Postgres instance',
        });
      }

      const redisTest = await this.testTcpConnection('localhost', 6379, 1000);
      if (redisTest.ok) {
        targets.push({
          id: 'default-redis',
          type: 'redis',
          name: 'Local Redis Instance',
          urlMasked: 'redis://localhost:6379',
          host: 'localhost',
          port: 6379,
          status: 'connected',
          latencyMs: redisTest.latencyMs,
          details: 'Detected active local Redis instance',
        });
      }
    }

    return targets;
  }

  async flushRedis(host = 'localhost', port = 6379): Promise<{ success: boolean; message: string }> {
    // Redis RESP for FLUSHALL is "*1\r\n$8\r\nFLUSHALL\r\n"
    const result = await this.sendRedisCommand(host, port, '*1\r\n$8\r\nFLUSHALL\r\n');
    if (result.success) {
      return { success: true, message: `✅ Đã xóa sạch toàn bộ Cache Redis trên ${host}:${port}!` };
    }
    return { success: false, message: `❌ Không thể xóa Redis: ${result.error || 'Lỗi không xác định'}` };
  }
}

export const dbInspector = new DatabaseInspector();
