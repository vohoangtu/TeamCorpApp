import React, { useState, useEffect } from 'react';
import { Play, Terminal, X, RefreshCw, CheckCircle2, AlertCircle, Sparkles, Command } from 'lucide-react';
import type { PackageScript } from '../types';
import { sendFluentToast } from '../utils/notifications';

interface ScriptRunnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string;
}

export const ScriptRunnerDrawer: React.FC<ScriptRunnerDrawerProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [scripts, setScripts] = useState<PackageScript[]>([]);
  const [packageManager, setPackageManager] = useState('npm');
  const [loading, setLoading] = useState(false);
  const [runningScript, setRunningScript] = useState<string | null>(null);
  const [outputLogs, setOutputLogs] = useState<string>('');

  const fetchScripts = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/scripts`);
      if (res.ok) {
        const data = await res.json();
        setScripts(data.scripts || []);
        if (data.packageManager) setPackageManager(data.packageManager);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchScripts();
      setOutputLogs('');
    }
  }, [isOpen, projectId]);

  const handleRunScript = async (scriptName: string) => {
    if (!projectId) return;
    setRunningScript(scriptName);
    setOutputLogs(`$ ${packageManager} run ${scriptName}\nĐang thực thi lệnh...\n`);

    try {
      const res = await fetch(`/api/projects/${projectId}/scripts?run=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptName, packageManager }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setOutputLogs((prev) => `${prev}\n✅ [Hoàn tất]: Script "${scriptName}" đã chạy thành công (Exit Code 0).\n`);
        sendFluentToast(`Script "${scriptName}" hoàn tất`, `Lệnh đã thực thi thành công.`, 'success');
      } else {
        setOutputLogs((prev) => `${prev}\n❌ [Lỗi]: Script "${scriptName}" thất bại (Exit Code ${data.exitCode || 1}).\n`);
        sendFluentToast(`Script "${scriptName}" thất bại`, `Vui lòng kiểm tra console output.`, 'error');
      }
    } catch (e: any) {
      setOutputLogs((prev) => `${prev}\n❌ [Lỗi kết nối]: ${e.message}\n`);
    } finally {
      setRunningScript(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400">
              <Command className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                NPM Script Runner Matrix
              </h3>
              <p className="text-[12px] text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Quản lý & chạy script từ package.json
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
          {loading ? (
            <div className="py-12 text-center text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
              Đang phân tích file package.json...
            </div>
          ) : scripts.length === 0 ? (
            <div className="rounded-md border border-dashed border-hub p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-hub-muted mb-2 opacity-60" />
              <p className="text-xs font-semibold text-hub-primary">Không tìm thấy script nào trong package.json</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Scripts Grid Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {scripts.map((script) => {
                  const isRunning = runningScript === script.name;
                  const categoryBadge = {
                    dev: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    build: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    test: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
                    lint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                    other: 'bg-black/[0.04] dark:bg-white/[0.06] text-hub-muted border-transparent',
                  }[script.category];

                  return (
                    <div
                      key={script.name}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02] hover:border-hub-accent transition-all"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-hub-primary truncate">
                            {script.name}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${categoryBadge}`}>
                            {script.category}
                          </span>
                        </div>
                        <span className="block text-[11px] font-mono text-hub-muted truncate mt-0.5" title={script.command}>
                          $ {script.command}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRunScript(script.name)}
                        disabled={runningScript !== null}
                        className="fluent-btn-standard h-7 px-2.5 text-xs flex items-center gap-1 shrink-0 whitespace-nowrap"
                        title={`Chạy ${packageManager} run ${script.name}`}
                      >
                        <Play className={`h-3 w-3 ${isRunning ? 'animate-spin text-hub-accent' : 'fill-current text-emerald-500'}`} />
                        <span>{isRunning ? 'Running...' : 'Run'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Terminal Output Viewer */}
              {outputLogs && (
                <div className="mt-4 rounded-lg border border-hub bg-[#1E1E1E] text-neutral-200 overflow-hidden font-mono text-xs">
                  <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-black/20 text-neutral-400 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>Script Console Output</span>
                    </div>
                    <button
                      onClick={() => setOutputLogs('')}
                      className="text-neutral-400 hover:text-white"
                    >
                      Xóa
                    </button>
                  </div>
                  <pre className="p-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text">
                    {outputLogs}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2 text-xs text-hub-muted">
            <span>Package Manager:</span>
            <select
              value={packageManager}
              onChange={(e) => setPackageManager(e.target.value)}
              className="h-6 rounded border border-hub bg-hub-card px-2 text-xs font-mono text-hub-primary"
            >
              <option value="npm">npm</option>
              <option value="pnpm">pnpm</option>
              <option value="yarn">yarn</option>
              <option value="bun">bun</option>
            </select>
          </div>

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
