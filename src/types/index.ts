export type ProjectStatus = 'stopped' | 'running' | 'building' | 'syncing' | 'error';
export type DeploymentTarget = 'native' | 'wsl2' | 'docker';
export type RuntimeType = DeploymentTarget;
export type SourceType = 'local' | 'git';

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceType: SourceType;
  sourcePath: string;
  gitUrl?: string;
  gitBranch?: string;
  runtimeType: RuntimeType;
  runCommand: string;
  buildCommand?: string;
  port?: number;
  status: ProjectStatus;
  autoSync: boolean;
  syncCount: number;
  lastSyncTime?: string;
  lastSyncDurationMs?: number;
  pid?: number;
  cpuPercent?: number;
  memoryMb?: number;
  createdAt: string;

  // Team Mesh Extension properties
  shareToTeam?: boolean;
  nodeId?: string;
  nodeName?: string;
  isRemote?: boolean;
  remoteUrl?: string;
  connectionType?: 'local' | 'lan' | 'remote_tailscale';
}

export interface DeploymentRecord {
  id: string;
  projectId: string;
  projectName: string;
  timestamp: string;
  durationMs: number;
  target: DeploymentTarget;
  status: 'success' | 'failed';
  stage: 'validate_build' | 'dispatch_target' | 'health_probe';
  trigger: 'manual' | 'auto-watch';
  message: string;
}

export interface LogEntry {
  id: string;
  projectId: string;
  timestamp: string;
  stream: 'stdout' | 'stderr' | 'system';
  text: string;
}

export interface SystemStats {
  dockerAvailable: boolean;
  totalMemoryMb: number;
  freeMemoryMb: number;
  cpuUsage: number;
  activeProcesses: number;
  cpuModel?: string;
  cpuCores?: number;
  cpuSpeedMhz?: number;
  osName?: string;
  osRelease?: string;
  osArch?: string;
  hostname?: string;
  uptimeSeconds?: number;
}

export interface ProcessResourceStat {
  pid: number;
  name: string;
  cpuPercent: number;
  memoryMb: number;
}

export interface ProjectResourceTelemetry {
  projectId: string;
  projectName?: string;
  pid?: number;
  cpuPercent: number;
  memoryMb: number;
  processCount: number;
  target: DeploymentTarget;
  processes: ProcessResourceStat[];
  history: Array<{ timestamp: number; cpu: number; memoryMb: number }>;
}

export interface ResourcesSummary {
  totalAppMemoryMb: number;
  totalAppCpu: number;
  activeCount: number;
  systemTotalMemoryMb: number;
  systemFreeMemoryMb: number;
  topMemoryApp?: { name: string; memoryMb: number };
  topCpuApp?: { name: string; cpuPercent: number };
}

export interface CreateProjectPayload {
  name: string;
  sourceType: SourceType;
  sourcePath: string;
  gitUrl?: string;
  gitBranch?: string;
  gitToken?: string;
  runtimeType: RuntimeType;
  runCommand: string;
  buildCommand?: string;
  port?: number;
  autoSync?: boolean;
}

export interface PortStatus {
  port: number;
  inUse: boolean;
  pid?: number;
  processName?: string;
}

export interface EnvItem {
  key: string;
  value: string;
  isSecret: boolean;
  comment?: string;
}

export interface EnvData {
  filePath: string;
  fileName: string;
  exists: boolean;
  items: EnvItem[];
  raw: string;
  isRemoteSchema?: boolean;
  nodeName?: string;
}

export interface GitStatus {
  isGit: boolean;
  branch?: string;
  uncommittedCount?: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  projectIds: string[];
}

export interface DiskTargetInfo {
  name: string;
  path: string;
  exists: boolean;
  sizeBytes: number;
  sizeFormatted: string;
  canClean: boolean;
}

export interface DiskScanResult {
  projectPath: string;
  targets: DiskTargetInfo[];
  totalSizeBytes: number;
  totalSizeFormatted: string;
}

export interface PackageScript {
  name: string;
  command: string;
  category: 'dev' | 'build' | 'test' | 'lint' | 'other';
}

export interface DatabaseTarget {
  id: string;
  type: 'postgres' | 'mysql' | 'redis' | 'mongodb' | 'sqlite' | 'unknown';
  name: string;
  urlMasked: string;
  host: string;
  port: number;
  status: 'connected' | 'disconnected' | 'checking';
  latencyMs?: number;
  details?: string;
}

export interface ProxyRoute {
  id: string;
  domain: string;
  targetPort: number;
  targetHost?: string;
  isRemote?: boolean;
  nodeName?: string;
  enabled: boolean;
  createdAt: string;
}

export interface ProjectHealth {
  projectId: string;
  status: 'healthy' | 'degraded' | 'down' | 'idle';
  httpStatus?: number;
  latencyMs?: number;
  lastChecked: string;
  consecutiveFailures: number;
  autoRecoveryEnabled: boolean;
}

export interface AIDiagnosisResult {
  errorType: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  summary: string;
  rootCause: string;
  fileHint?: string;
  lineHint?: number;
  fixCommand?: string;
  fixExplanation: string;
  confidence: number;
}

export interface EnvDiffRow {
  key: string;
  valueA?: string;
  valueB?: string;
  isSecret: boolean;
  status: 'identical' | 'different' | 'missing_in_b' | 'missing_in_a';
}

export interface WorkloadSummary {
  todayDevMinutes: number;
  totalProjectsCount: number;
  runningProjectsCount: number;
  totalSyncsToday: number;
  fastestSyncMs: number;
  averageSyncMs: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    uptimeMinutes: number;
    totalSyncs: number;
    avgSyncLatencyMs: number;
    crashesRecovered: number;
    lastActive: string;
  }>;
}

// --- 🐳 DOCKER FLEET & WSL2 COMMANDER ---
export interface DockerContainerInfo {
  id: string;
  name: string;
  image: string;
  state: 'running' | 'exited' | 'paused' | 'restarting' | 'unknown';
  status: string;
  ports: string;
}

export interface WslDistroInfo {
  name: string;
  state: 'Running' | 'Stopped' | 'Unknown';
  version: string;
  isDefault: boolean;
}

export interface WslConfig {
  memoryLimit: string;
  processors: string;
  swap: string;
  rawText: string;
  filePath: string;
}

// --- 🗺️ MICROSERVICES ARCHITECTURE GRAPH ---
export interface GraphNode {
  id: string;
  label: string;
  subLabel: string;
  category: 'frontend' | 'backend' | 'database' | 'cache' | 'service';
  port?: number;
  status: 'online' | 'offline' | 'degraded';
  icon: string;
  latencyMs?: number;
  nodeId?: string;
  nodeName?: string;
  isRemote?: boolean;
  connectionType?: 'local' | 'lan' | 'remote_tailscale';
  ip?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol: 'HTTP' | 'WebSocket' | 'TCP' | 'IPC' | 'LAN Mesh' | 'Tailscale VPN';
  status: 'active' | 'inactive';
  isCrossNode?: boolean;
}

export interface ArchitectureTopology {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    activeConnections: number;
    healthyPercent: number;
    crossNodeConnections?: number;
  };
}

export interface TeamPortClash {
  port: number;
  projects: Array<{
    id: string;
    name: string;
    nodeId?: string;
    nodeName?: string;
    isRemote?: boolean;
    ip?: string;
    status: string;
  }>;
}

// --- 🩹 DEPENDENCY VULNERABILITY & LOCKFILE DOCTOR ---
export interface VulnerabilityItem {
  id: string;
  name: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  title: string;
  range: string;
  fixAvailable: boolean | string;
  url?: string;
}

export interface DependencyAuditReport {
  projectId: string;
  hasPackageJson: boolean;
  totalDependencies: number;
  lockfileStatus: {
    hasLockfile: boolean;
    lockfileType?: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'conflicting';
    files: string[];
  };
  summary: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    info: number;
    total: number;
  };
  vulnerabilities: VulnerabilityItem[];
  scannedAt: string;
}

// --- 📜 PILLAR 2: UNIFIED LOG AGGREGATOR ("LOCAL DATADOG") ---
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface AggregatedLogEntry {
  id: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  target: 'windows' | 'wsl' | 'docker';
  level: LogLevel;
  stream: 'stdout' | 'stderr' | 'system';
  message: string;
  timestamp: string;
  sequence: number;
  correlationId?: string;
  nodeId?: string;
  nodeName?: string;
  isRemote?: boolean;
  connectionType?: 'local' | 'lan' | 'remote_tailscale';
}

export interface AggregatedLogFilter {
  projectIds?: string[];
  levels?: LogLevel[];
  search?: string;
  startTime?: string;
  limit?: number;
  nodeIds?: string[];
  includeRemote?: boolean;
}

// --- 🌿 PILLAR 4: CROSS-REPO GIT MATRIX ---
export interface GitMatrixRepo {
  projectId: string;
  projectName: string;
  sourcePath: string;
  isGitRepo: boolean;
  currentBranch: string;
  localBranches: string[];
  aheadCount: number;
  behindCount: number;
  dirtyFilesCount: number;
  untrackedCount: number;
  lastCommit?: {
    hash: string;
    message: string;
    author: string;
    date: string;
  };
  hasConflict: boolean;
}

export interface GitMatrixBatchResult {
  projectId: string;
  projectName: string;
  action: 'checkout' | 'pull' | 'stash';
  success: boolean;
  message: string;
}

// --- ⚡ PILLAR 5: WINDOWS 11 DEEP PERFORMANCE & DEV DRIVE ---
export type ProcessPriority = 'idle' | 'below_normal' | 'normal' | 'above_normal' | 'high';

export interface ProjectProcessPriority {
  projectId: string;
  projectName: string;
  pid?: number;
  status: 'running' | 'stopped';
  priority: ProcessPriority;
  isEcoMode: boolean;
  affinityMask?: number;
  appliedAt?: string;
}

export interface DevDriveAuditItem {
  projectId: string;
  projectName: string;
  sourcePath: string;
  driveLetter: string;
  fileSystem: string;
  isDevDrive: boolean;
  driveTotalGb: number;
  driveFreeGb: number;
  speedScore: 'accelerated' | 'standard' | 'slow';
  recommendation: string;
}

export interface DevDriveAuditReport {
  items: DevDriveAuditItem[];
  refsCount: number;
  ntfsCount: number;
  totalProjects: number;
  summary: string;
  guideUrl: string;
}

// Pillar 6: Team Mesh & Peer Discovery
export interface MeshNode {
  id: string;
  name: string;
  hostname: string;
  username: string;
  ip: string;
  port: number;
  connectionType: 'local' | 'lan' | 'remote_tailscale';
  status: 'online' | 'offline';
  lastSeen: number;
  latencyMs?: number;
  sharedAppCount: number;
  isSelf?: boolean;
  apps?: Project[];
}

export interface MeshConfig {
  teamToken: string;
  allowRemoteControl: boolean;
  requireToken: boolean;
  hostId?: string;
}

export interface MeshAuditLog {
  id: string;
  timestamp: number;
  action: 'restart' | 'sync' | 'stop' | 'start';
  actorIp: string;
  actorHostname: string;
  actorUsername: string;
  targetProjectId: string;
  targetProjectName: string;
  status: 'success' | 'failed' | 'rejected';
  reason?: string;
}

export interface MeshRemoteNotification {
  id: string;
  timestamp: number;
  type: 'action_received' | 'action_executed';
  title: string;
  message: string;
  actor: string;
  action: string;
  projectName: string;
}

// --- 📬 PILLAR 7: TEAM API RUNNER & SMART MOCK ENGINE ---
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface TeamApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  endpoint: string;
  projectId: string;
  projectName: string;
  nodeId?: string;
  nodeName?: string;
  isRemote?: boolean;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: string;
  authType?: 'none' | 'bearer' | 'basic';
  authToken?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastRunStatus?: number;
  lastRunDurationMs?: number;
}

export interface TeamApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  durationMs: number;
  sizeBytes: number;
  timestamp: string;
  isMocked?: boolean;
  mockRuleId?: string;
  error?: string;
}

export interface MockRule {
  id: string;
  projectId: string;
  projectName?: string;
  name: string;
  method: HttpMethod | 'ALL';
  endpointPattern: string;
  statusCode: number;
  delayMs: number;
  responseBody: string;
  enabled: boolean;
  mode: 'auto_when_offline' | 'always_mock';
  createdAt: number;
}

