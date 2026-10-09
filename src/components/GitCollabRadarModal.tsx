import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Users,
  RefreshCw,
  FileCode,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Laptop,
  Clock,
  Sparkles,
  Copy,
  Check,
  Play,
  Flame,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { GitMemberStatus, GitOverlapItem, PrePRCheckResult } from '../types';

export const GitCollabRadarModal: React.FC = () => {
  const {
    isGitCollabRadarOpen,
    setIsGitCollabRadarOpen,
    gitCollabStatus,
    gitCollabTeam,
    gitOverlaps,
    isSimulatedPeersEnabled,
    fetchGitCollabTeam,
    toggleSimulatedPeers,
    runPrePRQualityGate,
    openGitHubPRUrl,
    prePRCheckResult,
    isPrePRChecking,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'radar' | 'branches' | 'pre-pr'>('radar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState('');

  useEffect(() => {
    if (isGitCollabRadarOpen) {
      fetchGitCollabTeam();
    }
  }, [isGitCollabRadarOpen, fetchGitCollabTeam]);

  if (!isGitCollabRadarOpen) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGitCollabTeam();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCopyMessage = (overlap: GitOverlapItem) => {
    const text = `Hi @${overlap.peerUsername}, mình thấy bạn cũng đang sửa file "${overlap.filePath}" trên nhánh "${overlap.peerBranch}". Mình trao đổi chút trước khi merge vào main để tránh conflict nhé!`;
    navigator.clipboard.writeText(text);
    setCopiedId(overlap.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const localMember = gitCollabStatus || gitCollabTeam.find((m) => m.isSelf);
  const otherMembers = gitCollabTeam.filter((m) => !m.isSelf);
  const overlapCount = gitOverlaps.length;

  const filteredMembers = gitCollabTeam.filter((m) => {
    if (!branchSearch) return true;
    const q = branchSearch.toLowerCase();
    return (
      m.nodeName.toLowerCase().includes(q) ||
      m.branch.toLowerCase().includes(q) ||
      m.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl border border-hub bg-hub-card shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              overlapCount > 0 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
            }`}>
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-hub-primary tracking-tight">
                  Git Overlap Radar & Pre-PR Board
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-hub bg-black/[0.04] dark:bg-white/[0.06] text-hub-muted">
                  {localMember?.repoName || 'TeamCorpApp'}
                </span>
                {overlapCount > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 animate-pulse border border-red-500/30">
                    <AlertTriangle className="h-3 w-3" />
                    {overlapCount} Xung đột file
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    An toàn (0 Overlap)
                  </span>
                )}
              </div>
              <p className="text-xs text-hub-secondary mt-0.5">
                Cảnh báo sớm trùng lặp file đang sửa trên cùng 1 repo & kiểm duyệt chất lượng trước khi tạo PR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulation Toggle Pill */}
            <button
              onClick={() => toggleSimulatedPeers(!isSimulatedPeersEnabled)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                isSimulatedPeersEnabled
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] border-hub text-hub-muted hover:text-hub-primary'
              }`}
              title="Bật/Tắt dữ liệu giả lập thành viên để kiểm thử tính năng Overlap Radar khi chỉ chạy 1 máy"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Demo Team {isSimulatedPeersEnabled ? 'BẬT' : 'TẮT'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-lg border border-hub bg-hub-card text-hub-secondary hover:text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
              title="Làm mới trạng thái Git"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[var(--hub-accent)]' : ''}`} />
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsGitCollabRadarOpen(false)}
              className="p-1.5 rounded-lg border border-hub bg-hub-card text-hub-muted hover:text-hub-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-hub bg-hub-canvas/50">
          <button
            onClick={() => setActiveTab('radar')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'radar'
                ? 'border-[var(--hub-accent)] text-[var(--hub-accent)]'
                : 'border-transparent text-hub-secondary hover:text-hub-primary'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Radar Xung Đột File</span>
            {overlapCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500 text-white font-bold">
                {overlapCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('branches')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'branches'
                ? 'border-[var(--hub-accent)] text-[var(--hub-accent)]'
                : 'border-transparent text-hub-secondary hover:text-hub-primary'
            }`}
          >
            <GitBranch className="h-3.5 w-3.5" />
            <span>Bảng Nhánh Tính Năng ({gitCollabTeam.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pre-pr')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'pre-pr'
                ? 'border-[var(--hub-accent)] text-[var(--hub-accent)]'
                : 'border-transparent text-hub-secondary hover:text-hub-primary'
            }`}
          >
            <GitPullRequest className="h-3.5 w-3.5" />
            <span>Pre-PR Quality Gate</span>
            {prePRCheckResult && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                prePRCheckResult.isReadyForPR ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                {prePRCheckResult.isReadyForPR ? 'Ready' : 'Issues'}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: RADAR XUNG ĐỘT FILE */}
          {activeTab === 'radar' && (
            <div className="space-y-5">
              {/* Local Machine Status Banner */}
              <div className="p-4 rounded-xl border border-hub bg-hub-canvas/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--hub-accent)]/10 text-[var(--hub-accent)]">
                    <Laptop className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-hub-primary">
                        Máy của bạn ({localMember?.username}@{localMember?.hostname})
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-black/[0.05] dark:bg-white/[0.06] text-hub-primary font-semibold flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-sky-500" />
                        {localMember?.branch || 'main'}
                      </span>
                    </div>
                    <p className="text-[11px] text-hub-secondary mt-0.5">
                      Đang sửa dở{' '}
                      <span className="font-semibold text-hub-primary">
                        {localMember?.uncommittedFiles?.length || 0} file
                      </span>{' '}
                      chưa commit • {localMember?.ahead || 0} ahead, {localMember?.behind || 0} behind so với origin/main
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-hub-muted text-[11px]">Đang scan theo thời gian thực qua P2P Mesh</span>
                </div>
              </div>

              {/* OVERLAP ALERTS */}
              {overlapCount > 0 ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">
                        Phát hiện {overlapCount} file đang được sửa đồng thời!
                      </h4>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1 leading-relaxed">
                        Cả bạn và các đồng đội bên dưới đều đang can thiệp vào cùng một file mã nguồn trên các nhánh khác nhau trước khi commit. Nếu không thống nhất trước, khi merge vào nhánh chính (<code>main</code>) chắc chắn sẽ xảy ra <strong>Merge Conflict</strong> nghiêm trọng.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {gitOverlaps.map((overlap) => (
                      <div
                        key={overlap.id}
                        className="p-4 rounded-xl border border-hub bg-hub-card shadow-xs hover:border-red-500/40 transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-hub pb-2.5">
                          <div className="flex items-center gap-2">
                            <FileCode className="h-4 w-4 text-red-500" />
                            <span className="text-xs font-mono font-bold text-hub-primary">
                              {overlap.filePath}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold uppercase bg-red-500/20 text-red-600 dark:text-red-400">
                              Trùng file
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopyMessage(overlap)}
                            className="fluent-btn-standard flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-hub-secondary hover:text-hub-primary"
                            title="Sao chép lời nhắn nhanh để gửi đồng đội qua Slack/Teams/Zalo"
                          >
                            {copiedId === overlap.id ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-500" />
                                <span>Đã copy lời nhắn!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Nhắn cho {overlap.peerUsername}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Side by side comparison */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Local Dev side */}
                          <div className="p-3 rounded-lg border border-hub bg-hub-canvas/40 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-hub-secondary text-[11px]">Bạn (Local)</span>
                              <span className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {overlap.localBranch}
                              </span>
                            </div>
                            <p className="text-[11px] text-hub-muted">
                              Trạng thái file: <span className="text-amber-500 font-semibold">{overlap.localFile.status}</span> (chưa commit)
                            </p>
                          </div>

                          {/* Peer side */}
                          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-hub-primary text-[11px]">
                                {overlap.peerNodeName}
                              </span>
                              <span className="font-mono text-[11px] text-red-600 dark:text-red-400 font-semibold flex items-center gap-1">
                                <GitBranch className="h-3 w-3" />
                                {overlap.peerBranch}
                              </span>
                            </div>
                            <p className="text-[11px] text-hub-muted">
                              Trạng thái file: <span className="text-red-500 font-semibold">{overlap.peerFile.status}</span> (đang sửa trên máy bạn ấy)
                            </p>
                          </div>
                        </div>

                        <div className="text-[11px] text-hub-secondary italic flex items-center gap-1.5 pt-1">
                          <Flame className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{overlap.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* SAFE CLEAN STATE */
                <div className="p-8 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-hub-primary">
                      Không phát hiện xung đột file nào!
                    </h3>
                    <p className="text-xs text-hub-secondary max-w-md mx-auto mt-1 leading-relaxed">
                      Tuyệt vời! Hiện tại không có đồng đội nào trong mạng mesh đang sửa trùng file với bạn. Bạn có thể yên tâm tiếp tục code tính năng mà không lo merge conflict.
                    </p>
                  </div>
                </div>
              )}

              {/* Local Working Tree Files */}
              {localMember?.uncommittedFiles && localMember.uncommittedFiles.length > 0 && (
                <div className="p-4 rounded-xl border border-hub bg-hub-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-hub-primary flex items-center gap-2">
                      <FileCode className="h-4 w-4 text-sky-500" />
                      Danh sách file bạn đang sửa trên máy ({localMember.uncommittedFiles.length} file)
                    </span>
                    <span className="text-[11px] text-hub-muted">Chưa commit vào git</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {localMember.uncommittedFiles.map((file, idx) => {
                      const isClashed = gitOverlaps.some((o) => o.filePath.toLowerCase() === file.path.toLowerCase());
                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-2 rounded-lg border font-mono text-[11px] ${
                            isClashed
                              ? 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold'
                              : 'border-hub bg-hub-canvas/40 text-hub-primary'
                          }`}
                        >
                          <span className="truncate pr-2">{file.path}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                            isClashed ? 'bg-red-500 text-white' : 'bg-black/[0.05] dark:bg-white/[0.08] text-hub-muted'
                          }`}>
                            {isClashed ? 'Xung đột!' : file.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BẢNG NHÁNH TÍNH NĂNG & ACTIVE BRANCHES */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-hub-primary uppercase tracking-wide">
                    Tất cả nhánh tính năng đang hoạt động trong Team
                  </h3>
                  <p className="text-[11px] text-hub-secondary mt-0.5">
                    Dành cho Lead & Thành viên nắm bắt tiến độ commit và độ trôi nhánh so với <code>main</code>
                  </p>
                </div>

                <div className="w-56">
                  <input
                    type="text"
                    placeholder="Tìm theo tên thành viên, branch..."
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    className="w-full h-8 px-3 rounded-lg border border-hub bg-hub-card text-xs text-hub-primary placeholder:text-hub-muted focus:outline-none focus:border-[var(--hub-accent)]"
                  />
                </div>
              </div>

              {/* Members Branch Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredMembers.map((member) => {
                  const isBehindSevere = member.behind >= 3;
                  const isOverlapping = gitOverlaps.some(
                    (o) => o.peerNodeId === member.nodeId || (member.isSelf && gitOverlaps.length > 0)
                  );

                  return (
                    <div
                      key={member.nodeId}
                      className={`p-4 rounded-xl border bg-hub-card shadow-xs transition-all space-y-3 ${
                        isOverlapping
                          ? 'border-red-500/40 bg-red-500/[0.02]'
                          : isBehindSevere
                          ? 'border-amber-500/40 bg-amber-500/[0.02]'
                          : 'border-hub hover:border-hub-primary/30'
                      }`}
                    >
                      {/* Top: Member Info & Self Tag */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${
                            member.isSelf ? 'bg-[var(--hub-accent)] text-white' : 'bg-black/[0.06] dark:bg-white/[0.08] text-hub-primary'
                          }`}>
                            {member.username.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-hub-primary">
                                {member.nodeName}
                              </span>
                              {member.isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400">
                                  Tôi
                                </span>
                              )}
                              {member.isSimulated && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-mono bg-purple-500/15 text-purple-600 dark:text-purple-400">
                                  Demo
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-hub-muted">{member.ip}</span>
                          </div>
                        </div>

                        {/* Status Tag */}
                        {isOverlapping ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 animate-pulse border border-red-500/30">
                            Trùng file
                          </span>
                        ) : isBehindSevere ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                            Cần rebase
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            Đồng bộ tốt
                          </span>
                        )}
                      </div>

                      {/* Middle: Active Branch & Ahead/Behind Counters */}
                      <div className="p-2.5 rounded-lg border border-hub bg-hub-canvas/40 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GitBranch className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                          <span className="font-mono font-bold text-hub-primary truncate" title={member.branch}>
                            {member.branch}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold" title="Commit mới hơn main">
                            +{member.ahead}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${
                            member.behind > 0
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              : 'bg-black/[0.04] dark:bg-white/[0.06] text-hub-muted'
                          }`} title="Commit bị tụt lại so với main">
                            -{member.behind}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Last Commit & Uncommitted files */}
                      <div className="space-y-1.5 text-[11px] text-hub-secondary">
                        {member.lastCommit ? (
                          <div className="flex items-start gap-1.5 truncate">
                            <GitCommit className="h-3.5 w-3.5 text-hub-muted shrink-0 mt-0.5" />
                            <span className="font-mono text-[10px] text-hub-muted shrink-0">
                              [{member.lastCommit.hash}]
                            </span>
                            <span className="truncate text-hub-primary" title={member.lastCommit.message}>
                              {member.lastCommit.message}
                            </span>
                          </div>
                        ) : (
                          <div className="text-hub-muted">Chưa có thông tin commit gần nhất</div>
                        )}

                        <div className="flex items-center justify-between pt-1 border-t border-hub text-[10px] text-hub-muted">
                          <span>
                            Đang sửa:{' '}
                            <strong className="text-hub-primary font-semibold">
                              {member.uncommittedFiles?.length || 0} file
                            </strong>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(member.updatedAt).toLocaleTimeString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 1-CLICK PRE-PR QUALITY GATE */}
          {activeTab === 'pre-pr' && (
            <div className="space-y-5">
              {/* Introduction Banner */}
              <div className="p-4 rounded-xl border border-hub bg-hub-canvas/60 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-hub-primary">
                      Pre-PR Quality Gate (Tự động kiểm định trước khi gửi PR)
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[var(--hub-accent)]/15 text-[var(--hub-accent)] font-semibold">
                      {localMember?.branch || 'main'} ➔ main
                    </span>
                  </div>
                  <p className="text-xs text-hub-secondary">
                    Chạy typecheck biên dịch TypeScript, kiểm tra độ sạch working tree và tính bắt kịp nhánh chính trước khi gửi link cho Tech Lead review.
                  </p>
                </div>

                <button
                  onClick={() => runPrePRQualityGate()}
                  disabled={isPrePRChecking}
                  className="fluent-btn-primary flex items-center gap-2 px-4 py-2 text-xs font-bold shadow-sm"
                >
                  {isPrePRChecking ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>Chạy Kiểm Định (1-Click)</span>
                    </>
                  )}
                </button>
              </div>

              {/* REPORT GATES */}
              {prePRCheckResult ? (
                <div className="space-y-4">
                  {/* Summary Box */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                    prePRCheckResult.isReadyForPR
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  }`}>
                    <div className="flex items-center gap-3">
                      {prePRCheckResult.isReadyForPR ? (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide">
                          {prePRCheckResult.isReadyForPR ? 'ĐÃ VƯỢT QUA TẤT CẢ TIÊU CHUẨN' : 'CẦN CHÚ Ý MỘT SỐ VẤN ĐỀ'}
                        </h4>
                        <p className="text-xs mt-0.5">{prePRCheckResult.summary}</p>
                      </div>
                    </div>

                    {prePRCheckResult.prCompareUrl && (
                      <button
                        onClick={() => openGitHubPRUrl(prePRCheckResult.prCompareUrl!)}
                        className={`fluent-btn-primary flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold shrink-0 ${
                          !prePRCheckResult.isReadyForPR ? 'opacity-80' : ''
                        }`}
                        title="Mở trình duyệt trực tiếp vào trang GitHub Compare PR"
                      >
                        <span>Tạo PR trên GitHub</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Gates Cards */}
                  <div className="space-y-3">
                    {prePRCheckResult.gates.map((gate) => {
                      const isPassed = gate.status === 'passed';
                      const isFailed = gate.status === 'failed';
                      const isWarning = gate.status === 'warning';

                      return (
                        <div
                          key={gate.id}
                          className="p-4 rounded-xl border border-hub bg-hub-card shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isPassed && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                              {isFailed && <AlertTriangle className="h-4 w-4 text-red-500" />}
                              {isWarning && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                              <span className="text-xs font-bold text-hub-primary">{gate.title}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              {gate.durationMs !== undefined && (
                                <span className="text-[10px] text-hub-muted font-mono">{gate.durationMs}ms</span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                isPassed
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : isFailed
                                  ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}>
                                {gate.status}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-hub-secondary">{gate.message}</p>

                          {gate.details && gate.details.length > 0 && (
                            <div className="p-2.5 rounded-lg border border-hub bg-black/[0.03] dark:bg-white/[0.04] font-mono text-[11px] text-hub-primary space-y-1 overflow-x-auto">
                              {gate.details.map((detail, dIdx) => (
                                <div key={dIdx} className="leading-tight">{detail}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Initial prompt state before test run */
                <div className="p-8 rounded-xl border border-hub bg-hub-card text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-sky-500/10 text-sky-500 mx-auto flex items-center justify-center">
                    <GitPullRequest className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-hub-primary">
                      Sẵn sàng chạy Pre-PR Quality Gate
                    </h3>
                    <p className="text-xs text-hub-secondary max-w-md mx-auto mt-1 leading-relaxed">
                      Bấm nút <strong>"Chạy Kiểm Định (1-Click)"</strong> để hệ thống tự động chạy toàn bộ bài kiểm tra TypeScript, trạng thái Git và tạo đường dẫn mở Pull Request chính xác lên GitHub.
                    </p>
                  </div>
                  <button
                    onClick={() => runPrePRQualityGate()}
                    className="fluent-btn-primary px-4 py-2 text-xs font-bold inline-flex items-center gap-2 mx-auto"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>Bắt đầu kiểm định ngay</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-hub bg-hub-sidebar shrink-0 text-xs">
          <div className="flex items-center gap-2 text-hub-secondary">
            <span className="font-semibold text-hub-primary">LAN P2P ZeroConf:</span>
            <span>Tự động phát hiện các máy trạm cùng mở repo trên mạng nội bộ</span>
          </div>

          <button
            onClick={() => setIsGitCollabRadarOpen(false)}
            className="fluent-btn-standard px-4 py-1.5 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
