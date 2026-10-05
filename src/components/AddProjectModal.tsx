import React, { useState, useEffect } from 'react';
import { 
  X, 
  Folder, 
  GitBranch, 
  Layers, 
  Sparkles, 
  Check, 
  AlertCircle,
  FolderOpen,
  FolderSearch,
  FolderTree,
  RotateCw,
  CheckCircle2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FolderBrowserModal } from './FolderBrowserModal';
import type { RuntimeType, SourceType } from '../types';

export const AddProjectModal: React.FC = () => {
  const { isAddModalOpen, setIsAddModalOpen, createProject } = useAppStore();

  const [sourceType, setSourceType] = useState<SourceType>('local');
  const [name, setName] = useState('');
  const [sourcePath, setSourcePath] = useState('');
  const [gitUrl, setGitUrl] = useState('');
  const [gitBranch, setGitBranch] = useState('main');
  const [gitToken, setGitToken] = useState('');
  const [runtimeType, setRuntimeType] = useState<RuntimeType>('native');
  const [runCommand, setRunCommand] = useState('npm run dev');
  const [buildCommand, setBuildCommand] = useState('');
  const [port, setPort] = useState<number | ''>(3000);
  const [autoSync, setAutoSync] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Folder Chooser state
  const [isBrowserModalOpen, setIsBrowserModalOpen] = useState(false);
  const [isBrowsingNative, setIsBrowsingNative] = useState(false);
  const [bookmarks, setBookmarks] = useState<Array<{ label: string; path: string; icon: string }>>([]);
  const [detectedFramework, setDetectedFramework] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/system/list-directories')
      .then((r) => r.json())
      .then((data) => {
        if (data.bookmarks) setBookmarks(data.bookmarks);
      })
      .catch(() => {});
  }, []);

  // Auto-fill defaults when changing source path
  const handlePathChange = async (path: string) => {
    setSourcePath(path);
    setDetectedFramework(null);
    if (!path) return;

    // Extract folder name as project name
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    const folderName = parts[parts.length - 1];
    if (folderName && !name) {
      setName(folderName);
    }

    // Try detecting project properties from backend
    try {
      const res = await fetch('/api/detect-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });
      if (res.ok) {
        const detected = await res.json();
        if (detected.runtimeType) setRuntimeType(detected.runtimeType);
        if (detected.runCommand) setRunCommand(detected.runCommand);
        if (detected.buildCommand) setBuildCommand(detected.buildCommand);
        if (detected.port) setPort(detected.port);
        if (detected.framework) setDetectedFramework(detected.framework);
      }
    } catch {
      // ignore
    }
  };

  // Launch native Windows Explorer folder picker dialog
  const handleNativeBrowse = async () => {
    setIsBrowsingNative(true);
    try {
      const res = await fetch('/api/system/browse-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialPath: sourcePath }),
      });
      const data = await res.json();
      if (data.success && data.path) {
        handlePathChange(data.path);
      }
    } catch (e) {
      console.error('Failed to open native folder chooser', e);
    } finally {
      setIsBrowsingNative(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a project name');
      return;
    }

    if (sourceType === 'local' && !sourcePath.trim()) {
      setError('Please provide a local folder path on Windows');
      return;
    }

    if (sourceType === 'git' && !gitUrl.trim()) {
      setError('Please provide a GitHub or GitLab repository URL');
      return;
    }

    setLoading(true);
    try {
      await createProject({
        name,
        sourceType,
        sourcePath: sourceType === 'local' ? sourcePath : '',
        gitUrl: sourceType === 'git' ? gitUrl : undefined,
        gitBranch: sourceType === 'git' ? gitBranch : undefined,
        gitToken: sourceType === 'git' && gitToken ? gitToken : undefined,
        runtimeType,
        runCommand,
        buildCommand: buildCommand.trim() || undefined,
        port: port ? Number(port) : undefined,
        autoSync,
      });
      setIsAddModalOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fade-in transition-colors">
      <div className="relative w-full max-w-2xl rounded-xl border border-hub bg-hub-card shadow-2xl p-6 overflow-hidden transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-hub">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-sky-500 dark:text-sky-400" />
              Add Project to WinDev Hub
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Deploy & orchestrate your local apps with instant hot-sync
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Source Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Project Source:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceType('local')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  sourceType === 'local'
                    ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-sm dark:bg-sky-500/10 dark:text-sky-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
                }`}
              >
                <Folder className="h-4 w-4" />
                <span>Local Windows Folder</span>
              </button>

              <button
                type="button"
                onClick={() => setSourceType('git')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  sourceType === 'git'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm dark:bg-indigo-500/10 dark:text-indigo-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-white'
                }`}
              >
                <GitBranch className="h-4 w-4" />
                <span>GitHub / GitLab Repo</span>
              </button>
            </div>
          </div>

          {/* Source inputs */}
          {sourceType === 'local' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-sky-500" />
                  <span>Thư mục Dự án Windows (Folder Path):</span>
                </label>
                {detectedFramework && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold border border-emerald-500/20 animate-in fade-in">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Đã nhận diện: {detectedFramework}</span>
                  </span>
                )}
              </div>

              {/* Path Input + Native Windows Chooser Buttons */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Folder className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="VD: C:\Users\vohoa\Projects\my-app hoặc bấm Duyệt..."
                    value={sourcePath}
                    onChange={(e) => handlePathChange(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-600 transition-all shadow-xs"
                    required
                  />
                </div>

                {/* Primary Native Windows Explorer Chooser Button */}
                <button
                  type="button"
                  onClick={handleNativeBrowse}
                  disabled={isBrowsingNative}
                  className="flex items-center gap-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 px-3.5 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                  title="Mở cửa sổ chọn thư mục chuẩn của Windows Explorer"
                >
                  {isBrowsingNative ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin text-sky-500" />
                      <span>Đang mở...</span>
                    </>
                  ) : (
                    <>
                      <FolderSearch className="h-3.5 w-3.5 text-sky-500" />
                      <span>Duyệt Thư Mục...</span>
                    </>
                  )}
                </button>

                {/* Secondary In-App Explorer Chooser Button */}
                <button
                  type="button"
                  onClick={() => setIsBrowserModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-2xs shrink-0 cursor-pointer"
                  title="Duyệt nhanh cây thư mục máy tính"
                >
                  <FolderTree className="h-3.5 w-3.5 text-slate-500" />
                  <span>Cây thư mục</span>
                </button>
              </div>

              {/* Quick Bookmark Chips */}
              {bookmarks.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-0.5">
                    <Sparkles className="h-3 w-3 text-amber-500" /> Nhanh:
                  </span>
                  {bookmarks.map((bm, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePathChange(bm.path)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 text-[11px] text-slate-600 dark:text-slate-300 hover:border-sky-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors shadow-2xs"
                      title={bm.path}
                    >
                      <span>{bm.icon}</span>
                      <span>{bm.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Nhấp <strong>Duyệt Thư Mục...</strong> để chọn trực tiếp từ Windows Explorer hoặc nhấp các phím tắt nhanh.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Git Repository URL:
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username/repo.git or GitLab URL"
                  value={gitUrl}
                  onChange={(e) => {
                    setGitUrl(e.target.value);
                    const match = e.target.value.match(/\/([^/]+?)(?:\.git)?$/);
                    if (match && match[1] && !name) {
                      setName(match[1]);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder-slate-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Branch:</label>
                  <input
                    type="text"
                    value={gitBranch}
                    onChange={(e) => setGitBranch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Token / PAT (Optional):
                  </label>
                  <input
                    type="password"
                    placeholder="For private repos"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name:</label>
            <input
              type="text"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              required
            />
          </div>

          {/* Runtime Type & Commands */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Deployment Target (Mục Tiêu Triển Khai):
              </label>
              <select
                value={runtimeType}
                onChange={(e) => {
                  const val = e.target.value as RuntimeType;
                  setRuntimeType(val);
                  if (val === 'docker') {
                    setRunCommand('docker compose up');
                  } else {
                    setRunCommand('npm run dev');
                  }
                }}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white font-medium"
              >
                <option value="native">🪟 Windows Native (Khởi động tức thì, tối ưu RAM)</option>
                <option value="wsl2">🐧 WSL2 Linux Sandbox (Nhân Linux chuẩn, ext4 siêu tốc)</option>
                <option value="docker">🐳 Docker Container (Môi trường đóng gói)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Port (Local):</label>
              <input
                type="number"
                placeholder="3000"
                value={port}
                onChange={(e) => setPort(e.target.value ? Number(e.target.value) : '')}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Run Command:
              </label>
              <input
                type="text"
                placeholder="npm run dev or python app.py"
                value={runCommand}
                onChange={(e) => setRunCommand(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Sync / Build Command (Optional):
              </label>
              <input
                type="text"
                placeholder="npm run build or pip install -r requirements.txt"
                value={buildCommand}
                onChange={(e) => setBuildCommand(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Auto-sync Option */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 flex items-center justify-between dark:border-slate-800 dark:bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-500 dark:text-sky-400" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-white">Auto-sync on File Save</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tự động phát hiện thay đổi trong folder để trigger sync mà không cần bấm nút thủ công
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white text-sky-500 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 active:scale-95 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 stroke-[3]" />
                  <span>Register & Deploy App</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* In-App Directory Explorer Modal */}
      <FolderBrowserModal
        isOpen={isBrowserModalOpen}
        initialPath={sourcePath}
        onSelect={(selectedPath) => handlePathChange(selectedPath)}
        onClose={() => setIsBrowserModalOpen(false)}
      />
    </div>
  );
};
