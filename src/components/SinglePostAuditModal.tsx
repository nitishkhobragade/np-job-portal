"use client";

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  FileText,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Check,
  Globe,
  Award,
  DollarSign
} from 'lucide-react';
import { PostRecord } from '../types';
import { PostAuditResult } from '../lib/recruitmentIntelligence';

interface SinglePostAuditModalProps {
  job: PostRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  auditResult: PostAuditResult | null;
  onApplyFix: (jobId: string, patch: Partial<PostRecord>) => Promise<boolean>;
  onRetry: () => void;
  errorMessage?: string | null;
}

export const SinglePostAuditModal: React.FC<SinglePostAuditModalProps> = ({
  job,
  isOpen,
  onClose,
  isLoading,
  auditResult,
  onApplyFix,
  onRetry,
  errorMessage
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessfully, setAppliedSuccessfully] = useState(false);

  if (!isOpen || !job) return null;

  const handleApplyFix = async () => {
    if (!auditResult?.suggestedPatch || Object.keys(auditResult.suggestedPatch).length === 0) return;
    try {
      setIsApplying(true);
      const success = await onApplyFix(job.id, auditResult.suggestedPatch);
      if (success) {
        setAppliedSuccessfully(true);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const healthScore = auditResult?.healthScore || 0;
  const isHealthy = healthScore >= 85;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  AI Deep Audit & Fact-Check
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Live Search Grounding
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-md">
                {job.title}
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
                  आधिकारिक वेबसाइट्स पर सत्यापन जारी है...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Google Search Grounding के माध्यम से .gov.in व .nic.in पर भर्ती अधिसूचना का परीक्षण किया जा रहा है।
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!isLoading && errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">सत्यापन नहीं हो सका</h4>
                  <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={onRetry}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>पुनः प्रयास करें</span>
              </button>
            </div>
          )}

          {/* Audit Loaded State */}
          {!isLoading && !errorMessage && auditResult && (
            <div className="space-y-5">
              {/* Score & Health Badge Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isHealthy
                    ? 'bg-emerald-950/30 border-emerald-800/60'
                    : auditResult.statusBadge === 'critical'
                    ? 'bg-rose-950/30 border-rose-800/60'
                    : 'bg-amber-950/30 border-amber-800/60'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black border shadow-lg ${
                      isHealthy
                        ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                        : auditResult.statusBadge === 'critical'
                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : 'bg-amber-950 border-amber-500 text-amber-300'
                    }`}
                  >
                    <span className="text-lg leading-none">{healthScore}%</span>
                    <span className="text-[9px] uppercase font-bold tracking-wider mt-0.5">Score</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">
                        {isHealthy
                          ? 'सत्यापित एवं सुरक्षित (Fully Verified)'
                          : auditResult.statusBadge === 'critical'
                          ? 'गंभीर विसंगति (Critical Mismatch)'
                          : 'पुष्टि / सुधार अपेक्षित (Attention Needed)'}
                      </h3>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isHealthy
                            ? 'bg-emerald-900/60 text-emerald-300 border-emerald-700'
                            : auditResult.statusBadge === 'critical'
                            ? 'bg-rose-900/60 text-rose-300 border-rose-700'
                            : 'bg-amber-900/60 text-amber-300 border-amber-700'
                        }`}
                      >
                        {auditResult.statusBadge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">{auditResult.summary}</p>
                  </div>
                </div>

                {/* Auto Fix Button if patch is available */}
                {auditResult.suggestedPatch && Object.keys(auditResult.suggestedPatch).length > 0 && (
                  <div className="shrink-0">
                    {appliedSuccessfully ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-600 text-xs font-black shadow-md">
                        <Check className="w-4 h-4" />
                        <span>डेटाबेस अपडेट हो गया</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleApplyFix}
                        disabled={isApplying}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg disabled:opacity-50"
                      >
                        {isApplying ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>अपडेट किया जा रहा है...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Accept & Update to Verified Data</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Detailed Diagnostic Breakdown Cards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>विस्तृत डायग्नोस्टिक विश्लेषण (Detailed Diagnostics)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Timeline & Dates */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        समयसीमा एवं तिथियां (Timeline & Dates)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          auditResult.diagnosticBreakdown.timeline.status === 'verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : auditResult.diagnosticBreakdown.timeline.status === 'critical'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {auditResult.diagnosticBreakdown.timeline.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {auditResult.diagnosticBreakdown.timeline.details}
                    </p>
                    <div className="font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-900 space-y-0.5">
                      <div>
                        वर्तमान अंतिम तिथि: <span className="text-white font-bold">{job.lastDate || job.dates?.end || 'N/A'}</span>
                      </div>
                      {auditResult.diagnosticBreakdown.timeline.verifiedEnd && (
                        <div className="text-emerald-400">
                          सत्यापित अंतिम तिथि: <span className="font-bold">{auditResult.diagnosticBreakdown.timeline.verifiedEnd}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Official Source Verification */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-400" />
                        आधिकारिक स्त्रोत (Official Sources)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          auditResult.diagnosticBreakdown.officialSource.status === 'verified'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {auditResult.diagnosticBreakdown.officialSource.status}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {auditResult.diagnosticBreakdown.officialSource.details}
                    </p>
                    <div className="pt-1 border-t border-slate-900 text-[11px] space-y-0.5">
                      <div className="truncate text-slate-400">
                        PDF Link: <span className="text-white">{job.notificationPdf || job.links?.notificationPdf || 'N/A'}</span>
                      </div>
                      <div className="truncate text-slate-400">
                        Apply Link: <span className="text-white">{job.applyLink || job.links?.apply || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vacancies & Eligibility */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                        पद संख्या एवं योग्यता (Vacancies & Eligibility)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {auditResult.diagnosticBreakdown.vacanciesAndEligibility?.status || 'verified'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {auditResult.diagnosticBreakdown.vacanciesAndEligibility?.details || 'पद संख्या व पात्रता मापदंड जांचे गए'}
                    </p>
                    <div className="font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-900 space-y-0.5">
                      <div>
                        कुल पद: <span className="text-white font-bold">{job.totalPosts}</span>
                      </div>
                      <div>
                        आयु सीमा: <span className="text-white">{job.minAge || '18'} - {job.maxAge || '33'} वर्ष</span>
                      </div>
                    </div>
                  </div>

                  {/* Fee & Categorization */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-purple-400" />
                        शुल्क एवं श्रेणी (Fee & Category)
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {auditResult.diagnosticBreakdown.feeStructure?.status || 'verified'}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      {auditResult.diagnosticBreakdown.feeStructure?.details || 'शुल्क संरचना नियमानुसार'}
                    </p>
                    <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900 space-y-0.5">
                      <div>
                        सामान्य शुल्क: <span className="text-white">{job.feeGeneral || job.fee?.gen || 'N/A'}</span>
                      </div>
                      <div>
                        आरक्षित वर्ग: <span className="text-white">{job.feeReserved || job.fee?.reserved || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Inconsistencies */}
              {auditResult.issues && auditResult.issues.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    पहचानी गई प्रमुख विसंगतियां (Key Inconsistencies):
                  </span>
                  <div className="space-y-1.5 text-xs">
                    {auditResult.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{issue.field}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                              issue.severity === 'critical'
                                ? 'bg-rose-950 text-rose-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{issue.issue}</p>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-400">
                          <div>
                            वर्तमान: <span className="text-rose-300">{issue.current}</span>
                          </div>
                          <div>
                            सत्यापित: <span className="text-emerald-300">{issue.verified}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Web Grounding Reference Citations */}
              {auditResult.groundingSources && auditResult.groundingSources.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    लाइव गूगल सर्च द्वारा संदर्भित अधिकृत वेबसाइट्स:
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {auditResult.groundingSources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-blue-300 text-[11px] transition-colors"
                      >
                        <span className="max-w-[200px] truncate">{src.title}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <div className="text-[11px] text-slate-400 font-mono">
            {auditResult?.verifiedAt ? (
              <span>Verified at: {new Date(auditResult.verifiedAt).toLocaleTimeString()}</span>
            ) : (
              <span>NP Recruitment Intelligence</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && (
              <button
                onClick={onRetry}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>पुनः जांचें</span>
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
