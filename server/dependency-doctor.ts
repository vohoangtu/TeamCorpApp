import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

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

export class DependencyDoctorService {
  private runCommand(cmd: string, cwd: string, timeoutMs = 12000): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      exec(cmd, { cwd, timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
        // npm audit exits with non-zero code when vulnerabilities exist
        const hasValidJson = (stdout && stdout.trim().startsWith('{'));
        resolve({
          ok: !err || hasValidJson,
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : ''),
        });
      });
    });
  }

  async audit(projectPath: string, projectId: string): Promise<DependencyAuditReport> {
    const pkgPath = path.join(projectPath, 'package.json');
    const scannedAt = new Date().toISOString();

    if (!fs.existsSync(pkgPath)) {
      return {
        projectId,
        hasPackageJson: false,
        totalDependencies: 0,
        lockfileStatus: { hasLockfile: false, files: [] },
        summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
        vulnerabilities: [],
        scannedAt,
      };
    }

    let totalDependencies = 0;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {}).length;
      const devDeps = Object.keys(pkg.devDependencies || {}).length;
      totalDependencies = deps + devDeps;
    } catch {}

    // Check lockfiles
    const lockFilesFound: string[] = [];
    if (fs.existsSync(path.join(projectPath, 'package-lock.json'))) lockFilesFound.push('package-lock.json');
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) lockFilesFound.push('yarn.lock');
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) lockFilesFound.push('pnpm-lock.yaml');
    if (fs.existsSync(path.join(projectPath, 'bun.lockb')) || fs.existsSync(path.join(projectPath, 'bun.lock'))) lockFilesFound.push('bun.lock');

    let lockfileType: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'conflicting' | undefined;
    if (lockFilesFound.length > 1) {
      lockfileType = 'conflicting';
    } else if (lockFilesFound.includes('package-lock.json')) {
      lockfileType = 'npm';
    } else if (lockFilesFound.includes('yarn.lock')) {
      lockfileType = 'yarn';
    } else if (lockFilesFound.includes('pnpm-lock.yaml')) {
      lockfileType = 'pnpm';
    } else if (lockFilesFound.some((f) => f.startsWith('bun'))) {
      lockfileType = 'bun';
    }

    const report: DependencyAuditReport = {
      projectId,
      hasPackageJson: true,
      totalDependencies,
      lockfileStatus: {
        hasLockfile: lockFilesFound.length > 0,
        lockfileType,
        files: lockFilesFound,
      },
      summary: { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 },
      vulnerabilities: [],
      scannedAt,
    };

    // Run npm audit --json
    const res = await this.runCommand('npm.cmd audit --json', projectPath, 15000);

    if (res.stdout) {
      try {
        const json = JSON.parse(res.stdout);
        // npm v7+ structure
        if (json.metadata && json.metadata.vulnerabilities) {
          report.summary = {
            critical: json.metadata.vulnerabilities.critical || 0,
            high: json.metadata.vulnerabilities.high || 0,
            moderate: json.metadata.vulnerabilities.moderate || 0,
            low: json.metadata.vulnerabilities.low || 0,
            info: json.metadata.vulnerabilities.info || 0,
            total: json.metadata.vulnerabilities.total || 0,
          };
        }

        if (json.vulnerabilities) {
          for (const [pkgName, details] of Object.entries<any>(json.vulnerabilities)) {
            const viaObj = Array.isArray(details.via) && typeof details.via[0] === 'object' ? details.via[0] : null;
            report.vulnerabilities.push({
              id: `${pkgName}-${details.severity || 'vuln'}`,
              name: pkgName,
              severity: (details.severity as any) || 'moderate',
              title: viaObj?.title || details.title || `Vulnerability in ${pkgName}`,
              range: details.range || '*',
              fixAvailable: details.fixAvailable ? (typeof details.fixAvailable === 'boolean' ? 'Tự động sửa được' : details.fixAvailable.name) : false,
              url: viaObj?.url || undefined,
            });
          }
        }
      } catch (err) {
        // json parse fallback
      }
    }

    return report;
  }

  async fix(projectPath: string): Promise<{ success: boolean; output: string }> {
    const res = await this.runCommand('npm.cmd audit fix', projectPath, 35000);
    return {
      success: res.ok,
      output: res.stdout || res.stderr || 'Hoàn tất quét & khắc phục phụ thuộc.',
    };
  }
}

export const dependencyDoctor = new DependencyDoctorService();
