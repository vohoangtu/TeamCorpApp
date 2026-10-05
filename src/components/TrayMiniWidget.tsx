import React, { useState } from 'react';
import { Layers, Play, Square, Zap, Maximize2, Minimize2, Cpu, HardDrive, Shield } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const TrayMiniWidget: React.FC = () => {
  const {
    isMiniMode,
    setIsMiniMode,
    projects,
    systemStats,
    startProject,
    stopProject,
    triggerSync,
    setIsPortRadarOpen,
  } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(true);

  if (!isMiniMode) return null;

  const runningProjects = projects.filter((p) => p.status === 'running');

  return (
    <div className="fixed bottom-4 right-4 z-50 select-none animate-in slide-in-from-bottom duration-200">
      <div className="w-80 rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Widget Top Titlebar (Windows 11 style) */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-hub-sidebar border-b border-hub">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-hub-primary">WinDev Mini Hub</span>
            <span className="text-[10px] font-mono bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.2 rounded text-hub-muted">
              {runningProjects.length}/{projects.length} Online
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 flex items-center justify-center rounded text-hub-muted hover:text-hub-primary"
              title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </button>
            <button
              onClick={() => setIsMiniMode(false)}
              className="h-6 w-6 flex items-center justify-center rounded text-hub-muted hover:text-hub-primary"
              title="Quay về giao diện Dashboard đầy đủ"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="p-3 space-y-2.5">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 gap-2 text-[11px] p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-hub">
              <div className="flex items-center gap-1.5 text-hub-secondary">
                <Cpu className="h-3.5 w-3.5 text-blue-500" />
                <span>CPU: <strong>{systemStats?.cpuUsage ?? 0}%</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-hub-secondary">
                <HardDrive className="h-3.5 w-3.5 text-purple-500" />
                <span>RAM: <strong>{systemStats?.totalMemoryMb ? Math.round(((systemStats.totalMemoryMb - (systemStats.freeMemoryMb || 0)) / systemStats.totalMemoryMb) * 100) : 0}%</strong></span>
              </div>
            </div>

            {/* Quick Projects List */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {projects.map((project) => {
                const isRunning = project.status === 'running';
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded-md border border-hub bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isRunning ? 'bg-emerald-500' : 'bg-neutral-400'
                          }`}
                        />
                        <span className="text-xs font-bold text-hub-primary truncate">
                          {project.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-hub-muted">
                        Port :{project.port || 'Auto'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isRunning ? (
                        <>
                          <button
                            onClick={() => triggerSync(project.id)}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-amber-500/10 text-amber-500"
                            title="Hot-Sync app"
                          >
                            <Zap className="h-3 w-3 fill-current" />
                          </button>
                          <button
                            onClick={() => stopProject(project.id)}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-rose-500/10 text-rose-500"
                            title="Dừng app"
                          >
                            <Square className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startProject(project.id)}
                          className="h-6 w-6 flex items-center justify-center rounded hover:bg-emerald-500/10 text-emerald-500"
                          title="Khởi động app"
                        >
                          <Play className="h-3 w-3 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-hub">
              <button
                onClick={() => setIsPortRadarOpen(true)}
                className="fluent-btn-standard h-6 px-2 text-[11px] flex-1 flex items-center justify-center gap-1"
              >
                <Shield className="h-3 w-3 text-amber-500" />
                <span>Port Radar</span>
              </button>

              <button
                onClick={() => {
                  for (const p of runningProjects) triggerSync(p.id);
                }}
                disabled={runningProjects.length === 0}
                className="fluent-btn-primary h-6 px-2 text-[11px] flex-1 flex items-center justify-center gap-1 font-semibold"
              >
                <Zap className="h-3 w-3 fill-current" />
                <span>Sync All</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
