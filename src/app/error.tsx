"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, MessageCircle, Phone } from 'lucide-react';
import { OWNER_INFO } from '../data/portalData';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('NP Job Portal runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center shadow-2xl backdrop-blur-sm">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h1 className="text-xl sm:text-2xl font-black mb-2 text-white">
          पेज लोड होने में अस्थायी समस्या
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          यह पेज लोड करते समय एक अप्रत्याशित समस्या आई है। कृपया दोबारा लोड करने का प्रयास करें अथवा मुख्य पृष्ठ पर जाएं।
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>पुनः प्रयास करें (Reload)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm border border-slate-600 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>होम पेज (Home)</span>
          </Link>
        </div>

        {/* Nitish Helpline */}
        <div className="pt-4 border-t border-slate-700/80 text-xs text-slate-400 flex items-center justify-center gap-4">
          <a
            href={OWNER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp सहायता</span>
          </a>
          <span className="text-slate-600">•</span>
          <a
            href={OWNER_INFO.callUrl}
            className="text-blue-400 hover:underline flex items-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{OWNER_INFO.phone}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
