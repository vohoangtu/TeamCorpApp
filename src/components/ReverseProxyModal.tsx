import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, X, Copy, Check, ShieldCheck, Wifi, Laptop } from 'lucide-react';
import type { ProxyRoute } from '../types';
import { sendFluentToast } from '../utils/notifications';
import { useAppStore } from '../store/useAppStore';

interface ReverseProxyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReverseProxyModal: React.FC<ReverseProxyModalProps> = ({ isOpen, onClose }) => {
  const { projects, teamCatalog } = useAppStore();
  const [routes, setRoutes] = useState<ProxyRoute[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newPort, setNewPort] = useState<number>(3000);
  const [targetHost, setTargetHost] = useState<string>('127.0.0.1');
  const [isRemote, setIsRemote] = useState<boolean>(false);
  const [nodeName, setNodeName] = useState<string>('');
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
        body: JSON.stringify({ 
          domain: newDomain.trim(), 
          targetPort: Number(newPort),
          targetHost: targetHost.trim() || '127.0.0.1',
          isRemote,
          nodeName: nodeName.trim() || undefined,
        }),
      });
      if (res.ok) {
        setNewDomain('');
        setTargetHost('127.0.0.1');
        setIsRemote(false);
        setNodeName('');
        await fetchRoutes();
        sendFluentToast(
          'Đã thêm Domain Alias', 
          `Domain "${newDomain}" đã được ánh xạ tới ${targetHost || '127.0.0.1'}:${newPort}.`, 
          'success'
        );
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

  const copyHostsCommand = (domain: string, id: string, host?: string) => {
    const targetIp = host && host.trim() && host !== 'localhost' ? host.trim() : '127.0.0.1';
    const cmd = `Add-Content -Path "$env:windir\\System32\\drivers\\etc\\hosts" -Value "${targetIp}  ${domain}"`;
    navigator.clipboard.writeText(cmd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    sendFluentToast('Đã sao chép lệnh', `Dán lệnh này vào PowerShell (Run as Administrator) để trỏ ${domain} ➔ ${targetIp}.`, 'info');
  };

  if (!isOpen) return null;

  const availableLocalProjects = projects.filter((p) => p.port);
  const availableRemoteProjects = teamCatalog.filter((p) => p.isRemote && p.port);

  const extractHostFromUrl = (urlStr?: string): string => {
    if (!urlStr) return '127.0.0.1';
    try {
      return new URL(urlStr).hostname;
    } catch {
      return '127.0.0.1';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Local Reverse Proxy & Team Mesh Domain Studio
                </h3>
                <span className="rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 px-2 py-0.5 text-[11px] font-semibold">
                  Virtual Hosts & Mesh Forwarder
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Ánh xạ tên miền ảo sạch (.local, .mesh.local) tới ứng dụng máy này hoặc microservices của đồng nghiệp trong mạng Mesh
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
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-hub p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
              <span className="text-[11px] font-medium text-hub-muted">Tên Miền Ảo Đã Lưu</span>
              <div className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                {routes.length} Domains
              </div>
            </div>

            <div className="rounded-lg border border-hub p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
              <span className="text-[11px] font-medium text-hub-muted">Local Apps Khả Dụng</span>
              <div className="text-2xl font-bold font-mono text-hub-primary mt-0.5">
                {availableLocalProjects.length} Projects
              </div>
            </div>

            <div className="rounded-lg border border-hub p-3.5 bg-black/[0.02] dark:bg-white/[0.02]">
              <span className="text-[11px] font-medium text-hub-muted">Team Mesh Services (Remote)</span>
              <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5">
                {availableRemoteProjects.length} Services
              </div>
            </div>
          </div>

          {/* Add Route Form */}
          <div className="p-4 rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] space-y-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-hub-primary uppercase tracking-wider">
                  Thêm Tên Miền Ảo (.local / .mesh.local)
                </h4>
                {isRemote && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[11px] font-semibold">
                    <Wifi className="h-3 w-3" />
                    <span>Trỏ tới máy đồng nghiệp: {nodeName}</span>
                    <button 
                      onClick={() => { setIsRemote(false); setTargetHost('127.0.0.1'); setNodeName(''); }}
                      className="ml-1 text-xs hover:underline text-hub-muted"
                    >
                      (Đặt lại localhost)
                    </button>
                  </span>
                )}
              </div>

              {/* Quick Select Buttons: Local & Remote */}
              <div className="space-y-1.5 pt-1">
                {availableLocalProjects.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-hub-muted text-[11px] shrink-0 font-medium">Chọn nhanh Local:</span>
                    {availableLocalProjects.slice(0, 4).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNewDomain(`${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.local`);
                          setNewPort(p.port || 3000);
                          setTargetHost('127.0.0.1');
                          setIsRemote(false);
                          setNodeName('');
                        }}
                        className="px-2 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] text-[11px] font-medium hover:bg-[var(--hub-accent)] hover:text-white transition-colors"
                      >
                        {p.name} (:{p.port})
                      </button>
                    ))}
                  </div>
                )}

                {availableRemoteProjects.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <span className="text-purple-600 dark:text-purple-400 text-[11px] shrink-0 font-semibold flex items-center gap-1">
                      <Wifi className="h-3 w-3" /> Chọn nhanh từ Team Mesh:
                    </span>
                    {availableRemoteProjects.slice(0, 4).map((p) => {
                      const host = extractHostFromUrl(p.remoteUrl);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setNewDomain(`${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.mesh.local`);
                            setNewPort(p.port || 3000);
                            setTargetHost(host);
                            setIsRemote(true);
                            setNodeName(p.nodeName || 'Peer');
                          }}
                          className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-medium hover:bg-purple-600 hover:text-white transition-colors"
                        >
                          {p.name} ({p.nodeName || 'Peer'} ➔ :{p.port})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-1">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  placeholder="VD: shop.local hoặc api.mesh.local"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="h-9 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary font-mono focus:border-[var(--hub-accent)] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-1.5">
                <span className="text-xs font-bold text-hub-muted shrink-0">➔ Host IP:</span>
                <input
                  type="text"
                  placeholder="127.0.0.1"
                  value={targetHost}
                  onChange={(e) => {
                    setTargetHost(e.target.value);
                    if (e.target.value !== '127.0.0.1' && e.target.value !== 'localhost') {
                      setIsRemote(true);
                    }
                  }}
                  className="h-9 w-full rounded-md border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-1.5">
                <span className="text-xs font-bold text-hub-muted shrink-0">:Port:</span>
                <input
                  type="number"
                  placeholder="3000"
                  value={newPort}
                  onChange={(e) => setNewPort(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-hub bg-hub-card px-2 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  onClick={handleAddRoute}
                  disabled={!newDomain.trim()}
                  className="fluent-btn-primary h-9 w-full text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Kích Hoạt</span>
                </button>
              </div>
            </div>
          </div>

          {/* Routes Table */}
          <div className="rounded-xl border border-hub overflow-hidden shadow-2xs">
            <div className="px-4 py-2.5 border-b border-hub bg-black/[0.02] dark:bg-white/[0.03] flex items-center justify-between text-[11px] font-bold text-hub-muted uppercase tracking-wider">
              <span>Danh Sách Tên Miền Ảo ({routes.length})</span>
              <span>Đích Đến (Target) & Thao Tác</span>
            </div>
            <div className="divide-y divide-hub">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-4 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg font-mono text-xs font-bold ring-1 ${
                      route.isRemote 
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/20' 
                        : 'bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-teal-500/20'
                    }`}>
                      {route.isRemote ? 'MESH' : 'HTTP'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-sm font-bold text-hub-primary font-mono">{route.domain}</span>
                        <span className="text-hub-muted text-xs">➔</span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                          route.isRemote 
                            ? 'text-purple-600 dark:text-purple-300 bg-purple-500/10'
                            : 'text-teal-600 dark:text-teal-400 bg-teal-500/10'
                        }`}>
                          {route.targetHost || '127.0.0.1'}:{route.targetPort}
                        </span>
                        {route.isRemote && (
                          <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.2 text-[10px] font-medium border border-purple-500/20">
                            <Laptop className="h-2.5 w-2.5" />
                            <span>{route.nodeName || 'Remote Peer'}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-hub-muted mt-0.5 block">
                        {route.isRemote 
                          ? `Chuyển tiếp traffic thẳng tới máy trạm [${route.nodeName || 'đồng nghiệp'}] trong mạng Mesh`
                          : 'Đang chuyển hướng traffic cổng mạng tới tiến trình nội bộ trên máy này'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyHostsCommand(route.domain, route.id, route.targetHost)}
                      className="fluent-btn-standard h-8 px-3 text-xs flex items-center gap-1.5"
                      title="Copy lệnh PowerShell cập nhật file hosts của Windows"
                    >
                      {copiedId === route.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-hub-muted" />
                          <span>Copy Hosts CMD</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Xóa route"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-hub bg-black/[0.01] dark:bg-white/[0.02] p-4 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-hub-primary">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-500" />
              <span>Cơ Chế Phân Giải Tên Miền Native Trên Windows 11 & Team Mesh:</span>
            </div>
            <p className="text-xs text-hub-muted leading-relaxed">
              Nhấn <strong>Copy Hosts CMD</strong> bên trên, mở <strong>PowerShell (Run as Administrator)</strong> và dán lệnh vào rồi nhấn Enter. Windows sẽ tự động ánh xạ tên miền <code>.local</code> hoặc <code>.mesh.local</code> trực tiếp tới IP máy đồng nghiệp với độ trễ <strong>&lt;1ms</strong> (hoặc qua VPN Wireguard/Tailscale) mà không cần cấu hình proxy phức tạp!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <button
            onClick={onClose}
            className="fluent-btn-primary h-8 px-5 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
