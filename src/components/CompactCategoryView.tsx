"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Table as TableIcon,
  AlignLeft,
  Building2,
  Phone,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';
import { JobItem, AdmitCardItem, ResultItem } from '../types';
import { OWNER_INFO } from '../data/portalData';

export type CategorySlug =
  | 'latest-jobs'
  | 'admit-card'
  | 'results'
  | 'mp-special'
  | 'tech-jobs'
  | 'ssc-upsc'
  | 'police'
  | 'railway'
  | 'all';

interface CompactCategoryViewProps {
  initialCategory?: CategorySlug;
  jobs: JobItem[];
  admitCards?: AdmitCardItem[];
  results?: ResultItem[];
  onSelectJob?: (job: JobItem) => void;
  onSelectAdmit?: (item: AdmitCardItem) => void;
  onSelectResult?: (item: ResultItem) => void;
}

export const CompactCategoryView: React.FC<CompactCategoryViewProps> = ({
  initialCategory = 'latest-jobs',
  jobs,
  admitCards = [],
  results = [],
  onSelectJob,
  onSelectAdmit,
  onSelectResult
}) => {
  const [activeCategory, setActiveCategory] = useState<CategorySlug>(initialCategory);
  const [viewMode, setViewMode] = useState<'sarkari' | 'freejobalert'>('sarkari');
  const [searchQuery, setSearchQuery] = useState('');

  // Category navigation tabs
  const categoryTabs: { slug: CategorySlug; label: string; count?: number; badge?: string }[] = [
    { slug: 'latest-jobs', label: 'Latest Jobs', badge: 'Active' },
    { slug: 'admit-card', label: 'Admit Card', badge: 'Hall Tickets' },
    { slug: 'results', label: 'Results', badge: 'Declared' },
    { slug: 'mp-special', label: '★ MP Special', badge: 'Top MP' },
    { slug: 'tech-jobs', label: '💻 Tech Jobs', badge: 'IT/MNC' },
    { slug: 'ssc-upsc', label: 'Central / SSC', badge: 'Govt' },
    { slug: 'police', label: 'Police', badge: 'Uniform' },
    { slug: 'railway', label: 'Railway', badge: 'RRB' },
    { slug: 'all', label: 'All Openings', badge: 'All' }
  ];

  // Filter items based on active category
  const filteredJobs = useMemo(() => {
    let list = jobs;
    if (activeCategory === 'tech-jobs') {
      list = jobs.filter((j) => j.isTechJob || j.category === 'Tech/IT');
    } else if (activeCategory === 'mp-special') {
      list = jobs.filter(
        (j) =>
          j.state === 'MP' ||
          j.department.toLowerCase().includes('mp') ||
          j.title.toLowerCase().includes('mp')
      );
    } else if (activeCategory === 'ssc-upsc') {
      list = jobs.filter((j) => j.category === 'SSC/UPSC');
    } else if (activeCategory === 'police') {
      list = jobs.filter((j) => j.category === 'Police');
    } else if (activeCategory === 'railway') {
      list = jobs.filter((j) => j.category === 'Railway');
    } else if (activeCategory === 'admit-card' || activeCategory === 'results') {
      list = [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.department.toLowerCase().includes(q) ||
          (j.qualification && j.qualification.toLowerCase().includes(q)) ||
          (j.companyName && j.companyName.toLowerCase().includes(q)) ||
          (j.role && j.role.toLowerCase().includes(q))
      );
    }

    return list;
  }, [jobs, activeCategory, searchQuery]);

  const filteredAdmitCards = useMemo(() => {
    if (activeCategory !== 'admit-card' && activeCategory !== 'all') return [];
    let list = admitCards;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) => a.title.toLowerCase().includes(q) || a.department.toLowerCase().includes(q)
      );
    }
    return list;
  }, [admitCards, activeCategory, searchQuery]);

  const filteredResults = useMemo(() => {
    if (activeCategory !== 'results' && activeCategory !== 'all') return [];
    let list = results;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.department.toLowerCase().includes(q)
      );
    }
    return list;
  }, [results, activeCategory, searchQuery]);

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'latest-jobs':
        return 'नवीनतम सरकारी एवं संविदा भर्तियां (Latest Govt Jobs 2026)';
      case 'admit-card':
        return 'प्रवेश पत्र डाउनलोड लिंक (Official Admit Cards / Hall Tickets)';
      case 'results':
        return 'परीक्षा परिणाम एवं उत्तर कुंजी (Exam Results, Cut-Off & Score Cards)';
      case 'mp-special':
        return 'मध्य प्रदेश विशेष भर्तियां (MP Police, ESB, MPPSC, DTE Allotment)';
      case 'tech-jobs':
        return 'सॉफ्टवेयर, आईटी एवं कॉर्पोरेट भर्तियां (Tech, IT, MNC & Campus Drives)';
      case 'ssc-upsc':
        return 'एसएससी एवं यूपीएससी केन्द्रीय भर्तियां (SSC CGL, CHSL, UPSC)';
      case 'police':
        return 'पुलिस एवं डिफेन्स भर्ती (Police & Defence Recruitment)';
      case 'railway':
        return 'भारतीय रेलवे भर्ती (Railway RRB / RRC Vacancies)';
      default:
        return 'समस्त सरकारी व निजी भर्ती अपडेट्स (All Portal Updates)';
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. COMPACT TOP CONTROLLER BAR */}
      <div className="bg-white border border-slate-300 rounded-xl shadow-xs p-3">
        {/* Category Pills Navigation Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.slug;
            return (
              <button
                key={tab.slug}
                onClick={() => setActiveCategory(tab.slug)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                      isActive
                        ? 'bg-red-900 text-amber-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Action Row: Search Bar + Layout Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
          {/* Live Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="इस श्रेणी में सर्च करें: MP Police, IT, SSC..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:border-red-600 focus:ring-1 focus:ring-red-600"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Layout A vs Layout B Switcher Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-300 shrink-0 w-full sm:w-auto justify-center">
            <button
              onClick={() => setViewMode('sarkari')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'sarkari'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
              title="Sarkari Classic List (Layout A)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Layout A (Sarkari Classic)</span>
            </button>

            <button
              onClick={() => setViewMode('freejobalert')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'freejobalert'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
              title="FreeJobAlert Table (Layout B)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Layout B (FreeJobAlert Table)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN COMPACT CONTENT SECTION */}
      <div className="bg-white border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
        {/* Red/Maroon Header Box */}
        <div
          className={`py-2.5 px-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 ${
            viewMode === 'sarkari'
              ? 'bg-gradient-to-r from-red-800 via-rose-800 to-red-900 border-b-2 border-amber-400'
              : 'bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 border-b-2 border-emerald-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping"></span>
            <h2 className="text-sm sm:text-base font-black tracking-tight">{getCategoryTitle()}</h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="bg-black/40 px-2.5 py-0.5 rounded-full font-mono font-bold text-amber-300 border border-white/20">
              {filteredJobs.length + filteredAdmitCards.length + filteredResults.length} रिक्तियां
            </span>
            <span className="hidden sm:inline-block text-[11px] text-white/80">
              • NP ONLINE Nitish Khobragade
            </span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LAYOUT A: SARKARI CLASSIC LIST (Single-Line High-Density Rows) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'sarkari' && (
          <div className="divide-y divide-slate-200">
            {/* Jobs List */}
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="px-3 py-2.5 hover:bg-amber-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
                >
                  {/* Left: Bullet & Title */}
                  <div className="flex items-start md:items-center gap-2 min-w-0 flex-1">
                    <span className="text-red-700 font-black text-sm shrink-0 mt-0.5 md:mt-0">▸</span>
                    
                    <button
                      type="button"
                      onClick={() => onSelectJob?.(job)}
                      className="text-left font-bold text-slate-900 hover:text-red-700 hover:underline transition-colors line-clamp-2 md:line-clamp-1 leading-snug"
                    >
                      {job.title}
                    </button>

                    {job.isNew && (
                      <span className="shrink-0 bg-red-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded animate-pulse">
                        NEW
                      </span>
                    )}

                    {job.isHot && (
                      <span className="shrink-0 bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded">
                        HOT
                      </span>
                    )}
                  </div>

                  {/* Right: Badges & Direct Action Link */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap pl-5 md:pl-0">
                    {/* Department / Company */}
                    <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-semibold max-w-[140px] truncate">
                      {job.companyName || job.department.slice(0, 20)}
                    </span>

                    {/* Total Posts */}
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-bold">
                      {job.totalPosts}
                    </span>

                    {/* Last Date Badge */}
                    <span className="bg-rose-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[11px] font-black whitespace-nowrap">
                      अंतिम तिथि: {job.lastDate}
                    </span>

                    {/* Quick Detail Modal Trigger */}
                    <button
                      onClick={() => onSelectJob?.(job)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-black text-white text-[11px] font-bold rounded shadow-2xs transition-colors shrink-0"
                    >
                      विवरण
                    </button>

                    {/* Full Page Link */}
                    <Link
                      href={`/jobs/${job.slug || job.id}`}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black rounded shadow-2xs transition-colors shrink-0"
                    >
                      Apply / पोस्टर
                    </Link>
                  </div>
                </div>
              ))
            ) : null}

            {/* Admit Cards in Sarkari List */}
            {filteredAdmitCards.map((admit) => (
              <div
                key={admit.id}
                className="px-3 py-2.5 hover:bg-amber-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start md:items-center gap-2 min-w-0 flex-1">
                  <span className="text-amber-600 font-black text-sm shrink-0">▸</span>
                  <button
                    onClick={() => onSelectAdmit?.(admit)}
                    className="text-left font-bold text-slate-900 hover:text-red-700 hover:underline transition-colors line-clamp-1"
                  >
                    {admit.title}
                  </button>
                  <span className="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded">
                    {admit.hallTicketStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-5 md:pl-0">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                    {admit.examDate}
                  </span>
                  <button
                    onClick={() => onSelectAdmit?.(admit)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-xs"
                  >
                    डाउनलोड एडमिट कार्ड
                  </button>
                </div>
              </div>
            ))}

            {/* Results in Sarkari List */}
            {filteredResults.map((res) => (
              <div
                key={res.id}
                className="px-3 py-2.5 hover:bg-amber-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-start md:items-center gap-2 min-w-0 flex-1">
                  <span className="text-emerald-700 font-black text-sm shrink-0">▸</span>
                  <button
                    onClick={() => onSelectResult?.(res)}
                    className="text-left font-bold text-slate-900 hover:text-emerald-800 hover:underline transition-colors line-clamp-1"
                  >
                    {res.title}
                  </button>
                  <span className="bg-purple-700 text-white font-bold text-[10px] px-1.5 py-0.2 rounded">
                    {res.type}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 pl-5 md:pl-0">
                  <span className="text-slate-500 text-[11px]">{res.declaredDate}</span>
                  <button
                    onClick={() => onSelectResult?.(res)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs"
                  >
                    रिजल्ट देखें
                  </button>
                </div>
              </div>
            ))}

            {filteredJobs.length === 0 &&
              filteredAdmitCards.length === 0 &&
              filteredResults.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  कोई भर्ती या सूचना उपलब्ध नहीं है। कृपया सर्च फ़िल्टर बदलें।
                </div>
              )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* LAYOUT B: FREEJOBALERT TABLE (High-Density Multi-Column Grid Table)*/}
        {/* ----------------------------------------------------------------- */}
        {viewMode === 'freejobalert' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-black text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 border-r border-slate-300 w-24">पोस्ट दिनांक</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-44">बोर्ड / कंपनी</th>
                  <th className="py-2.5 px-3 border-r border-slate-300">परीक्षा / पद नाम (Exam / Post)</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-48 hidden sm:table-cell">योग्यता</th>
                  <th className="py-2.5 px-3 border-r border-slate-300 w-28">अंतिम तिथि</th>
                  <th className="py-2.5 px-3 text-center w-28">विवरण (Get Details)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {/* Jobs Table Rows */}
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="even:bg-slate-50 hover:bg-amber-50/70 transition-colors">
                    {/* Post Date */}
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {job.postDate || '20/09/2026'}
                    </td>

                    {/* Board / Company */}
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-800">
                      {job.companyName ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="text-blue-900">{job.companyName}</span>
                        </div>
                      ) : (
                        <span>{job.department}</span>
                      )}
                    </td>

                    {/* Exam / Post Name */}
                    <td className="py-2 px-3 border-r border-slate-200">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => onSelectJob?.(job)}
                          className="font-bold text-slate-900 hover:text-red-700 hover:underline text-left leading-tight"
                        >
                          {job.title}
                        </button>
                        <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0">
                          {job.totalPosts}
                        </span>
                        {job.isNew && (
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1 py-0.2 rounded shrink-0">
                            NEW
                          </span>
                        )}
                      </div>
                      {job.role && (
                        <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                          Role: {job.role} • {job.experience}
                        </div>
                      )}
                    </td>

                    {/* Qualification */}
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700 hidden sm:table-cell text-[11px] leading-snug">
                      {job.qualification}
                    </td>

                    {/* Last Date */}
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-red-600 text-[11px] whitespace-nowrap">
                      {job.lastDate}
                    </td>

                    {/* Action Links */}
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectJob?.(job)}
                          className="px-2 py-1 bg-slate-900 hover:bg-black text-white font-bold text-[11px] rounded shadow-2xs"
                        >
                          विवरण
                        </button>
                        <Link
                          href={`/jobs/${job.slug || job.id}`}
                          className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded shadow-2xs"
                        >
                          Apply
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Admit Cards Rows */}
                {filteredAdmitCards.map((admit) => (
                  <tr key={admit.id} className="even:bg-slate-50 hover:bg-amber-50/70 transition-colors">
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                      {admit.releaseDate.replace('Released: ', '')}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-700">
                      {admit.department}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <button
                        onClick={() => onSelectAdmit?.(admit)}
                        className="font-bold text-slate-900 hover:text-red-700 hover:underline text-left"
                      >
                        {admit.title}
                      </button>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        {admit.hallTicketStatus}
                      </div>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600 hidden sm:table-cell text-[11px]">
                      परीक्षा: {admit.examDate}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-amber-600 text-[11px]">
                      {admit.examDate}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onSelectAdmit?.(admit)}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-[11px]"
                      >
                        डाउनलोड
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Results Rows */}
                {filteredResults.map((res) => (
                  <tr key={res.id} className="even:bg-slate-50 hover:bg-amber-50/70 transition-colors">
                    <td className="py-2 px-3 border-r border-slate-200 font-mono text-[11px] text-slate-500">
                      {res.declaredDate.replace('Declared: ', '')}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-700">
                      {res.department}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200">
                      <button
                        onClick={() => onSelectResult?.(res)}
                        className="font-bold text-slate-900 hover:text-emerald-800 hover:underline text-left"
                      >
                        {res.title}
                      </button>
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-600 hidden sm:table-cell text-[11px]">
                      दस्तावेज: {res.type}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 font-mono font-bold text-emerald-700 text-[11px]">
                      {res.declaredDate}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onSelectResult?.(res)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px]"
                      >
                        रिजल्ट देखें
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. FOOTER TRUST & FORM ASSISTANCE BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-3.5 text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 text-sm">
            NP
          </div>
          <div>
            <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>घर बैठे सुरक्षित फॉर्म भरने हेतु संपर्क करें:</span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              {OWNER_INFO.name} • 8982324497 (MP Online Kiosk अधिकृत सेवा)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <a
            href={OWNER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>WhatsApp करें</span>
          </a>

          <a
            href={OWNER_INFO.callUrl}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>कॉल</span>
          </a>
        </div>
      </div>
    </div>
  );
};
