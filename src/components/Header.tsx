import React from 'react';
import { Phone, MessageCircle, Search, ShieldCheck, FileText, CheckCircle2, Award } from 'lucide-react';
import { OWNER_INFO } from '../data/portalData';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory
}) => {
  const categories = [
    'All Updates',
    'MP Special',
    'Police',
    'SSC/UPSC',
    'Railway',
    'Banking',
    'Teaching',
    'Health'
  ];

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
      {/* Tricolor top indicator band for Government Recruitment feel */}
      <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Main Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3.5 text-center sm:text-left w-full sm:w-auto justify-center sm:justify-start">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-linear-to-br from-red-600 via-red-700 to-rose-900 text-white flex flex-col items-center justify-center font-black shadow-md border border-red-500/30 shrink-0">
              <span className="text-xl sm:text-2xl leading-none tracking-tight">NP</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-amber-300">ONLINE</span>
            </div>

            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  NP <span className="text-red-600">Job Portal</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                  <CheckCircle2 className="w-3 h-3 text-red-600" />
                  MP & Central
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 font-medium">
                मध्य प्रदेश एवं केन्द्रीय सरकारी भर्ती, एडमिट कार्ड, रिजल्ट एवं ऑनलाइन फॉर्म सेवा
              </p>
              <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start flex-wrap">
                <span className="text-[11px] font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                  संचालक: <strong className="text-neutral-900">{OWNER_INFO.name}</strong>
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600" /> अधिकृत MP Online Kiosk
                </span>
              </div>
            </div>
          </div>

          {/* Direct WhatsApp & Call Buttons for Nitish Khobragade */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-98"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp चैट (8982324497)</span>
            </a>

            <a
              href={OWNER_INFO.callUrl}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all active:scale-98"
            >
              <Phone className="w-4 h-4" />
              <span>कॉल करें</span>
            </a>
          </div>
        </div>

        {/* Search & Category Filter Navigation */}
        <div className="mt-4 pt-3 border-t border-neutral-100 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="सर्च करें: MP Police, SSC, Admit Card..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-neutral-800 placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Badges / Fast Links */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-red-700 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
