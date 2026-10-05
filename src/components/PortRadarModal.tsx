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

  const occupiedPorts = ports.filter((p) => p.inUse);
  const freePorts = ports.filter((p) => !p.inUse);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-amber-500/10 text-amber-500">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Port Conflict Radar (Quét & Giải Phóng Port)
              </h3>
              <p className="text-[12px] text-hub-muted">
                Phát hiện cổng mạng bị chiếm dụng và giải phóng ngay chỉ với 1 click.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-hub-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-hub-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {actionMessage && (
            <div className="rounded-md border border-hub-subtle bg-black/[0.03] dark:bg-white/[0.04] p-3 text-xs font-semibold text-hub-primary">
              {actionMessage}
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-hub p-3 bg-black/[0.02] dark:bg-white/[0.02]">
              <span className="text-[11px] text-hub-muted">Đang chiếm dụng (Active)</span>
              <div className="text-[20px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {occupiedPorts.length} Ports
              </div>
            </div>
            <div className="rounded-md border border-hub p-3 bg-black/[0.02] dark:bg-white/[0.02]">
              <span className="text-[11px] text-hub-muted">Cổng khả dụng (Free)</span>
              <div className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {freePorts.length} Ports
              </div>
            </div>
          </div>

          {/* Ports Table */}
          <div className="rounded-md border border-hub overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-hub-secondary font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Port</th>
                  <th className="py-2.5 px-3">Trạng Thái</th>
                  <th className="py-2.5 px-3">Tiến Trình (Process)</th>
                  <th className="py-2.5 px-3">PID</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-hub-muted">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-hub-accent" />
                      Đang quét các cổng mạng trên Windows...
                    </td>
                  </tr>
                ) : ports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-hub-muted">
                      Chưa có dữ liệu cổng mạng.
                    </td>
                  </tr>
                ) : (
                  ports.map((p) => {
                    const isOccupied = p.inUse;
                    return (
                      <tr
                        key={p.port}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                          isOccupied ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-hub-primary">
                          :{p.port}
                        </td>
                        <td className="py-2.5 px-3">
                          {isOccupied ? (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Đang dùng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Sẵn sàng
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-hub-primary">
                          {p.processName || (isOccupied ? 'Unknown' : '—')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-hub-muted">
                          {p.pid || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Phím tắt: <strong className="text-hub-primary font-mono">Ctrl + Shift + P</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={scanPorts}
              disabled={loading}
              className="fluent-btn-standard flex items-center gap-1.5 h-8 px-3 text-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Quét Lại</span>
            </button>
            <button
              onClick={onClose}
              className="fluent-btn-primary h-8 px-4 text-xs font-semibold"
            >
              Hoàn Tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
