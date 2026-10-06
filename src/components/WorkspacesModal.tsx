import React, { useState, useEffect } from 'react';
import { Layers, Play, Square, Plus, Trash2, X, Check, FolderGit2 } from 'lucide-react';
import type { Workspace, Project } from '../types';
import { useAppStore } from '../store/useAppStore';

interface WorkspacesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  {
    id: 'ws-all',
    name: 'Toàn Bộ Hệ Sinh Thái',
    description: 'Khởi động và trigger sync toàn bộ các ứng dụng local cùng lúc.',
    icon: '🚀',
    projectIds: [],
  },
];

export const WorkspacesModal: React.FC<WorkspacesModalProps> = ({ isOpen, onClose }) => {
  const { projects, startProject, stopProject, triggerSync } = useAppStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('windev-workspaces');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return DEFAULT_WORKSPACES;
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(workspaces[0]?.id || 'ws-all');
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync projects to ws-all
  useEffect(() => {
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === 'ws-all' ? { ...w, projectIds: projects.map((p) => p.id) } : w
      )
    );
  }, [projects]);

  const saveWorkspaces = (newWs: Workspace[]) => {
    setWorkspaces(newWs);
    localStorage.setItem('windev-workspaces', JSON.stringify(newWs));
  };

  const activeWs = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  const handleLaunchWorkspace = async (ws: Workspace) => {
    const targetProjects = projects.filter((p) => ws.projectIds.includes(p.id));
    setStatusMessage(`🚀 Đang khởi động ${targetProjects.length} ứng dụng trong nhóm "${ws.name}"...`);

    for (const p of targetProjects) {
      if (p.status !== 'running') {
        await startProject(p.id);
      }
      triggerSync(p.id);
    }

    setTimeout(() => {
      setStatusMessage(`✅ Toàn bộ ứng dụng trong nhóm "${ws.name}" đã khởi chạy thành công!`);
    }, 1500);
  };

  const handleStopWorkspace = async (ws: Workspace) => {
    const targetProjects = projects.filter((p) => ws.projectIds.includes(p.id));
    setStatusMessage(`⏹ Đang dừng ${targetProjects.length} ứng dụng...`);

    for (const p of targetProjects) {
      if (p.status === 'running') {
        await stopProject(p.id);
      }
    }

    setTimeout(() => {
      setStatusMessage(`⏹ Đã dừng toàn bộ ứng dụng trong nhóm "${ws.name}".`);
    }, 1000);
  };

  const handleCreateWorkspace = () => {
    if (!newWsName.trim()) return;

    const newWs: Workspace = {
      id: `ws-${Date.now()}`,
      name: newWsName.trim(),
      description: newWsDesc.trim() || 'Nhóm ứng dụng tùy chỉnh',
      icon: '📦',
      projectIds: selectedProjectIds,
    };

    const updated = [...workspaces, newWs];
    saveWorkspaces(updated);
    setActiveWorkspaceId(newWs.id);
    setIsCreating(false);
    setNewWsName('');
    setNewWsDesc('');
    setSelectedProjectIds([]);
  };

  const handleDeleteWorkspace = (id: string) => {
    if (id === 'ws-all') return;
    const updated = workspaces.filter((w) => w.id !== id);
    saveWorkspaces(updated);
    setActiveWorkspaceId(updated[0]?.id || 'ws-all');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-6xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5] ring-1 ring-[#0F6CBD]/20">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Dev Workspaces & Multi-Project Stacks
                </h3>
                <span className="rounded-full bg-[#0F6CBD]/10 text-[#0F6CBD] dark:text-[#479EF5] px-2 py-0.5 text-[11px] font-semibold">
                  Stack Orchestrator
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Khởi động đồng loạt cả cụm Frontend, Backend APIs và Docker services chỉ với 1 click duy nhất
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

        {/* Status Message Banner if present */}
        {statusMessage && (
          <div className="px-6 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            {statusMessage}
          </div>
        )}

        {/* Content Body: 2 Columns */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Master Sidebar: Workspaces list (w-80) */}
          <div className="w-80 border-r border-hub bg-black/[0.01] dark:bg-white/[0.01] flex flex-col shrink-0">
            <div className="p-3.5 border-b border-hub flex items-center justify-between">
              <span className="text-xs font-bold text-hub-secondary uppercase tracking-wider">
                Nhóm Workspaces ({workspaces.length})
              </span>
              <button
                onClick={() => setIsCreating(true)}
                className="fluent-btn-standard h-7 px-2.5 text-xs flex items-center gap-1 font-semibold"
                title="Tạo nhóm workspace mới"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tạo Mới</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {workspaces.map((ws) => {
                const isActive = activeWorkspaceId === ws.id && !isCreating;
                return (
                  <button
                    key={ws.id}
                    onClick={() => {
                      setActiveWorkspaceId(ws.id);
                      setIsCreating(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 ${
                      isActive
                        ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/[0.08] shadow-2xs ring-1 ring-[var(--hub-accent)]/20'
                        : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{ws.icon || '📦'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-hub-primary truncate flex items-center justify-between">
                        <span>{ws.name}</span>
                        <span className="text-[11px] font-mono text-hub-muted font-normal">
                          {ws.projectIds.length} apps
                        </span>
                      </div>
                      <p className="text-[11px] text-hub-muted truncate mt-0.5">
                        {ws.description || 'Không có mô tả'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Detail Pane */}
          <div className="flex-1 overflow-y-auto p-6">
            {isCreating ? (
              <div className="max-w-xl mx-auto space-y-4">
                <div className="border-b border-hub pb-3">
                  <h4 className="text-sm font-bold text-hub-primary">
                    Thiết Lập Nhóm Workspace Mới
                  </h4>
                  <p className="text-xs text-hub-muted mt-0.5">
                    Gộp các ứng dụng liên kết với nhau để khởi động cùng lúc
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-hub-secondary mb-1">
                      Tên Nhóm Workspace <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newWsName}
                      onChange={(e) => setNewWsName(e.target.value)}
                      placeholder="VD: Fullstack E-Commerce Stack"
                      className="h-9 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-hub-secondary mb-1">
                      Mô Tả Ngắn
                    </label>
                    <input
                      type="text"
                      value={newWsDesc}
                      onChange={(e) => setNewWsDesc(e.target.value)}
                      placeholder="VD: Gồm Next.js Frontend + NestJS API + Postgres Docker"
                      className="h-9 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-hub-secondary mb-1.5">
                      Chọn các dự án thuộc nhóm ({selectedProjectIds.length}/{projects.length}):
                    </label>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto border border-hub rounded-lg p-2.5 bg-black/[0.01] dark:bg-white/[0.02]">
                      {projects.map((p) => {
                        const isChecked = selectedProjectIds.includes(p.id);
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center justify-between text-xs p-2 rounded-md cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-[var(--hub-accent)]/[0.06] text-hub-primary font-semibold'
                                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03] text-hub-secondary'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedProjectIds([...selectedProjectIds, p.id]);
                                  } else {
                                    setSelectedProjectIds(selectedProjectIds.filter((id) => id !== p.id));
                                  }
                                }}
                                className="rounded text-[var(--hub-accent)]"
                              />
                              <span>{p.name}</span>
                            </div>
                            <span className="text-hub-muted font-mono text-[11px] font-normal">
                              Port :{p.port || 'Auto'}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setIsCreating(false)}
                      className="fluent-btn-standard h-8 px-4 text-xs font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleCreateWorkspace}
                      disabled={!newWsName.trim()}
                      className="fluent-btn-primary h-8 px-5 text-xs font-semibold shadow-sm"
                    >
                      Lưu Nhóm Mới
                    </button>
                  </div>
                </div>
              </div>
            ) : activeWs ? (
              <div className="space-y-5">
                {/* Workspace Header & Action Controls */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-hub bg-black/[0.01] dark:bg-white/[0.02]">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{activeWs.icon || '📦'}</span>
                      <h4 className="text-base font-bold text-hub-primary truncate">{activeWs.name}</h4>
                    </div>
                    <p className="text-xs text-hub-muted mt-1 leading-relaxed">{activeWs.description}</p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleLaunchWorkspace(activeWs)}
                      className="fluent-btn-primary flex items-center gap-1.5 h-8 px-4 text-xs font-semibold shadow-sm"
                      title="Khởi động tất cả ứng dụng trong nhóm này"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>Chạy Cụm ({activeWs.projectIds.length})</span>
                    </button>

                    <button
                      onClick={() => handleStopWorkspace(activeWs)}
                      className="fluent-btn-standard flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold"
                      title="Dừng tất cả ứng dụng trong nhóm này"
                    >
                      <Square className="h-3.5 w-3.5" />
                      <span>Dừng Cụm</span>
                    </button>

                    {activeWs.id !== 'ws-all' && (
                      <button
                        onClick={() => handleDeleteWorkspace(activeWs.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Xóa nhóm này"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Projects in this workspace */}
                <div className="rounded-xl border border-hub overflow-hidden shadow-2xs">
                  <div className="px-4 py-3 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between text-[11px] font-bold text-hub-muted uppercase tracking-wider">
                    <span>Ứng Dụng Trong Nhóm ({activeWs.projectIds.length})</span>
                    <span>Cổng & Trạng Thái</span>
                  </div>
                  <div className="divide-y divide-hub">
                    {projects
                      .filter((p) => activeWs.projectIds.includes(p.id))
                      .map((p) => {
                        const isRunning = p.status === 'running';
                        return (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                                  isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                                }`}
                              />
                              <div>
                                <div className="text-xs font-bold text-hub-primary">{p.name}</div>
                                <div className="text-[11px] text-hub-muted font-mono truncate max-w-md mt-0.5">
                                  {p.sourcePath}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3.5">
                              <span className="text-xs font-mono font-bold text-hub-secondary">
                                :{p.port}
                              </span>
                              <span
                                className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                                  isRunning
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-hub-muted'
                                }`}
                              >
                                {isRunning ? 'Running' : 'Stopped'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar shrink-0">
          <span className="text-xs text-hub-muted">
            Phím tắt: <strong className="text-hub-primary font-mono">Ctrl + Shift + W</strong>
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
