import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, X, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';
import type { ProxyRoute } from '../types';
import { sendFluentToast } from '../utils/notifications';

interface ReverseProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReverseProxyModal: React.FC<ReverseProxyModalProps> = ({ isOpen, onClose }) => {
  const [routes, setRoutes] = useState<ProxyRoute[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newPort, setNewPort] = useState<number>(3000);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchRoutes = async () => {
    try {
      const res = await fetch('/api/proxy/routes');
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoutes();
    }
  }, [isOpen]);

  const handleAddRoute = async () => {
    if (!newDomain.trim() || !newPort) return;
    try {
      const res = await fetch('/api/proxy/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: newDomain.trim(), targetPort: Number(newPort) }),
      });
      if (res.ok) {
        setNewDomain('');
        await fetchRoutes();
        sendFluentToast('Đã thêm Domain Alias', `Domain "${newDomain}" đã được ánh xạ tới cổng ${newPort}.`, 'success');
      }
    } catch (e: any) {
      sendFluentToast('Lỗi', e.message, 'error');
    }
  };

  const handleDeleteRoute = async (id: string) => {
    try {
      await fetch(`/api/proxy/routes/${id}`, { method: 'DELETE' });
      await fetchRoutes();
    } catch (e) {
      console.error(e);
    }
  };

  const copyHostsCommand = (domain: string, id: string) => {
    const cmd = `Add-Content -Path "$env:windir\\System32\\drivers\\etc\\hosts" -Value "127.0.0.1  ${domain}"`;
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    sendFluentToast('Đã sao chép lệnh', 'Dán lệnh này vào PowerShell (Run as Administrator) để kích hoạt domain.', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Local Reverse Proxy & Custom Domain Studio
              </h3>
              <p className="text-[12px] text-hub-muted">
                Ánh xạ tên miền ảo (.local) tới các cổng dev localhost mà không cần nhớ số port
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
          {/* Add Route Form */}
          <div className="p-3.5 rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02] space-y-2.5">
            <h4 className="text-xs font-bold text-hub-primary uppercase tracking-wider">
              Thêm tên miền ảo mới (.local)
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="VD: shop.local hoặc myapp.local"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="h-8 flex-1 rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
              />
              <span className="text-xs font-semibold text-hub-muted">➔ Port:</span>
              <input
                type="number"
                placeholder="3000"
                value={newPort}
                onChange={(e) => setNewPort(Number(e.target.value))}
                className="h-8 w-24 rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none font-mono"
              />
              <button
                onClick={handleAddRoute}
                disabled={!newDomain.trim()}
                className="fluent-btn-primary h-8 px-3 text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Thêm Route</span>
              </button>
            </div>
          </div>

          {/* Routes Table */}
          <div className="rounded-md border border-hub overflow-hidden">
            <div className="px-3 py-2 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] text-[11px] font-bold text-hub-muted uppercase">
              Danh sách định tuyến ảo ({routes.length})
            </div>
            <div className="divide-y divide-hub">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 font-mono text-xs font-bold">
                      http
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-hub-primary">{route.domain}</span>
                        <span className="text-hub-muted text-xs">➔</span>
                        <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                          :{route.targetPort}
                        </span>
                      </div>
                      <span className="text-[11px] text-hub-muted">
                        Tương đương http://localhost:{route.targetPort}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyHostsCommand(route.domain, route.id)}
                      className="fluent-btn-standard h-7 px-2.5 text-xs flex items-center gap-1.5"
                      title="Copy lệnh PowerShell cập nhật file hosts của Windows"
                    >
                      {copiedId === route.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-hub-muted" />
                          <span>Copy Hosts CMD</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="flex h-7 w-7 items-center justify-center rounded text-hub-muted hover:text-rose-500 hover:bg-rose-500/10"
                      title="Xóa route"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-hub bg-black/[0.01] dark:bg-white/[0.02] p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-hub-primary">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Hướng dẫn kích hoạt Domain .local trên Windows:</span>
            </div>
            <p className="text-[11px] text-hub-muted leading-relaxed">
              Nhấn <strong>Copy Hosts CMD</strong> bên trên, mở <strong>PowerShell bằng quyền Administrator</strong> và dán lệnh vào rồi nhấn Enter. Windows sẽ tự động phân giải tên miền <code>.local</code> tới ứng dụng dev của bạn!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-hub bg-hub-sidebar">
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
