import fs from 'node:fs';
import path from 'node:path';

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function calculateDirSize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          total += calculateDirSize(full);
        } else if (entry.isFile()) {
          total += fs.statSync(full).size;
        }
      } catch {}
    }
  } catch {}
  return total;
}

const COMMON_CLEAN_TARGETS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  '.turbo',
  '.cache',
  'coverage',
  '.output',
  'temp',
  'tmp',
];

export class DiskCleanerService {
  scanProject(projectPath: string): DiskScanResult {
    const targets: DiskTargetInfo[] = [];
    let totalBytes = 0;

    for (const name of COMMON_CLEAN_TARGETS) {
      const targetPath = path.join(projectPath, name);
      if (fs.existsSync(targetPath)) {
        try {
          const stat = fs.statSync(targetPath);
          const size = stat.isDirectory() ? calculateDirSize(targetPath) : stat.size;
          totalBytes += size;
          targets.push({
            name,
            path: targetPath,
            exists: true,
            sizeBytes: size,
            sizeFormatted: formatBytes(size),
            canClean: true,
          });
        } catch {}
      }
    }

    return {
      projectPath,
      targets,
      totalSizeBytes: totalBytes,
      totalSizeFormatted: formatBytes(totalBytes),
    };
  }

  cleanTargets(projectPath: string, targetNames: string[]): { success: boolean; cleaned: string[]; reclaimedBytes: number; reclaimedFormatted: string } {
    const cleaned: string[] = [];
    let reclaimed = 0;

    for (const name of targetNames) {
      const targetPath = path.join(projectPath, name);
      if (fs.existsSync(targetPath)) {
        try {
          const stat = fs.statSync(targetPath);
          const size = stat.isDirectory() ? calculateDirSize(targetPath) : stat.size;
          fs.rmSync(targetPath, { recursive: true, force: true });
          cleaned.push(name);
          reclaimed += size;
        } catch (err: any) {
          console.error(`Failed to clean ${targetPath}:`, err.message);
        }
      }
    }

    return {
      success: true,
      cleaned,
      reclaimedBytes: reclaimed,
      reclaimedFormatted: formatBytes(reclaimed),
    };
  }
}

export const diskCleaner = new DiskCleanerService();
