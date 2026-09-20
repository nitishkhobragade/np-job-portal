"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Phone,
  MessageCircle,
  Search,
  CheckCircle2,
  Award,
  Menu,
  X,
  ChevronDown,
  FileText,
  Briefcase
} from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);

  const categories = [
    'All Updates',
    'Latest Jobs',
    'MP Special',
    'Tech Jobs',
    'Police',
    'SSC/UPSC',
    'Railway',
    'Banking',
    'Teaching',
    'Health'
  ];

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
      {/* Tricolor top indicator band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Main Brand & Contact Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* Logo & Portal Identity */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-rose-900 text-white flex flex-col items-center justify-center font-black shadow-md border border-red-500/30 shrink-0">
              <span className="text-xl sm:text-2xl leading-none tracking-tight">NP</span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-wider font-semibold text-amber-300">ONLINE</span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-none">
                  NP <span className="text-red-600">Job Portal</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                  <CheckCircle2 className="w-3 h-3 text-red-600" />
                  MP & Central
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-600 font-medium line-clamp-1 mt-0.5">
                सरकारी भर्ती, एडमिट कार्ड, रिजल्ट एवं ऑनलाइन फॉर्म सेवा
              </p>
            </div>
          </Link>

          {/* Quick Contact & WhatsApp Pill (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="text-right mr-1">
              <div className="text-[10px] text-neutral-500 font-semibold uppercase">संचालक व फॉर्म विशेषज्ञ</div>
              <div className="text-xs font-black text-neutral-900">{OWNER_INFO.name}</div>
            </div>

            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp: 8982324497</span>
            </a>

            <a
              href={OWNER_INFO.callUrl}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>कॉल</span>
            </a>
          </div>

          {/* Mobile Right Controls: WhatsApp Quick Icon & Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs"
              aria-label="WhatsApp Nitish Khobragade"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* CLASSIC BLACK/DARK-SLATE NAVIGATION BAR */}
      <nav className="bg-slate-950 text-white border-y border-slate-800 shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Desktop Menu Links */}
          <div className="hidden md:flex items-center text-xs font-bold tracking-wide">
            <Link
              href="/"
              onClick={() => setSelectedCategory('All Updates')}
              className={`px-4 py-3 hover:bg-red-700 transition-colors uppercase flex items-center gap-1.5 ${
                selectedCategory === 'All Updates' ? 'bg-red-700 text-white' : 'text-slate-200'
              }`}
            >
              होम (Home)
            </Link>

            <Link
              href="/category/latest-jobs"
              className="px-3.5 py-3 hover:bg-red-700 text-slate-200 hover:text-white transition-colors uppercase"
            >
              Latest Jobs
            </Link>

            <Link
              href="/category/admit-card"
              className="px-3.5 py-3 hover:bg-red-700 text-slate-200 hover:text-white transition-colors uppercase"
            >
              Admit Card
            </Link>

            <Link
              href="/category/results"
              className="px-3.5 py-3 hover:bg-red-700 text-slate-200 hover:text-white transition-colors uppercase"
            >
              Results
            </Link>

            <Link
              href="/category/mp-special"
              className={`px-3.5 py-3 hover:bg-amber-600 hover:text-slate-950 transition-colors uppercase font-black flex items-center gap-1 ${
                selectedCategory === 'MP Special' ? 'bg-amber-500 text-slate-950' : 'text-amber-400'
              }`}
            >
              <span>★ MP Special</span>
            </Link>

            <Link
              href="/category/tech-jobs"
              className="px-3.5 py-3 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors uppercase font-bold flex items-center gap-1.5"
            >
              <span>Tech Jobs</span>
              <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">IT/MNC</span>
            </Link>

            <button
              onClick={() => handleCategoryClick('SSC/UPSC')}
              className="px-3.5 py-3 hover:bg-red-700 text-slate-200 hover:text-white transition-colors uppercase"
            >
              Central / SSC
            </button>

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="px-4 py-3 hover:bg-slate-800 text-slate-200 flex items-center gap-1 transition-colors uppercase"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-0.5 w-52 bg-slate-900 border border-slate-700 rounded-b-xl shadow-2xl z-50 py-2 text-xs"
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                >
                  <a
                    href="#kiosk-services"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:bg-red-700 hover:text-white"
                  >
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>कियोस्क सेवाएं (About Us)</span>
                  </a>

                  <a
                    href={OWNER_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:bg-red-700 hover:text-white"
                  >
                    <MessageCircle className="w-4 h-4 text-amber-400" />
                    <span>संपर्क सूत्र (Contact Us)</span>
                  </a>

                  <Link
                    href="/jobs/mp-police-constable-2026"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-200 hover:bg-red-700 hover:text-white"
                  >
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span>सिलेबस व नियम पुस्तिका</span>
                  </Link>

                  <a
                    href="#footer-disclaimer"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:bg-red-700 hover:text-white"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>डिस्क्लेमर (Disclaimer)</span>
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick Search Bar right inside navigation strip */}
          <div className="py-1.5 w-full md:w-72">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="सर्च करें: MP Police, SSC, Admit Card..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Fast Category Badges Strip */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 mr-1">
            श्रेणी:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-red-700 text-white shadow-2xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE HAMBURGER SLIDE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 text-white border-b border-slate-800 p-4 animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-2 text-sm font-bold">
            <Link
              href="/"
              onClick={() => {
                setSelectedCategory('All Updates');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 rounded-lg bg-red-700 text-white flex items-center justify-between"
            >
              <span>मुख्य पृष्ठ (Home)</span>
              <span className="text-xs bg-red-800 px-2 py-0.5 rounded">All</span>
            </Link>

            <button
              onClick={() => handleCategoryClick('MP Special')}
              className="text-left px-3 py-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black flex items-center justify-between"
            >
              <span>★ मध्य प्रदेश स्पेशल (MP Special)</span>
              <span className="text-xs bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black">Top</span>
            </button>

            <Link
              href="/category/tech-jobs"
              onClick={() => setMobileMenuOpen(false)}
              className="text-left px-3 py-2 rounded-lg bg-blue-900/30 text-blue-300 border border-blue-500/40 font-bold flex items-center justify-between"
            >
              <span>💻 Tech & Corporate Jobs (IT / MNC)</span>
              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded font-black">MNC</span>
            </Link>

            <button
              onClick={() => handleCategoryClick('Police')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              Police Recruitment (MP Police & Central)
            </button>

            <button
              onClick={() => handleCategoryClick('SSC/UPSC')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              SSC & Central Govt Jobs
            </button>

            <button
              onClick={() => handleCategoryClick('Railway')}
              className="text-left px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              Railway RRC / RRB Jobs
            </button>

            <Link
              href="/category/admit-card"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              एडमिट कार्ड (Admit Card)
            </Link>

            <Link
              href="/category/results"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-800 text-slate-200"
            >
              रिजल्ट एवं उत्तर कुंजी (Results)
            </Link>

            <div className="pt-2 mt-2 border-t border-slate-800 flex flex-col space-y-2">
              <a
                href={OWNER_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white font-black text-xs"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp: {OWNER_INFO.phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
