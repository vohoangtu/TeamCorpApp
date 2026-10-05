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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Database className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                Database Quick Inspector & Cache Flusher
              </h3>
              <p className="text-[12px] text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Giám sát PostgreSQL, Redis, MySQL, SQLite
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
          {actionMessage && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-hub-accent" />
              Đang kiểm tra kết nối tới các cơ sở dữ liệu nội bộ...
            </div>
          ) : databases.length === 0 ? (
            <div className="rounded-md border border-dashed border-hub p-8 text-center">
              <Server className="h-8 w-8 mx-auto text-hub-muted mb-2 opacity-50" />
              <p className="text-xs font-semibold text-hub-primary">Không tìm thấy cơ sở dữ liệu nào</p>
              <p className="text-[11px] text-hub-muted mt-1">
                Thêm chuỗi kết nối (DATABASE_URL, REDIS_URL) vào file .env để WinDev Hub tự động giám sát.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {databases.map((db) => {
                const isConnected = db.status === 'connected';
                return (
                  <div
                    key={db.id}
                    className="p-3.5 rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02] space-y-2 hover:border-hub-accent transition-all"
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
                          className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            isConnected
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isConnected ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </div>
                    </div>

                    <div className="font-mono text-xs text-hub-muted bg-black/[0.03] dark:bg-white/[0.04] px-2.5 py-1.5 rounded truncate" title={db.urlMasked}>
                      {db.urlMasked}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-hub-secondary">{db.details}</span>

                      {db.type === 'redis' && (
                        <button
                          onClick={() => handleFlushRedis(db)}
                          disabled={flushing || !isConnected}
                          className="fluent-btn-standard h-7 px-3 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5"
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
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <button
            onClick={fetchDatabases}
            disabled={loading}
            className="fluent-btn-standard h-8 px-3 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Ping lại</span>
          </button>

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
