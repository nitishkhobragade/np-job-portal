"use client";

import React, { useState, useMemo } from 'react';
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
  DollarSign,
  Save,
  CheckSquare,
  Square,
  ArrowRight,
  CheckCircle2
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

interface FactFieldConfig {
  key: string;
  label: string;
  currentValue: string;
  verifiedValue?: string;
  status?: 'verified' | 'warning' | 'critical';
  details?: string;
  category: 'timeline' | 'vacancies' | 'source' | 'fee';
}

function computeFactFields(job: PostRecord, auditResult: PostAuditResult | null): FactFieldConfig[] {
  const diag = auditResult?.diagnosticBreakdown;
  const patch = auditResult?.suggestedPatch || {};

  return [
    {
      key: 'lastDate',
      label: 'अंतिम तिथि (Last Date to Apply)',
      currentValue: job.lastDate || job.dates?.end || 'N/A',
      verifiedValue: patch.lastDate || diag?.timeline?.verifiedEnd,
      status: diag?.timeline?.status || 'warning',
      details: diag?.timeline?.details,
      category: 'timeline'
    },
    {
      key: 'startDate',
      label: 'आवेदन प्रारंभ तिथि (Start Date)',
      currentValue: job.startDate || job.dates?.start || 'N/A',
      verifiedValue: patch.startDate || diag?.timeline?.verifiedStart,
      status: diag?.timeline?.status || 'verified',
      category: 'timeline'
    },
    {
      key: 'examDate',
      label: 'परीक्षा तिथि (Exam Date)',
      currentValue: job.examDate || job.dates?.exam || 'शीघ्र घोषित',
      verifiedValue: patch.examDate || diag?.timeline?.verifiedExam,
      status: diag?.timeline?.status || 'verified',
      category: 'timeline'
    },
    {
      key: 'totalPosts',
      label: 'कुल पद संख्या (Total Vacancies)',
      currentValue: String(job.totalPosts || 'विज्ञप्ति अनुसार'),
      verifiedValue: patch.totalPosts || diag?.vacanciesAndEligibility?.verifiedPosts,
      status: diag?.vacanciesAndEligibility?.status || 'verified',
      details: diag?.vacanciesAndEligibility?.details,
      category: 'vacancies'
    },
    {
      key: 'qualification',
      label: 'पात्रता एवं शैक्षणिक योग्यता (Qualification)',
      currentValue: job.qualification || job.eligibility || 'N/A',
      verifiedValue: patch.qualification || diag?.vacanciesAndEligibility?.verifiedEligibility,
      status: diag?.vacanciesAndEligibility?.status || 'verified',
      category: 'vacancies'
    },
    {
      key: 'applyLink',
      label: 'ऑनलाइन आवेदन लिंक (Apply URL)',
      currentValue: job.applyLink || job.links?.apply || 'N/A',
      verifiedValue: patch.applyLink || diag?.officialSource?.verifiedApplyUrl,
      status: diag?.officialSource?.status || 'verified',
      category: 'source'
    },
    {
      key: 'notificationPdf',
      label: 'विज्ञप्ति PDF लिंक (Official Notification PDF)',
      currentValue: job.notificationPdf || job.links?.notificationPdf || 'N/A',
      verifiedValue: patch.notificationPdf || diag?.officialSource?.verifiedPdfUrl,
      status: diag?.officialSource?.status || 'verified',
      category: 'source'
    },
    {
      key: 'feeGeneral',
      label: 'सामान्य वर्ग शुल्क (General Fee)',
      currentValue: job.feeGeneral || job.fee?.gen || 'N/A',
      verifiedValue: diag?.feeStructure?.verifiedGeneralFee,
      status: diag?.feeStructure?.status || 'verified',
      category: 'fee'
    },
    {
      key: 'feeReserved',
      label: 'आरक्षित वर्ग शुल्क (Reserved Fee)',
      currentValue: job.feeReserved || job.fee?.reserved || 'N/A',
      verifiedValue: diag?.feeStructure?.verifiedReservedFee,
      status: diag?.feeStructure?.status || 'verified',
      category: 'fee'
    }
  ];
}

interface SinglePostAuditContentProps {
  job: PostRecord;
  auditResult: PostAuditResult | null;
  onApplyFix: (jobId: string, patch: Partial<PostRecord>) => Promise<boolean>;
  onClose: () => void;
  onRetry: () => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

const SinglePostAuditContent: React.FC<SinglePostAuditContentProps> = ({
  job,
  auditResult,
  onApplyFix,
  onClose,
  onRetry,
  isLoading,
  errorMessage
}) => {
  const factFields = useMemo(() => computeFactFields(job, auditResult), [job, auditResult]);

  // Initialize draft values and selections directly from initial facts
  const [draftValues, setDraftValues] = useState<Record<string, string>>(() => {
    const initialDraft: Record<string, string> = {};
    factFields.forEach((field) => {
      initialDraft[field.key] = field.verifiedValue || field.currentValue;
    });
    return initialDraft;
  });

  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(() => {
    const initialSelected: Record<string, boolean> = {};
    factFields.forEach((field) => {
      const hasDiscrepancy =
        field.verifiedValue &&
        field.verifiedValue.trim() !== '' &&
        field.verifiedValue.trim().toLowerCase() !== field.currentValue.trim().toLowerCase() &&
        !field.verifiedValue.toLowerCase().includes('retry') &&
        !field.verifiedValue.toLowerCase().includes('पुनः जांच');

      initialSelected[field.key] = Boolean(hasDiscrepancy && field.verifiedValue);
    });
    return initialSelected;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Toggle field selection
  const handleToggleSelectField = (key: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Replace field with verified value immediately
  const handleApplyVerifiedValueToField = (field: FactFieldConfig) => {
    if (!field.verifiedValue) return;
    setDraftValues((prev) => ({
      ...prev,
      [field.key]: field.verifiedValue!
    }));
    setSelectedFields((prev) => ({
      ...prev,
      [field.key]: true
    }));
  };

  // Select all fields that have verified facts
  const handleSelectAllVerified = () => {
    const nextSelected: Record<string, boolean> = {};
    const nextDraft: Record<string, string> = { ...draftValues };

    factFields.forEach((f) => {
      nextSelected[f.key] = true;
      if (f.verifiedValue && !f.verifiedValue.includes('पुनः जांच')) {
        nextDraft[f.key] = f.verifiedValue;
      }
    });

    setSelectedFields(nextSelected);
    setDraftValues(nextDraft);
  };

  // Deselect all
  const handleDeselectAll = () => {
    const nextSelected: Record<string, boolean> = {};
    factFields.forEach((f) => {
      nextSelected[f.key] = false;
    });
    setSelectedFields(nextSelected);
  };

  // Handle saving the selected facts directly to Database
  const handleSaveToDatabase = async () => {
    const selectedKeys = Object.keys(selectedFields).filter((k) => selectedFields[k]);
    if (selectedKeys.length === 0) {
      return;
    }

    const patch: Partial<PostRecord> = {};

    selectedKeys.forEach((key) => {
      const val = draftValues[key];
      if (val !== undefined) {
        if (key === 'lastDate') {
          patch.lastDate = val;
          patch.dates = {
            start: patch.dates?.start || draftValues.startDate || job.dates?.start || '15/09/2026',
            end: val,
            exam: patch.dates?.exam || draftValues.examDate || job.dates?.exam || 'शीघ्र घोषित'
          };
        } else if (key === 'startDate') {
          patch.startDate = val;
          patch.dates = {
            start: val,
            end: patch.dates?.end || draftValues.lastDate || job.dates?.end || '15/10/2026',
            exam: patch.dates?.exam || draftValues.examDate || job.dates?.exam || 'शीघ्र घोषित'
          };
        } else if (key === 'examDate') {
          patch.examDate = val;
          patch.dates = {
            start: patch.dates?.start || draftValues.startDate || job.dates?.start || '15/09/2026',
            end: patch.dates?.end || draftValues.lastDate || job.dates?.end || '15/10/2026',
            exam: val
          };
        } else if (key === 'totalPosts') {
          patch.totalPosts = val;
        } else if (key === 'qualification') {
          patch.qualification = val;
          patch.eligibility = val;
        } else if (key === 'feeGeneral') {
          patch.feeGeneral = val;
          patch.fee = {
            gen: val,
            reserved: patch.fee?.reserved || draftValues.feeReserved || job.fee?.reserved || '₹250/-'
          };
        } else if (key === 'feeReserved') {
          patch.feeReserved = val;
          patch.fee = {
            gen: patch.fee?.gen || draftValues.feeGeneral || job.fee?.gen || '₹500/-',
            reserved: val
          };
        } else if (key === 'applyLink') {
          patch.applyLink = val;
          patch.links = {
            apply: val,
            notificationPdf: patch.links?.notificationPdf || draftValues.notificationPdf || job.links?.notificationPdf || '',
            officialSite: job.links?.officialSite || 'https://esb.mp.gov.in'
          };
        } else if (key === 'notificationPdf') {
          patch.notificationPdf = val;
          patch.links = {
            apply: patch.links?.apply || draftValues.applyLink || job.links?.apply || '',
            notificationPdf: val,
            officialSite: job.links?.officialSite || 'https://esb.mp.gov.in'
          };
        }
      }
    });

    try {
      setIsSaving(true);
      const success = await onApplyFix(job.id, patch);
      if (success) {
        setSaveSuccessMessage(`सत्यापित डेटा सफलतापूर्वक डेटाबेस में सुरक्षित हो गया! (${selectedKeys.length} तथ्य अपडेट किए गए)`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = Object.values(selectedFields).filter(Boolean).length;
  const healthScore = auditResult?.healthScore || 0;
  const isHealthy = healthScore >= 85;

  return (
    <div
      className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
      role="dialog"
      aria-modal="true"
    >
      {/* Modal Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
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
                <h4 className="text-sm font-bold">सत्यापन सूचना</h4>
                <p className="text-xs text-rose-300/80 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={onRetry}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>पुनः जांचें</span>
            </button>
          </div>
        )}

        {/* Success Banner */}
        {saveSuccessMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/60 text-emerald-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-white">डेटाबेस अपडेट सफल!</h4>
              <p className="text-xs text-emerald-300/90">{saveSuccessMessage}</p>
            </div>
          </div>
        )}

        {/* Audit Loaded State */}
        {!isLoading && auditResult && (
          <div className="space-y-5">
            {/* Score & Health Banner */}
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

              {/* Quick Select All Button */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSelectAllVerified}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>सभी सही तथ्य चुनें</span>
                </button>
                {selectedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 text-xs transition-colors cursor-pointer"
                  >
                    हटाएं
                  </button>
                )}
              </div>
            </div>

            {/* Instructions banner for replacement */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  नीचे दिए गए तथ्यों में <strong>गलत डेटा</strong> के स्थान पर <strong>सही तथ्य</strong> चुनने हेतु <span className="text-amber-300 font-bold">&quot;सही तथ्य चुनें (Apply)&quot;</span> बटन दबाएं, अथवा सीधे एडिट करें और नीचे <span className="text-emerald-400 font-bold">&quot;सही डेटा सेव करें&quot;</span> पर क्लिक करें।
                </span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono shrink-0 ml-2">
                {selectedCount} चयनित
              </span>
            </div>

            {/* FACT FIELDS INTERACTIVE COMPARISON GRID */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>तथ्य तुलना एवं प्रतिस्थापन (Fact Check & Replacement)</span>
              </h4>

              <div className="grid grid-cols-1 gap-3">
                {factFields.map((field) => {
                  const isSelected = Boolean(selectedFields[field.key]);
                  const currentVal = field.currentValue;
                  const verifiedVal = field.verifiedValue;
                  const hasVerified = Boolean(verifiedVal && verifiedVal !== currentVal);

                  return (
                    <div
                      key={field.key}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-slate-950 border-amber-500/60 shadow-lg shadow-amber-950/20'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleSelectField(field.key)}
                            className="text-slate-400 hover:text-amber-400 cursor-pointer"
                            title={isSelected ? 'अनचेक करें' : 'सेव करने हेतु चुनें'}
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </button>
                          <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                            {field.category === 'timeline' && <Calendar className="w-3.5 h-3.5 text-blue-400" />}
                            {field.category === 'vacancies' && <Award className="w-3.5 h-3.5 text-amber-400" />}
                            {field.category === 'source' && <FileText className="w-3.5 h-3.5 text-emerald-400" />}
                            {field.category === 'fee' && <DollarSign className="w-3.5 h-3.5 text-purple-400" />}
                            {field.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {hasVerified && (
                            <button
                              type="button"
                              onClick={() => handleApplyVerifiedValueToField(field)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                                isSelected && draftValues[field.key] === verifiedVal
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                              }`}
                            >
                              {isSelected && draftValues[field.key] === verifiedVal ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>सही तथ्य चयनित</span>
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                  <span>सही तथ्य चुनें (Apply)</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Comparison Box */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-xs">
                        {/* Current / Incorrect */}
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-rose-950/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            वर्तमान पोर्टल मान (Current Data):
                          </span>
                          <p className="font-mono text-xs text-rose-200 break-words font-medium">
                            {currentVal}
                          </p>
                        </div>

                        {/* Verified / Sahi Fact */}
                        <div
                          className={`p-2.5 rounded-lg border space-y-1 transition-colors ${
                            hasVerified
                              ? 'bg-emerald-950/30 border-emerald-800/80'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            सत्यापित सही तथ्य (Verified Ground Truth):
                          </span>
                          <p className="font-mono text-xs text-emerald-200 break-words font-semibold">
                            {verifiedVal || 'कोई विसंगति नहीं पाई गई (सत्यापित)'}
                          </p>
                        </div>
                      </div>

                      {/* Editable Field that will be saved */}
                      <div className="pt-2.5 mt-2.5 border-t border-slate-900 flex items-center gap-2">
                        <label className="text-[11px] font-medium text-slate-400 shrink-0">
                          सेव होने वाला मान (To be Saved):
                        </label>
                        <input
                          type="text"
                          value={draftValues[field.key] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDraftValues((prev) => ({ ...prev, [field.key]: val }));
                            setSelectedFields((prev) => ({ ...prev, [field.key]: true }));
                          }}
                          placeholder={field.label}
                          className={`flex-1 bg-slate-900 border rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none transition-colors ${
                            isSelected ? 'border-amber-500/80 bg-amber-950/10' : 'border-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Identified Issues */}
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

            {/* Grounding Reference Links */}
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

      {/* Modal Footer with PROMINENT SAVE BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 shrink-0">
        <div className="flex items-center gap-2">
          {!isLoading && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>पुनः जांचें</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>

        {/* MAIN SAVE BUTTON */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveToDatabase}
            disabled={isSaving || selectedCount === 0}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>डेटाबेस में सेव हो रहा है...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>सही डेटा सेव करें ({selectedCount} चयनित)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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
  if (!isOpen || !job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <SinglePostAuditContent
        key={`${job.id}-${auditResult?.verifiedAt || 'init'}`}
        job={job}
        auditResult={auditResult}
        onApplyFix={onApplyFix}
        onClose={onClose}
        onRetry={onRetry}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    </div>
  );
};
