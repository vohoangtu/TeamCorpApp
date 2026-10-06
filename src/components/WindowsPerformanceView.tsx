import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Gauge, 
  BatteryCharging, 
  ExternalLink, 
  Check, 
  Sparkles, 
  RefreshCw,
  Sliders,
  Maximize2,
  Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { ProcessPriority } from '../types';

export const WindowsPerformanceView: React.FC = () => {
  const { 
    tuningStatuses, 
    devDriveReport, 
    fetchTuningStatuses, 
    fetchDevDriveReport, 
    setProjectPriority, 
    batchSetEcoMode,
    setIsWindowsTuningOpen
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'scheduler' | 'devdrive'>('scheduler');
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTuningStatuses();
    fetchDevDriveReport();
  }, [fetchTuningStatuses, fetchDevDriveReport]);

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

  return (
    <div className="space-y-5 w-full pb-12">
      {/* Overview & Quick Hero Card */}
      <div className="rounded-xl border border-hub bg-hub-card p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Gauge className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-hub-primary">
                  Windows 11 Deep Performance & EcoQoS Tuning Hub
                </h3>
                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                  Windows Native Priority API
                </span>
              </div>
              <p className="text-xs text-hub-muted mt-0.5">
                Điều phối lõi CPU E-cores/P-cores, kích hoạt Windows Efficiency Mode và kiểm toán tối ưu hóa ổ đĩa Dev Drive (ReFS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                fetchTuningStatuses();
                fetchDevDriveReport();
              }}
              className="fluent-btn-standard h-8 px-3 text-xs gap-1.5 font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => setIsWindowsTuningOpen(true)}
              className="fluent-btn-standard h-8 px-3 text-xs gap-1.5 font-medium"
              title="Mở dạng cửa sổ Modal nổi"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Cửa sổ nổi</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher & Batch Eco Buttons */}
        <div className="mt-4 pt-4 border-t border-hub flex flex-wrap items-center justify-between gap-3">
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

        {feedbackMsg && (
          <div className="mt-3 p-2 rounded-lg border border-hub bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-100">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'scheduler' ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.03] flex items-start gap-3">
            <Info className="h-5 w-5 text-[var(--hub-accent)] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1 text-hub-muted leading-relaxed">
              <div className="font-semibold text-hub-primary">
                Cơ chế tối ưu hóa luồng CPU trong Windows 11:
              </div>
              <p>
                Khi kích hoạt <b>EcoQoS</b>, bộ điều phối CPU của Windows 11 sẽ chỉ định các luồng tiến trình này chạy trên 
                <b> Efficient Cores (E-cores)</b> và hạ tần số xung nhịp nền. Các lõi <b>Performance Cores (P-cores)</b> sẽ dành trọn 
                tài nguyên cho VS Code và trình duyệt, giúp máy chạy êm ái, kéo dài thời lượng pin khi lập trình trên laptop.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-hub overflow-hidden bg-hub-card shadow-xs">
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
                        <td className="py-3 px-4">
                          <div className="font-semibold text-hub-primary">{item.projectName}</div>
                          <div className="text-[11px] text-hub-muted font-mono">{item.projectId.slice(0, 8)}...</div>
                        </td>

                        <td className="py-3 px-4 font-mono">
                          {isRunning && item.pid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                              PID: {item.pid}
                            </span>
                          ) : (
                            <span className="text-hub-muted italic">Chưa chạy</span>
                          )}
                        </td>

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
          <div className="p-4 rounded-xl border border-hub bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
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
              <span>Tài liệu Microsoft</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="rounded-xl border border-hub overflow-hidden bg-hub-card shadow-xs">
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
                        <td className="py-3 px-4">
                          <div className="font-semibold text-hub-primary">{item.projectName}</div>
                          <div className="text-[11px] text-hub-muted truncate max-w-xs font-mono" title={item.sourcePath}>
                            {item.sourcePath}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-hub-primary">
                          {item.driveLetter}
                        </td>

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

          <div className="p-4 rounded-xl border border-hub bg-hub-card space-y-2.5 text-xs text-hub-muted shadow-xs">
            <div className="font-bold text-hub-primary flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-[var(--hub-accent)]" />
              <span>Cách tạo Windows 11 Dev Drive trong 1 phút:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 leading-relaxed pl-1">
              <li>
                Mở <b>Cài đặt Windows 11 (Win + I)</b> &rarr; <b>System</b> &rarr; <b>Storage</b> &rarr; <b>Advanced storage settings</b>.
              </li>
              <li>
                Chọn <b>Disks & volumes</b> &rarr; bấm <b>Create Dev Drive</b> (hoặc tạo ổ đĩa ảo VHDX dung lượng 50GB-100GB).
              </li>
              <li>
                Gán ký tự ổ đĩa (ví dụ: <code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">V:</code>) và chọn định dạng <b>ReFS</b>.
              </li>
              <li>
                Di chuyển thư mục dự án microservices vào ổ đĩa này để tăng tốc <code className="font-mono">npm install</code> và <code className="font-mono">tsc build</code> lên tới 35-40%!
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
