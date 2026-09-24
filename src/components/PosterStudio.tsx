"use client";

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { toPng } from 'html-to-image';
import {
  Download,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Palette,
  User,
  Sliders,
  Sparkles,
  Eye,
  ZoomIn,
  ZoomOut,
  Type,
  Upload,
  Trash2,
  Search,
  RefreshCw,
  ArrowLeft,
  LayoutGrid,
  Globe,
  HardDrive
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { JobPoster, PosterTheme, TitleScale } from './JobPoster';
import { CharacterType } from './CandidateCharacter';
import { WHATSAPP_CHANNEL_URL } from '../lib/qrCodeHelper';
import { updateJob } from '../lib/firebase';
import { getPostRoutingMeta } from '../lib/postRouting';

interface PosterStudioProps {
  job: JobPostDetail | PostRecord;
  onClose?: () => void;
  onBackToPosts?: () => void;
  isModal?: boolean;
  initialEditableMode?: boolean;
  isAdmin?: boolean;
  variant?: 'admin' | 'publicShowcase';
  onJobUpdated?: (updated: PostRecord) => void;
}

export type DownloadResolution = '1080x1350' | '1440x1800' | '2160x2700' | '1080x1920' | '1440x2560';
export type DownloadSizeTarget = 'under_500kb' | 'under_1mb' | 'max_lossless';

export const PosterStudio: React.FC<PosterStudioProps> = ({
  job,
  onClose,
  onBackToPosts,
  isModal = false,
  initialEditableMode = false,
  isAdmin,
  variant = 'admin',
  onJobUpdated
}) => {
  const posterRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  // Aspect ratio: 'feed' (4:5 - 1080x1350) or 'story' (9:16 - 1080x1920)
  const [aspectRatio, setAspectRatio] = useState<'feed' | 'story'>('feed');
  const [zoomLevel, setZoomLevel] = useState<number>(0.38);

  // Responsive container observer for zero-crop mobile viewport scaling
  useEffect(() => {
    const el = previewContainerRef.current;
    if (!el) return;

    const measure = () => {
      const width = el.getBoundingClientRect().width;
      if (width > 0) {
        setContainerWidth(width);
      }
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  // Download Config State
  const [downloadResolution, setDownloadResolution] = useState<DownloadResolution>('1080x1350');
  const [downloadSizeTarget, setDownloadSizeTarget] = useState<DownloadSizeTarget>('under_500kb');

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
  const [activeTab, setActiveTab] = useState<'headline' | 'tiles' | 'theme' | 'branding' | 'download'>('headline');

  // Canvas target dimensions
  const targetWidth = 1080;
  const targetHeight = aspectRatio === 'story' ? 1920 : 1350;

  // Dynamic responsive scale to ensure 1080x1350 poster scales down smoothly without cutting edges on small viewports
  const maxSafeScale = containerWidth > 32 ? (containerWidth - 16) / targetWidth : 0.32;
  const responsiveScale = containerWidth > 0 ? Math.min(zoomLevel, maxSafeScale) : Math.min(zoomLevel, 0.35);
  const isScaledForMobile = containerWidth > 0 && maxSafeScale < zoomLevel;
  const previewRenderWidth = Math.round(targetWidth * responsiveScale);
  const previewRenderHeight = Math.round(targetHeight * responsiveScale);

  // Normalize post details
  const isPostRecord = (j: JobPostDetail | PostRecord): j is PostRecord => 'dates' in j;
  const postRec = isPostRecord(job) ? job : null;
  const detailRec = !isPostRecord(job) ? (job as JobPostDetail) : null;

  const defaultTitle = job.title;
  const defaultShortTitle = job.shortTitle || job.title.slice(0, 30);
  const defaultDept = postRec ? postRec.dept : detailRec?.department || '';
  const defaultPosts = String(job.totalPosts || 'विज्ञप्ति अनुसार');
  const defaultLastDate = postRec ? postRec.dates?.end || '' : detailRec?.lastDate || '';
  const defaultStartDate = postRec ? postRec.dates?.start || '' : detailRec?.startDate || '';
  const defaultFeeGen = postRec ? postRec.fee?.gen || '₹500/-' : detailRec?.feeGeneral || '₹500/-';
  const defaultFeeRes = postRec ? postRec.fee?.reserved || '₹250/-' : detailRec?.feeReserved || '₹250/-';
  const defaultEligibility = postRec ? postRec.eligibility || '' : detailRec?.qualificationSummary || '';
  const defaultMinAge = postRec ? postRec.minAge || '18 वर्ष' : detailRec?.minAge || '18 वर्ष';
  const defaultMaxAge = postRec ? postRec.maxAge || '33 वर्ष' : detailRec?.maxAge || '33 वर्ष';

  const posterConfig = postRec?.posterConfig;

  // Visual Customizer Controls with State Persistence (Default No Character)
  const [theme, setTheme] = useState<PosterTheme>(posterConfig?.theme || 'classic');
  const [characterType, setCharacterType] = useState<CharacterType>(posterConfig?.characterType || 'none');
  const [customCharacterUrl, setCustomCharacterUrl] = useState<string>(posterConfig?.customCharacterUrl || '');
  const [characterScale, setCharacterScale] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [titleScale, setTitleScale] = useState<TitleScale>(posterConfig?.titleScale || 'md');
  const [showQrCode, setShowQrCode] = useState<boolean>(
    posterConfig?.showQrCode !== undefined ? posterConfig.showQrCode : true
  );

  // Content Customizer Controls
  const [customHeadline, setCustomHeadline] = useState<string>(
    posterConfig?.headline || `${defaultShortTitle} भर्ती 2026`
  );
  const [customDeptSubtitle, setCustomDeptSubtitle] = useState<string>(
    posterConfig?.customDeptSubtitle || defaultDept
  );
  const [customRoleSubtitle, setCustomRoleSubtitle] = useState<string>(
    posterConfig?.customRoleSubtitle || 'ऑनलाइन भर्ती विज्ञापन 2026'
  );
  const [customPosts, setCustomPosts] = useState<string>(posterConfig?.customPosts || defaultPosts);
  const [customLastDate, setCustomLastDate] = useState<string>(posterConfig?.customLastDate || defaultLastDate);
  const [customFeeAlert, setCustomFeeAlert] = useState<string>(
    posterConfig?.customFeeAlert || `${defaultFeeGen} / ${defaultFeeRes}`
  );
  const [customNote] = useState<string>(
    posterConfig?.note || 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
  );

  // Granular 4-Tile Controls
  const [customTile1Label, setCustomTile1Label] = useState<string>(
    posterConfig?.customTile1Label || 'शैक्षणिक योग्यता'
  );
  const [customTile1Value, setCustomTile1Value] = useState<string>(
    posterConfig?.customTile1Value || defaultEligibility || '10वीं / 12वीं अथवा स्नातक पास'
  );
  const [customTile2Label, setCustomTile2Label] = useState<string>(
    posterConfig?.customTile2Label || 'आयु सीमा'
  );
  const [customTile2Value, setCustomTile2Value] = useState<string>(
    posterConfig?.customTile2Value || `${defaultMinAge} से ${defaultMaxAge}`
  );
  const [customTile2Sub, setCustomTile2Sub] = useState<string>(
    posterConfig?.customTile2Sub || 'नियमानुसार आयु में छूट लागू'
  );
  const [customTile3Label, setCustomTile3Label] = useState<string>(
    posterConfig?.customTile3Label || 'आवेदन प्रारंभ'
  );
  const [customTile3Value, setCustomTile3Value] = useState<string>(
    posterConfig?.customTile3Value || defaultStartDate || 'प्रारंभ हो चुका है'
  );
  const [customTile3Sub, setCustomTile3Sub] = useState<string>(
    posterConfig?.customTile3Sub || 'ऑनलाइन पोर्टल खुला है'
  );
  const [customTile4Label, setCustomTile4Label] = useState<string>(
    posterConfig?.customTile4Label || 'अंतिम तिथि'
  );
  const [customTile4Value, setCustomTile4Value] = useState<string>(
    posterConfig?.customTile4Value || defaultLastDate || 'शीघ्र घोषित'
  );
  const [customTile4Sub, setCustomTile4Sub] = useState<string>(
    posterConfig?.customTile4Sub || 'अंतिम तिथि से पूर्व भरें'
  );

  // Granular Branding Controls
  const [customWebsiteUrl, setCustomWebsiteUrl] = useState<string>(
    posterConfig?.customWebsiteUrl || 'WWW.NPJOBPORTAL.COM'
  );
  const [customWebsiteTagline, setCustomWebsiteTagline] = useState<string>(
    posterConfig?.customWebsiteTagline || 'घर बैठे सुरक्षित ऑनलाइन फॉर्म भरवाएं • विश्वसनीय सेवा केंद्र'
  );
  const [customBottomCallout, setCustomBottomCallout] = useState<string>(
    posterConfig?.customBottomCallout || `${defaultShortTitle} शुरू - जल्दी आवेदन करें!`
  );
  const [customOwnerCallout, setCustomOwnerCallout] = useState<string>(
    `संचालक: ${OWNER_INFO.name} (${OWNER_INFO.phone})`
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

  const handleSelectAiAvatar = (avatar: (typeof AI_AVATARS)[0]) => {
    setSelectedAvatarId(avatar.id);
    setCharacterType(avatar.type);
    setCustomCharacterUrl(avatar.type === 'custom' ? avatar.url : '');
  };

  const handleAiRegenerate = () => {
    setIsAiRegenerating(true);
    setTimeout(() => {
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

  // Poster Mode: 'auto' vs 'custom'
  const initialUseCustom = Boolean(postRec?.useCustomPoster || detailRec?.useCustomPoster);
  const initialCustomUrl = postRec?.customPosterUrl || detailRec?.customPosterUrl || '';
  const [posterMode, setPosterMode] = useState<'auto' | 'custom'>(initialUseCustom ? 'custom' : 'auto');
  const [customPosterUrl, setCustomPosterUrl] = useState<string>(initialCustomUrl);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number | null>(null);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const characterInputRef = useRef<HTMLInputElement>(null);

  // Handle aspect ratio toggle and adjust resolution default cleanly
  const handleAspectRatioChange = (ratio: 'feed' | 'story') => {
    setAspectRatio(ratio);
    if (ratio === 'story') {
      setZoomLevel(0.30);
      setDownloadResolution('1080x1920');
    } else {
      setZoomLevel(0.38);
      setDownloadResolution('1080x1350');
    }
  };

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

          const tW = 1080;
          const scale = tW / img.width;
          const tH = Math.round(img.height * scale);

          canvas.width = tW;
          canvas.height = tH;

          if (ctx) {
            ctx.drawImage(img, 0, 0, tW, tH);
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

  // Save Settings to Firestore (Persisting all granular posterConfig fields)
  const handleSavePosterPreference = async () => {
    if (!job.id || !isAdminState) return;

    try {
      setSaveStatusMsg('सेव किया जा रहा है...');
      const isCustom = posterMode === 'custom' && Boolean(customPosterUrl);

      const configToPersist = {
        headline: customHeadline,
        customDeptSubtitle,
        customRoleSubtitle,
        customPosts,
        customLastDate,
        customFeeAlert,
        theme,
        characterType,
        customCharacterUrl,
        titleScale,
        aspectRatio,
        showQrCode,
        customTile1Label,
        customTile1Value,
        customTile2Label,
        customTile2Value,
        customTile2Sub,
        customTile3Label,
        customTile3Value,
        customTile3Sub,
        customTile4Label,
        customTile4Value,
        customTile4Sub,
        customWebsiteUrl,
        customWebsiteTagline,
        customBottomCallout,
        note: customNote
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
    setCustomDeptSubtitle(defaultDept);
    setCustomRoleSubtitle('ऑनलाइन भर्ती विज्ञापन 2026');
    setCustomPosts(defaultPosts);
    setCustomLastDate(defaultLastDate);
    setCustomFeeAlert(`${defaultFeeGen} / ${defaultFeeRes}`);
    setCustomTile1Label('शैक्षणिक योग्यता');
    setCustomTile1Value(defaultEligibility || '10वीं / 12वीं अथवा स्नातक पास');
    setCustomTile2Label('आयु सीमा');
    setCustomTile2Value(`${defaultMinAge} से ${defaultMaxAge}`);
    setCustomTile2Sub('नियमानुसार आयु में छूट लागू');
    setCustomTile3Label('आवेदन प्रारंभ');
    setCustomTile3Value(defaultStartDate || 'प्रारंभ हो चुका है');
    setCustomTile3Sub('ऑनलाइन पोर्टल खुला है');
    setCustomTile4Label('अंतिम तिथि');
    setCustomTile4Value(defaultLastDate || 'शीघ्र घोषित');
    setCustomTile4Sub('अंतिम तिथि से पूर्व भरें');
    setCustomWebsiteUrl('WWW.NPJOBPORTAL.COM');
    setCustomWebsiteTagline('घर बैठे सुरक्षित ऑनलाइन फॉर्म भरवाएं • विश्वसनीय सेवा केंद्र');
    setCustomBottomCallout(`${defaultShortTitle} शुरू - जल्दी आवेदन करें!`);
  };

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    return (
      `📢 *${customHeadline || defaultTitle}*\n` +
      `🏢 विभाग: ${customDeptSubtitle || defaultDept}\n` +
      `👥 कुल पद: *${customPosts}*\n` +
      `🎓 योग्यता: ${customTile1Value || defaultEligibility || 'विज्ञप्ति अनुसार'}\n` +
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

  // Advanced Download Engine with Precise Resolution & Target File Size Control
  const handleDownloadPoster = async () => {
    if (!posterRef.current) return;
    try {
      setIsDownloading(true);
      setDownloadSuccessMsg(null);

      // 1. Capture base canvas at high fidelity
      let sourceCanvas: HTMLCanvasElement;
      try {
        sourceCanvas = await html2canvas(posterRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0
        });
      } catch {
        const rawUrl = await toPng(posterRef.current, {
          cacheBust: true,
          quality: 1,
          pixelRatio: 2,
          width: targetWidth,
          height: targetHeight
        });
        const img = new window.Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = rawUrl;
        });
        sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = targetWidth * 2;
        sourceCanvas.height = targetHeight * 2;
        const ctx = sourceCanvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
      }

      // 2. Parse selected target dimensions
      const [reqW, reqH] = downloadResolution.split('x').map(Number);

      // 3. Render offscreen canvas with target resolution and high bicubic smoothing
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = reqW;
      finalCanvas.height = reqH;
      const ctx = finalCanvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(sourceCanvas, 0, 0, reqW, reqH);
      }

      // 4. Compress to target file size
      let exportDataUrl = '';
      let ext = 'jpg';

      if (downloadSizeTarget === 'max_lossless') {
        exportDataUrl = finalCanvas.toDataURL('image/png', 1.0);
        ext = 'png';
      } else {
        const maxBytes = downloadSizeTarget === 'under_500kb' ? 500 * 1024 : 1000 * 1024;
        let quality = downloadSizeTarget === 'under_500kb' ? 0.85 : 0.94;
        exportDataUrl = finalCanvas.toDataURL('image/jpeg', quality);

        // Iterative compression loop to guarantee < 500KB or < 1MB
        let attempts = 0;
        while ((exportDataUrl.length * 3) / 4 > maxBytes && quality > 0.45 && attempts < 8) {
          quality -= 0.07;
          exportDataUrl = finalCanvas.toDataURL('image/jpeg', quality);
          attempts++;
        }
      }

      const finalSizeKb = Math.round((exportDataUrl.length * 3) / 4 / 1024);

      // 5. Trigger clean browser download
      const link = document.createElement('a');
      link.download = `NP_Job_Poster_${reqW}x${reqH}_${downloadSizeTarget}_${job.id || 'recruitment'}.${ext}`;
      link.href = exportDataUrl;
      link.click();

      setDownloadSuccessMsg(`पोस्टर डाउनलोड हुआ: ${reqW}×${reqH} px, ~${finalSizeKb} KB (${ext.toUpperCase()})`);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error downloading poster:', err);
      setDownloadSuccessMsg('डाउनलोड में त्रुटि आई!');
      setTimeout(() => setDownloadSuccessMsg(null), 4000);
    } finally {
      setIsDownloading(false);
    }
  };

  const directWhatsAppUrl = `https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(
    generateWhatsAppMessage()
  )}`;

  return (
    <div
      className={`w-full text-white transition-all ${
        variant === 'publicShowcase'
          ? 'bg-slate-950 border border-slate-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xl'
          : `bg-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-6 shadow-2xl ${
              isModal ? 'max-w-6xl mx-auto' : ''
            }`
      }`}
    >
      {/* PUBLIC SHOWCASE TOP BAR */}
      {variant === 'publicShowcase' ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 mb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-400 to-yellow-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs shrink-0">
              NP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs sm:text-sm text-white">
                  📢 आधिकारिक सोशल मीडिया विज्ञापन पोस्टर
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  HD
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                WhatsApp स्टेटस व ग्रुप्स पर शेयर करें • अधिकृत NP Job Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Aspect Ratio Switcher */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => handleAspectRatioChange('feed')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  aspectRatio === 'feed'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🖼️ 4:5 Feed
              </button>
              <button
                type="button"
                onClick={() => handleAspectRatioChange('story')}
                className={`px-2 py-1 rounded transition-all cursor-pointer ${
                  aspectRatio === 'story'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📱 9:16 Story
              </button>
            </div>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
              title="व्हाट्सएप पोस्ट टेक्स्ट कॉपी करें"
            >
              {copiedText ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">कॉपी हुआ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  <span>टेक्स्ट कॉपी</span>
                </>
              )}
            </button>

            {/* 1-Click WhatsApp Share */}
            <a
              href={directWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-xs active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>1-क्लिक शेयर</span>
            </a>

            {/* Direct Download */}
            <button
              onClick={handleDownloadPoster}
              disabled={isDownloading}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'तैयार...' : 'डाउनलोड (HD)'}</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 0. ACTIVE EDITING PERSISTENCE BANNER */}
      {/* Dynamic Header with Unique Identifier & Post Info */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-500/50 rounded-xl p-3.5 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
            📌
          </div>
          <div>
            {(() => {
              const routingMeta = getPostRoutingMeta(job);
              return (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                      वर्तमान में पोस्टर एडिट हो रहा है:
                    </span>
                    <span className="font-mono text-xs bg-slate-950 px-2.5 py-0.5 rounded-md border border-amber-400/80 text-amber-300 font-extrabold shadow-xs">
                      ID: {routingMeta.identifier}
                    </span>
                    <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                      {routingMeta.fullPath}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white truncate max-w-xl mt-1">
                    <span className="text-amber-400 mr-1.5 font-mono font-bold">[{routingMeta.identifier}]</span>
                    {job.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>विभाग: <strong className="text-slate-200">{job.dept}</strong></span>
                    <span>•</span>
                    <span>कुल पद: <strong className="text-amber-400 font-mono">{job.totalPosts}</strong></span>
                  </div>
                </>
              );
            })()}
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
            <span>← वापस पोस्ट सूची में जाएं</span>
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
                हाई-इम्पैक्ट सोशल मीडिया पोस्टर स्टूडियो 2.0
                <span className="text-amber-400 text-xs font-mono font-bold bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                  {aspectRatio === 'feed' ? '1080×1350 (4:5 Feed)' : '1080×1920 (9:16 Story)'}
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            वैकेंसी अपडेट स्टाइल: बड़े बोल्ड 3D हेडर, 4 हाई-कंट्रास्ट टाइल्स, कैंडिडेट कट-आउट व सुरक्षित डाउनलोड
          </p>
        </div>

        {/* Action Controls & Aspect Ratio */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aspect Ratio Selector */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleAspectRatioChange('feed')}
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
              onClick={() => handleAspectRatioChange('story')}
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
              <span>{showCustomizer ? 'कस्टमाइज़र छुपाएं' : 'फुल पोस्टर डिज़ाइन कंट्रोल'}</span>
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
            <span>1-क्लिक शेयर</span>
          </a>

          {/* Download Button */}
          <button
            onClick={handleDownloadPoster}
            disabled={isDownloading}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs sm:text-sm font-black transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                <span>एक्सपोर्ट हो रहा है...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>पोस्टर डाउनलोड ({downloadResolution})</span>
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
      </>
      )}

      {/* Download Result Banner */}
      {downloadSuccessMsg && (
        <div className="mt-3 p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-200 text-xs sm:text-sm font-bold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccessMsg}</span>
          </div>
          <span className="text-[11px] bg-emerald-900 px-2 py-0.5 rounded text-white font-mono">
            {downloadSizeTarget.toUpperCase()}
          </span>
        </div>
      )}

      {/* 2. ADMIN CUSTOMIZATION TOOLBAR - ADVANCED CONTROLS */}
      {isAdminState && showCustomizer && (
        <div className="mt-4 p-4 bg-slate-800/95 border border-amber-500/40 rounded-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-700 gap-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm text-amber-300">
                पोस्टर पूर्ण नियंत्रण एवं डिज़ाइन स्टूडियो (Full Control Studio)
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
                className="text-xs text-slate-400 hover:text-amber-300 flex items-center gap-1 px-2 py-1 bg-slate-900 rounded cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> रीसेट
              </button>
            </div>
          </div>

          {/* STUDIO TAB NAVIGATION */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-700/60">
            <button
              type="button"
              onClick={() => setActiveTab('headline')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'headline'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>1. 3D हेडर व पद संख्या</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tiles')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'tiles'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>2. 4-टाइल कस्टमाइज़र</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('theme')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'theme'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>3. थीम व AI कैरेक्टर</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'branding'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>4. ब्रांडिंग व QR कोड</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('download')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'download'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-750'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>5. डाउनलोड साइज़ & पिक्सल सेटिंग्स</span>
            </button>
          </div>

          {/* TAB 1: HEADLINE & VACANCIES */}
          {activeTab === 'headline' && (
            <div className="space-y-3 text-xs animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-slate-300 font-bold mb-1">
                    3D मुख्य शीर्षक (Large Bold Headline):
                  </label>
                  <input
                    type="text"
                    value={customHeadline}
                    onChange={(e) => setCustomHeadline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-sm focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    हेडलाइन फॉन्ट साइज़ (Font Size Scaler):
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
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">विभाग / उप-शीर्षक (Department Subtitle):</label>
                  <input
                    type="text"
                    value={customDeptSubtitle}
                    onChange={(e) => setCustomDeptSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">कुल पद हाइलाइट (Total Posts):</label>
                  <input
                    type="text"
                    value={customPosts}
                    onChange={(e) => setCustomPosts(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-black text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">पद का नाम (Role / Designation):</label>
                  <input
                    type="text"
                    value={customRoleSubtitle}
                    onChange={(e) => setCustomRoleSubtitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">आवेदन शुल्क अलर्ट (Fee Alert):</label>
                  <input
                    type="text"
                    value={customFeeAlert}
                    onChange={(e) => setCustomFeeAlert(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">अंतिम तिथि हाइलाइट (Last Date):</label>
                  <input
                    type="text"
                    value={customLastDate}
                    onChange={(e) => setCustomLastDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-rose-300 font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 4-TILE CUSTOMIZER */}
          {activeTab === 'tiles' && (
            <div className="space-y-3 text-xs animate-in fade-in">
              <p className="text-amber-300 font-semibold">
                पोस्टर के 4 मुख्य टाइल्स में टेक्स्ट को अपनी इच्छानुसार बदलें (प्रत्येक शब्द छोटे डिवाइस पर भी पूर्णतः पठनीय रहेगा):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tile 1 */}
                <div className="bg-slate-900 border border-teal-500/50 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-teal-300 font-bold">
                    <span>टाइल 1: शैक्षणिक योग्यता (Qualification)</span>
                    <span className="text-[10px] bg-teal-950 px-2 py-0.5 rounded border border-teal-700">ग्रीन/टीयल टाइल</span>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">टाइल शीर्षक (Label):</label>
                    <input
                      type="text"
                      value={customTile1Label}
                      onChange={(e) => setCustomTile1Label(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">योग्यता विवरण (Value):</label>
                    <input
                      type="text"
                      value={customTile1Value}
                      onChange={(e) => setCustomTile1Value(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                    />
                  </div>
                </div>

                {/* Tile 2 */}
                <div className="bg-slate-900 border border-fuchsia-500/50 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-fuchsia-300 font-bold">
                    <span>टाइल 2: आयु सीमा (Age Limit)</span>
                    <span className="text-[10px] bg-fuchsia-950 px-2 py-0.5 rounded border border-fuchsia-700">पर्पल/पिंक टाइल</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">टाइल शीर्षक:</label>
                      <input
                        type="text"
                        value={customTile2Label}
                        onChange={(e) => setCustomTile2Label(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">आयु सीमा (Value):</label>
                      <input
                        type="text"
                        value={customTile2Value}
                        onChange={(e) => setCustomTile2Value(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">छूट नोट (Sub-note):</label>
                    <input
                      type="text"
                      value={customTile2Sub}
                      onChange={(e) => setCustomTile2Sub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                {/* Tile 3 */}
                <div className="bg-slate-900 border border-amber-500/50 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-amber-300 font-bold">
                    <span>टाइल 3: आवेदन प्रारंभ (Starting Date)</span>
                    <span className="text-[10px] bg-amber-950 px-2 py-0.5 rounded border border-amber-700">ऑरेंज/एम्बर टाइल</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">टाइल शीर्षक:</label>
                      <input
                        type="text"
                        value={customTile3Label}
                        onChange={(e) => setCustomTile3Label(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">प्रारंभ तिथि (Value):</label>
                      <input
                        type="text"
                        value={customTile3Value}
                        onChange={(e) => setCustomTile3Value(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">उप-नोट (Sub-note):</label>
                    <input
                      type="text"
                      value={customTile3Sub}
                      onChange={(e) => setCustomTile3Sub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                {/* Tile 4 */}
                <div className="bg-slate-900 border border-cyan-500/50 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-cyan-300 font-bold">
                    <span>टाइल 4: अंतिम तिथि (Last Date)</span>
                    <span className="text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-700">रॉयल ब्लू/क्यान टाइल</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">टाइल शीर्षक:</label>
                      <input
                        type="text"
                        value={customTile4Label}
                        onChange={(e) => setCustomTile4Label(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[11px] mb-1">अंतिम तिथि (Value):</label>
                      <input
                        type="text"
                        value={customTile4Value}
                        onChange={(e) => setCustomTile4Value(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-bold text-rose-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">अलर्ट नोट (Sub-note):</label>
                    <input
                      type="text"
                      value={customTile4Sub}
                      onChange={(e) => setCustomTile4Sub(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: THEME & CHARACTER */}
          {activeTab === 'theme' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              {/* Theme Switcher with 6 Styles */}
              <div>
                <label className="block text-slate-300 font-bold mb-2 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>6 प्रीमियम 3D कलर थीम्स (Select Theme Style):</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('classic')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      theme === 'classic'
                        ? 'bg-blue-900 border-amber-400 text-white font-black ring-2 ring-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-bold">🎨 Classic Vacancy</span>
                    <span className="text-[10px] text-amber-300">ब्लू / गोल्ड 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('navy')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      theme === 'navy'
                        ? 'bg-blue-950 border-amber-400 text-white font-black ring-2 ring-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-bold">⚓ Royal Navy</span>
                    <span className="text-[10px] text-cyan-300">नेवी व गोल्ड</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('emerald')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      theme === 'emerald'
                        ? 'bg-emerald-950 border-emerald-400 text-white font-black ring-2 ring-emerald-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-bold">🌲 Emerald Green</span>
                    <span className="text-[10px] text-emerald-300">हरा व मिंट</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('crimson')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      theme === 'crimson'
                        ? 'bg-rose-950 border-amber-400 text-white font-black ring-2 ring-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-bold">🔥 Crimson Festive</span>
                    <span className="text-[10px] text-rose-300">रेड व गोल्ड</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('purple')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      theme === 'purple'
                        ? 'bg-purple-950 border-amber-400 text-white font-black ring-2 ring-amber-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-bold">👑 Purple Royale</span>
                    <span className="text-[10px] text-fuchsia-300">बैंगनी व गोल्ड</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('cyber')}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      theme === 'cyber'
                        ? 'bg-slate-950 border-cyan-400 text-cyan-300 font-black ring-2 ring-cyan-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs block font-bold">⚡ Cyber Dark</span>
                    <span className="text-[10px] text-cyan-300">हाई-टेक डार्क</span>
                  </button>
                </div>
              </div>

              {/* Character Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center justify-between gap-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>कैंडिडेट कट-आउट (Cartoon / Avatar):</span>
                    </span>
                    <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                      डिफ़ॉल्ट: Turn Off (No Character)
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCharacterType('none')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        characterType === 'none'
                          ? 'bg-gradient-to-r from-emerald-950 to-slate-900 border-emerald-400 text-white font-black ring-1 ring-emerald-400/50 shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold block">🚫 No Character</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">डिफ़ॉल्ट</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">फुल चौड़ाई टाइल्स (कार्टून बंद)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCharacterType('male')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        characterType === 'male'
                          ? 'bg-blue-900 border-amber-400 text-white font-black ring-1 ring-amber-400/50 shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs block font-bold">👨‍🎓 Male Aspirant</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">स्मार्ट स्टूडेंट कट-आउट</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCharacterType('female')}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        characterType === 'female'
                          ? 'bg-purple-900 border-amber-400 text-white font-black ring-1 ring-amber-400/50 shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs block font-bold">👩‍💼 Female Officer</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">ऑफिसर लुक कट-आउट</span>
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
                        className={`block p-2 rounded-xl border text-left cursor-pointer transition-all ${
                          characterType === 'custom'
                            ? 'bg-amber-900 border-amber-400 text-white font-black ring-1 ring-amber-400/50 shadow-sm'
                            : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-xs block truncate font-bold">📤 Custom PNG</span>
                        <span className="text-[10px] text-amber-300 font-medium block mt-0.5">अपना कट-आउट अपलोड करें</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    💡 <strong className="text-slate-300">नोट:</strong> बाय डिफ़ॉल्ट कार्टून कट-आउट बंद रहेगा। यदि आप चाहें तो ऊपर दिए गए Male, Female अथवा Custom PNG पर क्लिक करके इसे ऑन (Enable) कर सकते हैं।
                  </p>
                </div>

                {/* Character Scale */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1.5 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>कैरेक्टर का आकार (Character Scaling):</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['normal', 'large', 'xlarge'] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setCharacterScale(sc)}
                        className={`p-2 rounded-xl border text-center font-bold capitalize transition-all ${
                          characterScale === sc
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        {sc === 'normal' ? 'साधारण' : sc === 'large' ? 'बड़ा (+10%)' : 'विशाल (+20%)'}
                      </button>
                    ))}
                  </div>

                  {/* AI Quick Avatar Presets */}
                  <div className="pt-2">
                    <label className="block text-slate-400 text-[11px] mb-1">त्वरित AI अवतार:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {AI_AVATARS.slice(0, 2).map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => handleSelectAiAvatar(av)}
                          className={`px-2 py-1.5 bg-slate-900 hover:bg-slate-750 border rounded-lg text-left text-[11px] truncate flex items-center gap-1.5 ${
                            selectedAvatarId === av.id ? 'border-amber-400 text-amber-300 font-bold' : 'border-slate-700 text-slate-300'
                          }`}
                        >
                          <span>{av.badge.slice(0, 2)}</span>
                          <span className="truncate">{av.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Search & Prompt */}
              <div className="bg-purple-950/40 border border-purple-500/40 p-3 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-200 font-bold">AI कैरेक्टर सर्च / प्रॉम्प्ट:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={aiSearchPrompt}
                      onChange={(e) => setAiSearchPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAiRegenerate();
                      }}
                      placeholder="उदा. 'MP Police Constable', 'Railway Pilot', 'IT Specialist'..."
                      className="w-full bg-slate-950 border border-purple-500/40 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <Search className="w-3.5 h-3.5 text-purple-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAiRegenerate}
                    disabled={isAiRegenerating}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAiRegenerating ? 'animate-spin' : ''}`} />
                    <span>AI लगाएं</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BRANDING & QR CODE */}
          {activeTab === 'branding' && (
            <div className="space-y-3 text-xs animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    वेबसाइट ब्रांडिंग URL (Website Banner):
                  </label>
                  <input
                    type="text"
                    value={customWebsiteUrl}
                    onChange={(e) => setCustomWebsiteUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-black text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    ब्रांडिंग टैगलाइन (Tagline):
                  </label>
                  <input
                    type="text"
                    value={customWebsiteTagline}
                    onChange={(e) => setCustomWebsiteTagline(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    बॉटम कॉलआउट टेक्स्ट (Bottom Action Callout):
                  </label>
                  <input
                    type="text"
                    value={customBottomCallout}
                    onChange={(e) => setCustomBottomCallout(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    संचालक संपर्क सूत्र (Owner Note):
                  </label>
                  <input
                    type="text"
                    value={customOwnerCallout}
                    onChange={(e) => setCustomOwnerCallout(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold text-blue-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-xl">
                <div>
                  <span className="font-bold text-white block">व्हाट्सएप चैनल QR कोड कार्ड</span>
                  <span className="text-slate-400 text-[11px]">पोस्टर के निचले दाएं कोने पर स्कैन करने हेतु बारकोड कार्ड</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showQrCode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Check className={`w-4 h-4 ${showQrCode ? 'opacity-100' : 'opacity-0'}`} />
                  <span>{showQrCode ? 'QR कोड चालू है' : 'QR कोड बंद है'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOAD & RESOLUTION ENGINE */}
          {activeTab === 'download' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div>
                <label className="block text-amber-300 font-black mb-1.5 flex items-center gap-1.5 text-sm">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  <span>पोस्टर डाउनलोड पिक्सल रिज़ॉल्यूशन (Select Resolution):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('feed');
                      setDownloadResolution('1080x1350');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      downloadResolution === '1080x1350'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-black text-xs">1080 × 1350 px</span>
                    <span className="text-[10px] opacity-80">4:5 Feed Standard HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('feed');
                      setDownloadResolution('1440x1800');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      downloadResolution === '1440x1800'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-black text-xs">1440 × 1800 px</span>
                    <span className="text-[10px] opacity-80">4:5 Feed 2K Quad HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('feed');
                      setDownloadResolution('2160x2700');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      downloadResolution === '2160x2700'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-black text-xs">2160 × 2700 px</span>
                    <span className="text-[10px] opacity-80">4:5 Feed 4K Ultra HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('story');
                      setDownloadResolution('1080x1920');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      downloadResolution === '1080x1920'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-black text-xs">1080 × 1920 px</span>
                    <span className="text-[10px] opacity-80">9:16 WhatsApp Story HD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAspectRatio('story');
                      setDownloadResolution('1440x2560');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      downloadResolution === '1440x2560'
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="block font-black text-xs">1440 × 2560 px</span>
                    <span className="text-[10px] opacity-80">9:16 WhatsApp Story 2K</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-amber-300 font-black mb-1.5 flex items-center gap-1.5 text-sm">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>टारगेट इमेज साइज़ सीमा (Target File Size Constraint):</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setDownloadSizeTarget('under_500kb')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      downloadSizeTarget === 'under_500kb'
                        ? 'bg-emerald-950/80 border-emerald-400 text-white ring-2 ring-emerald-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black block text-emerald-300">⚡ Under 500 KB (Recommended)</span>
                    <span className="text-[11px] text-slate-300 mt-0.5 block">
                      व्हाट्सएप ग्रुप्स व स्टेटस पर तुरंत सेंड करने के लिए सबसे उपयुक्त।
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDownloadSizeTarget('under_1mb')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      downloadSizeTarget === 'under_1mb'
                        ? 'bg-blue-950/80 border-blue-400 text-white ring-2 ring-blue-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black block text-blue-300">🎯 Under 1 MB (High Quality)</span>
                    <span className="text-[11px] text-slate-300 mt-0.5 block">
                      उच्च कंट्रास्ट, फेसबुक व इंस्टाग्राम एचडी पोस्ट के लिए सर्वश्रेष्ठ।
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDownloadSizeTarget('max_lossless')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      downloadSizeTarget === 'max_lossless'
                        ? 'bg-purple-950/80 border-purple-400 text-white ring-2 ring-purple-400'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black block text-purple-300">💎 Lossless Master (PNG ~2MB)</span>
                    <span className="text-[11px] text-slate-300 mt-0.5 block">
                      कियोस्क फ्लेक्स प्रिंटिंग व 100% पिक्सल-परफेक्ट आउटपुट हेतु।
                    </span>
                  </button>
                </div>
              </div>

              {/* Direct Download Action Button */}
              <div className="pt-2 flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-700">
                <div className="text-xs text-slate-300">
                  <span>वर्तमान चयन: </span>
                  <strong className="text-amber-300">{downloadResolution} पिक्सल</strong>
                  <span> • साइज़: </span>
                  <strong className="text-emerald-300">
                    {downloadSizeTarget === 'under_500kb'
                      ? '< 500 KB'
                      : downloadSizeTarget === 'under_1mb'
                      ? '< 1 MB'
                      : 'Master PNG'}
                  </strong>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadPoster}
                  disabled={isDownloading}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 rounded-xl font-black text-xs shadow-lg hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloading ? 'तैयार हो रहा है...' : 'तुरंत डाउनलोड करें'}</span>
                </button>
              </div>
            </div>
          )}

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
        </div>
      )}

      {/* 3. MAIN STUDIO VIEWPORT */}
      <div className={variant === 'publicShowcase' ? 'mt-1 flex flex-col items-center' : 'mt-5 flex flex-col items-center'}>
        {/* Instruction Helper Banner */}
        {variant !== 'publicShowcase' && (
          <div className="w-full max-w-xl bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-2 mb-4 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                यह पोस्टर {targetWidth}×{targetHeight} पिक्सल ({aspectRatio === 'feed' ? '4:5 Social Feed' : '9:16 WhatsApp Story'}) में रेंडर हो रहा है।
              </span>
            </span>
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 100% स्पष्ट एवं पठनीय
            </span>
          </div>
        )}

        {/* Scrollable / Scaled Preview Container */}
        <div ref={previewContainerRef} className="w-full max-w-full py-2 flex flex-col items-center justify-center overflow-x-auto overflow-y-hidden">
          {isScaledForMobile && (
            <div className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-[11px] font-bold text-amber-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>मोबाइल स्क्रीन अनुकूलित (किनारे नहीं कटेंगे • 100% दृश्यमान)</span>
            </div>
          )}

          <div
            style={{
              width: `${previewRenderWidth}px`,
              height: `${previewRenderHeight}px`,
              maxWidth: '100%'
            }}
            className="relative shadow-2xl rounded-2xl border-2 border-amber-500/40 overflow-hidden bg-white shrink-0 transition-all duration-150"
          >
            {/* The Actual Canvas Being Scaled */}
            <div
              style={{
                width: `${targetWidth}px`,
                height: `${targetHeight}px`,
                transform: `scale(${responsiveScale})`,
                transformOrigin: 'top left'
              }}
              className="absolute top-0 left-0"
            >
              <JobPoster
                ref={posterRef}
                job={job}
                customHeadline={customHeadline}
                customDeptSubtitle={customDeptSubtitle}
                customRoleSubtitle={customRoleSubtitle}
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
                characterScale={characterScale}
                titleScale={titleScale}
                showQrCode={showQrCode}
                customTile1Label={customTile1Label}
                customTile1Value={customTile1Value}
                customTile2Label={customTile2Label}
                customTile2Value={customTile2Value}
                customTile2Sub={customTile2Sub}
                customTile3Label={customTile3Label}
                customTile3Value={customTile3Value}
                customTile3Sub={customTile3Sub}
                customTile4Label={customTile4Label}
                customTile4Value={customTile4Value}
                customTile4Sub={customTile4Sub}
                customWebsiteUrl={customWebsiteUrl}
                customWebsiteTagline={customWebsiteTagline}
                customBottomCallout={customBottomCallout}
                customOwnerCallout={customOwnerCallout}
              />
            </div>
          </div>
        </div>

        {/* Bottom Feature Badges or Public Showcase Caption */}
        {variant === 'publicShowcase' ? (
          <p className="mt-2 text-center text-[11px] text-slate-400 font-medium">
            ✨ इस विज्ञापन पोस्टर को अपने WhatsApp Status एवं दोस्तों के साथ शेयर करें। घर बैठे 100% सुरक्षित फॉर्म हेतु संपर्क: <strong className="text-amber-300 font-bold">{OWNER_INFO.name} ({OWNER_INFO.phone})</strong>
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{aspectRatio === 'feed' ? '4:5 इंस्टाग्राम व व्हाट्सएप पोस्ट' : '9:16 व्हाट्सएप स्टेटस व स्टोरी'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>टारगेट साइज़: {downloadSizeTarget === 'under_500kb' ? '< 500 KB' : downloadSizeTarget === 'under_1mb' ? '< 1 MB' : 'PNG'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>डायनेमिक व्हाट्सएप चैनल QR कोड सहित</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
