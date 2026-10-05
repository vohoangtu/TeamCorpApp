import React from 'react';
import { 
  Plus, 
  Search, 
  Terminal, 
  Layers, 
  RefreshCw,
  Sun,
  Moon,
  Activity
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const Header: React.FC = () => {
  const { 
    projects, 
    systemStats, 
    isConnected, 
    searchQuery, 
    setSearchQuery, 
    setIsAddModalOpen,
    setIsTerminalOpen,
    isTerminalOpen,
    theme,
    toggleTheme
  } = useAppStore();

  const runningCount = projects.filter(p => p.status === 'running').length;
  const syncingCount = projects.filter(p => p.status === 'syncing').length;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/80 dark:border-slate-800/80 dark:bg-slate-950/80 backdrop-blur-xl px-6 py-4 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Windows 11 Title */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/20 text-white font-black text-xl">
            <Layers className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                WinDev <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">Hub</span>
              </h1>
              <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400 border border-sky-500/20">
                Win 11 Native 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Local Multi-App Lifecycle & Live Hot-Sync</p>
          </div>
        </div>

        {/* Global Live Indicators */}
        <div className="hidden lg:flex items-center gap-4 rounded-xl border border-slate-200/80 bg-slate-100/60 dark:border-slate-800/60 dark:bg-slate-900/60 px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              {runningCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${runningCount > 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
            </span>
            <span className="text-slate-500 dark:text-slate-400">Running Apps:</span>
            <span className="font-semibold text-slate-800 dark:text-white">{runningCount}/{projects.length}</span>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />

          {/* Docker Status */}
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${systemStats?.dockerAvailable ? 'bg-sky-500 dark:bg-sky-400' : 'bg-amber-500 dark:bg-amber-400/80'}`} />
            <span className="text-slate-500 dark:text-slate-400">Docker:</span>
            <span className={`font-semibold ${systemStats?.dockerAvailable ? 'text-sky-600 dark:text-sky-300' : 'text-amber-600 dark:text-amber-400'}`}>
              {systemStats?.dockerAvailable ? 'Ready' : 'CLI Standby'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />

          {/* Sync status */}
          <div className="flex items-center gap-1.5">
            <RefreshCw className={`h-3 w-3 text-sky-500 dark:text-sky-400 ${syncingCount > 0 ? 'animate-spin' : ''}`} />
            <span className="text-slate-500 dark:text-slate-400">Sync:</span>
            <span className="font-semibold text-sky-600 dark:text-sky-300">
              {syncingCount > 0 ? `${syncingCount} Syncing...` : 'Instant Ready'}
            </span>
          </div>

          {/* Managed App Resources Footprint */}
          {runningCount > 0 && (
            <>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-800" />
              <div className="flex items-center gap-1.5 font-mono text-[11px]" title="Tổng tải tài nguyên của tất cả dev server đang chạy">
                <Activity className="h-3 w-3 text-sky-500" />
                <span className="text-slate-500 dark:text-slate-400">App Load:</span>
                <span className="font-semibold text-sky-600 dark:text-sky-300">
                  {Math.round(projects.reduce((acc, p) => acc + (p.memoryMb || 0), 0))} MB
                </span>
                <span className="text-slate-400">|</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {Math.round(projects.reduce((acc, p) => acc + (p.cpuPercent || 0), 0) * 10) / 10}% CPU
                </span>
              </div>
            </>
          )}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-56 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search apps, port, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-100/90 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900/90 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-900 transition-all"
            />
          </div>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-amber-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-all shadow-sm"
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Theme)' : 'Chuyển sang Giao diện Tối (Dark Theme)'}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform rotate-0 scale-100" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 transition-transform rotate-0 scale-100" />
            )}
          </button>

          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              isTerminalOpen 
                ? 'border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-300' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Terminal className="h-4 w-4 text-sky-500 dark:text-sky-400" />
            <span className="hidden sm:inline">Console</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add App</span>
          </button>
        </div>
      </div>
    </header>
  );
};
