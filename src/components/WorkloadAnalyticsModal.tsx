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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Dev Workload & Performance Tracker
              </h3>
              <p className="text-[12px] text-hub-muted">
                Thống kê thời lượng dev, hiệu năng Hot-Sync và độ ổn định hệ thống hôm nay
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
          {loading ? (
            <div className="py-12 text-center text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
              Đang tải dữ liệu phân tích thời gian thực...
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border border-hub p-3 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-xs text-hub-muted">
                    <Clock className="h-3.5 w-3.5 text-blue-500" />
                    <span>Thời gian dev</span>
                  </div>
                  <div className="mt-1 text-lg font-mono font-bold text-hub-primary">
                    {(data.todayDevMinutes / 60).toFixed(1)}h
                  </div>
                  <span className="text-[10px] text-hub-muted">{data.todayDevMinutes} phút hoạt động</span>
                </div>

                <div className="rounded-lg border border-hub p-3 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-xs text-hub-muted">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    <span>Lượt Hot-Sync</span>
                  </div>
                  <div className="mt-1 text-lg font-mono font-bold text-hub-primary">
                    {data.totalSyncsToday}
                  </div>
                  <span className="text-[10px] text-hub-muted">Đồng bộ tự động</span>
                </div>

                <div className="rounded-lg border border-hub p-3 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-xs text-hub-muted">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Tốc độ Sync TB</span>
                  </div>
                  <div className="mt-1 text-lg font-mono font-bold text-emerald-500">
                    {data.averageSyncMs}ms
                  </div>
                  <span className="text-[10px] text-hub-muted">Nhanh nhất: {data.fastestSyncMs}ms</span>
                </div>

                <div className="rounded-lg border border-hub p-3 bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-xs text-hub-muted">
                    <ShieldCheck className="h-3.5 w-3.5 text-purple-500" />
                    <span>Ứng dụng chạy</span>
                  </div>
                  <div className="mt-1 text-lg font-mono font-bold text-hub-primary">
                    {data.runningProjectsCount}/{data.totalProjectsCount}
                  </div>
                  <span className="text-[10px] text-hub-muted">Active Stack</span>
                </div>
              </div>

              {/* Projects Performance Breakdown Table */}
              <div className="rounded-md border border-hub overflow-hidden">
                <div className="px-3 py-2 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold text-hub-muted uppercase">
                  Chi tiết hoạt động từng dự án
                </div>
                <div className="divide-y divide-hub">
                  {data.projects.map((p) => (
                    <div
                      key={p.projectId}
                      className="flex items-center justify-between p-3 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-hub-primary">{p.projectName}</div>
                        <div className="text-[11px] text-hub-muted">
                          Uptime: <strong>{p.uptimeMinutes} phút</strong> • Lượt Sync: <strong>{p.totalSyncs}</strong>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-hub-primary">
                          {p.avgSyncLatencyMs} ms
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Khôi phục: {p.crashesRecovered} sự cố
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Phím tắt mở nhanh: <strong className="font-mono text-hub-primary">Ctrl + Shift + A</strong>
          </span>
          <button
            onClick={onClose}
            className="fluent-btn-standard h-8 px-4 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
