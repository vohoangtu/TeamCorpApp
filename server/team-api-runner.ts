import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { TeamApiRequest, TeamApiResponse, HttpMethod } from '../src/types';
import { mockEngine } from './mock-engine';
import { projectStore } from './store';
import { meshDiscovery } from './mesh-discovery';

export interface ExecuteRequestOptions {
  requestId?: string;
  projectId: string;
  projectName?: string;
  method: HttpMethod;
  endpoint: string;
  nodeId?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: string;
  authType?: 'none' | 'bearer' | 'basic';
  authToken?: string;
  forceMock?: boolean;
}

export class TeamApiRunner {
  private requests: Map<string, TeamApiRequest> = new Map();
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
    this.storageFile = path.join(dataDir, 'team-api-requests.json');
    this.loadRequests();
    this.seedDefaultsIfEmpty();
  }

  private loadRequests() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf8');
        const list: TeamApiRequest[] = JSON.parse(raw);
        for (const item of list) {
          this.requests.set(item.id, item);
        }
      }
    } catch (e) {
      console.warn('[TeamApiRunner] Failed to load requests file, starting empty', e);
    }
  }

  private saveRequests() {
    try {
      const list = Array.from(this.requests.values());
      fs.writeFileSync(this.storageFile, JSON.stringify(list, null, 2), 'utf8');
    } catch (e) {
      console.error('[TeamApiRunner] Failed to save requests file', e);
    }
  }

  private seedDefaultsIfEmpty() {
    if (this.requests.size === 0) {
      const defaultRequests: TeamApiRequest[] = [
        {
          id: 'req-sample-health',
          name: 'Kiểm tra Sức khỏe (Health Check)',
          method: 'GET',
          endpoint: '/api/health',
          projectId: 'global',
          projectName: 'Tất cả Dịch vụ',
          description: 'Kiểm tra trạng thái sẵn sàng của microservice',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'req-sample-users',
          name: 'Lấy Danh sách Người dùng (Get Users)',
          method: 'GET',
          endpoint: '/api/users',
          projectId: 'global',
          projectName: 'Tất cả Dịch vụ',
          description: 'Truy vấn thông tin người dùng với mock engine dự phòng',
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: 'req-sample-checkout',
          name: 'Tạo Giao dịch Mẫu (Create Order)',
          method: 'POST',
          endpoint: '/api/orders',
          projectId: 'global',
          projectName: 'Tất cả Dịch vụ',
          body: JSON.stringify({
            item: 'Bản quyền Enterprise Team Mesh',
            quantity: 1,
            amount: 500000,
            currency: 'VND'
          }, null, 2),
          description: 'Thử nghiệm tạo đơn hàng thanh toán liên máy trạm',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      for (const r of defaultRequests) {
        this.requests.set(r.id, r);
      }
      this.saveRequests();
    }
  }

  public getAllRequests(projectId?: string): TeamApiRequest[] {
    const list = Array.from(this.requests.values());
    if (projectId) {
      return list.filter((r) => r.projectId === projectId || r.projectId === 'global');
    }
    return list;
  }

  public getRequest(id: string): TeamApiRequest | undefined {
    return this.requests.get(id);
  }

  public saveRequest(req: Partial<TeamApiRequest> & { name: string; method: HttpMethod; endpoint: string; projectId: string }): TeamApiRequest {
    const id = req.id || `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const fullRequest: TeamApiRequest = {
      id,
      name: req.name,
      method: req.method,
      endpoint: req.endpoint.startsWith('/') ? req.endpoint : `/${req.endpoint}`,
      projectId: req.projectId,
      projectName: req.projectName || 'Service',
      nodeId: req.nodeId,
      nodeName: req.nodeName,
      isRemote: req.isRemote,
      headers: req.headers || { 'Content-Type': 'application/json' },
      queryParams: req.queryParams || {},
      body: req.body,
      authType: req.authType || 'none',
      authToken: req.authToken,
      description: req.description,
      createdAt: req.createdAt || Date.now(),
      updatedAt: Date.now(),
      lastRunStatus: req.lastRunStatus,
      lastRunDurationMs: req.lastRunDurationMs,
    };

    this.requests.set(id, fullRequest);
    this.saveRequests();
    return fullRequest;
  }

  public deleteRequest(id: string): boolean {
    const existed = this.requests.delete(id);
    if (existed) {
      this.saveRequests();
    }
    return existed;
  }

  public async execute(opts: ExecuteRequestOptions): Promise<TeamApiResponse> {
    const startTime = Date.now();
    const cleanEndpoint = opts.endpoint.startsWith('/') ? opts.endpoint : `/${opts.endpoint}`;

    // 1. Check if Always Mock or Force Mock is enabled
    const mockRule = mockEngine.findMatchingRule(opts.projectId, opts.method, cleanEndpoint);
    if (opts.forceMock || (mockRule && mockRule.mode === 'always_mock')) {
      if (mockRule) {
        const mockRes = await mockEngine.generateMockResponse(mockRule, startTime);
        this.updateLastRun(opts.requestId, mockRes.status, mockRes.durationMs);
        return mockRes;
      }
    }

    // 2. Resolve Target Base URL
    let baseUrl = '';
    const localProj = projectStore.get(opts.projectId);

    if (localProj && localProj.port) {
      baseUrl = `http://127.0.0.1:${localProj.port}`;
    } else if (opts.nodeId) {
      const peer = meshDiscovery.getPeer(opts.nodeId);
      if (peer) {
        const peerApp = peer.apps?.find((a) => a.id === opts.projectId);
        const port = peerApp?.port || 8080;
        baseUrl = `http://${peer.ip}:${port}`;
      }
    }

    // Build complete URL with query parameters
    let targetUrl = '';
    if (baseUrl) {
      targetUrl = `${baseUrl}${cleanEndpoint}`;
    } else {
      // If endpoint itself is full URL or fallback
      if (cleanEndpoint.startsWith('http://') || cleanEndpoint.startsWith('https://')) {
        targetUrl = cleanEndpoint;
      }
    }

    if (opts.queryParams && Object.keys(opts.queryParams).length > 0) {
      const qp = new URLSearchParams();
      for (const [k, v] of Object.entries(opts.queryParams)) {
        if (k && v !== undefined) qp.append(k, String(v));
      }
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl += `${separator}${qp.toString()}`;
    }

    // 3. Attempt Live HTTP Request if target URL is reachable
    if (targetUrl) {
      try {
        const reqHeaders: Record<string, string> = {
          'User-Agent': 'TeamCorpApp-P2P-Runner/1.0',
          ...(opts.headers || {}),
        };

        if (opts.authType === 'bearer' && opts.authToken) {
          reqHeaders['Authorization'] = `Bearer ${opts.authToken}`;
        } else if (opts.authType === 'basic' && opts.authToken) {
          reqHeaders['Authorization'] = `Basic ${Buffer.from(opts.authToken).toString('base64')}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout for local/mesh

        const fetchOpts: RequestInit = {
          method: opts.method,
          headers: reqHeaders,
          signal: controller.signal,
        };

        if (['POST', 'PUT', 'PATCH'].includes(opts.method) && opts.body) {
          fetchOpts.body = opts.body;
        }

        const res = await fetch(targetUrl, fetchOpts);
        clearTimeout(timeoutId);

        const durationMs = Math.max(1, Date.now() - startTime);
        const resHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });

        let data: any;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            data = await res.json();
          } catch {
            data = await res.text();
          }
        } else {
          data = await res.text();
        }

        const sizeBytes = Buffer.byteLength(typeof data === 'string' ? data : JSON.stringify(data), 'utf8');

        const liveResponse: TeamApiResponse = {
          status: res.status,
          statusText: res.statusText || (res.status === 200 ? 'OK' : 'Response Received'),
          headers: resHeaders,
          data,
          durationMs,
          sizeBytes,
          timestamp: new Date().toISOString(),
          isMocked: false,
        };

        this.updateLastRun(opts.requestId, liveResponse.status, liveResponse.durationMs);
        return liveResponse;
      } catch (err: any) {
        // Target is down, offline, or timed out!
        console.warn(`[TeamApiRunner] Live request failed to ${targetUrl}:`, err.message);
      }
    }

    // 4. Fallback to Smart Mock Engine if service is offline or unready
    if (mockRule && (mockRule.mode === 'auto_when_offline' || mockRule.mode === 'always_mock')) {
      const mockRes = await mockEngine.generateMockResponse(mockRule, startTime);
      mockRes.headers['x-fallback-reason'] = 'Peer service unreachable or offline - Served via Auto Mock';
      this.updateLastRun(opts.requestId, mockRes.status, mockRes.durationMs);
      return mockRes;
    }

    // 5. Intelligent default auto-mock if no custom rule configured
    const durationMs = Math.max(1, Date.now() - startTime);
    const fallbackMock: TeamApiResponse = {
      status: 200,
      statusText: 'Auto-Simulated (Service Offline)',
      headers: {
        'content-type': 'application/json',
        'x-mocked-by': 'TeamCorpApp Smart Fallback',
        'x-offline-notice': 'Service mục tiêu hiện chưa bật hoặc đang offline. Dữ liệu được sinh tự động để không nghẽn Frontend.'
      },
      data: {
        _notice: 'Máy chủ mục tiêu đang offline hoặc chưa khởi động. Mock Engine tự động trả về dữ liệu mẫu để bạn tiếp tục phát triển giao diện.',
        endpoint: cleanEndpoint,
        method: opts.method,
        timestamp: new Date().toISOString(),
        mockData: [
          { id: 'item_1', name: 'Bản ghi mẫu A', status: 'active', value: 100 },
          { id: 'item_2', name: 'Bản ghi mẫu B', status: 'pending', value: 250 }
        ]
      },
      durationMs,
      sizeBytes: 350,
      timestamp: new Date().toISOString(),
      isMocked: true,
    };

    this.updateLastRun(opts.requestId, fallbackMock.status, fallbackMock.durationMs);
    return fallbackMock;
  }

  private updateLastRun(requestId?: string, status?: number, durationMs?: number) {
    if (!requestId) return;
    const item = this.requests.get(requestId);
    if (item) {
      item.lastRunStatus = status;
      item.lastRunDurationMs = durationMs;
      item.updatedAt = Date.now();
      this.saveRequests();
    }
  }
}

export const teamApiRunner = new TeamApiRunner();
