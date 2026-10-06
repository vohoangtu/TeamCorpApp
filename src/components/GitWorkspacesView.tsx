import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  FolderGit2, 
  Plus, 
  RefreshCw, 
  GitPullRequest, 
  Archive, 
  Check, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  Maximize2,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { GitMatrixBatchResult } from '../types';

export const GitWorkspacesView: React.FC = () => {
  const { 
    gitMatrix, 
    fetchGitMatrix, 
    batchCheckoutGitMatrix, 
    batchPullGitMatrix, 
    batchStashGitMatrix,
    checkoutGitRepo,
    pullGitRepo,
    stashGitRepo,
    setIsAddModalOpen,
    setIsGitMatrixOpen 
  } = useAppStore();

  const [targetBranch, setTargetBranch] = useState('main');
  const [createIfMissing, setCreateIfMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<GitMatrixBatchResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'dirty' | 'diverged'>('all');

  useEffect(() => {
    fetchGitMatrix();
  }, [fetchGitMatrix]);

  const handleBatchCheckout = async () => {
    if (!targetBranch.trim()) return;
    setLoading(true);
    setBatchResults(null);
    try {
      const results = await batchCheckoutGitMatrix(targetBranch.trim(), createIfMissing);
      setBatchResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPull = async () => {
    setLoading(true);
    setBatchResults(null);
    try {
      const results = await batchPullGitMatrix();
      setBatchResults(results);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchStash = async () => {
    setLoading(true);
    setBatchResults(null);
    try {
      const results = await batchStashGitMatrix();
      setBatchResults(results);
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = gitMatrix.filter((r) => {
    if (activeTab === 'dirty') {
      return r.dirtyFilesCount > 0 || r.untrackedCount > 0;
    }
    if (activeTab === 'diverged') {
      return r.aheadCount > 0 || r.behindCount > 0 || r.hasConflict;
    }
    return true;
  });

  const dirtyCount = gitMatrix.filter((r) => r.dirtyFilesCount > 0 || r.untrackedCount > 0).length;
  const divergedCount = gitMatrix.filter((r) => r.aheadCount > 0 || r.behindCount > 0).length;

  return (
    <div className="space-y-5 w-full pb-12">
      {/* Overview & Quick Hero Card */}
      <div className="rounded-xl border border-hub bg-hub-card p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <FolderGit2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-hub-primary">
                  Cross-Repo Git Matrix & Workspaces Hub
                </h3>
                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[11px] font-semibold">
                  {gitMatrix.filter((r) => r.isGitRepo).length} Repositories
                </span>
              </div>
              <p className="text-xs text-hub-muted mt-0.5">
                Đồng bộ trạng thái Git, chi nhánh microservices và điều phối tệp sửa đổi trên toàn bộ máy Windows 11
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => fetchGitMatrix()}
              disabled={loading}
              className="fluent-btn-standard h-8 px-3 text-xs gap-1.5 font-medium"
              title="Quét lại trạng thái Git"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Quét lại</span>
            </button>

            <button
              onClick={() => setIsGitMatrixOpen(true)}
              className="fluent-btn-standard h-8 px-3 text-xs gap-1.5 font-medium"
              title="Mở dạng cửa sổ Modal nổi"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Cửa sổ nổi</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="fluent-btn-primary h-8 px-3 text-xs font-semibold gap-1.5 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Clone Repo Mới</span>
            </button>
          </div>
        </div>

        {/* Global Batch Controls Bar */}
        <div className="mt-4 pt-4 border-t border-hub flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold text-hub-muted uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5 text-[var(--hub-accent)]" /> Đổi nhánh hàng loạt:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="Nhập tên nhánh (vd: main, dev, feature/auth)..."
                className="h-8 w-48 sm:w-56 rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary font-mono focus:border-[var(--hub-accent)] focus:outline-none"
              />
              <label className="flex items-center gap-1 text-[11px] text-hub-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createIfMissing}
                  onChange={(e) => setCreateIfMissing(e.target.checked)}
                  className="rounded border-hub text-[var(--hub-accent)] focus:ring-0"
                />
                <span>Tạo nếu thiếu</span>
              </label>
              <button
                onClick={handleBatchCheckout}
                disabled={loading || !targetBranch.trim()}
                className="flex items-center gap-1.5 px-3 h-8 rounded bg-[var(--hub-accent)] hover:opacity-90 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Chuyển tất cả</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchPull}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 h-8 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>Pull tất cả ({gitMatrix.length})</span>
            </button>

            <button
              onClick={handleBatchStash}
              disabled={loading || dirtyCount === 0}
              className="flex items-center gap-1.5 px-3 h-8 rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Stash tất cả ({dirtyCount} repo đang sửa)</span>
            </button>
          </div>
        </div>

        {/* Batch Feedback Banner */}
        {batchResults && (
          <div className="mt-3 p-2.5 rounded-lg border border-hub bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="font-semibold text-hub-primary">Kết quả thực hiện hàng loạt:</span>
              <div className="flex items-center gap-1.5">
                {batchResults.map((r, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono ${
                      r.success
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {r.success ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    <span>{r.projectName}: {r.message}</span>
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setBatchResults(null)} className="text-hub-muted hover:text-hub-primary">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 p-0.5 rounded-md border border-hub bg-hub-card shadow-2xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-[var(--hub-accent)] text-white font-semibold shadow-xs'
                : 'text-hub-muted hover:text-hub-primary'
            }`}
          >
            Tất cả ({gitMatrix.length})
          </button>
          <button
            onClick={() => setActiveTab('dirty')}
            className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'dirty'
                ? 'bg-amber-500 text-white font-semibold shadow-xs'
                : 'text-hub-muted hover:text-hub-primary'
            }`}
          >
            <span>Đang sửa đổi (Dirty)</span>
            {dirtyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-500 font-bold text-[10px]">
                {dirtyCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('diverged')}
            className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
              activeTab === 'diverged'
                ? 'bg-blue-500 text-white font-semibold shadow-xs'
                : 'text-hub-muted hover:text-hub-primary'
            }`}
          >
            <span>Lệch Upstream</span>
            {divergedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-500 font-bold text-[10px]">
                {divergedCount}
              </span>
            )}
          </button>
        </div>

        <span className="text-[12px] text-hub-muted font-mono">
          Hiển thị <strong>{filteredRepos.length}</strong> kho lưu trữ Git
        </span>
      </div>

      {/* Git Matrix Table */}
      <div className="rounded-xl border border-hub overflow-hidden bg-hub-card shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-hub bg-black/[0.03] dark:bg-white/[0.04] text-hub-muted font-medium">
              <th className="py-2.5 px-4 font-semibold">Repository</th>
              <th className="py-2.5 px-4 font-semibold">Nhánh hiện tại (Branch)</th>
              <th className="py-2.5 px-4 font-semibold">Trạng thái tệp (Working Tree)</th>
              <th className="py-2.5 px-4 font-semibold">Đồng bộ Upstream</th>
              <th className="py-2.5 px-4 font-semibold">Commit gần nhất</th>
              <th className="py-2.5 px-4 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hub">
            {filteredRepos.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-hub-muted">
                  Không có kho lưu trữ nào phù hợp tiêu chí lọc.
                </td>
              </tr>
            ) : (
              filteredRepos.map((repo) => {
                const isDirty = repo.dirtyFilesCount > 0 || repo.untrackedCount > 0;
                const hasDivergence = repo.aheadCount > 0 || repo.behindCount > 0;

                return (
                  <tr key={repo.projectId} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    {/* Repository */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-hub-primary">{repo.projectName}</div>
                      <div className="text-[11px] text-hub-muted truncate max-w-xs font-mono" title={repo.sourcePath}>
                        {repo.sourcePath}
                      </div>
                    </td>

                    {/* Current Branch & Dropdown */}
                    <td className="py-3 px-4">
                      {!repo.isGitRepo ? (
                        <span className="text-hub-muted italic">Không phải Git Repo</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-semibold bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] border border-[var(--hub-accent)]/30">
                            <GitBranch className="h-3 w-3" />
                            {repo.currentBranch}
                          </span>

                          {repo.localBranches.length > 1 && (
                            <select
                              value={repo.currentBranch}
                              onChange={(e) => checkoutGitRepo(repo.projectId, e.target.value)}
                              className="h-6 rounded border border-hub bg-hub-sidebar text-[11px] font-mono text-hub-secondary cursor-pointer focus:outline-none"
                              title="Chuyển sang nhánh local khác"
                            >
                              {repo.localBranches.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Working Tree Dirty Status */}
                    <td className="py-3 px-4">
                      {!repo.isGitRepo ? (
                        <span className="text-hub-muted">—</span>
                      ) : isDirty ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {repo.dirtyFilesCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              <span>{repo.dirtyFilesCount} modified</span>
                            </span>
                          )}
                          {repo.untrackedCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                              <span>+{repo.untrackedCount} untracked</span>
                            </span>
                          )}
                          {repo.hasConflict && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold bg-rose-500 text-white animate-pulse">
                              <span>Conflict!</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5" /> Clean Tree
                        </span>
                      )}
                    </td>

                    {/* Upstream Status */}
                    <td className="py-3 px-4">
                      {!repo.isGitRepo ? (
                        <span className="text-hub-muted">—</span>
                      ) : hasDivergence ? (
                        <div className="flex items-center gap-1.5">
                          {repo.aheadCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <ArrowUp className="h-3 w-3" />
                              <span>{repo.aheadCount} ahead</span>
                            </span>
                          )}
                          {repo.behindCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                              <ArrowDown className="h-3 w-3" />
                              <span>{repo.behindCount} behind</span>
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-hub-muted">
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Up to date</span>
                        </span>
                      )}
                    </td>

                    {/* Last Commit */}
                    <td className="py-3 px-4">
                      {repo.lastCommit ? (
                        <div className="space-y-0.5 max-w-xs">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="font-mono text-[var(--hub-accent)] font-semibold">
                              {repo.lastCommit.hash}
                            </span>
                            <span className="text-hub-muted truncate">• {repo.lastCommit.author}</span>
                          </div>
                          <div className="truncate text-hub-secondary font-medium" title={repo.lastCommit.message}>
                            {repo.lastCommit.message}
                          </div>
                        </div>
                      ) : (
                        <span className="text-hub-muted italic text-[11px]">Chưa có commit</span>
                      )}
                    </td>

                    {/* Single Actions */}
                    <td className="py-3 px-4 text-right">
                      {repo.isGitRepo ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => pullGitRepo(repo.projectId)}
                            className="px-2.5 py-1 rounded border border-hub bg-hub-sidebar hover:border-emerald-500/40 hover:text-emerald-500 text-[11px] font-semibold transition-colors"
                          >
                            Pull
                          </button>
                          <button
                            onClick={() => stashGitRepo(repo.projectId)}
                            disabled={!isDirty}
                            className="px-2.5 py-1 rounded border border-hub bg-hub-sidebar hover:border-amber-500/40 hover:text-amber-500 text-[11px] font-semibold transition-colors disabled:opacity-40"
                          >
                            Stash
                          </button>
                        </div>
                      ) : (
                        <span className="text-hub-muted text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
