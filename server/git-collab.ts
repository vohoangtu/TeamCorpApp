import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { meshDiscovery } from './mesh-discovery';
import { projectStore } from './store';
import type {
  GitMemberStatus,
  GitCollabFileItem,
  GitOverlapItem,
  PrePRCheckGate,
  PrePRCheckResult,
  GitFileChangeStatus,
} from '../src/types';

const execFileAsync = promisify(execFile);

async function runGit(args: string[], cwd: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execFileAsync('git', args, {
      cwd,
      windowsHide: true,
      timeout: 20000,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: '0',
      },
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout ? error.stdout.trim() : '',
      stderr: error.stderr ? error.stderr.trim() : error.message,
      exitCode: error.code || 1,
    };
  }
}

function normalizeRepoName(remoteUrl: string): string {
  if (!remoteUrl) return 'TeamCorpApp';
  let cleaned = remoteUrl.trim().replace(/\.git$/, '');
  const match = cleaned.match(/[:/]([^/:]+\/[^/:]+)$/);
  if (match) {
    return match[1];
  }
  const parts = cleaned.split('/');
  return parts.pop() || 'TeamCorpApp';
}

export class GitCollabService {
  private isSimulatedEnabled: boolean = true;
  private peerGitCache: Map<string, GitMemberStatus> = new Map();

  constructor() {}

  public isSimulatedPeers(): boolean {
    return this.isSimulatedEnabled;
  }

  public setSimulatedPeers(enabled: boolean): boolean {
    this.isSimulatedEnabled = enabled;
    return this.isSimulatedEnabled;
  }

  // Get active local repo root (prioritizing current workspace or main repo)
  public getPrimaryRepoPath(): string {
    const cwd = process.cwd();
    if (fs.existsSync(path.join(cwd, '.git'))) {
      return cwd;
    }
    const projects = projectStore.getAll();
    for (const p of projects) {
      if (fs.existsSync(path.join(p.sourcePath, '.git'))) {
        return p.sourcePath;
      }
    }
    return cwd;
  }

  // 1. Inspect local machine's Git state
  public async getLocalStatus(repoPath?: string): Promise<GitMemberStatus> {
    const targetDir = repoPath || this.getPrimaryRepoPath();
    const selfNode = meshDiscovery.getSelfNode();

    let repoUrl = 'https://github.com/vohoangtu/TeamCorpApp.git';
    let repoName = 'vohoangtu/TeamCorpApp';
    let branch = 'main';
    let ahead = 0;
    let behind = 0;
    const uncommittedFiles: GitCollabFileItem[] = [];
    let lastCommit: GitMemberStatus['lastCommit'] = undefined;

    if (fs.existsSync(path.join(targetDir, '.git'))) {
      // 1. Remote URL
      const remoteRes = await runGit(['remote', 'get-url', 'origin'], targetDir);
      if (remoteRes.exitCode === 0 && remoteRes.stdout) {
        repoUrl = remoteRes.stdout;
        repoName = normalizeRepoName(repoUrl);
      }

      // 2. Current Branch
      const branchRes = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], targetDir);
      if (branchRes.exitCode === 0 && branchRes.stdout) {
        branch = branchRes.stdout;
      }

      // 3. Ahead / Behind vs origin/main or upstream
      let countRes = await runGit(['rev-list', '--left-right', '--count', 'HEAD...origin/main'], targetDir);
      if (countRes.exitCode !== 0) {
        countRes = await runGit(['rev-list', '--left-right', '--count', 'HEAD...@{u}'], targetDir);
      }
      if (countRes.exitCode === 0 && countRes.stdout) {
        const parts = countRes.stdout.split(/\s+/);
        if (parts.length >= 2) {
          ahead = parseInt(parts[0], 10) || 0;
          behind = parseInt(parts[1], 10) || 0;
        }
      }

      // 4. Uncommitted changed files (porcelain)
      const statusRes = await runGit(['status', '--porcelain'], targetDir);
      if (statusRes.exitCode === 0 && statusRes.stdout) {
        const lines = statusRes.stdout.split('\n').filter(Boolean);
        for (const line of lines) {
          const code = line.slice(0, 2);
          const filePath = line.slice(3).trim().replace(/^"|"$/g, '');
          if (!filePath) continue;

          let status: GitFileChangeStatus = 'modified';
          if (code.includes('?')) {
            status = 'untracked';
          } else if (code.includes('A')) {
            status = 'added';
          } else if (code.includes('D')) {
            status = 'deleted';
          }

          uncommittedFiles.push({
            path: filePath,
            status,
          });
        }
      }

      // 5. Last commit (standard git log -1 to avoid Windows batch file % stripping)
      const logRes = await runGit(['log', '-1'], targetDir);
      if (logRes.exitCode === 0 && logRes.stdout) {
        let hash = '';
        let author = '';
        let date = '';
        const lines = logRes.stdout.split('\n');
        const messageLines: string[] = [];
        let inMessage = false;

        for (const line of lines) {
          const trimmed = line.trim();
          if (line.startsWith('commit ')) {
            hash = line.replace('commit ', '').trim().slice(0, 7);
          } else if (line.startsWith('Author: ')) {
            author = line.replace('Author: ', '').split('<')[0].trim();
          } else if (line.startsWith('Date: ')) {
            date = line.replace('Date: ', '').trim();
            inMessage = true;
          } else if (inMessage && trimmed) {
            messageLines.push(trimmed);
          }
        }

        if (hash) {
          lastCommit = {
            hash,
            author: author || 'Developer',
            message: messageLines.join(' ') || 'Commit update',
            date: date || new Date().toISOString(),
          };
        }
      }
    }

    return {
      nodeId: selfNode.id,
      nodeName: `${selfNode.username}@${selfNode.hostname}`,
      username: selfNode.username,
      hostname: selfNode.hostname,
      ip: selfNode.ip,
      repoUrl,
      repoName,
      branch,
      ahead,
      behind,
      uncommittedFiles,
      lastCommit,
      isSelf: true,
      updatedAt: Date.now(),
    };
  }

  // 2. Realistic Simulated Teammates (for demo / offline single-workstation testing)
  private getSimulatedTeammates(targetRepoName: string, targetRepoUrl: string): GitMemberStatus[] {
    const now = Date.now();
    return [
      {
        nodeId: 'sim_node_hoa_fe',
        nodeName: 'hoa@Hoa-ThinkPad (Frontend)',
        username: 'hoa',
        hostname: 'Hoa-ThinkPad',
        ip: '192.168.1.18',
        repoUrl: targetRepoUrl,
        repoName: targetRepoName,
        branch: 'feat/checkout-flow',
        ahead: 2,
        behind: 1,
        uncommittedFiles: [
          { path: 'src/App.tsx', status: 'modified' },
          { path: 'src/components/ProjectCard.tsx', status: 'modified' },
        ],
        lastCommit: {
          hash: '9f24c1e',
          author: 'Hoa Vo',
          message: 'feat: add checkout step indicator and summary card',
          date: new Date(now - 45 * 60 * 1000).toISOString(),
        },
        isSelf: false,
        isSimulated: true,
        updatedAt: now - 3000,
      },
      {
        nodeId: 'sim_node_minh_be',
        nodeName: 'minh@Minh-Workstation (Backend)',
        username: 'minh',
        hostname: 'Minh-Workstation',
        ip: '192.168.1.25',
        repoUrl: targetRepoUrl,
        repoName: targetRepoName,
        branch: 'feat/api-webhooks',
        ahead: 4,
        behind: 5,
        uncommittedFiles: [
          { path: 'server/index.ts', status: 'modified' },
          { path: 'server/team-api-runner.ts', status: 'modified' },
          { path: 'src/types/index.ts', status: 'modified' },
        ],
        lastCommit: {
          hash: 'c83b102',
          author: 'Minh Nguyen',
          message: 'refactor: standardize webhook payload signature validation',
          date: new Date(now - 120 * 60 * 1000).toISOString(),
        },
        isSelf: false,
        isSimulated: true,
        updatedAt: now - 5000,
      },
      {
        nodeId: 'sim_node_tuan_lead',
        nodeName: 'tuan@Tuan-MacBook (Tech Lead)',
        username: 'tuan',
        hostname: 'Tuan-MacBook',
        ip: '192.168.1.10',
        repoUrl: targetRepoUrl,
        repoName: targetRepoName,
        branch: 'main',
        ahead: 0,
        behind: 0,
        uncommittedFiles: [],
        lastCommit: {
          hash: '30bec4c',
          author: 'Tuan Le',
          message: 'merge: team mesh and mock engine release',
          date: new Date(now - 180 * 60 * 1000).toISOString(),
        },
        isSelf: false,
        isSimulated: true,
        updatedAt: now - 8000,
      },
    ];
  }

  // 3. Fetch remote peer Git status via HTTP mesh call
  public async fetchPeerGitStatus(peerIp: string, peerPort: number): Promise<GitMemberStatus | null> {
    return new Promise((resolve) => {
      const options = {
        hostname: peerIp,
        port: peerPort,
        path: '/api/git-collab/status',
        method: 'GET',
        headers: {
          'X-Mesh-Token': meshDiscovery.getConfig().teamToken,
        },
        timeout: 4000,
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            if (res.statusCode === 200) {
              const data = JSON.parse(body);
              resolve({
                ...data,
                isSelf: false,
                isSimulated: false,
              });
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.end();
    });
  }

  // 4. Retrieve all team members' Git branches & statuses
  public async getTeamBranches(): Promise<{
    localStatus: GitMemberStatus;
    team: GitMemberStatus[];
    overlaps: GitOverlapItem[];
    isSimulated: boolean;
  }> {
    const localStatus = await this.getLocalStatus();
    const team: GitMemberStatus[] = [localStatus];

    // Query active LAN / Tailscale peers
    const allMeshNodes = meshDiscovery.getAllNodes().filter((n) => !n.isSelf && n.status === 'online');
    for (const node of allMeshNodes) {
      const cached = this.peerGitCache.get(node.id);
      if (cached && Date.now() - cached.updatedAt < 8000) {
        team.push(cached);
      } else {
        const fetched = await this.fetchPeerGitStatus(node.ip, node.port);
        if (fetched) {
          this.peerGitCache.set(node.id, fetched);
          team.push(fetched);
        }
      }
    }

    // Add simulated peers if enabled (allows testing overlap detection on a single machine)
    if (this.isSimulatedEnabled) {
      const simulated = this.getSimulatedTeammates(localStatus.repoName, localStatus.repoUrl);
      for (const sim of simulated) {
        team.push(sim);
      }
    }

    // Compute overlaps
    const overlaps = this.detectOverlaps(localStatus, team);

    return {
      localStatus,
      team,
      overlaps,
      isSimulated: this.isSimulatedEnabled,
    };
  }

  // 5. Overlap Detection Algorithm: Identifies uncommitted file clashes
  public detectOverlaps(localStatus: GitMemberStatus, team: GitMemberStatus[]): GitOverlapItem[] {
    const overlaps: GitOverlapItem[] = [];
    if (!localStatus.uncommittedFiles || localStatus.uncommittedFiles.length === 0) {
      return overlaps;
    }

    const peers = team.filter((m) => !m.isSelf && m.repoName.toLowerCase() === localStatus.repoName.toLowerCase());

    for (const localFile of localStatus.uncommittedFiles) {
      for (const peer of peers) {
        const peerMatchingFile = peer.uncommittedFiles.find((pf) => pf.path.toLowerCase() === localFile.path.toLowerCase());
        if (peerMatchingFile) {
          overlaps.push({
            id: `overlap_${peer.nodeId}_${encodeURIComponent(localFile.path)}`,
            filePath: localFile.path,
            localFile,
            localBranch: localStatus.branch,
            peerNodeId: peer.nodeId,
            peerNodeName: peer.nodeName,
            peerUsername: peer.username,
            peerBranch: peer.branch,
            peerFile: peerMatchingFile,
            severity: 'critical',
            recommendation: `Cả bạn và ${peer.nodeName} (nhánh "${peer.branch}") đang đồng thời sửa file "${localFile.path}". Hãy trao đổi với bạn ấy trước khi commit hoặc merge vào main để triệt tiêu merge conflict!`,
            detectedAt: Date.now(),
          });
        }
      }
    }

    return overlaps;
  }

  // 6. 1-Click Pre-PR Quality Gate Runner
  public async runPrePRQualityGate(repoPath?: string): Promise<PrePRCheckResult> {
    const targetDir = repoPath || this.getPrimaryRepoPath();
    const localStatus = await this.getLocalStatus(targetDir);
    const gates: PrePRCheckGate[] = [];
    const startTime = Date.now();

    // --- GATE 1: Working Tree Cleanliness ---
    const uncommittedCount = localStatus.uncommittedFiles.length;
    if (uncommittedCount === 0) {
      gates.push({
        id: 'gate_clean_tree',
        title: 'Working Tree Sạch Sẽ',
        description: 'Đảm bảo tất cả file thay đổi đã được commit trước khi gửi PR',
        status: 'passed',
        message: 'Working tree hoàn toàn sạch sẽ, không có thay đổi dở dang.',
        durationMs: 40,
      });
    } else {
      gates.push({
        id: 'gate_clean_tree',
        title: 'Working Tree Còn File Chưa Commit',
        description: 'Kiểm tra trạng thái file đang sửa trên máy trạm',
        status: 'warning',
        message: `Bạn còn ${uncommittedCount} file chưa commit hoặc untracked.`,
        details: localStatus.uncommittedFiles.slice(0, 8).map((f) => `${f.status.toUpperCase()}: ${f.path}`),
        durationMs: 40,
      });
    }

    // --- GATE 2: TypeScript & Static TypeCheck Gate ---
    const tscStart = Date.now();
    try {
      const tscCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
      await execFileAsync(tscCmd, ['tsc', '--noEmit'], {
        cwd: targetDir,
        windowsHide: true,
        timeout: 45000,
        shell: process.platform === 'win32',
      });
      const tscDuration = Date.now() - tscStart;
      gates.push({
        id: 'gate_typescript',
        title: 'TypeScript Type-Safety Check',
        description: 'Biên dịch kiểm tra 100% Type và Interface trong toàn bộ codebase',
        status: 'passed',
        message: 'TypeScript Typecheck passed tuyệt đối (0 lỗi).',
        durationMs: tscDuration,
      });
    } catch (tscErr: any) {
      const tscDuration = Date.now() - tscStart;
      const rawOut = (tscErr.stdout || tscErr.stderr || tscErr.message || '').toString();
      const errorLines = rawOut
        .split('\n')
        .map((l: string) => l.trim())
        .filter((l: string) => l.includes('error TS') || l.length > 5)
        .slice(0, 6);

      gates.push({
        id: 'gate_typescript',
        title: 'TypeScript Type-Safety Check',
        description: 'Biên dịch kiểm tra Type và Interface trong codebase',
        status: 'failed',
        message: `Phát hiện lỗi TypeCheck (${errorLines.length || 1} lỗi). Hãy sửa trước khi gửi PR!`,
        details: errorLines.length > 0 ? errorLines : [rawOut.slice(0, 300)],
        durationMs: tscDuration,
      });
    }

    // --- GATE 3: Upstream Synchronization & Rebase Check ---
    const behindCount = localStatus.behind;
    if (behindCount === 0) {
      gates.push({
        id: 'gate_branch_freshness',
        title: 'Bắt Kịp Nhánh Chính (origin/main)',
        description: 'Kiểm tra mức độ trôi nhánh so với commit mới nhất trên remote',
        status: 'passed',
        message: `Nhánh "${localStatus.branch}" đã bắt kịp origin/main (0 commit tụt lại).`,
        durationMs: 25,
      });
    } else {
      gates.push({
        id: 'gate_branch_freshness',
        title: 'Nhánh Đang Bị Tụt Sau origin/main',
        description: 'Kiểm tra độ trôi nhánh so với commit mới nhất trên remote',
        status: 'warning',
        message: `Nhánh đang chậm hơn origin/main ${behindCount} commit. Khuyến nghị chạy 'git pull --rebase origin main'.`,
        durationMs: 25,
      });
    }

    // --- GATE 4: Meaningful Commit Message Check ---
    if (localStatus.lastCommit && localStatus.lastCommit.message.length > 8) {
      gates.push({
        id: 'gate_commit_message',
        title: 'Quy Chuẩn Commit Message',
        description: 'Kiểm tra thông điệp commit rõ ràng, có ý nghĩa',
        status: 'passed',
        message: `Commit gần nhất: [${localStatus.lastCommit.hash}] "${localStatus.lastCommit.message}"`,
        durationMs: 10,
      });
    } else {
      gates.push({
        id: 'gate_commit_message',
        title: 'Quy Chuẩn Commit Message',
        description: 'Kiểm tra thông điệp commit rõ ràng',
        status: 'warning',
        message: 'Commit message gần nhất quá ngắn hoặc chưa rõ ràng.',
        durationMs: 10,
      });
    }

    const hasFailed = gates.some((g) => g.status === 'failed');
    const isReadyForPR = !hasFailed;

    // Build GitHub Compare PR URL
    let prCompareUrl = '';
    if (localStatus.repoUrl.includes('github.com')) {
      const cleanRepo = localStatus.repoName;
      prCompareUrl = `https://github.com/${cleanRepo}/compare/main...${encodeURIComponent(localStatus.branch)}?expand=1`;
    }

    const summary = isReadyForPR
      ? `✅ Sẵn sàng tạo Pull Request! Đã vượt qua các cổng kiểm định chất lượng trong ${Date.now() - startTime}ms.`
      : `⚠️ Chưa sẵn sàng gửi PR. Vui lòng khắc phục các lỗi Type/Lint được chỉ ra bên trên.`;

    return {
      projectName: path.basename(targetDir),
      repoUrl: localStatus.repoUrl,
      branch: localStatus.branch,
      targetBranch: 'main',
      timestamp: new Date().toISOString(),
      isReadyForPR,
      gates,
      prCompareUrl,
      summary,
    };
  }

  // 7. Open PR in default OS browser
  public openGitHubPR(url: string): void {
    if (!url) return;
    if (process.platform === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '""', url], { detached: true });
    } else {
      spawn('open', [url], { detached: true });
    }
  }
}

export const gitCollabService = new GitCollabService();
