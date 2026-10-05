import React, { useEffect, useState } from 'react';
import { WindowsTitleBar } from './components/WindowsTitleBar';
import { NavigationRail, NavTab } from './components/NavigationRail';
import { CommandBar } from './components/CommandBar';
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
import { SyncStudioView } from './components/SyncStudioView';
import { DockerView } from './components/DockerView';
import { GitWorkspacesView } from './components/GitWorkspacesView';
import { SettingsView } from './components/SettingsView';
import { useAppStore } from './store/useAppStore';
import { Plus, FolderGit2, Zap } from 'lucide-react';

export const App: React.FC = () => {
  const { 
    projects, 
    searchQuery, 
    fetchProjects, 
    connectWebSocket, 
    setIsAddModalOpen,
    triggerSync,
    viewMode,
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

  useEffect(() => {
    fetchProjects();
    const disconnect = connectWebSocket();
    return () => disconnect();
  }, [fetchProjects, connectWebSocket]);

  // Global Keyboard Shortcuts (Ctrl+Shift+T, Ctrl+Shift+S, Ctrl+Shift+P, Ctrl+Shift+W)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
    projects
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
        return 'Dashboard & Applications';
      case 'sync-studio':
        return 'Trigger Sync Studio';
      case 'docker':
        return 'Docker Environments';
      case 'git':
        return 'Git Repositories Workspace';
      case 'settings':
        return 'Environment & Tooling';
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-hub-canvas text-hub-primary font-['Segoe_UI_Variable_Text','Segoe_UI',system-ui,sans-serif] select-none transition-colors">
      {/* 0. Windows 11 Native Titlebar */}
      <WindowsTitleBar />

      <div className="flex flex-1 overflow-hidden">
        {/* 1. Left Navigation Rail (Fluent 2) */}
        <NavigationRail
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* 2. Main Content Canvas */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top CommandBar with Segmented Theme Switch & View Mode */}
          <CommandBar
            title={getTabTitle()}
            subtitle="Microsoft Fluent 2"
            onSyncAll={handleSyncAll}
          />

          {/* Scrollable Viewport - Fluent 2 Dev Home Standard Spacing (px-8 py-6) */}
          <main className="flex-1 overflow-y-auto px-8 py-6 bg-hub-canvas transition-colors w-full">
            <div className="w-full pb-16">
              {/* Dev Home Header Title */}
              <div className="mb-4">
                <h1 className="text-[24px] font-semibold text-hub-primary tracking-tight leading-tight">
                  {getTabTitle()}
                </h1>
                <p className="text-[13px] text-hub-secondary mt-0.5">
                  Quản lý tiến trình ứng dụng local, tự động biên dịch và Trigger Hot-Sync theo chuẩn Windows 11.
                </p>
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
            {currentTab === 'docker' && <DockerView />}
            {currentTab === 'git' && <GitWorkspacesView />}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
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

      {/* Windows 11 Mini Tray Floating Widget */}
      <TrayMiniWidget />
    </div>
  );
};
