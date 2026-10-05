import React from 'react';
import { 
  Cpu, 
  HardDrive, 
  Laptop, 
  Zap, 
  Box, 
  Layers, 
  Activity, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const FluentStatCards: React.FC = () => {
  const { projects, systemStats } = useAppStore();

  const totalApps = projects.length;
  const runningApps = projects.filter((p) => p.status === 'running').length;

  const totalSyncs = projects.reduce((acc, p) => acc + (p.syncCount || 0), 0);
  const syncDurations = projects
    .filter((p) => p.lastSyncDurationMs !== undefined)
    .map((p) => p.lastSyncDurationMs!);
  const avgSyncMs = syncDurations.length
    ? Math.round(syncDurations.reduce((a, b) => a + b, 0) / syncDurations.length)
    : 64;

  // CPU Calculations
  const cpuModel = systemStats?.cpuModel
    ? systemStats.cpuModel.replace('Intel(R) Core(TM)', 'Intel Core').replace('Processor', '').trim()
    : 'Intel Core i7-14700K';
  const cpuCores = systemStats?.cpuCores || 28;
  const cpuUsage = systemStats?.cpuUsage ?? 0;

  // RAM Calculations
  const totalRamGb = systemStats?.totalMemoryMb 
    ? (systemStats.totalMemoryMb / 1024).toFixed(0) 
    : '64';
  const freeRamGb = systemStats?.freeMemoryMb 
    ? (systemStats.freeMemoryMb / 1024).toFixed(1) 
    : '51';
  const usedRamMb = systemStats?.totalMemoryMb && systemStats?.freeMemoryMb
    ? systemStats.totalMemoryMb - systemStats.freeMemoryMb
    : 13000;
  const usedRamGb = (usedRamMb / 1024).toFixed(1);
  const ramPercent = systemStats?.totalMemoryMb
    ? Math.round((usedRamMb / systemStats.totalMemoryMb) * 100)
    : 20;

  // OS & Machine
  const hostname = systemStats?.hostname || 'DESKTOP-D54HRTO';
  const osRelease = systemStats?.osRelease ? `Build ${systemStats.osRelease}` : 'Build 26100';
  const arch = systemStats?.osArch || 'x64';
  const uptimeHours = systemStats?.uptimeSeconds 
    ? Math.floor(systemStats.uptimeSeconds / 3600) 
    : 0;
  const uptimeMinutes = systemStats?.uptimeSeconds 
    ? Math.floor((systemStats.uptimeSeconds % 3600) / 60) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
      {/* Widget 1: CPU Telemetry */}
      <div className="fluent-card p-3.5 flex flex-col justify-between transition-all hover:border-[var(--hub-accent)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-[#0F6CBD]/10 text-[#0F6CBD] dark:bg-[#0F6CBD]/20 dark:text-[#479EF5]">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[12px] font-semibold text-hub-primary tracking-tight">CPU Vi Xử Lý</span>
              <span className="block text-[11px] text-hub-muted font-mono leading-none">{cpuCores} Threads / Cores</span>
            </div>
          </div>
          <span className={`text-[12px] font-mono font-bold px-1.5 py-0.5 rounded ${
            cpuUsage > 80 
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' 
              : cpuUsage > 40
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {cpuUsage}%
          </span>
        </div>

        <div className="mt-2.5">
          <div className="text-[13px] font-bold text-hub-primary truncate" title={systemStats?.cpuModel}>
            {cpuModel}
          </div>
          {/* Animated CPU Bar */}
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div 
              className="h-full rounded-full bg-[var(--hub-accent)] transition-all duration-500"
              style={{ width: `${Math.max(5, cpuUsage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Widget 2: RAM Memory Telemetry */}
      <div className="fluent-card p-3.5 flex flex-col justify-between transition-all hover:border-[var(--hub-accent)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[12px] font-semibold text-hub-primary tracking-tight">Bộ Nhớ RAM</span>
              <span className="block text-[11px] text-hub-muted leading-none">Dung lượng: {totalRamGb} GB</span>
            </div>
          </div>
          <span className="text-[12px] font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
            {ramPercent}%
          </span>
        </div>

        <div className="mt-2.5">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="font-bold text-hub-primary">{usedRamGb} GB <span className="text-[11px] font-normal text-hub-muted">Dùng</span></span>
            <span className="text-[11px] text-hub-muted font-mono">{freeRamGb} GB Trống</span>
          </div>
          {/* Animated RAM Bar */}
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-black/[0.06] dark:bg-white/[0.08] overflow-hidden">
            <div 
              className="h-full rounded-full bg-purple-500 transition-all duration-500"
              style={{ width: `${ramPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Widget 3: Windows 11 Host & Machine Info */}
      <div className="fluent-card p-3.5 flex flex-col justify-between transition-all hover:border-[var(--hub-accent)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[12px] font-semibold text-hub-primary tracking-tight">Máy Tính & OS</span>
              <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-none flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                Windows 11 Live
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-hub-muted bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
            {arch}
          </span>
        </div>

        <div className="mt-2.5 space-y-0.5">
          <div className="text-[13px] font-bold text-hub-primary truncate" title={hostname}>
            {hostname}
          </div>
          <div className="flex items-center justify-between text-[11px] text-hub-muted font-mono">
            <span>{osRelease}</span>
            <span>Uptime: {uptimeHours}h {uptimeMinutes}m</span>
          </div>
        </div>
      </div>

      {/* Widget 4: Lifecycle & Hot-Sync Performance */}
      <div className="fluent-card p-3.5 flex flex-col justify-between transition-all hover:border-[var(--hub-accent)]/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Zap className="h-4 w-4 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <span className="text-[12px] font-semibold text-hub-primary tracking-tight">Hot-Sync Studio</span>
              <span className="block text-[11px] text-hub-muted leading-none">{totalSyncs} lần trigger</span>
            </div>
          </div>
          <span className="text-[12px] font-mono font-bold text-[#0E7A0D] dark:text-[#58B957] bg-emerald-500/10 px-1.5 py-0.5 rounded">
            ~{avgSyncMs}ms
          </span>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[12px]">
          <div>
            <span className="font-bold text-hub-primary">{runningApps}</span>
            <span className="text-hub-muted"> / {totalApps} Apps Active</span>
          </div>
          <span className="text-[11px] font-medium text-hub-secondary bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded">
            Docker: {systemStats?.dockerAvailable ? 'Ready' : 'CLI'}
          </span>
        </div>
      </div>
    </div>
  );
};
