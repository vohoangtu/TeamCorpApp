import React, { useEffect, useState, useRef } from 'react';
import { NavigationRail, NavTab } from './components/NavigationRail';
import { FluentStatCards } from './components/FluentStatCards';
import { ProjectCard } from './components/ProjectCard';
import { ProjectTableView } from './components/ProjectTableView';
import { TerminalLogs } from './components/TerminalLogs';
import { AddProjectModal } from './components/AddProjectModal';
import { PortRadarModal } from './components/PortRadarModal';
import { EnvStudioModal } from './components/EnvStudioModal';
import { WorkspacesModal } from './components/WorkspacesModal';
import { DiskCleanerModal } from './components/DiskCleanerModal';
import { ScriptRunnerDrawer } from './components/ScriptRunnerDrawer';
import { DatabaseInspectorModal } from './components/DatabaseInspectorModal';
import { ReverseProxyModal } from './components/ReverseProxyModal';
import { AICopilotModal } from './components/AICopilotModal';
import { TrayMiniWidget } from './components/TrayMiniWidget';
import { EnvDiffModal } from './components/EnvDiffModal';
import { NewProjectModal } from './components/NewProjectModal';
import { WorkloadAnalyticsModal } from './components/WorkloadAnalyticsModal';
import { DockerFleetModal } from './components/DockerFleetModal';
import { ArchitectureGraphModal } from './components/ArchitectureGraphModal';
import { DependencyDoctorModal } from './components/DependencyDoctorModal';
import { AppResourceInspectorModal } from './components/AppResourceInspectorModal';
import { UnifiedLogAggregatorModal } from './components/UnifiedLogAggregatorModal';
import { GitMatrixModal } from './components/GitMatrixModal';
import { WindowsPerformanceModal } from './components/WindowsPerformanceModal';
import { SyncStudioView } from './components/SyncStudioView';
import { DockerView } from './components/DockerView';
import { GitWorkspacesView } from './components/GitWorkspacesView';
import { UnifiedLogsView } from './components/UnifiedLogsView';
import { WindowsPerformanceView } from './components/WindowsPerformanceView';
import { SettingsView } from './components/SettingsView';
import { useAppStore } from './store/useAppStore';
import { Plus, FolderGit2, Zap, Search, List, LayoutGrid } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    projects, 
    searchQuery, 
    setSearchQuery,
    fetchProjects, 
    connectWebSocket, 
    setIsAddModalOpen,
    triggerSync,
    viewMode,
    setViewMode,
    cycleTheme,
    isPortRadarOpen,
    setIsPortRadarOpen,
    isWorkspacesOpen,
    setIsWorkspacesOpen,
    isReverseProxyOpen,
    setIsReverseProxyOpen,
    isEnvDiffOpen,
    setIsEnvDiffOpen,
    isNewProjectOpen,
    setIsNewProjectOpen,
    isAnalyticsOpen,
    setIsAnalyticsOpen,
    isDockerFleetOpen,
    setIsDockerFleetOpen,
    isArchitectureGraphOpen,
    setIsArchitectureGraphOpen,
    isMiniMode,
    setIsMiniMode,
    isUnifiedLogsOpen,
    setIsUnifiedLogsOpen,
    isGitMatrixOpen,
    setIsGitMatrixOpen,
    isWindowsTuningOpen,
    setIsWindowsTuningOpen,
    activeEnvProject,
    setActiveEnvProject,
    activeCleanerProject,
    setActiveCleanerProject,
    activeScriptsProject,
    setActiveScriptsProject,
    activeDbProject,
    setActiveDbProject,
    activeDoctorProject,
    setActiveDoctorProject,
    activeCopilot,
    setActiveCopilot,
    activeResourceInspectorProject,
    setActiveResourceInspectorProject,
  } = useAppStore();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'running' | 'native' | 'docker'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProjects();
    const disconnect = connectWebSocket();
    return () => disconnect();
  }, [fetchProjects, connectWebSocket]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+Shift+T, Ctrl+Shift+S, Ctrl+Shift+P, Ctrl+Shift+W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + K (or Cmd + K): Focus Search Input
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (currentTab !== 'dashboard') {
          setCurrentTab('dashboard');
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        // Ctrl + Shift + T: Cycle Themes
        if (e.key.toLowerCase() === 't') {
          e.preventDefault();
          cycleTheme();
        }
        // Ctrl + Shift + S: Trigger Sync All
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          handleSyncAll();
        }
        // Ctrl + Shift + P: Port Conflict Radar
        if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          setIsPortRadarOpen(!isPortRadarOpen);
        }
        // Ctrl + Shift + W: Dev Workspaces
        if (e.key.toLowerCase() === 'w') {
          e.preventDefault();
          setIsWorkspacesOpen(!isWorkspacesOpen);
        }
        // Ctrl + Shift + A: Workload Analytics
        if (e.key.toLowerCase() === 'a') {
          e.preventDefault();
          setIsAnalyticsOpen(!isAnalyticsOpen);
        }
        // Ctrl + Shift + R: Reverse Proxy
        if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          setIsReverseProxyOpen(!isReverseProxyOpen);
        }
        // Ctrl + Shift + D: Env Diff
        if (e.key.toLowerCase() === 'd') {
          e.preventDefault();
          setIsEnvDiffOpen(!isEnvDiffOpen);
        }
        // Ctrl + Shift + M: Mini Mode
        if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          setIsMiniMode(!isMiniMode);
        }
        // Ctrl + Shift + N: Scaffold New App
        if (e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setIsNewProjectOpen(!isNewProjectOpen);
        }
        // Ctrl + Shift + I: AI Copilot
        if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          setActiveCopilot({ isOpen: !activeCopilot.isOpen, projectName: 'Hệ thống' });
        }
        // Ctrl + Shift + F: Docker & WSL2 Fleet
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setIsDockerFleetOpen(!isDockerFleetOpen);
        }
        // Ctrl + Shift + G: Microservices Architecture Graph
        if (e.key.toLowerCase() === 'g') {
          e.preventDefault();
          setIsArchitectureGraphOpen(!isArchitectureGraphOpen);
        }
        // Ctrl + Shift + L: Unified Log Aggregator ("Local Datadog")
        if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          setIsUnifiedLogsOpen(!isUnifiedLogsOpen);
        }
        // Ctrl + Shift + K: Cross-Repo Git Matrix
        if (e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setIsGitMatrixOpen(!isGitMatrixOpen);
        }
        // Ctrl + Shift + E: Windows 11 Deep Performance & EcoQoS Tuning
        if (e.key.toLowerCase() === 'e') {
          e.preventDefault();
          setIsWindowsTuningOpen(!isWindowsTuningOpen);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    cycleTheme, 
    isPortRadarOpen, 
    isWorkspacesOpen, 
    isAnalyticsOpen, 
    isReverseProxyOpen, 
    isEnvDiffOpen, 
    isMiniMode, 
    isNewProjectOpen, 
    activeCopilot.isOpen, 
    projects,
    currentTab
  ]);

  // Sync All active apps
  const handleSyncAll = () => {
    for (const p of projects) {
      if (p.status === 'running') {
        triggerSync(p.id);
      }
    }
  };

  // Filter projects for dashboard view
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.sourcePath.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.port && project.port.toString().includes(searchQuery));

    if (!matchesSearch) return false;

    if (activeFilter === 'running') return project.status === 'running';
    if (activeFilter === 'native') return project.runtimeType === 'native';
    if (activeFilter === 'docker') return project.runtimeType === 'docker';
    return true;
  });

  const getTabTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Dashboard & Ứng Dụng';
      case 'sync-studio':
        return 'Deploy Pipelines & Sync Studio';
      case 'logs':
        return 'Unified Log Aggregator';
      case 'git':
        return 'Cross-Repo Git Matrix';
      case 'docker':
        return 'Target Fleets (Docker & WSL2)';
      case 'tuning':
        return 'Windows 11 Performance Tuning';
      case 'settings':
        return 'Cài Đặt & Giao Diện';
    }
  };

  const getTabSubtitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Quản lý tiến trình ứng dụng local, CPU/RAM meter và điều khiển vòng đời theo chuẩn Windows 11.';
      case 'sync-studio':
        return 'Hệ thống Pipelines điều phối đa môi trường (Native Windows, WSL2 Sandbox, Docker Containers).';
      case 'logs':
        return 'Tổng hợp dòng thời gian nhật ký đa vi dịch vụ thời gian thực theo mô hình Local Datadog.';
      case 'git':
        return 'Giám sát nhánh, theo dõi tệp sửa đổi và thực thi thao tác đồng bộ Git song song đa kho lưu trữ.';
      case 'docker':
        return 'Quản lý container Docker độc lập và phân bổ tài nguyên phần cứng máy ảo WSL2 Linux.';
      case 'tuning':
        return 'Tối ưu hóa luồng CPU EcoQoS (Efficiency Mode) và kiểm toán tăng tốc ổ đĩa Dev Drive (ReFS).';
      case 'settings':
        return 'Tùy biến bộ sưu tập Developer Theme kinh điển và bề mặt chất liệu Microsoft Fluent 2.';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-hub-canvas text-hub-primary font-['Segoe_UI_Variable_Text','Segoe_UI',system-ui,sans-serif] select-none transition-colors">
      {/* 1. Left Navigation Rail (Fluent 2) */}
      <NavigationRail
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Scrollable Viewport - Fluent 2 Dev Home Standard Spacing (px-8 py-6) */}
        <main className="flex-1 overflow-y-auto px-8 py-6 bg-hub-canvas transition-colors w-full">
          <div className="w-full pb-16">
            {/* Dev Home Header Title & Dashboard Action Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-[24px] font-semibold text-hub-primary tracking-tight leading-tight">
                    {getTabTitle()}
                  </h1>
                  {currentTab === 'dashboard' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border border-hub bg-hub-card">
                      {projects.filter(p => p.status === 'running').length > 0 ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          {projects.filter(p => p.status === 'running').length} Đang chạy
                        </span>
                      ) : (
                        <span className="text-hub-muted font-medium">Sẵn sàng</span>
                      )}
                      <span className="text-hub-muted/40">•</span>
                      <span className="text-hub-muted font-mono">{projects.length} Apps</span>
                    </div>
                  )}
                </div>
                <p className="text-[13px] text-hub-secondary mt-1">
                  {getTabSubtitle()}
                </p>
              </div>

              {currentTab === 'dashboard' && (
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {/* Search Bar */}
                  <div className="relative w-64 md:w-72">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-hub-muted" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Tìm kiếm ứng dụng... (Ctrl+K)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
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

                  {/* View Mode Toggle: Grid vs Table */}
                  <div className="flex items-center rounded-md border border-hub bg-black/[0.02] dark:bg-white/[0.03] p-0.5 text-[12px]">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1.5 rounded-[4px] px-2.5 h-7.5 font-medium transition-all ${
                        viewMode === 'table'
                          ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                          : 'text-hub-muted hover:text-hub-primary'
                      }`}
                      title="Dạng bảng dữ liệu tối ưu không gian hiển thị"
                    >
                      <List className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Bảng</span>
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1.5 rounded-[4px] px-2.5 h-7.5 font-medium transition-all ${
                        viewMode === 'grid'
                          ? 'bg-hub-card text-[var(--hub-accent)] font-semibold shadow-2xs'
                          : 'text-hub-muted hover:text-hub-primary'
                      }`}
                      title="Dạng lưới thẻ trực quan"
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Thẻ</span>
                    </button>
                  </div>

                  {/* Trigger Sync All Button */}
                  {projects.filter(p => p.status === 'running').length > 0 && (
                    <button
                      onClick={handleSyncAll}
                      className="fluent-btn-standard flex h-8.5 items-center gap-1.5 px-2.5 text-[12.5px] font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 transition-all shadow-xs"
                      title="Kích hoạt Hot-Sync đồng bộ mã nguồn cho các ứng dụng đang chạy"
                    >
                      <Zap className="h-3.5 w-3.5 fill-current" />
                      <span>Sync All ({projects.filter(p => p.status === 'running').length})</span>
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
                </div>
              )}
            </div>

              {currentTab === 'dashboard' && (
                <>
                  {/* Fluent 2 Telemetry Tiles */}
                  <FluentStatCards />

                  {/* Filter Pills & View Count */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-1 rounded-[4px] border border-hub bg-hub-card p-0.5 text-xs shadow-2xs">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`rounded-[3px] px-3 py-1 font-semibold transition-all ${
                          activeFilter === 'all'
                            ? 'bg-hub-accent text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        Tất cả ({projects.length})
                      </button>
                      <button
                        onClick={() => setActiveFilter('running')}
                        className={`rounded-[3px] px-3 py-1 font-semibold transition-all ${
                          activeFilter === 'running'
                            ? 'bg-[#0E7A0D] text-white shadow-xs'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        Đang chạy ({projects.filter((p) => p.status === 'running').length})
                      </button>
                    <button
                      onClick={() => setActiveFilter('native')}
                      className={`rounded px-3 py-1 font-semibold transition-all ${
                        activeFilter === 'native'
                          ? 'bg-[#0F6CBD] text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Native Process
                    </button>
                    <button
                      onClick={() => setActiveFilter('docker')}
                      className={`rounded px-3 py-1 font-semibold transition-all ${
                        activeFilter === 'docker'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Docker
                    </button>
                  </div>

                  <span className="text-xs text-neutral-500">
                    Hiển thị <strong className="text-neutral-900 dark:text-white font-semibold">{filteredProjects.length}</strong> ứng dụng
                  </span>
                </div>

                {/* Projects Display: Table View (100% Full Width) vs Auto-filling Card Grid */}
                {filteredProjects.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-black/[0.1] dark:border-white/[0.1] bg-white/50 dark:bg-[#202020]/50 p-12 text-center flex flex-col items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-[#0F6CBD] dark:text-[#479EF5] mb-2.5">
                      <FolderGit2 className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                      Chưa có ứng dụng nào phù hợp
                    </h3>
                    <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">
                      Trỏ tới thư mục trên máy hoặc clone repo từ GitHub/GitLab để quản lý vòng đời và đồng bộ.
                    </p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-md bg-[#0F6CBD] hover:bg-[#115EA3] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Thêm ứng dụng</span>
                    </button>
                  </div>
                ) : viewMode === 'table' ? (
                  <ProjectTableView projects={filteredProjects} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 w-full">
                    {filteredProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                )}
              </>
            )}

            {currentTab === 'sync-studio' && <SyncStudioView />}
            {currentTab === 'logs' && <UnifiedLogsView />}
            {currentTab === 'git' && <GitWorkspacesView />}
            {currentTab === 'docker' && <DockerView />}
            {currentTab === 'tuning' && <WindowsPerformanceView />}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Dockable Console Logs Drawer */}
      <TerminalLogs />

      {/* Add Project Modal */}
      <AddProjectModal />

      {/* Port Conflict Radar Modal */}
      <PortRadarModal
        isOpen={isPortRadarOpen}
        onClose={() => setIsPortRadarOpen(false)}
      />

      {/* Dev Workspaces Modal */}
      <WorkspacesModal
        isOpen={isWorkspacesOpen}
        onClose={() => setIsWorkspacesOpen(false)}
      />

      {/* Visual .env & Secrets Studio Modal */}
      <EnvStudioModal
        isOpen={!!activeEnvProject}
        projectId={activeEnvProject?.id || null}
        projectName={activeEnvProject?.name || ''}
        onClose={() => setActiveEnvProject(null)}
      />

      {/* Disk Space Reclaimer Modal */}
      <DiskCleanerModal
        isOpen={!!activeCleanerProject}
        projectId={activeCleanerProject?.id || null}
        projectName={activeCleanerProject?.name || ''}
        onClose={() => setActiveCleanerProject(null)}
      />

      {/* NPM Script Runner Matrix Modal */}
      <ScriptRunnerDrawer
        isOpen={!!activeScriptsProject}
        projectId={activeScriptsProject?.id || null}
        projectName={activeScriptsProject?.name || ''}
        onClose={() => setActiveScriptsProject(null)}
      />

      {/* Database Quick Inspector Modal */}
      <DatabaseInspectorModal
        isOpen={!!activeDbProject}
        projectId={activeDbProject?.id || null}
        projectName={activeDbProject?.name || ''}
        onClose={() => setActiveDbProject(null)}
      />

      {/* Local Reverse Proxy & Custom Domain Studio */}
      <ReverseProxyModal
        isOpen={isReverseProxyOpen}
        onClose={() => setIsReverseProxyOpen(false)}
      />

      {/* AI Terminal Copilot Modal */}
      <AICopilotModal
        isOpen={activeCopilot.isOpen}
        initialLogText={activeCopilot.initialLogText}
        projectName={activeCopilot.projectName}
        onClose={() => setActiveCopilot({ isOpen: false })}
      />

      {/* Cross-Project .env Diff Modal */}
      <EnvDiffModal
        isOpen={isEnvDiffOpen}
        onClose={() => setIsEnvDiffOpen(false)}
      />

      {/* New Project Scaffolding Wizard Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
      />

      {/* Dev Workload & Performance Tracker Modal */}
      <WorkloadAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />

      {/* Docker Fleet & WSL2 Commander Modal */}
      <DockerFleetModal
        isOpen={isDockerFleetOpen}
        onClose={() => setIsDockerFleetOpen(false)}
      />

      {/* Microservices Architecture Graph Modal */}
      <ArchitectureGraphModal
        isOpen={isArchitectureGraphOpen}
        onClose={() => setIsArchitectureGraphOpen(false)}
      />

      {/* Dependency Vulnerability & Lockfile Doctor Modal */}
      <DependencyDoctorModal
        project={activeDoctorProject}
        onClose={() => setActiveDoctorProject(null)}
      />

      {/* Per-App Live Resource Telemetry Inspector Modal */}
      <AppResourceInspectorModal
        project={activeResourceInspectorProject}
        onClose={() => setActiveResourceInspectorProject(null)}
      />

      {/* Unified Log Aggregator ("Local Datadog") Modal */}
      <UnifiedLogAggregatorModal
        isOpen={isUnifiedLogsOpen}
        onClose={() => setIsUnifiedLogsOpen(false)}
      />

      {/* Cross-Repo Git Matrix Modal */}
      <GitMatrixModal
        isOpen={isGitMatrixOpen}
        onClose={() => setIsGitMatrixOpen(false)}
      />

      {/* Windows 11 Deep Performance & EcoQoS Tuning Modal */}
      <WindowsPerformanceModal
        isOpen={isWindowsTuningOpen}
        onClose={() => setIsWindowsTuningOpen(false)}
      />

      {/* Windows 11 Mini Tray Floating Widget */}
      <TrayMiniWidget />
    </div>
  );
};
