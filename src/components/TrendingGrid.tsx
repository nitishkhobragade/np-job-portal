import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, MessageCircle, Calendar, Flame } from 'lucide-react';
import { TRENDING_CARDS } from '../data/portalData';
import { TrendingCard } from '../types';

interface TrendingGridProps {
  onSelectCard: (card: TrendingCard) => void;
}

export const TrendingGrid: React.FC<TrendingGridProps> = ({ onSelectCard }) => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 my-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
            <Flame className="w-5 h-5 fill-red-600" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              ट्रेंडिंग सरकारी भर्तियां एवं काउंसलिंग 2026
            </h2>
            <p className="text-xs text-neutral-500">
              सबसे लोकप्रिय भर्ती आवेदन व सीट आवंटन • ऑनलाइन फॉर्म भरने हेतु संपर्क करें
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> टॉप ट्रेंडिंग
        </span>
      </div>

      {/* Grid of 8 Colorful Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {TRENDING_CARDS.map((card) => {
          const whatsappPrefill = `https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
            card.title
          )}*%20%E0%A4%95%E0%A4%BE%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4%20%E0%A4%95%E0%A5%83%E0%A4%AA%E0%A4%AF%E0%A4%BE%20%E0%A4%9C%E0%A4%BE%E0%A4%A8%E0%A4%95%E0%A4%BE%E0%A4%B1%E0%A5%80%20%E0%A4%A6%E0%A5%87%E0%A4%82%E0%A5%A4`;

          return (
            <div
              key={card.id}
              className="group relative flex flex-col justify-between rounded-xl bg-white border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden"
            >
              {/* Top Accent Gradient Header */}
              <div className={`h-2.5 w-full bg-linear-to-r ${card.colorTheme}`} />

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                      {card.category}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                    {card.title}
                  </h3>

                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs text-neutral-600 mb-3">
                    <span className="flex items-center gap-1 font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                      <Calendar className="w-3 h-3 text-amber-700" />
                      {card.postsOrDate}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectCard(card)}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    >
                      विवरण <ArrowRight className="w-3 h-3" />
                    </button>

                    <a
                      href={whatsappPrefill}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
                      title="घर बैठे Nitish Khobragade से फॉर्म भरवाएं"
                    >
                      <MessageCircle className="w-3 h-3 fill-white" />
                      फॉर्म भरें
                    </a>
                  </div>

                  {/* Direct Poster & Sarkari Table Link */}
                  {card.id === 'trend-1' && (
                    <Link
                      href="/jobs/mp-police-constable-2026"
                      className="mt-2 text-center text-[10px] font-bold text-red-700 hover:underline block"
                    >
                      ★ सरकारी रिजल्ट टेबल व WhatsApp पोस्टर →
                    </Link>
                  )}
                  {card.id === 'trend-2' && (
                    <Link
                      href="/jobs/mp-ayush-ug-counselling"
                      className="mt-2 text-center text-[10px] font-bold text-emerald-700 hover:underline block"
                    >
                      ★ काउंसलिंग दिशानिर्देश व WhatsApp पोस्टर →
                    </Link>
                  )}
                  {card.id === 'trend-3' && (
                    <Link
                      href="/jobs/ssc-chsl-2026"
                      className="mt-2 text-center text-[10px] font-bold text-amber-800 hover:underline block"
                    >
                      ★ SSC CHSL टेबल व WhatsApp पोस्टर →
                    </Link>
                  )}
                  {card.id === 'trend-4' && (
                    <Link
                      href="/jobs/railway-rrc-group-d"
                      className="mt-2 text-center text-[10px] font-bold text-rose-700 hover:underline block"
                    >
                      ★ रेलवे भर्ती टेबल व WhatsApp पोस्टर →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
