"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Briefcase,
  Send,
  BellRing,
  BookOpen
} from 'lucide-react';
import { OWNER_INFO } from '../data/portalData';
import { ContactModal } from './ContactModal';

interface HeaderProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  selectedCategory?: string;
  setSelectedCategory?: (cat: string) => void;
}

const HeaderInner: React.FC<HeaderProps> = ({
  searchQuery = '',
  setSearchQuery,
  selectedCategory = 'All Updates',
  setSelectedCategory
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const categoryParam = (searchParams?.get('category') || '').toLowerCase();

  // Dynamic Navigation Highlight Calculation
  const getActiveTab = (): 'home' | 'latest-jobs' | 'admit-card' | 'results' | 'mp-special' | 'tech-jobs' | 'central-ssc' => {
    // 1. URL Pathname takes primary precedence
    if (pathname.includes('/category/results') || categoryParam === 'results' || categoryParam === 'result') {
      return 'results';
    }
    if (pathname.includes('/category/admit-card') || categoryParam === 'admit-card' || categoryParam === 'admit') {
      return 'admit-card';
    }
    if (pathname.includes('/category/latest-jobs') || categoryParam === 'latest-jobs' || categoryParam === 'latest') {
      return 'latest-jobs';
    }
    if (pathname.includes('/category/mp-special') || categoryParam === 'mp-special' || categoryParam === 'mp') {
      return 'mp-special';
    }
    if (pathname.includes('/category/tech-jobs') || categoryParam === 'tech-jobs' || categoryParam === 'tech') {
      return 'tech-jobs';
    }
    if (
      pathname.includes('/category/ssc-upsc') ||
      pathname.includes('/category/police') ||
      pathname.includes('/category/railway') ||
      categoryParam === 'ssc' ||
      categoryParam === 'ssc-upsc' ||
      categoryParam === 'central'
    ) {
      return 'central-ssc';
    }

    // 2. On Home page (/), check selectedCategory state
    if (pathname === '/') {
      if (selectedCategory === 'Results') return 'results';
      if (selectedCategory === 'Admit Card') return 'admit-card';
      if (selectedCategory === 'Latest Jobs') return 'latest-jobs';
      if (selectedCategory === 'MP Special') return 'mp-special';
      if (selectedCategory === 'Tech Jobs') return 'tech-jobs';
      if (selectedCategory === 'SSC/UPSC' || selectedCategory === 'Police' || selectedCategory === 'Railway') {
        return 'central-ssc';
      }
      return 'home';
    }

    return 'home';
  };

  const activeTab = getActiveTab();

  const handleHomeClick = () => {
    if (setSelectedCategory) {
      setSelectedCategory('All Updates');
    }
    setMobileMenuOpen(false);
  };

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

  const handleCategoryPillClick = (cat: string) => {
    if (setSelectedCategory) {
      setSelectedCategory(cat);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
      {/* Tricolor top indicator band */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Main Brand & Contact Bar */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 overflow-hidden box-border">
        <div className="w-full max-w-full flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
          
          {/* Logo & Portal Identity - Clicking Logo routes to / and immediately resets to HOME */}
          <Link href="/" onClick={handleHomeClick} className="flex items-center gap-2 sm:gap-3 shrink min-w-0 cursor-pointer group">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-red-600 via-red-700 to-rose-900 text-white flex flex-col items-center justify-center font-black shadow-md border border-red-500/30 shrink-0 group-hover:scale-102 transition-transform">
              <span className="text-base sm:text-2xl leading-none tracking-tight">NP</span>
              <span className="text-[7px] sm:text-[9px] uppercase tracking-wider font-semibold text-amber-300">PORTAL</span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-2xl font-extrabold text-neutral-900 tracking-tight leading-none group-hover:text-red-700 transition-colors truncate">
                  NP <span className="text-red-600">Job Portal</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-red-600" />
                  MP & Central
                </span>
              </div>
              <p className="hidden md:block text-[11px] sm:text-xs text-neutral-600 font-medium line-clamp-1 mt-0.5">
                घर बैठे सुरक्षित फॉर्म भरवाएं • Nitish Khobragade (8982324497)
              </p>
            </div>
          </Link>

          {/* Quick Contact & WhatsApp Pill (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <div className="text-right mr-1">
              <div className="text-[10px] text-neutral-500 font-semibold uppercase">संचालक व फॉर्म विशेषज्ञ</div>
              <div className="text-xs font-black text-neutral-900">{OWNER_INFO.name}</div>
            </div>

            <a
              href="https://whatsapp.com/channel/0029Vb9N2gfGZNClzwFazG3L"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Join Official WhatsApp Channel"
            >
              <BellRing className="w-3.5 h-3.5 text-amber-300" />
              <span>WA Channel</span>
            </a>

            <a
              href="https://t.me/npjobportal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Join Telegram Channel"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </a>

            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp</span>
            </a>

            <a
              href={OWNER_INFO.callUrl}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
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
              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
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
          {/* Desktop Menu Links with Dynamic Route Synchronization */}
          <div className="hidden md:flex items-center text-xs font-bold tracking-wide">
            <Link
              href="/"
              onClick={handleHomeClick}
              className={`px-4 py-3 transition-colors uppercase flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-red-700/80 hover:text-white'
              }`}
            >
              होम (Home)
            </Link>

            <Link
              href="/category/latest-jobs"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Latest Jobs');
              }}
              className={`px-3.5 py-3 transition-colors uppercase cursor-pointer ${
                activeTab === 'latest-jobs'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-red-700/80 hover:text-white'
              }`}
            >
              Latest Jobs
            </Link>

            <Link
              href="/category/admit-card"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Admit Card');
              }}
              className={`px-3.5 py-3 transition-colors uppercase cursor-pointer ${
                activeTab === 'admit-card'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-red-700/80 hover:text-white'
              }`}
            >
              Admit Card
            </Link>

            <Link
              href="/category/results"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Results');
              }}
              className={`px-3.5 py-3 transition-colors uppercase cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-red-700/80 hover:text-white'
              }`}
            >
              Results
            </Link>

            <Link
              href="/category/mp-special"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('MP Special');
              }}
              className={`px-3.5 py-3 transition-colors uppercase font-black flex items-center gap-1 cursor-pointer ${
                activeTab === 'mp-special'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-amber-400 hover:bg-amber-600 hover:text-slate-950'
              }`}
            >
              <span>★ MP Special</span>
            </Link>

            <Link
              href="/category/tech-jobs"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Tech Jobs');
              }}
              className={`px-3.5 py-3 transition-colors uppercase font-bold flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tech-jobs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-blue-300 hover:bg-blue-600 hover:text-white'
              }`}
            >
              <span>Tech Jobs</span>
              <span className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded uppercase">IT/MNC</span>
            </Link>

            <Link
              href="/category/ssc-upsc"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('SSC/UPSC');
              }}
              className={`px-3.5 py-3 transition-colors uppercase cursor-pointer ${
                activeTab === 'central-ssc'
                  ? 'bg-red-700 text-white shadow-sm'
                  : 'text-slate-200 hover:bg-red-700/80 hover:text-white'
              }`}
            >
              Central / SSC
            </Link>

            <Link
              href="/blogs"
              className={`px-3.5 py-3 transition-colors uppercase font-black flex items-center gap-1 cursor-pointer ${
                pathname.startsWith('/blogs')
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-amber-300 hover:bg-amber-600 hover:text-slate-950'
              }`}
            >
              <span>📖 ब्लॉग (Blogs)</span>
            </Link>

            {/* More Dropdown */}
            <div className="relative">
              <button
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="px-4 py-3 hover:bg-slate-800 text-slate-200 flex items-center gap-1 transition-colors uppercase cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreDropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-0.5 w-60 bg-slate-900 border border-slate-700 rounded-b-xl shadow-2xl z-50 py-2 text-xs"
                  onMouseLeave={() => setMoreDropdownOpen(false)}
                >
                  <Link
                    href="/about-us"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-red-700 hover:text-white"
                  >
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>ऑनलाइन फॉर्म व तकनीकी सेवाएं (About Us)</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMoreDropdownOpen(false);
                      setContactModalOpen(true);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-red-700 hover:text-white cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>संपर्क सूत्र (Contact Us)</span>
                  </button>

                  <Link
                    href="/category/syllabus"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-200 hover:bg-red-700 hover:text-white"
                  >
                    <Briefcase className="w-4 h-4 text-blue-400" />
                    <span>सिलेबस व नियम पुस्तिका (Syllabus)</span>
                  </Link>

                  <Link
                    href="/disclaimer"
                    onClick={() => setMoreDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:bg-red-700 hover:text-white"
                  >
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>डिस्क्लेमर (Disclaimer)</span>
                  </Link>
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
                onChange={(e) => setSearchQuery?.(e.target.value)}
                placeholder="सर्च करें: MP Police, SSC, Admit Card..."
                className="w-full pl-8 pr-7 py-1 text-xs bg-slate-900 border border-slate-700 rounded-md text-white placeholder:text-slate-400 focus:outline-hidden focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              {searchQuery && setSearchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Fast Category Badges Strip */}
      <div className="w-full max-w-full bg-neutral-50 border-b border-neutral-200 px-2 sm:px-4 py-2 overflow-hidden box-border">
        <div className="w-full max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
          <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider shrink-0 mr-1">
            श्रेणी:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryPillClick(cat)}
                className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
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

      {/* MOBILE HAMBURGER SLIDE DRAWER (COMPACT VERTICAL SPACING) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 text-white border-b border-slate-800 p-2.5 sm:p-3 animate-in slide-in-from-top-2 duration-150 max-h-[calc(100dvh-75px)] overflow-y-auto">
          <div className="flex flex-col space-y-1 text-xs font-bold">
            <Link
              href="/"
              onClick={handleHomeClick}
              className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                activeTab === 'home' ? 'bg-red-700 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <span>मुख्य पृष्ठ (Home)</span>
              <span className="text-[10px] bg-red-850 px-1.5 py-0.5 rounded font-bold">All</span>
            </Link>

            <Link
              href="/category/latest-jobs"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Latest Jobs');
                setMobileMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg flex items-center justify-between cursor-pointer ${
                activeTab === 'latest-jobs' ? 'bg-red-700 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <span>लेटेस्ट सरकारी नौकरियां (Latest Jobs)</span>
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded font-bold">New</span>
            </Link>

            <Link
              href="/category/mp-special"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('MP Special');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-2.5 py-1.5 rounded-lg border font-black flex items-center justify-between cursor-pointer ${
                activeTab === 'mp-special'
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <span>★ मध्य प्रदेश स्पेशल (MP Special)</span>
              <span className="text-[10px] bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded font-black">Top</span>
            </Link>

            <Link
              href="/category/tech-jobs"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Tech Jobs');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-2.5 py-1.5 rounded-lg border font-bold flex items-center justify-between cursor-pointer ${
                activeTab === 'tech-jobs'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-blue-900/30 text-blue-300 border-blue-500/40 hover:bg-blue-900/50'
              }`}
            >
              <span>💻 Tech & Corporate Jobs (IT / MNC)</span>
              <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-black">MNC</span>
            </Link>

            <Link
              href="/category/ssc-upsc"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('SSC/UPSC');
                setMobileMenuOpen(false);
              }}
              className={`text-left px-2.5 py-1.5 rounded-lg cursor-pointer ${
                activeTab === 'central-ssc' ? 'bg-red-700 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <span>Central & SSC Govt Jobs</span>
            </Link>

            <Link
              href="/category/admit-card"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Admit Card');
                setMobileMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                activeTab === 'admit-card' ? 'bg-red-700 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <span>एडमिट कार्ड (Admit Card)</span>
            </Link>

            <Link
              href="/category/results"
              onClick={() => {
                if (setSelectedCategory) setSelectedCategory('Results');
                setMobileMenuOpen(false);
              }}
              className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                activeTab === 'results' ? 'bg-red-700 text-white' : 'hover:bg-slate-800 text-slate-200'
              }`}
            >
              <span>रिजल्ट एवं उत्तर कुंजी (Results)</span>
            </Link>

            {/* अन्य सेवाएं एवं विकल्प (More Services Accordion - Ultra Compact) */}
            <div className="pt-2 mt-1 border-t border-slate-800 space-y-0.5">
              <div className="px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>अन्य सेवाएं एवं विकल्प</span>
              </div>

              {/* Blogs link in mobile drawer */}
              <Link
                href="/blogs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 rounded-md flex items-center gap-2 text-xs font-bold text-amber-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
                <span>📖 करियर ब्लॉग्स (Career Blogs & Guides)</span>
              </Link>

              {/* 1. Online Forms & Tech Services -> /about-us */}
              <Link
                href="/about-us"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 rounded-md flex items-center gap-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>🌟 ऑनलाइन फॉर्म व तकनीकी सेवाएं (About Us)</span>
              </Link>

              {/* 2. Contact Popup Modal */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setContactModalOpen(true);
                }}
                className="w-full text-left px-2 py-1 rounded-md flex items-center gap-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>📞 संपर्क सूत्र (Contact Us)</span>
              </button>

              {/* 3. Syllabus & Rulebooks -> /category/syllabus */}
              <Link
                href="/category/syllabus"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 rounded-md flex items-center gap-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <Briefcase className="w-4 h-4 text-blue-400 shrink-0" />
                <span>📑 सिलेबस व नियम पुस्तिका (Syllabus)</span>
              </Link>

              {/* 4. Disclaimer -> /disclaimer */}
              <Link
                href="/disclaimer"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1 rounded-md flex items-center gap-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                <span>⚖️ डिस्क्लेमर (Disclaimer)</span>
              </Link>
            </div>

            <div className="pt-2 mt-1 border-t border-slate-800 flex flex-col">
              <a
                href={OWNER_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs cursor-pointer shadow-md transition-transform active:scale-98"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp: {OWNER_INFO.phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Contact Popup Modal */}
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </header>
  );
};

export const Header: React.FC<HeaderProps> = (props) => {
  return (
    <Suspense fallback={
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 h-24">
        <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600"></div>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-700 text-white flex items-center justify-center font-black">NP</div>
            <span className="text-xl font-bold text-neutral-900">NP <span className="text-red-600">Job Portal</span></span>
          </div>
        </div>
      </header>
    }>
      <HeaderInner {...props} />
    </Suspense>
  );
};
