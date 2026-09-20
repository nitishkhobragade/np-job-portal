"use client";

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  Share2,
  Phone,
  MessageCircle,
  Calendar,
  Users,
  GraduationCap,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Eye,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { JobPostDetail } from '../types';
import { OWNER_INFO } from '../data/portalData';

interface PosterStudioProps {
  job: JobPostDetail;
  onClose?: () => void;
  isModal?: boolean;
}

export const PosterStudio: React.FC<PosterStudioProps> = ({
  job,
  onClose,
  isModal = false,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(0.35); // Responsive scale for desktop/mobile preview

  // Generate formatted WhatsApp Share Text
  const generateWhatsAppMessage = () => {
    return `📢 *${job.title}*\n` +
      `🏢 विभाग: ${job.department}\n` +
      `👥 कुल पद: *${job.totalPosts}*\n` +
      `🎓 शैक्षणिक योग्यता: ${job.qualificationSummary}\n` +
      `📅 आवेदन की अंतिम तिथि: *${job.lastDate}*\n` +
      `💰 आवेदन शुल्क: ${job.feeGeneral} / ${job.feeReserved}\n\n` +
      `📝 *आवश्यक दस्तावेज:*\n` +
      job.requiredDocuments.slice(0, 5).map((doc, i) => `   ${i + 1}. ${doc}`).join('\n') +
      `\n\n` +
      `🎯 *घर बैठे 100% सही व सुरक्षित फॉर्म भरवाने के लिए संपर्क करें:*\n` +
      `👤 *${OWNER_INFO.name}* (NP ONLINE)\n` +
      `📞 कॉल/व्हाट्सएप: ${OWNER_INFO.phone}\n` +
      `📲 सीधा चैट लिंक: https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent('नमस्ते Nitish Ji, मुझे ' + job.shortTitle + ' का फॉर्म भरवाना है।')}\n` +
      `🌐 विजिट करें: NP Job Portal`;
  };

  const handleCopyText = async () => {
    try {
      const message = generateWhatsAppMessage();
      await navigator.clipboard.writeText(message);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      // Fallback
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    }
  };

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsDownloading(true);
      setDownloadSuccess(false);

      // Render at fixed 1080x1350 resolution
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        quality: 0.98,
        pixelRatio: 2,
        width: 1080,
        height: 1350,
      });

      const link = document.createElement('a');
      link.download = `NP_Job_Poster_${job.slug || 'recruitment'}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error downloading poster:', err);
      alert('पोस्टर डाउनलोड करने में समस्या आई, कृपया दोबारा प्रयास करें।');
    } finally {
      setIsDownloading(false);
    }
  };

  const directWhatsAppUrl = `https://wa.me/?text=${encodeURIComponent(generateWhatsAppMessage())}`;

  return (
    <div className={`bg-slate-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700 ${isModal ? 'max-w-4xl w-full p-4 sm:p-6' : 'p-4 sm:p-6 my-6'}`}>
      {/* Studio Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 1080 × 1350 HD
            </span>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              व्हाट्सएप पोस्टर स्टूडियो
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            व्हाट्सएप स्टेटस, ग्रुप्स एवं इंस्टाग्राम स्टोरी हेतु 1-क्लिक हाई-रेजोल्यूशन पोस्टर डाउनलोड करें।
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Zoom controls for preview */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 mr-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.25, prev - 0.05))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs px-2 font-mono text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(0.65, prev + 0.05))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs sm:text-sm font-semibold text-slate-100 hover:text-white transition-all shadow-sm"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">कॉपी हो गया!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>टेक्स्ट कॉपी करें</span>
              </>
            )}
          </button>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs sm:text-sm font-bold text-white transition-all shadow-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>व्हाट्सएप शेयर</span>
          </a>

          <button
            onClick={handleDownloadPoster}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs sm:text-sm font-black transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-60"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>डाउनलोड हो रहा है...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>डाउनलोड पूर्ण!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>पोस्टर (PNG) डाउनलोड</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-200 rounded-lg text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
            >
              बंद करें
            </button>
          )}
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="mt-6 flex flex-col items-center">
        {/* Helper Instructions Banner */}
        <div className="w-full max-w-xl bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2.5 mb-5 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>यह पोस्टर 1080×1350 पिक्सल अल्ट्रा-HD साइज में एक्सपोर्ट होगा।</span>
          </span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> वाटरमार्क-फ्री
          </span>
        </div>

        {/* Scrollable / Scaled Preview Container */}
        <div className="w-full overflow-x-auto overflow-y-hidden py-2 flex justify-center items-center">
          <div
            style={{
              width: `${1080 * zoomLevel}px`,
              height: `${1350 * zoomLevel}px`,
            }}
            className="relative shadow-2xl rounded-xl border border-amber-500/30 overflow-hidden bg-slate-950"
          >
            {/* The Actual 1080x1350 Canvas Being Scaled */}
            <div
              ref={posterRef}
              style={{
                width: '1080px',
                height: '1350px',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
              }}
              className="absolute top-0 left-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between select-none font-sans"
            >
              {/* --- 1. TOP BRANDING HEADER --- */}
              <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-7 text-white shadow-lg border-b-4 border-amber-400 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-2xl flex flex-col items-center justify-center shadow-xl border-2 border-amber-300">
                      <span className="text-red-700 font-black text-2xl tracking-tighter leading-none">NP</span>
                      <span className="text-[10px] font-bold text-slate-800 tracking-widest mt-0.5">ONLINE</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                          NP JOB PORTAL
                        </span>
                        <span className="bg-amber-400 text-slate-950 text-sm font-black px-2.5 py-0.5 rounded shadow">
                          सरकारी भर्ती अलर्ट
                        </span>
                      </div>
                      <p className="text-amber-100 text-base font-semibold mt-1">
                        मध्य प्रदेश एवं केंद्र सरकार की सभी सरकारी भर्तियों की प्रामाणिक जानकारी
                      </p>
                    </div>
                  </div>

                  {/* Top Owner Badge */}
                  <div className="bg-slate-950/80 backdrop-blur-sm border border-amber-400/80 rounded-2xl p-4 text-right shadow-lg">
                    <div className="text-amber-300 text-xs font-bold uppercase tracking-wider">
                      संचालक व फॉर्म विशेषज्ञ
                    </div>
                    <div className="text-white text-xl font-black mt-0.5">
                      {OWNER_INFO.name}
                    </div>
                    <div className="text-amber-400 font-mono font-bold text-lg flex items-center justify-end gap-1.5 mt-0.5">
                      <Phone className="w-4 h-4 fill-amber-400" />
                      {OWNER_INFO.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* --- 2. MAIN NOTICE BANNER --- */}
              <div className="px-10 py-6">
                <div className="bg-amber-400 text-slate-950 py-3 px-6 rounded-2xl font-black text-center text-2xl tracking-wide shadow-md flex items-center justify-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  <span>★ नया भर्ती विज्ञापन एवं ऑनलाइन आवेदन प्रारंभ ★</span>
                  <Sparkles className="w-7 h-7" />
                </div>

                {/* Job Title Big Box */}
                <div className="mt-5 bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-900 border-2 border-blue-500/60 rounded-3xl p-7 shadow-2xl text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-sm font-black px-5 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                    {job.state} Government
                  </div>
                  <h1 className="text-4xl font-extrabold text-white leading-tight drop-shadow-sm mt-2">
                    {job.title}
                  </h1>
                  <p className="text-xl text-blue-200 font-semibold mt-2">
                    {job.department}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-3 bg-amber-400 text-slate-950 px-8 py-2.5 rounded-full font-black text-2xl shadow-xl">
                    <Users className="w-7 h-7" /> कुल पद: {job.totalPosts}
                  </div>
                </div>

                {/* --- 3. KEY HIGHLIGHTS 3-BOX GRID --- */}
                <div className="grid grid-cols-3 gap-5 mt-6">
                  {/* Qualification */}
                  <div className="bg-slate-800/95 border-2 border-slate-600/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-amber-400 text-sm font-bold uppercase tracking-wider">
                      <GraduationCap className="w-5 h-5" /> शैक्षणिक योग्यता
                    </div>
                    <div className="text-white text-xl font-bold mt-2 leading-snug">
                      {job.qualificationSummary.length > 70
                        ? job.qualificationSummary.slice(0, 68) + '...'
                        : job.qualificationSummary}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 font-medium">विस्तृत नियम पुस्तिका देखें</div>
                  </div>

                  {/* Age Limit */}
                  <div className="bg-slate-800/95 border-2 border-slate-600/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                      <Users className="w-5 h-5" /> आयु सीमा
                    </div>
                    <div className="text-white text-2xl font-black mt-2">
                      {job.minAge} से {job.maxAge.split(' ')[0]} वर्ष
                    </div>
                    <div className="text-xs text-emerald-300 mt-2 font-semibold">नियमानुसार छूट लागू</div>
                  </div>

                  {/* Last Date */}
                  <div className="bg-gradient-to-br from-rose-950 to-red-900 border-2 border-red-500 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-red-300 text-sm font-bold uppercase tracking-wider">
                      <Calendar className="w-5 h-5" /> अंतिम तिथि
                    </div>
                    <div className="text-amber-300 text-2xl font-black mt-2">
                      {job.lastDate}
                    </div>
                    <div className="text-xs text-rose-200 mt-2 font-bold animate-pulse">अंतिम तिथि से पहले भरें</div>
                  </div>
                </div>

                {/* --- 4. REQUIRED DOCUMENTS & IMPORTANT DATES --- */}
                <div className="grid grid-cols-2 gap-6 mt-6">
                  {/* Important Dates Table */}
                  <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 shadow-md">
                    <h4 className="text-amber-400 font-bold text-lg mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <Calendar className="w-5 h-5" /> महत्वपूर्ण तिथियां एवं शुल्क
                    </h4>
                    <ul className="space-y-2.5 text-base">
                      <li className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">आवेदन प्रारंभ:</span>
                        <span className="font-bold text-white">{job.startDate}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">अंतिम तिथि:</span>
                        <span className="font-black text-rose-400">{job.lastDate}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">परीक्षा तिथि:</span>
                        <span className="font-bold text-amber-300">{job.examDate || 'शीघ्र घोषित'}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200 pt-2 border-t border-slate-800">
                        <span className="text-slate-400">सामान्य / अन्य:</span>
                        <span className="font-bold text-emerald-300">{job.feeGeneral}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">आरक्षित वर्ग:</span>
                        <span className="font-bold text-emerald-300">{job.feeReserved}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Required Documents Checklist */}
                  <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 shadow-md">
                    <h4 className="text-emerald-400 font-bold text-lg mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <FileCheck2 className="w-5 h-5" /> फॉर्म हेतु आवश्यक दस्तावेज
                    </h4>
                    <ul className="space-y-2 text-base text-slate-200">
                      {job.requiredDocuments.slice(0, 5).map((doc, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-100">{doc}</span>
                        </li>
                      ))}
                      <li className="flex items-start gap-2.5 text-amber-300 text-sm font-semibold pt-1">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>व्हाट्सएप पर फोटो भेजकर फॉर्म भरवा सकते हैं</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* --- 5. CALLOUT SERVICE BOX --- */}
                <div className="mt-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 p-5 rounded-2xl shadow-xl flex items-center justify-between border-2 border-amber-300">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center shadow-md shrink-0">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight leading-tight">
                        दुकान जाने की जरूरत नहीं — घर बैठे फॉर्म भरवाएं!
                      </h3>
                      <p className="text-slate-900 font-semibold text-base mt-0.5">
                        व्हाट्सएप पर दस्तावेज भेजें, 100% सही फॉर्म व पक्की कम्प्यूटर रसीद तुरंत पाएं।
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-950 text-white px-5 py-2.5 rounded-xl font-black text-xl flex items-center gap-2 shadow-lg shrink-0">
                    <MessageCircle className="w-6 h-6 text-emerald-400 fill-emerald-400" />
                    व्हाट्सएप करें
                  </div>
                </div>
              </div>

              {/* --- 6. PROMINENT BOTTOM FOOTER STRIP --- */}
              <div className="bg-slate-950 border-t-4 border-amber-400 py-6 px-10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-amber-400 text-sm font-bold uppercase tracking-widest">
                      संपर्क सूत्र एवं ऑनलाइन सेवा केंद्र
                    </div>
                    <div className="text-3xl font-black text-white mt-1 flex items-center gap-3">
                      <span>{OWNER_INFO.name}</span>
                      <span className="text-slate-500 text-xl font-normal">|</span>
                      <span className="text-emerald-400 font-mono tracking-wider">{OWNER_INFO.phone}</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {OWNER_INFO.address} • MP Online & CSC अधिकृत केंद्र
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-xs text-slate-400 uppercase font-semibold">ऑनलाइन सहायता समय</div>
                      <div className="text-base font-bold text-amber-300">{OWNER_INFO.hours}</div>
                    </div>
                    <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-emerald-300">
                      <Phone className="w-8 h-8 fill-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Poster Studio Instructions Bottom */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>व्हाट्सएप डीपी एवं स्टेटस के लिए उपयुक्त</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>हाई क्वालिटी 4:5 रेशियो (1080×1350 px)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>कस्टमर शेयरिंग एवं कियोस्क डिस्प्ले तैयार</span>
          </span>
        </div>
      </div>
    </div>
  );
};
