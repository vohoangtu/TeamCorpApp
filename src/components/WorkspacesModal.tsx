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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-3xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5]">
              <Layers className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Dev Workspaces (Khởi Động Theo Nhóm Dự Án)
              </h3>
              <p className="text-[12px] text-hub-muted">
                Bấm 1 click để khởi động đồng loạt cả cụm Frontend, Backend API và Docker.
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
          {statusMessage && (
            <div className="rounded-md border border-hub-subtle bg-black/[0.03] dark:bg-white/[0.04] p-3 text-xs font-semibold text-hub-primary">
              {statusMessage}
            </div>
          )}

          {/* Workspace Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-hub pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspaceId(ws.id);
                    setIsCreating(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeWorkspaceId === ws.id && !isCreating
                      ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                      : 'text-hub-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{ws.icon || '📁'}</span>
                  <span>{ws.name}</span>
                  <span className="text-[10px] opacity-75 font-mono">({ws.projectIds.length})</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsCreating(true)}
              className="fluent-btn-standard h-7 px-2.5 text-xs flex items-center gap-1 shrink-0"
              title="Tạo nhóm workspace mới"
            >
              <Plus className="h-3 w-3" />
              <span>Tạo Nhóm Mới</span>
            </button>
          </div>

          {/* Active Workspace View or Create Form */}
          {isCreating ? (
            <div className="rounded-md border border-hub p-4 space-y-3 bg-black/[0.01] dark:bg-white/[0.02]">
              <h4 className="text-xs font-bold text-hub-primary uppercase tracking-wider">
                Thiết lập nhóm Workspace mới
              </h4>
              <div>
                <label className="block text-xs font-semibold text-hub-secondary mb-1">
                  Tên nhóm Workspace
                </label>
                <input
                  type="text"
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="VD: Fullstack E-Commerce Stack"
                  className="h-8 w-full rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-hub-secondary mb-1">
                  Mô tả ngắn
                </label>
                <input
                  type="text"
                  value={newWsDesc}
                  onChange={(e) => setNewWsDesc(e.target.value)}
                  placeholder="VD: Gồm Next.js Frontend + NestJS API + Postgres Docker"
                  className="h-8 w-full rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-hub-secondary mb-1">
                  Chọn các dự án thuộc nhóm này:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto border border-hub rounded p-2">
                  {projects.map((p) => {
                    const isChecked = selectedProjectIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 text-xs text-hub-primary cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] p-1 rounded"
                      >
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
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-hub-muted font-mono text-[11px]">(Port :{p.port || 'Auto'})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="fluent-btn-standard h-7 px-3 text-xs"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateWorkspace}
                  disabled={!newWsName.trim()}
                  className="fluent-btn-primary h-7 px-3 text-xs font-semibold"
                >
                  Lưu Nhóm Mới
                </button>
              </div>
            </div>
          ) : activeWs ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="text-sm font-bold text-hub-primary truncate">{activeWs.name}</h4>
                  <p className="text-xs text-hub-muted mt-0.5 line-clamp-1">{activeWs.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleLaunchWorkspace(activeWs)}
                    className="fluent-btn-primary flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold shadow-xs shrink-0 whitespace-nowrap"
                    title="Khởi động tất cả ứng dụng trong nhóm này"
                  >
                    <Play className="h-3.5 w-3.5 fill-current shrink-0" />
                    <span>Chạy Nhóm ({activeWs.projectIds.length})</span>
                  </button>

                  <button
                    onClick={() => handleStopWorkspace(activeWs)}
                    className="fluent-btn-standard flex items-center gap-1.5 h-8 px-3 text-xs shrink-0 whitespace-nowrap"
                    title="Dừng tất cả ứng dụng trong nhóm này"
                  >
                    <Square className="h-3.5 w-3.5 shrink-0" />
                    <span>Dừng Nhóm</span>
                  </button>

                  {activeWs.id !== 'ws-all' && (
                    <button
                      onClick={() => handleDeleteWorkspace(activeWs.id)}
                      className="flex h-8 w-8 items-center justify-center rounded text-hub-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="Xóa nhóm này"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* Projects in this workspace */}
              <div className="rounded-md border border-hub overflow-hidden">
                <div className="px-3 py-2 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold text-hub-muted uppercase">
                  Danh sách ứng dụng thuộc nhóm ({activeWs.projectIds.length})
                </div>
                <div className="divide-y divide-hub">
                  {projects
                    .filter((p) => activeWs.projectIds.includes(p.id))
                    .map((p) => {
                      const isRunning = p.status === 'running';
                      return (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'
                              }`}
                            />
                            <div>
                              <div className="text-xs font-bold text-hub-primary">{p.name}</div>
                              <div className="text-[11px] text-hub-muted font-mono">{p.sourcePath}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-mono font-semibold text-hub-secondary">
                              :{p.port}
                            </span>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
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

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Phím tắt mở nhanh: <strong className="text-hub-primary font-mono">Ctrl + Shift + W</strong>
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
