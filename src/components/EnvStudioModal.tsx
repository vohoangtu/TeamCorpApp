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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5]">
              <KeyRound className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Visual .env & Secrets Studio
              </h3>
              <p className="text-[12px] text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • {envData?.fileName || '.env'}
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
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              <span>Đã lưu biến môi trường và tạo bản sao lưu (.backup) thành công!</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
              Đang tải danh sách biến môi trường...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-md border border-dashed border-hub p-8 text-center">
              <FileText className="h-8 w-8 mx-auto text-hub-muted mb-2 opacity-50" />
              <p className="text-xs font-semibold text-hub-primary">Chưa có biến môi trường nào</p>
              <p className="text-[11px] text-hub-muted mt-1 mb-3">
                Thêm biến mới vào file {envData?.fileName || '.env'} để sử dụng trong dự án.
              </p>
              <button
                onClick={handleAddItem}
                className="fluent-btn-standard h-7 px-3 text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm biến mới</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-hub-muted uppercase px-1">
                <div className="col-span-5">Tên Biến (Key)</div>
                <div className="col-span-6">Giá Trị (Value)</div>
                <div className="col-span-1 text-center">Xóa</div>
              </div>

              {items.map((item, idx) => {
                const isSecret = item.isSecret;
                const isRevealed = revealedKeys[item.key] || false;

                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    {/* Key Input */}
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) => handleUpdateItem(idx, 'key', e.target.value)}
                        className="h-8 w-full rounded-[4px] border border-hub bg-hub-card px-2.5 text-xs font-mono font-semibold text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                        placeholder="KEY_NAME"
                      />
                    </div>

                    {/* Value Input */}
                    <div className="col-span-6 relative flex items-center">
                      <input
                        type={isSecret && !isRevealed ? 'password' : 'text'}
                        value={item.value}
                        onChange={(e) => handleUpdateItem(idx, 'value', e.target.value)}
                        className="h-8 w-full rounded-[4px] border border-hub bg-hub-card pl-2.5 pr-8 text-xs font-mono text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
                        placeholder="giá trị..."
                      />
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => toggleReveal(item.key)}
                          className="absolute right-2 text-hub-muted hover:text-hub-primary transition-colors"
                          title={isRevealed ? 'Ẩn giá trị bảo mật' : 'Hiển thị giá trị'}
                        >
                          {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>

                    {/* Delete action */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => handleDeleteItem(idx)}
                        className="flex h-7 w-7 items-center justify-center rounded text-hub-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Xóa biến"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-[var(--hub-accent)] hover:underline pt-2"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm dòng biến môi trường mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <span className="text-[11px] text-hub-muted truncate max-w-xs font-mono">
            {envData?.filePath}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="fluent-btn-standard h-8 px-3 text-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="fluent-btn-primary flex items-center gap-1.5 h-8 px-4 text-xs font-semibold"
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
