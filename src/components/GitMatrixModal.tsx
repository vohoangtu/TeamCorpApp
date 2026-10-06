import React, { useState, useEffect } from 'react';
import { 
  X, 
  GitBranch, 
  GitPullRequest, 
  RefreshCw, 
  Archive, 
  Check, 
  AlertCircle, 
  ArrowUp, 
  ArrowDown, 
  GitCommit, 
  FolderGit2, 
  Clock, 
  Terminal,
  ExternalLink,
  Layers,
  Sparkles,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { GitMatrixRepo, GitMatrixBatchResult } from '../types';

interface GitMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitMatrixModal: React.FC<GitMatrixModalProps> = ({ isOpen, onClose }) => {
  const { 
    gitMatrix, 
    fetchGitMatrix, 
    batchCheckoutGitMatrix, 
    batchPullGitMatrix, 
    batchStashGitMatrix,
    checkoutGitRepo,
    pullGitRepo,
    stashGitRepo
  } = useAppStore();

  const [targetBranch, setTargetBranch] = useState('main');
  const [createIfMissing, setCreateIfMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [batchResults, setBatchResults] = useState<GitMatrixBatchResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'dirty' | 'diverged'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchGitMatrix();
      setBatchResults(null);
    }
  }, [isOpen, fetchGitMatrix]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  // Filtered repos
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative flex flex-col w-full max-w-6xl h-[90vh] rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden text-hub-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--hub-accent)] text-white shadow-xs">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold tracking-tight">Cross-Repo Git Matrix</h2>
                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 text-[11px] font-semibold">
                  {gitMatrix.filter((r) => r.isGitRepo).length} Repositories
                </span>
              </div>
              <p className="text-[12px] text-hub-muted">
                Giám sát nhánh, file chưa commit, và đồng bộ song song nhiều Git repo trong kiến trúc Microservices
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchGitMatrix()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hub bg-hub-card text-xs font-medium text-hub-secondary hover:text-hub-primary disabled:opacity-50 transition-colors"
              title="Quét lại trạng thái Git tất cả kho lưu trữ"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Quét lại</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Global Batch Controls Bar */}
        <div className="px-5 py-3 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Global Branch Switcher */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold text-hub-muted uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="h-3.5 w-3.5 text-[var(--hub-accent)]" /> Đổi nhánh hàng loạt:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={targetBranch}
                onChange={(e) => setTargetBranch(e.target.value)}
                placeholder="Nhập tên nhánh (vd: main, dev, release/v2)..."
                className="h-8 w-48 sm:w-56 rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary font-mono focus:border-[var(--hub-accent)] focus:outline-none"
              />
              <label className="flex items-center gap-1 text-[11px] text-hub-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createIfMissing}
                  onChange={(e) => setCreateIfMissing(e.target.checked)}
                  className="rounded border-hub text-[var(--hub-accent)] focus:ring-0"
                />
                <span>Tạo nếu chưa có</span>
              </label>
              <button
                onClick={handleBatchCheckout}
                disabled={loading || !targetBranch.trim()}
                className="flex items-center gap-1.5 px-3 h-8 rounded bg-[var(--hub-accent)] hover:opacity-90 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
              >
                <GitBranch className="h-3.5 w-3.5" />
                <span>Chuyển tất cả repo</span>
              </button>
            </div>
          </div>

          {/* Batch Quick Operations */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchPull}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 h-8 rounded border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              title="Thực hiện git pull song song trên mọi repo"
            >
              <GitPullRequest className="h-3.5 w-3.5" />
              <span>Pull tất cả ({gitMatrix.length})</span>
            </button>

            <button
              onClick={handleBatchStash}
              disabled={loading || dirtyCount === 0}
              className="flex items-center gap-1.5 px-3 h-8 rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              title="Lưu tạm tất cả file đang sửa đổi (git stash) trước khi đổi nhánh"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Stash tất cả ({dirtyCount} repo đang sửa)</span>
            </button>
          </div>
        </div>

        {/* Batch Feedback Banner */}
        {batchResults && (
          <div className="px-5 py-2.5 border-b border-hub bg-black/[0.04] dark:bg-white/[0.05] flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in duration-100">
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
                    title={r.message}
                  >
                    {r.success ? <Check className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                    <span>{r.projectName}: {r.message}</span>
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setBatchResults(null)}
              className="text-hub-muted hover:text-hub-primary"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* View Filter Tabs & Summary stats */}
        <div className="px-5 py-2 border-b border-hub bg-hub-sidebar/40 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                  : 'text-hub-muted hover:text-hub-primary'
              }`}
            >
              Tất cả ({gitMatrix.length})
            </button>
            <button
              onClick={() => setActiveTab('dirty')}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1 ${
                activeTab === 'dirty'
                  ? 'bg-hub-card text-amber-500 font-semibold shadow-2xs'
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
                  ? 'bg-hub-card text-blue-500 font-semibold shadow-2xs'
                  : 'text-hub-muted hover:text-hub-primary'
              }`}
            >
              <span>Lệch Upstream (Ahead/Behind)</span>
              {divergedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-500 font-bold text-[10px]">
                  {divergedCount}
                </span>
              )}
            </button>
          </div>

          <span className="text-[11px] text-hub-muted font-mono">
            {filteredRepos.length} repo hiển thị
          </span>
        </div>

        {/* Git Matrix Table Body */}
        <div className="flex-1 overflow-y-auto p-5 select-text">
          <div className="rounded-lg border border-hub overflow-hidden bg-hub-card">
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
                        {/* Repository Info */}
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

                              {/* Local branches switcher */}
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

                        {/* Upstream Status (Ahead / Behind) */}
                        <td className="py-3 px-4">
                          {!repo.isGitRepo ? (
                            <span className="text-hub-muted">—</span>
                          ) : hasDivergence ? (
                            <div className="flex items-center gap-1.5">
                              {repo.aheadCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30" title="Chưa push lên upstream">
                                  <ArrowUp className="h-3 w-3" />
                                  <span>{repo.aheadCount} ahead</span>
                                </span>
                              )}
                              {repo.behindCount > 0 && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30" title="Cần pull cập nhật">
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

                        {/* Single Repo Actions */}
                        <td className="py-3 px-4 text-right">
                          {repo.isGitRepo ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => pullGitRepo(repo.projectId)}
                                className="px-2 py-1 rounded border border-hub bg-hub-sidebar hover:border-emerald-500/40 hover:text-emerald-500 text-[11px] font-semibold transition-colors"
                                title="Git pull cập nhật riêng repo này"
                              >
                                Pull
                              </button>
                              <button
                                onClick={() => stashGitRepo(repo.projectId)}
                                disabled={!isDirty}
                                className="px-2 py-1 rounded border border-hub bg-hub-sidebar hover:border-amber-500/40 hover:text-amber-500 text-[11px] font-semibold transition-colors disabled:opacity-40"
                                title="Stash lưu tạm file đang sửa"
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-hub bg-hub-sidebar/80 text-[12px] text-hub-muted shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Bảo toàn dữ liệu: Các lệnh đổi nhánh đều kiểm tra trạng thái an toàn
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded border border-hub bg-hub-card text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-hub-primary"
          >
            Đóng (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
