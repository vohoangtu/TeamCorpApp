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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-[var(--hub-accent)]/10 text-[var(--hub-accent)]">
              <Rocket className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                New Project Scaffolding Wizard
              </h3>
              <p className="text-[12px] text-hub-muted">
                Khởi tạo dự án chuẩn hóa và tự động đăng ký vào WinDev Hub 1-Click
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
          {/* Step 1: Project Name & Port */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-hub-secondary mb-1">
                Tên Dự Án (Project Name)
              </label>
              <input
                type="text"
                placeholder="VD: payment-service hoặc analytics-web"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 w-full rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary focus:border-[var(--hub-accent)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-hub-secondary mb-1">
                Cổng mạng (Port)
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="h-8 w-full rounded border border-hub bg-hub-card px-2.5 text-xs text-hub-primary font-mono focus:border-[var(--hub-accent)] focus:outline-none"
              />
            </div>
          </div>

          {/* Step 2: Choose Template */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-hub-secondary">
              Chọn Mẫu Ứng Dụng (Framework Template)
            </label>
            <div className="grid grid-cols-1 gap-2">
              {TEMPLATES.map((t) => {
                const isSelected = template === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t.id as any, t.defaultPort)}
                    className={`flex items-start text-left gap-3 p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/[0.04] shadow-2xs'
                        : 'border-hub bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="text-xl mt-0.5">{t.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-hub-primary flex items-center justify-between">
                        <span>{t.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-[var(--hub-accent)]" />}
                      </div>
                      <p className="text-[11px] text-hub-muted mt-0.5">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Options */}
          {template === 'vite-react-ts' && (
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 text-xs text-hub-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={useTailwind}
                  onChange={(e) => setUseTailwind(e.target.checked)}
                  className="rounded text-[var(--hub-accent)]"
                />
                <span className="font-semibold">Bật Tailwind CSS v4</span>
                <span className="text-[11px] text-hub-muted">(Cấu hình sẵn class tiện ích)</span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <button
            onClick={onClose}
            className="fluent-btn-standard h-8 px-4 text-xs font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="fluent-btn-primary h-8 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <FolderPlus className="h-4 w-4" />
            <span>{loading ? 'Đang khởi tạo...' : 'Tạo & Khởi Chạy Ngay'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
