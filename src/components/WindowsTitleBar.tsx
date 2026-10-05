import React, { useState } from 'react';
import { Layers, Minus, Square, X, Copy } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const WindowsTitleBar: React.FC = () => {
  const { isConnected, projects } = useAppStore();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleMinimize = () => {
    // In web app, scroll to top or trigger browser minimize notification
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClose = () => {
    if (confirm('Đóng ứng dụng WinDev Hub?')) {
      window.close();
    }
  };

  const runningCount = projects.filter(p => p.status === 'running').length;

  return (
    <header className="flex h-8 w-full select-none items-center justify-between border-b border-hub bg-hub-sidebar px-3 text-xs text-hub-muted font-sans z-50">
      {/* Left: App icon & Title */}
      <div className="flex items-center gap-2">
        <div className="flex h-4 w-4 items-center justify-center rounded-[3px] bg-[var(--hub-accent)] text-white shadow-2xs">
          <Layers className="h-2.5 w-2.5" />
        </div>
        <span className="font-semibold text-hub-primary tracking-tight text-[12px]">
          WinDev Hub
        </span>
        <span className="text-hub-muted text-[11px] hidden sm:inline">
          — Windows 11 Dev Lifecycle Orchestrator
        </span>
      </div>

      {/* Center: System Status Pill */}
      <div className="hidden md:flex items-center gap-2">
        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-[11px] text-hub-secondary font-medium">
          {runningCount > 0 ? `${runningCount} apps running` : 'Idle'}
        </span>
        <span className="text-hub-muted">•</span>
        <span className="text-[11px] text-hub-muted font-mono">
          Fluent 2 Mica
        </span>
      </div>

      {/* Right: Window Caption Controls (Minimize, Maximize, Close) */}
      <div className="flex items-center h-full -mr-3">
        <button
          onClick={handleMinimize}
          className="flex h-8 w-11 items-center justify-center text-hub-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-hub-primary transition-colors"
          title="Thu nhỏ"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleToggleFullscreen}
          className="flex h-8 w-11 items-center justify-center text-hub-muted hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-hub-primary transition-colors"
          title={isFullscreen ? 'Khôi phục kích thước' : 'Phóng to toàn màn hình'}
        >
          <Square className="h-3 w-3" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-12 items-center justify-center text-hub-muted hover:bg-[#C42B1C] hover:text-white transition-colors"
          title="Đóng cửa sổ"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
};
