import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  FileCode, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Server, 
  Boxes, 
  ChevronDown, 
  Check, 
  History, 
  ShieldCheck, 
  Cpu 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sendFluentToast } from '../utils/notifications';
import type { DeploymentTarget } from '../types';

export const SyncStudioView: React.FC = () => {
  const { projects, triggerSync, switchProjectTarget, deployments, fetchDeployments } = useAppStore();
  const [openTargetMenuId, setOpenTargetMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  const handleDeployAll = () => {
    for (const p of projects) {
      if (p.status === 'running') {
        triggerSync(p.id);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header Banner */}
      <div className="rounded-xl border border-hub bg-gradient-to-r from-[var(--hub-accent)]/15 via-[var(--hub-accent)]/5 to-transparent p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[var(--hub-accent)] animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--hub-accent)]">
                Local Deployment Orchestrator 2026
              </span>
            </div>
            <h2 className="text-xl font-bold text-hub-primary mt-1">
              Trung Tâm Điều Phối Triển Khai Đa Môi Trường
            </h2>
            <p className="text-xs text-hub-muted max-w-2xl mt-1.5 leading-relaxed">
              Mã nguồn trên Windows luôn là Single Source of Truth được cách ly an toàn. Bộ điều phối tự động chạy quy trình Pipeline 3 bước: Kiểm tra mã nguồn ➔ Đẩy sang Target đích (🪟 Windows / 🐧 WSL2 / 🐳 Docker) ➔ Kiểm tra cổng mạng và stream log trực tiếp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => fetchDeployments()}
              className="fluent-btn-standard h-9 px-3 text-xs gap-1.5"
              title="Cập nhật lịch sử deploy"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm mới</span>
            </button>
            <button
              onClick={handleDeployAll}
              className="fluent-btn-primary h-9 px-4 text-xs font-semibold gap-2 shadow-sm"
            >
              <Zap className="h-4 w-4 fill-current text-amber-300" />
              <span>Deploy All Running Apps</span>
            </button>
          </div>
        </div>

        {/* 3-Stage Visual Pipeline Diagram */}
        <div className="mt-6 pt-5 border-t border-hub/60 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* Source Box */}
          <div className="rounded-lg border border-hub bg-hub-card/80 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-hub-muted mb-1 flex items-center gap-1.5">
              <span>📁 Source of Truth</span>
            </div>
            <div className="font-semibold text-hub-primary">Windows Host File System</div>
            <div className="text-[11px] text-hub-muted mt-0.5">IDE, VS Code, Git edits in C:\...</div>
          </div>

          {/* Stage 1 */}
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 relative">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mb-1 flex items-center gap-1">
              <span>Stage 1: Build & Validate</span>
            </div>
            <div className="font-semibold text-hub-primary">Lint & Compile Artifact</div>
            <div className="text-[11px] text-hub-muted mt-0.5">Build script hoặc Direct watch</div>
          </div>

          {/* Stage 2 */}
          <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 relative">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-500 mb-1 flex items-center gap-1">
              <span>Stage 2: Target Dispatch</span>
            </div>
            <div className="font-semibold text-hub-primary">Đẩy sang Môi Trường Đích</div>
            <div className="text-[11px] text-hub-muted mt-0.5">🪟 Windows | 🐧 WSL2 | 🐳 Docker</div>
          </div>

          {/* Stage 3 */}
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1 flex items-center gap-1">
              <span>Stage 3: Health Probe</span>
            </div>
            <div className="font-semibold text-hub-primary">Live Verification (:port)</div>
            <div className="text-[11px] text-hub-muted mt-0.5">Ping port HTTP/TCP & Stream Logs</div>
          </div>
        </div>
      </div>

      {/* Deploy Matrix by App */}
      <div className="rounded-xl border border-hub bg-hub-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-hub flex items-center justify-between">
          <h3 className="text-xs font-bold text-hub-primary uppercase tracking-wider flex items-center gap-2">
            <Server className="h-4 w-4 text-[var(--hub-accent)]" />
            <span>Mục Tiêu Triển Khai Hiện Tại ({projects.length} Dự Án)</span>
          </h3>
          <span className="text-xs text-hub-muted">
            Nhấp vào huy hiệu mục tiêu để chuyển đổi môi trường tức thì
          </span>
        </div>

        <div className="divide-y divide-hub">
          {projects.map((project) => (
            <div
              key={project.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-hub-primary truncate">
                    {project.name}
                  </h4>
                  <span className="text-xs font-mono text-hub-muted bg-black/[0.04] dark:bg-white/[0.04] px-1.5 py-0.5 rounded">
                    :{project.port || 'No port'}
                  </span>

                  {/* 1-Click Target Switcher */}
                  <div className="relative inline-block">
                    <button
                      onClick={() => setOpenTargetMenuId(openTargetMenuId === project.id ? null : project.id)}
                      className="inline-flex items-center gap-1 rounded bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] px-2 py-0.5 text-xs font-semibold text-hub-primary transition-colors"
                      title="Đổi Mục Tiêu Triển Khai"
                    >
                      <span>{project.runtimeType === 'docker' ? '🐳 Docker' : project.runtimeType === 'wsl2' ? '🐧 WSL2 Sandbox' : '🪟 Windows Native'}</span>
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </button>

                    {openTargetMenuId === project.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenTargetMenuId(null)} />
                        <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-hub bg-hub-card p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 space-y-0.5 text-left">
                          <div className="px-2 py-1 text-[10px] font-bold text-hub-muted uppercase tracking-wider">
                            Chuyển Đổi Target
                          </div>
                          <button
                            onClick={async () => {
                              setOpenTargetMenuId(null);
                              if (project.runtimeType !== 'native') {
                                await switchProjectTarget(project.id, 'native');
                                sendFluentToast('Target Đã Đổi', 'Chuyển sang 🪟 Windows Native thành công', 'success');
                              }
                            }}
                            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                              project.runtimeType === 'native' ? 'bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-semibold' : 'text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            <span>🪟 Windows Native</span>
                            {project.runtimeType === 'native' && <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={async () => {
                              setOpenTargetMenuId(null);
                              if (project.runtimeType !== 'wsl2') {
                                await switchProjectTarget(project.id, 'wsl2');
                                sendFluentToast('Target Đã Đổi', 'Chuyển sang 🐧 WSL2 Sandbox thành công', 'success');
                              }
                            }}
                            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                              project.runtimeType === 'wsl2' ? 'bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-semibold' : 'text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            <span>🐧 WSL2 Sandbox</span>
                            {project.runtimeType === 'wsl2' && <Check className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={async () => {
                              setOpenTargetMenuId(null);
                              if (project.runtimeType !== 'docker') {
                                await switchProjectTarget(project.id, 'docker');
                                sendFluentToast('Target Đã Đổi', 'Chuyển sang 🐳 Docker Container thành công', 'success');
                              }
                            }}
                            className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                              project.runtimeType === 'docker' ? 'bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-semibold' : 'text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                            }`}
                          >
                            <span>🐳 Docker Container</span>
                            {project.runtimeType === 'docker' && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs font-mono text-hub-muted truncate mt-1">
                  📁 {project.sourcePath}
                </p>

                <div className="flex items-center gap-3 mt-2 text-xs text-hub-muted">
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-[var(--hub-accent)]" />
                    Deployments: <strong className="text-hub-primary">{project.syncCount || 0}</strong>
                  </span>
                  {project.lastSyncDurationMs !== undefined && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <Clock className="h-3.5 w-3.5" />
                      Gần nhất: {project.lastSyncDurationMs}ms
                    </span>
                  )}
                  {project.autoSync && (
                    <span className="rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.2 text-[10px] font-semibold">
                      Auto-Deploy on Save
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => triggerSync(project.id)}
                  disabled={project.status === 'syncing'}
                  className="fluent-btn-primary h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
                >
                  <Zap className={`h-3.5 w-3.5 fill-current text-amber-300 ${project.status === 'syncing' ? 'animate-bounce' : ''}`} />
                  <span>{project.status === 'syncing' ? 'Deploying...' : 'TRIGGER DEPLOY'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Deployment History Logs */}
      <div className="rounded-xl border border-hub bg-hub-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-hub flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--hub-accent)]" />
            <h3 className="text-xs font-bold text-hub-primary uppercase tracking-wider">
              Lịch Sử Các Đợt Deploy Gần Nhất
            </h3>
          </div>
          <span className="text-xs text-hub-muted">{deployments.length} đợt triển khai được ghi nhận</span>
        </div>

        {deployments.length === 0 ? (
          <div className="p-8 text-center text-xs text-hub-muted">
            Chưa có đợt triển khai nào được thực hiện trong phiên làm việc này. Hãy nhấn nút "TRIGGER DEPLOY" để chạy pipeline.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-hub bg-black/[0.02] dark:bg-white/[0.02] text-hub-muted font-semibold">
                  <th className="p-3">Thời Điểm</th>
                  <th className="p-3">Ứng Dụng</th>
                  <th className="p-3">Target Đích</th>
                  <th className="p-3">Thời Lượng</th>
                  <th className="p-3">Kích Hoạt Bởi</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hub">
                {deployments.map((d) => {
                  const isSuccess = d.status === 'success';
                  const dateStr = new Date(d.timestamp).toLocaleTimeString();
                  return (
                    <tr key={d.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                      <td className="p-3 font-mono text-hub-muted">{dateStr}</td>
                      <td className="p-3 font-semibold text-hub-primary">{d.projectName}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 rounded bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 font-medium text-hub-primary">
                          {d.target === 'docker' ? '🐳 Docker' : d.target === 'wsl2' ? '🐧 WSL2' : '🪟 Windows'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {d.durationMs}ms
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-black/[0.04] dark:bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-hub-muted capitalize">
                          {d.trigger}
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isSuccess
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${isSuccess ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {d.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-hub-muted max-w-[200px] truncate" title={d.message}>
                        {d.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
