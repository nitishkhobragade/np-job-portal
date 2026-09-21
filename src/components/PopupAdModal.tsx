"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { X, ExternalLink, MessageCircle, Clock, ShieldCheck } from 'lucide-react';
import { PopupAdSettings } from '../types';
import { getPopupAdSettings } from '../lib/firebase';
import Image from 'next/image';

interface PopupAdModalProps {
  forceShow?: boolean; // Useful for admin preview
  customSettings?: PopupAdSettings;
  onClose?: () => void;
}

export const PopupAdModal: React.FC<PopupAdModalProps> = ({
  forceShow = false,
  customSettings,
  onClose,
}) => {
  const [ad, setAd] = useState<PopupAdSettings | null>(customSettings || null);
  const [isOpen, setIsOpen] = useState<boolean>(forceShow);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => customSettings?.durationSeconds || 5);

  const handleDismiss = useCallback(() => {
    setIsOpen(false);
    if (!forceShow) {
      try {
        sessionStorage.setItem('np_popup_ad_dismissed', '1');
      } catch {
        // ignore
      }
    }
    if (onClose) onClose();
  }, [forceShow, onClose]);

  useEffect(() => {
    if (customSettings) return;

    // Check if dismissed in this session
    if (!forceShow) {
      try {
        const isDismissed = sessionStorage.getItem('np_popup_ad_dismissed');
        if (isDismissed) return;
      } catch {
        // ignore
      }
    }

    let isMounted = true;
    getPopupAdSettings().then((settings) => {
      if (!isMounted) return;
      if (settings && (settings.enabled || forceShow)) {
        setAd(settings);
        setSecondsLeft(settings.durationSeconds || 5);
        // Delay of 1.2s after page load for smooth entry
        const timer = setTimeout(() => {
          if (isMounted) setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [forceShow, customSettings]);

  // Countdown timer when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, handleDismiss]);

  if (!isOpen || !ad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden text-neutral-900 transform transition-all scale-100">
        {/* Top Header Strip with Countdown Badge & Dismiss button */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-[11px] font-black px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              {ad.badge || 'विशेष सूचना'}
            </span>
            <span className="text-xs font-semibold text-rose-100 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              स्वतः बंद होगा: <strong className="text-white font-mono">{secondsLeft}s</strong>
            </span>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Close Advertisement"
            className="p-1 rounded-lg bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ad Image / Banner */}
        {ad.imageUrl && (
          <div className="relative w-full h-44 sm:h-52 bg-neutral-900 overflow-hidden">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex items-end p-4">
              <span className="text-white font-black text-lg drop-shadow-md">
                NP Job Portal • Nitish Khobragade (8982324497)
              </span>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 text-center">
          <h3 className="text-xl sm:text-2xl font-black text-neutral-900 leading-snug">
            {ad.title}
          </h3>

          {ad.subtitle && (
            <p className="text-sm font-semibold text-red-700 mt-1">
              {ad.subtitle}
            </p>
          )}

          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-neutral-700 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>घर बैठे सुरक्षित फॉर्म भरवाएं — दस्तावेज भेजें और तुरंत कम्प्यूटर रसीद पाएं!</span>
          </div>

          {/* Action CTA Buttons */}
          <div className="mt-5 flex flex-col sm:flex-row items-center gap-2.5">
            <a
              href={ad.redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="w-full flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{ad.ctaText || 'व्हाट्सएप पर तुरंत संपर्क करें'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs transition-colors"
            >
              बंद करें ({secondsLeft}s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
