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

  const [searchScript, setSearchScript] = useState('');

  if (!isOpen) return null;

  const filteredScripts = scripts.filter((s) => {
    if (!searchScript.trim()) return true;
    const q = searchScript.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.command.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-400 ring-1 ring-amber-500/20">
              <Command className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  NPM Script Runner Matrix & Terminal Stream
                </h3>
                <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[11px] font-semibold">
                  Task Execution
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Quản lý và thực thi tất cả script từ package.json với output trực tiếp
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

        {/* Content Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 text-center text-hub-muted">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-hub-accent" />
              <p className="text-sm font-semibold text-hub-primary">Đang phân tích file package.json...</p>
            </div>
          ) : scripts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hub p-12 text-center bg-black/[0.01] dark:bg-white/[0.01]">
              <AlertCircle className="h-10 w-10 mx-auto text-hub-muted mb-3 opacity-60" />
              <p className="text-sm font-bold text-hub-primary">Không tìm thấy script nào trong package.json</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Script Directory (6 cols) */}
              <div className="lg:col-span-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="relative flex-1 mr-3">
                    <input
                      type="text"
                      placeholder="Tìm script (dev, build, test, lint)..."
                      value={searchScript}
                      onChange={(e) => setSearchScript(e.target.value)}
                      className="h-8 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-hub-muted font-mono shrink-0">
                    {filteredScripts.length} / {scripts.length} scripts
                  </span>
                </div>

                <div className="space-y-2 max-h-[56vh] overflow-y-auto pr-1">
                  {filteredScripts.map((script) => {
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
                        className="flex items-center justify-between p-3 rounded-lg border border-hub bg-black/[0.01] dark:bg-white/[0.02] hover:border-hub-accent hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-all"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-hub-primary truncate">
                              {script.name}
                            </span>
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${categoryBadge}`}>
                              {script.category}
                            </span>
                          </div>
                          <span className="block text-[11px] font-mono text-hub-muted truncate mt-1" title={script.command}>
                            $ {script.command}
                          </span>
                        </div>

                        <button
                          onClick={() => handleRunScript(script.name)}
                          disabled={runningScript !== null}
                          className="fluent-btn-standard h-8 px-3 text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap font-semibold shadow-2xs"
                          title={`Chạy ${packageManager} run ${script.name}`}
                        >
                          <Play className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin text-hub-accent' : 'fill-current text-emerald-500'}`} />
                          <span>{isRunning ? 'Running...' : 'Run'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Terminal Console Output Stream (6 cols) */}
              <div className="lg:col-span-6 rounded-xl border border-hub bg-[#1E1E1E] text-neutral-200 overflow-hidden font-mono text-xs flex flex-col h-[58vh]">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-neutral-800 text-neutral-300 text-xs shrink-0">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-[var(--hub-accent)]" />
                    <span className="font-semibold">Terminal Output Console</span>
                    {runningScript && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold animate-pulse">
                        Đang chạy: {runningScript}
                      </span>
                    )}
                  </div>
                  {outputLogs && (
                    <button
                      onClick={() => setOutputLogs('')}
                      className="text-neutral-400 hover:text-white text-[11px] font-sans px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
                    >
                      Xóa Log
                    </button>
                  )}
                </div>
                <div className="flex-1 p-3.5 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-mono text-[11px] text-neutral-300">
                  {outputLogs || (
                    <div className="h-full flex items-center justify-center text-neutral-500 font-sans text-xs">
                      Chọn một script ở bên trái và bấm <strong>Run</strong> để xem log đầu ra tại đây.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5 text-xs text-hub-muted">
            <span className="font-semibold text-hub-secondary">Package Manager:</span>
            <select
              value={packageManager}
              onChange={(e) => setPackageManager(e.target.value)}
              className="h-7 rounded-md border border-hub bg-hub-card px-2.5 text-xs font-mono font-bold text-hub-primary"
            >
              <option value="npm">npm</option>
              <option value="pnpm">pnpm</option>
              <option value="yarn">yarn</option>
              <option value="bun">bun</option>
            </select>
          </div>

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
