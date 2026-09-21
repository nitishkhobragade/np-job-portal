"use client";

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, X, BellRing, CheckCircle2, ArrowRight } from 'lucide-react';

export const ChannelJoinPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show once per session
    try {
      const hasSeen = sessionStorage.getItem('np_channel_popup_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem('np_channel_popup_seen', 'true');
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // If sessionStorage disabled/restricted in iframe
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div
      id="channel-join-popup-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div
        id="channel-join-popup-card"
        className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative text-white animate-in zoom-in-95 duration-200"
      >
        {/* Top Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer z-10"
          aria-label="Close Popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Decorative Gradient Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 pt-7 text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/40 text-amber-300 font-black text-xs uppercase tracking-wider border border-amber-300/40 mb-3 shadow-xs">
            <BellRing className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span>FREE JOB ALERT</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-sm">
            Poster download aur fast updates ke liye WA join karein
          </h3>

          <p className="text-xs text-emerald-100 mt-2 font-medium">
            मध्य प्रदेश एवं केंद्र सरकार की सभी भर्तियों की सबसे तेज एवं आधिकारिक सूचना
          </p>
        </div>

        {/* Bullet Points List */}
        <div className="p-6 space-y-3.5 text-xs sm:text-sm">
          <div className="flex items-start gap-3 text-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white">Daily verified vacancy updates</strong>
              <p className="text-[11px] text-slate-400 mt-0.5">मध्य प्रदेश, ESB, SSC, रेलवे व बैंक भर्तियों की प्रामाणिक जानकारी</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white">Last date aur admit card alerts</strong>
              <p className="text-[11px] text-slate-400 mt-0.5">फॉर्म की अंतिम तारीख और परीक्षा हॉल टिकट की सीधी लिंक</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-slate-200">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/40">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-white">Poster download, tools aur important links</strong>
              <p className="text-[11px] text-slate-400 mt-0.5">WhatsApp स्टेटस हेतु 9:16 HD पोस्टर व सुरक्षित फॉर्म सेवा</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 space-y-2.5">
            {/* WhatsApp Channel Button */}
            <a
              id="popup-join-whatsapp-btn"
              href="https://whatsapp.com/channel/0029Vb9N2gfGZNClzwFazG3L"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg transition-all active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>Join WhatsApp Channel</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* Telegram Channel Button */}
            <a
              id="popup-join-telegram-btn"
              href="https://t.me/npjobportal"
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Join Telegram Channel (@npjobportal)</span>
            </a>
          </div>

          {/* Bottom Continue Button */}
          <div className="pt-2 text-center">
            <button
              id="popup-continue-btn"
              onClick={handleClose}
              className="text-xs text-slate-400 hover:text-slate-200 font-semibold underline underline-offset-4 transition-colors cursor-pointer py-1"
            >
              Continue to page (वेबसाइट पर आगे बढ़ें)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
