import React, { useState, useEffect } from 'react';
import { Sparkles, X, Copy, Check, Terminal, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import type { AIDiagnosisResult } from '../types';
import { sendFluentToast } from '../utils/notifications';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLogText?: string;
  projectName?: string;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({
  isOpen,
  onClose,
  initialLogText = '',
  projectName = 'Ứng dụng',
}) => {
  const [logText, setLogText] = useState(initialLogText);
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<AIDiagnosisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const runDiagnosis = async (textToDiagnose?: string) => {
    const text = textToDiagnose !== undefined ? textToDiagnose : logText;
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logText: text, projectName }),
      });
      if (res.ok) {
        const data = await res.json();
        setDiagnosis(data);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialLogText) {
        setLogText(initialLogText);
        runDiagnosis(initialLogText);
      } else {
        setDiagnosis(null);
      }
    }
  }, [isOpen, initialLogText]);

  const copyFixCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    sendFluentToast('Đã sao chép lệnh', 'Lệnh sửa lỗi đã được lưu vào clipboard.', 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-lg border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[6px] bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-xs">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-hub-primary flex items-center gap-2">
                AI Terminal Copilot & Error Diagnostics
              </h3>
              <p className="text-[12px] text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Tự động chẩn đoán và đề xuất cách khắc phục lỗi 1-Click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-[4px] text-hub-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-hub-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Input text / stack trace */}
          <div>
            <label className="block text-xs font-semibold text-hub-secondary mb-1 flex items-center justify-between">
              <span>Đoạn mã lỗi / Stack Trace cần chẩn đoán:</span>
              <button
                onClick={() => runDiagnosis()}
                disabled={loading || !logText.trim()}
                className="text-[11px] text-[var(--hub-accent)] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Phân tích lại</span>
              </button>
            </label>
            <textarea
              rows={3}
              value={logText}
              onChange={(e) => setLogText(e.target.value)}
              placeholder="Dán log lỗi terminal tại đây (VD: EADDRINUSE: 3000, Cannot find module 'axios', ECONNREFUSED...)"
              className="w-full rounded border border-hub bg-[#1E1E1E] text-neutral-200 p-2.5 font-mono text-xs focus:border-[var(--hub-accent)] focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-hub-muted">
              <Sparkles className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-500" />
              AI Copilot đang phân tích mã lỗi và tìm giải pháp khắc phục...
            </div>
          ) : diagnosis ? (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* Diagnosis Summary Card */}
              <div className="rounded-lg border border-purple-500/30 bg-purple-500/[0.04] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 items-center px-2 rounded font-mono text-[11px] font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">
                      {diagnosis.errorType}
                    </span>
                    <span className="text-sm font-bold text-hub-primary">{diagnosis.title}</span>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    Độ tin cậy: {Math.round(diagnosis.confidence * 100)}%
                  </span>
                </div>

                <p className="text-xs text-hub-secondary leading-relaxed">
                  {diagnosis.summary}
                </p>

                <div className="rounded bg-black/[0.03] dark:bg-white/[0.04] p-2.5 text-xs">
                  <strong className="text-hub-primary block mb-0.5">Nguyên nhân gốc rễ (Root Cause):</strong>
                  <span className="text-hub-muted">{diagnosis.rootCause}</span>
                </div>
              </div>

              {/* Fix Command & Explanation */}
              {diagnosis.fixCommand && (
                <div className="rounded-lg border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-3.5 space-y-2">
                  <div className="text-xs font-bold text-hub-primary flex items-center justify-between">
                    <span>Lệnh khắc phục đề xuất:</span>
                    <button
                      onClick={() => copyFixCommand(diagnosis.fixCommand!)}
                      className="fluent-btn-standard h-6 px-2 text-[11px] flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">Đã copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy Lệnh</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="rounded bg-[#1E1E1E] text-emerald-400 p-2.5 font-mono text-xs overflow-x-auto select-all">
                    $ {diagnosis.fixCommand}
                  </div>

                  <div className="text-[11px] text-hub-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: diagnosis.fixExplanation }} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-hub-muted">
              Nhập hoặc dán đoạn log lỗi ở trên rồi bấm <strong>Phân tích lại</strong> để nhận chẩn đoán từ AI.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Tip: Tự động bắt lỗi khi click vào nút <strong>✨ AI Explain</strong> trong Terminal
          </span>
          <button
            onClick={onClose}
            className="fluent-btn-standard h-8 px-4 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
