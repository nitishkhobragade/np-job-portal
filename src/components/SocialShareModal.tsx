"use client";

import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import {
  X,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Send,
  Sparkles,
  Smartphone,
  Loader2
} from 'lucide-react';
import { PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { getPostUrl } from '../lib/postRouting';
import { JobPoster } from './JobPoster';

interface SocialShareModalProps {
  job: PostRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInPosterStudio?: (job: PostRecord) => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  job,
  isOpen,
  onClose,
  onOpenInPosterStudio
}) => {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const posterCaptureRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !job) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://npjobportal.in';
  const jobUrl = `${origin}${getPostUrl(job)}`;

  const formattedShareText =
    `📢 *NP Job Portal - New Recruitment Alert!*\n` +
    `📌 *Post:* ${job.title}\n` +
    `🏛️ *Department:* ${job.dept}\n` +
    `👥 *Total Posts:* ${job.totalPosts || 'विज्ञप्ति अनुसार'}\n` +
    `🎓 *Qualification:* ${job.eligibility || job.qualification || 'विस्तृत अधिसूचना देखें'}\n` +
    `📅 *Last Date:* ${job.dates?.end || job.lastDate || 'शीघ्र'}\n` +
    `🔗 *Apply / Full Details:* ${jobUrl}\n` +
    `📱 *घर बैठे सुरक्षित फॉर्म भराने हेतु संपर्क करें:* Nitish Khobragade (${OWNER_INFO.phone})`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShareWithPoster = async (targetChannel?: 'whatsapp' | 'telegram' | 'native') => {
    if (!posterCaptureRef.current) return;
    setIsGenerating(true);
    setStatusToast(null);

    try {
      // 1. Render HD 9:16 poster via html2canvas
      const canvas = await html2canvas(posterCaptureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#020617',
        windowWidth: 1080,
        windowHeight: 1920
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsGenerating(false);
          return;
        }

        const fileName = `NP_Job_Poster_${job.slug || job.id || 'recruitment'}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        // 2. Check if device supports WebShare API with files (Mobile Chrome, Safari, Android)
        if (
          targetChannel !== 'whatsapp' &&
          targetChannel !== 'telegram' &&
          typeof navigator !== 'undefined' &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: job.title,
              text: formattedShareText
            });
            setIsGenerating(false);
            setStatusToast('सफलतापूर्वक शेयर किया गया!');
            setTimeout(() => setStatusToast(null), 4000);
            return;
          } catch (err: unknown) {
            const error = err as { name?: string };
            if (error?.name === 'AbortError') {
              setIsGenerating(false);
              return;
            }
          }
        }

        // 3. Fallback for desktop or direct channels: Download HD Image + Copy Formatted Text
        const link = document.createElement('a');
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();

        try {
          await navigator.clipboard.writeText(formattedShareText);
        } catch {
          // ignore
        }

        setStatusToast('पोस्टर डाउनलोड हुआ एवं विवरण कॉपी किया गया! व्हाट्सएप चैट में पेस्ट करें।');
        setTimeout(() => setStatusToast(null), 6000);

        // Open target app if requested
        if (targetChannel === 'whatsapp') {
          const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareText)}`;
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        } else if (targetChannel === 'telegram') {
          const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(jobUrl)}&text=${encodeURIComponent(formattedShareText)}`;
          window.open(tgUrl, '_blank', 'noopener,noreferrer');
        }

        setIsGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.error('Poster generation error:', err);
      setIsGenerating(false);
      setStatusToast('पोस्टर तैयार करने में समस्या आई। केवल टेक्स्ट कॉपी किया गया।');
      setTimeout(() => setStatusToast(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Hidden Offscreen Container for HTML2Canvas High-Res Capture */}
      <div
        style={{
          position: 'fixed',
          top: '-9999px',
          left: '-9999px',
          width: '1080px',
          height: '1920px',
          overflow: 'hidden',
          zIndex: -1
        }}
      >
        <JobPoster ref={posterCaptureRef} job={job} aspectRatio="story" />
      </div>

      <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-xs">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>सोशल मीडिया मल्टी-शेयर</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-bold uppercase">
                  HD Poster + Summary
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                पोस्टर एवं संपूर्ण विवरण 1-क्लिक में WhatsApp, Telegram व अन्य ऐप्स पर साझा करें
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast Alert */}
        {statusToast && (
          <div className="bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold flex items-center gap-2 shadow-md animate-in slide-in-from-top duration-150">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusToast}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Target Job Info Pill */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                {job.dept}
              </span>
              <h4 className="text-sm font-black text-white line-clamp-1 mt-0.5">
                {job.title}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                <span>कुल पद: <strong className="text-amber-300">{job.totalPosts || 'N/A'}</strong></span>
                <span>•</span>
                <span>अंतिम तिथि: <strong className="text-rose-300">{job.dates?.end || job.lastDate || 'N/A'}</strong></span>
              </div>
            </div>
            <span className="shrink-0 px-2 py-1 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
              ID: {job.id}
            </span>
          </div>

          {/* Direct Share Options (WebShare with Poster) */}
          <div>
            <label className="block text-slate-300 font-bold mb-2">
              पोस्टर + टेक्स्ट शेयरिंग विकल्प (Instant Share with Poster):
            </label>

            {/* Primary Native WebShare Button */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleShareWithPoster('native')}
              className="w-full mb-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 text-white font-black text-sm shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>एचडी पोस्टर तैयार हो रहा है...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>सीधे ऐप्स पर शेयर करें (पोस्टर + विवरण)</span>
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              {/* WhatsApp Share with Poster */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleShareWithPoster('whatsapp')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp पर शेयर</span>
              </button>

              {/* Telegram Share with Poster */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => handleShareWithPoster('telegram')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Telegram पर शेयर</span>
              </button>
            </div>
          </div>

          {/* Formatted Text Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>ऑटो-फॉर्मेटेड संदेश प्रीव्यू (Job Summary Text):</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">कॉपी हो गया!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>टेक्स्ट कॉपी करें</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              readOnly
              rows={6}
              value={formattedShareText}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-sans text-xs leading-relaxed focus:outline-hidden selection:bg-amber-400 selection:text-slate-950 resize-none font-mono"
            />
          </div>

          {/* Poster Studio Quick Link */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <span>9:16 WhatsApp व Insta स्टोरी पोस्टर स्टूडियो</span>
                  <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded font-black">HD</span>
                </h5>
                <p className="text-[11px] text-slate-400">
                  पोस्टर का रंग, शीर्षक, मुख्य बिंदु व वाटरमार्क एडिट करें
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenInPosterStudio && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInPosterStudio(job);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>स्टूडियो में कस्टमाइज़ करें</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            संचालक: {OWNER_INFO.name} ({OWNER_INFO.phone})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
