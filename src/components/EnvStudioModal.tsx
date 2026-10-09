import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Save, 
  X, 
  RefreshCw, 
  FileText, 
  Check, 
  ShieldCheck, 
  Copy, 
  Laptop, 
  Search,
  Lock
} from 'lucide-react';
import type { EnvItem, EnvData } from '../types';
import { useAppStore } from '../store/useAppStore';
import { sendFluentToast } from '../utils/notifications';

interface EnvStudioModalProps {
  projectId: string | null;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  isRemote?: boolean;
  nodeId?: string;
  nodeName?: string;
}

export const EnvStudioModal: React.FC<EnvStudioModalProps> = ({
  projectId,
  projectName,
  isOpen,
  onClose,
  isRemote,
  nodeId,
  nodeName,
}) => {
  const { fetchRemoteEnvSchema } = useAppStore();
  const [envData, setEnvData] = useState<EnvData | null>(null);
  const [items, setItems] = useState<EnvItem[]>([]);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedExample, setCopiedExample] = useState(false);
  const [searchVar, setSearchVar] = useState('');

  const fetchEnv = async () => {
    if (!projectId) return;
    setLoading(true);
    setSaveSuccess(false);
    try {
      if (isRemote && nodeId) {
        const data = await fetchRemoteEnvSchema(nodeId, projectId);
        if (data) {
          setEnvData(data);
          setItems(data.items);
        }
      } else {
        const res = await fetch(`/api/projects/${projectId}/env`);
        if (res.ok) {
          const data: EnvData = await res.json();
          setEnvData(data);
          setItems(data.items);
        }
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
  }, [isOpen, projectId, isRemote, nodeId]);

  const toggleReveal = (key: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleUpdateItem = (index: number, field: 'key' | 'value', value: string) => {
    if (isRemote) return;
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
    if (isRemote) return;
    setItems((prev) => [
      ...prev,
      { key: 'NEW_VAR', value: '', isSecret: false },
    ]);
  };

  const handleDeleteItem = (index: number) => {
    if (isRemote) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!projectId || isRemote) return;
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
        sendFluentToast('Đã lưu cấu hình', 'Các biến môi trường đã được lưu an toàn.', 'success');
      }
    } catch (e) {
      console.error('Save env failed', e);
      sendFluentToast('Lỗi lưu cấu hình', 'Không thể lưu biến môi trường.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyExample = () => {
    if (items.length === 0) return;
    const exampleText = items
      .map((item) => {
        const commentLine = item.comment ? `# ${item.comment}\n` : '';
        const val = item.isSecret ? `your_${item.key.toLowerCase()}_here` : item.value;
        return `${commentLine}${item.key}=${val}`;
      })
      .join('\n');

    navigator.clipboard.writeText(exampleText);
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
    sendFluentToast('Đã Sao Chép', 'Đã sao chép cấu trúc .env.example vào clipboard.', 'success');
  };

  if (!isOpen) return null;

  const filteredItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
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
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${
              isRemote 
                ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20'
                : 'bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5] ring-[#0F6CBD]/20'
            }`}>
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-hub-primary">
                  {isRemote ? 'Team Mesh .env Schema Explorer' : 'Visual .env & Secrets Studio'}
                </h3>
                <span className="rounded-md bg-black/[0.05] dark:bg-white/[0.06] px-2 py-0.5 text-xs font-mono font-semibold text-hub-primary">
                  {projectName}
                </span>
                {isRemote ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[11px] font-semibold">
                    <Laptop className="h-3 w-3" />
                    <span>Trạm: {nodeName || 'Remote Peer'}</span>
                    <span className="text-[10px] bg-purple-500/20 px-1 rounded">Masked Secrets</span>
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[11px] font-semibold">
                    Local Active
                  </span>
                )}
              </div>
              <p className="text-xs text-hub-muted mt-0.5">
                {isRemote 
                  ? 'Xem cấu trúc biến môi trường của microservice từ xa. Toàn bộ mật khẩu & khóa bí mật đã được che an toàn.'
                  : 'Quản lý, ẩn hiện an toàn và đồng bộ các biến môi trường cấu hình của ứng dụng'}
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

        {/* Remote Security Banner */}
        {isRemote && (
          <div className="bg-purple-500/10 border-b border-purple-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-purple-700 dark:text-purple-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                <strong>Bảo Mật Nghiêm Ngặt (Strict Secrets Isolation):</strong> Các khóa bí mật (passwords, tokens, database keys) được tự động thay thế bằng <code>[PROTECTED_REMOTE_SECRET]</code>. Bạn có thể xuất mẫu để kết nối mà không sợ rò rỉ credential của đồng đội.
              </span>
            </div>
            <button
              onClick={handleCopyExample}
              className="fluent-btn-standard h-7 px-3 text-xs flex items-center gap-1.5 shrink-0 bg-white/50 dark:bg-black/30 font-semibold"
            >
              {copiedExample ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedExample ? 'Đã chép' : 'Sao chép .env.example'}</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Quick Metrics Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-hub-primary font-semibold">
                <FileText className="h-4 w-4 text-[var(--hub-accent)]" />
                {items.length} Variables
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                <Lock className="h-3.5 w-3.5" />
                {secretCount} Protected Secrets
              </span>
              <span className="text-hub-muted text-[11px]">
                {envData?.fileName || '.env'}
              </span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hub-muted" />
              <input
                type="text"
                placeholder="Tìm biến hoặc giá trị..."
                value={searchVar}
                onChange={(e) => setSearchVar(e.target.value)}
                className="h-8 w-full rounded-md border border-hub bg-hub-card pl-8 pr-3 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Variables Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-hub-muted space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-[var(--hub-accent)]" />
              <p className="text-xs">Đang tải cấu hình biến môi trường...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hub p-12 text-center text-hub-muted space-y-3">
              <KeyRound className="h-10 w-10 mx-auto text-hub-muted/40" />
              <div>
                <p className="text-sm font-semibold text-hub-primary">Không tìm thấy file .env</p>
                <p className="text-xs text-hub-muted mt-1">
                  {isRemote 
                    ? 'Dự án từ xa này chưa có file .env hoặc chưa khai báo biến môi trường nào.'
                    : 'Nhấn "Thêm Biến Mới" bên dưới để khởi tạo cấu hình môi trường cho dự án này.'}
                </p>
              </div>
              {!isRemote && (
                <button
                  onClick={handleAddItem}
                  className="fluent-btn-primary h-8 px-4 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Thêm Biến Đầu Tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-hub overflow-hidden shadow-2xs">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold text-hub-muted uppercase tracking-wider">
                <div className="col-span-4">Biến (Key)</div>
                <div className="col-span-7">Giá Trị (Value)</div>
                <div className="col-span-1 text-right">{isRemote ? 'Loại' : 'Xóa'}</div>
              </div>

              <div className="divide-y divide-hub">
                {filteredItems.map(({ item, originalIndex }) => {
                  const isRevealed = !!revealedKeys[item.key];
                  const isMaskedRemote = isRemote && item.value === '[PROTECTED_REMOTE_SECRET]';

                  return (
                    <div
                      key={originalIndex}
                      className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                    >
                      {/* Key Column */}
                      <div className="col-span-4 flex items-center gap-2">
                        {item.isSecret && (
                          <span title="Khóa bảo mật" className="shrink-0 flex items-center">
                            <Lock className="h-3.5 w-3.5 text-amber-500" />
                          </span>
                        )}
                        <input
                          type="text"
                          value={item.key}
                          readOnly={isRemote}
                          onChange={(e) => handleUpdateItem(originalIndex, 'key', e.target.value)}
                          className={`h-8 w-full rounded px-2 text-xs font-mono font-semibold focus:outline-none ${
                            isRemote 
                              ? 'bg-transparent text-hub-primary border-none select-text'
                              : 'border border-hub bg-hub-card text-hub-primary focus:border-[var(--hub-accent)]'
                          }`}
                        />
                      </div>

                      {/* Value Column */}
                      <div className="col-span-7 flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <input
                            type={item.isSecret && !isRevealed && !isMaskedRemote ? 'password' : 'text'}
                            value={item.value}
                            readOnly={isRemote}
                            onChange={(e) => handleUpdateItem(originalIndex, 'value', e.target.value)}
                            className={`h-8 w-full rounded px-2 text-xs font-mono focus:outline-none ${
                              isMaskedRemote
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-500/20 select-text'
                                : isRemote
                                ? 'bg-black/[0.02] dark:bg-white/[0.03] text-hub-primary border border-hub/50 select-text'
                                : 'border border-hub bg-hub-card text-hub-primary focus:border-[var(--hub-accent)]'
                            }`}
                          />
                        </div>

                        {item.isSecret && !isMaskedRemote && (
                          <button
                            type="button"
                            onClick={() => toggleReveal(item.key)}
                            className="flex h-8 w-8 items-center justify-center rounded text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors shrink-0"
                            title={isRevealed ? 'Ẩn giá trị' : 'Hiện giá trị'}
                          >
                            {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        )}
                      </div>

                      {/* Action Column */}
                      <div className="col-span-1 text-right">
                        {isRemote ? (
                          <span className="text-[10px] font-mono text-hub-muted uppercase">
                            {item.isSecret ? 'Secret' : 'Public'}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteItem(originalIndex)}
                            className="flex h-8 w-8 items-center justify-center rounded text-hub-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-auto"
                            title="Xóa biến này"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
          <div>
            {!isRemote && (
              <button
                onClick={handleAddItem}
                className="fluent-btn-standard h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Biến Mới</span>
              </button>
            )}
            {isRemote && (
              <button
                onClick={handleCopyExample}
                className="fluent-btn-standard h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedExample ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedExample ? 'Đã sao chép' : 'Sao chép .env.example'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-md text-xs font-semibold text-hub-secondary hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
            >
              Đóng
            </button>

            {!isRemote && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="fluent-btn-primary h-8 px-5 text-xs font-semibold flex items-center gap-1.5"
              >
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-3.5 w-3.5 text-white" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span>{saveSuccess ? 'Đã Lưu!' : 'Lưu File .env'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
