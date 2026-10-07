import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Trash2, X, Maximize2, Minimize2, Copy, Check, ArrowDownToLine, Sparkles, Radio } from 'lucide-react';
import Convert from 'ansi-to-html';
import { useAppStore } from '../store/useAppStore';

const ansiConverter = new Convert({
  fg: '#cbd5e1',
  bg: '#020617',
  newline: true,
  escapeXML: true,
  colors: {
    0: '#020617',
    1: '#f87171',
    2: '#4ade80',
    3: '#facc15',
    4: '#38bdf8',
    5: '#c084fc',
    6: '#2dd4bf',
    7: '#e2e8f0',
  },
});

export const TerminalLogs: React.FC = () => {
  const { 
    activeProjectId, 
    projects, 
    teamCatalog,
    logs, 
    clearLogs, 
    isTerminalOpen, 
    setIsTerminalOpen,
    setActiveCopilot,
    fetchRemoteProjectLogs
  } = useAppStore();

  const [filter, setFilter] = useState<'all' | 'stdout' | 'stderr'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const activeProject = 
    projects.find((p) => p.id === activeProjectId) || 
    teamCatalog.find((p) => p.id === activeProjectId);
  const projectLogs = (activeProjectId ? logs[activeProjectId] : []) || [];

  // Live streaming polling for remote projects
  useEffect(() => {
    if (!isTerminalOpen || !activeProject?.isRemote || !activeProject.nodeId || !activeProjectId) return;

    fetchRemoteProjectLogs(activeProject.nodeId, activeProjectId);

    const interval = setInterval(() => {
      fetchRemoteProjectLogs(activeProject.nodeId!, activeProjectId);
    }, 2500);

    return () => clearInterval(interval);
  }, [isTerminalOpen, activeProjectId, activeProject?.isRemote, activeProject?.nodeId, fetchRemoteProjectLogs]);

  const filteredLogs = projectLogs.filter(log => {
    if (filter === 'all') return true;
    return log.stream === filter;
  });

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopyLogs = () => {
    const rawText = filteredLogs.map(l => `[${l.timestamp}] [${l.stream}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isTerminalOpen) return null;

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 border-t border-hub bg-hub-canvas/98 backdrop-blur-2xl transition-all duration-300 shadow-2xl flex flex-col ${
        isExpanded ? 'h-[80vh]' : 'h-80'
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-hub px-4 py-2 bg-hub-card transition-colors">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-white">Console Logs:</span>
            {activeProject ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="rounded bg-sky-500/10 text-sky-700 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30 px-2 py-0.5 text-xs font-semibold border">
                  {activeProject.name}
                </span>
                {activeProject.isRemote && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[11px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Remote: {activeProject.nodeName || 'Peer'}</span>
                    <span className="text-[10px] opacity-75 font-mono">
                      ({activeProject.connectionType === 'remote_tailscale' ? 'Tailscale' : 'LAN'})
                    </span>
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-500 dark:text-slate-400 italic">Select an app to stream logs</span>
            )}
          </div>

          {/* Stream filters */}
          <div className="hidden sm:flex items-center rounded-lg bg-white dark:bg-slate-950 p-0.5 border border-slate-200 dark:border-slate-800 text-[11px]">
            {(['all', 'stdout', 'stderr'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded-md px-2.5 py-0.5 capitalize transition-all ${
                  filter === tab
                    ? 'bg-sky-500/10 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300 font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] border transition-all ${
              autoScroll
                ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300'
                : 'border-slate-300 text-slate-500 dark:border-slate-800 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
            title="Auto-scroll to bottom"
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Auto-scroll</span>
          </button>

          {/* AI Explain & Fix Button */}
          <button
            onClick={() => {
              const rawText = filteredLogs.map((l) => l.text).join('\n');
              setActiveCopilot({
                isOpen: true,
                initialLogText: rawText.slice(-2000),
                projectName: activeProject?.name || 'Console',
              });
            }}
            className="flex items-center gap-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-1 text-[11px] font-semibold hover:bg-purple-500/20 transition-all shrink-0"
            title="✨ AI Copilot: Chẩn đoán nguyên nhân và sửa lỗi 1-Click"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Explain & Fix</span>
          </button>

          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Copy logs"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>

          {activeProjectId && (
            <button
              onClick={() => clearLogs(activeProjectId)}
              className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 transition-all"
              title="Clear terminal"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            title={isExpanded ? "Collapse" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setIsTerminalOpen(false)}
            className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
            title="Close console"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Log Output Area */}
      <div
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed text-slate-300 bg-slate-950/95 select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <Terminal className="h-8 w-8 text-slate-700" />
            <p className="text-center max-w-md">
              {activeProject?.isRemote
                ? `Đang lắng nghe luồng log từ trạm [${activeProject.nodeName || 'Remote'}]... Khi dịch vụ chạy trên máy đồng nghiệp, stdout/stderr sẽ hiển thị trực tiếp tại đây.`
                : 'No log records captured yet. Start or Sync the app to stream stdout/stderr.'}
            </p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-white/[0.02] py-0.5 px-1 rounded">
              <span className="text-[10px] text-slate-600 select-none shrink-0 pt-0.5">
                {log.timestamp.split('T')[1]?.slice(0, 8)}
              </span>
              <span
                className={`text-[9px] font-bold uppercase px-1 rounded shrink-0 select-none ${
                  log.stream === 'stderr'
                    ? 'bg-rose-500/20 text-rose-400'
                    : log.stream === 'system'
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {log.stream}
              </span>
              <div
                className="flex-1 break-all whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: ansiConverter.toHtml(log.text) }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
