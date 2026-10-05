import React from 'react';
import { Box, Play, Square, RotateCw, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink, Boxes, Server, Zap } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DockerView: React.FC = () => {
  const { 
    projects, 
    systemStats, 
    startProject, 
    stopProject, 
    restartProject, 
    triggerSync, 
    setIsAddModalOpen,
    setIsDockerFleetOpen 
  } = useAppStore();

  const fleetProjects = projects.filter((p) => p.runtimeType === 'docker' || p.runtimeType === 'wsl2');

  return (
    <div className="space-y-6">
      {/* Target Fleets Overview Card */}
      <div className="rounded-xl border border-hub bg-hub-card p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-hub-primary flex items-center gap-2">
                Hạ Tầng Target Fleets (Docker & WSL2 Sandbox)
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  systemStats?.dockerAvailable 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 text-amber-600'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${systemStats?.dockerAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {systemStats?.dockerAvailable ? 'Docker Daemon Ready' : 'WSL2 Native Active'}
                </span>
              </h3>
              <p className="text-xs text-hub-muted mt-0.5">
                Môi trường thực thi độc lập (ext4 Linux sandbox hoặc isolated containers) không ảnh hưởng tới Windows
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDockerFleetOpen(true)}
              className="fluent-btn-standard h-8 px-3 text-xs gap-1.5 font-medium"
            >
              <Server className="h-3.5 w-3.5" />
              <span>Fleet Commander GUI</span>
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="fluent-btn-primary h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Boxes className="h-3.5 w-3.5" />
              <span>Đăng Ký Target App</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Fleet Projects */}
      {fleetProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-hub p-12 text-center">
          <Boxes className="h-10 w-10 text-hub-muted mx-auto mb-3" />
          <h4 className="text-xs font-bold text-hub-primary">Chưa có ứng dụng nào gán vào Docker hoặc WSL2</h4>
          <p className="text-xs text-hub-muted max-w-sm mx-auto mt-1 mb-4">
            Bạn có thể đăng ký dự án mới hoặc nhấp vào badge Target trên Dashboard để chuyển đổi ứng dụng sang môi trường WSL2 hoặc Docker.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="fluent-btn-primary px-3 py-1.5 text-xs font-semibold"
          >
            Đăng ký Target Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleetProjects.map((project) => (
            <div
              key={project.id}
              className="rounded-lg border border-hub bg-hub-card p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {project.runtimeType === 'docker' ? '🐳 Docker Container' : '🐧 WSL2 Linux Sandbox'}
                  </span>
                  {project.port && (
                    <a
                      href={`http://localhost:${project.port}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#0F6CBD] flex items-center gap-1"
                    >
                      :{project.port}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                  {project.name}
                </h4>
                <p className="text-[11px] font-mono text-neutral-400 truncate mt-0.5">
                  {project.sourcePath}
                </p>
                <div className="mt-3 rounded bg-black/[0.03] dark:bg-white/[0.04] p-2 text-[10px] font-mono text-neutral-600 dark:text-neutral-400">
                  $ {project.runCommand}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between gap-2">
                <button
                  onClick={() => triggerSync(project.id)}
                  disabled={project.status === 'syncing'}
                  className="flex-1 rounded-md bg-[#0F6CBD] hover:bg-[#115EA3] py-1.5 text-xs font-semibold text-white shadow-sm"
                >
                  Hot-Build & Sync
                </button>
                {project.status === 'running' ? (
                  <button
                    onClick={() => stopProject(project.id)}
                    className="p-1.5 rounded-md border text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    title="Stop Compose"
                  >
                    <Square className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => startProject(project.id)}
                    className="p-1.5 rounded-md border text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    title="Up Compose"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </button>
                )}
                <button
                  onClick={() => restartProject(project.id)}
                  className="p-1.5 rounded-md border hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                  title="Restart Containers"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
