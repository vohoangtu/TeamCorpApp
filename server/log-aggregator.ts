import type { LogEntry, AggregatedLogEntry, AggregatedLogFilter, LogLevel } from '../src/types';
import { projectStore } from './store';

const COLOR_PALETTE = [
  '#10B981', // emerald-500
  '#0EA5E9', // sky-500
  '#8B5CF6', // purple-500
  '#F59E0B', // amber-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
  '#06B6D4', // cyan-500
  '#D946EF', // fuchsia-500
];

export class LogAggregator {
  private buffer: AggregatedLogEntry[] = [];
  private maxBufferSize: number = 1500;
  private sequenceCounter: number = 0;
  private projectColorMap: Map<string, string> = new Map();
  private broadcastFn: ((type: string, payload: any) => void) | null = null;

  setBroadcast(fn: (type: string, payload: any) => void) {
    this.broadcastFn = fn;
  }

  private getColorForProject(projectId: string): string {
    if (!this.projectColorMap.has(projectId)) {
      const idx = this.projectColorMap.size % COLOR_PALETTE.length;
      this.projectColorMap.set(projectId, COLOR_PALETTE[idx]);
    }
    return this.projectColorMap.get(projectId)!;
  }

  private detectLevel(text: string, stream: string): LogLevel {
    if (stream === 'stderr') return 'error';
    const lower = text.toLowerCase();
    if (
      lower.includes('error') ||
      lower.includes('err:') ||
      lower.includes('fatal') ||
      lower.includes('exception') ||
      lower.includes('failed') ||
      lower.includes('uncaught') ||
      lower.includes('unhandledrejection')
    ) {
      return 'error';
    }
    if (lower.includes('warn') || lower.includes('warning')) {
      return 'warn';
    }
    if (lower.includes('debug') || lower.includes('verbose')) {
      return 'debug';
    }
    return 'info';
  }

  private extractCorrelationId(text: string): string | undefined {
    // Check for common patterns: [req:123], correlationId=abc-123, trace_id:xyz
    const match =
      text.match(/(?:correlation[-_]?id|request[-_]?id|trace[-_]?id|req_id|corr_id)[:=]\s*([a-zA-Z0-9_-]+)/i) ||
      text.match(/\[([a-zA-Z0-9_-]{8,36})\]/);
    return match ? match[1] : undefined;
  }

  add(projectId: string, log: LogEntry, target: 'windows' | 'wsl' | 'docker' = 'windows'): AggregatedLogEntry {
    const project = projectStore.get(projectId);
    const projectName = project ? project.name : projectId;
    const projectColor = this.getColorForProject(projectId);
    const level = this.detectLevel(log.text, log.stream);
    const correlationId = this.extractCorrelationId(log.text);

    this.sequenceCounter++;

    const entry: AggregatedLogEntry = {
      id: log.id || crypto.randomUUID(),
      projectId,
      projectName,
      projectColor,
      target,
      level,
      stream: log.stream,
      message: log.text,
      timestamp: log.timestamp || new Date().toISOString(),
      sequence: this.sequenceCounter,
      correlationId,
    };

    this.buffer.push(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    if (this.broadcastFn) {
      this.broadcastFn('log:aggregated', entry);
    }

    return entry;
  }

  getLogs(filter?: AggregatedLogFilter): AggregatedLogEntry[] {
    let result = this.buffer;

    if (!filter) return result;

    if (filter.projectIds && filter.projectIds.length > 0) {
      const allowed = new Set(filter.projectIds);
      result = result.filter((e) => allowed.has(e.projectId));
    }

    if (filter.levels && filter.levels.length > 0) {
      const allowedLevels = new Set(filter.levels);
      result = result.filter((e) => allowedLevels.has(e.level));
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.message.toLowerCase().includes(q) ||
          e.projectName.toLowerCase().includes(q) ||
          (e.correlationId && e.correlationId.toLowerCase().includes(q))
      );
    }

    if (filter.startTime) {
      const startMs = new Date(filter.startTime).getTime();
      result = result.filter((e) => new Date(e.timestamp).getTime() >= startMs);
    }

    if (filter.limit && filter.limit > 0) {
      result = result.slice(-filter.limit);
    }

    return result;
  }

  clear() {
    this.buffer = [];
    if (this.broadcastFn) {
      this.broadcastFn('log:aggregated_cleared', {});
    }
  }

  exportAsText(filter?: AggregatedLogFilter): string {
    const logs = this.getLogs(filter);
    return logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.projectName.padEnd(16)}] [${l.target.toUpperCase()}] [${l.level.toUpperCase()}]: ${l.message.trimEnd()}`
      )
      .join('\n');
  }

  exportAsJson(filter?: AggregatedLogFilter): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }
}

export const logAggregator = new LogAggregator();
