import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cpu, 
  Zap, 
  HardDrive, 
  Gauge, 
  BatteryCharging, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Sparkles, 
  RefreshCw,
  Sliders,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { ProcessPriority } from '../types';

interface WindowsPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsPerformanceModal: React.FC<WindowsPerformanceModalProps> = ({ isOpen, onClose }) => {
  const { 
    tuningStatuses, 
    devDriveReport, 
    fetchTuningStatuses, 
    fetchDevDriveReport, 
    setProjectPriority, 
    batchSetEcoMode,
    projects
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'scheduler' | 'devdrive'>('scheduler');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTuningStatuses();
      fetchDevDriveReport();
      setFeedbackMsg(null);
    }
  }, [isOpen, fetchTuningStatuses, fetchDevDriveReport]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handlePriorityChange = async (projectId: string, priority: ProcessPriority, isEco: boolean) => {
    const res = await setProjectPriority(projectId, priority, isEco);
    setFeedbackMsg(res.message);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleToggleEco = async (projectId: string, currentEco: boolean, priority: ProcessPriority) => {
    const nextEco = !currentEco;
    const nextPriority = nextEco ? 'idle' : (priority === 'idle' ? 'normal' : priority);
    const res = await setProjectPriority(projectId, nextPriority, nextEco);
    setFeedbackMsg(res.message);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleBatchEcoToggle = async (enable: boolean) => {
    setLoading(true);
    try {
      const res = await batchSetEcoMode(enable);
      setFeedbackMsg(`Đã chuyển ${res.affectedCount} microservices sang chế độ ${enable ? 'EcoQoS (Tiết kiệm năng lượng)' : 'Cân bằng chuẩn'}.`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="relative flex flex-col w-full max-w-6xl h-[88vh] rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden text-hub-primary"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--hub-accent)] text-white shadow-xs">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold tracking-tight">Windows 11 Deep Performance & EcoQoS Tuning</h2>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                  Windows Native API
                </span>
              </div>
              <p className="text-[12px] text-hub-muted">
                Điều phối ưu tiên CPU, kích hoạt Windows Efficiency Mode (EcoQoS) và kiểm toán tối ưu hóa ổ đĩa Dev Drive (ReFS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchTuningStatuses();
                fetchDevDriveReport();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-hub bg-hub-card text-xs font-medium text-hub-secondary hover:text-hub-primary transition-colors"
              title="Làm mới thông số điều phối"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm mới</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Header */}
        <div className="px-5 py-2.5 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('scheduler')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'scheduler'
                  ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                  : 'text-hub-secondary hover:text-hub-primary bg-black/[0.02] dark:bg-white/[0.04]'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span>Process Priority & EcoQoS (CPU Scheduler)</span>
            </button>

            <button
              onClick={() => setActiveTab('devdrive')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'devdrive'
                  ? 'bg-[var(--hub-accent)] text-white shadow-xs'
                  : 'text-hub-secondary hover:text-hub-primary bg-black/[0.02] dark:bg-white/[0.04]'
              }`}
            >
              <HardDrive className="h-4 w-4" />
              <span>Windows Dev Drive (ReFS) Advisor (+35% I/O)</span>
            </button>
          </div>

          {activeTab === 'scheduler' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleBatchEcoToggle(true)}
                disabled={loading}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                title="Bật EcoQoS cho tất cả dịch vụ chạy nền để quạt êm và tiết kiệm pin laptop"
              >
                <BatteryCharging className="h-3.5 w-3.5" />
                <span>Bật EcoQoS tất cả</span>
              </button>
              <button
                onClick={() => handleBatchEcoToggle(false)}
                disabled={loading}
                className="px-2.5 py-1 rounded text-xs font-medium border border-hub text-hub-muted hover:text-hub-primary transition-colors"
              >
                Hủy EcoQoS
              </button>
            </div>
          )}
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="px-5 py-2 border-b border-hub bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-100">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 select-text space-y-5">
          {activeTab === 'scheduler' ? (
            <div className="space-y-4">
              {/* Feature Explanation Banner */}
              <div className="p-3.5 rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.03] flex items-start gap-3">
                <Info className="h-5 w-5 text-[var(--hub-accent)] shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-hub-muted leading-relaxed">
                  <div className="font-semibold text-hub-primary">
                    Cách thức hoạt động của Windows 11 EcoQoS (Efficiency Mode):
                  </div>
                  <p>
                    Khi kích hoạt <b>EcoQoS</b>, bộ điều phối CPU của Windows 11 sẽ chủ động chuyển các luồng tiến trình này sang 
                    <b> Efficient Cores (E-cores)</b> và hạ tần số xung nhịp nền. Các lõi <b>Performance Cores (P-cores)</b> sẽ hoàn toàn 
                    rảnh tay để phục vụ trình soạn thảo mã nguồn (VS Code) và trình duyệt mượt mà mà máy không bị nóng hay hú quạt.
                  </p>
                </div>
              </div>

              {/* Priority & Eco Table */}
              <div className="rounded-lg border border-hub overflow-hidden bg-hub-card">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-hub bg-black/[0.03] dark:bg-white/[0.04] text-hub-muted font-medium">
                      <th className="py-2.5 px-4 font-semibold">Microservice Project</th>
                      <th className="py-2.5 px-4 font-semibold">Tiến trình (PID)</th>
                      <th className="py-2.5 px-4 font-semibold">Độ ưu tiên (Process Priority)</th>
                      <th className="py-2.5 px-4 font-semibold">Chế độ EcoQoS (Efficiency Mode)</th>
                      <th className="py-2.5 px-4 text-right font-semibold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hub">
                    {tuningStatuses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-hub-muted">
                          Chưa có dự án nào được đăng ký trong hệ thống.
                        </td>
                      </tr>
                    ) : (
                      tuningStatuses.map((item) => {
                        const isRunning = item.status === 'running';

                        return (
                          <tr key={item.projectId} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            {/* Project Name */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-hub-primary">{item.projectName}</div>
                              <div className="text-[11px] text-hub-muted font-mono">{item.projectId.slice(0, 8)}...</div>
                            </td>

                            {/* PID */}
                            <td className="py-3 px-4 font-mono">
                              {isRunning && item.pid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                                  PID: {item.pid}
                                </span>
                              ) : (
                                <span className="text-hub-muted italic">Chưa chạy</span>
                              )}
                            </td>

                            {/* Priority Selector */}
                            <td className="py-3 px-4">
                              <select
                                value={item.priority}
                                onChange={(e) =>
                                  handlePriorityChange(item.projectId, e.target.value as ProcessPriority, item.isEcoMode)
                                }
                                className="h-7 rounded border border-hub bg-hub-sidebar px-2 text-xs font-semibold text-hub-primary cursor-pointer focus:border-[var(--hub-accent)] focus:outline-none"
                              >
                                <option value="idle">Idle (Thấp nhất - Tiết kiệm tối đa)</option>
                                <option value="below_normal">Below Normal (Dưới chuẩn)</option>
                                <option value="normal">Normal (Mặc định chuẩn)</option>
                                <option value="above_normal">Above Normal (Ưu tiên cao hơn)</option>
                                <option value="high">High (Ưu tiên cao nhất)</option>
                              </select>
                            </td>

                            {/* EcoQoS Toggle Switch */}
                            <td className="py-3 px-4">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={item.isEcoMode}
                                  onChange={() => handleToggleEco(item.projectId, item.isEcoMode, item.priority)}
                                  className="h-4 w-4 rounded border-hub text-emerald-500 focus:ring-0 cursor-pointer"
                                />
                                <span
                                  className={`text-xs font-semibold ${
                                    item.isEcoMode
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-hub-muted'
                                  }`}
                                >
                                  {item.isEcoMode ? '🌿 Đang bật EcoQoS' : 'Tắt EcoQoS'}
                                </span>
                              </label>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4 text-right">
                              {isRunning ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Đang chạy
                                </span>
                              ) : (
                                <span className="text-[11px] text-hub-muted">Đã dừng</span>
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
          ) : (
            <div className="space-y-5">
              {/* Dev Drive Advisor Hero Card */}
              <div className="p-4 rounded-xl border border-hub bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <h3 className="text-sm font-bold tracking-tight text-hub-primary">
                      Windows 11 Dev Drive (ReFS) Performance Audit
                    </h3>
                  </div>
                  <p className="text-xs text-hub-secondary max-w-2xl leading-relaxed">
                    {devDriveReport?.summary || 'Đang quét hệ thống tệp các phân vùng ổ đĩa...'}
                  </p>
                </div>

                <a
                  href={devDriveReport?.guideUrl || 'https://learn.microsoft.com/en-us/windows/dev-drive/'}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--hub-accent)] hover:opacity-90 text-white text-xs font-semibold shadow-xs shrink-0 transition-opacity"
                >
                  <span>Xem tài liệu Microsoft</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Dev Drive Audit Table */}
              <div className="rounded-lg border border-hub overflow-hidden bg-hub-card">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-hub bg-black/[0.03] dark:bg-white/[0.04] text-hub-muted font-medium">
                      <th className="py-2.5 px-4 font-semibold">Dự án & Vị trí</th>
                      <th className="py-2.5 px-4 font-semibold">Ổ đĩa</th>
                      <th className="py-2.5 px-4 font-semibold">Định dạng FileSystem</th>
                      <th className="py-2.5 px-4 font-semibold">Đánh giá hiệu năng</th>
                      <th className="py-2.5 px-4 font-semibold">Khuyến nghị kỹ thuật</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hub">
                    {!devDriveReport || devDriveReport.items.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-hub-muted">
                          Chưa có dữ liệu ổ đĩa.
                        </td>
                      </tr>
                    ) : (
                      devDriveReport.items.map((item) => {
                        return (
                          <tr key={item.projectId} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                            {/* Project & Path */}
                            <td className="py-3 px-4">
                              <div className="font-semibold text-hub-primary">{item.projectName}</div>
                              <div className="text-[11px] text-hub-muted truncate max-w-xs font-mono" title={item.sourcePath}>
                                {item.sourcePath}
                              </div>
                            </td>

                            {/* Drive Letter */}
                            <td className="py-3 px-4 font-mono font-bold text-hub-primary">
                              {item.driveLetter}
                            </td>

                            {/* FileSystem */}
                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                  item.isDevDrive
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30'
                                }`}
                              >
                                {item.fileSystem}
                              </span>
                            </td>

                            {/* Speed Rating */}
                            <td className="py-3 px-4">
                              {item.isDevDrive ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>🚀 Siêu tốc (ReFS CoW)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-medium text-hub-secondary">
                                  <span>⚡ Chuẩn (Standard NTFS)</span>
                                </span>
                              )}
                            </td>

                            {/* Recommendation */}
                            <td className="py-3 px-4 text-hub-muted max-w-sm">
                              {item.recommendation}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Dev Drive Step by Step Tutorial Box */}
              <div className="p-4 rounded-lg border border-hub bg-hub-sidebar/40 space-y-2.5 text-xs text-hub-muted">
                <div className="font-bold text-hub-primary flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-[var(--hub-accent)]" />
                  <span>Cách tạo Windows 11 Dev Drive trong 1 phút:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
                  <li>
                    Mở <b>Cài đặt Windows 11 (Win + I)</b> &rarr; chọn <b>System</b> &rarr; <b>Storage</b> &rarr; <b>Advanced storage settings</b>.
                  </li>
                  <li>
                    Chọn mục <b>Disks & volumes</b> &rarr; bấm <b>Create Dev Drive</b> (hoặc tạo một ổ đĩa ảo VHDX dung lượng 50GB-100GB).
                  </li>
                  <li>
                    Gán ký tự ổ đĩa (ví dụ: <code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">V:</code>) và chọn định dạng <b>ReFS</b>.
                  </li>
                  <li>
                    Di chuyển thư mục dự án microservices vào ổ đĩa này để trải nghiệm tốc độ <code className="font-mono">npm install</code> và <code className="font-mono">tsc build</code> tăng vọt!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-hub bg-hub-sidebar/80 text-[12px] text-hub-muted shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Tích hợp sâu API nhân Windows NT (PriorityClass & PowerThrottle EcoQoS)</span>
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
