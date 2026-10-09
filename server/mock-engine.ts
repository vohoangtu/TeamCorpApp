import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { MockRule, HttpMethod, TeamApiResponse } from '../src/types';

export class MockEngine {
  private rules: Map<string, MockRule> = new Map();
  private storageFile: string;

  constructor() {
    const dataDir = path.resolve(process.cwd(), '.windev');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch (e) {
        // ignore
      }
    }
    this.storageFile = path.join(dataDir, 'mock-rules.json');
    this.loadRules();
    this.seedDefaultsIfEmpty();
  }

  private loadRules() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const list: MockRule[] = JSON.parse(raw);
        for (const item of list) {
          this.rules.set(item.id, item);
        }
      }
    } catch (e) {
      console.warn('[MockEngine] Failed to load rules file, starting empty', e);
    }
  }

  private saveRules() {
    try {
      const list = Array.from(this.rules.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('[MockEngine] Failed to save rules file', e);
    }
  }

  private seedDefaultsIfEmpty() {
    if (this.rules.size === 0) {
      // Default sample mock rule
      const sampleRule: MockRule = {
        id: 'mock-sample-users',
        projectId: 'global',
        projectName: 'Default Mock',
        name: 'Mock Danh sách Thành viên (Sample Users)',
        method: 'GET',
        endpointPattern: '/api/users*',
        statusCode: 200,
        delayMs: 80,
        responseBody: JSON.stringify({
          status: 'success',
          count: 3,
          data: [
            { id: 'usr_001', name: 'Nguyễn Văn A', email: 'vana@teamcorp.local', role: 'Developer' },
            { id: 'usr_002', name: 'Trần Thị B', email: 'thib@teamcorp.local', role: 'Tester' },
            { id: 'usr_003', name: 'Lê Hoàng C', email: 'hoangc@teamcorp.local', role: 'Tech Lead' }
          ],
          serverTimestamp: '{{timestamp}}'
        }, null, 2),
        enabled: true,
        mode: 'auto_when_offline',
        createdAt: Date.now()
      };
      this.rules.set(sampleRule.id, sampleRule);
      this.saveRules();
    }
  }

  public getAllRules(projectId?: string): MockRule[] {
    const list = Array.from(this.rules.values());
    if (projectId) {
      return list.filter((r) => r.projectId === projectId || r.projectId === 'global');
    }
    return list;
  }

  public saveRule(rule: Partial<MockRule> & { name: string; endpointPattern: string; projectId: string }): MockRule {
    const id = rule.id || `mock_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const fullRule: MockRule = {
      id,
      projectId: rule.projectId || 'global',
      projectName: rule.projectName || 'Service',
      name: rule.name,
      method: rule.method || 'GET',
      endpointPattern: rule.endpointPattern,
      statusCode: rule.statusCode !== undefined ? rule.statusCode : 200,
      delayMs: rule.delayMs !== undefined ? rule.delayMs : 50,
      responseBody: rule.responseBody || '{\n  "status": "ok"\n}',
      enabled: rule.enabled !== undefined ? rule.enabled : true,
      mode: rule.mode || 'auto_when_offline',
      createdAt: rule.createdAt || Date.now()
    };

    this.rules.set(id, fullRule);
    this.saveRules();
    return fullRule;
  }

  public deleteRule(id: string): boolean {
    const existed = this.rules.delete(id);
    if (existed) {
      this.saveRules();
    }
    return existed;
  }

  public findMatchingRule(projectId: string, method: HttpMethod, endpoint: string): MockRule | null {
    const cleanEndpoint = endpoint.split('?')[0].trim();
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Project filter (matches same project or global)
      if (rule.projectId !== 'global' && rule.projectId !== projectId) {
        continue;
      }

      // Method filter
      if (rule.method !== 'ALL' && rule.method !== method) {
        continue;
      }

      // Pattern matcher
      if (this.matchPattern(rule.endpointPattern, cleanEndpoint)) {
        return rule;
      }
    }
    return null;
  }

  private matchPattern(pattern: string, url: string): boolean {
    const p = pattern.trim();
    if (p === '*' || p === '/*') return true;
    if (p === url) return true;

    // Wildcard replacement
    const regexPattern = '^' + p
      .replace(/[.+^${}()|[\]\\]/g, '\\$&') // escape special regex chars except *
      .replace(/\*/g, '.*') + '$';

    try {
      const regex = new RegExp(regexPattern, 'i');
      return regex.test(url);
    } catch {
      return url.startsWith(p.replace('*', ''));
    }
  }

  public async generateMockResponse(rule: MockRule, startTime: number): Promise<TeamApiResponse> {
    if (rule.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, Math.min(rule.delayMs, 3000)));
    }

    let parsedBody: any;
    try {
      const populated = this.replacePlaceholders(rule.responseBody);
      parsedBody = JSON.parse(populated);
    } catch {
      parsedBody = rule.responseBody;
    }

    const durationMs = Math.max(1, Date.now() - startTime);
    const bodyStr = typeof parsedBody === 'string' ? parsedBody : JSON.stringify(parsedBody);

    return {
      status: rule.statusCode,
      statusText: rule.statusCode >= 200 && rule.statusCode < 300 ? 'OK (Mocked)' : 'Mock Response',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-powered-by': 'TeamCorpApp Smart Mock Engine',
        'x-mock-rule-id': rule.id,
        'x-mock-rule-name': rule.name,
      },
      data: parsedBody,
      durationMs,
      sizeBytes: Buffer.byteLength(bodyStr, 'utf8'),
      timestamp: new Date().toISOString(),
      isMocked: true,
      mockRuleId: rule.id,
    };
  }

  private replacePlaceholders(template: string): string {
    return template
      .replace(/{{timestamp}}/g, new Date().toISOString())
      .replace(/{{random_id}}/g, crypto.randomUUID())
      .replace(/{{random_number}}/g, String(Math.floor(Math.random() * 9000 + 1000)))
      .replace(/{{random_email}}/g, `dev_${Math.floor(Math.random() * 1000)}@teamcorp.local`);
  }
}

export const mockEngine = new MockEngine();
