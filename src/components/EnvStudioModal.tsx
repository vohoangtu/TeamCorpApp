import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, Plus, Trash2, Save, X, RefreshCw, FileText, Check } from 'lucide-react';
import type { EnvItem, EnvData } from '../types';

interface EnvStudioModalProps {
  projectId: string | null;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EnvStudioModal: React.FC<EnvStudioModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
}) => {
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [items, setItems] = useState<EnvItem[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchEnv = async () => {
    if (!projectId) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/env`);
      if (res.ok) {
        const data: EnvData = await res.json();
        setEnvData(data);
        setItems(data.items);
      }
    } catch (e) {
      console.error('Fetch env failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchEnv();
    }
  }, [isOpen, projectId]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUpdateItem = (index: number, field: 'key' | 'value', value: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value,
        isSecret: field === 'key' ? /(KEY|SECRET|TOKEN|PASS|AUTH|PRIVATE|DATABASE)/i.test(value) : next[index].isSecret,
      };
      return next;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { key: 'NEW_VAR', value: '', isSecret: false },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!projectId) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Save env failed', e);
    } finally {
      setSaving(false);
    }
  };

  const [searchVar, setSearchVar] = useState('');

  if (!isOpen) return null;

  const filteredItems = items.map((item, originalIndex) => ({ item, originalIndex })).filter(({ item }) => {
    if (!searchVar.trim()) return true;
    const q = searchVar.toLowerCase();
    return item.key.toLowerCase().includes(q) || item.value.toLowerCase().includes(q);
  });

  const secretCount = items.filter((i) => i.isSecret).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-6xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5] ring-1 ring-[#0F6CBD]/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Visual .env & Secrets Studio
                </h3>
                <span className="rounded-full bg-[#0F6CBD]/10 text-[#0F6CBD] dark:text-[#479EF5] px-2 py-0.5 text-[11px] font-semibold">
                  Environment Ops
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Quản lý biến môi trường trực quan, tự động sao lưu an toàn
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
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4.5 w-4.5 shrink-0" />
              <span>Đã lưu file {envData?.fileName || '.env'} và tạo bản sao lưu (.backup) an toàn thành công!</span>
            </div>
          )}

          {/* Quick Metrics & Search Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-8 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Tìm kiếm biến môi trường theo Key hoặc Value..."
                  value={searchVar}
                  onChange={(e) => setSearchVar(e.target.value)}
                  className="h-8 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                />
              </div>
              <button
                onClick={handleAddItem}
                className="fluent-btn-standard h-8 px-3 text-xs inline-flex items-center gap-1.5 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Biến</span>
              </button>
            </div>

            <div className="md:col-span-4 flex items-center justify-end gap-3 text-xs">
              <div className="rounded-md border border-hub px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="text-hub-muted">Tổng: </span>
                <span className="font-bold font-mono text-hub-primary">{items.length} biến</span>
              </div>
              <div className="rounded-md border border-hub px-3 py-1.5 bg-black/[0.02] dark:bg-white/[0.02]">
                <span className="text-hub-muted">Bảo mật: </span>
                <span className="font-bold font-mono text-amber-500">{secretCount} secret</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-hub-muted">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-hub-accent" />
              <p className="text-sm font-semibold text-hub-primary">Đang nạp file cấu hình môi trường...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hub p-12 text-center bg-black/[0.01] dark:bg-white/[0.01]">
              <FileText className="h-10 w-10 mx-auto text-hub-muted mb-3 opacity-50" />
              <p className="text-sm font-bold text-hub-primary">Chưa có biến môi trường nào</p>
              <p className="text-xs text-hub-muted mt-1 mb-4">
                Thêm biến mới vào file {envData?.fileName || '.env'} để sử dụng trong dự án.
              </p>
              <button
                onClick={handleAddItem}
                className="fluent-btn-standard h-8 px-4 text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Thêm biến đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-hub overflow-hidden shadow-2xs">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold text-hub-muted uppercase tracking-wider">
                <div className="col-span-4">Tên Biến (Key)</div>
                <div className="col-span-7">Giá Trị (Value)</div>
                <div className="col-span-1 text-center">Xóa</div>
              </div>

              <div className="divide-y divide-hub">
                {filteredItems.map(({ item, originalIndex }) => {
                  const isSecret = item.isSecret;
                  const isRevealed = revealedKeys[item.key] || false;

                  return (
                    <div key={originalIndex} className="grid grid-cols-12 gap-3 items-center px-4 py-2.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      {/* Key Input */}
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.key}
                          onChange={(e) => handleUpdateItem(originalIndex, 'key', e.target.value)}
                          className="h-8 w-full rounded-md border border-hub bg-hub-card px-2.5 text-xs font-mono font-bold text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                          placeholder="KEY_NAME"
                        />
                      </div>

                      {/* Value Input */}
                      <div className="col-span-7 relative flex items-center">
                        <input
                          type={isSecret && !isRevealed ? 'password' : 'text'}
                          value={item.value}
                          onChange={(e) => handleUpdateItem(originalIndex, 'value', e.target.value)}
                          className="h-8 w-full rounded-md border border-hub bg-hub-card pl-3 pr-10 text-xs font-mono text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                          placeholder="giá trị biến..."
                        />
                        {isSecret && (
                          <button
                            type="button"
                            onClick={() => toggleReveal(item.key)}
                            className="absolute right-2.5 text-hub-muted hover:text-hub-primary transition-colors"
                            title={isRevealed ? 'Ẩn giá trị bảo mật' : 'Hiển thị giá trị'}
                          >
                            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-amber-500" />}
                          </button>
                        )}
                      </div>

                      {/* Delete action */}
                      <div className="col-span-1 flex justify-center">
                        <button
                          onClick={() => handleDeleteItem(originalIndex)}
                          className="flex h-7 w-7 items-center justify-center rounded text-hub-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Xóa biến"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <span className="text-[11px] text-hub-muted truncate max-w-md font-mono">
            {envData?.filePath}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="fluent-btn-standard h-8 px-4 text-xs font-semibold"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="fluent-btn-primary flex items-center gap-1.5 h-8 px-5 text-xs font-semibold shadow-sm"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Đang lưu...' : 'Lưu File .env'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
