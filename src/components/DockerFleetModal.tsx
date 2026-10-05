import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  X, 
  RefreshCw, 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Terminal, 
  Cpu, 
  MemoryStick, 
  ExternalLink 
} from 'lucide-react';
import type { DockerContainerInfo, WslDistroInfo, WslConfig } from '../types';

interface DockerFleetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DockerFleetModal: React.FC<DockerFleetModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'docker' | 'wsl'>('docker');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Docker State
  const [dockerAvailable, setDockerAvailable] = useState<boolean>(true);
  const [dockerMessage, setDockerMessage] = useState<string>('');
  const [containers, setContainers] = useState<DockerContainerInfo[]>([]);

  // WSL State
  const [wslAvailable, setWslAvailable] = useState<boolean>(true);
  const [wslMessage, setWslMessage] = useState<string>('');
  const [distros, setDistros] = useState<WslDistroInfo[]>([]);
  const [wslConfig, setWslConfig] = useState<WslConfig | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<string>('4GB');
  const [selectedCpus, setSelectedCpus] = useState<string>('Auto');

  const fetchDockerFleet = async () => {
    try {
      const res = await fetch('/api/fleet/docker');
      if (res.ok) {
        const data = await res.json();
        setDockerAvailable(data.isAvailable);
        setContainers(data.containers || []);
        if (data.message) setDockerMessage(data.message);
      }
    } catch (e: any) {
      setDockerAvailable(false);
      setDockerMessage('Không thể kết nối tới Docker backend API.');
    }
  };

  const fetchWslFleet = async () => {
    try {
      const res = await fetch('/api/fleet/wsl');
      if (res.ok) {
        const data = await res.json();
        setWslAvailable(data.isAvailable);
        setDistros(data.distros || []);
        if (data.config) {
          setWslConfig(data.config);
          setSelectedMemory(data.config.memoryLimit || '4GB');
          setSelectedCpus(data.config.processors || 'Auto');
        }
        if (data.message) setWslMessage(data.message);
      }
    } catch (e: any) {
      setWslAvailable(false);
      setWslMessage('Không thể kiểm tra trạng thái WSL.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchDockerFleet(), fetchWslFleet()]);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      loadData();
    }
  }, [isOpen]);

  const handleContainerAction = async (id: string, action: 'start' | 'stop' | 'restart' | 'remove') => {
    setActionLoading(`${id}-${action}`);
    setMessage(null);
    try {
      const res = await fetch(`/api/fleet/docker/${id}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message || `Thực thi ${action} container thành công!`, type: 'success' });
        await fetchDockerFleet();
      } else {
        setMessage({ text: data.message || `Lỗi khi thực hiện ${action}`, type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: `Lỗi kết nối: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrune = async () => {
    if (!window.confirm('Bạn có chắc muốn dọn dẹp tất cả Docker container và dangling images không dùng đến?')) return;
    setActionLoading('prune');
    setMessage(null);
    try {
      const res = await fetch('/api/fleet/docker/prune', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: 'Dọn dẹp hệ thống Docker hoàn tất!', type: 'success' });
        await fetchDockerFleet();
      } else {
        setMessage({ text: data.output || 'Không thể dọn dẹp Docker.', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: `Lỗi: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveWslConfig = async () => {
    setActionLoading('save-wsl');
    setMessage(null);
    try {
      const res = await fetch('/api/fleet/wsl/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: selectedMemory, processors: selectedCpus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ text: data.message, type: 'success' });
        await fetchWslFleet();
      } else {
        setMessage({ text: data.message || 'Lưu cấu hình thất bại.', type: 'error' });
      }
    } catch (e: any) {
      setMessage({ text: `Lỗi: ${e.message}`, type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-4xl max-h-[85vh] rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hub px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-hub-primary">Docker Fleet & WSL2 Commander</h2>
                <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-500">
                  Container Ops
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Quản lý container không cần mở Docker Desktop & cấu hình giới hạn RAM/CPU cho WSL2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="fluent-btn-standard h-8 px-2.5 text-xs gap-1.5"
              title="Làm mới trạng thái"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              onClick={onClose}
              className="fluent-icon-btn h-8 w-8 text-hub-muted hover:text-hub-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-b border-hub px-6 bg-black/[0.01] dark:bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-2 border-b-2 py-2.5 px-3 text-xs font-medium transition-all ${
              activeTab === 'docker'
                ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] font-semibold'
                : 'border-transparent text-hub-muted hover:text-hub-primary'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Docker Containers ({containers.length})</span>
            {dockerAvailable && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wsl')}
            className={`flex items-center gap-2 border-b-2 py-2.5 px-3 text-xs font-medium transition-all ${
              activeTab === 'wsl'
                ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] font-semibold'
                : 'border-transparent text-hub-muted hover:text-hub-primary'
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>WSL2 Subsystem & .wslconfig</span>
            {wslAvailable && (
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            )}
          </button>
        </div>

        {/* Action Message Alert */}
        {message && (
          <div
            className={`mx-6 mt-3 flex items-center gap-2 rounded-lg p-3 text-xs ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="hover:opacity-75">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'docker' ? (
            <div className="space-y-4">
              {/* Docker Controls Top Bar */}
              <div className="flex items-center justify-between rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${dockerAvailable ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
                  <span className="font-semibold text-hub-primary">
                    Docker Engine: {dockerAvailable ? 'Online & Sẵn sàng' : 'Chưa bật daemon'}
                  </span>
                  <span className="text-hub-muted">• {containers.filter(c => c.state === 'running').length} đang chạy / {containers.length} tổng số</span>
                </div>

                <button
                  onClick={handlePrune}
                  disabled={actionLoading === 'prune' || !dockerAvailable}
                  className="fluent-btn-standard h-7 px-2.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30 gap-1.5"
                  title="Xoá cache và containers/images mồ côi"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{actionLoading === 'prune' ? 'Đang dọn...' : 'Prune Dangling'}</span>
                </button>
              </div>

              {!dockerAvailable ? (
                <div className="rounded-xl border border-dashed border-hub p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
                    <Boxes className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-hub-primary">Docker Chưa Khởi Động</h3>
                  <p className="mt-1 text-xs text-hub-muted max-w-md mx-auto">
                    {dockerMessage || 'Không thể giao tiếp với Docker socket hoặc wsl.exe. Vui lòng bật Docker Desktop hoặc service Docker daemon.'}
                  </p>
                </div>
              ) : containers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-hub p-8 text-center text-xs text-hub-muted">
                  Không tìm thấy container nào trên máy tính của bạn.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-hub">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-hub bg-black/[0.03] dark:bg-white/[0.03] text-hub-muted font-medium">
                        <th className="p-3">Tên Container</th>
                        <th className="p-3">Trạng Thái</th>
                        <th className="p-3">Image</th>
                        <th className="p-3">Port Mappings</th>
                        <th className="p-3 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hub">
                      {containers.map((c) => {
                        const isRunning = c.state === 'running';
                        return (
                          <tr key={c.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            <td className="p-3">
                              <div className="font-semibold text-hub-primary flex items-center gap-1.5">
                                <Boxes className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                <span>{c.name}</span>
                              </div>
                              <span className="font-mono text-[10px] text-hub-muted">{c.id.substring(0, 12)}</span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isRunning
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-neutral-500/10 text-neutral-500 dark:text-neutral-400'
                                }`}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                {c.state.toUpperCase()}
                              </span>
                              <div className="text-[10px] text-hub-muted mt-0.5">{c.status}</div>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-hub-muted max-w-[180px] truncate" title={c.image}>
                              {c.image}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-hub-primary max-w-[180px] truncate" title={c.ports}>
                              {c.ports || '—'}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isRunning ? (
                                  <button
                                    onClick={() => handleContainerAction(c.id, 'stop')}
                                    disabled={actionLoading !== null}
                                    className="fluent-icon-btn h-7 w-7 text-hub-muted hover:text-rose-500 hover:bg-rose-500/10"
                                    title="Stop container"
                                  >
                                    <Square className="h-3.5 w-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleContainerAction(c.id, 'start')}
                                    disabled={actionLoading !== null}
                                    className="fluent-icon-btn h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                    title="Start container"
                                  >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleContainerAction(c.id, 'restart')}
                                  disabled={actionLoading !== null}
                                  className="fluent-icon-btn h-7 w-7 text-hub-muted hover:text-hub-primary"
                                  title="Restart container"
                                >
                                  <RotateCw className="h-3.5 w-3.5" />
                                </button>

                                <button
                                  onClick={() => handleContainerAction(c.id, 'remove')}
                                  disabled={actionLoading !== null}
                                  className="fluent-icon-btn h-7 w-7 text-hub-muted hover:text-rose-500 hover:bg-rose-500/10"
                                  title="Remove container"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* WSL Distro Overview */}
              <div>
                <h3 className="text-xs font-bold text-hub-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5 text-blue-500" />
                  <span>Bản Phân Phối Linux (Distros) Đã Cài Đặt</span>
                </h3>

                {!wslAvailable ? (
                  <div className="rounded-lg border border-dashed border-hub p-4 text-xs text-hub-muted">
                    {wslMessage || 'WSL không khả dụng hoặc chưa được cài đặt trên hệ thống này.'}
                  </div>
                ) : distros.length === 0 ? (
                  <div className="rounded-lg border border-hub p-4 text-xs text-hub-muted">
                    Không tìm thấy bản phân phối Linux nào. Cài đặt thêm bằng lệnh: <code className="font-mono text-hub-primary">wsl --install -d Ubuntu</code>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {distros.map((d) => (
                      <div
                        key={d.name}
                        className="rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-3.5 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                            🐧
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-hub-primary">{d.name}</span>
                              {d.isDefault && (
                                <span className="rounded bg-blue-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-blue-500">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-hub-muted">WSL Version {d.version}</span>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            d.state === 'Running'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-neutral-500/10 text-neutral-400'
                          }`}
                        >
                          {d.state}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* .wslconfig GUI RAM & CPU Limiter */}
              <div className="rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[var(--hub-accent)]" />
                    <h3 className="text-xs font-bold text-hub-primary uppercase tracking-wider">
                      Cấu Hình Giới Hạn Tài Nguyên (.wslconfig)
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-hub-muted">
                    {wslConfig?.filePath || '~/.wslconfig'}
                  </span>
                </div>

                <p className="text-xs text-hub-muted">
                  Theo mặc định, WSL2 (vmmem) có thể chiếm tới 50% tổng RAM hệ thống. Thiết lập ngưỡng tối đa tại đây để bảo vệ tài nguyên Windows khi build dự án.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-hub-primary mb-1.5 flex items-center gap-1.5">
                      <MemoryStick className="h-3.5 w-3.5 text-blue-500" />
                      Giới hạn RAM (Memory Limit):
                    </label>
                    <select
                      value={selectedMemory}
                      onChange={(e) => setSelectedMemory(e.target.value)}
                      className="w-full h-8 rounded-md border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:outline-none focus:border-[var(--hub-accent)]"
                    >
                      <option value="2GB">2GB (Tiết kiệm tối đa)</option>
                      <option value="4GB">4GB (Khuyến nghị máy 8-16GB)</option>
                      <option value="6GB">6GB (Cân bằng)</option>
                      <option value="8GB">8GB (Dành cho máy 16-32GB RAM)</option>
                      <option value="12GB">12GB (Dự án lớn/Docker nặng)</option>
                      <option value="16GB">16GB (Workstation)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-hub-primary mb-1.5 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-purple-500" />
                      Giới hạn CPU Cores:
                    </label>
                    <select
                      value={selectedCpus}
                      onChange={(e) => setSelectedCpus(e.target.value)}
                      className="w-full h-8 rounded-md border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:outline-none focus:border-[var(--hub-accent)]"
                    >
                      <option value="Auto">Tự động (All Cores)</option>
                      <option value="2">2 Nhân CPU</option>
                      <option value="4">4 Nhân CPU</option>
                      <option value="6">6 Nhân CPU</option>
                      <option value="8">8 Nhân CPU</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-hub pt-3">
                  <div className="text-[11px] text-hub-muted">
                    Sau khi lưu, chạy <code className="font-mono text-hub-primary">wsl --shutdown</code> để áp dụng.
                  </div>
                  <button
                    onClick={handleSaveWslConfig}
                    disabled={actionLoading === 'save-wsl'}
                    className="fluent-btn-primary h-8 px-4 text-xs font-semibold"
                  >
                    {actionLoading === 'save-wsl' ? 'Đang lưu...' : 'Lưu Cấu Hình .wslconfig'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
