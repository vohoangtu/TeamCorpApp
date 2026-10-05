import React, { useEffect, useState } from 'react';
import { 
  X, 
  Cpu, 
  HardDrive, 
  Activity, 
  Layers, 
  RotateCw, 
  Square, 
  Terminal, 
  Copy, 
  Check, 
  Info, 
  ShieldCheck, 
  TrendingUp, 
  Server,
  Zap
} from 'lucide-react';
import type { Project, ProjectResourceTelemetry } from '../types';
import { useAppStore } from '../store/useAppStore';

interface AppResourceInspectorModalProps {
  project: Project | null;
  onClose: () => void;
}

export const AppResourceInspectorModal: React.FC<AppResourceInspectorModalProps> = ({ project, onClose }) => {
  const { 
    resourceTelemetry, 
    fetchProjectTelemetry, 
    restartProject, 
    stopProject, 
    setActiveProject, 
    setIsTerminalOpen 
  } = useAppStore();

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (project) {
      fetchProjectTelemetry(project.id);
      const timer = setInterval(() => {
        fetchProjectTelemetry(project.id);
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [project?.id]);

  if (!project) return null;

  const telemetry: ProjectResourceTelemetry = resourceTelemetry[project.id] || {
    projectId: project.id,
    projectName: project.name,
    pid: project.pid,
    cpuPercent: project.cpuPercent || 0,
    memoryMb: project.memoryMb || 0,
    processCount: project.pid ? 1 : 0,
    target: project.runtimeType,
    processes: [],
    history: [],
  };

  const isRunning = project.status === 'running';
  const history = telemetry.history || [];

  // Calculate sparkline points for SVG
  const renderSparkline = (data: number[], color: string, height = 48) => {
    if (data.length < 2) {
      return (
        <div className="h-12 flex items-center justify-center text-xs text-neutral-400 font-mono">
          Đang thu thập dữ liệu chuỗi thời gian...
        </div>
      );
    }
    const max = Math.max(...data, 1);
    const min = Math.min(...data, 0);
    const range = max - min || 1;
    const width = 280;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 8) - 4;
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <svg className="w-full h-12 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Fill underneath */}
        <polygon
          fill={color}
          fillOpacity="0.12"
          points={`0,${height} ${points} ${width},${height}`}
        />
      </svg>
    );
  };

  const cpuData = history.map((h) => h.cpu);
  const memData = history.map((h) => h.memoryMb);
  const peakCpu = cpuData.length > 0 ? Math.max(...cpuData) : telemetry.cpuPercent;
  const peakMem = memData.length > 0 ? Math.max(...memData) : telemetry.memoryMb;
  const avgCpu = cpuData.length > 0 ? Math.round((cpuData.reduce((a, b) => a + b, 0) / cpuData.length) * 10) / 10 : telemetry.cpuPercent;
  const avgMem = memData.length > 0 ? Math.round(memData.reduce((a, b) => a + b, 0) / memData.length) : telemetry.memoryMb;

  // Diagnostic health
  let healthSeverity: 'healthy' | 'moderate' | 'warning' = 'healthy';
  let healthMessage = 'Mức tiêu thụ CPU & RAM tối ưu. Tiến trình hoạt động ổn định.';

  if (telemetry.cpuPercent > 80 || telemetry.memoryMb > 1024) {
    healthSeverity = 'warning';
    healthMessage = 'Cảnh báo: Ứng dụng đang chiếm dụng tài nguyên cao (> 80% CPU hoặc > 1GB RAM). Cân nhắc kiểm tra vòng lặp vô tận hoặc restart.';
  } else if (telemetry.cpuPercent > 35 || telemetry.memoryMb > 400) {
    healthSeverity = 'moderate';
    healthMessage = 'Tải tài nguyên ở mức trung bình. Thường xảy ra khi biên dịch TypeScript hoặc build bundle.';
  }

  const handleCopyReport = () => {
    const report = {
      project: project.name,
      target: project.runtimeType,
      pid: project.pid,
      status: project.status,
      cpuPercent: telemetry.cpuPercent,
      memoryMb: telemetry.memoryMb,
      processes: telemetry.processes,
      timestamp: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTerminal = () => {
    setActiveProject(project.id);
    setIsTerminalOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="fluent-card relative flex flex-col max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1C1C1C]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] dark:border-white/[0.08] px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-md text-white">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                  Telemetry Giám Sát Tài Nguyên: {project.name}
                </h2>
                <span className="rounded-md bg-black/[0.05] dark:bg-white/[0.08] px-2 py-0.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
                  {project.runtimeType === 'docker' ? '🐳 Docker' : project.runtimeType === 'wsl2' ? '🐧 WSL2' : '🪟 Windows'}
                </span>
                {project.pid && (
                  <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    PID: {project.pid}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Đo lường CPU % và RAM (Working Set) thời gian thực trên toàn bộ cây tiến trình (Process Tree)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-neutral-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-neutral-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPU Metric Card */}
            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    CPU Consumption
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-neutral-900 dark:text-white">
                    {telemetry.cpuPercent}%
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">live</span>
                </div>
              </div>

              {/* CPU Sparkline Chart */}
              <div className="my-2 bg-black/[0.02] dark:bg-black/20 rounded-lg p-2 border border-black/[0.04] dark:border-white/[0.04]">
                {renderSparkline(cpuData, '#0ea5e9')}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <span>Đỉnh: <strong className="text-neutral-800 dark:text-neutral-200">{peakCpu}%</strong></span>
                <span>Trung bình: <strong className="text-neutral-800 dark:text-neutral-200">{avgCpu}%</strong></span>
                <span>Mẫu đo: <strong className="text-neutral-800 dark:text-neutral-200">{history.length}/30</strong></span>
              </div>
            </div>

            {/* RAM Metric Card */}
            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-white/[0.02] p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <HardDrive className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                    Memory (Working Set RAM)
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-neutral-900 dark:text-white">
                    {telemetry.memoryMb}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">MB</span>
                </div>
              </div>

              {/* Memory Sparkline Chart */}
              <div className="my-2 bg-black/[0.02] dark:bg-black/20 rounded-lg p-2 border border-black/[0.04] dark:border-white/[0.04]">
                {renderSparkline(memData, '#10b981')}
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <span>Đỉnh: <strong className="text-neutral-800 dark:text-neutral-200">{peakMem} MB</strong></span>
                <span>Trung bình: <strong className="text-neutral-800 dark:text-neutral-200">{avgMem} MB</strong></span>
                <span>Tiến trình: <strong className="text-neutral-800 dark:text-neutral-200">{telemetry.processCount}</strong></span>
              </div>
            </div>
          </div>

          {/* Diagnostic Banner */}
          <div
            className={`flex items-start gap-3 rounded-xl p-3.5 border text-xs ${
              healthSeverity === 'warning'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                : healthSeverity === 'moderate'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Đánh giá Trạng thái Tài nguyên:</span>{' '}
              <span>{healthMessage}</span>
            </div>
          </div>

          {/* Sub-Processes Tree Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" /> Cây Tiến Trình Con (Process Tree Breakdown)
              </h3>
              <span className="text-xs text-neutral-400 font-mono">
                {telemetry.processes?.length || 0} active PIDs
              </span>
            </div>

            <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.08] overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-neutral-500 font-semibold select-none">
                    <th className="py-2 px-3">PID</th>
                    <th className="py-2 px-3">Tên Tiến Trình (Executable)</th>
                    <th className="py-2 px-3 text-right">CPU %</th>
                    <th className="py-2 px-3 text-right">RAM (MB)</th>
                    <th className="py-2 px-3 text-right">% Bộ Nhớ App</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04] font-mono">
                  {telemetry.processes && telemetry.processes.length > 0 ? (
                    telemetry.processes.map((proc, idx) => {
                      const memShare = telemetry.memoryMb > 0 ? Math.round((proc.memoryMb / telemetry.memoryMb) * 100) : 0;
                      return (
                        <tr key={idx} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02]">
                          <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                            {proc.pid || '-'}
                          </td>
                          <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200">
                            {proc.name}
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                            {proc.cpuPercent}%
                          </td>
                          <td className="py-2 px-3 text-right text-neutral-700 dark:text-neutral-300">
                            {proc.memoryMb} MB
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-neutral-500">{memShare}%</span>
                              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(memShare, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-neutral-400 italic">
                        {isRunning
                          ? 'Đang đồng bộ thông số chi tiết tiến trình...'
                          : 'Ứng dụng đang dừng (stopped). Nhấn Start để bắt đầu giám sát.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-black/[0.08] dark:border-white/[0.08] px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Đã sao chép JSON!' : 'Copy Telemetry Report'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenTerminal}
              className="flex items-center gap-1.5 rounded-lg border border-black/10 dark:border-white/10 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Mở Console Logs</span>
            </button>

            {isRunning ? (
              <>
                <button
                  onClick={() => restartProject(project.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>Restart App</span>
                </button>
                <button
                  onClick={() => stopProject(project.id)}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-colors"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Dừng App</span>
                </button>
              </>
            ) : null}

            <button
              onClick={onClose}
              className="fluent-btn-primary px-4 py-1.5 text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
