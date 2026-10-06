import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Terminal, 
  Search, 
  Trash2, 
  Download, 
  Sparkles, 
  Pause, 
  Play, 
  Filter, 
  Check, 
  ArrowDown, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Bug,
  RefreshCw
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { AggregatedLogEntry, LogLevel } from '../types';

interface UnifiedLogAggregatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedLogAggregatorModal: React.FC<UnifiedLogAggregatorModalProps> = ({ isOpen, onClose }) => {
  const { 
    aggregatedLogs, 
    fetchAggregatedLogs, 
    clearAggregatedLogs, 
    projects, 
    setActiveCopilot 
  } = useAppStore();

  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const prevLogsLength = useRef(aggregatedLogs.length);

  // Initial fetch when opened
  useEffect(() => {
    if (isOpen) {
      fetchAggregatedLogs();
      setUnreadCount(0);
    }
  }, [isOpen, fetchAggregatedLogs]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Autoscroll handling
  useEffect(() => {
    if (!isOpen) return;

    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      setUnreadCount(0);
    } else if (!autoScroll && aggregatedLogs.length > prevLogsLength.current) {
      setUnreadCount((prev) => prev + (aggregatedLogs.length - prevLogsLength.current));
    }
    prevLogsLength.current = aggregatedLogs.length;
  }, [aggregatedLogs, autoScroll, isOpen]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return aggregatedLogs.filter((log) => {
      // Project filter
      if (selectedProjectIds.length > 0 && !selectedProjectIds.includes(log.projectId)) {
        return false;
      }
      // Level filter
      if (selectedLevels.length > 0 && !selectedLevels.includes(log.level)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesMsg = log.message.toLowerCase().includes(q);
        const matchesProj = log.projectName.toLowerCase().includes(q);
        const matchesCorr = log.correlationId ? log.correlationId.toLowerCase().includes(q) : false;
        if (!matchesMsg && !matchesProj && !matchesCorr) return false;
      }
      return true;
    });
  }, [aggregatedLogs, selectedProjectIds, selectedLevels, searchQuery]);

  // Service counts
  const projectStats = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const log of aggregatedLogs) {
      stats[log.projectId] = (stats[log.projectId] || 0) + 1;
    }
    return stats;
  }, [aggregatedLogs]);

  // Level counts
  const levelStats = useMemo(() => {
    const stats = { info: 0, warn: 0, error: 0, debug: 0 };
    for (const log of aggregatedLogs) {
      if (stats[log.level] !== undefined) {
        stats[log.level]++;
      }
    }
    return stats;
  }, [aggregatedLogs]);

  const toggleProject = (projectId: string) => {
    setSelectedProjectIds((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]
    );
  };

  const toggleLevel = (level: LogLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleExport = (format: 'text' | 'json') => {
    setIsExporting(true);
    const params = new URLSearchParams();
    params.set('format', format);
    if (selectedProjectIds.length > 0) params.set('projectIds', selectedProjectIds.join(','));
    if (selectedLevels.length > 0) params.set('levels', selectedLevels.join(','));
    if (searchQuery) params.set('search', searchQuery);

    const link = document.createElement('a');
    link.href = `/api/logs/export?${params.toString()}`;
    link.download = `windev-unified-logs.${format === 'json' ? 'json' : 'log'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExporting(false);
  };

  const handleDiagnoseWithCopilot = () => {
    const recentErrors = filteredLogs.filter((l) => l.level === 'error').slice(-15);
    const contextLogs = recentErrors.length > 0 ? recentErrors : filteredLogs.slice(-25);
    const formatted = contextLogs
      .map((l) => `[${l.projectName}] [${l.level.toUpperCase()}] ${l.message.trim()}`)
      .join('\n');

    setActiveCopilot({
      isOpen: true,
      initialLogText: formatted,
      projectName: 'Tất cả Microservices (Multi-Service Causality)',
    });
  };

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
              <Terminal className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold tracking-tight">Unified Log Aggregator</h2>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Datadog Stream
                </span>
                <span className="text-[12px] text-hub-muted font-mono">
                  {filteredLogs.length} / {aggregatedLogs.length} events
                </span>
              </div>
              <p className="text-[12px] text-hub-muted">
                Hợp nhất dòng thời gian log của tất cả microservices đang chạy — Truy vết nhân quả lỗi chéo dịch vụ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDiagnoseWithCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Chẩn đoán lỗi đa dịch vụ bằng AI Copilot"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI Causality Copilot</span>
            </button>

            <div className="flex items-center rounded-md border border-hub bg-black/[0.02] dark:bg-white/[0.04] p-0.5">
              <button
                onClick={() => handleExport('text')}
                disabled={isExporting || filteredLogs.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-hub-secondary hover:text-hub-primary disabled:opacity-50 transition-colors"
                title="Tải về file .log"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export .log</span>
              </button>
              <span className="text-hub-muted/40">|</span>
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting || filteredLogs.length === 0}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-hub-secondary hover:text-hub-primary disabled:opacity-50 transition-colors"
                title="Tải về file .json"
              >
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={clearAggregatedLogs}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-hub text-xs font-medium text-hub-muted hover:text-rose-500 hover:border-rose-500/30 transition-colors"
              title="Xóa bộ đệm log hiện tại"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Xóa bộ đệm</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Service Chips, Level Filters, Search Box */}
        <div className="px-5 py-2.5 border-b border-hub bg-black/[0.01] dark:bg-white/[0.02] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Services Selector Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-hub-muted uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3" /> Services:
            </span>
            <button
              onClick={() => setSelectedProjectIds([])}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                selectedProjectIds.length === 0
                  ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-hub-muted hover:text-hub-primary'
              }`}
            >
              Tất cả ({projects.length})
            </button>
            {projects.map((p) => {
              const isSelected = selectedProjectIds.includes(p.id);
              const count = projectStats[p.id] || 0;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleProject(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all ${
                    isSelected
                      ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/15 text-[var(--hub-accent)] font-semibold'
                      : 'border-hub bg-black/[0.02] dark:bg-white/[0.03] text-hub-secondary hover:text-hub-primary'
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: p.status === 'running' ? '#10B981' : '#94A3B8' }}
                  />
                  <span className="truncate max-w-[120px]">{p.name}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Level Filter Chips & Search */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            {/* Level badges */}
            <div className="flex items-center gap-1 rounded-md border border-hub p-0.5 bg-black/[0.02] dark:bg-white/[0.03]">
              <button
                onClick={() => toggleLevel('error')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  selectedLevels.includes('error')
                    ? 'bg-rose-500 text-white'
                    : 'text-rose-500 hover:bg-rose-500/10'
                }`}
                title="Lỗi (Error)"
              >
                <AlertTriangle className="h-3 w-3" />
                <span>Error ({levelStats.error})</span>
              </button>
              <button
                onClick={() => toggleLevel('warn')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  selectedLevels.includes('warn')
                    ? 'bg-amber-500 text-white'
                    : 'text-amber-500 hover:bg-amber-500/10'
                }`}
                title="Cảnh báo (Warning)"
              >
                <Info className="h-3 w-3" />
                <span>Warn ({levelStats.warn})</span>
              </button>
              <button
                onClick={() => toggleLevel('info')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
                  selectedLevels.includes('info')
                    ? 'bg-sky-500 text-white'
                    : 'text-sky-500 hover:bg-sky-500/10'
                }`}
                title="Thông tin (Info)"
              >
                <span>Info ({levelStats.info})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hub-muted" />
              <input
                type="text"
                placeholder="Tìm regex, correlation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7.5 w-full rounded border border-hub bg-hub-card pl-8 pr-2.5 text-[12px] text-hub-primary placeholder:text-hub-muted focus:border-[var(--hub-accent)] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-hub-muted hover:text-hub-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* AutoScroll Button */}
            <button
              onClick={() => {
                setAutoScroll(!autoScroll);
                if (!autoScroll && logContainerRef.current) {
                  logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                  setUnreadCount(0);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-colors shrink-0 ${
                autoScroll
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
              title={autoScroll ? 'Bấm để dừng cuộn tự động' : 'Bấm để tiếp tục cuộn tự động'}
            >
              {autoScroll ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span className="hidden sm:inline">{autoScroll ? 'Cuộn tự động' : 'Đã dừng cuộn'}</span>
              {!autoScroll && unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold animate-pulse">
                  +{unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Merged Terminal Log Stream Body */}
        <div 
          ref={logContainerRef}
          className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed bg-[#0F1117] text-neutral-200 select-text scroll-smooth"
        >
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 py-12">
              <Terminal className="h-10 w-10 stroke-1 mb-2 opacity-50" />
              <p className="font-semibold text-sm">Chưa có nhật ký nào phù hợp bộ lọc</p>
              <p className="text-xs text-neutral-600 mt-1">
                Khởi chạy các dự án microservices để bắt đầu xem luồng log tổng hợp thời gian thực.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredLogs.map((entry, idx) => {
                const prevEntry = idx > 0 ? filteredLogs[idx - 1] : null;
                const isSameSecond = prevEntry && entry.timestamp.slice(0, 19) === prevEntry.timestamp.slice(0, 19);

                // Format timestamp hh:mm:ss.sss
                const timeStr = entry.timestamp.slice(11, 23);

                // Level colors
                const levelBadgeClass =
                  entry.level === 'error'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/30 font-bold'
                    : entry.level === 'warn'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30 font-medium'
                    : entry.level === 'debug'
                    ? 'text-neutral-400 bg-neutral-500/10 border-neutral-500/30'
                    : 'text-sky-400 bg-sky-500/10 border-sky-500/30';

                return (
                  <div 
                    key={entry.id + '-' + entry.sequence}
                    className={`group flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-white/[0.04] transition-colors ${
                      entry.level === 'error' ? 'bg-rose-950/20' : ''
                    }`}
                  >
                    {/* Timestamp */}
                    <span className="text-neutral-500 shrink-0 text-[11px] select-none">
                      {timeStr}
                    </span>

                    {/* Causality visual indicator connector */}
                    <span 
                      className={`w-1 shrink-0 self-stretch rounded-full my-0.5 ${
                        isSameSecond ? 'opacity-80' : 'opacity-40'
                      }`}
                      style={{ backgroundColor: entry.projectColor }}
                      title={`Nhân quả cùng mốc: ${entry.projectName}`}
                    />

                    {/* Service Tag */}
                    <span
                      className="px-2 py-0.2 rounded text-[10px] font-bold tracking-wide uppercase shrink-0 truncate max-w-[130px] border"
                      style={{
                        borderColor: `${entry.projectColor}55`,
                        backgroundColor: `${entry.projectColor}15`,
                        color: entry.projectColor,
                      }}
                    >
                      {entry.projectName}
                    </span>

                    {/* Target tag: Win / WSL / Docker */}
                    <span className="text-[10px] font-semibold text-neutral-500 shrink-0 uppercase px-1 rounded bg-neutral-800">
                      {entry.target === 'wsl' ? '🐧 WSL' : entry.target === 'docker' ? '🐳 DKR' : '🪟 WIN'}
                    </span>

                    {/* Level */}
                    <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase border shrink-0 ${levelBadgeClass}`}>
                      {entry.level}
                    </span>

                    {/* Correlation ID if detected */}
                    {entry.correlationId && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
                        #{entry.correlationId}
                      </span>
                    )}

                    {/* Message content */}
                    <span 
                      className={`flex-1 break-all whitespace-pre-wrap ${
                        entry.level === 'error' ? 'text-rose-300 font-medium' : 'text-neutral-300'
                      }`}
                    >
                      {entry.message}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-hub bg-hub-sidebar/80 text-[12px] text-hub-muted shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Tổng cộng <b>{aggregatedLogs.length}</b> bản ghi trong bộ nhớ vòng (Ring Buffer 1,500)
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Mẹo: Các dòng log xuất hiện cùng giây sẽ được kết nối màu vi dịch vụ giúp nhận diện nguyên nhân lỗi dây chuyền
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!autoScroll && (
              <button
                onClick={() => {
                  setAutoScroll(true);
                  if (logContainerRef.current) {
                    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
                    setUnreadCount(0);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--hub-accent)] text-white text-xs font-semibold shadow-2xs hover:opacity-90"
              >
                <ArrowDown className="h-3.5 w-3.5" />
                <span>Xuống mới nhất {unreadCount > 0 ? `(+${unreadCount})` : ''}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1 rounded border border-hub bg-hub-card text-xs font-medium hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-hub-primary"
            >
              Đóng (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
