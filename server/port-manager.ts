import { execFile } from 'node:child_process';
import treeKill from 'tree-kill';

export interface PortStatus {
  port: number;
  inUse: boolean;
  pid?: number;
  processName?: string;
}

export class PortManager {
  // Check a single port on Windows
  async checkPort(port: number): Promise<PortStatus> {
    return new Promise((resolve) => {
      // Use PowerShell Get-NetTCPConnection to identify listening process
      const script = `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1 LocalPort, OwningProcess | ConvertTo-Json -Compress`;
      
      execFile('powershell.exe', ['-Command', script], (err, stdout) => {
        if (err || !stdout.trim()) {
          resolve({ port, inUse: false });
          return;
        }

        try {
          const data = JSON.parse(stdout.trim());
          const pid = data.OwningProcess;

          if (!pid) {
            resolve({ port, inUse: false });
            return;
          }

          // Query process name
          execFile(
            'powershell.exe',
            ['-Command', `(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).ProcessName`],
            (_, nameOut) => {
              const processName = nameOut ? nameOut.trim() : 'Unknown';
              resolve({
                port,
                inUse: true,
                pid,
                processName,
              });
            }
          );
        } catch {
          resolve({ port, inUse: false });
        }
      });
    });
  }

  // Scan common web development ports
  async scanCommonPorts(customPorts: number[] = []): Promise<PortStatus[]> {
    const basePorts = [3000, 3030, 4100, 5000, 5173, 8000, 8080, 5432, 6379, 27017];
    const portsToScan = Array.from(new Set([...basePorts, ...customPorts]));
    const results = await Promise.all(portsToScan.map((p) => this.checkPort(p)));
    return results;
  }

  // Kill the process occupying a port
  async killPort(port: number): Promise<{ success: boolean; killedPid?: number; error?: string }> {
    const status = await this.checkPort(port);
    if (!status.inUse || !status.pid) {
      return { success: false, error: `Port ${port} không có tiến trình nào đang chiếm.` };
    }

    return new Promise((resolve) => {
      treeKill(status.pid!, 'SIGKILL', (err) => {
        if (err) {
          // Fallback to taskkill /F /PID
          execFile('taskkill', ['/F', '/PID', status.pid!.toString()], (taskErr) => {
            if (taskErr) {
              resolve({ success: false, killedPid: status.pid, error: taskErr.message });
            } else {
              resolve({ success: true, killedPid: status.pid });
            }
          });
        } else {
          resolve({ success: true, killedPid: status.pid });
        }
      });
    });
  }
}

export const portManager = new PortManager();
