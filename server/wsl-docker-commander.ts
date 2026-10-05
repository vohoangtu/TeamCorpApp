import { exec, spawn } from 'node:child_process';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

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

export class WslDockerCommander {
  private runCommandWithTimeout(cmd: string, timeoutMs = 3000): Promise<{ ok: boolean; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
      exec(cmd, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
        if (err) {
          resolve({ ok: false, stdout: stdout || '', stderr: err.message || stderr || '' });
        } else {
          resolve({ ok: true, stdout: stdout || '', stderr: stderr || '' });
        }
      });
    });
  }

  async getDockerFleet(): Promise<{ isAvailable: boolean; containers: DockerContainerInfo[]; message?: string }> {
    // Format: {{.ID}}\t{{.Names}}\t{{.State}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}
    const res = await this.runCommandWithTimeout(
      'docker ps -a --format "{{.ID}}\t{{.Names}}\t{{.State}}\t{{.Status}}\t{{.Ports}}\t{{.Image}}"',
      3000
    );

    if (!res.ok) {
      return {
        isAvailable: false,
        containers: [],
        message: 'Docker daemon không khả dụng hoặc chưa được bật.',
      };
    }

    const lines = res.stdout.trim().split('\n').filter(Boolean);
    const containers: DockerContainerInfo[] = lines.map((line) => {
      const parts = line.split('\t');
      const stateRaw = (parts[2] || '').toLowerCase();
      let state: DockerContainerInfo['state'] = 'unknown';
      if (stateRaw.includes('running')) state = 'running';
      else if (stateRaw.includes('exited')) state = 'exited';
      else if (stateRaw.includes('paused')) state = 'paused';

      return {
        id: parts[0]?.trim() || '',
        name: parts[1]?.trim() || '',
        state,
        status: parts[3]?.trim() || '',
        ports: parts[4]?.trim() || '',
        image: parts[5]?.trim() || '',
      };
    });

    return {
      isAvailable: true,
      containers,
    };
  }

  async containerAction(containerId: string, action: 'start' | 'stop' | 'restart' | 'remove'): Promise<{ success: boolean; message: string }> {
    const cmd = action === 'remove' ? `docker rm -f ${containerId}` : `docker ${action} ${containerId}`;
    const res = await this.runCommandWithTimeout(cmd, 5000);
    return {
      success: res.ok,
      message: res.ok ? `Thao tác ${action} thành công trên container ${containerId}` : res.stderr,
    };
  }

  async pruneDocker(): Promise<{ success: boolean; output: string }> {
    const res = await this.runCommandWithTimeout('docker system prune -f', 10000);
    return {
      success: res.ok,
      output: res.ok ? res.stdout : res.stderr,
    };
  }

  async getWslDistros(): Promise<{ isAvailable: boolean; distros: WslDistroInfo[]; message?: string }> {
    const res = await this.runCommandWithTimeout('wsl.exe -l -v', 3500);
    if (!res.ok) {
      return {
        isAvailable: false,
        distros: [],
        message: 'WSL chưa được cài đặt trên hệ thống Windows này.',
      };
    }

    // Clean potential UTF-16 wide-char spaces
    let text = res.stdout;
    if (text.includes('\x00')) {
      text = text.replace(/\x00/g, '');
    }

    const lines = text.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
      return {
        isAvailable: true,
        distros: [],
        message: 'Chưa có bản phân phối Linux (distro) nào được cài đặt trong WSL.',
      };
    }

    const distros: WslDistroInfo[] = [];

    // Skip header line (NAME STATE VERSION)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const isDefault = line.startsWith('*');
      const cleanLine = line.replace(/^\*\s*/, '');
      const tokens = cleanLine.split(/\s+/);

      if (tokens.length >= 2) {
        const name = tokens[0];
        const state = tokens[1] === 'Running' ? 'Running' : 'Stopped';
        const version = tokens[2] || '2';
        distros.push({ name, state, version, isDefault });
      }
    }

    return {
      isAvailable: true,
      distros,
    };
  }

  getWslConfig(): WslConfig {
    const configPath = path.join(os.homedir(), '.wslconfig');
    let rawText = '';
    if (fs.existsSync(configPath)) {
      try {
        rawText = fs.readFileSync(configPath, 'utf8');
      } catch {}
    }

    const memoryMatch = rawText.match(/memory\s*=\s*([^\r\n]+)/i);
    const cpuMatch = rawText.match(/processors\s*=\s*([^\r\n]+)/i);
    const swapMatch = rawText.match(/swap\s*=\s*([^\r\n]+)/i);

    return {
      memoryLimit: memoryMatch ? memoryMatch[1].trim() : '4GB (Default)',
      processors: cpuMatch ? cpuMatch[1].trim() : 'Auto',
      swap: swapMatch ? swapMatch[1].trim() : '2GB',
      rawText,
      filePath: configPath,
    };
  }

  saveWslConfig(memory: string, processors: string): { success: boolean; message: string } {
    const configPath = path.join(os.homedir(), '.wslconfig');
    const content = `[wsl2]
memory=${memory}
processors=${processors}
swap=2GB
localhostForwarding=true
`;
    try {
      fs.writeFileSync(configPath, content, 'utf8');
      return {
        success: true,
        message: `Đã lưu file cấu hình ${configPath}. Chạy "wsl --shutdown" để áp dụng giới hạn RAM mới.`,
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}

export const wslDockerCommander = new WslDockerCommander();
