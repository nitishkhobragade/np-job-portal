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
  Trash2,
  QrCode,
  User,
  Palette,
  Type,
  ArrowLeft,
  Search,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { JobPoster, PosterTheme, TitleScale } from './JobPoster';
import { CharacterType } from './CandidateCharacter';
import { updateJob } from '../lib/firebase';
import { WHATSAPP_CHANNEL_URL } from '../lib/qrCodeHelper';

interface PosterStudioProps {
  job: JobPostDetail | PostRecord;
  onClose?: () => void;
  onBackToPosts?: () => void;
  isModal?: boolean;
  initialEditableMode?: boolean;
  isAdmin?: boolean;
  onJobUpdated?: (updatedJob: PostRecord) => void;
}

export const PosterStudio: React.FC<PosterStudioProps> = ({
  job,
  onClose,
  onBackToPosts,
  isModal = false,
  initialEditableMode = false,
  isAdmin,
  onJobUpdated
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Aspect ratio: 'feed' (4:5 - 1080x1350) or 'story' (9:16 - 1080x1920)
  const [aspectRatio, setAspectRatio] = useState<'feed' | 'story'>('feed');
  const [zoomLevel, setZoomLevel] = useState<number>(0.38);

  // Admin authorization state
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

  // Canvas target dimensions
  const targetWidth = 1080;
  const targetHeight = aspectRatio === 'story' ? 1920 : 1350;

  // Normalize post details
  const isPostRecord = (j: JobPostDetail | PostRecord): j is PostRecord => 'dates' in j;
  const postRec = isPostRecord(job) ? job : null;
  const detailRec = !isPostRecord(job) ? (job as JobPostDetail) : null;

  const defaultTitle = job.title;
  const defaultShortTitle = job.shortTitle || job.title.slice(0, 30);
  const defaultDept = postRec ? postRec.dept : detailRec?.department || '';
  const defaultPosts = String(job.totalPosts || 'विज्ञप्ति अनुसार');
  const defaultLastDate = postRec ? postRec.dates?.end || '' : detailRec?.lastDate || '';
  const defaultFeeGen = postRec ? postRec.fee?.gen || '₹500/-' : detailRec?.feeGeneral || '₹500/-';
  const defaultFeeRes = postRec ? postRec.fee?.reserved || '₹250/-' : detailRec?.feeReserved || '₹250/-';
  const defaultEligibility = postRec ? postRec.eligibility || '' : detailRec?.qualificationSummary || '';
  const posterConfig = postRec?.posterConfig;

  // Visual Customizer Controls with State Persistence
  const [theme, setTheme] = useState<PosterTheme>(posterConfig?.theme || 'classic');
  const [characterType, setCharacterType] = useState<CharacterType>(posterConfig?.characterType || 'male');
  const [customCharacterUrl, setCustomCharacterUrl] = useState<string>(posterConfig?.customCharacterUrl || '');
  const [titleScale, setTitleScale] = useState<TitleScale>(posterConfig?.titleScale || 'md');
  const [showQrCode, setShowQrCode] = useState<boolean>(posterConfig?.showQrCode !== undefined ? posterConfig.showQrCode : true);

  // Content Customizer Controls
  const [customHeadline, setCustomHeadline] = useState<string>(
    posterConfig?.headline || `${defaultShortTitle} भर्ती 2026`
  );
  const [customPosts, setCustomPosts] = useState<string>(posterConfig?.customPosts || defaultPosts);
  const [customLastDate, setCustomLastDate] = useState<string>(posterConfig?.customLastDate || defaultLastDate);
  const [customFeeAlert, setCustomFeeAlert] = useState<string>(posterConfig?.customFeeAlert || `${defaultFeeGen} / ${defaultFeeRes}`);
  const [customNote, setCustomNote] = useState<string>(
    posterConfig?.note || 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
  );

  // AI Character & Logo Selector State
  const AI_AVATARS = [
    {
      id: 'police',
      title: 'MP Police / Defence',
      badge: '👮 वर्दीधारी पुलिस',
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
      type: 'custom' as CharacterType
    },
    {
      id: 'female-bank',
      title: 'Female Bank Officer',
      badge: '👩‍💼 बैंक/प्रशासनिक अधिकारी',
      url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
      type: 'female' as CharacterType
    },
    {
      id: 'railway',
      title: 'Railway Loco Pilot',
      badge: '🚆 रेलवे लोको पायलट',
      url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
      type: 'custom' as CharacterType
    },
    {
      id: 'tech',
      title: 'Tech & IT Specialist',
      badge: '💻 IT सॉफ्टवेयर इंजीनियर',
      url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      type: 'male' as CharacterType
    }
  ];
  const [aiSearchPrompt, setAiSearchPrompt] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('');
  const [isAiRegenerating, setIsAiRegenerating] = useState<boolean>(false);

  const handleSelectAiAvatar = (avatar: typeof AI_AVATARS[0]) => {
    setSelectedAvatarId(avatar.id);
    setCharacterType(avatar.type);
    setCustomCharacterUrl(avatar.type === 'custom' ? avatar.url : '');
  };

  const handleAiRegenerate = () => {
    setIsAiRegenerating(true);
    setTimeout(() => {
      // Dynamic AI rotation / avatar assignment based on prompt or category
      const q = aiSearchPrompt.toLowerCase().trim();
      let picked = AI_AVATARS[0];
      if (q.includes('female') || q.includes('bank') || q.includes('महिला') || q.includes('officer')) {
        picked = AI_AVATARS[1];
      } else if (q.includes('rail') || q.includes('train') || q.includes('लोको') || q.includes('इंजीनियर')) {
        picked = AI_AVATARS[2];
      } else if (q.includes('tech') || q.includes('it') || q.includes('developer') || q.includes('software')) {
        picked = AI_AVATARS[3];
      } else {
        const randomIdx = Math.floor(Math.random() * AI_AVATARS.length);
        picked = AI_AVATARS[randomIdx];
      }
      handleSelectAiAvatar(picked);
      setIsAiRegenerating(false);
      setSaveStatusMsg(`AI कैरेक्टर सेट: ${picked.title}`);
      setTimeout(() => setSaveStatusMsg(null), 3000);
    }, 400);
  };

  // Poster Mode: 'auto' (high-impact viral engine) vs 'custom' (uploaded banner compressed to ~100KB)
  const initialUseCustom = Boolean(postRec?.useCustomPoster || detailRec?.useCustomPoster);
  const initialCustomUrl = postRec?.customPosterUrl || detailRec?.customPosterUrl || '';
  const [posterMode, setPosterMode] = useState<'auto' | 'custom'>(initialUseCustom ? 'custom' : 'auto');
  const [customPosterUrl, setCustomPosterUrl] = useState<string>(initialCustomUrl);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Handle Custom Character Cut-out Upload (Option C)
  const handleCharacterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomCharacterUrl(dataUrl);
        setCharacterType('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Full Custom Image Upload & Compression (~100KB target)
  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setSaveStatusMsg('पोस्टर कंप्रेस किया जा रहा है (~100KB)...');

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          const targetWidth = 1080;
          const scale = targetWidth / img.width;
          const targetHeight = Math.round(img.height * scale);

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            let quality = 0.82;
            let webpDataUrl = canvas.toDataURL('image/webp', quality);
            let sizeInKb = Math.round((webpDataUrl.length * 3) / 4 / 1024);

            if (sizeInKb > 130) {
              quality = 0.7;
              webpDataUrl = canvas.toDataURL('image/webp', quality);
              sizeInKb = Math.round((webpDataUrl.length * 3) / 4 / 1024);
            }

            setCustomPosterUrl(webpDataUrl);
            setCompressedSizeKb(sizeInKb);
            setPosterMode('custom');
            setSaveStatusMsg(`पोस्टर कंप्रेस संपन्न (~${sizeInKb} KB)`);
            setTimeout(() => setSaveStatusMsg(null), 3000);
          }
          setIsCompressing(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image compression failed:', err);
      setIsCompressing(false);
      setSaveStatusMsg('इमेज कंप्रेस करने में त्रुटि!');
      setTimeout(() => setSaveStatusMsg(null), 3000);
    }
  };

  // Save Settings to Firestore (Persisting posterConfig)
  const handleSavePosterPreference = async () => {
    if (!job.id || !isAdminState) return;

    try {
      setSaveStatusMsg('सेव किया जा रहा है...');
      const isCustom = posterMode === 'custom' && Boolean(customPosterUrl);

      const configToPersist = {
        headline: customHeadline,
        keyPoints: [
          `कुल पद: ${customPosts}`,
          `अंतिम तिथि: ${customLastDate}`,
          `शैक्षणिक योग्यता: ${defaultEligibility.slice(0, 60)}`
        ],
        note: customNote,
        theme,
        characterType,
        customCharacterUrl,
        titleScale,
        aspectRatio,
        customPosts,
        customLastDate,
        customFeeAlert,
        showQrCode
      };

      await updateJob(job.id, {
        useCustomPoster: isCustom,
        customPosterUrl: isCustom ? customPosterUrl : '',
        posterConfig: configToPersist
      });

      if (onJobUpdated && postRec) {
        onJobUpdated({
          ...postRec,
          useCustomPoster: isCustom,
          customPosterUrl: isCustom ? customPosterUrl : '',
          posterConfig: configToPersist
        });
      }

      setSaveStatusMsg('पोस्टर सेटिंग्स सफलतापूर्वक सुरक्षित की गईं!');
      setTimeout(() => setSaveStatusMsg(null), 3500);
    } catch (err) {
      console.error('Save poster error:', err);
      setSaveStatusMsg('सहेजने में त्रुटि आई!');
      setTimeout(() => setSaveStatusMsg(null), 3500);
    }
  };

  const handleResetDefaults = () => {
    setTheme('classic');
    setCharacterType('male');
    setCustomCharacterUrl('');
    setTitleScale('md');
    setShowQrCode(true);
    setCustomHeadline(`${defaultShortTitle} भर्ती 2026`);
    setCustomPosts(defaultPosts);
    setCustomLastDate(defaultLastDate);
    setCustomFeeAlert(`${defaultFeeGen} / ${defaultFeeRes}`);
    setCustomNote('घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।');
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    return (
      `📢 *${customHeadline || defaultTitle}*\n` +
      `🏢 विभाग: ${defaultDept}\n` +
      `👥 कुल पद: *${customPosts}*\n` +
      `🎓 शैक्षणिक योग्यता: ${defaultEligibility || 'विज्ञप्ति अनुसार'}\n` +
      `📅 आवेदन की अंतिम तिथि: *${customLastDate}*\n` +
      `💰 आवेदन शुल्क: ${customFeeAlert}\n\n` +
      `📲 *व्हाट्सएप चैनल फॉलो करें:* ${WHATSAPP_CHANNEL_URL}\n\n` +
      `🎯 *घर बैठे 100% सही व सुरक्षित फॉर्म भरवाने के लिए संपर्क करें:*\n` +
      `👤 *${OWNER_INFO.name}* (NP Job Portal)\n` +
      `📞 कॉल/व्हाट्सएप: ${OWNER_INFO.phone}\n` +
      `💬 सीधा चैट: https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(
        'नमस्ते Nitish Ji, मुझे ' + defaultShortTitle + ' का फॉर्म भरवाना है।'
      )}\n` +
      `🌐 पोर्टल: WWW.NPJOBPORTAL.COM`
    );
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
        const canvas = await html2canvas(posterRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0
        });
        dataUrl = canvas.toDataURL('image/png', 1.0);
      } catch {
        dataUrl = await toPng(posterRef.current, {
          cacheBust: true,
          quality: 1,
          pixelRatio: 2,
          width: targetWidth,
          height: targetHeight
        });
      }

      if (!dataUrl) {
        throw new Error('Canvas export failed');
      }

      const link = document.createElement('a');
      link.download = `NP_Job_Poster_${aspectRatio === 'story' ? '9x16_Story' : '4x5_Feed'}_${job.id || 'recruitment'}.png`;
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
    generateWhatsAppMessage()
  )}`;

  return (
    <div
      className={`w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl text-white ${
        isModal ? 'max-w-6xl mx-auto' : ''
      }`}
    >
      {/* 0. ACTIVE EDITING PERSISTENCE BANNER */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/50 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
            📌
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                वर्तमान में एडिट हो रहा है:
              </span>
              <span className="font-mono text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-amber-500/30 text-amber-200 font-bold">
                ID: {job.id}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white truncate max-w-xl mt-0.5">
              {job.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={() => {
              if (onBackToPosts) {
                onBackToPosts();
              } else if (onClose) {
                onClose();
              } else if (typeof window !== 'undefined') {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'posts');
                url.searchParams.delete('postId');
                window.history.pushState(null, '', url.toString());
                window.location.reload();
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-xs"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>← वापस पोस्ट सूची में जाएं (Back to Posts)</span>
          </button>

          {isAdminState && (
            <button
              type="button"
              onClick={handleSavePosterPreference}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>💾 पोस्टर सेटिंग्स सुरक्षित करें</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. STUDIO HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-base shadow-md">
              NP
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                हाई-इम्पैक्ट सोशल मीडिया पोस्टर स्टूडियो
                <span className="text-amber-400 text-xs font-mono font-bold bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {aspectRatio === 'feed' ? '1080×1350 (4:5 Feed)' : '1080×1920 (9:16 Story)'}
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            वैकेंसी अपडेट स्टाइल: 3D हेडर, 2x2 वाइब्रेंट टाइल्स, कैंडिडेट कट-आउट व व्हाट्सएप QR कोड
          </p>
        </div>

        {/* Action Controls & Aspect Ratio */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAspectRatio('feed');
                setZoomLevel(0.38);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                aspectRatio === 'feed'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🖼️ 4:5 Feed Post</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAspectRatio('story');
                setZoomLevel(0.30);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                aspectRatio === 'story'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱 9:16 Status/Story</span>
            </button>
          </div>

          {/* Admin Customizer Toggle */}
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
              <span>{showCustomizer ? 'कस्टमाइज़र छुपाएं' : 'पोस्टर कस्टमाइज़ करें'}</span>
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
              onClick={() => setZoomLevel(Math.min(0.65, zoomLevel + 0.04))}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Copy Text Button */}
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

          {/* 1-Click WhatsApp Share */}
          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs sm:text-sm font-bold text-white transition-all shadow-xs"
          >
            <Share2 className="w-4 h-4" />
            <span>1-क्लिक व्हाट्सएप शेयर</span>
          </a>

          {/* HD Download PNG Button */}
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
                <span>HD पोस्टर (PNG) डाउनलोड</span>
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

      {/* 2. ADMIN CUSTOMIZATION TOOLBAR */}
      {isAdminState && showCustomizer && (
        <div className="mt-4 p-4 bg-slate-800/90 border border-amber-500/40 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-700 gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-300">
                पोस्टर नियंत्रक एवं डिज़ाइन टूलबार (Admin Toolbar)
              </span>
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
                <span>सेटिंग्स सहेजें</span>
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

          {/* AI SEARCH & PROMPT LOGO / CHARACTER SELECTOR */}
          <div className="bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/50 border border-purple-500/40 p-3.5 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-purple-200 font-black text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>AI सर्च व प्रॉम्प्ट लोगो / कैरेक्टर चयनकर्ता (AI Character Selector):</span>
              </label>
              <span className="text-[11px] text-purple-300 font-medium">
                4 त्वरित अवतार + AI री-जनरेट विकल्प
              </span>
            </div>

            {/* Input Prompt Box */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={aiSearchPrompt}
                  onChange={(e) => setAiSearchPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAiRegenerate();
                  }}
                  placeholder="कस्टम कैरेक्टर या लोगो सर्च करें (उदा. 'MP Police Constable Cartoon', 'Female Bank Officer', 'Railway Engineer')..."
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-400"
                />
                <Search className="w-3.5 h-3.5 text-purple-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              <button
                type="button"
                onClick={handleAiRegenerate}
                disabled={isAiRegenerating}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 shadow-md cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiRegenerating ? 'animate-spin' : ''}`} />
                <span>{isAiRegenerating ? 'जनरेटिंग...' : '🔄 AI री-जनरेट करें'}</span>
              </button>
            </div>

            {/* 4 Instant Selectable Preset Avatars */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {AI_AVATARS.map((av) => {
                const isSelected = selectedAvatarId === av.id || (av.type === 'custom' && customCharacterUrl === av.url) || (av.type !== 'custom' && characterType === av.type);
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => handleSelectAiAvatar(av)}
                    className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-900/60 border-purple-400 text-white font-black shadow-md ring-1 ring-purple-400'
                        : 'bg-slate-950/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center">
                      {av.type === 'custom' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={av.url} alt={av.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-base">{av.id === 'tech' ? '💻' : '👩‍💼'}</span>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="text-[11px] font-bold truncate leading-tight text-white">
                        {av.badge}
                      </div>
                      <div className="text-[9px] text-purple-300 truncate">
                        {av.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VISUAL DESIGN CONTROLS (Theme, Character, Headline Scale, QR Code) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/90 border border-slate-700 p-3 rounded-xl text-xs">
            {/* Theme Switcher */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>थीम चुनें (Theme Style):</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTheme('classic')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    theme === 'classic'
                      ? 'bg-blue-900/60 border-amber-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">🎨 Classic Vacancy</span>
                  <span className="text-[9px] text-amber-300 font-medium">ब्लू/गोल्ड 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('navy')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    theme === 'navy'
                      ? 'bg-blue-950 border-amber-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">⚓ Royal Navy</span>
                  <span className="text-[9px] text-cyan-300 font-medium">नेवी एवं गोल्ड</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('emerald')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    theme === 'emerald'
                      ? 'bg-emerald-950 border-emerald-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">🌲 Emerald Green</span>
                  <span className="text-[9px] text-emerald-300 font-medium">हरा एवं मिंट</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('crimson')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    theme === 'crimson'
                      ? 'bg-rose-950 border-amber-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">🔥 Crimson Festive</span>
                  <span className="text-[9px] text-rose-300 font-medium">रेड एवं गोल्ड</span>
                </button>
              </div>
            </div>

            {/* Character Selector */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>कैंडिडेट कट-आउट (Character):</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCharacterType('male')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    characterType === 'male'
                      ? 'bg-blue-900/60 border-amber-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">👨‍🎓 Male Aspirant</span>
                  <span className="text-[9px] text-slate-400">स्मार्ट स्टूडेंट</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCharacterType('female')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    characterType === 'female'
                      ? 'bg-purple-900/60 border-amber-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">👩‍💼 Female Officer</span>
                  <span className="text-[9px] text-slate-400">टैबलेट/ब्लूप्रिंट</span>
                </button>

                <div className="relative">
                  <input
                    ref={characterInputRef}
                    type="file"
                    accept="image/png,image/webp"
                    onChange={handleCharacterUpload}
                    className="hidden"
                    id="character-upload-input"
                  />
                  <label
                    htmlFor="character-upload-input"
                    className={`block p-1.5 rounded-lg border text-left cursor-pointer transition-all ${
                      characterType === 'custom'
                        ? 'bg-amber-900/60 border-amber-400 text-white font-black'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    <span className="text-[11px] block truncate">📤 Custom PNG</span>
                    <span className="text-[9px] text-amber-300 font-medium">कट-आउट अपलोड</span>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setCharacterType('none')}
                  className={`p-1.5 rounded-lg border text-left transition-all ${
                    characterType === 'none'
                      ? 'bg-slate-700 border-amber-400 text-white font-black'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-[11px] block">🚫 No Character</span>
                  <span className="text-[9px] text-slate-400">फुल चौड़ाई टाइल्स</span>
                </button>
              </div>
            </div>

            {/* Headline Text Scaler */}
            <div>
              <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span>हेडलाइन टेक्स्ट साइज़:</span>
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(['sm', 'md', 'lg', 'xl'] as TitleScale[]).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setTitleScale(sz)}
                    className={`py-2 rounded-lg border text-center font-bold text-xs uppercase transition-all ${
                      titleScale === sz
                        ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                शीर्षक के अनुसार फॉन्ट का आकार छोटा/बड़ा करें
              </p>
            </div>

            {/* QR Code & Auto Mode Toggle */}
            <div className="flex flex-col justify-between">
              <div>
                <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>व्हाट्सएप QR कोड:</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`w-full py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    showQrCode
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-slate-800 text-slate-400 border-slate-750'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 ${showQrCode ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{showQrCode ? 'QR कोड दृश्यमान है' : 'QR कोड छिपा हुआ है'}</span>
                </button>
              </div>

              {/* Mode Toggle Switch */}
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold">मोड:</span>
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setPosterMode('auto')}
                    className={`px-2 py-1 rounded transition-all ${
                      posterMode === 'auto'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-400'
                    }`}
                  >
                    ऑटो-इंजन
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosterMode('custom')}
                    className={`px-2 py-1 rounded transition-all ${
                      posterMode === 'custom'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'text-slate-400'
                    }`}
                  >
                    कस्टम पोस्टर
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Full Custom Poster Upload (if mode === 'custom') */}
          {posterMode === 'custom' && (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomImageUpload}
                    className="hidden"
                    id="full-custom-poster-file"
                  />
                  <label
                    htmlFor="full-custom-poster-file"
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{customPosterUrl ? 'नया पोस्टर बदलें' : 'पूरा पोस्टर इमेज अपलोड करें'}</span>
                  </label>

                  {customPosterUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomPosterUrl('');
                        setCompressedSizeKb(null);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold border border-rose-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>हटाएं</span>
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  {isCompressing ? (
                    <span className="text-amber-400 font-bold animate-pulse">
                      ऑटो-कंप्रेशन चालू (~1080px, WebP)...
                    </span>
                  ) : compressedSizeKb ? (
                    <span className="text-emerald-400 font-bold">
                      ✓ कंप्रेस्ड: ~{compressedSizeKb} KB (वेब अनुकूलित)
                    </span>
                  ) : (
                    <span>अनुपात: 4:5 या 9:16 • ऑटो-कंप्रेस ~100KB</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Text Customizer Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">हेडलाइन / मुख्य 3D शीर्षक:</label>
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
          </div>
        </div>
      )}

      {/* 3. MAIN STUDIO VIEWPORT */}
      <div className="mt-5 flex flex-col items-center">
        {/* Instruction Helper Banner */}
        <div className="w-full max-w-xl bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 mb-4 flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              यह पोस्टर {targetWidth}×{targetHeight} पिक्सल ({aspectRatio === 'feed' ? '4:5 Social Feed' : '9:16 WhatsApp Story'}) में एक्सपोर्ट होगा।
            </span>
          </span>
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> 100% आधिकारिक मुहर
          </span>
        </div>

        {/* Scrollable / Scaled Preview Container */}
        <div className="w-full overflow-x-auto overflow-y-hidden py-2 flex justify-center items-center">
          <div
            style={{
              width: `${targetWidth * zoomLevel}px`,
              height: `${targetHeight * zoomLevel}px`
            }}
            className="relative shadow-2xl rounded-2xl border-2 border-amber-500/40 overflow-hidden bg-white"
          >
            {/* The Actual Canvas Being Scaled */}
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top left'
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
                customNote={customNote}
                customPosterUrl={customPosterUrl}
                useCustomPoster={posterMode === 'custom' && Boolean(customPosterUrl)}
                aspectRatio={aspectRatio}
                theme={theme}
                characterType={characterType}
                customCharacterUrl={customCharacterUrl}
                titleScale={titleScale}
                showQrCode={showQrCode}
              />
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{aspectRatio === 'feed' ? '4:5 इंस्टाग्राम व व्हाट्सएप पोस्ट' : '9:16 व्हाट्सएप स्टेटस व स्टोरी'}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>अल्ट्रा-HD 2x सुपर शार्प एक्सपोर्ट</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>डायनेमिक व्हाट्सएप चैनल QR कोड सहित</span>
          </span>
        </div>
      </div>
    </div>
  );
};
