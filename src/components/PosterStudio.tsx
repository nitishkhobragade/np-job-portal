"use client";

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import {
  Download,
  Copy,
  Check,
  Share2,
  Eye,
  ZoomIn,
  ZoomOut,
  Sliders,
  RotateCcw,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  Bot,
  Trash2
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { JobPoster } from './JobPoster';
import { updateJob } from '../lib/firebase';

interface PosterStudioProps {
  job: JobPostDetail | PostRecord;
  onClose?: () => void;
  isModal?: boolean;
  initialEditableMode?: boolean;
  isAdmin?: boolean;
  onJobUpdated?: (updatedJob: PostRecord) => void;
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
  const defaultLastDate = postRec ? postRec.dates?.end || '' : detailRec?.lastDate || '';
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

  // Poster Mode: 'auto' (algorithmic SVG/canvas) vs 'custom' (uploaded banner compressed to ~100KB)
  const initialUseCustom = Boolean(postRec?.useCustomPoster || detailRec?.useCustomPoster);
  const initialCustomUrl = postRec?.customPosterUrl || detailRec?.customPosterUrl || '';
  const [posterMode, setPosterMode] = useState<'auto' | 'custom'>(initialUseCustom ? 'custom' : 'auto');
  const [customPosterUrl, setCustomPosterUrl] = useState<string>(initialCustomUrl);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle client-side image compression: Canvas + WebP (target 1080px width, ~100KB size)
  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setSaveStatusMsg('छवि कंप्रेस की जा रही है (~100KB लक्ष्य)...');

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Target 1080px width while preserving aspect ratio
          const targetWidth = 1080;
          const scale = targetWidth / img.width;
          const targetHeight = Math.round(img.height * scale);

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Compress to WebP at quality 0.82
            let quality = 0.82;
            let dataUrl = canvas.toDataURL('image/webp', quality);

            // Calculate approximate size in KB: length * 3/4
            let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

            // If still over 150KB, reduce quality slightly
            if (sizeKb > 150) {
              quality = 0.70;
              dataUrl = canvas.toDataURL('image/webp', quality);
              sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
            }

            setCustomPosterUrl(dataUrl);
            setCompressedSizeKb(sizeKb);
            setPosterMode('custom');
            setIsCompressing(false);
            setSaveStatusMsg(`कंप्रेशन पूर्ण! साइज: ~${sizeKb} KB (WebP)`);
            setTimeout(() => setSaveStatusMsg(null), 4000);
          }
        };
        img.onerror = () => {
          setIsCompressing(false);
          setSaveStatusMsg('छवि लोड करने में त्रुटि!');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image compression error:', err);
      setIsCompressing(false);
      setSaveStatusMsg('कंप्रेशन विफल रहा।');
    }
  };

  // Save Poster Preference to Firestore (if job exists with an id)
  const handleSavePosterPreference = async () => {
    const jobId = postRec?.id || detailRec?.id;
    if (!jobId) {
      setSaveStatusMsg('सहेजने के लिए जॉब ID उपलब्ध नहीं है');
      return;
    }

    try {
      setSaveStatusMsg('सहेजा जा रहा है...');
      const isCustom = posterMode === 'custom' && Boolean(customPosterUrl);
      const updateData = {
        useCustomPoster: isCustom,
        customPosterUrl: isCustom ? customPosterUrl : ''
      };

      await updateJob(jobId, updateData);

      if (onJobUpdated && postRec) {
        onJobUpdated({
          ...postRec,
          useCustomPoster: isCustom,
          customPosterUrl: isCustom ? customPosterUrl : ''
        });
      }

      setSaveStatusMsg('पोस्टर सेटिंग सफलतापूर्वक सुरक्षित की गई!');
      setTimeout(() => setSaveStatusMsg(null), 3500);
    } catch (err) {
      console.error('Save poster error:', err);
      setSaveStatusMsg('सहेजने में त्रुटि आई!');
      setTimeout(() => setSaveStatusMsg(null), 3500);
    }
  };

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

      let dataUrl = '';
      try {
        // Preferred engine: html2canvas with scale: 2 and useCORS: true
        const canvas = await html2canvas(posterRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#020617',
          logging: false,
          scrollX: 0,
          scrollY: 0,
        });
        dataUrl = canvas.toDataURL('image/png', 1.0);
      } catch {
        // Fallback to toPng
        dataUrl = await toPng(posterRef.current, {
          cacheBust: true,
          quality: 1,
          pixelRatio: 2,
          width: targetWidth,
          height: targetHeight,
        });
      }

      if (!dataUrl) {
        throw new Error('Canvas export failed');
      }

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
        <div className="mt-4 p-4 bg-slate-800/90 border border-amber-500/40 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-700 gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-300">पोस्टर कंटेंट कस्टमाइज़र (Admin Live Editor)</span>
            </div>

            <div className="flex items-center gap-2">
              {saveStatusMsg && (
                <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-md border border-amber-500/50">
                  {saveStatusMsg}
                </span>
              )}

              <button
                type="button"
                onClick={handleSavePosterPreference}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                title="पोस्टर सेटिंग्स सहेजें"
              >
                <Check className="w-3.5 h-3.5" />
                <span>सेटिंग्स सेव करें</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 bg-slate-900 rounded"
              >
                <RotateCcw className="w-3 h-3" /> रीसेट
              </button>
            </div>
          </div>

          {/* POSTER MODE CONTROLLER: [🤖 ऑटो-जनरेटेड पोस्टर] vs [🖼️ कस्टम पोस्टर इमेज] */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-xl p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  पोस्टर मोड नियंत्रक (Poster Mode Controller)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  ऑटो-जेनरेटेड टेक्स्ट पोस्टर चुनें अथवा खुद का बना कस्टम पोस्टर अपलोड करें
                </p>
              </div>

              {/* Mode Toggle Switch */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-700 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setPosterMode('auto')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    posterMode === 'auto'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>ऑटो-जनरेटेड</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPosterMode('custom')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    posterMode === 'custom'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>कस्टम इमेज</span>
                </button>
              </div>
            </div>

            {/* If Custom Image Mode is active */}
            {posterMode === 'custom' && (
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomImageUpload}
                      className="hidden"
                      id="custom-poster-file-input"
                    />
                    <label
                      htmlFor="custom-poster-file-input"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-md"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{customPosterUrl ? 'नया पोस्टर बदलें (Replace)' : 'पोस्टर इमेज अपलोड करें'}</span>
                    </label>

                    {customPosterUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPosterUrl('');
                          setCompressedSizeKb(null);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold border border-rose-800/80 cursor-pointer"
                        title="इमेज हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>हटाएं</span>
                      </button>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-400">
                    {isCompressing ? (
                      <span className="text-amber-400 font-bold animate-pulse">
                        ऑटो-कंप्रेशन चालू है (~1080px, WebP)...
                      </span>
                    ) : compressedSizeKb ? (
                      <span className="text-emerald-400 font-bold">
                        ✓ कंप्रेस्ड आकार: ~{compressedSizeKb} KB (वेब अनुकूलित)
                      </span>
                    ) : (
                      <span>अनुशंसित अनुपात: 9:16 (Story) या 4:3 (Feed) • ऑटो-कंप्रेस ~100KB</span>
                    )}
                  </div>
                </div>

                {customPosterUrl && (
                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={customPosterUrl}
                      alt="Custom preview"
                      className="w-12 h-16 object-cover rounded border border-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        कस्टम पोस्टर सक्रिय (Active Live Preview)
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        Nitish Khobragade आधिकारिक वॉटरमार्क एवं मुहर ओवरले स्वचालित रूप से जोड़ी गई है।
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Text Customizer Fields (relevant for Auto mode or text overlay) */}
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
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left',
              }}
              className="absolute top-0 left-0"
            >
              <JobPoster
                ref={posterRef}
                job={job}
                customHeadline={customHeadline}
                customPosts={customPosts}
                customLastDate={customLastDate}
                customFeeAlert={customFeeAlert}
                customPoints={customPoints}
                customNote={customNote}
                customPosterUrl={customPosterUrl}
                useCustomPoster={posterMode === 'custom' && Boolean(customPosterUrl)}
                aspectRatio={aspectRatio}
              />
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
