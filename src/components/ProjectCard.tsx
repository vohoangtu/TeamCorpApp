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
  Sparkles,
  CheckCircle2,
  KeyRound,
  Command,
  Database,
  HardDrive,
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

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
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

  const isSelected = activeProjectId === project.id;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);
  const [isRemoteActing, setIsRemoteActing] = useState(false);
  const isRunning = project.status === 'running';
  const isSyncing = project.status === 'syncing';
  const isBuilding = project.status === 'building';

  // Fluent 2 Semantic Status Badges
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
  }[project.status];

  const handleOpenFolder = () => {
    fetch(`/api/projects/${project.id}/open-folder`, { method: 'POST' });
  };

  const handleOpenVSCode = () => {
    window.location.href = `vscode://file/${project.sourcePath.replace(/\\/g, '/')}`;
  };

  return (
    <div
      className={`fluent-card group relative flex flex-col justify-between transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-[var(--hub-accent)]'
          : 'hover:border-neutral-400 dark:hover:border-neutral-500'
      }`}
    >
      {/* Top Accent Indicator */}
      <div
        className={`h-0.5 w-full rounded-t-[8px] transition-all ${
          isSyncing
            ? 'bg-[var(--hub-accent)] animate-pulse'
            : isRunning
            ? 'bg-[#0E7A0D] dark:bg-[#58B957]'
            : 'bg-transparent'
        }`}
      />

      <div className="p-3.5 flex-1 flex flex-col">
        {/* Header: Badges & Port */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold border ${statusConfig.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dot}`} />
              {statusConfig.label}
            </span>

            {/* 1-Click Target Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsTargetMenuOpen(!isTargetMenuOpen)}
                className="inline-flex items-center gap-1 rounded bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] px-1.5 py-0.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 transition-colors"
                title="Nhấp để đổi Mục Tiêu Triển Khai (Windows / WSL2 / Docker)"
              >
                <span>{project.runtimeType === 'docker' ? '🐳 Docker' : project.runtimeType === 'wsl2' ? '🐧 WSL2' : '🪟 Windows'}</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {isTargetMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsTargetMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 w-48 rounded-lg border border-hub bg-hub-card p-1 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 space-y-0.5">
                    <div className="px-2 py-1 text-[10px] font-bold text-hub-muted uppercase tracking-wider">
                      Đổi Target Triển Khai
                    </div>
                    <button
                      onClick={async () => {
                        setIsTargetMenuOpen(false);
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
                        setIsTargetMenuOpen(false);
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
                        setIsTargetMenuOpen(false);
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

            {/* Git Branch Badge & Status HUD */}
            {gitStatuses[project.id]?.isGit && (
              <span
                className="inline-flex items-center gap-1 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 text-xs font-mono font-medium"
                title={`Nhánh: ${gitStatuses[project.id]?.branch} • ${gitStatuses[project.id]?.uncommittedCount || 0} file chưa commit`}
              >
                <GitBranch className="h-3 w-3" />
                <span>{gitStatuses[project.id]?.branch}</span>
                {(gitStatuses[project.id]?.uncommittedCount || 0) > 0 && (
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
              </span>
            )}

            {/* Health Sentinel Heartbeat Badge */}
            {sentinelHealth[project.id]?.status === 'healthy' && (
              <span
                className="inline-flex items-center gap-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-xs font-mono font-medium"
                title={`Sentinel: Phản hồi tốt (${sentinelHealth[project.id]?.latencyMs || 12}ms)`}
              >
                <Activity className="h-3 w-3" />
                <span>{sentinelHealth[project.id]?.latencyMs || 12}ms</span>
              </span>
            )}
            {sentinelHealth[project.id]?.status === 'down' && (
              <span
                className="inline-flex items-center gap-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 text-xs font-mono font-bold animate-pulse"
                title="Sentinel: Không phản hồi (Đang khôi phục tự động)"
              >
                <Activity className="h-3 w-3" />
                <span>DOWN</span>
              </span>
            )}

            {/* Team Mesh Node Badge */}
            {project.isRemote && (
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold border ${
                  project.connectionType === 'lan'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}
                title={`Chạy trên máy: ${project.nodeName}`}
              >
                {project.connectionType === 'lan' ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
                <span>{project.nodeName || 'Remote'}</span>
              </span>
            )}

            {/* Team Mesh Sharing Toggle for local projects */}
            {!project.isRemote && (
              <button
                onClick={() => toggleProjectShare(project.id)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium border transition-colors ${
                  project.shareToTeam !== false
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-black/[0.03] dark:bg-white/[0.04] text-hub-muted border-hub hover:text-hub-primary'
                }`}
                title={project.shareToTeam !== false ? "Đang chia sẻ với Team Mesh (Nhấp để tắt)" : "Chia sẻ ứng dụng này với Team Mesh (Nhấp để bật)"}
              >
                <Share2 className="h-3 w-3" />
                <span className="hidden sm:inline">{project.shareToTeam !== false ? 'Shared' : 'Private'}</span>
              </button>
            )}
          </div>

          {project.port && (
            <a
              href={project.remoteUrl || `http://localhost:${project.port}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 rounded-md border border-[#0F6CBD]/30 bg-[#0F6CBD]/10 hover:bg-[#0F6CBD]/20 px-2 py-0.5 text-xs font-semibold text-[#0F6CBD] dark:text-[#479EF5] transition-colors shrink-0"
              title={project.isRemote ? `Mở cổng từ xa trên máy ${project.nodeName}` : "Mở cổng trên trình duyệt"}
            >
              <span>:{project.port}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Project Title & Path */}
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-[#0F6CBD] dark:group-hover:text-[#479EF5] transition-colors">
          {project.name}
        </h3>
        <p className="text-xs font-mono text-neutral-500 truncate mt-0.5" title={project.sourcePath}>
          {project.sourcePath}
        </p>

        {/* Command & Metrics Surface */}
        <div className="mt-3 rounded-md border border-black/[0.06] dark:border-white/[0.06] bg-[#F9F9F9] dark:bg-[#1A1A1A] p-2.5 text-xs space-y-2">
          <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
            <span className="font-mono text-xs bg-white dark:bg-[#242424] px-1.5 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.06] truncate max-w-[180px]">
              $ {project.runCommand}
            </span>
            {project.pid && (
              <button
                onClick={() => setActiveResourceInspectorProject(project)}
                className="flex items-center gap-1 text-xs text-[#0E7A0D] dark:text-[#58B957] font-semibold hover:underline"
                title="Nhấp để mở chi tiết Resource Inspector"
              >
                <Cpu className="h-3 w-3" />
                PID: {project.pid}
              </button>
            )}
          </div>

          {/* Live Resource Telemetry Bar when Running */}
          {isRunning && (
            <div className="rounded bg-black/[0.03] dark:bg-white/[0.04] p-1.5 border border-black/[0.04] dark:border-white/[0.04]">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <button
                  onClick={() => setActiveResourceInspectorProject(project)}
                  className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                  title="Nhấp để xem đồ thị CPU và Process Tree"
                >
                  <Zap className="h-3 w-3" />
                  <span>{project.cpuPercent ?? 0}% CPU</span>
                </button>
                <button
                  onClick={() => setActiveResourceInspectorProject(project)}
                  className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  title="Nhấp để xem đồ thị RAM và Process Tree"
                >
                  <HardDrive className="h-3 w-3" />
                  <span>{project.memoryMb ?? 0} MB</span>
                </button>
                <button
                  onClick={() => setActiveResourceInspectorProject(project)}
                  className="flex items-center gap-0.5 text-[10px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  title="Mở Resource Inspector"
                >
                  <Activity className="h-2.5 w-2.5" />
                  <span>Chi tiết</span>
                </button>
              </div>

              {/* Mini Dual-Meter Progress Bars */}
              <div className="grid grid-cols-2 gap-1.5 h-1">
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden" title={`CPU Load: ${project.cpuPercent ?? 0}%`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (project.cpuPercent ?? 0) > 70
                        ? 'bg-rose-500'
                        : (project.cpuPercent ?? 0) > 30
                        ? 'bg-amber-500'
                        : 'bg-sky-500'
                    }`}
                    style={{ width: `${Math.min(project.cpuPercent ?? 0, 100)}%` }}
                  />
                </div>
                <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden" title={`RAM Load: ${project.memoryMb ?? 0} MB`}>
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      (project.memoryMb ?? 0) > 800
                        ? 'bg-rose-500'
                        : (project.memoryMb ?? 0) > 300
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(((project.memoryMb ?? 0) / 1024) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.06] pt-1.5 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-[#0F6CBD] dark:text-[#479EF5]" />
              Deployments: <strong className="text-neutral-800 dark:text-white">{project.syncCount || 0}</strong>
            </span>
            {project.lastSyncDurationMs !== undefined ? (
              <span className="flex items-center gap-1 text-[#0E7A0D] dark:text-[#58B957] font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {project.lastSyncDurationMs}ms
              </span>
            ) : (
              <span className="text-neutral-400">Chưa deploy</span>
            )}
          </div>
        </div>
      </div>

      {/* Fluent 2 Action Bar */}
      <div className="px-3.5 pb-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-1.5">
        {project.isRemote ? (
          <>
            {/* Remote Action: Hot-Sync via Mesh */}
            <button
              onClick={async () => {
                if (!project.nodeId) return;
                setIsRemoteActing(true);
                await triggerRemoteProjectAction(project.nodeId, project.id, 'sync');
                setIsRemoteActing(false);
              }}
              disabled={isRemoteActing}
              className="fluent-btn-primary flex-1 h-8 text-[13px] gap-2 shadow-xs bg-amber-600 hover:bg-amber-700"
              title={`Gửi lệnh Hot-Sync từ xa qua mạng Mesh tới trạm ${project.nodeName || ''}`}
            >
              <Zap className={`h-4 w-4 shrink-0 text-white fill-current ${isRemoteActing ? 'animate-bounce' : ''}`} />
              <span className="font-semibold tracking-wide">{isRemoteActing ? 'Đang gửi lệnh...' : 'REMOTE SYNC'}</span>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {/* Remote Action: Restart via Mesh */}
              <button
                onClick={async () => {
                  if (!project.nodeId) return;
                  setIsRemoteActing(true);
                  await triggerRemoteProjectAction(project.nodeId, project.id, 'restart');
                  setIsRemoteActing(false);
                }}
                disabled={isRemoteActing}
                className="fluent-icon-btn h-8 w-8 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                title={`Khởi động lại từ xa trên trạm ${project.nodeName || 'đồng nghiệp'}`}
              >
                <RotateCw className={`h-4 w-4 ${isRemoteActing ? 'animate-spin' : ''}`} />
              </button>

              {/* Remote Action: View Logs Terminal */}
              <button
                onClick={() => setActiveProject(project.id)}
                className={`fluent-icon-btn h-8 w-8 ${
                  isSelected
                    ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] bg-[var(--hub-accent)]/10'
                    : 'text-sky-600 dark:text-sky-400 hover:bg-sky-500/10'
                }`}
                title={`Xem Console Logs từ xa (${project.nodeName || 'Peer'})`}
              >
                <Terminal className="h-4 w-4" />
              </button>

              {/* Direct Web Opening */}
              {project.remoteUrl && (
                <a
                  href={project.remoteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="fluent-icon-btn h-8 w-8 text-hub-muted hover:text-[var(--hub-accent)] hover:bg-[var(--hub-accent)]/10"
                  title={`Mở giao diện web từ xa: ${project.remoteUrl}`}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Fluent 2 Primary Action Button: TRIGGER DEPLOY */}
            <button
              onClick={() => triggerSync(project.id)}
              disabled={isSyncing}
              className="fluent-btn-primary flex-1 h-8 text-[13px] gap-2 shadow-xs"
              title="Đồng bộ lại source code từ Windows sang môi trường đích và redeploy"
            >
              <Zap className={`h-4 w-4 shrink-0 text-amber-400 fill-amber-400 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span className="font-semibold tracking-wide">{isSyncing ? 'Deploying...' : 'TRIGGER DEPLOY'}</span>
            </button>

            {/* Secondary Tool Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              {isRunning ? (
                <button
                  onClick={() => stopProject(project.id)}
                  className="fluent-icon-btn h-8 w-8 text-hub-muted hover:text-rose-500 hover:bg-rose-500/10"
                  title="Dừng ứng dụng (Stop)"
                >
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => startProject(project.id)}
                  disabled={isBuilding}
                  className="fluent-icon-btn h-8 w-8 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  title="Khởi động ứng dụng (Start)"
                >
                  <Play className="h-4 w-4 fill-current" />
                </button>
              )}

              <button
                onClick={() => restartProject(project.id)}
                className="fluent-icon-btn h-8 w-8 text-hub-muted hover:text-hub-primary"
                title="Khởi động lại (Restart)"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              <button
                onClick={() => setActiveProject(project.id)}
                className={`fluent-icon-btn h-8 w-8 ${
                  isSelected
                    ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] bg-[var(--hub-accent)]/10'
                    : 'text-hub-muted hover:text-hub-primary'
                }`}
                title="Xem Terminal Console"
              >
                <Terminal className="h-4 w-4" />
              </button>

              {/* More Actions ("...") Fluent 2 Dropdown Menu */}
              <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`fluent-icon-btn h-8 w-8 ${
                isMenuOpen
                  ? 'border-[var(--hub-accent)] text-[var(--hub-accent)] bg-[var(--hub-accent)]/10'
                  : 'text-hub-muted hover:text-hub-primary'
              }`}
              title="Công cụ mở rộng & Thao tác khác"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {isMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)} 
                />
                <div className="absolute right-0 bottom-full mb-1.5 z-50 w-56 rounded-lg border border-hub bg-hub-card p-1 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 divide-y divide-hub">
                  {/* Specialized Dev Tools */}
                  <div className="space-y-0.5 pb-1">
                    <button
                      onClick={() => {
                        setActiveResourceInspectorProject(project);
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Activity className="h-3.5 w-3.5 text-sky-500" />
                      <span>Telemetry Giám sát Tài nguyên</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveEnvProject({ id: project.id, name: project.name });
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-emerald-500" />
                      <span>.env & Secrets Studio</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveScriptsProject({ id: project.id, name: project.name });
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Command className="h-3.5 w-3.5 text-amber-500" />
                      <span>NPM Scripts Matrix</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveDbProject({ id: project.id, name: project.name });
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Database className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Database Inspector</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveCleanerProject({ id: project.id, name: project.name });
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <HardDrive className="h-3.5 w-3.5 text-rose-500" />
                      <span>Dọn rác (node_modules)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveDoctorProject({ id: project.id, name: project.name });
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                      <span>Dependency Doctor</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveCopilot({ isOpen: true, projectName: project.name });
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                      <span>✨ AI Terminal Copilot</span>
                    </button>

                    {gitStatuses[project.id]?.isGit && (
                      <button
                        onClick={async () => {
                          setIsMenuOpen(false);
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

                  {/* Editors & System */}
                  <div className="space-y-0.5 py-1">
                    <button
                      onClick={() => {
                        handleOpenVSCode();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Code2 className="h-3.5 w-3.5 text-[var(--hub-accent)]" />
                      <span>Mở trong VS Code</span>
                    </button>

                    <button
                      onClick={() => {
                        handleOpenFolder();
                        setIsMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <Folder className="h-3.5 w-3.5 text-amber-500" />
                      <span>Mở trong Explorer</span>
                    </button>
                  </div>

                  {/* Destructive Action */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
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
      </>
    )}
  </div>
</div>
);
};
