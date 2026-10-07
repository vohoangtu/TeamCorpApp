import React, { useState, useEffect } from 'react';
import { BarChart3, X, RefreshCw, Clock, Zap, Activity, ShieldCheck, Cpu } from 'lucide-react';
import type { WorkloadSummary } from '../types';

interface WorkloadAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkloadAnalyticsModal: React.FC<WorkloadAnalyticsModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<WorkloadSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400 ring-1 ring-blue-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Dev Workload & Performance Analytics
                </h3>
                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[11px] font-semibold">
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Thống kê thời lượng lập trình thực tế, hiệu năng Hot-Sync thời gian thực và độ ổn định hệ thống hôm nay
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-20 text-center text-hub-muted">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-hub-accent" />
              <p className="text-sm font-semibold text-hub-primary">Đang tổng hợp dữ liệu hiệu năng lập trình...</p>
            </div>
          ) : data ? (
            <div className="space-y-5">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between text-xs text-hub-muted">
                    <span className="font-semibold">Thời Gian Dev Hôm Nay</span>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="mt-2 text-2xl font-mono font-bold text-hub-primary">
                    {(data.todayDevMinutes / 60).toFixed(1)} <span className="text-sm font-normal text-hub-muted">giờ</span>
                  </div>
                  <div className="mt-1 text-[11px] text-hub-muted font-medium">
                    {data.todayDevMinutes} phút tích cực hoạt động
                  </div>
                </div>

                <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between text-xs text-hub-muted">
                    <span className="font-semibold">Lượt Hot-Sync</span>
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="mt-2 text-2xl font-mono font-bold text-amber-500">
                    {data.totalSyncsToday} <span className="text-sm font-normal text-hub-muted">lượt</span>
                  </div>
                  <div className="mt-1 text-[11px] text-hub-muted font-medium">
                    Đồng bộ tự động không cần refresh
                  </div>
                </div>

                <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between text-xs text-hub-muted">
                    <span className="font-semibold">Tốc Độ Sync TB</span>
                    <Activity className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="mt-2 text-2xl font-mono font-bold text-emerald-500">
                    {data.averageSyncMs} <span className="text-sm font-normal text-hub-muted">ms</span>
                  </div>
                  <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Nhanh nhất: {data.fastestSyncMs} ms
                  </div>
                </div>

                <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between text-xs text-hub-muted">
                    <span className="font-semibold">Trạng Thái Stack</span>
                    <ShieldCheck className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="mt-2 text-2xl font-mono font-bold text-purple-500">
                    {data.runningProjectsCount} / {data.totalProjectsCount}
                  </div>
                  <div className="mt-1 text-[11px] text-hub-muted font-medium">
                    Microservices đang chạy
                  </div>
                </div>
              </div>

              {/* Projects Performance Breakdown Table */}
              <div className="rounded-xl border border-hub overflow-hidden shadow-2xs">
                <div className="px-4 py-3 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between text-[11px] font-bold text-hub-muted uppercase tracking-wider">
                  <span>Chi Tiết Hoạt Động Theo Dự Án ({data.projects.length})</span>
                  <span>Độ Trễ & Độ Ổn Định</span>
                </div>
                <div className="divide-y divide-hub">
                  {data.projects.length === 0 ? (
                    <div className="p-8 text-center text-xs text-hub-muted">
                      Chưa có phiên làm việc nào được ghi nhận hôm nay.
                    </div>
                  ) : (
                    data.projects.map((p) => (
                      <div
                        key={p.projectId}
                        className="flex items-center justify-between p-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-bold text-xs font-mono">
                            {p.projectName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-hub-primary">{p.projectName}</div>
                            <div className="text-xs text-hub-muted mt-0.5">
                              Thời gian chạy: <strong className="text-hub-secondary font-mono">{p.uptimeMinutes} phút</strong> • Tổng lượt Sync: <strong className="text-hub-secondary font-mono">{p.totalSyncs}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-hub-primary">
                            {p.avgSyncLatencyMs} ms
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Tự khôi phục: {p.crashesRecovered} sự cố
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Phím tắt: <strong className="font-mono text-hub-primary">Ctrl + Shift + A</strong>
          </span>
          <button
            onClick={onClose}
            className="fluent-btn-primary h-8 px-5 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
