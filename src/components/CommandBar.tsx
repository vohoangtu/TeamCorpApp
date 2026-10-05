import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Zap, 
  Terminal, 
  Sun, 
  Moon, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  Check, 
  Palette,
  Sparkles,
  Shield,
  Layers,
  Globe,
  ArrowLeftRight,
  BarChart3,
  Minimize2,
  Rocket,
  MoreHorizontal,
  Boxes,
  Network
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { THEMES, THEME_LIST } from '../themes';
import { MATERIALS, MATERIAL_LIST, type MaterialType } from '../materials';

interface CommandBarProps {
  title: string;
  subtitle?: string;
  onSyncAll?: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({ title, subtitle, onSyncAll }) => {
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const { 
    searchQuery, 
    setSearchQuery, 
    setIsAddModalOpen, 
    setIsTerminalOpen, 
    isTerminalOpen,
    setIsPortRadarOpen,
    setIsWorkspacesOpen,
    setIsReverseProxyOpen,
    setIsEnvDiffOpen,
    setIsNewProjectOpen,
    setIsAnalyticsOpen,
    setIsDockerFleetOpen,
    setIsArchitectureGraphOpen,
    setIsMiniMode,
    setActiveCopilot,
    themeId,
    setThemeId,
    theme, 
    setTheme,
    materialType,
    setMaterialType,
    viewMode,
    setViewMode,
    projects
  } = useAppStore();

  const currentThemeDef = THEMES[themeId] || THEMES['fluent-dark'];
  const runningProjects = projects.filter(p => p.status === 'running');

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-hub bg-hub-sidebar/90 backdrop-blur-md px-6 select-none transition-colors">
      {/* Left: Breadcrumb & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] font-medium text-hub-muted hidden sm:inline">Dev Home</span>
        <span className="text-[13px] text-hub-muted/60 hidden sm:inline">/</span>
        <h1 className="text-[15px] font-semibold text-hub-primary tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <span className="hidden md:inline-block rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-hub-muted">
            {subtitle}
          </span>
        )}
      </div>

      {/* Right Toolbar: Search, View Mode, Theme Segmented Control, Actions */}
      <div className="flex items-center gap-2">
        {/* Search Box with iconic Fluent 2 bottom accent line */}
        <div className="relative w-40 sm:w-60">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hub-muted" />
          <input
            type="text"
            placeholder="Tìm kiếm... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 w-full rounded-[4px] border border-hub border-b-[2px] border-b-neutral-400 dark:border-b-neutral-500 bg-hub-card pl-8 pr-2.5 text-[14px] text-hub-primary placeholder:text-hub-muted focus:border-b-[var(--hub-accent)] focus:outline-none transition-all shadow-2xs"
          />
        </div>

        {/* View Mode Toggle: Grid vs Table */}
        <div className="hidden sm:flex items-center rounded-[4px] border border-hub bg-black/[0.02] dark:bg-white/[0.03] p-0.5 text-[13px]">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-[3px] px-2.5 h-7 text-[13px] font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                : 'text-hub-muted hover:text-hub-primary'
            }`}
            title="Dạng bảng dữ liệu tối ưu không gian hiển thị"
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Bảng</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 rounded-[3px] px-2.5 h-7 text-[13px] font-medium transition-all ${
              viewMode === 'grid'
                ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                : 'text-hub-muted hover:text-hub-primary'
            }`}
            title="Dạng lưới thẻ trực quan"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Thẻ</span>
          </button>
        </div>

        {/* Developer Theme Selector & Quick Light/Dark Toggle */}
        <div className="relative">
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex h-8 items-center gap-1.5 rounded-md border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.03] dark:bg-white/[0.04] px-2.5 text-[14px] font-medium text-neutral-800 dark:text-neutral-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
            title={`Giao diện: ${currentThemeDef?.name} • Chất liệu: ${MATERIALS[materialType]?.name}`}
          >
            <span className="text-sm">{currentThemeDef?.icon || '🎨'}</span>
            <span className="hidden sm:inline font-semibold">{currentThemeDef?.name || 'Theme'}</span>
            <span className="text-[11px] text-hub-muted hidden lg:inline">• {MATERIALS[materialType]?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
          </button>

          {/* Theme Dropdown Popover */}
          {isThemeMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setIsThemeMenuOpen(false)} 
              />
              <div className="absolute right-0 top-10 z-40 w-72 rounded-lg border border-black/[0.1] dark:border-white/[0.12] bg-white/95 dark:bg-[#202020]/95 backdrop-blur-xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-100 select-none">
                <div className="px-2 py-1.5 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-[#0F6CBD] dark:text-[#479EF5]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Giao diện (Themes)</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">Ctrl+Shift+T</span>
                </div>

                {/* Developer Themes Group */}
                <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
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
                            ? 'bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5] font-semibold'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Color Palette Dots */}
                          <div className="flex items-center -space-x-1">
                            <span 
                              className="h-3 w-3 rounded-full border border-black/20" 
                              style={{ backgroundColor: t.colors.bg }} 
                              title="Background"
                            />
                            <span 
                              className="h-3 w-3 rounded-full border border-black/20" 
                              style={{ backgroundColor: t.colors.card }} 
                              title="Card"
                            />
                            <span 
                              className="h-3 w-3 rounded-full border border-black/20" 
                              style={{ backgroundColor: t.colors.accent }} 
                              title="Accent"
                            />
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#0F6CBD] dark:text-[#479EF5]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Fluent Themes Group */}
                <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-t border-black/[0.06] dark:border-white/[0.06] pt-2">
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
                            ? 'bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5] font-semibold'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span>{t.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center -space-x-1">
                            <span 
                              className="h-3 w-3 rounded-full border border-black/20" 
                              style={{ backgroundColor: t.colors.bg }} 
                            />
                            <span 
                              className="h-3 w-3 rounded-full border border-black/20" 
                              style={{ backgroundColor: t.colors.card }} 
                            />
                            <span 
                              className="h-3 w-3 rounded-full border border-black/20" 
                              style={{ backgroundColor: t.colors.accent }} 
                            />
                          </div>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#0F6CBD] dark:text-[#479EF5]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Fluent 2 Materials Group */}
                <div className="px-2 py-1 text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-t border-black/[0.06] dark:border-white/[0.06] pt-2 flex items-center justify-between">
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
                        onClick={() => {
                          setMaterialType(m.id);
                        }}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-all ${
                          isSelected
                            ? 'bg-[var(--hub-accent)] text-white font-semibold shadow-2xs'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
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

        {/* Port Conflict Radar Button */}
        <button
          onClick={() => setIsPortRadarOpen(true)}
          className="fluent-btn-standard flex h-8 items-center gap-1.5 px-2.5 text-[13px] font-medium"
          title="Port Conflict Radar (Quét & Giải phóng port xung đột - Ctrl+Shift+P)"
        >
          <Shield className="h-3.5 w-3.5 text-amber-500" />
          <span className="hidden xl:inline">Port Radar</span>
        </button>

        {/* Dev Workspaces Button */}
        <button
          onClick={() => setIsWorkspacesOpen(true)}
          className="fluent-btn-standard flex h-8 items-center gap-1.5 px-2.5 text-[13px] font-medium"
          title="Dev Workspaces (Khởi động theo nhóm dự án - Ctrl+Shift+W)"
        >
          <Layers className="h-3.5 w-3.5 text-[#0F6CBD] dark:text-[#479EF5]" />
          <span className="hidden xl:inline">Workspaces</span>
        </button>

        {/* Developer Studio Tools Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
            className="fluent-btn-standard flex h-8 items-center gap-1.5 px-2.5 text-[13px] font-medium"
            title="Kho công cụ mở rộng (Proxy, .env Diff, Analytics, AI Copilot, Scaffolding)"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-500" />
            <span className="hidden lg:inline">Tools</span>
            <ChevronDown className="h-3 w-3 text-hub-muted" />
          </button>

          {isToolsMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsToolsMenuOpen(false)} 
              />
              <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-lg border border-hub bg-hub-card p-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 divide-y divide-hub">
                <div className="space-y-0.5 pb-1.5">
                  <div className="px-2.5 py-1 text-[11px] font-bold text-hub-muted uppercase tracking-wider">
                    Hệ sinh thái WinDev Tools
                  </div>
                  <button
                    onClick={() => {
                      setIsNewProjectOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-amber-500">
                      <Rocket className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Scaffold New App</div>
                      <div className="text-[11px] text-hub-muted">Tạo mới React, Express, Fastify</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsReverseProxyOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-teal-500/10 text-teal-600 dark:text-teal-400">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Local Reverse Proxy</div>
                      <div className="text-[11px] text-hub-muted">Ánh xạ tên miền ảo .local</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsEnvDiffOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <ArrowLeftRight className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">.env Diff & Secret Sync</div>
                      <div className="text-[11px] text-hub-muted">So sánh & đồng bộ biến microservices</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setActiveCopilot({ isOpen: true, projectName: 'Hệ thống' });
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">AI Terminal Copilot</div>
                      <div className="text-[11px] text-hub-muted">Giải thích & sửa lỗi 1-Click</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsAnalyticsOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/10 text-blue-500">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Workload Analytics</div>
                      <div className="text-[11px] text-hub-muted">Thống kê thời lượng & hiệu năng</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsDockerFleetOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-600/10 text-blue-600 dark:text-blue-400">
                      <Boxes className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Docker & WSL2 Fleet</div>
                      <div className="text-[11px] text-hub-muted">Quản lý container & .wslconfig RAM</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsArchitectureGraphOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-xs text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <Network className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold">Architecture Topology</div>
                      <div className="text-[11px] text-hub-muted">Sơ đồ vi dịch vụ & kết nối DB/API</div>
                    </div>
                  </button>
                </div>

                <div className="pt-1.5">
                  <button
                    onClick={() => {
                      setIsMiniMode(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs text-hub-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-left transition-colors"
                  >
                    <Minimize2 className="h-4 w-4 text-neutral-400" />
                    <span>Thu nhỏ xuống Mini Tray Widget</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Trigger Sync All Button */}
        {onSyncAll && (
          <button
            onClick={onSyncAll}
            disabled={runningProjects.length === 0}
            className={`flex h-8 items-center gap-1.5 rounded-[4px] px-2.5 text-[13px] font-semibold transition-all shadow-xs ${
              runningProjects.length > 0
                ? 'fluent-btn-primary'
                : 'fluent-btn-standard opacity-60'
            }`}
            title="Kích hoạt Trigger Sync cho các ứng dụng đang chạy"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
            <span className="hidden md:inline">Trigger Sync All {runningProjects.length > 0 ? `(${runningProjects.length})` : ''}</span>
          </button>
        )}

        {/* Terminal Toggle Button */}
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          className={`flex h-8 items-center gap-1.5 rounded-[4px] border px-2.5 text-[13px] font-medium transition-all ${
            isTerminalOpen
              ? 'border-[var(--hub-accent)] bg-[var(--hub-accent)]/10 text-[var(--hub-accent)]'
              : 'border-hub bg-hub-card text-hub-secondary hover:bg-hub-card-hover'
          }`}
          title="Bật/Tắt Terminal Console"
        >
          <Terminal className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Console</span>
        </button>

        {/* Primary Action Button: + Add App */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="fluent-btn-standard flex h-8 items-center gap-1.5 px-3 text-[13px] font-semibold shrink-0"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add App</span>
        </button>
      </div>
    </header>
  );
};
