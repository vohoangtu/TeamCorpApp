import React from 'react';
import { GitBranch, FolderGit2, Plus, ExternalLink, RefreshCw, Folder } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const GitWorkspacesView: React.FC = () => {
  const { projects, setIsAddModalOpen } = useAppStore();

  const gitProjects = projects.filter((p) => p.sourceType === 'git' || p.gitUrl);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#202020] p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                Git Repositories Workspace (GitHub & GitLab)
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Các dự án được clone và liên kết trực tiếp từ kho lưu trữ Git từ xa về máy Windows 11
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#0F6CBD] hover:bg-[#115EA3] px-3.5 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Clone Repository Mới</span>
          </button>
        </div>
      </div>

      {gitProjects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/[0.1] dark:border-white/[0.1] p-12 text-center">
          <FolderGit2 className="h-10 w-10 text-neutral-400 mx-auto mb-3" />
          <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Chưa liên kết Git Repo nào</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            Nhập URL GitHub hoặc GitLab để app tự động clone vào workspace và thiết lập môi trường chạy local.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-md bg-[#0F6CBD] hover:bg-[#115EA3] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Nhập link GitHub / GitLab
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {gitProjects.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#202020] p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <GitBranch className="h-3 w-3" />
                  {p.gitBranch || 'main'}
                </span>
                {p.gitUrl && (
                  <a
                    href={p.gitUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-neutral-400 hover:text-[#0F6CBD] transition-colors"
                    title="Mở repository từ xa"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                {p.name}
              </h4>
              <p className="text-[11px] font-mono text-neutral-400 truncate mt-1">
                {p.sourcePath}
              </p>
              <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs text-neutral-500">
                <span>Syncs: {p.syncCount || 0}</span>
                <button
                  onClick={() => fetch(`/api/projects/${p.id}/open-folder`, { method: 'POST' })}
                  className="flex items-center gap-1 hover:text-[#0F6CBD] text-neutral-600 dark:text-neutral-300 transition-colors"
                >
                  <Folder className="h-3.5 w-3.5" />
                  <span>Explorer</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
