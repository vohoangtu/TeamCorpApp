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

  const allSelected = Boolean(scan && scan.targets.length > 0 && selectedTargets.length === scan.targets.length);

  const handleToggleAll = () => {
    if (!scan) return;
    if (allSelected) {
      setSelectedTargets([]);
    } else {
      setSelectedTargets(scan.targets.map((t) => t.name));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 dark:bg-rose-500/20 dark:text-rose-400 ring-1 ring-rose-500/20">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Disk Space Reclaimer & Deep Artifact Purger
                </h3>
                <span className="rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 px-2 py-0.5 text-[11px] font-semibold">
                  Storage Optimizer
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Dọn sạch node_modules, build caches, dist artifacts siêu tốc
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {reclaimedMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{reclaimedMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-hub-muted">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-hub-accent" />
              <p className="text-sm font-semibold text-hub-primary">Đang phân tích dung lượng các thư mục rác...</p>
              <p className="text-xs text-hub-muted mt-1">Đang quét node_modules, .cache, dist, coverage trên ổ cứng</p>
            </div>
          ) : !scan || scan.targets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hub p-12 text-center bg-black/[0.01] dark:bg-white/[0.01]">
              <Sparkles className="h-10 w-10 mx-auto text-emerald-500 mb-3 opacity-80" />
              <p className="text-sm font-bold text-hub-primary">Thư mục dự án hoàn toàn sạch sẽ!</p>
              <p className="text-xs text-hub-muted mt-1">
                Không phát hiện thấy node_modules, cache hoặc build artifacts nào cần dọn dẹp.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Metric Cards Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-hub p-4 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-hub-muted">Tổng Dung Lượng Rác</span>
                    <div className="text-2xl font-bold font-mono text-rose-500 dark:text-rose-400 mt-0.5">
                      {scan.totalSizeFormatted}
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-md bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Trash2 className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="rounded-lg border border-hub p-4 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-hub-muted">Mục Đã Chọn Xóa</span>
                    <div className="text-2xl font-bold font-mono text-hub-primary mt-0.5">
                      {selectedTargets.length} / {scan.targets.length}
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <ArrowDownToLine className="h-4.5 w-4.5" />
                  </div>
                </div>

                <div className="rounded-lg border border-hub p-4 bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-hub-muted">Dung Lượng Tiết Kiệm</span>
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {scan.targets
                        .filter((t) => selectedTargets.includes(t.name))
                        .reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0) > 0
                        ? `${(
                            scan.targets
                              .filter((t) => selectedTargets.includes(t.name))
                              .reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0) /
                            (1024 * 1024)
                          ).toFixed(1)} MB`
                        : '0 MB'}
                    </div>
                  </div>
                  <div className="h-9 w-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Sparkles className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>

              {/* Targets List with select all */}
              <div className="rounded-lg border border-hub overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="rounded text-rose-500"
                    />
                    <span className="text-xs font-semibold text-hub-primary">
                      {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả các mục'}
                    </span>
                  </div>
                  <span className="text-[11px] text-hub-muted">
                    {scan.targets.length} thư mục & artifacts tìm thấy
                  </span>
                </div>

                <div className="divide-y divide-hub">
                  {scan.targets.map((target) => {
                    const isSelected = selectedTargets.includes(target.name);
                    return (
                      <label
                        key={target.name}
                        className={`flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer ${
                          isSelected ? 'bg-rose-500/[0.02]' : ''
                        }`}
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-hub-primary">{target.name}</span>
                              <span className="rounded bg-black/[0.05] dark:bg-white/[0.06] px-1.5 py-0.2 text-[10px] text-hub-muted font-mono">
                                {target.name.includes('node_modules') ? 'Dependencies' : target.name.includes('cache') ? 'Build Cache' : 'Output Dist'}
                              </span>
                            </div>
                            <span className="block text-[11px] text-hub-muted truncate max-w-xl mt-0.5 font-mono">{target.path}</span>
                          </div>
                        </div>

                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {target.sizeFormatted}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Safety notice */}
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-amber-500" />
                <span>
                  <strong>An toàn tuyệt đối:</strong> Xóa <code>node_modules</code> và <code>.cache</code> giải phóng tối đa ổ cứng mà không ảnh hưởng đến mã nguồn dự án. Bạn có thể khôi phục lại bất kỳ lúc nào bằng lệnh <code>npm install</code>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
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
              className="fluent-btn-standard h-8 px-4 text-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleClean}
              disabled={cleaning || selectedTargets.length === 0}
              className="fluent-btn-primary h-8 px-5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white border-rose-700 flex items-center gap-1.5 shadow-sm"
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
