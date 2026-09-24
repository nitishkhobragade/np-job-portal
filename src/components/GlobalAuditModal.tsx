"use client";

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Edit3,
  Globe,
  Check
} from 'lucide-react';
import { PostRecord } from '../types';
import { PostAuditResult } from '../lib/recruitmentIntelligence';

interface GlobalAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  scanProgress?: string;
  auditResults: PostAuditResult[];
  onApplyFix: (jobId: string, patch: Partial<PostRecord>) => Promise<boolean>;
  onOpenInEditor: (jobId: string) => void;
  onRetry: () => void;
  errorMessage?: string | null;
}

export const GlobalAuditModal: React.FC<GlobalAuditModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  scanProgress,
  auditResults,
  onApplyFix,
  onOpenInEditor,
  onRetry,
  errorMessage
}) => {
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const totalScanned = auditResults.length;
  const verifiedHealthy = auditResults.filter((r) => r.healthScore >= 85).length;
  const problematicPosts = auditResults.filter((r) => r.healthScore < 85);

  const handleApplySingleFix = async (result: PostAuditResult) => {
    if (!result.suggestedPatch || Object.keys(result.suggestedPatch).length === 0) return;
    try {
      setApplyingJobId(result.jobId);
      const success = await onApplyFix(result.jobId, result.suggestedPatch);
      if (success) {
        setAppliedJobs((prev) => ({ ...prev, [result.jobId]: true }));
      }
    } finally {
      setApplyingJobId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>AI Global Audit & Fact-Checking Engine</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Google Search Grounded
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                लाइव सरकारी पोर्टल (.gov.in, .nic.in, MPESB) से रीयल-टाइम डेटा सत्यापन
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {/* Loading State */}
          {isLoading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-400 animate-spin" />
                <Globe className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">
                  इंटरनेट फैक्ट-चेकिंग जारी है (Live Internet Audit)...
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {scanProgress ||
                    'Gemini 2.5 Flash आधिकारिक सरकारी सर्कुलर्स और पोर्टल वेबसाइट्स से तिथियों व अधिसूचनाओं का मिलान कर रहा है...'}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-full border border-slate-800 text-[11px] text-amber-300 font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>MPESB • MPOnline • SSC • UPSC • RRB • NTA Grounding</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">सत्यापन के दौरान त्रुटि आई</h4>
                  <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={onRetry}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>पुनः प्रयास करें (Retry)</span>
              </button>
            </div>
          )}

          {/* Results State */}
          {!isLoading && !errorMessage && (
            <>
              {/* Summary Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Scanned */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-medium">कुल पोस्ट्स जांची गईं</span>
                    <h3 className="text-2xl font-black text-white mt-0.5">{totalScanned}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    <Globe className="w-5 h-5" />
                  </div>
                </div>

                {/* Verified Healthy */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-emerald-300 font-medium">पूर्णतः सत्यापित (Healthy)</span>
                    <h3 className="text-2xl font-black text-emerald-400 mt-0.5">{verifiedHealthy}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                {/* Needing Attention */}
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-300 font-medium">सुधार अपेक्षित (Need Attention)</span>
                    <h3 className="text-2xl font-black text-amber-400 mt-0.5">{problematicPosts.length}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-900/60 border border-amber-700/60 flex items-center justify-center text-amber-300">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* No Issues Found */}
              {problematicPosts.length === 0 && totalScanned > 0 && (
                <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-emerald-900/60 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-emerald-300">सभी पोस्ट्स 100% सत्यापित हैं!</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    पोर्टल पर उपलब्ध सभी भर्तियों की तिथियां, पद संख्या, और नोटिफिकेशन यूआरएल आधिकारिक सरकारी स्त्रोतों से मेल खाते हैं।
                  </p>
                </div>
              )}

              {/* Problematic Posts List */}
              {problematicPosts.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>विसंगति युक्त पोस्ट्स (Inconsistency Breakdown - {problematicPosts.length})</span>
                    </h3>
                    <span className="text-xs text-slate-400">
                      नीचे दिए गए सुझावों को एक क्लिक में लागू करें
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {problematicPosts.map((postAudit) => {
                      const isFixApplied = appliedJobs[postAudit.jobId];
                      const isApplying = applyingJobId === postAudit.jobId;

                      return (
                        <div
                          key={postAudit.jobId}
                          className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 transition-colors hover:border-slate-700"
                        >
                          {/* Post Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                                  ID: {postAudit.jobId}
                                </span>
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    postAudit.statusBadge === 'critical'
                                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                                      : 'bg-amber-950 text-amber-300 border-amber-800'
                                  }`}
                                >
                                  Health Score: {postAudit.healthScore}%
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1">
                                {postAudit.title}
                              </h4>
                            </div>

                            {/* Actions for this post */}
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => onOpenInEditor(postAudit.jobId)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="एडिटर में खोलें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Open in Editor</span>
                              </button>

                              {isFixApplied ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 text-xs font-bold">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>सुधार लागू हुआ</span>
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleApplySingleFix(postAudit)}
                                  disabled={isApplying}
                                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                                >
                                  {isApplying ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      <span>लागू हो रहा है...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Apply Suggested Fixes</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Specific issues identified */}
                          {postAudit.issues && postAudit.issues.length > 0 && (
                            <div className="space-y-1.5">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                पाई गई विसंगतियां (Issues Detected):
                              </span>
                              <div className="space-y-1">
                                {postAudit.issues.map((issue, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800"
                                  >
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                                        issue.severity === 'critical'
                                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                                      }`}
                                    >
                                      {issue.field}
                                    </span>
                                    <span className="text-slate-200">{issue.issue}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Side-by-side comparison: Current Portal Data vs AI-Verified Ground Truth */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                            {/* Current Data */}
                            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs">
                              <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Current Portal Data (पोर्टल पर उपलब्ध)
                              </span>
                              <div className="text-slate-300 text-[11px] space-y-1 font-mono">
                                <div>
                                  <span className="text-slate-500">Dates: </span>
                                  <span>{postAudit.diagnosticBreakdown.timeline.currentValue || 'अंतिम तिथि मिलान आवश्यक'}</span>
                                </div>
                                <div className="truncate">
                                  <span className="text-slate-500">Source: </span>
                                  <span>{postAudit.diagnosticBreakdown.officialSource.details}</span>
                                </div>
                              </div>
                            </div>

                            {/* Ground Truth */}
                            <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-900/50 space-y-1 text-xs">
                              <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                AI-Verified Ground Truth (आधिकारिक स्त्रोत अनुसार)
                              </span>
                              <div className="text-emerald-200 text-[11px] space-y-1 font-mono">
                                <div>
                                  <span className="text-emerald-500/80">Verified Dates: </span>
                                  <span>
                                    {postAudit.suggestedPatch.lastDate ||
                                      postAudit.diagnosticBreakdown.timeline.verifiedEnd ||
                                      'शीघ्र उपलब्ध / Announced Soon'}
                                  </span>
                                </div>
                                <div className="truncate">
                                  <span className="text-emerald-500/80">Official Notice: </span>
                                  <span>
                                    {postAudit.suggestedPatch.notificationPdf ||
                                      postAudit.diagnosticBreakdown.officialSource.verifiedPdfUrl ||
                                      'अधिकृत circular verified'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Grounding Source citations */}
                          {postAudit.groundingSources && postAudit.groundingSources.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-slate-400">
                              <span className="text-slate-500">प्रमाणित स्त्रोत:</span>
                              {postAudit.groundingSources.slice(0, 3).map((src, i) => (
                                <a
                                  key={i}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-400 hover:underline max-w-[200px] truncate"
                                >
                                  <span>{src.title}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>AI Verification Engine • Powered by Gemini 2.5 Flash Grounding</span>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && (
              <button
                onClick={onRetry}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>री-स्कैन करें</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              बंद करें (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
