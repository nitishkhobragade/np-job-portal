"use client";

import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Play, Clock, CheckCircle2 } from 'lucide-react';
import { getAdSenseConfig, isRewardedAdUnlocked, unlockRewardedAd } from '../lib/adsenseConfig';

export const RewardedAdGate: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isUnlockedSuccess, setIsUnlockedSuccess] = useState(false);

  useEffect(() => {
    // Check if AdSense is active and Rewarded Ad feature is turned on
    const checkStatus = () => {
      const config = getAdSenseConfig();
      if (!config.enabled || !config.rewardedAdEnabled) {
        setIsOpen(false);
        return;
      }

      // Check if user already unlocked in last 12 hours
      if (isRewardedAdUnlocked()) {
        setIsOpen(false);
        return;
      }

      // Show after 3 seconds of browsing
      const timer = setTimeout(() => {
        if (!isRewardedAdUnlocked()) {
          setIsOpen(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    };

    const cleanup = checkStatus();
    const onUpdate = () => checkStatus();
    window.addEventListener('np_adsense_config_updated', onUpdate);
    window.addEventListener('np_rewarded_unlocked', onUpdate);

    return () => {
      if (cleanup) cleanup();
      window.removeEventListener('np_adsense_config_updated', onUpdate);
      window.removeEventListener('np_rewarded_unlocked', onUpdate);
    };
  }, []);

  const handleStartWatch = () => {
    setIsWatching(true);
    let count = 5;
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setIsWatching(false);
        setIsUnlockedSuccess(true);
        unlockRewardedAd(12);

        setTimeout(() => {
          setIsOpen(false);
          setIsUnlockedSuccess(false);
          setCountdown(5);
        }, 1500);
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-amber-400 overflow-hidden text-center p-6 space-y-4">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 border border-amber-300 rounded-full text-xs font-black text-amber-950">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          <span>12 घंटे फ्री एक्सेस अनलॉक</span>
        </div>

        {isUnlockedSuccess ? (
          <div className="py-8 space-y-3">
            <div className="w-16 h-16 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black text-slate-950">12 घंटे के लिए अनलॉक सफल!</h3>
            <p className="text-xs text-slate-600">
              आप अगले 12 घंटे तक सभी सरकारी नौकरियां, सिलेबस और WhatsApp पोस्टर बिना किसी रुकावट के देख सकते हैं।
            </p>
          </div>
        ) : isWatching ? (
          <div className="py-6 space-y-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-slate-900 rounded-2xl shadow-lg border-2 border-amber-400">
              <span className="text-3xl font-black text-amber-400">{countdown}</span>
            </div>
            <h4 className="text-base font-black text-slate-900">विज्ञापन प्रदर्शित हो रहा है...</h4>
            <p className="text-xs text-slate-500">
              कृपया {countdown} सेकंड प्रतीक्षा करें। इसके बाद पोर्टल 12 घंटे के लिए अनलॉक हो जाएगा।
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                विज्ञापन देखें व 12 घंटे का पूर्ण एक्सेस प्राप्त करें
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                इस पोर्टल की सभी शासकीय विज्ञप्तियां, सरकारी रिजल्ट टेबल्स, सिलेबस PDF एवं 1080×1350 WhatsApp पोस्टर निशुल्क उपलब्ध कराने हेतु एक छोटा प्रायोजित विज्ञापन देखें।
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left space-y-1.5 text-xs text-amber-950 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>12 घंटे तक दोबारा विज्ञापन नहीं दिखेगा</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>सभी नौकरियों का विवरण और पोस्टर तुरंत डाउनलोड करें</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleStartWatch}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm sm:text-base shadow-lg transition-all hover:scale-[1.01] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>विज्ञापन देखें (12 Hours Unlocked)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1 cursor-pointer"
              >
                अभी नहीं, बाद में देखें
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
