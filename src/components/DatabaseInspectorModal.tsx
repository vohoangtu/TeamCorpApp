import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, X, Zap, CheckCircle2, AlertTriangle, Trash2, Server } from 'lucide-react';
import type { DatabaseTarget } from '../types';
import { sendFluentToast } from '../utils/notifications';

interface DatabaseInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string;
}

export const DatabaseInspectorModal: React.FC<DatabaseInspectorModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
}) => {
  const [databases, setDatabases] = useState<DatabaseTarget[]>([]);
  const [loading, setLoading] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchDatabases = async () => {
    if (!projectId) return;
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/db`);
      if (res.ok) {
        const data = await res.json();
        setDatabases(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      fetchDatabases();
    }
  }, [isOpen, projectId]);

  const handleFlushRedis = async (db: DatabaseTarget) => {
    setFlushing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/db?flush=redis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host: db.host, port: db.port }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage(data.message);
        sendFluentToast('Redis Cache Flushed', data.message, 'success');
      } else {
        setActionMessage(data.message || 'Lỗi khi xóa Redis');
        sendFluentToast('Lỗi Redis', data.message, 'error');
      }
    } catch (e: any) {
      setActionMessage(`Lỗi: ${e.message}`);
    } finally {
      setFlushing(false);
    }
  };

  if (!isOpen) return null;

  const onlineCount = databases.filter((db) => db.status === 'connected').length;
  const avgLatency = databases.filter((db) => db.latencyMs !== undefined).length > 0
    ? Math.round(
        databases.filter((db) => db.latencyMs !== undefined).reduce((acc, curr) => acc + (curr.latencyMs || 0), 0) /
        databases.filter((db) => db.latencyMs !== undefined).length
      )
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400 ring-1 ring-indigo-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  Database Quick Inspector & Cache Flusher
                </h3>
                <span className="rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 text-[11px] font-semibold">
                  Storage Health
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Giám sát trạng thái kết nối PostgreSQL, Redis, MySQL, SQLite, MongoDB
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {actionMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-hub-muted">Cơ Sở Dữ Liệu Đã Ghép</span>
                <div className="text-2xl font-bold font-mono text-hub-primary mt-0.5">
                  {databases.length} Databases
                </div>
              </div>
              <div className="h-9 w-9 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Database className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-hub-muted">Trạng Thái Kết Nối</span>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {onlineCount} / {databases.length} Online
                </div>
              </div>
              <div className="h-9 w-9 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-4.5 w-4.5" />
              </div>
            </div>

            <div className="rounded-xl border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-hub-muted">Độ Trễ Ping Trung Bình</span>
                <div className="text-2xl font-bold font-mono text-blue-500 mt-0.5">
                  {avgLatency > 0 ? `${avgLatency} ms` : '—'}
                </div>
              </div>
              <div className="h-9 w-9 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Server className="h-4.5 w-4.5" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-hub-muted">
              <RefreshCw className="h-7 w-7 animate-spin mx-auto mb-3 text-hub-accent" />
              <p className="text-sm font-semibold text-hub-primary">Đang kiểm tra kết nối tới các cơ sở dữ liệu...</p>
              <p className="text-xs text-hub-muted mt-1">Đang ping cổng mạng TCP và chứng thực quyền truy cập</p>
            </div>
          ) : databases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hub p-12 text-center bg-black/[0.01] dark:bg-white/[0.01]">
              <Server className="h-10 w-10 mx-auto text-hub-muted mb-3 opacity-50" />
              <p className="text-sm font-bold text-hub-primary">Không tìm thấy cấu hình cơ sở dữ liệu nào</p>
              <p className="text-xs text-hub-muted mt-1 max-w-md mx-auto">
                Khai báo chuỗi kết nối <code>DATABASE_URL</code>, <code>REDIS_URL</code>, hoặc <code>POSTGRES_PORT</code> trong file .env để WinDev Hub tự động giám sát.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {databases.map((db) => {
                const isConnected = db.status === 'connected';
                return (
                  <div
                    key={db.id}
                    className="p-4 rounded-xl border border-hub bg-black/[0.01] dark:bg-white/[0.02] space-y-3 hover:border-hub-accent transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <div>
                          <span className="text-sm font-bold text-hub-primary">{db.name}</span>
                          <span className="ml-2 font-mono text-xs text-hub-muted">
                            {db.host}:{db.port}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {db.latencyMs !== undefined && (
                          <span className="font-mono text-xs text-hub-muted bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded">
                            {db.latencyMs} ms
                          </span>
                        )}
                        <span
                          className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isConnected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>

                    <div className="font-mono text-xs text-hub-muted bg-black/[0.03] dark:bg-white/[0.04] p-2.5 rounded-lg truncate border border-hub-subtle" title={db.urlMasked}>
                      {db.urlMasked}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-hub-secondary">{db.details}</span>

                      {db.type === 'redis' && (
                        <button
                          onClick={() => handleFlushRedis(db)}
                          disabled={flushing || !isConnected}
                          className="fluent-btn-standard h-7 px-3 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 font-semibold"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>{flushing ? 'Đang xóa...' : 'Flush Redis Cache'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <button
            onClick={fetchDatabases}
            disabled={loading}
            className="fluent-btn-standard h-8 px-3 text-xs flex items-center gap-1.5 font-semibold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Ping Lại Cơ Sở Dữ Liệu</span>
          </button>

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
