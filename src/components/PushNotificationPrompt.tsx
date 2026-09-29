"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellRing, CheckCircle2, X } from 'lucide-react';
import {
  isPushNotificationSupported,
  getNotificationPermissionState,
  registerWebPushSubscriber
} from '../lib/pushNotificationService';

export const PushNotificationPrompt: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Only run in client browser
    if (typeof window === 'undefined') return;

    const checkEligibility = async () => {
      const supported = await isPushNotificationSupported();
      if (!supported) return;

      const permission = getNotificationPermissionState();
      // If already granted or denied permanently, do not annoy the user
      if (permission === 'granted' || permission === 'denied') return;

      const alreadySubscribed = localStorage.getItem('np_push_subscribed');
      if (alreadySubscribed === 'true') return;

      const dismissedTime = localStorage.getItem('np_push_dismissed');
      if (dismissedTime) {
        const diffMs = Date.now() - parseInt(dismissedTime, 10);
        // Do not show again for 3 days if dismissed with "Later"
        if (diffMs < 3 * 24 * 60 * 60 * 1000) return;
      }

      // Small delay so user has chance to view page first
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3500);

      return () => clearTimeout(timer);
    };

    checkEligibility();
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    setErrorMessage('');

    const res = await registerWebPushSubscriber();
    setIsSubscribing(false);

    if (res.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    } else {
      setErrorMessage(res.error || 'पुश अनुमति नहीं मिली');
      setTimeout(() => {
        setErrorMessage('');
      }, 4000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('np_push_dismissed', String(Date.now()));
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-1.5rem)] bg-white dark:bg-slate-900 border-2 border-red-500/80 rounded-2xl shadow-2xl p-4 text-slate-900 dark:text-white"
        role="dialog"
        aria-live="polite"
      >
        {/* Close Cross */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="बंद करें"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="flex items-center gap-3 py-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-8 h-8 shrink-0 animate-bounce" />
            <div>
              <h4 className="text-sm font-black">पुश अलर्ट सक्रिय हो गया!</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                अब आपको हर नई सरकारी भर्ती व एडमिट कार्ड की सूचना सबसे पहले मिलेगी।
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header with Icon */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <BellRing className="w-5 h-5 animate-pulse" />
              </div>
              <div className="pr-5">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white leading-tight">
                  🔔 Sarkari Job & Admit Card Alerts Kabhi Na Chhutein!
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Push Notification On Karein — नई सरकारी भर्ती, MP व्यापम, SSC, एडमिट कार्ड व रिजल्ट की तुरंत जानकारी पाएं।
                </p>
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/40 p-1.5 rounded-lg border border-red-200">
                {errorMessage}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={isSubscribing}
                className="flex-1 py-2 px-3.5 rounded-xl font-black text-xs bg-linear-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white shadow-md hover:shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubscribing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>कनेक्ट हो रहा है...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-3.5 h-3.5" />
                    <span>Allow / Subscribe</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Later
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
