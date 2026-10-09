import { create } from 'zustand';
import type { 
  Project, 
  LogEntry, 
  SystemStats, 
  CreateProjectPayload, 
  GitStatus, 
  DeploymentTarget, 
  DeploymentRecord,
  ProjectResourceTelemetry,
  ResourcesSummary,
  AggregatedLogEntry,
  AggregatedLogFilter,
  EnvData,
  GitMatrixRepo,
  GitMatrixBatchResult,
  ProcessPriority,
  ProjectProcessPriority,
  DevDriveAuditReport,
  MeshNode,
  MeshConfig,
  MeshAuditLog,
  MeshRemoteNotification
} from '../types';
import { type ThemeId, THEMES, THEME_LIST, applyThemeToDocument, getStoredThemeId } from '../themes';
import { type MaterialType, MATERIALS, MATERIAL_LIST, applyMaterialToDocument, getStoredMaterialType } from '../materials';
import { NotificationService } from '../utils/notifications';

interface AppState {
  // Pillar 6: Team Mesh & Peer Discovery
  meshNodes: MeshNode[];
  activeNodeFilter: string;
  teamCatalog: Project[];
  meshConfig: MeshConfig | null;
  meshAuditLogs: MeshAuditLog[];
  isAuditModalOpen: boolean;
  isMeshSettingsOpen: boolean;
  setActiveNodeFilter: (nodeFilter: string) => void;
  setIsAuditModalOpen: (open: boolean) => void;
  setIsMeshSettingsOpen: (open: boolean) => void;
  fetchMeshNodes: () => Promise<void>;
  fetchTeamCatalog: () => Promise<void>;
  toggleProjectShare: (projectId: string) => Promise<boolean>;
  fetchMeshConfig: () => Promise<void>;
  updateMeshConfig: (config: Partial<MeshConfig>) => Promise<MeshConfig | null>;
  fetchMeshAuditLogs: () => Promise<void>;
  clearMeshAuditLogs: () => Promise<void>;
  triggerRemoteProjectAction: (
    nodeId: string,
    projectId: string,
    action: 'restart' | 'sync' | 'stop' | 'start'
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  fetchRemoteProjectLogs: (nodeId: string, projectId: string) => Promise<LogEntry[]>;
  fetchRemoteEnvSchema: (nodeId: string, projectId: string) => Promise<EnvData | null>;

  projects: Project[];
  activeProjectId: string | null;
  logs: Record<string, LogEntry[]>;
  systemStats: SystemStats | null;
  isConnected: boolean;
  searchQuery: string;
  isAddModalOpen: boolean;
  isTerminalOpen: boolean;
  isPortRadarOpen: boolean;
  isWorkspacesOpen: boolean;
  isReverseProxyOpen: boolean;
  isEnvDiffOpen: boolean;
  isNewProjectOpen: boolean;
  isAnalyticsOpen: boolean;
  isDockerFleetOpen: boolean;
  isArchitectureGraphOpen: boolean;
  isMiniMode: boolean;
  isUnifiedLogsOpen: boolean;
  isGitMatrixOpen: boolean;
  isWindowsTuningOpen: boolean;
  activeEnvProject: { id: string; name: string; nodeId?: string; nodeName?: string; isRemote?: boolean } | null;
  activeCleanerProject: { id: string; name: string } | null;
  activeScriptsProject: { id: string; name: string } | null;
  activeDbProject: { id: string; name: string } | null;
  activeDoctorProject: { id: string; name: string } | null;
  activeCopilot: { isOpen: boolean; initialLogText?: string; projectName?: string };
  sentinelHealth: Record<string, any>;
  gitStatuses: Record<string, GitStatus>;
  themeId: ThemeId;
  theme: 'light' | 'dark';
  materialType: MaterialType;
  viewMode: 'grid' | 'table';

  // Actions
  setProjects: (projects: Project[]) => void;
  updateProject: (project: Project) => void;
  setActiveProject: (id: string | null) => void;
  setIsAddModalOpen: (open: boolean) => void;
  setIsTerminalOpen: (open: boolean) => void;
  setIsPortRadarOpen: (open: boolean) => void;
  setIsWorkspacesOpen: (open: boolean) => void;
  setIsReverseProxyOpen: (open: boolean) => void;
  setIsEnvDiffOpen: (open: boolean) => void;
  setIsNewProjectOpen: (open: boolean) => void;
  setIsAnalyticsOpen: (open: boolean) => void;
  setIsDockerFleetOpen: (open: boolean) => void;
  setIsArchitectureGraphOpen: (open: boolean) => void;
  setIsMiniMode: (open: boolean) => void;
  setIsUnifiedLogsOpen: (open: boolean) => void;
  setIsGitMatrixOpen: (open: boolean) => void;
  setIsWindowsTuningOpen: (open: boolean) => void;

  // Pillar 2: Unified Log Aggregator
  aggregatedLogs: AggregatedLogEntry[];
  addAggregatedLog: (entry: AggregatedLogEntry) => void;
  clearAggregatedLogs: () => void;
  fetchAggregatedLogs: (filter?: AggregatedLogFilter) => Promise<void>;

  // Pillar 4: Cross-Repo Git Matrix
  gitMatrix: GitMatrixRepo[];
  fetchGitMatrix: () => Promise<void>;
  batchCheckoutGitMatrix: (branch: string, createIfMissing?: boolean) => Promise<GitMatrixBatchResult[]>;
  batchPullGitMatrix: () => Promise<GitMatrixBatchResult[]>;
  batchStashGitMatrix: (message?: string) => Promise<GitMatrixBatchResult[]>;
  checkoutGitRepo: (projectId: string, branch: string, createIfMissing?: boolean) => Promise<GitMatrixBatchResult>;
  pullGitRepo: (projectId: string) => Promise<GitMatrixBatchResult>;
  stashGitRepo: (projectId: string, message?: string) => Promise<GitMatrixBatchResult>;

  // Pillar 5: Windows 11 Deep Performance & Dev Drive
  tuningStatuses: ProjectProcessPriority[];
  devDriveReport: DevDriveAuditReport | null;
  fetchTuningStatuses: () => Promise<void>;
  fetchDevDriveReport: () => Promise<void>;
  setProjectPriority: (projectId: string, priority: ProcessPriority, isEcoMode: boolean) => Promise<{ success: boolean; message: string }>;
  batchSetEcoMode: (enable: boolean) => Promise<{ success: boolean; affectedCount: number }>;

  setActiveEnvProject: (proj: { id: string; name: string; nodeId?: string; nodeName?: string; isRemote?: boolean } | null) => void;
  setActiveCleanerProject: (proj: { id: string; name: string } | null) => void;
  setActiveScriptsProject: (proj: { id: string; name: string } | null) => void;
  setActiveDbProject: (proj: { id: string; name: string } | null) => void;
  setActiveDoctorProject: (proj: { id: string; name: string } | null) => void;
  setActiveCopilot: (val: { isOpen: boolean; initialLogText?: string; projectName?: string }) => void;
  fetchGitStatus: (id: string) => Promise<void>;
  gitPull: (id: string) => Promise<{ success: boolean; message: string }>;
  setSearchQuery: (query: string) => void;
  addLog: (projectId: string, log: LogEntry) => void;
  clearLogs: (projectId: string) => void;
  toggleTheme: () => void;
  cycleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setThemeId: (themeId: ThemeId) => void;
  setMaterialType: (material: MaterialType) => void;
  setViewMode: (mode: 'grid' | 'table') => void;

  // API operations
  fetchProjects: () => Promise<void>;
  createProject: (payload: CreateProjectPayload) => Promise<Project>;
  startProject: (id: string) => Promise<void>;
  stopProject: (id: string) => Promise<void>;
  restartProject: (id: string) => Promise<void>;
  triggerSync: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  switchProjectTarget: (id: string, target: DeploymentTarget) => Promise<{ success: boolean; message?: string }>;
  deployments: DeploymentRecord[];
  fetchDeployments: (projectId?: string) => Promise<void>;
  resourceTelemetry: Record<string, ProjectResourceTelemetry>;
  resourcesSummary: ResourcesSummary | null;
  activeResourceInspectorProject: Project | null;
  setActiveResourceInspectorProject: (project: Project | null) => void;
  fetchProjectTelemetry: (projectId: string) => Promise<ProjectResourceTelemetry | null>;
  connectWebSocket: () => () => void;
}

const initialThemeId = getStoredThemeId();
if (typeof document !== 'undefined') {
  applyThemeToDocument(initialThemeId);
}

const initialMaterial = getStoredMaterialType();
if (typeof document !== 'undefined') {
  applyMaterialToDocument(initialMaterial);
}

const getInitialViewMode = (): 'grid' | 'table' => {
  if (typeof window === 'undefined') return 'table';
  return (localStorage.getItem('windev-view-mode') as 'grid' | 'table') || 'table';
};

export const useAppStore = create<AppState>((set, get) => ({
  meshNodes: [],
  activeNodeFilter: 'all',
  teamCatalog: [],
  meshConfig: null,
  meshAuditLogs: [],
  isAuditModalOpen: false,
  isMeshSettingsOpen: false,
  setActiveNodeFilter: (filter) => set({ activeNodeFilter: filter }),
  setIsAuditModalOpen: (open) => set({ isAuditModalOpen: open }),
  setIsMeshSettingsOpen: (open) => set({ isMeshSettingsOpen: open }),

  projects: [],
  activeProjectId: null,
  logs: {},
  systemStats: null,
  isConnected: false,
  searchQuery: '',
  isAddModalOpen: false,
  isTerminalOpen: false,
  isPortRadarOpen: false,
  isWorkspacesOpen: false,
  isReverseProxyOpen: false,
  isEnvDiffOpen: false,
  isNewProjectOpen: false,
  isAnalyticsOpen: false,
  isDockerFleetOpen: false,
  isArchitectureGraphOpen: false,
  isMiniMode: false,
  isUnifiedLogsOpen: false,
  isGitMatrixOpen: false,
  isWindowsTuningOpen: false,
  setIsUnifiedLogsOpen: (open) => set({ isUnifiedLogsOpen: open }),
  setIsGitMatrixOpen: (open) => set({ isGitMatrixOpen: open }),
  setIsWindowsTuningOpen: (open) => set({ isWindowsTuningOpen: open }),
  activeEnvProject: null,
  activeCleanerProject: null,
  activeScriptsProject: null,
  activeDbProject: null,
  activeDoctorProject: null,
  activeCopilot: { isOpen: false },
  sentinelHealth: {},
  gitStatuses: {},
  resourceTelemetry: {},
  resourcesSummary: null,
  activeResourceInspectorProject: null,
  setActiveResourceInspectorProject: (proj) => set({ activeResourceInspectorProject: proj }),
  themeId: initialThemeId,
  theme: THEMES[initialThemeId]?.isDark ? 'dark' : 'light',
  materialType: initialMaterial,
  viewMode: getInitialViewMode(),

  setIsPortRadarOpen: (open) => set({ isPortRadarOpen: open }),
  setIsWorkspacesOpen: (open) => set({ isWorkspacesOpen: open }),
  setIsReverseProxyOpen: (open) => set({ isReverseProxyOpen: open }),
  setIsEnvDiffOpen: (open) => set({ isEnvDiffOpen: open }),
  setIsNewProjectOpen: (open) => set({ isNewProjectOpen: open }),
  setIsAnalyticsOpen: (open) => set({ isAnalyticsOpen: open }),
  setIsDockerFleetOpen: (open) => set({ isDockerFleetOpen: open }),
  setIsArchitectureGraphOpen: (open) => set({ isArchitectureGraphOpen: open }),
  setIsMiniMode: (open) => set({ isMiniMode: open }),
  setActiveEnvProject: (proj) => set({ activeEnvProject: proj }),
  setActiveCleanerProject: (proj) => set({ activeCleanerProject: proj }),
  setActiveScriptsProject: (proj) => set({ activeScriptsProject: proj }),
  setActiveDbProject: (proj) => set({ activeDbProject: proj }),
  setActiveDoctorProject: (proj) => set({ activeDoctorProject: proj }),
  setActiveCopilot: (val) => set({ activeCopilot: val }),

  fetchGitStatus: async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}/git`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          gitStatuses: { ...state.gitStatuses, [id]: data },
        }));
      }
    } catch (e) {
      // ignore
    }
  },

  gitPull: async (id: string) => {
    const res = await fetch(`/api/projects/${id}/git-pull`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      get().fetchGitStatus(id);
    }
    return data;
  },

  setMaterialType: (material) => {
    localStorage.setItem('windev-material', material);
    applyMaterialToDocument(material);
    set({ materialType: material });
  },

  setViewMode: (mode) => {
    localStorage.setItem('windev-view-mode', mode);
    set({ viewMode: mode });
  },

  setThemeId: (themeId) => {
    localStorage.setItem('windev-theme-id', themeId);
    const def = THEMES[themeId] || THEMES['fluent-dark'];
    const isDark = def.isDark;
    localStorage.setItem('windev-theme', isDark ? 'dark' : 'light');
    applyThemeToDocument(themeId);
    set({ themeId, theme: isDark ? 'dark' : 'light' });
  },

  setTheme: (theme) => {
    const targetId: ThemeId = theme === 'light' ? 'fluent-light' : 'fluent-dark';
    get().setThemeId(targetId);
  },

  toggleTheme: () => {
    const currentTheme = get().themeId;
    const isCurrentlyDark = THEMES[currentTheme]?.isDark ?? true;
    const nextThemeId: ThemeId = isCurrentlyDark ? 'fluent-light' : 'fluent-dark';
    get().setThemeId(nextThemeId);
  },

  cycleTheme: () => {
    const current = get().themeId;
    const currentIndex = THEME_LIST.findIndex((t) => t.id === current);
    const nextIndex = (currentIndex + 1) % THEME_LIST.length;
    get().setThemeId(THEME_LIST[nextIndex].id);
  },

  setProjects: (projects) => set({ projects }),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),
  setActiveProject: (id) => set({ activeProjectId: id, isTerminalOpen: true }),
  setIsAddModalOpen: (open) => set({ isAddModalOpen: open }),
  setIsTerminalOpen: (open) => set({ isTerminalOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addLog: (projectId, log) =>
    set((state) => {
      const current = state.logs[projectId] || [];
      const updated = [...current.slice(-999), log]; // keep last 1000 logs
      return {
        logs: {
          ...state.logs,
          [projectId]: updated,
        },
      };
    }),

  clearLogs: (projectId) =>
    set((state) => ({
      logs: {
        ...state.logs,
        [projectId]: [],
      },
    })),

  fetchProjects: async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data: Project[] = await res.json();
        set({ projects: data });
        data.forEach((p) => get().fetchGitStatus(p.id));
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  },

  createProject: async (payload) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create project');
    }
    const created = await res.json();
    set((state) => ({ projects: [created, ...state.projects] }));
    get().fetchGitStatus(created.id);
    return created;
  },

  startProject: async (id) => {
    await fetch(`/api/projects/${id}/start`, { method: 'POST' });
  },

  stopProject: async (id) => {
    await fetch(`/api/projects/${id}/stop`, { method: 'POST' });
  },

  restartProject: async (id) => {
    await fetch(`/api/projects/${id}/restart`, { method: 'POST' });
  },

  triggerSync: async (id) => {
    const proj = get().projects.find((p) => p.id === id);
    // Optimistically update status to 'syncing'
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, status: 'syncing' } : p
      ),
    }));
    try {
      const res = await fetch(`/api/projects/${id}/sync`, { method: 'POST' });
      const data = await res.json();
      if (proj) {
        NotificationService.notifySyncSuccess(proj.name, data.durationMs || 64);
      }
    } catch (err) {
      console.error('Trigger sync error', err);
    }
  },

  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }));
  },

  deployments: [],
  switchProjectTarget: async (id: string, target: DeploymentTarget) => {
    try {
      const res = await fetch(`/api/projects/${id}/target`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        get().updateProject(data.project);
        return { success: true };
      }
      return { success: false, message: data.error };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  fetchDeployments: async (projectId?: string) => {
    try {
      const url = projectId ? `/api/projects/${projectId}/deployments` : '/api/deployments/all';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        set({ deployments: data });
      }
    } catch {}
  },

  fetchProjectTelemetry: async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/resources`);
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          resourceTelemetry: { ...state.resourceTelemetry, [projectId]: data },
        }));
        return data;
      }
    } catch {}
    return null;
  },

  // --- PILLAR 2: UNIFIED LOG AGGREGATOR ---
  aggregatedLogs: [],
  addAggregatedLog: (entry: AggregatedLogEntry) =>
    set((state) => ({
      aggregatedLogs: [...state.aggregatedLogs.slice(-1499), entry],
    })),
  clearAggregatedLogs: () => {
    fetch('/api/logs/aggregated', { method: 'DELETE' }).catch(() => {});
    set({ aggregatedLogs: [] });
  },
  fetchAggregatedLogs: async (filter) => {
    try {
      const params = new URLSearchParams();
      if (filter?.projectIds?.length) params.set('projectIds', filter.projectIds.join(','));
      if (filter?.levels?.length) params.set('levels', filter.levels.join(','));
      if (filter?.nodeIds?.length) params.set('nodeIds', filter.nodeIds.join(','));
      if (filter?.includeRemote !== undefined) params.set('includeRemote', String(filter.includeRemote));
      if (filter?.search) params.set('search', filter.search);
      if (filter?.limit) params.set('limit', String(filter.limit));
      const res = await fetch(`/api/logs/aggregated?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        set({ aggregatedLogs: data });
      }
    } catch {}
  },

  // --- PILLAR 4: CROSS-REPO GIT MATRIX ---
  gitMatrix: [],
  fetchGitMatrix: async () => {
    try {
      const res = await fetch('/api/git-matrix/status');
      if (res.ok) {
        const data = await res.json();
        set({ gitMatrix: data });
      }
    } catch {}
  },
  batchCheckoutGitMatrix: async (branch, createIfMissing = false) => {
    try {
      const res = await fetch('/api/git-matrix/checkout-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, createIfMissing }),
      });
      const data = await res.json();
      get().fetchGitMatrix();
      return data;
    } catch (e: any) {
      return [];
    }
  },
  batchPullGitMatrix: async () => {
    try {
      const res = await fetch('/api/git-matrix/pull-all', { method: 'POST' });
      const data = await res.json();
      get().fetchGitMatrix();
      return data;
    } catch (e: any) {
      return [];
    }
  },
  batchStashGitMatrix: async (message) => {
    try {
      const res = await fetch('/api/git-matrix/stash-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      get().fetchGitMatrix();
      return data;
    } catch (e: any) {
      return [];
    }
  },
  checkoutGitRepo: async (projectId, branch, createIfMissing = false) => {
    try {
      const res = await fetch(`/api/git-matrix/${projectId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, createIfMissing }),
      });
      const data = await res.json();
      get().fetchGitMatrix();
      return data;
    } catch (e: any) {
      return { projectId, projectName: 'Error', action: 'checkout', success: false, message: e.message };
    }
  },
  pullGitRepo: async (projectId) => {
    try {
      const res = await fetch(`/api/git-matrix/${projectId}/pull`, { method: 'POST' });
      const data = await res.json();
      get().fetchGitMatrix();
      return data;
    } catch (e: any) {
      return { projectId, projectName: 'Error', action: 'pull', success: false, message: e.message };
    }
  },
  stashGitRepo: async (projectId, message) => {
    try {
      const res = await fetch(`/api/git-matrix/${projectId}/stash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      get().fetchGitMatrix();
      return data;
    } catch (e: any) {
      return { projectId, projectName: 'Error', action: 'stash', success: false, message: e.message };
    }
  },

  // --- PILLAR 5: WINDOWS 11 DEEP PERFORMANCE & DEV DRIVE ---
  tuningStatuses: [],
  devDriveReport: null,
  fetchTuningStatuses: async () => {
    try {
      const res = await fetch('/api/tuning/projects');
      if (res.ok) {
        const data = await res.json();
        set({ tuningStatuses: data });
      }
    } catch {}
  },
  fetchDevDriveReport: async () => {
    try {
      const res = await fetch('/api/tuning/dev-drive-audit');
      if (res.ok) {
        const data = await res.json();
        set({ devDriveReport: data });
      }
    } catch {}
  },
  setProjectPriority: async (projectId, priority, isEcoMode) => {
    try {
      const res = await fetch('/api/tuning/project-priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, priority, isEcoMode }),
      });
      const data = await res.json();
      get().fetchTuningStatuses();
      return data;
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },
  batchSetEcoMode: async (enable) => {
    try {
      const res = await fetch('/api/tuning/batch-eco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enable }),
      });
      const data = await res.json();
      get().fetchTuningStatuses();
      return data;
    } catch (e: any) {
      return { success: false, affectedCount: 0 };
    }
  },

  fetchMeshNodes: async () => {
    try {
      const res = await fetch('/api/mesh/nodes');
      if (res.ok) {
        const data = await res.json();
        set({ meshNodes: data });
      }
    } catch (e) {
      console.error('Failed to fetch mesh nodes', e);
    }
  },

  fetchTeamCatalog: async () => {
    try {
      const res = await fetch('/api/mesh/catalog');
      if (res.ok) {
        const data = await res.json();
        set({ teamCatalog: data });
      }
    } catch (e) {
      console.error('Failed to fetch team catalog', e);
    }
  },

  toggleProjectShare: async (projectId: string) => {
    try {
      const res = await fetch(`/api/mesh/projects/${projectId}/share`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({
          projects: state.projects.map((p) => (p.id === projectId ? { ...p, shareToTeam: data.shared } : p)),
        }));
        NotificationService.notify(data.shared ? 'Đã chia sẻ với Team' : 'Đã hủy chia sẻ', {
          body: data.shared
            ? 'Dự án đã sẵn sàng cho đồng đội truy cập trong mạng Mesh.'
            : 'Dự án đã chuyển về chế độ riêng tư.',
        });
        get().fetchTeamCatalog();
        return data.shared;
      }
      return false;
    } catch {
      return false;
    }
  },

  fetchMeshConfig: async () => {
    try {
      const res = await fetch('/api/mesh/config');
      if (res.ok) {
        const data = await res.json();
        set({ meshConfig: data });
      }
    } catch (e) {
      console.error('Failed to fetch mesh config', e);
    }
  },

  updateMeshConfig: async (config) => {
    try {
      const res = await fetch('/api/mesh/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const data = await res.json();
        set({ meshConfig: data });
        NotificationService.notify('Đã cập nhật cấu hình Mesh', {
          body: 'Thiết lập bảo mật và token đã được lưu thành công.',
        });
        return data;
      }
      return null;
    } catch {
      return null;
    }
  },

  fetchMeshAuditLogs: async () => {
    try {
      const res = await fetch('/api/mesh/audit-logs');
      if (res.ok) {
        const data = await res.json();
        set({ meshAuditLogs: data });
      }
    } catch (e) {
      console.error('Failed to fetch mesh audit logs', e);
    }
  },

  clearMeshAuditLogs: async () => {
    try {
      await fetch('/api/mesh/audit-logs', { method: 'DELETE' });
      set({ meshAuditLogs: [] });
    } catch (e) {
      console.error('Failed to clear audit logs', e);
    }
  },

  triggerRemoteProjectAction: async (nodeId, projectId, action) => {
    try {
      const res = await fetch(`/api/mesh/nodes/${nodeId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        NotificationService.notify('Lệnh từ xa thành công', {
          body: data.message || `Đã gửi lệnh [${action.toUpperCase()}] tới máy trạm.`,
        });
        get().fetchTeamCatalog();
        return { success: true, message: data.message };
      } else {
        NotificationService.notify('Lệnh từ xa thất bại', {
          body: data.error || 'Không thể thực thi lệnh trên máy đích.',
        });
        return { success: false, error: data.error };
      }
    } catch (e: any) {
      NotificationService.notify('Lỗi kết nối Mesh', {
        body: e.message || 'Không thể gửi lệnh qua mạng.',
      });
      return { success: false, error: e.message };
    }
  },

  fetchRemoteProjectLogs: async (nodeId, projectId) => {
    try {
      const res = await fetch(`/api/mesh/nodes/${nodeId}/projects/${projectId}/logs`);
      if (res.ok) {
        const logs: LogEntry[] = await res.json();
        if (Array.isArray(logs)) {
          set((state) => ({
            logs: {
              ...state.logs,
              [projectId]: logs,
            },
          }));
          return logs;
        }
      }
      return [];
    } catch (e) {
      console.error('Failed to fetch remote project logs', e);
      return [];
    }
  },

  fetchRemoteEnvSchema: async (nodeId, projectId) => {
    try {
      const res = await fetch(`/api/mesh/nodes/${nodeId}/projects/${projectId}/env-schema`);
      if (res.ok) {
        const data: EnvData = await res.json();
        return data;
      }
      return null;
    } catch (e) {
      console.error('Failed to fetch remote env schema', e);
      return null;
    }
  },

  connectWebSocket: () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        set({ isConnected: true });
        get().fetchProjects();
        get().fetchDeployments();
        get().fetchMeshNodes();
        get().fetchTeamCatalog();
        get().fetchMeshConfig();
        get().fetchMeshAuditLogs();
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'project:update') {
            get().updateProject(msg.payload);
          } else if (msg.type === 'project:log') {
            get().addLog(msg.payload.projectId, msg.payload.log);
          } else if (msg.type === 'system:stats') {
            set({ systemStats: msg.payload });
          } else if (msg.type === 'projects:all') {
            set({ projects: msg.payload });
          } else if (msg.type === 'project:resource_stats') {
            const statsList: ProjectResourceTelemetry[] = Array.isArray(msg.payload) ? msg.payload : [];
            const telemetryMap: Record<string, ProjectResourceTelemetry> = {};
            for (const item of statsList) {
              telemetryMap[item.projectId] = item;
            }
            set((state) => ({
              resourceTelemetry: { ...state.resourceTelemetry, ...telemetryMap },
              projects: state.projects.map((p) => {
                const found = telemetryMap[p.id];
                if (found) {
                  return {
                    ...p,
                    cpuPercent: found.cpuPercent,
                    memoryMb: found.memoryMb,
                    pid: found.pid ?? p.pid,
                  };
                }
                return p;
              }),
            }));
          } else if (msg.type === 'system:resources_summary') {
            set({ resourcesSummary: msg.payload });
          } else if (msg.type === 'deployment:new') {
            set((state) => ({
              deployments: [msg.payload, ...state.deployments.slice(0, 49)],
            }));
          } else if (msg.type === 'sentinel:update') {
            const healthObj: Record<string, any> = {};
            if (Array.isArray(msg.payload)) {
              for (const h of msg.payload) healthObj[h.projectId] = h;
            }
            set({ sentinelHealth: healthObj });
          } else if (msg.type === 'sentinel:recovered') {
            NotificationService.notify('🩺 Tự động phục hồi (Auto-Recovery)', {
              body: msg.payload.message,
            });
          } else if (msg.type === 'log:aggregated') {
            get().addAggregatedLog(msg.payload);
          } else if (msg.type === 'log:aggregated_cleared') {
            set({ aggregatedLogs: [] });
          } else if (msg.type === 'mesh:nodes_updated' || msg.type === 'mesh:nodes_all') {
            set({ meshNodes: msg.payload });
          } else if (msg.type === 'mesh:catalog_updated' || msg.type === 'mesh:catalog_all') {
            set({ teamCatalog: msg.payload });
          } else if (msg.type === 'mesh:config_updated') {
            set({ meshConfig: msg.payload });
          } else if (msg.type === 'mesh:audit_logs_updated') {
            set({ meshAuditLogs: msg.payload });
          } else if (msg.type === 'mesh:remote_notification') {
            NotificationService.notify(msg.payload.title, {
              body: msg.payload.message,
            });
          }
        } catch (e) {
          console.error('WS parse error', e);
        }
      };

      socket.onclose = () => {
        set({ isConnected: false });
        reconnectTimeout = setTimeout(connect, 2000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socket?.close();
    };
  },
}));
