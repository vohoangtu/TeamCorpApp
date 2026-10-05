import React from 'react';
import { 
  Layers, 
  Home, 
  Zap, 
  Box, 
  FolderGit2, 
  Settings, 
  Terminal, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { THEMES } from '../themes';

export type NavTab = 'dashboard' | 'sync-studio' | 'docker' | 'git' | 'settings';

interface NavigationRailProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
}) => {
  const { 
    projects, 
    systemStats, 
    isConnected, 
    isTerminalOpen, 
    setIsTerminalOpen,
    themeId,
    cycleTheme
  } = useAppStore();

  const currentThemeDef = THEMES[themeId] || THEMES['fluent-dark'];
  const runningCount = projects.filter((p) => p.status === 'running').length;
  const syncingCount = projects.filter((p) => p.status === 'syncing').length;

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: Home, badge: projects.length },
    { 
      id: 'sync-studio' as NavTab, 
      label: 'Deploy Pipelines', 
      icon: Zap, 
      badge: syncingCount > 0 ? `${syncingCount} deploying` : undefined,
      badgeColor: 'bg-[#0F6CBD] text-white'
    },
    { 
      id: 'docker' as NavTab, 
      label: 'Target Fleets (Docker & WSL)', 
      icon: Box, 
      badge: systemStats?.dockerAvailable ? 'Ready' : undefined,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    },
    { id: 'git' as NavTab, label: 'Git Workspaces', icon: FolderGit2 },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative z-20 flex flex-col border-r transition-all duration-150 select-none ${
        collapsed ? 'w-14' : 'w-64'
      } border-hub bg-hub-sidebar text-hub-primary`}
    >
      {/* Brand Header */}
      {collapsed ? (
        <div className="flex h-12 items-center justify-center border-b border-hub">
          <button
            onClick={onToggleCollapse}
            className="group relative flex h-8 w-8 items-center justify-center rounded-[6px] hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-colors"
            title="Mở rộng thanh điều hướng (256px)"
          >
            {/* Show App Logo normally, show ChevronRight on hover */}
            <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--hub-accent)] text-white shadow-xs group-hover:scale-95 transition-transform">
              <Layers className="h-4 w-4 group-hover:hidden" />
              <ChevronRight className="h-4 w-4 hidden group-hover:block stroke-[2.5]" />
            </div>
          </button>
        </div>
      ) : (
        <div className="flex h-12 items-center justify-between px-3 border-b border-hub">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--hub-accent)] text-white shadow-xs">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[13px] font-semibold tracking-tight text-hub-primary leading-tight">
                WinDev Hub
              </span>
              <span className="text-[11px] text-hub-muted leading-tight">
                Microsoft Dev Home
              </span>
            </div>
          </div>

          <button
            onClick={onToggleCollapse}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-hub-muted hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-hub-primary transition-colors"
            title="Thu gọn sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-0.5 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`group relative flex w-full items-center rounded-[4px] h-9 text-[14px] transition-all ${
                collapsed ? 'justify-center px-0' : 'gap-3 px-2.5'
              } ${
                isActive
                  ? 'bg-black/[0.05] dark:bg-white/[0.06] text-hub-primary font-semibold'
                  : 'text-hub-secondary hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-hub-primary font-normal'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {/* Fluent 2 Signature 3px Pill Active Indicator */}
              {isActive && (
                <span className="absolute left-0.5 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-[var(--hub-accent)] shadow-xs" />
              )}

              <Icon
                className={`h-4.5 w-4.5 shrink-0 ${
                  isActive
                    ? 'text-[var(--hub-accent)]'
                    : 'text-hub-muted group-hover:text-hub-primary'
                }`}
              />

              {!collapsed && (
                <span className="flex-1 text-left truncate leading-none">{item.label}</span>
              )}

              {!collapsed && item.badge !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${
                    item.badgeColor || 'bg-black/[0.06] text-hub-secondary dark:bg-white/[0.08]'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge !== undefined && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--hub-accent)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with Theme Quick Switch & Diagnostic Pill */}
      <div className="p-2 border-t border-hub space-y-1.5">
        {/* Theme Cycle Switch in Rail */}
        <button
          onClick={cycleTheme}
          className={`flex w-full items-center rounded-[4px] h-9 text-[14px] text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors ${
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
          }`}
          title={`Giao diện hiện tại: ${currentThemeDef.name} (Bấm để đổi theme)`}
        >
          <span className="text-base shrink-0 leading-none">{currentThemeDef.icon}</span>
          {!collapsed && (
            <span className="flex-1 text-left truncate font-medium">
              {currentThemeDef.name}
            </span>
          )}
        </button>

        {/* Console Drawer Toggle */}
        <button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          className={`flex w-full items-center rounded-[4px] h-9 text-[14px] transition-colors ${
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-2.5'
          } ${
            isTerminalOpen
              ? 'bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5]'
              : 'text-neutral-700 dark:text-neutral-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
          }`}
          title="Bật/Tắt Terminal"
        >
          <Terminal className="h-4 w-4 shrink-0 text-[#0F6CBD] dark:text-[#479EF5]" />
          {!collapsed && <span className="flex-1 text-left font-medium">Console Logs</span>}
        </button>

        {/* Live Pill */}
        <div
          className={`flex items-center rounded-[4px] h-8 text-[14px] bg-black/[0.02] dark:bg-white/[0.02] ${
            collapsed ? 'justify-center px-0' : 'gap-2 px-2.5'
          }`}
          title={collapsed ? `${runningCount} Running • ${isConnected ? 'Win 11 Live' : 'Offline'}` : undefined}
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isConnected ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isConnected ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
          </span>

          {!collapsed && (
            <div className="flex-1 truncate text-neutral-500">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                {runningCount} Running
              </span>
              {' • '}
              <span>{isConnected ? 'Win 11 Live' : 'Offline'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
