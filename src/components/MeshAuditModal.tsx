import React, { useState } from 'react';
import { 
  X, 
  History, 
  RotateCw, 
  Zap, 
  Square, 
  Play, 
  ShieldAlert, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Clock, 
  User, 
  Server, 
  Laptop 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { MeshAuditLog } from '../types';

export const MeshAuditModal: React.FC = () => {
  const { 
    isAuditModalOpen, 
    setIsAuditModalOpen, 
    meshAuditLogs, 
    clearMeshAuditLogs 
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'rejected' | 'failed'>('all');
  const [actionFilter, setActionFilter] = useState<'all' | 'restart' | 'sync' | 'stop' | 'start'>('all');

  if (!isAuditModalOpen) return null;

  const filteredLogs = meshAuditLogs.filter((log) => {
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor =
        log.actorUsername.toLowerCase().includes(q) ||
        log.actorHostname.toLowerCase().includes(q) ||
        log.actorIp.toLowerCase().includes(q);
      const matchApp = log.targetProjectName.toLowerCase().includes(q);
      const matchReason = log.reason?.toLowerCase().includes(q);
      return matchActor || matchApp || matchReason;
    }
    return true;
  });

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ` ${d.toLocaleDateString('vi-VN')}`;
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'restart':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <RotateCw className="h-3 w-3" />
            Restart
          </span>
        );
      case 'sync':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Zap className="h-3 w-3" />
            Hot-Sync
          </span>
        );
      case 'stop':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <Square className="h-3 w-3" />
            Stop
          </span>
        );
      case 'start':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Play className="h-3 w-3" />
            Start
          </span>
        );
      default:
        return <span className="text-xs uppercase">{action}</span>;
    }
  };

  const getStatusBadge = (status: string, reason?: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Thành công
          </span>
        );
      case 'rejected':
        return (
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 cursor-help"
            title={reason || 'Yêu cầu bị từ chối'}
          >
            <ShieldAlert className="h-3 w-3" />
            Bị từ chối
          </span>
        );
      case 'failed':
        return (
          <span 
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 cursor-help"
            title={reason || 'Thực thi thất bại'}
          >
            <AlertCircle className="h-3 w-3" />
            Lỗi
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-6xl 2xl:max-w-none 2xl:w-[80vw] 2xl:h-[90vh] h-[92vh] flex flex-col rounded-2xl bg-hub-card border border-hub shadow-2xl overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-card/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-hub-primary">
                  Nhật Ký Kiểm Toán Mạng Mesh (Audit Trail)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  {meshAuditLogs.length} sự kiện
                </span>
              </div>
              <p className="text-xs text-hub-muted mt-0.5">
                Ghi nhận minh bạch mọi thao tác điều khiển từ xa (Restart, Sync, Stop) giữa các máy trạm trong team
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {meshAuditLogs.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa sạch toàn bộ nhật ký kiểm toán?')) {
                    clearMeshAuditLogs();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                title="Xóa sạch nhật ký"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Xóa nhật ký</span>
              </button>
            )}

            <button
              onClick={() => setIsAuditModalOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-hub-muted hover:text-hub-primary hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-hub bg-black/[0.02] dark:bg-white/[0.01]">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hub-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo người dùng, IP, app đích..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs border border-hub bg-hub-card text-hub-primary focus:outline-none focus:ring-1 focus:ring-[var(--hub-accent)]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-hub bg-hub-card p-0.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[var(--hub-accent)] text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('success')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === 'success'
                    ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Thành công
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === 'rejected'
                    ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Bị từ chối
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  statusFilter === 'failed'
                    ? 'bg-rose-600 text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Lỗi
              </button>
            </div>

            {/* Action Tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-hub bg-hub-card p-0.5">
              <button
                onClick={() => setActionFilter('all')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                  actionFilter === 'all'
                    ? 'bg-[var(--hub-accent)] text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Mọi lệnh
              </button>
              <button
                onClick={() => setActionFilter('restart')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  actionFilter === 'restart'
                    ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Restart
              </button>
              <button
                onClick={() => setActionFilter('sync')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-all ${
                  actionFilter === 'sync'
                    ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                    : 'text-hub-secondary hover:text-hub-primary'
                }`}
              >
                Sync
              </button>
            </div>
          </div>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-6">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3 border border-purple-500/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-sm font-bold text-hub-primary">
                {meshAuditLogs.length === 0 ? 'Chưa có thao tác từ xa nào' : 'Không có sự kiện phù hợp'}
              </h3>
              <p className="text-xs text-hub-muted max-w-sm mt-1">
                Khi đồng đội trong mạng Mesh gửi lệnh Restart hoặc Hot-Sync tới máy của bạn, toàn bộ thông tin người gửi và thời gian sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-hub overflow-hidden bg-hub-card shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-hub bg-black/[0.02] dark:bg-white/[0.02] text-[11px] uppercase tracking-wider font-bold text-hub-muted">
                    <th className="py-3 px-4">Thời Gian</th>
                    <th className="py-3 px-4">Người Thực Hiện (Actor)</th>
                    <th className="py-3 px-4">Ứng Dụng Đích</th>
                    <th className="py-3 px-4">Lệnh</th>
                    <th className="py-3 px-4">Trạng Thái</th>
                    <th className="py-3 px-4">Chi Tiết / Lý Do</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hub text-xs">
                  {filteredLogs.map((log) => (
                    <tr 
                      key={log.id}
                      className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-hub-secondary font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-hub-muted" />
                          <span>{formatTime(log.timestamp)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold">
                            {log.actorUsername.slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-hub-primary">
                              {log.actorUsername}
                            </div>
                            <div className="text-[10px] text-hub-muted font-mono flex items-center gap-1">
                              <Laptop className="h-2.5 w-2.5" />
                              <span>{log.actorHostname}</span>
                              <span>•</span>
                              <span>{log.actorIp}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-hub-primary">
                          {log.targetProjectName}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {getActionBadge(log.action)}
                      </td>

                      <td className="py-3 px-4">
                        {getStatusBadge(log.status, log.reason)}
                      </td>

                      <td className="py-3 px-4 text-hub-muted text-[11px] max-w-xs truncate">
                        {log.reason ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {log.reason}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            Thực thi bình thường
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-hub bg-hub-card/80 text-xs text-hub-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Xác thực hai chiều & Lưu dấu vết kiểm toán bảo vệ an toàn cho máy phát triển</span>
          </div>
          <button
            onClick={() => setIsAuditModalOpen(false)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-black/[0.05] dark:bg-white/[0.06] text-hub-primary hover:bg-black/[0.1] transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
