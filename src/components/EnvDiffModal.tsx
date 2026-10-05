import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, X, RefreshCw, Check, ArrowRight, Eye, EyeOff, Layers, Sparkles } from 'lucide-react';
import type { EnvDiffRow } from '../types';
import { useAppStore } from '../store/useAppStore';
import { sendFluentToast } from '../utils/notifications';

interface EnvDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EnvDiffModal: React.FC<EnvDiffModalProps> = ({ isOpen, onClose }) => {
  const { projects } = useAppStore();
  const [projAId, setProjAId] = useState<string>(projects[0]?.id || '');
  const [projBId, setProjBId] = useState<string>(projects[1]?.id || projects[0]?.id || '');
  const [rows, setRows] = useState<EnvDiffRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [diffStats, setDiffStats] = useState({ diffCount: 0, totalA: 0, totalB: 0 });

  const fetchDiff = async () => {
    if (!projAId || !projBId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/env/diff?projectA=${projAId}&projectB=${projBId}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setDiffStats({ diffCount: data.diffCount, totalA: data.totalA, totalB: data.totalB });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projAId && projBId) {
      fetchDiff();
    }
  }, [isOpen, projAId, projBId]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSyncKey = async (key: string, source: 'A' | 'B') => {
    const sourceProjectId = source === 'A' ? projAId : projBId;
    const targetProjectId = source === 'A' ? projBId : projAId;

    try {
      const res = await fetch('/api/env/sync-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceProjectId, targetProjectId, key }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sendFluentToast('Đồng bộ biến thành công', `Đã đồng bộ "${key}" sang dự án đích.`, 'success');
        await fetchDiff();
      }
    } catch (e: any) {
      sendFluentToast('Lỗi đồng bộ', e.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-4xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <ArrowLeftRight className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Cross-Project .env Diff & Secret Synchronizer
              </h3>
              <p className="text-[12px] text-hub-muted">
                So sánh hai file .env cạnh nhau và đồng bộ biến môi trường giữa các microservices
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

        {/* Project Selectors */}
        <div className="px-5 py-3 border-b border-hub bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-bold text-hub-primary">Dự án A:</span>
            <select
              value={projAId}
              onChange={(e) => setProjAId(e.target.value)}
              className="h-8 flex-1 rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs font-mono font-bold text-hub-muted px-2">VS</div>

          <div className="flex-1 flex items-center gap-2">
            <span className="text-xs font-bold text-hub-primary">Dự án B:</span>
            <select
              value={projBId}
              onChange={(e) => setProjBId(e.target.value)}
              className="h-8 flex-1 rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary font-medium"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchDiff}
            disabled={loading}
            className="fluent-btn-standard h-8 px-3 text-xs flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>So sánh</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
              Đang phân tích và so khớp các khóa biến môi trường...
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-xs text-hub-muted">
              Chưa có dữ liệu so sánh. Hãy chọn 2 dự án ở thanh trên.
            </div>
          ) : (
            <div className="rounded-md border border-hub overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-black/[0.02] dark:bg-white/[0.03] border-b border-hub font-bold text-hub-muted uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Tên Biến (Key)</th>
                    <th className="py-2.5 px-3">Giá Trị ở Dự án A</th>
                    <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                    <th className="py-2.5 px-3">Giá Trị ở Dự án B</th>
                    <th className="py-2.5 px-3 text-right">Đồng Bộ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hub font-mono">
                  {rows.map((row) => {
                    const isRevealed = revealedKeys[row.key];
                    const formatVal = (v?: string) => {
                      if (v === undefined) return <span className="text-hub-muted italic text-[11px]">— Trống —</span>;
                      if (row.isSecret && !isRevealed) return <span className="text-neutral-400">••••••••</span>;
                      return <span className="text-hub-primary">{v}</span>;
                    };

                    const statusBadge = {
                      identical: <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">Khớp 100%</span>,
                      different: <span className="text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-bold">Giá trị khác nhau</span>,
                      missing_in_b: <span className="text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-[10px] font-bold">Chỉ có ở A</span>,
                      missing_in_a: <span className="text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-[10px] font-bold">Chỉ có ở B</span>,
                    }[row.status];

                    return (
                      <tr
                        key={row.key}
                        className={`hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${
                          row.status === 'different' ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-hub-primary flex items-center gap-1.5">
                          <span>{row.key}</span>
                          {row.isSecret && (
                            <button
                              onClick={() => toggleReveal(row.key)}
                              className="text-hub-muted hover:text-hub-primary"
                              title="Ẩn/Hiện giá trị bí mật"
                            >
                              {isRevealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-3 truncate max-w-[200px]">{formatVal(row.valueA)}</td>
                        <td className="py-2.5 px-3 text-center">{statusBadge}</td>
                        <td className="py-2.5 px-3 truncate max-w-[200px]">{formatVal(row.valueB)}</td>
                        <td className="py-2.5 px-3 text-right">
                          {row.status === 'missing_in_b' || row.status === 'different' ? (
                            <button
                              onClick={() => handleSyncKey(row.key, 'A')}
                              className="fluent-btn-standard h-6 px-2 text-[11px] text-[var(--hub-accent)]"
                              title="Chép giá trị từ A sang B"
                            >
                              Chép A➔B
                            </button>
                          ) : row.status === 'missing_in_a' ? (
                            <button
                              onClick={() => handleSyncKey(row.key, 'B')}
                              className="fluent-btn-standard h-6 px-2 text-[11px] text-purple-500"
                              title="Chép giá trị từ B sang A"
                            >
                              Chép B➔A
                            </button>
                          ) : (
                            <Check className="h-3.5 w-3.5 text-emerald-500 ml-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Tổng cộng: <strong>{diffStats.totalA}</strong> biến ở A, <strong>{diffStats.totalB}</strong> biến ở B • Phát hiện <strong>{diffStats.diffCount}</strong> điểm lệch
          </span>
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
