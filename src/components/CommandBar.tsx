import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Zap, 
  Terminal, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Check, 
  Palette,
  Sparkles,
  Minimize2
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { THEMES, THEME_LIST } from '../themes';
import { MATERIALS, MATERIAL_LIST } from '../materials';

interface CommandBarProps {
  title: string;
  subtitle?: string;
  onSyncAll?: () => void;
  showViewModeToggle?: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({ 
  title, 
  subtitle, 
  onSyncAll,
  showViewModeToggle = true 
}) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const { 
    searchQuery, 
    setSearchQuery, 
    setIsAddModalOpen, 
    setIsTerminalOpen, 
    isTerminalOpen,
    setIsMiniMode,
    themeId,
    setThemeId,
    materialType,
    setMaterialType,
    viewMode,
    setViewMode,
    projects
  } = useAppStore();

  const currentThemeDef = THEMES[themeId] || THEMES['fluent-dark'];
  const runningProjects = projects.filter((p) => p.status === 'running');

  return (
    <header className="sticky top-0 z-10 flex h-13 items-center justify-between border-b border-hub bg-hub-sidebar/95 backdrop-blur-md px-6 select-none transition-colors">
      {/* Left: Breadcrumb, Title & Live Status Indicator */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="font-medium text-hub-muted hidden sm:inline">Dev Home</span>
          <span className="text-hub-muted/40 hidden sm:inline">/</span>
          <h1 className="text-[15px] font-semibold text-hub-primary tracking-tight truncate">
            {title}
          </h1>
        </div>

        {/* Real-time Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 pl-2 border-l border-hub text-[11px]">
          {runningProjects.length > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>{runningProjects.length} Online</span>
            </span>
          ) : (
            <span className="text-hub-muted font-medium">
              Standby
            </span>
          )}
          <span className="text-hub-muted/60">•</span>
          <span className="text-hub-muted font-mono">{projects.length} Apps</span>
        </div>
      </div>

      {/* Center: Global Search Input */}
      <div className="relative w-48 sm:w-72 md:w-80 lg:w-96 mx-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hub-muted" />
        <input
          type="text"
          placeholder="Tìm kiếm ứng dụng, cổng mạng, git... (Ctrl+K)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8.5 w-full rounded-md border border-hub border-b-[2px] border-b-neutral-400 dark:border-b-neutral-500 bg-hub-card pl-8 pr-8 text-[13px] text-hub-primary placeholder:text-hub-muted focus:border-b-[var(--hub-accent)] focus:outline-none transition-all shadow-2xs"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-hub-muted hover:text-hub-primary text-xs"
          >
            ✕
          </button>
        ) : (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-hub-muted/70 font-mono border border-hub rounded px-1 hidden sm:inline">
            Ctrl+K
          </span>
        )}
      </div>

      {/* Right Toolbar: Actions, View Mode, Theme & Primary Add App */}
      <div className="flex items-center gap-2 shrink-0">
        {/* View Mode Toggle: Grid vs Table (when supported on dashboard) */}
        {showViewModeToggle && (
          <div className="hidden sm:flex items-center rounded-md border border-hub bg-black/[0.02] dark:bg-white/[0.03] p-0.5 text-[12px]">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 h-7 font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                  : 'text-hub-muted hover:text-hub-primary'
              }`}
              title="Dạng bảng dữ liệu tối ưu không gian hiển thị"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Bảng</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded-[4px] px-2.5 h-7 font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                  : 'text-hub-muted hover:text-hub-primary'
              }`}
              title="Dạng lưới thẻ trực quan"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">Thẻ</span>
            </button>
          </div>
        )}

        {/* Trigger Sync All Button */}
        {onSyncAll && runningProjects.length > 0 && (
          <button
            onClick={onSyncAll}
            className="fluent-btn-standard flex h-8 items-center gap-1.5 px-2.5 text-[12.5px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all shadow-xs"
            title="Kích hoạt Hot-Sync đồng bộ mã nguồn cho các ứng dụng đang chạy"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span className="hidden lg:inline">Sync All ({runningProjects.length})</span>
          </button>
        )}

        {/* Primary Action Button: + Thêm ứng dụng */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fluent-btn-primary flex h-8.5 items-center gap-1.5 px-3 text-[13px] font-semibold shadow-xs"
          title="Thêm hoặc liên kết ứng dụng mới"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Thêm ứng dụng</span>
        </button>

        {/* Developer Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex h-8.5 items-center gap-1.5 rounded-md border border-hub bg-hub-card px-2.5 text-[13px] font-medium text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all shadow-2xs"
            title={`Giao diện: ${currentThemeDef?.name} • Chất liệu: ${MATERIALS[materialType]?.name}`}
          >
            <span className="text-sm">{currentThemeDef?.icon || '🎨'}</span>
            <span className="hidden xl:inline font-semibold text-xs">{currentThemeDef?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-hub-muted" />
          </button>

          {/* Theme Dropdown Popover */}
          {isThemeMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsThemeMenuOpen(false)} 
              />
              <div className="absolute right-0 top-11 z-40 w-72 rounded-xl border border-hub bg-hub-card/95 backdrop-blur-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none">
                <div className="px-2 py-1.5 flex items-center justify-between border-b border-hub mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-[var(--hub-accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-hub-muted">Giao diện (Themes)</span>
                  </div>
                  <span className="text-[10px] text-hub-muted font-mono">Ctrl+Shift+T</span>
                </div>

                {/* Developer Themes Group */}
                <div className="px-2 py-1 text-[10px] font-bold text-hub-muted uppercase tracking-wider">
                  Developer Themes
                </div>
                <div className="space-y-0.5 mb-2">
                  {THEME_LIST.filter(t => t.category === 'developer').map((t) => {
                    const isSelected = themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setThemeId(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-semibold'
                            : 'text-hub-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center -space-x-1">
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: t.colors.bg }} />
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: t.colors.card }} />
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: t.colors.accent }} />
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[var(--hub-accent)]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Fluent Themes Group */}
                <div className="px-2 py-1 text-[10px] font-bold text-hub-muted uppercase tracking-wider border-t border-hub pt-2">
                  Microsoft Fluent 2
                </div>
                <div className="space-y-0.5 mb-2">
                  {THEME_LIST.filter(t => t.category === 'fluent').map((t) => {
                    const isSelected = themeId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setThemeId(t.id);
                          setIsThemeMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-semibold'
                            : 'text-hub-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center -space-x-1">
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: t.colors.bg }} />
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: t.colors.card }} />
                            <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: t.colors.accent }} />
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[var(--hub-accent)]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Fluent 2 Materials Group */}
                <div className="px-2 py-1 text-[10px] font-bold text-hub-muted uppercase tracking-wider border-t border-hub pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-hub-accent" />
                    <span>Chất liệu Fluent 2</span>
                  </div>
                  <span className="text-[10px] text-hub-accent font-semibold">{MATERIALS[materialType]?.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-1 p-1 mt-0.5">
                  {MATERIAL_LIST.map((m) => {
                    const isSelected = materialType === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setMaterialType(m.id)}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-[var(--hub-accent)] text-white font-semibold shadow-2xs'
                            : 'text-hub-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        }`}
                        title={m.description}
                      >
                        <span className="text-xs shrink-0">{m.icon}</span>
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mini Mode Toggle */}
        <button
          onClick={() => setIsMiniMode(true)}
          className="fluent-btn-standard flex h-8.5 w-8.5 items-center justify-center p-0 rounded-md text-hub-secondary hover:text-hub-primary"
          title="Thu nhỏ xuống Mini Tray Widget (Ctrl+Shift+M)"
        >
          <Minimize2 className="h-4 w-4" />
        </button>

        {/* Quick Console Logs Drawer Toggle */}
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          className={`flex h-8.5 items-center gap-1.5 rounded-md border px-2.5 text-[12.5px] font-medium transition-all ${
            isTerminalOpen
              ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/10 text-[var(--hub-accent)] font-semibold'
              : 'border-hub bg-hub-card text-hub-secondary hover:bg-hub-card-hover'
          }`}
          title="Bật/Tắt Terminal Console phía dưới"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Console</span>
        </button>
      </div>
    </header>
  );
};
