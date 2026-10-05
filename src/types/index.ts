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
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol: 'HTTP' | 'WebSocket' | 'TCP' | 'IPC';
  status: 'active' | 'inactive';
}

export interface ArchitectureTopology {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: {
    totalNodes: number;
    activeConnections: number;
    healthyPercent: number;
  };
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



