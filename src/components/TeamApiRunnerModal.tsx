import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Send, 
  Plus, 
  Trash2, 
  Save, 
  Copy, 
  Check, 
  RefreshCw, 
  Clock, 
  Radio, 
  Layers, 
  Sparkles, 
  Wifi, 
  Globe, 
  Laptop, 
  ShieldCheck, 
  AlertCircle,
  FileCode,
  Sliders,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { TeamApiRequest, TeamApiResponse, MockRule, HttpMethod, Project } from '../types';
import { sendFluentToast } from '../utils/notifications';

interface TeamApiRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProject?: Project | null;
}

export const TeamApiRunnerModal: React.FC<TeamApiRunnerModalProps> = ({
  isOpen,
  onClose,
  initialProject,
}) => {
  const { 
    projects, 
    teamCatalog, 
    meshNodes, 
    teamApiRequests, 
    mockRules, 
    fetchTeamApiRequests, 
    saveTeamApiRequest, 
    deleteTeamApiRequest, 
    executeTeamApiRequest,
    fetchMockRules,
    saveMockRule,
    deleteMockRule
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'runner' | 'mocks'>('runner');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  // Form State for Active Request
  const [reqName, setReqName] = useState('Yêu cầu API mới');
  const [reqMethod, setReqMethod] = useState<HttpMethod>('GET');
  const [reqEndpoint, setReqEndpoint] = useState('/api/users');
  const [reqProjectId, setReqProjectId] = useState<string>('');
  const [reqBody, setReqBody] = useState('{\n  "name": "TeamCorp User"\n}');
  const [reqHeaders, setReqHeaders] = useState<Array<{ key: string; value: string }>>([
    { key: 'Content-Type', value: 'application/json' }
  ]);
  const [reqQueryParams, setReqQueryParams] = useState<Array<{ key: string; value: string }>>([]);
  const [reqAuthType, setReqAuthType] = useState<'none' | 'bearer' | 'basic'>('none');
  const [reqAuthToken, setReqAuthToken] = useState('');
  const [subTab, setSubTab] = useState<'params' | 'headers' | 'body' | 'auth'>('params');

  // Execution State
  const [isExecuting, setIsExecuting] = useState(false);
  const [response, setResponse] = useState<TeamApiResponse | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Mock Rule Modal / Editor State
  const [editingMockRule, setEditingMockRule] = useState<Partial<MockRule> | null>(null);

  // Combine local and remote microservices
  const allServices = useMemo(() => {
    const list: Project[] = [...projects];
    for (const remote of teamCatalog) {
      if (!list.some((p) => p.id === remote.id)) {
        list.push(remote);
      }
    }
    return list;
  }, [projects, teamCatalog]);

  // Initial load
  useEffect(() => {
    if (isOpen) {
      fetchTeamApiRequests();
      fetchMockRules();

      if (initialProject) {
        setReqProjectId(initialProject.id);
        setSelectedServiceId(initialProject.id);
      } else if (allServices.length > 0 && !reqProjectId) {
        setReqProjectId(allServices[0].id);
      }
    }
  }, [isOpen, initialProject, fetchTeamApiRequests, fetchMockRules, allServices]);

  // When a request is selected from the sidebar
  const handleSelectRequest = (req: TeamApiRequest) => {
    setSelectedRequestId(req.id);
    setReqName(req.name);
    setReqMethod(req.method);
    setReqEndpoint(req.endpoint);
    setReqProjectId(req.projectId);
    setReqBody(req.body || '');
    setReqAuthType(req.authType || 'none');
    setReqAuthToken(req.authToken || '');

    // Headers
    if (req.headers && Object.keys(req.headers).length > 0) {
      setReqHeaders(Object.entries(req.headers).map(([key, value]) => ({ key, value })));
    } else {
      setReqHeaders([{ key: 'Content-Type', value: 'application/json' }]);
    }

    // Query Params
    if (req.queryParams && Object.keys(req.queryParams).length > 0) {
      setReqQueryParams(Object.entries(req.queryParams).map(([key, value]) => ({ key, value })));
    } else {
      setReqQueryParams([]);
    }
  };

  const handleNewRequest = () => {
    setSelectedRequestId(null);
    setReqName('API Endpoint Mới');
    setReqMethod('GET');
    setReqEndpoint('/api/health');
    setReqBody('');
    setReqHeaders([{ key: 'Content-Type', value: 'application/json' }]);
    setReqQueryParams([]);
    setResponse(null);
  };

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    if (selectedServiceId === 'all') return teamApiRequests;
    return teamApiRequests.filter((r) => r.projectId === selectedServiceId || r.projectId === 'global');
  }, [teamApiRequests, selectedServiceId]);

  // Find target project info
  const targetProject = useMemo(() => {
    return allServices.find((s) => s.id === reqProjectId) || null;
  }, [allServices, reqProjectId]);

  // Resolve base URL label
  const targetUrlPreview = useMemo(() => {
    if (!targetProject) return 'http://localhost:????';
    if (!targetProject.isRemote) {
      return `http://127.0.0.1:${targetProject.port || 3000}`;
    }
    return targetProject.remoteUrl || `http://${targetProject.nodeName || 'peer'}:${targetProject.port || 8080}`;
  }, [targetProject]);

  // Execute request
  const handleExecute = async (forceMock = false) => {
    if (!reqProjectId) {
      sendFluentToast('Chưa chọn Dịch vụ', 'Vui lòng chọn microservice mục tiêu cần gọi API', 'error');
      return;
    }

    setIsExecuting(true);
    setResponse(null);

    // Build headers object
    const headersObj: Record<string, string> = {};
    for (const h of reqHeaders) {
      if (h.key.trim()) headersObj[h.key.trim()] = h.value;
    }

    // Build query params object
    const queryParamsObj: Record<string, string> = {};
    for (const q of reqQueryParams) {
      if (q.key.trim()) queryParamsObj[q.key.trim()] = q.value;
    }

    const res = await executeTeamApiRequest({
      requestId: selectedRequestId || undefined,
      projectId: reqProjectId,
      projectName: targetProject?.name,
      method: reqMethod,
      endpoint: reqEndpoint,
      nodeId: targetProject?.nodeId,
      headers: headersObj,
      queryParams: queryParamsObj,
      body: ['POST', 'PUT', 'PATCH'].includes(reqMethod) ? reqBody : undefined,
      authType: reqAuthType,
      authToken: reqAuthToken,
      forceMock,
    });

    setIsExecuting(false);
    if (res) {
      setResponse(res);
      if (res.isMocked) {
        sendFluentToast('Mock Phản Hồi', 'Dữ liệu được trả về tự động từ Smart Mock Engine', 'info');
      } else {
        sendFluentToast('Phản Hồi Thành Công', `Mã ${res.status} (${res.durationMs}ms)`, 'success');
      }
    } else {
      sendFluentToast('Yêu cầu Thất Bại', 'Không thể kết nối tới dịch vụ và không tìm thấy Mock', 'error');
    }
  };

  // Save request to collection
  const handleSaveRequest = async () => {
    const headersObj: Record<string, string> = {};
    for (const h of reqHeaders) {
      if (h.key.trim()) headersObj[h.key.trim()] = h.value;
    }

    const queryParamsObj: Record<string, string> = {};
    for (const q of reqQueryParams) {
      if (q.key.trim()) queryParamsObj[q.key.trim()] = q.value;
    }

    const saved = await saveTeamApiRequest({
      id: selectedRequestId || undefined,
      name: reqName.trim() || 'API Request',
      method: reqMethod,
      endpoint: reqEndpoint.trim() || '/',
      projectId: reqProjectId || 'global',
      projectName: targetProject?.name || 'Tất cả Dịch vụ',
      nodeId: targetProject?.nodeId,
      nodeName: targetProject?.nodeName,
      isRemote: targetProject?.isRemote,
      headers: headersObj,
      queryParams: queryParamsObj,
      body: reqBody,
      authType: reqAuthType,
      authToken: reqAuthToken,
    });

    if (saved) {
      setSelectedRequestId(saved.id);
      sendFluentToast('Đã Lưu Request', 'Request đã được lưu vào bộ sưu tập dùng chung của team', 'success');
    }
  };

  // Delete saved request
  const handleDeleteRequest = async (id: string) => {
    const ok = await deleteTeamApiRequest(id);
    if (ok) {
      if (selectedRequestId === id) handleNewRequest();
      sendFluentToast('Đã Xóa', 'Đã gỡ bỏ request khỏi bộ sưu tập', 'info');
    }
  };

  // Method color helper
  const getMethodBadgeClass = (method: HttpMethod | 'ALL') => {
    switch (method) {
      case 'GET': return 'text-sky-500 bg-sky-500/10 border-sky-500/20';
      case 'POST': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'PUT': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'PATCH': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'DELETE': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-neutral-400 bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data, null, 2);
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative flex flex-col w-full max-w-6xl h-[90vh] rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden text-hub-primary min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-hub bg-hub-sidebar/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--hub-accent)] text-white shadow-xs">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold tracking-tight">Team API Runner & P2P Postman</h2>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  P2P Mesh Network
                </span>
              </div>
              <p className="text-[12px] text-hub-muted">
                Thử nghiệm API trực tiếp giữa các máy trạm đồng nghiệp & Giả lập thông minh chống nghẽn việc Frontend
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Main Mode Toggle: Runner vs Mocks */}
            <div className="flex items-center rounded-lg border border-hub p-0.5 bg-black/[0.03] dark:bg-white/[0.04]">
              <button
                onClick={() => setActiveTab('runner')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'runner'
                    ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                    : 'text-hub-muted hover:text-hub-primary'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                <span>API Runner</span>
              </button>
              <button
                onClick={() => setActiveTab('mocks')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                  activeTab === 'mocks'
                    ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                    : 'text-hub-muted hover:text-hub-primary'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Smart Mock Engine ({mockRules.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Mode 1 (API Runner) */}
        {activeTab === 'runner' && (
          <div className="flex flex-1 overflow-hidden divide-x divide-hub">
            {/* Left Sidebar: Requests Collection */}
            <div className="w-64 sm:w-72 flex flex-col bg-hub-sidebar/40 shrink-0">
              {/* Sidebar Header & Filter */}
              <div className="p-3 border-b border-hub space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-hub-muted uppercase tracking-wider flex items-center gap-1">
                    <Layers className="h-3 w-3" /> Bộ Sưu Tập ({filteredRequests.length})
                  </span>
                  <button
                    onClick={handleNewRequest}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--hub-accent)] text-white hover:opacity-90 transition-opacity"
                    title="Tạo request mới"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Mới</span>
                  </button>
                </div>

                {/* Service Filter dropdown */}
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full text-xs rounded border border-hub bg-hub-card px-2 py-1 text-hub-primary focus:outline-none"
                >
                  <option value="all">Tất cả Microservices</option>
                  {allServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.isRemote ? `[📶 ${s.nodeName}] ${s.name}` : `[🪟 Local] ${s.name}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Items List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredRequests.length === 0 ? (
                  <div className="p-4 text-center text-xs text-hub-muted">
                    Chưa có request nào trong bộ sưu tập. Hãy tạo request đầu tiên!
                  </div>
                ) : (
                  filteredRequests.map((r) => {
                    const isSelected = selectedRequestId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => handleSelectRequest(r)}
                        className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer border text-xs transition-all ${
                          isSelected
                            ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/10 font-semibold'
                            : 'border-transparent hover:border-hub hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border shrink-0 ${getMethodBadgeClass(r.method)}`}>
                            {r.method}
                          </span>
                          <div className="truncate">
                            <div className="truncate text-hub-primary">{r.name}</div>
                            <div className="text-[10px] font-mono text-hub-muted truncate">{r.endpoint}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {r.lastRunStatus && (
                            <span className={`text-[10px] font-mono font-bold ${
                              r.lastRunStatus >= 200 && r.lastRunStatus < 300 ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {r.lastRunStatus}
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest(r.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-500 transition-opacity"
                            title="Xóa request"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Middle & Right: Request Builder & Response Inspector */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Request Builder Header */}
              <div className="p-4 border-b border-hub space-y-3 bg-black/[0.01] dark:bg-white/[0.02]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <input
                    type="text"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    placeholder="Tên Request (ví dụ: Lấy danh sách hóa đơn)"
                    className="text-sm font-semibold bg-transparent border-none focus:outline-none text-hub-primary w-64 sm:w-96"
                  />

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveRequest}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border border-hub hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-hub-primary transition-colors"
                      title="Lưu vào bộ sưu tập dùng chung"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Lưu Bộ Sưu Tập</span>
                    </button>

                    <button
                      onClick={() => handleExecute(false)}
                      disabled={isExecuting}
                      className="fluent-btn-primary h-8 px-4 text-xs gap-1.5 shadow-xs font-semibold"
                    >
                      <Send className={`h-3.5 w-3.5 ${isExecuting ? 'animate-bounce' : ''}`} />
                      <span>{isExecuting ? 'Đang gửi...' : 'GỬI REQUEST'}</span>
                    </button>
                  </div>
                </div>

                {/* Target Service & URL Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Method dropdown */}
                  <select
                    value={reqMethod}
                    onChange={(e) => setReqMethod(e.target.value as HttpMethod)}
                    className="h-8 rounded border border-hub bg-hub-card px-2 text-xs font-bold font-mono focus:outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>

                  {/* Target Service Selector */}
                  <select
                    value={reqProjectId}
                    onChange={(e) => setReqProjectId(e.target.value)}
                    className="h-8 rounded border border-hub bg-hub-card px-2.5 text-xs font-medium focus:outline-none"
                  >
                    {allServices.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.isRemote ? `📶 [${s.nodeName || 'Remote'}] ${s.name}` : `🪟 [Local] ${s.name}`}
                      </option>
                    ))}
                  </select>

                  {/* Endpoint Input */}
                  <div className="flex-1 flex items-center h-8 rounded border border-hub bg-hub-card overflow-hidden focus-within:border-[var(--hub-accent)] transition-colors">
                    <span className="px-2.5 text-xs font-mono text-hub-muted bg-black/[0.02] dark:bg-white/[0.04] border-r border-hub shrink-0 truncate max-w-[200px]">
                      {targetUrlPreview}
                    </span>
                    <input
                      type="text"
                      value={reqEndpoint}
                      onChange={(e) => setReqEndpoint(e.target.value)}
                      placeholder="/api/v1/..."
                      className="flex-1 px-2.5 text-xs font-mono bg-transparent text-hub-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Tabs: Params, Headers, Body, Auth */}
              <div className="px-4 border-b border-hub flex items-center gap-4 text-xs font-medium shrink-0 bg-black/[0.01] dark:bg-white/[0.01]">
                <button
                  onClick={() => setSubTab('params')}
                  className={`py-2.5 border-b-2 transition-all ${
                    subTab === 'params'
                      ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] font-semibold'
                      : 'border-transparent text-hub-muted hover:text-hub-primary'
                  }`}
                >
                  Params ({reqQueryParams.length})
                </button>
                <button
                  onClick={() => setSubTab('headers')}
                  className={`py-2.5 border-b-2 transition-all ${
                    subTab === 'headers'
                      ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] font-semibold'
                      : 'border-transparent text-hub-muted hover:text-hub-primary'
                  }`}
                >
                  Headers ({reqHeaders.length})
                </button>
                {['POST', 'PUT', 'PATCH'].includes(reqMethod) && (
                  <button
                    onClick={() => setSubTab('body')}
                    className={`py-2.5 border-b-2 transition-all ${
                      subTab === 'body'
                        ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] font-semibold'
                        : 'border-transparent text-hub-muted hover:text-hub-primary'
                    }`}
                  >
                    JSON Body
                  </button>
                )}
                <button
                  onClick={() => setSubTab('auth')}
                  className={`py-2.5 border-b-2 transition-all ${
                    subTab === 'auth'
                      ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] font-semibold'
                      : 'border-transparent text-hub-muted hover:text-hub-primary'
                  }`}
                >
                  Xác Thực (Auth)
                </button>
              </div>

              {/* Sub-Tab Content View */}
              <div className="p-4 border-b border-hub max-h-56 overflow-y-auto shrink-0 bg-hub-sidebar/20">
                {subTab === 'params' && (
                  <div className="space-y-2">
                    {reqQueryParams.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Tham số (Key)"
                          value={q.key}
                          onChange={(e) => {
                            const clone = [...reqQueryParams];
                            clone[idx].key = e.target.value;
                            setReqQueryParams(clone);
                          }}
                          className="flex-1 h-7 rounded border border-hub bg-hub-card px-2 text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Giá trị (Value)"
                          value={q.value}
                          onChange={(e) => {
                            const clone = [...reqQueryParams];
                            clone[idx].value = e.target.value;
                            setReqQueryParams(clone);
                          }}
                          className="flex-1 h-7 rounded border border-hub bg-hub-card px-2 text-xs font-mono"
                        />
                        <button
                          onClick={() => setReqQueryParams(reqQueryParams.filter((_, i) => i !== idx))}
                          className="p-1 text-hub-muted hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setReqQueryParams([...reqQueryParams, { key: '', value: '' }])}
                      className="text-xs text-[var(--hub-accent)] hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="h-3 w-3" /> Thêm Query Param
                    </button>
                  </div>
                )}

                {subTab === 'headers' && (
                  <div className="space-y-2">
                    {reqHeaders.map((h, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Header Key"
                          value={h.key}
                          onChange={(e) => {
                            const clone = [...reqHeaders];
                            clone[idx].key = e.target.value;
                            setReqHeaders(clone);
                          }}
                          className="flex-1 h-7 rounded border border-hub bg-hub-card px-2 text-xs font-mono"
                        />
                        <input
                          type="text"
                          placeholder="Header Value"
                          value={h.value}
                          onChange={(e) => {
                            const clone = [...reqHeaders];
                            clone[idx].value = e.target.value;
                            setReqHeaders(clone);
                          }}
                          className="flex-1 h-7 rounded border border-hub bg-hub-card px-2 text-xs font-mono"
                        />
                        <button
                          onClick={() => setReqHeaders(reqHeaders.filter((_, i) => i !== idx))}
                          className="p-1 text-hub-muted hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setReqHeaders([...reqHeaders, { key: '', value: '' }])}
                      className="text-xs text-[var(--hub-accent)] hover:underline flex items-center gap-1 font-medium"
                    >
                      <Plus className="h-3 w-3" /> Thêm Header
                    </button>
                  </div>
                )}

                {subTab === 'body' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-hub-muted">
                      <span>Định dạng JSON Payload</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setReqBody('{\n  "name": "Sản phẩm A",\n  "price": 250000,\n  "quantity": 2\n}')}
                          className="hover:underline text-[var(--hub-accent)]"
                        >
                          Mẫu Đơn Hàng
                        </button>
                        <button
                          onClick={() => setReqBody('{\n  "email": "user@teamcorp.local",\n  "role": "admin"\n}')}
                          className="hover:underline text-[var(--hub-accent)]"
                        >
                          Mẫu User
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={reqBody}
                      onChange={(e) => setReqBody(e.target.value)}
                      className="w-full rounded border border-hub bg-[#0F1117] p-2 text-xs font-mono text-neutral-200 focus:outline-none"
                    />
                  </div>
                )}

                {subTab === 'auth' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium">Kiểu Xác Thực:</label>
                      <select
                        value={reqAuthType}
                        onChange={(e) => setReqAuthType(e.target.value as any)}
                        className="rounded border border-hub bg-hub-card px-2 py-1 text-xs"
                      >
                        <option value="none">Không xác thực (None)</option>
                        <option value="bearer">Bearer Token (JWT)</option>
                        <option value="basic">Basic Auth</option>
                      </select>
                    </div>

                    {reqAuthType !== 'none' && (
                      <input
                        type="text"
                        placeholder={reqAuthType === 'bearer' ? 'Nhập chuỗi JWT Token...' : 'username:password'}
                        value={reqAuthToken}
                        onChange={(e) => setReqAuthToken(e.target.value)}
                        className="w-full h-8 rounded border border-hub bg-hub-card px-2.5 text-xs font-mono"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Response Viewer Panel */}
              <div className="flex-1 flex flex-col p-4 bg-[#0F1117] text-neutral-200 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      Kết Quả Phản Hồi (Response)
                    </span>

                    {response && (
                      <>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                          response.status >= 200 && response.status < 300
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        }`}>
                          {response.status} {response.statusText}
                        </span>

                        <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {response.durationMs}ms
                        </span>

                        <span className="text-xs text-neutral-500 font-mono">
                          {(response.sizeBytes / 1024).toFixed(1)} KB
                        </span>

                        {response.isMocked && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center gap-1 animate-pulse">
                            <Sparkles className="h-3 w-3" />
                            Smart Mocked
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {response && (
                    <button
                      onClick={handleCopyResponse}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                      title="Sao chép nội dung phản hồi"
                    >
                      {isCopied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
                    </button>
                  )}
                </div>

                {/* Response Body Textarea / Pretty Inspector */}
                <div className="flex-1 overflow-y-auto pt-3 font-mono text-xs leading-relaxed select-text">
                  {!response ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-2">
                      <Send className="h-8 w-8 opacity-40" />
                      <p>Bấm "GỬI REQUEST" để bắt đầu kiểm thử liên máy trạm</p>
                    </div>
                  ) : (
                    <pre className="text-neutral-300 whitespace-pre-wrap break-all">
                      {typeof response.data === 'string'
                        ? response.data
                        : JSON.stringify(response.data, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Mode 2 (Smart Mock Engine) */}
        {activeTab === 'mocks' && (
          <div className="flex-1 flex flex-col p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-hub-primary">Danh Mục Smart Mock Rules</h3>
                <p className="text-xs text-hub-muted">
                  Quy tắc sinh dữ liệu giả lập tự động khi microservice của đồng đội chưa viết xong hoặc tắt máy.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingMockRule({
                    name: 'Quy tắc Mock mới',
                    method: 'GET',
                    endpointPattern: '/api/v1/*',
                    statusCode: 200,
                    delayMs: 60,
                    enabled: true,
                    mode: 'auto_when_offline',
                    projectId: allServices[0]?.id || 'global',
                    responseBody: '{\n  "status": "success",\n  "data": [\n    { "id": "{{random_id}}", "name": "Mục thử nghiệm" }\n  ]\n}',
                  });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--hub-accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Quy Tắc Mock</span>
              </button>
            </div>

            {/* Mock Rules List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-lg border border-hub bg-hub-card p-3 space-y-2 shadow-xs hover:border-[var(--hub-accent)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getMethodBadgeClass(rule.method)}`}>
                        {rule.method}
                      </span>
                      <span className="font-semibold text-xs text-hub-primary">{rule.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold ${
                        rule.mode === 'always_mock'
                          ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {rule.mode === 'always_mock' ? 'Luôn Mock' : 'Khi Offline'}
                      </span>
                      <button
                        onClick={() => deleteMockRule(rule.id)}
                        className="p-1 text-hub-muted hover:text-rose-500"
                        title="Xóa quy tắc mock"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="font-mono text-xs text-hub-muted bg-black/[0.02] dark:bg-white/[0.04] p-1.5 rounded">
                    Khớp mẫu: <span className="text-hub-primary font-semibold">{rule.endpointPattern}</span> • Trả mã HTTP {rule.statusCode} ({rule.delayMs}ms)
                  </div>

                  <pre className="font-mono text-[11px] p-2 rounded bg-[#0F1117] text-neutral-300 max-h-24 overflow-hidden truncate">
                    {rule.responseBody}
                  </pre>
                </div>
              ))}
            </div>

            {/* Quick Mock Rule Editor Modal / Drawer */}
            {editingMockRule && (
              <div className="p-4 rounded-lg border border-[var(--hub-accent)] bg-hub-card shadow-lg space-y-3 mt-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-hub-primary">Thiết Lập Quy Tắc Mock</h4>
                  <button onClick={() => setEditingMockRule(null)} className="text-hub-muted hover:text-hub-primary">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Tên quy tắc"
                    value={editingMockRule.name || ''}
                    onChange={(e) => setEditingMockRule({ ...editingMockRule, name: e.target.value })}
                    className="h-8 rounded border border-hub bg-hub-card px-2 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Pattern (ví dụ: /api/orders*)"
                    value={editingMockRule.endpointPattern || ''}
                    onChange={(e) => setEditingMockRule({ ...editingMockRule, endpointPattern: e.target.value })}
                    className="h-8 rounded border border-hub bg-hub-card px-2 text-xs font-mono"
                  />
                  <select
                    value={editingMockRule.mode || 'auto_when_offline'}
                    onChange={(e) => setEditingMockRule({ ...editingMockRule, mode: e.target.value as any })}
                    className="h-8 rounded border border-hub bg-hub-card px-2 text-xs"
                  >
                    <option value="auto_when_offline">Tự động Mock khi máy đồng nghiệp Offline</option>
                    <option value="always_mock">Luôn Mock (Bỏ qua máy thật)</option>
                  </select>
                </div>

                <textarea
                  rows={4}
                  value={editingMockRule.responseBody || ''}
                  onChange={(e) => setEditingMockRule({ ...editingMockRule, responseBody: e.target.value })}
                  placeholder="JSON Mock Body..."
                  className="w-full font-mono text-xs p-2 rounded border border-hub bg-[#0F1117] text-neutral-200"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingMockRule(null)}
                    className="px-3 py-1 rounded text-xs border border-hub"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={async () => {
                      if (!editingMockRule.name || !editingMockRule.endpointPattern) return;
                      await saveMockRule({
                        name: editingMockRule.name,
                        method: (editingMockRule.method as any) || 'GET',
                        endpointPattern: editingMockRule.endpointPattern,
                        statusCode: editingMockRule.statusCode || 200,
                        delayMs: editingMockRule.delayMs || 50,
                        responseBody: editingMockRule.responseBody || '{}',
                        enabled: true,
                        mode: editingMockRule.mode || 'auto_when_offline',
                        projectId: editingMockRule.projectId || 'global',
                      });
                      setEditingMockRule(null);
                      sendFluentToast('Đã Lưu Mock Rule', 'Quy tắc mock đã sẵn sàng phục vụ', 'success');
                    }}
                    className="px-3 py-1 rounded text-xs bg-[var(--hub-accent)] text-white font-semibold"
                  >
                    Lưu Quy Tắc
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-hub bg-hub-sidebar/80 text-[12px] text-hub-muted shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              P2P Encrypted Mesh Tunnel
            </span>
            <span>•</span>
            <span>Phím tắt: Sử dụng tab Smart Mock khi đồng đội chưa code xong API</span>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-hub bg-hub-card text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-hub-primary"
          >
            Đóng (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
