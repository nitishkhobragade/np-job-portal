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
  ZoomOut,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';

interface PosterStudioProps {
  job: JobPostDetail | PostRecord;
  onClose?: () => void;
  isModal?: boolean;
  initialEditableMode?: boolean;
  isAdmin?: boolean;
}

export const PosterStudio: React.FC<PosterStudioProps> = ({
  job,
  onClose,
  isModal = false,
  initialEditableMode = false,
  isAdmin,
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<'story' | 'feed'>('story'); // 'story' (9:16 - 1080x1920) or 'feed' (4:3 - 1080x1350)
  const [zoomLevel, setZoomLevel] = useState<number>(0.32);

  // Check admin authorization
  const [isAdminState] = useState<boolean>(() => {
    if (isAdmin !== undefined) return isAdmin;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('np_admin_auth') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });

  const [showCustomizer, setShowCustomizer] = useState<boolean>(
    initialEditableMode && isAdminState
  );

  // Update zoom level appropriately based on aspect ratio
  const targetWidth = 1080;
  const targetHeight = aspectRatio === 'story' ? 1920 : 1440;

  // Normalize data between JobPostDetail and PostRecord
  const isPostRecord = (j: JobPostDetail | PostRecord): j is PostRecord => 'dates' in j;
  const postRec = isPostRecord(job) ? job : null;
  const detailRec = !isPostRecord(job) ? (job as JobPostDetail) : null;

  const defaultTitle = job.title;
  const defaultShortTitle = job.shortTitle || job.title.slice(0, 30);
  const defaultDept = postRec ? postRec.dept : detailRec?.department || '';
  const defaultPosts = String(job.totalPosts);
  const defaultStartDate = postRec ? postRec.dates?.start || '' : detailRec?.startDate || '';
  const defaultLastDate = postRec ? postRec.dates?.end || '' : detailRec?.lastDate || '';
  const defaultExamDate = postRec ? postRec.dates?.exam || 'शीघ्र घोषित' : detailRec?.examDate || 'शीघ्र घोषित';
  const defaultFeeGen = postRec ? postRec.fee?.gen || '₹500/-' : detailRec?.feeGeneral || '₹500/-';
  const defaultFeeRes = postRec ? postRec.fee?.reserved || '₹250/-' : detailRec?.feeReserved || '₹250/-';
  const defaultEligibility = postRec ? postRec.eligibility || '' : detailRec?.qualificationSummary || '';
  const posterConfig = postRec?.posterConfig;

  // Dynamic Poster Customizer State
  const [customHeadline, setCustomHeadline] = useState<string>(
    posterConfig?.headline || `★ ${defaultShortTitle} भर्ती अलर्ट ★`
  );
  const [customPosts, setCustomPosts] = useState<string>(defaultPosts);
  const [customLastDate, setCustomLastDate] = useState<string>(defaultLastDate);
  const [customFeeAlert, setCustomFeeAlert] = useState<string>(`${defaultFeeGen} / ${defaultFeeRes}`);
  const [customPoints, setCustomPoints] = useState<string[]>(
    posterConfig?.keyPoints && posterConfig.keyPoints.length > 0
      ? [...posterConfig.keyPoints]
      : [
          `कुल पद: ${defaultPosts}`,
          `अंतिम तिथि: ${defaultLastDate}`,
          `शैक्षणिक योग्यता: ${defaultEligibility.slice(0, 70)}...`
        ]
  );
  const [customNote, setCustomNote] = useState<string>(
    posterConfig?.note || 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
  );

  const handleResetDefaults = () => {
    setCustomHeadline(posterConfig?.headline || `★ ${defaultShortTitle} भर्ती अलर्ट ★`);
    setCustomPosts(defaultPosts);
    setCustomLastDate(defaultLastDate);
    setCustomFeeAlert(`${defaultFeeGen} / ${defaultFeeRes}`);
    setCustomPoints(
      posterConfig?.keyPoints && posterConfig.keyPoints.length > 0
        ? [...posterConfig.keyPoints]
        : [
            `कुल पद: ${defaultPosts}`,
            `अंतिम तिथि: ${defaultLastDate}`,
            `शैक्षणिक योग्यता: ${defaultEligibility.slice(0, 70)}...`
          ]
    );
    setCustomNote(posterConfig?.note || 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।');
  };

  // Generate formatted WhatsApp Share Text
  const generateWhatsAppMessage = () => {
    return `📢 *${defaultTitle}*\n` +
      `🏢 विभाग: ${defaultDept}\n` +
      `👥 कुल पद: *${customPosts}*\n` +
      `🎓 शैक्षणिक योग्यता: ${defaultEligibility}\n` +
      `📅 आवेदन की अंतिम तिथि: *${customLastDate}*\n` +
      `💰 आवेदन शुल्क: ${customFeeAlert}\n\n` +
      `🎯 *घर बैठे 100% सही व सुरक्षित फॉर्म भरवाने के लिए संपर्क करें:*\n` +
      `👤 *${OWNER_INFO.name}* (NP Job Portal)\n` +
      `📞 कॉल/व्हाट्सएप: ${OWNER_INFO.phone}\n` +
      `📲 सीधा चैट लिंक: https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent('नमस्ते Nitish Ji, मुझे ' + defaultShortTitle + ' का फॉर्म भरवाना है।')}\n` +
      `🌐 विजिट करें: NP Job Portal`;
  };

  const handleCopyText = async () => {
    try {
      const message = generateWhatsAppMessage();
      await navigator.clipboard.writeText(message);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    } catch {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 3000);
    }
  };

  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsDownloading(true);
      setDownloadSuccess(false);

      // Render at fixed resolution without scale transform interference
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
        width: targetWidth,
        height: targetHeight,
        canvasWidth: targetWidth * 2,
        canvasHeight: targetHeight * 2,
        style: {
          transform: 'none',
          transformOrigin: 'top left',
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          left: '0px',
          top: '0px',
          position: 'relative',
          margin: '0px',
        },
      });

      const link = document.createElement('a');
      link.download = `NP_Job_Poster_${aspectRatio === 'story' ? '9x16_Story' : '4x3_Feed'}_${job.id || 'recruitment'}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error downloading poster:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const directWhatsAppUrl = `https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(
    `नमस्ते Nitish Ji, मैंने NP Job Portal पर *${defaultTitle}* का पोस्टर देखा है। मुझे इसका फॉर्म भरवाना है।`
  )}`;

  return (
    <div className={`w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-white ${isModal ? 'max-w-6xl mx-auto' : ''}`}>
      {/* Studio Header Bar with Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm">
              NP
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              WhatsApp पोस्टर स्टूडियो{' '}
              <span className="text-amber-400 text-xs font-mono font-bold bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {aspectRatio === 'story' ? '1080×1920 (9:16 Story)' : '1080×1350 (4:3 Feed)'}
              </span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            व्हाट्सएप स्टेटस, इंस्टाग्राम स्टोरी एवं सोशल मीडिया के लिए तैयार अल्ट्रा-HD पोस्टर।
          </p>
        </div>

        {/* Action Controls & Aspect Ratio */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAspectRatio('story');
                setZoomLevel(0.28);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                aspectRatio === 'story'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱 Story / Status (9:16)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAspectRatio('feed');
                setZoomLevel(0.35);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                aspectRatio === 'feed'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🖼️ Square / Feed (4:3)</span>
            </button>
          </div>

          {/* Customizer Toggle - ONLY VISIBLE TO VERIFIED ADMIN */}
          {isAdminState && (
            <button
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all border ${
                showCustomizer
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{showCustomizer ? 'कस्टमाइज़र छिपाएं' : 'पोस्टर कस्टमाइज़ करें'}</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-lg p-1 text-xs">
            <button
              onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.04))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-amber-300 font-bold">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(0.55, zoomLevel + 0.04))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs sm:text-sm font-semibold text-slate-100 hover:text-white transition-all shadow-xs"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">कॉपी हो गया!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>टेक्स्ट कॉपी</span>
              </>
            )}
          </button>

          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs sm:text-sm font-bold text-white transition-all shadow-xs"
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

      {/* Dynamic Customizer Drawer / Panel - ONLY FOR ADMIN */}
      {isAdminState && showCustomizer && (
        <div className="mt-4 p-4 bg-slate-800/90 border border-amber-500/40 rounded-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-300">पोस्टर कंटेंट कस्टमाइज़र (Admin Live Editor)</span>
            </div>
            <button
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> रीसेट करें
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">हेडलाइन / घोषणा बैनर:</label>
              <input
                type="text"
                value={customHeadline}
                onChange={(e) => setCustomHeadline(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">कुल पद संख्या हाइलाइट:</label>
              <input
                type="text"
                value={customPosts}
                onChange={(e) => setCustomPosts(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">अंतिम तिथि हाइलाइट:</label>
              <input
                type="text"
                value={customLastDate}
                onChange={(e) => setCustomLastDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">फीस अलर्ट सारांश:</label>
              <input
                type="text"
                value={customFeeAlert}
                onChange={(e) => setCustomFeeAlert(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">कस्टम नोट / सर्विस लाइन:</label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="mt-5 flex flex-col items-center">
        {/* Helper Instructions Banner */}
        <div className="w-full max-w-xl bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 mb-4 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              यह पोस्टर {targetWidth}×{targetHeight} पिक्सल ({aspectRatio === 'story' ? '9:16 WhatsApp Story' : '4:3 Feed'}) में एक्सपोर्ट होगा।
            </span>
          </span>
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> ओरिजिनल अधिकृत मुहर
          </span>
        </div>

        {/* Scrollable / Scaled Preview Container */}
        <div className="w-full overflow-x-auto overflow-y-hidden py-2 flex justify-center items-center">
          <div
            style={{
              width: `${targetWidth * zoomLevel}px`,
              height: `${targetHeight * zoomLevel}px`,
            }}
            className="relative shadow-2xl rounded-xl border border-amber-500/30 overflow-hidden bg-slate-950"
          >
            {/* The Actual Canvas Being Scaled */}
            <div
              ref={posterRef}
              style={{
                width: `${targetWidth}px`,
                height: `${targetHeight}px`,
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
              }}
              className="absolute top-0 left-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between select-none font-sans overflow-hidden"
            >
              {/* FAINT DIAGONAL REPEATED WATERMARK ACROSS 3-4 STAGGERED ROWS (-30 deg, opacity 14%) */}
              <div
                className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex flex-col justify-around opacity-[0.14] select-none"
                aria-hidden="true"
              >
                <div
                  style={{ transform: 'rotate(-30deg) translateX(-15%)' }}
                  className="whitespace-nowrap text-white text-3xl font-black tracking-widest uppercase"
                >
                  NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE • NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE
                </div>
                <div
                  style={{ transform: 'rotate(-30deg) translateX(-30%)' }}
                  className="whitespace-nowrap text-amber-300 text-3xl font-black tracking-widest uppercase"
                >
                  NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE • NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE
                </div>
                <div
                  style={{ transform: 'rotate(-30deg) translateX(-10%)' }}
                  className="whitespace-nowrap text-white text-3xl font-black tracking-widest uppercase"
                >
                  NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE • NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE
                </div>
                {aspectRatio === 'story' && (
                  <div
                    style={{ transform: 'rotate(-30deg) translateX(-25%)' }}
                    className="whitespace-nowrap text-amber-300 text-3xl font-black tracking-widest uppercase"
                  >
                    NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE • NP JOB PORTAL • NP ONLINE • NITISH KHOBRAGADE
                  </div>
                )}
              </div>

              {/* --- 1. TOP BRANDING HEADER --- */}
              <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-7 text-white shadow-lg border-b-4 border-amber-400 relative z-10">
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
              <div className="px-10 py-6 relative z-10">
                <div className="bg-amber-400 text-slate-950 py-3 px-6 rounded-2xl font-black text-center text-2xl tracking-wide shadow-md flex items-center justify-center gap-3">
                  <Sparkles className="w-7 h-7" />
                  <span>{customHeadline}</span>
                  <Sparkles className="w-7 h-7" />
                </div>

                {/* Job Title Big Box */}
                <div className="mt-5 bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-900 border-2 border-blue-500/60 rounded-3xl p-7 shadow-2xl text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-sm font-black px-5 py-1.5 rounded-bl-2xl uppercase tracking-wider">
                    {'state' in job && job.state ? job.state : 'Govt'} Recruitment 2026
                  </div>
                  <h1 className="text-4xl font-extrabold text-white leading-tight drop-shadow-sm mt-2">
                    {defaultTitle}
                  </h1>
                  <p className="text-xl text-blue-200 font-semibold mt-2">
                    {defaultDept}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-3 bg-amber-400 text-slate-950 px-8 py-2.5 rounded-full font-black text-2xl shadow-xl">
                    <Users className="w-7 h-7" /> कुल पद: {customPosts}
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
                      {defaultEligibility.length > 70
                        ? defaultEligibility.slice(0, 68) + '...'
                        : defaultEligibility}
                    </div>
                    <div className="text-xs text-slate-400 mt-2 font-medium">विस्तृत नियम पुस्तिका देखें</div>
                  </div>

                  {/* Age Limit */}
                  <div className="bg-slate-800/95 border-2 border-slate-600/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold uppercase tracking-wider">
                      <Users className="w-5 h-5" /> आयु सीमा
                    </div>
                    <div className="text-white text-2xl font-black mt-2">
                      {'minAge' in job && job.minAge ? job.minAge : '18 वर्ष'} से {'maxAge' in job && job.maxAge ? job.maxAge.split(' ')[0] : '33'} वर्ष
                    </div>
                    <div className="text-xs text-emerald-300 mt-2 font-semibold">नियमानुसार छूट लागू</div>
                  </div>

                  {/* Last Date */}
                  <div className="bg-gradient-to-br from-rose-950 to-red-900 border-2 border-red-500 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-red-300 text-sm font-bold uppercase tracking-wider">
                      <Calendar className="w-5 h-5" /> अंतिम तिथि
                    </div>
                    <div className="text-amber-300 text-2xl font-black mt-2">
                      {customLastDate}
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
                        <span className="font-bold text-white">{defaultStartDate}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">अंतिम तिथि:</span>
                        <span className="font-black text-rose-400">{customLastDate}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200">
                        <span className="text-slate-400">परीक्षा तिथि:</span>
                        <span className="font-bold text-amber-300">{defaultExamDate}</span>
                      </li>
                      <li className="flex justify-between items-center text-slate-200 pt-2 border-t border-slate-800">
                        <span className="text-slate-400">शुल्क सारांश:</span>
                        <span className="font-bold text-emerald-300">{customFeeAlert}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Bullet Points / Checklist */}
                  <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 shadow-md">
                    <h4 className="text-emerald-400 font-bold text-lg mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <FileCheck2 className="w-5 h-5" /> भर्ती मुख्य बिंदु
                    </h4>
                    <ul className="space-y-2 text-base text-slate-200">
                      {customPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <Check className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-100">{pt}</span>
                        </li>
                      ))}
                      <li className="flex items-start gap-2.5 text-amber-300 text-sm font-semibold pt-1">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{customNote}</span>
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

                {/* --- 5.1 EXTRA 9:16 STORY SECTION (DOCUMENTS CHECKLIST & ASSURANCE) --- */}
                {aspectRatio === 'story' && (
                  <div className="mt-6 bg-slate-900/90 border border-slate-700 rounded-2xl p-6 shadow-md">
                    <h4 className="text-amber-400 font-black text-xl mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                      <FileCheck2 className="w-6 h-6 text-amber-400" />
                      <span>ऑनलाइन फॉर्म भरने हेतु आवश्यक दस्तावेज (Document Checklist):</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-base text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>आधार कार्ड एवं लिंक मोबाइल नंबर</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>10वीं / 12वीं / संबंधित योग्यता अंकसूची</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>जाति प्रमाण पत्र (SC/ST/OBC)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>मध्य प्रदेश मूल निवासी प्रमाण पत्र</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>पासपोर्ट साइज रंगीन फोटो व हस्ताक्षर</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                        <span>सक्रिय ईमेल आईडी एवं मोबाइल</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* --- 6. FIXED BOTTOM BRANDING BAR (PROMINENT CALL & WHATSAPP) --- */}
              <div className="bg-slate-950 border-t-4 border-amber-400 py-4 px-8 flex items-center justify-between text-white relative z-30">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                    NP
                  </div>
                  <div>
                    <div className="text-amber-300 text-sm font-black uppercase tracking-wider">
                      घर बैठे फॉर्म भराने संपर्क करें: 8982324497
                    </div>
                    <div className="text-2xl font-black text-white flex items-center gap-2 mt-0.5">
                      <span>Nitish Khobragade</span>
                      <span className="text-amber-400 font-mono">- 8982324497</span>
                    </div>
                    <div className="text-xs text-slate-400 font-medium">
                      NP Job Portal • Nitish Khobragade (8982324497) • घर बैठे सुरक्षित फॉर्म भरवाएं
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-emerald-600 px-4 py-2.5 rounded-xl font-black text-base shadow-lg text-white">
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>WhatsApp: 8982324497</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-xl font-black text-base shadow-lg text-white">
                    <Phone className="w-5 h-5 fill-white" />
                    <span>Call</span>
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
            <span>{aspectRatio === 'story' ? '9:16 व्हाट्सएप व इंस्टा स्टोरी' : '4:3 व्हाट्सएप डीपी व फीड'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{targetWidth}×{targetHeight} px अल्ट्रा-क्लियर टेक्स्ट</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>ओरिजिनल वाटरमार्क व अधिकृत मुहर सहित</span>
          </span>
        </div>
      </div>
    </div>
  );
};
