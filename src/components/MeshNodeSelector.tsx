import React, { useState } from 'react';
import { 
  Laptop, 
  Wifi, 
  Globe, 
  Users, 
  RefreshCw, 
  Share2, 
  Radio, 
  Info, 
  ShieldCheck, 
  Check, 
  ChevronDown,
  KeyRound,
  History,
  GitBranch
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { MeshNode } from '../types';

export const MeshNodeSelector: React.FC = () => {
  const { 
    meshNodes, 
    activeNodeFilter, 
    setActiveNodeFilter, 
    fetchMeshNodes, 
    fetchTeamCatalog,
    projects,
    teamCatalog,
    setIsMeshSettingsOpen,
    setIsAuditModalOpen,
    meshAuditLogs,
    isGitCollabRadarOpen,
    setIsGitCollabRadarOpen,
    gitOverlaps
  } = useAppStore();

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selfNode = meshNodes.find((n) => n.isSelf || n.connectionType === 'local');
  const peerNodes = meshNodes.filter((n) => !n.isSelf && n.connectionType !== 'local');
  const onlinePeersCount = peerNodes.filter((n) => n.status === 'online').length;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchMeshNodes(), fetchTeamCatalog()]);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-2.5 rounded-xl border border-hub bg-hub-card/60 backdrop-blur-md shadow-2xs">
      {/* Left: Node Selector Pills */}
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-bold text-hub-muted uppercase tracking-wider mr-1 hidden sm:inline-flex items-center gap-1">
          <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
          Node:
        </span>

        {/* Local Node Pill */}
        <button
          onClick={() => setActiveNodeFilter('local')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${
            activeNodeFilter === 'local'
              ? 'bg-[var(--hub-accent)] text-white shadow-xs'
              : 'text-hub-secondary hover:text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
          }`}
          title="Chỉ hiển thị ứng dụng đang phát triển trên máy này"
        >
          <Laptop className="h-3.5 w-3.5" />
          <span>Máy của tôi</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            activeNodeFilter === 'local' ? 'bg-white/20 text-white' : 'bg-black/[0.06] dark:bg-white/[0.08] text-hub-muted'
          }`}>
            {projects.length}
          </span>
        </button>

        {/* All Team Mesh Pill */}
        <button
          onClick={() => setActiveNodeFilter('all')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-semibold transition-all ${
            activeNodeFilter === 'all'
              ? 'bg-[var(--hub-accent)] text-white shadow-xs'
              : 'text-hub-secondary hover:text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
          }`}
          title="Toàn bộ mạng lưới vi dịch vụ của nhóm (Bao gồm Local + LAN + Remote)"
        >
          <Users className="h-3.5 w-3.5" />
          <span>Toàn bộ Team</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            activeNodeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-black/[0.06] dark:bg-white/[0.08] text-hub-muted'
          }`}>
            {teamCatalog.length || projects.length}
          </span>
        </button>

        {/* Individual Peer Node Pills */}
        {peerNodes.map((node) => {
          const isSelected = activeNodeFilter === node.id;
          const isLan = node.connectionType === 'lan';
          return (
            <button
              key={node.id}
              onClick={() => setActiveNodeFilter(node.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-[var(--hub-accent)] text-white shadow-xs font-semibold'
                  : 'text-hub-secondary hover:text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
              }`}
              title={`${node.name} • ${node.ip} • Trạng thái: ${node.status}`}
            >
              {isLan ? (
                <Wifi className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Globe className="h-3.5 w-3.5 text-blue-500" />
              )}
              <span className="truncate max-w-[130px]">{node.hostname}</span>
              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                isLan ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              }`}>
                {isLan ? 'LAN' : 'VPN'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Mesh Network Status Badge, Token, Audit & Network Info Popover */}
      <div className="relative flex items-center gap-2 shrink-0">
        <button
          onClick={() => setIsMeshSettingsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-hub bg-hub-card text-hub-secondary hover:text-hub-primary transition-colors shadow-2xs"
          title="Cấu hình Team Secret Token & Quyền điều khiển từ xa"
        >
          <KeyRound className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden sm:inline">Token & Quyền</span>
        </button>

        <button
          onClick={() => setIsGitCollabRadarOpen(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all shadow-2xs ${
            gitOverlaps.length > 0
              ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 animate-pulse'
              : 'border-hub bg-hub-card text-hub-secondary hover:text-hub-primary'
          }`}
          title="Mở Git Overlap Radar & Pre-PR Health Board (Ctrl+Shift+G)"
        >
          <GitBranch className="h-3.5 w-3.5 text-sky-500" />
          <span>Git Radar</span>
          {gitOverlaps.length > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-red-500 text-white font-bold">
              {gitOverlaps.length} clash
            </span>
          ) : (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
              0 clash
            </span>
          )}
        </button>

        <button
          onClick={() => setIsAuditModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-hub bg-hub-card text-hub-secondary hover:text-hub-primary transition-colors shadow-2xs"
          title="Xem nhật ký kiểm toán (Audit Trail) các thao tác điều khiển từ xa"
        >
          <History className="h-3.5 w-3.5 text-purple-500" />
          <span className="hidden sm:inline">Audit Trail</span>
          {meshAuditLogs.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold">
              {meshAuditLogs.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border border-hub bg-hub-card text-hub-secondary hover:text-hub-primary transition-colors shadow-2xs"
          title="Thông tin cấu hình mạng Mesh nội bộ"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{onlinePeersCount > 0 ? `${onlinePeersCount} đồng đội online` : 'LAN Discovery sẵn sàng'}</span>
          <ChevronDown className="h-3 w-3 text-hub-muted" />
        </button>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-hub bg-hub-card text-hub-muted hover:text-hub-primary transition-colors disabled:opacity-50"
          title="Quét lại mạng LAN & Tailnet"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[var(--hub-accent)]' : ''}`} />
        </button>

        {/* Network Details Popover */}
        {isDetailsOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsDetailsOpen(false)} />
            <div className="absolute right-0 top-9 z-40 w-80 rounded-xl border border-hub bg-hub-card/95 backdrop-blur-xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none">
              <div className="flex items-center justify-between pb-2 border-b border-hub mb-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs font-bold text-hub-primary">Team Mesh Network</span>
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-semibold">
                  Active
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-hub-muted text-[11px] block">Địa chỉ IP Máy này (LAN):</span>
                  <span className="font-mono font-semibold text-hub-primary">{selfNode?.ip || '127.0.0.1'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-hub text-[11px]">
                  <div>
                    <span className="text-hub-muted block">Giao thức LAN:</span>
                    <span className="font-semibold text-hub-primary">UDP ZeroConf :4105</span>
                  </div>
                  <div>
                    <span className="text-hub-muted block">Mạng ảo Remote:</span>
                    <span className="font-semibold text-hub-primary">Tailscale / WireGuard</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-hub">
                  <span className="text-hub-muted text-[11px] block mb-1">Danh sách máy trong nhóm ({meshNodes.length}):</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {meshNodes.map((n) => (
                      <div key={n.id} className="flex items-center justify-between p-1.5 rounded bg-black/[0.02] dark:bg-white/[0.03] text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          {n.connectionType === 'lan' ? (
                            <Wifi className="h-3 w-3 text-emerald-500 shrink-0" />
                          ) : n.connectionType === 'local' ? (
                            <Laptop className="h-3 w-3 text-sky-500 shrink-0" />
                          ) : (
                            <Globe className="h-3 w-3 text-blue-500 shrink-0" />
                          )}
                          <span className="font-medium text-hub-primary truncate">{n.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-hub-muted ml-2 shrink-0">{n.ip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-hub flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setIsMeshSettingsOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                  >
                    <KeyRound className="h-3 w-3" />
                    <span>Cấu hình Token</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDetailsOpen(false);
                      setIsAuditModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                  >
                    <History className="h-3 w-3" />
                    <span>Xem Audit ({meshAuditLogs.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
