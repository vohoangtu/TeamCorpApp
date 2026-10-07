import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  History, 
  Laptop, 
  Wifi, 
  Globe, 
  AlertTriangle,
  Lock,
  Unlock,
  Radio
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const MeshSettingsModal: React.FC = () => {
  const { 
    isMeshSettingsOpen, 
    setIsMeshSettingsOpen, 
    setIsAuditModalOpen,
    meshConfig, 
    updateMeshConfig,
    meshNodes 
  } = useAppStore();

  const [token, setToken] = useState('');
  const [allowRemote, setAllowRemote] = useState(true);
  const [requireToken, setRequireToken] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const selfNode = meshNodes.find((n) => n.isSelf || n.connectionType === 'local');

  useEffect(() => {
    if (meshConfig) {
      setToken(meshConfig.teamToken || 'windev-mesh-token-2026');
      setAllowRemote(meshConfig.allowRemoteControl !== false);
      setRequireToken(meshConfig.requireToken !== false);
    }
  }, [meshConfig, isMeshSettingsOpen]);

  if (!isMeshSettingsOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateToken = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let rand = 'mesh-';
    for (let i = 0; i < 16; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setToken(rand);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateMeshConfig({
      teamToken: token.trim(),
      allowRemoteControl: allowRemote,
      requireToken: requireToken,
    });
    setTimeout(() => {
      setIsSaving(false);
      setIsMeshSettingsOpen(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl 2xl:max-w-none 2xl:w-[80vw] 2xl:h-[90vh] max-h-[92vh] flex flex-col rounded-2xl bg-hub-card border border-hub shadow-2xl overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-card/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] border border-[var(--hub-accent)]/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-hub-primary">
                Cấu Hình Bảo Mật Team Mesh & Phân Quyền
              </h2>
              <p className="text-xs text-hub-muted mt-0.5">
                Quản lý mã bí mật Team Token, chính sách cho phép điều khiển từ xa và định danh trạm nội bộ
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsMeshSettingsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Team Secret Token */}
          <div className="rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-[var(--hub-accent)]" />
                <h3 className="text-sm font-bold text-hub-primary">
                  Team Secret Token (Mã Bí Mật Nhóm)
                </h3>
              </div>
              <span className="text-[11px] text-hub-muted">
                Dùng để bắt tay & xác thực giữa các máy trong team
              </span>
            </div>

            <p className="text-xs text-hub-muted mb-4 leading-relaxed">
              Mã khóa bí mật này phải được chia sẻ giống nhau giữa các thành viên cùng làm việc (qua mạng LAN/Wi-Fi hoặc VPN). Mọi yêu cầu gửi lệnh điều khiển (Restart/Sync) từ xa sẽ bắt buộc xác thực qua mã khóa này.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Nhập Team Token..."
                  className="w-full px-3.5 py-2 rounded-lg text-xs font-mono font-semibold border border-hub bg-hub-card text-hub-primary focus:outline-none focus:ring-2 focus:ring-[var(--hub-accent)]"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-hub-muted hover:text-hub-primary text-[11px] font-medium"
                >
                  {showToken ? 'Ẩn' : 'Hiện'}
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-hub bg-hub-card text-hub-secondary hover:text-hub-primary transition-colors"
                title="Sao chép Token vào clipboard"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>

              <button
                onClick={handleGenerateToken}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-hub bg-hub-card text-hub-secondary hover:text-hub-primary transition-colors"
                title="Sinh token ngẫu nhiên mới"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Tạo mới</span>
              </button>
            </div>
          </div>

          {/* Section 2: Remote Control Policy */}
          <div className="rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-hub-primary">
                Chính Sách Phân Quyền Điều Khiển Từ Xa (Remote Permissions)
              </h3>
            </div>

            <div className="space-y-4 pt-1">
              {/* Toggle 1: Allow Remote Control */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-hub bg-hub-card">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-hub-primary">
                    <span>Cho phép đồng nghiệp khởi động lại (Restart) & Hot-Sync ứng dụng</span>
                    {allowRemote ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">BẬT</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">TẮT</span>
                    )}
                  </div>
                  <p className="text-[11px] text-hub-muted mt-1 leading-relaxed">
                    Khi bật, đồng đội trong team có Token hợp lệ có thể bấm nút Restart hoặc Hot-Sync trên danh mục để làm mới ứng dụng mà không cần phiền bạn thao tác thủ công.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={allowRemote}
                    onChange={(e) => setAllowRemote(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--hub-accent)]"></div>
                </label>
              </div>

              {/* Toggle 2: Require Token */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-lg border border-hub bg-hub-card">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-xs text-hub-primary">
                    <span>Bắt buộc xác thực Team Token cho mọi yêu cầu</span>
                    {requireToken ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">BẬT</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">TẮT</span>
                    )}
                  </div>
                  <p className="text-[11px] text-hub-muted mt-1 leading-relaxed">
                    Từ chối ngay lập tức bất kỳ yêu cầu nào không kèm mã `X-Mesh-Token` khớp với cấu hình máy bạn. Giữ an toàn tối đa cho môi trường phát triển.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={requireToken}
                    onChange={(e) => setRequireToken(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer dark:bg-neutral-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--hub-accent)]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Node Identity Specs */}
          <div className="rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Laptop className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold text-hub-primary">
                  Thông Tin Định Danh Trạm Này (Node Identity)
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsMeshSettingsOpen(false);
                  setIsAuditModalOpen(true);
                }}
                className="flex items-center gap-1.5 text-xs text-[var(--hub-accent)] hover:underline font-semibold"
              >
                <History className="h-3.5 w-3.5" />
                <span>Xem Nhật Ký Kiểm Toán</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-hub bg-hub-card">
                <span className="text-[11px] text-hub-muted block mb-0.5">Node ID Máy:</span>
                <span className="font-mono font-semibold text-hub-primary text-[11px] break-all">
                  {meshConfig?.hostId || selfNode?.id || 'node_local'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-hub bg-hub-card">
                <span className="text-[11px] text-hub-muted block mb-0.5">Hostname / Người Dùng:</span>
                <span className="font-semibold text-hub-primary">
                  {selfNode?.username}@{selfNode?.hostname}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-hub bg-hub-card">
                <span className="text-[11px] text-hub-muted block mb-0.5">Địa chỉ LAN IP:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {selfNode?.ip || '127.0.0.1'}:4100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-hub bg-hub-card/80">
          <div className="text-xs text-hub-muted flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-500" />
            <span>Cấu hình tự động đồng bộ qua WebSocket và lưu trữ an toàn trong ~/.windev-hub</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMeshSettingsOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-hub-secondary hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="fluent-btn-primary flex items-center gap-1.5 px-5 py-2 text-xs font-semibold shadow-xs disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              <span>Lưu Cấu Hình</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
