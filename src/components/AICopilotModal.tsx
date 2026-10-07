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

  const SAMPLE_ERRORS = [
    { label: 'EADDRINUSE (Port Conflict)', text: `Error: listen EADDRINUSE: address already in use :::3000\n    at Server.setupListenHandle [as _listen2] (node:net:1872:16)\n    at listenInCluster (node:net:1920:12)` },
    { label: 'MODULE_NOT_FOUND', text: `Error: Cannot find module 'axios'\nRequire stack:\n- C:\\Users\\vohoa\\app\\server.js\n    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)` },
    { label: 'ECONNREFUSED (DB down)', text: `AggregateError [ECONNREFUSED]: connect ECONNREFUSED 127.0.0.1:5432\n    at internalConnect (node:net:1086:16)\n    at defaultTriggerAsyncIdScope (node:async_hooks:464:18)` },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-100">
      <div className="w-full max-w-5xl rounded-xl border border-hub bg-hub-card shadow-2xl overflow-hidden flex flex-col max-h-[88vh] min-[1440px]:w-[80vw] min-[1440px]:max-w-[80vw] min-[1440px]:h-[90vh] min-[1440px]:max-h-[90vh] modal-extension-large">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-hub bg-hub-sidebar">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-hub-primary">
                  AI Terminal Copilot & Error Diagnostics
                </h3>
                <span className="rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-[11px] font-semibold">
                  Intelligent Debugger
                </span>
              </div>
              <p className="text-xs text-hub-muted">
                Dự án: <strong className="text-hub-primary">{projectName}</strong> • Tự động chẩn đoán lỗi terminal, phân tích nguyên nhân gốc rễ và đề xuất cách khắc phục 1-Click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-hub-muted hover:bg-black/[0.05] dark:hover:bg-white/[0.06] hover:text-hub-primary transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Content Body: 2 Columns */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Log Input & Preset Samples (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-hub-secondary uppercase tracking-wider">
                    Log Lỗi / Stack Trace
                  </label>
                  <button
                    onClick={() => runDiagnosis()}
                    disabled={loading || !logText.trim()}
                    className="fluent-btn-standard h-7 px-2.5 text-[11px] font-semibold text-[var(--hub-accent)] flex items-center gap-1"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    <span>Phân tích</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  placeholder="Dán log lỗi terminal tại đây (VD: EADDRINUSE: 3000, Cannot find module 'axios', ECONNREFUSED...)"
                  className="w-full rounded-lg border border-hub bg-[#1E1E1E] text-neutral-200 p-3 font-mono text-xs focus:border-[var(--hub-accent)] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Quick error presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-hub-muted uppercase tracking-wider block">
                  Dán nhanh mẫu lỗi phổ biến:
                </span>
                <div className="flex flex-col gap-1.5">
                  {SAMPLE_ERRORS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setLogText(s.text);
                        runDiagnosis(s.text);
                      }}
                      className="text-left px-3 py-2 rounded-md border border-hub bg-black/[0.01] dark:bg-white/[0.02] hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-xs font-medium text-hub-secondary transition-colors"
                    >
                      ⚡ {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: AI Diagnosis & Fix (7 cols) */}
            <div className="lg:col-span-7">
              {loading ? (
                <div className="py-20 text-center text-hub-muted border border-hub rounded-xl bg-black/[0.01] dark:bg-white/[0.01]">
                  <Sparkles className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-500" />
                  <p className="text-sm font-semibold text-hub-primary">AI Copilot đang phân tích mã lỗi...</p>
                  <p className="text-xs text-hub-muted mt-1">Đang suy luận nguyên nhân gốc rễ và tạo lệnh sửa lỗi an toàn</p>
                </div>
              ) : diagnosis ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Diagnosis Summary Card */}
                  <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.04] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 items-center px-2.5 rounded font-mono text-xs font-bold bg-purple-500/20 text-purple-600 dark:text-purple-400">
                          {diagnosis.errorType}
                        </span>
                        <span className="text-base font-bold text-hub-primary">{diagnosis.title}</span>
                      </div>

                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        Độ tin cậy: {Math.round(diagnosis.confidence * 100)}%
                      </span>
                    </div>

                    <p className="text-xs text-hub-secondary leading-relaxed">
                      {diagnosis.summary}
                    </p>

                    <div className="rounded-lg bg-black/[0.03] dark:bg-white/[0.04] p-3 text-xs border border-hub-subtle">
                      <strong className="text-hub-primary block mb-1">Nguyên nhân gốc rễ (Root Cause):</strong>
                      <span className="text-hub-muted leading-relaxed block">{diagnosis.rootCause}</span>
                    </div>
                  </div>

                  {/* Fix Command & Explanation */}
                  {diagnosis.fixCommand && (
                    <div className="rounded-xl border border-hub bg-black/[0.02] dark:bg-white/[0.02] p-4 space-y-3">
                      <div className="text-xs font-bold text-hub-primary flex items-center justify-between">
                        <span>Lệnh khắc phục đề xuất (Recommended Action):</span>
                        <button
                          onClick={() => copyFixCommand(diagnosis.fixCommand!)}
                          className="fluent-btn-standard h-7 px-3 text-xs flex items-center gap-1.5 font-semibold"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Đã copy</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy Lệnh</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="rounded-lg bg-[#1E1E1E] text-emerald-400 p-3 font-mono text-xs overflow-x-auto select-all border border-neutral-800 shadow-inner">
                        $ {diagnosis.fixCommand}
                      </div>

                      <div className="text-xs text-hub-muted leading-relaxed p-1" dangerouslySetInnerHTML={{ __html: diagnosis.fixExplanation }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-24 text-xs text-hub-muted border border-dashed border-hub rounded-xl">
                  <Sparkles className="h-8 w-8 mx-auto text-purple-400/50 mb-2" />
                  Nhập hoặc chọn mẫu log lỗi ở bên trái rồi bấm <strong>Phân tích</strong> để nhận chẩn đoán từ AI.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-hub bg-hub-sidebar">
          <span className="text-xs text-hub-muted">
            Mẹo: Tự động gửi lỗi vào Copilot khi click vào nút <strong>✨ AI Explain</strong> trong Terminal console
          </span>
          <button
            onClick={onClose}
            className="fluent-btn-primary h-8 px-5 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
