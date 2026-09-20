import React from 'react';
import Link from 'next/link';
import { X, ExternalLink, MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { JobItem, AdmitCardItem, ResultItem } from '../types';
import { OWNER_INFO } from '../data/portalData';

interface DetailModalProps {
  item: JobItem | AdmitCardItem | ResultItem | null;
  itemType: 'job' | 'admit' | 'result' | null;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, itemType, onClose }) => {
  if (!item) return null;

  const isJob = itemType === 'job';
  const isAdmit = itemType === 'admit';
  const isResult = itemType === 'result';

  const job = isJob ? (item as JobItem) : null;
  const admit = isAdmit ? (item as AdmitCardItem) : null;
  const result = isResult ? (item as ResultItem) : null;

  const whatsappMessage = `https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
    item.title
  )}*%20%E0%A4%95%E0%A5%87%20%E0%A4%B2%E0%A4%BF%E0%A4%8F%20%E0%A4%91%E0%A4%A8%E0%A4%B2%E0%A4%BE%E0%A4%87%E0%A4%A8%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%A8%E0%A4%BE%20%2F%20%E0%A4%9C%E0%A4%BE%E0%A4%A8%E0%A4%95%E0%A4%BE%E0%A4%B0%E0%A5%80%20%E0%A4%9A%E0%A4%BE%E0%A4%B9%E0%A4%BF%E0%A4%8F%E0%A5%A4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-linear-to-r from-neutral-900 to-slate-800 text-white flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
                {isJob ? 'Recruitment Notification' : isAdmit ? 'Admit Card Alert' : 'Declared Result'}
              </span>
              <span className="text-xs text-neutral-300 font-medium">NP Job Portal</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
              {item.title}
            </h3>
            <p className="text-xs text-neutral-300 mt-0.5">{item.department}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-neutral-700">
          {/* Service Highlight Note */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-emerald-900">
                घर बैठे सुरक्षित ऑनलाइन फॉर्म सेवा (NP ONLINE)
              </p>
              <p className="text-emerald-800 mt-0.5">
                दस्तावेज़ व्हाट्सएप पर भेजें और बिना किसी गलती के अपना फॉर्म भरवाएं। संचालक: Nitish Khobragade (8982324497)
              </p>
            </div>
          </div>

          {/* Job Specific Details */}
          {job && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="text-xs text-neutral-500 font-medium">कुल पद (Total Posts):</span>
                  <p className="font-bold text-neutral-900 text-base">{job.totalPosts}</p>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                  <span className="text-xs text-neutral-500 font-medium">आवेदन की अंतिम तिथि:</span>
                  <p className="font-bold text-red-600 text-base">{job.lastDate}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                <div className="text-xs text-amber-900">
                  <strong>नया:</strong> इस भर्ती का 1080×1350 WhatsApp पोस्टर एवं सरकारी रिजल्ट टेबल उपलब्ध है।
                </div>
                <Link
                  href={`/jobs/${job.slug || job.id}`}
                  className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-md shadow-xs transition-colors"
                >
                  पूरा पेज व पोस्टर देखें →
                </Link>
              </div>

              {/* Tech Job Highlights if applicable */}
              {(job.isTechJob || job.companyName) && (
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-900 border-b border-blue-200/80 pb-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>कॉर्पोरेट / IT जॉब विवरण</span>
                    </span>
                    {job.companyName && (
                      <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[11px] font-black">
                        {job.companyName}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {job.role && (
                      <div>
                        <span className="text-slate-500 font-medium">पद (Role):</span>
                        <p className="font-bold text-slate-800">{job.role}</p>
                      </div>
                    )}
                    {job.experience && (
                      <div>
                        <span className="text-slate-500 font-medium">अनुभव (Experience):</span>
                        <p className="font-bold text-slate-800">{job.experience}</p>
                      </div>
                    )}
                    {job.location && (
                      <div>
                        <span className="text-slate-500 font-medium">जॉब लोकेशन:</span>
                        <p className="font-bold text-slate-800">{job.location}</p>
                      </div>
                    )}
                    {job.batchEligibility && (
                      <div>
                        <span className="text-slate-500 font-medium">पात्र बैच (Batch):</span>
                        <p className="font-bold text-emerald-700">{job.batchEligibility}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-2">
                <div>
                  <span className="text-xs text-neutral-500 font-medium">शैक्षणिक योग्यता (Eligibility):</span>
                  <p className="font-semibold text-neutral-800">{job.qualification}</p>
                </div>
                {job.ageLimit && (
                  <div>
                    <span className="text-xs text-neutral-500 font-medium">आयु सीमा (Age Limit):</span>
                    <p className="font-semibold text-neutral-800">{job.ageLimit}</p>
                  </div>
                )}
                {job.fee && (
                  <div>
                    <span className="text-xs text-neutral-500 font-medium">आवेदन शुल्क (Application Fee):</span>
                    <p className="font-semibold text-neutral-800">{job.fee}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admit Card Specific Details */}
          {admit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-xs text-neutral-500 font-medium">परीक्षा तिथि (Exam Date):</span>
                <p className="font-bold text-amber-900 text-base">{admit.examDate}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-xs text-neutral-500 font-medium">प्रवेश पत्र स्थिति:</span>
                <p className="font-bold text-emerald-700 text-base">{admit.hallTicketStatus}</p>
              </div>
            </div>
          )}

          {/* Result Specific Details */}
          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-xs text-neutral-500 font-medium">घोषणा की तिथि:</span>
                <p className="font-bold text-neutral-900 text-base">{result.declaredDate}</p>
              </div>
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-xs text-neutral-500 font-medium">दस्तावेज प्रकार:</span>
                <p className="font-bold text-purple-700 text-base">{result.type}</p>
              </div>
            </div>
          )}

          {/* Steps to get form filled */}
          <div className="border-t border-neutral-200 pt-3">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
              घर बैठे फॉर्म कैसे भरवाएं? (3 आसान चरण):
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-xs text-neutral-600">
              <li>नीचे दिए गए हरे WhatsApp बटन पर क्लिक करें।</li>
              <li>अपनी 10वीं/12वीं अंकसूची, आधार कार्ड और फोटो व्हाट्सएप पर भेजें।</li>
              <li>फॉर्म सबमिट होने पर ऑनलाइन पेमेंट करें एवं ऑफिशियल पावती प्राप्त करें।</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href={isJob ? (job?.applyUrl || '#') : isAdmit ? (admit?.downloadUrl || '#') : (result?.viewUrl || '#')}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-100 transition-colors"
          >
            आधिकारिक वेबसाइट <ExternalLink className="w-3.5 h-3.5 text-neutral-500" />
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={whatsappMessage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Nitish Ji से फॉर्म भरवाएं (WhatsApp)</span>
            </a>

            <a
              href={OWNER_INFO.callUrl}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              title="कॉल करें"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
