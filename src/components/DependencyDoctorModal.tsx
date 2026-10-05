import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  X, 
  RefreshCw, 
  Wrench, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Terminal, 
  Package 
} from 'lucide-react';
import type { DependencyAuditReport, VulnerabilityItem } from '../types';

interface DependencyDoctorModalProps {
  project: { id: string; name: string } | null;
  onClose: () => void;
}

export const DependencyDoctorModal: React.FC<DependencyDoctorModalProps> = ({ project, onClose }) => {
  const [report, setReport] = useState<DependencyAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixOutput, setFixOutput] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const scanProject = async () => {
    if (!project) return;
    setLoading(true);
    setFixOutput(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/doctor`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      console.error('Scan project failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project) {
      scanProject();
    }
  }, [project]);

  const handleFix = async () => {
    if (!project) return;
    setFixing(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/doctor/fix`, { method: 'POST' });
      const data = await res.json();
      setFixOutput(data.output || 'Hoàn tất cập nhật.');
      // Auto re-scan
      await scanProject();
    } catch (e: any) {
      setFixOutput(`Lỗi: ${e.message}`);
    } finally {
      setFixing(false);
    }
  };

  if (!project) return null;

  const summary = report?.summary || { critical: 0, high: 0, moderate: 0, low: 0, info: 0, total: 0 };
  const vulns = report?.vulnerabilities || [];

  // Calculate Health Score (100 base)
  let healthScore = 100;
  healthScore -= summary.critical * 30;
  healthScore -= summary.high * 15;
  healthScore -= summary.moderate * 5;
  healthScore -= summary.low * 1;
  healthScore = Math.max(0, Math.min(100, healthScore));

  const filteredVulns = vulns.filter((v) => {
    if (activeFilter === 'all') return true;
    return v.severity === activeFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-4xl max-h-[85vh] rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-hub px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${
              summary.critical > 0
                ? 'bg-rose-500/10 text-rose-500 ring-rose-500/20'
                : summary.high > 0
                ? 'bg-amber-500/10 text-amber-500 ring-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20'
            }`}>
              {summary.critical > 0 ? (
                <ShieldX className="h-5 w-5" />
              ) : summary.high > 0 ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-hub-primary">Dependency & Lockfile Doctor</h2>
                <span className="rounded bg-black/[0.05] dark:bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-hub-primary">
                  {project.name}
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Kiểm tra an toàn bảo mật dependencies qua npm audit & kiểm tra tính toàn vẹn của lockfile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={scanProject}
              disabled={loading || fixing}
              className="fluent-btn-standard h-8 px-2.5 text-xs gap-1.5"
              title="Quét lại dependencies"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Quét lại</span>
            </button>
            <button
              onClick={onClose}
              className="fluent-icon-btn h-8 w-8 text-hub-muted hover:text-hub-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Health Score & Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-hub bg-black/[0.01] dark:bg-white/[0.01] divide-x divide-hub p-4 text-xs">
          {/* Health Score */}
          <div className="flex flex-col items-center justify-center p-2 text-center">
            <span className="text-[11px] text-hub-muted font-medium uppercase">Điểm An Toàn</span>
            <div className={`text-2xl font-black mt-0.5 ${
              healthScore >= 90 ? 'text-emerald-500' : healthScore >= 70 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {healthScore}%
            </div>
            <span className="text-[10px] text-hub-muted">
              {healthScore >= 90 ? 'Rất tốt' : healthScore >= 70 ? 'Cảnh báo' : 'Nguy hiểm'}
            </span>
          </div>

          {/* Critical */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'critical' ? 'all' : 'critical')}
            className={`cursor-pointer flex flex-col items-center justify-center p-2 text-center rounded transition-colors ${
              activeFilter === 'critical' ? 'bg-rose-500/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-[11px] text-rose-500 font-bold uppercase">Critical</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {summary.critical}
            </div>
            <span className="text-[10px] text-hub-muted">Lỗ hổng nghiêm trọng</span>
          </div>

          {/* High */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'high' ? 'all' : 'high')}
            className={`cursor-pointer flex flex-col items-center justify-center p-2 text-center rounded transition-colors ${
              activeFilter === 'high' ? 'bg-amber-500/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-[11px] text-amber-500 font-bold uppercase">High</span>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {summary.high}
            </div>
            <span className="text-[10px] text-hub-muted">Mức độ cao</span>
          </div>

          {/* Moderate & Low */}
          <div
            onClick={() => setActiveFilter(activeFilter === 'moderate' ? 'all' : 'moderate')}
            className={`cursor-pointer flex flex-col items-center justify-center p-2 text-center rounded transition-colors ${
              activeFilter === 'moderate' ? 'bg-blue-500/10' : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
            }`}
          >
            <span className="text-[11px] text-blue-500 font-bold uppercase">Moderate / Low</span>
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
              {summary.moderate + summary.low}
            </div>
            <span className="text-[10px] text-hub-muted">Mức độ vừa & thấp</span>
          </div>

          {/* Total Packages */}
          <div className="flex flex-col items-center justify-center p-2 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] text-hub-muted font-medium uppercase">Phụ Thuộc</span>
            <div className="text-xl font-bold text-hub-primary mt-0.5">
              {report?.totalDependencies || 0}
            </div>
            <span className="text-[10px] text-hub-muted">Packages đã cài</span>
          </div>
        </div>

        {/* Lockfile & 1-Click Fix Bar */}
        <div className="flex items-center justify-between border-b border-hub bg-black/[0.02] dark:bg-white/[0.02] px-6 py-3 text-xs">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-purple-500" />
            <span className="text-hub-muted">Lockfile Status:</span>
            {report?.lockfileStatus.lockfileType === 'conflicting' ? (
              <span className="flex items-center gap-1 font-semibold text-rose-500">
                <AlertTriangle className="h-3.5 w-3.5" />
                Xung đột nhiều file ({report.lockfileStatus.files.join(', ')})
              </span>
            ) : report?.lockfileStatus.hasLockfile ? (
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Chuẩn hóa {report.lockfileStatus.lockfileType?.toUpperCase()} ({report.lockfileStatus.files[0]})
              </span>
            ) : (
              <span className="text-amber-500 font-medium">Chưa có lockfile</span>
            )}
          </div>

          <button
            onClick={handleFix}
            disabled={fixing || loading || summary.total === 0}
            className="fluent-btn-primary h-8 px-3.5 text-xs font-semibold gap-1.5 shadow-xs"
            title="Tự động chạy npm audit fix để cập nhật package an toàn"
          >
            <Wrench className={`h-3.5 w-3.5 ${fixing ? 'animate-spin' : ''}`} />
            <span>{fixing ? 'Đang tự động sửa...' : '1-Click Audit & Fix'}</span>
          </button>
        </div>

        {/* Body: Vulnerabilities List or Terminal Output */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {fixOutput && (
            <div className="rounded-xl border border-hub bg-[#181818] p-4 text-xs font-mono text-neutral-300">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-700 mb-2">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Terminal className="h-3.5 w-3.5" />
                  Kết quả thực thi "npm audit fix":
                </span>
                <button onClick={() => setFixOutput(null)} className="text-neutral-400 hover:text-white">
                  Đóng log
                </button>
              </div>
              <pre className="whitespace-pre-wrap max-h-48 overflow-y-auto">{fixOutput}</pre>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-xs text-hub-muted">
              <RefreshCw className="h-6 w-6 animate-spin mb-2 text-[var(--hub-accent)]" />
              <span>Đang kiểm tra lỗ hổng bảo mật và dependencies...</span>
            </div>
          ) : vulns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-hub p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-hub-primary">Dependencies Tuyệt Đối An Toàn</h3>
              <p className="mt-1 text-xs text-hub-muted">
                Không tìm thấy lỗ hổng bảo mật nào trong gói cài đặt dự án này.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-hub-muted">
                <span>Hiển thị {filteredVulns.length} / {vulns.length} mục</span>
                {activeFilter !== 'all' && (
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="text-[var(--hub-accent)] hover:underline"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {filteredVulns.map((v) => {
                  const isCritical = v.severity === 'critical';
                  const isHigh = v.severity === 'high';
                  return (
                    <div
                      key={v.id}
                      className="rounded-lg border border-hub bg-hub-card p-3.5 text-xs transition-all hover:border-[var(--hub-accent)]/40"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-hub-muted" />
                          <span className="font-bold text-hub-primary text-sm">{v.name}</span>
                          <span className="font-mono text-[11px] text-hub-muted bg-black/[0.04] dark:bg-white/[0.04] px-1.5 py-0.2 rounded">
                            {v.range}
                          </span>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            isCritical
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                              : isHigh
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {v.severity}
                        </span>
                      </div>

                      <p className="text-hub-primary font-medium text-xs mb-2">
                        {v.title}
                      </p>

                      <div className="flex items-center justify-between border-t border-hub pt-2 text-[11px] text-hub-muted">
                        <div>
                          {v.fixAvailable ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Khắc phục: {typeof v.fixAvailable === 'string' ? v.fixAvailable : 'Có bản vá'}
                            </span>
                          ) : (
                            <span className="text-neutral-400">Chưa có bản vá tự động</span>
                          )}
                        </div>

                        {v.url && (
                          <a
                            href={v.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[var(--hub-accent)] hover:underline"
                          >
                            <span>Chi tiết CVE</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
