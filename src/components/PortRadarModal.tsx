import React, { useState, useEffect } from 'react';
import { Shield, RefreshCw, X, AlertTriangle, CheckCircle, Trash2, Cpu, Zap, Activity } from 'lucide-react';
import type { PortStatus } from '../types';
import { useAppStore } from '../store/useAppStore';

interface PortRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortRadarModal: React.FC<PortRadarModalProps> = ({ isOpen, onClose }) => {
  const [ports, setPorts] = useState<PortStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [killingPort, setKillingPort] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { projects } = useAppStore();

  const scanPorts = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/ports/radar');
      if (res.ok) {
        const data = await res.json();
        setPorts(data);
      }
    } catch (e) {
      console.error('Scan ports failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      scanPorts();
    }
  }, [isOpen]);

  const handleFreePort = async (port: number) => {
    setKillingPort(port);
    try {
      const res = await fetch('/api/ports/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ port }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(`✅ Đã giải phóng thành công Port ${port} (PID: ${data.killedPid})`);
        await scanPorts();
      } else {
        setActionMessage(`❌ Lỗi: ${data.error || 'Không thể giải phóng port'}`);
      }
    } catch (e: any) {
      setActionMessage(`❌ Lỗi kết nối: ${e.message}`);
    } finally {
      setKillingPort(null);
    }
  };

  if (!isOpen) return null;

  const [filterText, setFilterText] = useState('');
  const occupiedPorts = ports.filter((p) => p.inUse);
  const freePorts = ports.filter((p) => !p.inUse);
  const registeredPortsCount = projects.filter((p) => p.port).length;

  const filteredPorts = ports.filter((p) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const matchingProj = projects.find((pr) => pr.port === p.port);
    return (
      p.port.toString().includes(q) ||
      (p.processName && p.processName.toLowerCase().includes(q)) ||
      (p.pid && p.pid.toString().includes(q)) ||
      (matchingProj && matchingProj.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Port Conflict Radar & Process Terminator
                </h3>
                <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[11px] font-semibold">
                  Network Diagnostics
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Phát hiện cổng mạng bị chiếm dụng bởi tiến trình zombie và giải phóng ngay tức thì chỉ với 1 click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-hub-primary transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {actionMessage && (
            <div className="rounded-lg border border-hub-subtle bg-black/[0.03] dark:bg-white/[0.04] p-3 text-xs font-semibold text-hub-primary flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-hub p-3.5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-hub-muted">Đang chiếm dụng (Active)</span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 font-mono">
                  {occupiedPorts.length}
                </div>
              </div>
              <div className="h-9 w-9 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="rounded-lg border border-hub p-3.5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-hub-muted">Cổng khả dụng (Free)</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                  {freePorts.length}
                </div>
              </div>
              <div className="h-9 w-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="rounded-lg border border-hub p-3.5 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-hub-muted">Dự án WinDev Hub</span>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
                  {registeredPortsCount}
                </div>
              </div>
              <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Zap className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm theo số Port, tên tiến trình (Node, Python, Go), hoặc PID..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="h-8 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
              />
            </div>
            <button
              onClick={scanPorts}
              disabled={loading}
              className="fluent-btn-standard flex items-center gap-1.5 h-8 px-3 text-xs shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Quét Lại</span>
            </button>
          </div>

          {/* Ports Table */}
          <div className="rounded-lg border border-hub overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-hub-secondary font-semibold">
                <tr>
                  <th className="py-2.5 px-4 w-28">Port</th>
                  <th className="py-2.5 px-4 w-32">Trạng Thái</th>
                  <th className="py-2.5 px-4">Ứng Dụng Liên Kết</th>
                  <th className="py-2.5 px-4">Tiến Trình (Process)</th>
                  <th className="py-2.5 px-4 w-24">PID</th>
                  <th className="py-2.5 px-4 text-right w-36">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-hub-muted">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
                      Đang quét các cổng mạng trên Windows...
                    </td>
                  </tr>
                ) : filteredPorts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-hub-muted">
                      Không tìm thấy cổng nào khớp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredPorts.map((p) => {
                    const isOccupied = p.inUse;
                    const matchingProject = projects.find((pr) => pr.port === p.port);

                    return (
                      <tr
                        key={p.port}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                          isOccupied ? 'bg-amber-500/[0.02]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4 font-mono font-bold text-hub-primary">
                          :{p.port}
                        </td>
                        <td className="py-2.5 px-4">
                          {isOccupied ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Đang dùng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Sẵn sàng
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {matchingProject ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                              {matchingProject.name}
                            </span>
                          ) : (
                            <span className="text-hub-muted text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-hub-primary font-mono text-[11px]">
                          {p.processName || (isOccupied ? 'Unknown' : '—')}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-hub-muted">
                          {p.pid || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {isOccupied ? (
                            <button
                              onClick={() => handleFreePort(p.port)}
                              disabled={killingPort === p.port}
                              className="fluent-btn-standard h-7 px-2.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border-rose-500/30"
                              title="Tự động dừng tiến trình để giải phóng cổng"
                            >
                              {killingPort === p.port ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Trash2 className="h-3 w-3" />
                                  Giải Phóng
                                </span>
                              )}
                            </button>
                          ) : (
                            <span className="text-[11px] text-hub-muted">Khả dụng</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Phím tắt: <strong className="text-hub-primary font-mono">Ctrl + Shift + P</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="fluent-btn-primary h-8 px-5 text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
