import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Zap, 
  ExternalLink, 
  Folder, 
  Terminal, 
  Code2, 
  Trash2, 
  GitBranch, 
  Box, 
  Cpu, 
  CheckCircle2,
  KeyRound,
  Command,
  Database,
  HardDrive,
  Sparkles,
  Activity,
  MoreHorizontal,
  ShieldAlert,
  ChevronDown,
  Check,
  Share2,
  Wifi,
  Globe
} from 'lucide-react';
import type { Project } from '../types';
import { useAppStore } from '../store/useAppStore';
import { sendFluentToast } from '../utils/notifications';

interface ProjectTableViewProps {
  projects: Project[];
}

export const ProjectTableView: React.FC<ProjectTableViewProps> = ({ projects }) => {
  const { 
    startProject, 
    stopProject, 
    restartProject, 
    triggerSync, 
    deleteProject, 
    setActiveProject, 
    activeProjectId,
    gitStatuses,
    gitPull,
    setActiveEnvProject,
    setActiveCleanerProject,
    setActiveScriptsProject,
    setActiveDbProject,
    setActiveDoctorProject,
    setActiveCopilot,
    sentinelHealth,
    switchProjectTarget,
    setActiveResourceInspectorProject,
    toggleProjectShare,
    triggerRemoteProjectAction,
  } = useAppStore();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openTargetMenuId, setOpenTargetMenuId] = useState<string | null>(null);
  const [remoteActingId, setRemoteActingId] = useState<string | null>(null);

  const statusConfig = {
    running: {
      badge: 'bg-[#0E7A0D]/10 text-[#0E7A0D] dark:bg-[#439542]/15 dark:text-[#58B957] border-[#0E7A0D]/20',
      dot: 'bg-[#0E7A0D] dark:bg-[#58B957]',
      label: 'RUNNING',
    },
    stopped: {
      badge: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700',
      dot: 'bg-neutral-400',
      label: 'STOPPED',
    },
    syncing: {
      badge: 'bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5] border-[#0F6CBD]/30',
      dot: 'bg-[#0F6CBD] dark:bg-[#479EF5] animate-ping',
      label: 'SYNCING',
    },
    building: {
      badge: 'bg-[#B74700]/10 text-[#B74700] dark:bg-[#D83B01]/20 dark:text-[#F7630C] border-[#B74700]/30',
      dot: 'bg-[#B74700] dark:bg-[#F7630C] animate-pulse',
      label: 'BUILDING',
    },
    error: {
      badge: 'bg-[#D13438]/10 text-[#D13438] dark:bg-[#D13438]/20 dark:text-[#FF4343] border-[#D13438]/30',
      dot: 'bg-[#D13438] dark:bg-[#FF4343]',
      label: 'ERROR',
    },
  };

  return (
    <div className="fluent-card overflow-hidden w-full">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-hub bg-black/[0.02] dark:bg-white/[0.02] text-hub-muted text-[12px] font-semibold select-none">
              <th className="py-2.5 px-4 w-28">Trạng thái</th>
              <th className="py-2.5 px-4 min-w-[200px]">Ứng dụng</th>
              <th className="py-2.5 px-4 min-w-[260px]">Folder Local / Repo</th>
              <th className="py-2.5 px-4 w-36">Target Deploy</th>
              <th className="py-2.5 px-4 w-44">Tài nguyên (CPU / RAM)</th>
              <th className="py-2.5 px-4 w-28">Cổng Port</th>
              <th className="py-2.5 px-4 w-36">Deployments</th>
              <th className="py-2.5 px-4 text-right min-w-[260px]">Thao tác Điều khiển</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
            {projects.map((project) => {
              const isSelected = activeProjectId === project.id;
              const isRunning = project.status === 'running';
              const isSyncing = project.status === 'syncing';
              const cfg = statusConfig[project.status];

              return (
                <tr
                  key={project.id}
                  className={`hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors ${
                    isSelected ? 'bg-[#0F6CBD]/[0.05] dark:bg-[#0F6CBD]/[0.08]' : ''
                  }`}
                >
                  {/* Status Badge */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${cfg.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    {sentinelHealth[project.id]?.status === 'healthy' && (
                      <span className="ml-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold" title="Sentinel Heartbeat">
                        {sentinelHealth[project.id]?.latencyMs || 12}ms
                      </span>
                    )}
                  </td>

                  {/* App Name & PID & Node Badge */}
                  <td className="py-2.5 px-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-neutral-900 dark:text-white truncate max-w-[200px]" title={project.name}>
                        {project.name}
                      </span>

                      {/* Remote Mesh Node Badge */}
                      {project.isRemote && (
                        <span
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.2 text-[10px] font-semibold border ${
                            project.connectionType === 'lan'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          }`}
                          title={`Máy chủ: ${project.nodeName}`}
                        >
                          {project.connectionType === 'lan' ? <Wifi className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}
                          <span>{project.nodeName || 'Remote'}</span>
                        </span>
                      )}

                      {/* Local Team Share Toggle */}
                      {!project.isRemote && (
                        <button
                          onClick={() => toggleProjectShare(project.id)}
                          className={`p-1 rounded text-xs transition-colors ${
                            project.shareToTeam !== false
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-hub-muted hover:text-hub-primary hover:bg-black/[0.04]'
                          }`}
                          title={project.shareToTeam !== false ? "Đang chia sẻ với Team Mesh (Click để tắt)" : "Chia sẻ với Team Mesh (Click để bật)"}
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    {project.pid && (
                      <span className="text-xs font-mono text-[#0E7A0D] dark:text-[#58B957] flex items-center gap-1 mt-0.5">
                        <Cpu className="h-3 w-3" /> PID: {project.pid}
                      </span>
                    )}
                  </td>

                  {/* Source Path & Command */}
                  <td className="py-2.5 px-3.5">
                    <div className="font-mono text-xs text-neutral-700 dark:text-neutral-300 truncate max-w-[320px]" title={project.sourcePath}>
                      {project.sourcePath}
                    </div>
                    <div className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 truncate max-w-[320px]">
                      $ {project.runCommand}
                    </div>
                  </td>

                  {/* Runtime Type & Git Status HUD */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <button
                          onClick={() => setOpenTargetMenuId(openTargetMenuId === project.id ? null : project.id)}
                          className="inline-flex items-center gap-1 rounded bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] px-2 py-0.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors"
                          title="Đổi Mục Tiêu Triển Khai (Windows / WSL2 / Docker)"
                        >
                          <span>{project.runtimeType === 'docker' ? '🐳 Docker' : project.runtimeType === 'wsl2' ? '🐧 WSL2' : '🪟 Windows'}</span>
                          <ChevronDown className="h-3 w-3 opacity-60" />
                        </button>

                        {openTargetMenuId === project.id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenTargetMenuId(null)} />
                            <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-hub bg-hub-card p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 space-y-0.5 text-left">
                              <div className="px-2 py-1 text-[10px] font-bold text-hub-muted uppercase tracking-wider">
                                Đổi Target Triển Khai
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
                      {gitStatuses[project.id]?.isGit && (
                        <span 
                          className="inline-flex items-center gap-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[11px] font-mono font-semibold"
                          title={`Nhánh: ${gitStatuses[project.id]?.branch} • ${gitStatuses[project.id]?.uncommittedCount || 0} file chưa commit`}
                        >
                          <GitBranch className="h-3 w-3" />
                          <span>{gitStatuses[project.id]?.branch}</span>
                          {(gitStatuses[project.id]?.uncommittedCount || 0) > 0 && (
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={`${gitStatuses[project.id]?.uncommittedCount} thay đổi chưa commit`} />
                          )}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Resource Telemetry (CPU / RAM) */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {isRunning ? (
                      <button
                        onClick={() => setActiveResourceInspectorProject(project)}
                        className="group/res flex flex-col gap-1 text-left hover:bg-black/[0.04] dark:hover:bg-white/[0.06] p-1 rounded transition-colors"
                        title="Nhấp để xem chi tiết Resource Inspector"
                      >
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                            <Zap className="h-3 w-3" />
                            {project.cpuPercent ?? 0}%
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <HardDrive className="h-3 w-3" />
                            {project.memoryMb ?? 0} MB
                          </span>
                        </div>
                        {/* Mini Dual-Meter Progress Bars */}
                        <div className="grid grid-cols-2 gap-1 h-1 w-28">
                          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden" title={`CPU Load: ${project.cpuPercent ?? 0}%`}>
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all"
                              style={{ width: `${Math.min(project.cpuPercent ?? 0, 100)}%` }}
                            />
                          </div>
                          <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden" title={`RAM Load: ${project.memoryMb ?? 0} MB`}>
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.min(((project.memoryMb ?? 0) / 1024) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400 font-mono italic">Standby</span>
                    )}
                  </td>

                  {/* Port */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {project.port ? (
                      <a
                        href={project.remoteUrl || `http://localhost:${project.port}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#0F6CBD] dark:text-[#479EF5] text-sm font-semibold hover:underline"
                        title={project.isRemote ? `Mở cổng từ xa trên máy ${project.nodeName}` : 'Mở cổng trên trình duyệt'}
                      >
                        :{project.port}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
                    )}
                  </td>

                  {/* Hot-Sync Duration */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {project.lastSyncDurationMs !== undefined ? (
                      <span className="flex items-center gap-1 text-sm text-[#0E7A0D] dark:text-[#58B957] font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {project.lastSyncDurationMs}ms
                        <span className="text-xs text-neutral-400 font-normal ml-0.5">
                          ({project.syncCount})
                        </span>
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-xs">Chưa sync</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                    {project.isRemote ? (
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Remote Action: Hot-Sync via Mesh */}
                        <button
                          onClick={async () => {
                            if (!project.nodeId) return;
                            setRemoteActingId(project.id);
                            await triggerRemoteProjectAction(project.nodeId, project.id, 'sync');
                            setRemoteActingId(null);
                          }}
                          disabled={remoteActingId === project.id}
                          className="fluent-btn-primary h-7 px-2.5 text-[12px] gap-1.5 shadow-xs bg-amber-600 hover:bg-amber-700"
                          title={`Gửi lệnh Hot-Sync từ xa qua mạng Mesh tới trạm ${project.nodeName || ''}`}
                        >
                          <Zap className={`h-3.5 w-3.5 shrink-0 text-white fill-current ${remoteActingId === project.id ? 'animate-bounce' : ''}`} />
                          <span className="font-semibold">{remoteActingId === project.id ? 'Sending...' : 'REMOTE SYNC'}</span>
                        </button>

                        {/* Remote Action: Restart via Mesh */}
                        <button
                          onClick={async () => {
                            if (!project.nodeId) return;
                            setRemoteActingId(project.id);
                            await triggerRemoteProjectAction(project.nodeId, project.id, 'restart');
                            setRemoteActingId(null);
                          }}
                          disabled={remoteActingId === project.id}
                          className="fluent-icon-btn h-7 w-7 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                          title={`Khởi động lại từ xa trên trạm ${project.nodeName || 'đồng nghiệp'}`}
                        >
                          <RotateCw className={`h-3.5 w-3.5 ${remoteActingId === project.id ? 'animate-spin' : ''}`} />
                        </button>

                        {/* Remote Action: View Logs Terminal */}
                        <button
                          onClick={() => setActiveProject(project.id)}
                          className={`fluent-icon-btn h-7 w-7 ${
                            isSelected
                              ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] bg-[var(--hub-accent)]/10'
                              : 'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10'
                          }`}
                          title={`Xem Console Logs từ xa (${project.nodeName || 'Peer'})`}
                        >
                          <Terminal className="h-3.5 w-3.5" />
                        </button>

                        {/* Direct Web Opening */}
                        {project.remoteUrl && (
                          <a
                            href={project.remoteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="fluent-icon-btn h-7 w-7 text-hub-muted hover:text-[var(--hub-accent)] hover:bg-[var(--hub-accent)]/10"
                            title={`Mở giao diện web từ xa: ${project.remoteUrl}`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Compact Trigger Deploy */}
                        <button
                          onClick={() => triggerSync(project.id)}
                          disabled={isSyncing}
                          className="fluent-btn-primary h-7 px-2.5 text-[12px] gap-1.5 shadow-xs"
                          title="Đồng bộ lại source code từ Windows sang môi trường đích và redeploy"
                        >
                          <Zap className={`h-3.5 w-3.5 shrink-0 text-amber-400 fill-amber-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                          <span className="font-semibold">{isSyncing ? 'Deploying...' : 'TRIGGER DEPLOY'}</span>
                        </button>

                        {isRunning ? (
                          <button
                            onClick={() => stopProject(project.id)}
                            className="fluent-icon-btn h-7 w-7 text-hub-muted hover:text-rose-500 hover:bg-rose-500/10"
                            title="Dừng ứng dụng (Stop)"
                          >
                            <Square className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => startProject(project.id)}
                            className="fluent-icon-btn h-7 w-7 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            title="Khởi chạy (Start)"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                          </button>
                        )}

                        <button
                          onClick={() => restartProject(project.id)}
                          className="fluent-icon-btn h-7 w-7 text-hub-muted hover:text-hub-primary"
                          title="Khởi động lại (Restart)"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>

                        <button
                          onClick={() => setActiveProject(project.id)}
                          className={`fluent-icon-btn h-7 w-7 ${
                            isSelected
                              ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] bg-[var(--hub-accent)]/10'
                              : 'text-hub-muted hover:text-hub-primary'
                          }`}
                          title="Xem Console Logs"
                        >
                          <Terminal className="h-3.5 w-3.5" />
                        </button>

                        {/* More Actions Dropdown Menu */}
                        <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                          className={`fluent-icon-btn h-7 w-7 ${
                            openMenuId === project.id
                              ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] bg-[var(--hub-accent)]/10'
                              : 'text-hub-muted hover:text-hub-primary'
                          }`}
                          title="Công cụ mở rộng"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </button>

                        {openMenuId === project.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setOpenMenuId(null)} 
                            />
                            <div className="absolute right-0 bottom-full mb-1 z-50 w-52 rounded-lg border border-hub bg-hub-card p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 divide-y divide-hub">
                              <div className="space-y-0.5 pb-1">
                                <button
                                  onClick={() => {
                                    setActiveResourceInspectorProject(project);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <Activity className="h-3.5 w-3.5 text-sky-500" />
                                  <span>Telemetry Giám sát Tài nguyên</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveEnvProject({ id: project.id, name: project.name });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <KeyRound className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>.env & Secrets Studio</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveScriptsProject({ id: project.id, name: project.name });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <Command className="h-3.5 w-3.5 text-amber-500" />
                                  <span>NPM Scripts Matrix</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveDbProject({ id: project.id, name: project.name });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <Database className="h-3.5 w-3.5 text-indigo-500" />
                                  <span>Database Inspector</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveCleanerProject({ id: project.id, name: project.name });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <HardDrive className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Dọn rác (node_modules)</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveDoctorProject({ id: project.id, name: project.name });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                                  <span>Dependency Doctor</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveCopilot({ isOpen: true, projectName: project.name });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                                  <span>✨ AI Terminal Copilot</span>
                                </button>

                                {gitStatuses[project.id]?.isGit && (
                                  <button
                                    onClick={async () => {
                                      setOpenMenuId(null);
                                      const res = await gitPull(project.id);
                                      sendFluentToast(
                                        res.success ? 'Git Pull thành công' : 'Git Pull thất bại',
                                        res.message,
                                        res.success ? 'success' : 'error'
                                      );
                                    }}
                                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                  >
                                    <GitBranch className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>Git Pull Remote</span>
                                  </button>
                                )}
                              </div>

                              <div className="space-y-0.5 py-1">
                                <button
                                  onClick={() => {
                                    window.location.href = `vscode://file/${project.sourcePath.replace(/\\/g, '/')}`;
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <Code2 className="h-3.5 w-3.5 text-[var(--hub-accent)]" />
                                  <span>Mở trong VS Code</span>
                                </button>

                                <button
                                  onClick={() => {
                                    fetch(`/api/projects/${project.id}/open-folder`, { method: 'POST' });
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                                >
                                  <Folder className="h-3.5 w-3.5 text-amber-500" />
                                  <span>Mở trong Explorer</span>
                                </button>
                              </div>

                              <div className="pt-1">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    if (confirm(`Xóa ứng dụng "${project.name}" khỏi WinDev Hub?`)) {
                                      deleteProject(project.id);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Xóa ứng dụng</span>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
