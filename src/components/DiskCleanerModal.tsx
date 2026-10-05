import React, { useState, useEffect } from 'react';
import { Trash2, RefreshCw, X, HardDrive, CheckCircle2, AlertTriangle, ArrowDownToLine, Sparkles } from 'lucide-react';
import type { DiskScanResult } from '../types';
import { sendFluentToast } from '../utils/notifications';

interface DiskCleanerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string;
}

export const DiskCleanerModal: React.FC<DiskCleanerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [scan, setScan] = useState<DiskScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [cleaning, setCleaning] = useState(false);
  const [reclaimedMessage, setReclaimedMessage] = useState<string | null>(null);

  const fetchScan = async () => {
    if (!projectId) return;
    setLoading(true);
    setReclaimedMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/clean-scan`);
      if (res.ok) {
        const data = await res.json();
        setScan(data);
        setSelectedTargets(data.targets.map((t: any) => t.name));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchScan();
    }
  }, [isOpen, projectId]);

  const handleClean = async () => {
    if (!projectId || selectedTargets.length === 0) return;
    setCleaning(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: selectedTargets }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReclaimedMessage(`🎉 Đã dọn dẹp thành công ${data.cleaned.length} mục và giải phóng ${data.reclaimedFormatted}!`);
        sendFluentToast('Dọn rác hoàn tất', `Đã giải phóng ${data.reclaimedFormatted} dung lượng ổ đĩa.`, 'success');
        await fetchScan();
      }
    } catch (e: any) {
      sendFluentToast('Lỗi dọn rác', e.message, 'error');
    } finally {
      setCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400">
              <HardDrive className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Disk Space Reclaimer & Purger
              </h3>
              <p className="text-[12px] text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Dọn sạch node_modules, cache, dist siêu tốc
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
          {reclaimedMessage && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{reclaimedMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
              Đang tính toán dung lượng các thư mục rác trên Windows...
            </div>
          ) : !scan || scan.targets.length === 0 ? (
            <div className="rounded-md border border-dashed border-hub p-8 text-center">
              <Sparkles className="h-8 w-8 mx-auto text-emerald-500 mb-2 opacity-80" />
              <p className="text-xs font-semibold text-hub-primary">Thư mục dự án hoàn toàn sạch sẽ!</p>
              <p className="text-[11px] text-hub-muted mt-1">
                Không phát hiện thấy node_modules, cache hoặc build artifacts nào cần dọn dẹp.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.03]">
                <div>
                  <div className="text-xs font-bold text-hub-primary">Tổng dung lượng có thể giải phóng</div>
                  <div className="text-[11px] text-hub-muted mt-0.5">{scan.targets.length} mục khả dụng</div>
                </div>
                <div className="text-lg font-mono font-bold text-rose-500 dark:text-rose-400">
                  {scan.totalSizeFormatted}
                </div>
              </div>

              <div className="rounded-md border border-hub overflow-hidden">
                <div className="px-3 py-2 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold text-hub-muted uppercase">
                  Chọn các mục cần xóa bỏ
                </div>
                <div className="divide-y divide-hub">
                  {scan.targets.map((target) => {
                    const isSelected = selectedTargets.includes(target.name);
                    return (
                      <label
                        key={target.name}
                        className="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTargets([...selectedTargets, target.name]);
                              } else {
                                setSelectedTargets(selectedTargets.filter((x) => x !== target.name));
                              }
                            }}
                            className="rounded text-rose-500"
                          />
                          <div>
                            <span className="text-xs font-mono font-bold text-hub-primary">{target.name}</span>
                            <span className="block text-[11px] text-hub-muted truncate max-w-sm">{target.path}</span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400">
                          {target.sizeFormatted}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded bg-amber-500/10 border border-amber-500/20 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Lưu ý: Xóa <code>node_modules</code> sẽ giải phóng tối đa ổ cứng. Bạn có thể cài lại bất cứ lúc nào bằng <code>npm install</code>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <button
            onClick={fetchScan}
            disabled={loading || cleaning}
            className="fluent-btn-standard h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Quét lại</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="fluent-btn-standard h-8 px-3.5 text-xs"
            >
              Đóng
            </button>
            <button
              onClick={handleClean}
              disabled={cleaning || selectedTargets.length === 0}
              className="fluent-btn-primary h-8 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border-rose-700 flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <span>{cleaning ? 'Đang dọn...' : `Dọn Rác Ngay (${selectedTargets.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
