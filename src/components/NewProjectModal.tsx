import React, { useState } from 'react';
import { Rocket, X, Check, Code2, Server, Cpu, Sparkles, FolderPlus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sendFluentToast } from '../utils/notifications';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { fetchProjects } = useAppStore();
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<'vite-react-ts' | 'express-ts' | 'fastify-ts'>('vite-react-ts');
  const [port, setPort] = useState<number>(3000);
  const [useTailwind, setUseTailwind] = useState(true);
  const [loading, setLoading] = useState(false);

  const TEMPLATES = [
    {
      id: 'vite-react-ts',
      name: 'React 19 + Vite + TypeScript',
      desc: 'Frontend SPA hiện đại, khởi động trong 100ms, hỗ trợ Hot-Reload',
      icon: '⚛️',
      defaultPort: 5174,
    },
    {
      id: 'express-ts',
      name: 'Express.js REST API',
      desc: 'Backend Node.js API gọn nhẹ, tích hợp CORS và Dotenv',
      icon: '🚀',
      defaultPort: 8080,
    },
    {
      id: 'fastify-ts',
      name: 'Fastify High-Speed API',
      desc: 'Backend microservices tốc độ cao với schema JSON validation',
      icon: '⚡',
      defaultPort: 4000,
    },
  ];

  const handleSelectTemplate = (tId: 'vite-react-ts' | 'express-ts' | 'fastify-ts', defPort: number) => {
    setTemplate(tId);
    setPort(defPort);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);

    try {
      const res = await fetch('/api/projects/scaffold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          template,
          port: Number(port),
          useTailwind,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sendFluentToast('Khởi tạo thành công', data.message, 'success');
        await fetchProjects();
        onClose();
        setName('');
      } else {
        sendFluentToast('Lỗi khởi tạo', data.message || 'Không thể tạo dự án', 'error');
      }
    } catch (e: any) {
      sendFluentToast('Lỗi kết nối', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] ring-1 ring-[var(--hub-accent)]/20">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  New Project Scaffolding Wizard
                </h3>
                <span className="rounded-full bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] px-2 py-0.5 text-[11px] font-semibold">
                  1-Click Generator
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Khởi tạo dự án chuẩn hóa với TypeScript, cấu hình tự động và đăng ký trực tiếp vào WinDev Hub
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

        {/* Content Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Project Details & Configuration (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-hub-secondary mb-3">
                  Thông Tin Dự Án (Project Info)
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-hub-secondary mb-1">
                      Tên Dự Án (Project Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="VD: payment-service hoặc analytics-web"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-9 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary font-medium focus:border-[var(--hub-accent)] focus:outline-none"
                    />
                    {name.trim() && (
                      <p className="text-[11px] text-hub-muted mt-1 font-mono">
                        Slug: {name.trim().toLowerCase().replace(/\s+/g, '-')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-hub-secondary mb-1">
                      Cổng Mạng Khởi Chạy (Dev Port)
                    </label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      className="h-9 w-full rounded-md border border-hub bg-hub-card px-3 text-xs text-hub-primary font-mono focus:border-[var(--hub-accent)] focus:outline-none"
                    />
                    <p className="text-[11px] text-hub-muted mt-1">
                      Mặc định tự động điều chỉnh theo Framework được chọn
                    </p>
                  </div>
                </div>
              </div>

              {/* Template Options Box */}
              <div className="rounded-lg border border-hub p-4 bg-black/[0.01] dark:bg-white/[0.02] space-y-3">
                <h5 className="text-xs font-bold text-hub-primary">Tùy Chọn Tích Hợp (Add-ons)</h5>
                
                {template === 'vite-react-ts' && (
                  <label className="flex items-start gap-2.5 text-xs text-hub-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useTailwind}
                      onChange={(e) => setUseTailwind(e.target.checked)}
                      className="rounded text-[var(--hub-accent)] mt-0.5"
                    />
                    <div>
                      <span className="font-semibold block">Tích Hợp Tailwind CSS v4</span>
                      <span className="text-[11px] text-hub-muted block">Cài đặt sẵn tiện ích thiết kế và typography hiện đại</span>
                    </div>
                  </label>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-hub text-[11px] text-hub-muted">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>Tự động tạo package.json, tsconfig.json & script dev</span>
                </div>
              </div>
            </div>

            {/* Right Column: Template Gallery (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-hub-secondary">
                Chọn Mẫu Ứng Dụng (Framework Templates)
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {TEMPLATES.map((t) => {
                  const isSelected = template === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id as any, t.defaultPort)}
                      className={`flex items-start text-left gap-4 p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/[0.05] shadow-xs ring-1 ring-[var(--hub-accent)]/30'
                          : 'border-hub bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-2xl shadow-xs">
                        {t.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-hub-primary flex items-center justify-between">
                          <span className="text-sm">{t.name}</span>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--hub-accent)] bg-[var(--hub-accent)]/10 px-2 py-0.5 rounded-full">
                              <Check className="h-3 w-3" /> Đã chọn
                            </span>
                          ) : (
                            <span className="text-[11px] font-mono text-hub-muted">Port {t.defaultPort}</span>
                          )}
                        </div>
                        <p className="text-xs text-hub-muted mt-1 leading-relaxed">{t.desc}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="rounded bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-medium text-hub-secondary">
                            TypeScript
                          </span>
                          <span className="rounded bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-medium text-hub-secondary">
                            ESM Ready
                          </span>
                          <span className="rounded bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-mono font-medium text-hub-secondary">
                            Hot Reload
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <button
            onClick={onClose}
            className="fluent-btn-standard h-8 px-4 text-xs font-semibold"
          >
            Hủy Bỏ
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="fluent-btn-primary h-8 px-5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <FolderPlus className="h-4 w-4" />
            <span>{loading ? 'Đang khởi tạo template...' : 'Tạo & Khởi Chạy Dự Án'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
