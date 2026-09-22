"use client";

import React, { useEffect } from 'react';
import { Phone, MessageCircle, Mail, X, CheckCircle2, ShieldCheck, Clock, MapPin } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const emailHref = "mailto:nitishkhobragade89@gmail.com?subject=Inquiry%20from%20NP%20Job%20Portal&body=Maine%20aapko%20NP%20Job%20Portal%20se%20sampark%20kiya%20hai.";
  const whatsappHref = "https://wa.me/918982324497?text=Maine%20aapko%20NP%20Job%20Portal%20se%20sampark%20kiya%20hai.";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tricolor Top Strip */}
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-700 via-red-800 to-rose-900 p-5 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/25 hover:bg-black/50 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close Contact Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner">
              NP
            </div>
            <div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" /> अधिकृत संपर्क सूत्र
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                Nitish Khobragade
              </h2>
              <p className="text-xs text-red-100 font-medium">
                पोर्टल संचालक व ऑनलाइन फॉर्म विशेषज्ञ
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="p-3 bg-red-50 border border-red-200/80 rounded-xl text-xs text-red-950 leading-relaxed font-medium">
            <span className="font-bold">घर बैठे सुरक्षित फॉर्म भरवाएं:</span> किसी भी भर्ती, प्रवेश पत्र, रिजल्ट या तकनीकी सेवा के संबंध में सीधे संपर्क करें। 100% त्रुटिरहित आवेदन की गारंटी।
          </div>

          <div className="space-y-3">
            {/* 1. Direct Phone Call */}
            <a
              href="tel:8982324497"
              className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-blue-400 bg-neutral-50 hover:bg-blue-50/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    सीधा वॉइस कॉल (Direct Call)
                  </div>
                  <div className="text-base sm:text-lg font-black text-neutral-900 group-hover:text-blue-700 transition-colors font-mono">
                    8982324497
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-xs">
                कॉल करें
              </span>
            </a>

            {/* 2. Direct WhatsApp */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-emerald-500 bg-neutral-50 hover:bg-emerald-50/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <MessageCircle className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    सीधा व्हाट्सएप चैट (Instant WhatsApp)
                  </div>
                  <div className="text-base sm:text-lg font-black text-neutral-900 group-hover:text-emerald-700 transition-colors font-mono">
                    8982324497
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-xs">
                व्हाट्सएप
              </span>
            </a>

            {/* 3. Direct Email */}
            <a
              href={emailHref}
              className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 hover:border-red-400 bg-neutral-50 hover:bg-red-50/60 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                    ईमेल आईडी (Official Email)
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-neutral-900 group-hover:text-red-700 transition-colors truncate font-mono">
                    nitishkhobragade89@gmail.com
                  </div>
                </div>
              </div>
              <span className="px-3 py-1 bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs shrink-0">
                ईमेल भेजें
              </span>
            </a>
          </div>

          {/* Operational Hours & Location Badge */}
          <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>समय: सुबह 08:00 AM से रात्रि 10:00 PM तक</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium text-neutral-700">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>मध्य प्रदेश (All MP Services)</span>
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-neutral-100 px-5 py-3 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-600">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>सत्यापित अधिकृत पोर्टल संचालक</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold rounded-lg transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
