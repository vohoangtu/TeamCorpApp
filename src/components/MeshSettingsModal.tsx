import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  History, 
  Laptop, 
  Lock, 
  Radio,
  Download,
  Upload,
  FileJson,
  Users
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sendFluentToast } from '../utils/notifications';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleExportProfile = () => {
    const profile = {
      format: 'windev-team-mesh-profile',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      teamToken: token.trim(),
      requireToken,
      allowRemoteControl: allowRemote,
      clusterLeadNode: selfNode?.hostname || 'developer-pc',
      recommendedSubnets: ['192.168.0.0/16', '10.0.0.0/8', '100.64.0.0/10'],
    };

    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `windev-team-profile-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sendFluentToast('Đã Xuất Hồ Sơ', 'Tệp cấu hình nhóm đã được tải xuống (.json).', 'success');
  };

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.teamToken) {
          sendFluentToast('Tệp không hợp lệ', 'Không tìm thấy thông tin teamToken trong file cấu hình.', 'error');
          return;
        }

        setToken(parsed.teamToken);
        if (parsed.requireToken !== undefined) setRequireToken(parsed.requireToken);
        if (parsed.allowRemoteControl !== undefined) setAllowRemote(parsed.allowRemoteControl);

        await updateMeshConfig({
          teamToken: parsed.teamToken,
          requireToken: parsed.requireToken !== undefined ? parsed.requireToken : true,
          allowRemoteControl: parsed.allowRemoteControl !== undefined ? parsed.allowRemoteControl : true,
        });

        sendFluentToast(
          'Đã Nhập Hồ Sơ Nhóm Thành Công', 
          `Đã áp dụng cấu hình từ ${parsed.clusterLeadNode || 'đồng đội'}. Máy bạn đã gia nhập Team Mesh!`, 
          'success'
        );
      } catch (err: any) {
        sendFluentToast('Lỗi đọc tệp', err.message || 'Không thể đọc nội dung file JSON.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden File Input for Profile Import */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".json" 
          onChange={handleImportProfile} 
          className="hidden" 
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-card/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] border border-[var(--hub-accent)]/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-hub-primary">
                Cấu Hình Bảo Mật Team Mesh & Onboarding Nhóm
              </h2>
              <p className="text-xs text-hub-muted mt-0.5">
                Quản lý mã bí mật Team Token, phân quyền điều khiển từ xa và xuất/nhập hồ sơ nhóm cho thành viên mới
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
              Mã khóa bí mật này phải được chia sẻ giống nhau giữa các thành viên cùng làm việc (qua mạng LAN/Wi-Fi hoặc VPN). Mọi yêu cầu gửi lệnh điều khiển (Restart/Sync) hoặc stream log từ xa sẽ bắt buộc xác thực qua mã khóa này.
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

            <div className="space-y-3.5 pt-1">
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

          {/* Section 3: Team Workspace Profile (Quick Onboarding) */}
          <div className="rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-sky-500" />
              <h3 className="text-sm font-bold text-hub-primary">
                Hồ Sơ Nhóm & Onboarding Nhanh (Team Workspace Profile)
              </h3>
            </div>
            <p className="text-xs text-hub-muted mb-4 leading-relaxed">
              Xuất cấu hình này thành file <code>.json</code> để gửi cho thành viên mới trong team. Thành viên mới chỉ cần bấm "Nhập Hồ Sơ" để kết nối vào mạng Mesh trong 1 cú nhấp chuột mà không cần gõ token thủ công.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportProfile}
                className="fluent-btn-standard h-9 px-4 text-xs font-semibold flex items-center gap-2"
                title="Tải về file windev-team-profile.json"
              >
                <Download className="h-4 w-4 text-[var(--hub-accent)]" />
                <span>Xuất Hồ Sơ Nhóm (.json)</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="fluent-btn-standard h-9 px-4 text-xs font-semibold flex items-center gap-2"
                title="Chọn file windev-team-profile.json để áp dụng cấu hình"
              >
                <Upload className="h-4 w-4 text-emerald-500" />
                <span>Nhập Hồ Sơ Nhóm (Import)</span>
              </button>
            </div>
          </div>

          {/* Section 4: Node Identity Specs */}
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
