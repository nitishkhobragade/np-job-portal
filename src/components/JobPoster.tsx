"use client";

import React, { forwardRef, useEffect, useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Laptop,
  ShieldCheck,
  Terminal,
  BookOpen,
  Train,
  Landmark,
  Award,
  QrCode
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { CandidateCharacter, CharacterType } from './CandidateCharacter';
import { getWhatsAppQrCodeDataUrl, WHATSAPP_CHANNEL_URL } from '../lib/qrCodeHelper';

export type PosterTheme = 'classic' | 'navy' | 'emerald' | 'crimson' | 'purple' | 'cyber';
export type TitleScale = 'sm' | 'md' | 'lg' | 'xl';

const getCategoryEmblem = (category?: string, title?: string, dept?: string) => {
  const combined = `${category || ''} ${title || ''} ${dept || ''}`.toLowerCase();
  if (
    combined.includes('police') ||
    combined.includes('constable') ||
    combined.includes('sub-inspector') ||
    combined.includes('si ') ||
    combined.includes('defence') ||
    combined.includes('सुरक्षा') ||
    combined.includes('पुलिस')
  ) {
    return {
      type: 'police',
      label: 'MP POLICE & DEFENCE RECRUITMENT',
      Icon: ShieldCheck,
      badgeText: '🛡️ POLICE / DEFENCE RECRUITMENT 2026'
    };
  }
  if (
    combined.includes('tech') ||
    combined.includes('software') ||
    combined.includes('developer') ||
    combined.includes('it ') ||
    combined.includes('mnc') ||
    combined.includes('कंप्यूटर')
  ) {
    return {
      type: 'tech',
      label: 'IT & TECH MNC HIRING 2026',
      Icon: Terminal,
      badgeText: '💻 TECH & IT HIRING 2026'
    };
  }
  if (
    combined.includes('teach') ||
    combined.includes('shikshak') ||
    combined.includes('varg') ||
    combined.includes('professor') ||
    combined.includes('bed') ||
    combined.includes('शिक्षक') ||
    combined.includes('शिक्षा')
  ) {
    return {
      type: 'teaching',
      label: 'TEACHING & EDUCATION VACANCY',
      Icon: BookOpen,
      badgeText: '📚 TEACHING & EDUCATION VACANCY'
    };
  }
  if (
    combined.includes('railway') ||
    combined.includes('rrb') ||
    combined.includes('rpf') ||
    combined.includes('alp') ||
    combined.includes('लोको') ||
    combined.includes('रेलवे')
  ) {
    return {
      type: 'railway',
      label: 'INDIAN RAILWAYS / RRB RECRUITMENT',
      Icon: Train,
      badgeText: '🚆 RAILWAY / RRB RECRUITMENT'
    };
  }
  if (
    combined.includes('ssc') ||
    combined.includes('upsc') ||
    combined.includes('central') ||
    combined.includes('केन्द्रीय')
  ) {
    return {
      type: 'central',
      label: 'CENTRAL GOVT / SSC VACANCY',
      Icon: Landmark,
      badgeText: '🏛️ CENTRAL GOVT / SSC RECRUITMENT'
    };
  }
  return {
    type: 'general',
    label: 'OFFICIAL VACANCY UPDATE 2026',
    Icon: Award,
    badgeText: '★ OFFICIAL VACANCY UPDATE 2026 ★'
  };
};

export interface JobPosterProps {
  job: JobPostDetail | PostRecord;
  customHeadline?: string;
  customPosts?: string;
  customLastDate?: string;
  customFeeAlert?: string;
  customPoints?: string[];
  customNote?: string;
  customPosterUrl?: string;
  useCustomPoster?: boolean;
  aspectRatio?: 'story' | 'feed'; // 'story' (9:16 - 1080x1920) or 'feed' (4:5 - 1080x1350)
  theme?: PosterTheme;
  characterType?: CharacterType;
  customCharacterUrl?: string;
  characterScale?: 'normal' | 'large' | 'xlarge';
  titleScale?: TitleScale;
  showQrCode?: boolean;
  qrCodeDataUrl?: string;
  scale?: number;
  className?: string;

  // Granular Tile & Typography Controls
  customRoleSubtitle?: string;
  customDeptSubtitle?: string;
  customTile1Label?: string;
  customTile1Value?: string;
  customTile2Label?: string;
  customTile2Value?: string;
  customTile2Sub?: string;
  customTile3Label?: string;
  customTile3Value?: string;
  customTile3Sub?: string;
  customTile4Label?: string;
  customTile4Value?: string;
  customTile4Sub?: string;
  customWebsiteUrl?: string;
  customWebsiteTagline?: string;
  customBottomCallout?: string;
  customOwnerCallout?: string;
}

export const JobPoster = forwardRef<HTMLDivElement, JobPosterProps>(
  (
    {
      job,
      customHeadline,
      customPosts,
      customLastDate,
      customFeeAlert,
      customPosterUrl: overrideCustomPosterUrl,
      useCustomPoster: overrideUseCustomPoster,
      aspectRatio = 'feed', // 1080x1350 by default
      theme = 'classic',
      characterType = 'none',
      customCharacterUrl,
      characterScale = 'normal',
      titleScale = 'md',
      showQrCode = true,
      qrCodeDataUrl: passedQrDataUrl,
      className = '',

      // Granular overrides
      customRoleSubtitle,
      customDeptSubtitle,
      customTile1Label,
      customTile1Value,
      customTile2Label,
      customTile2Value,
      customTile2Sub,
      customTile3Label,
      customTile3Value,
      customTile3Sub,
      customTile4Label,
      customTile4Value,
      customTile4Sub,
      customWebsiteUrl,
      customWebsiteTagline,
      customBottomCallout,
      customOwnerCallout
    },
    ref
  ) => {
    const isPostRecord = (j: JobPostDetail | PostRecord): j is PostRecord => 'dates' in j;
    const postRec = isPostRecord(job) ? job : null;
    const detailRec = !isPostRecord(job) ? (job as JobPostDetail) : null;

    const title = job.title;
    const shortTitle = job.shortTitle || job.title.slice(0, 32);
    const department = customDeptSubtitle || (postRec ? postRec.dept : detailRec?.department || 'शासकीय विभाग');
    const totalPosts = customPosts || String(job.totalPosts || 'विज्ञप्ति अनुसार');
    const startDate = postRec ? postRec.dates?.start || '' : detailRec?.startDate || '';
    const lastDate = customLastDate || (postRec ? postRec.dates?.end || '' : detailRec?.lastDate || '');
    const eligibility = postRec ? postRec.eligibility || postRec.qualification || '' : detailRec?.qualificationSummary || '';
    const minAge = postRec ? postRec.minAge || '18 वर्ष' : detailRec?.minAge || '18 वर्ष';
    const maxAge = postRec ? postRec.maxAge || '33 वर्ष' : detailRec?.maxAge || '33 वर्ष';

    const isTechJob = Boolean(postRec?.isTechJob || detailRec?.isTechJob || postRec?.category === 'tech-jobs');
    const roleSubtitle = customRoleSubtitle || postRec?.role || department || (isTechJob ? 'IT & Tech Hiring' : 'ऑनलाइन भर्ती');
    const categoryEmblem = getCategoryEmblem(postRec?.category || detailRec?.category, title, department);

    // QR Code State
    const [qrDataUrl, setQrDataUrl] = useState<string>(passedQrDataUrl || '');

    useEffect(() => {
      if (passedQrDataUrl) {
        setQrDataUrl(passedQrDataUrl);
      } else if (showQrCode) {
        getWhatsAppQrCodeDataUrl(WHATSAPP_CHANNEL_URL).then((url) => {
          if (url) setQrDataUrl(url);
        });
      }
    }, [passedQrDataUrl, showQrCode]);

    // Canvas target dimensions
    const targetWidth = 1080;
    // 4:5 Feed is 1080x1350; 9:16 Story is 1080x1920
    const targetHeight = aspectRatio === 'story' ? 1920 : 1350;

    // Custom Uploaded Poster Override
    const useCustomPoster =
      overrideUseCustomPoster !== undefined
        ? overrideUseCustomPoster
        : Boolean(postRec?.useCustomPoster || detailRec?.useCustomPoster);
    const customPosterUrl =
      overrideCustomPosterUrl !== undefined
        ? overrideCustomPosterUrl
        : postRec?.customPosterUrl || detailRec?.customPosterUrl;

    if (useCustomPoster && customPosterUrl) {
      return (
        <div
          ref={ref}
          id="job-poster-canvas"
          style={{
            width: `${targetWidth}px`,
            height: `${targetHeight}px`
          }}
          className={`relative bg-slate-950 text-white flex flex-col justify-between select-none font-sans overflow-hidden ${className}`}
        >
          <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={customPosterUrl}
              alt={title}
              className="w-full h-full object-contain"
            />
            {/* Faint Official Seal Overlay on Custom Poster */}
            <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-xs border border-amber-400/60 rounded-xl px-3.5 py-2 flex items-center gap-2 shadow-2xl z-30 pointer-events-none">
              <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                NP
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-amber-300 uppercase leading-none">
                  NP JOB PORTAL
                </p>
                <p className="text-[9px] text-slate-300 font-medium mt-0.5">
                  Nitish Khobragade (8982324497)
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Headline Scaler Styles - ENLARGED FOR HIGH IMPACT
    const titleSizeClasses = {
      sm: 'text-5xl sm:text-6xl leading-tight',
      md: 'text-6xl sm:text-7xl leading-tight',
      lg: 'text-7xl sm:text-8xl leading-none',
      xl: 'text-8xl sm:text-9xl leading-none'
    }[titleScale];

    // Theme Configuration with 6 Distinct Styles
    const themeStyles = {
      classic: {
        accentRibbon: 'from-amber-500 via-rose-500 to-indigo-600',
        headerBadge: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 border-amber-300 shadow-blue-900/50',
        headerText: 'text-white',
        headerSubtitle: 'text-amber-200',
        megaPillBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-200',
        megaPillRed: 'text-red-700',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 border-emerald-400 text-white',
        docHeader: 'bg-indigo-950 text-amber-300 border-indigo-700'
      },
      navy: {
        accentRibbon: 'from-cyan-500 via-blue-600 to-indigo-900',
        headerBadge: 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border-amber-400 shadow-indigo-950/60',
        headerText: 'text-amber-300',
        headerSubtitle: 'text-cyan-200',
        megaPillBg: 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 border-amber-200',
        megaPillRed: 'text-rose-800',
        megaPillBlack: 'text-slate-900',
        brandingBar: 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-blue-400 text-white',
        docHeader: 'bg-slate-900 text-cyan-300 border-slate-700'
      },
      emerald: {
        accentRibbon: 'from-emerald-400 via-teal-500 to-cyan-600',
        headerBadge: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 border-emerald-300 shadow-teal-900/50',
        headerText: 'text-white',
        headerSubtitle: 'text-emerald-200',
        megaPillBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400 border-yellow-200',
        megaPillRed: 'text-red-700',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 border-emerald-400 text-white',
        docHeader: 'bg-teal-950 text-emerald-300 border-teal-700'
      },
      crimson: {
        accentRibbon: 'from-amber-400 via-rose-500 to-red-600',
        headerBadge: 'bg-gradient-to-r from-red-800 via-rose-800 to-purple-900 border-amber-300 shadow-red-950/50',
        headerText: 'text-yellow-300',
        headerSubtitle: 'text-rose-100',
        megaPillBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-200',
        megaPillRed: 'text-red-800',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-rose-700 via-red-800 to-rose-900 border-amber-400 text-white',
        docHeader: 'bg-rose-950 text-amber-300 border-rose-700'
      },
      purple: {
        accentRibbon: 'from-fuchsia-500 via-purple-600 to-indigo-700',
        headerBadge: 'bg-gradient-to-r from-purple-900 via-violet-900 to-indigo-950 border-amber-400 shadow-purple-950/60',
        headerText: 'text-amber-200',
        headerSubtitle: 'text-fuchsia-200',
        megaPillBg: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 border-amber-200',
        megaPillRed: 'text-purple-900',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-purple-800 via-violet-900 to-indigo-900 border-purple-400 text-white',
        docHeader: 'bg-purple-950 text-amber-300 border-purple-700'
      },
      cyber: {
        accentRibbon: 'from-cyan-400 via-teal-500 to-emerald-500',
        headerBadge: 'bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-900 border-cyan-400 shadow-cyan-950/60',
        headerText: 'text-cyan-300',
        headerSubtitle: 'text-teal-200',
        megaPillBg: 'bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 border-cyan-200',
        megaPillRed: 'text-slate-950',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-950 border-cyan-400 text-white',
        docHeader: 'bg-slate-900 text-cyan-300 border-cyan-700'
      }
    }[theme];

    const isFeed = aspectRatio === 'feed';
    const hasCharacter = characterType !== 'none';

    // Character Scale Class - Significantly reduced footprint as a neat corner cutout / side badge
    const charScaleClass = {
      normal: 'max-h-[240px]',
      large: 'max-h-[280px] scale-105 origin-bottom',
      xlarge: 'max-h-[320px] scale-110 origin-bottom'
    }[characterScale];

    // Formatted Qualification text
    const displayEligibility =
      customTile1Value ||
      (eligibility ? eligibility.replace(/<[^>]+>/g, '').trim() : '10वीं / 12वीं अथवा स्नातक पास');

    const displayAge = customTile2Value || `${minAge} से ${maxAge}`;
    const displayAgeSub = customTile2Sub || 'नियमानुसार आयु में छूट लागू';

    const displayStartDate = customTile3Value || startDate || 'प्रारंभ हो चुका है';
    const displayStartDateSub = customTile3Sub || 'ऑनलाइन पोर्टल खुला है';

    const displayLastDate = customTile4Value || lastDate || 'शीघ्र घोषित';
    const displayLastDateSub = customTile4Sub || 'अंतिम तिथि से पूर्व भरें';

    return (
      <div
        ref={ref}
        id="job-poster-canvas"
        style={{
          width: `${targetWidth}px`,
          height: `${targetHeight}px`,
          backgroundImage: 'radial-gradient(#94a3b8 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#ffffff'
        }}
        className={`relative bg-white text-slate-900 flex flex-col justify-between p-6 sm:p-7 select-none font-sans overflow-hidden ${className}`}
      >
        {/* Top-Left Energetic Multi-Color Slanted Header Ribbon */}
        <div
          className={`absolute -top-16 -left-16 w-80 h-36 bg-gradient-to-r ${themeStyles.accentRibbon} -rotate-12 rounded-3xl shadow-xl pointer-events-none opacity-90 z-0`}
        />

        {/* Top-Right Official Seal */}
        <div className="absolute top-4 right-6 pointer-events-none flex items-center gap-2 opacity-90 z-10">
          <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black flex items-center justify-center text-sm shadow-md">
            NP
          </div>
          <span className="text-xs font-black tracking-widest text-slate-800 uppercase">
            NP JOB PORTAL
          </span>
        </div>

        {/* TOP SECTION: 3D Header Badge + Yellow Mega-Pill + Notification Ribbon */}
        <div className="relative z-10 space-y-3 pt-1">
          {/* 1. 3D BOLD HIGH-CONTRAST HEADER BADGE */}
          <div
            className={`w-full ${themeStyles.headerBadge} border-4 rounded-3xl p-5 shadow-[0_18px_32px_rgba(0,0,0,0.35)] text-center relative overflow-hidden`}
          >
            {/* Glossy top bevel reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/15 pointer-events-none" />

            <div className="inline-flex items-center gap-2.5 bg-black/50 backdrop-blur-xs px-5 py-1.5 rounded-full text-sm font-black tracking-wider uppercase mb-1.5 border border-white/30 text-white shadow-sm">
              <categoryEmblem.Icon className="w-5 h-5 text-amber-300 shrink-0" />
              <span>{categoryEmblem.badgeText}</span>
            </div>

            {/* BOLD 3D SLANTED TITLE */}
            <h1
              className={`font-black ${titleSizeClasses} ${themeStyles.headerText} tracking-tight`}
              style={{
                textShadow:
                  '0 3px 0 #0f172a, 0 6px 0 #0f172a, 0 9px 0 #020617, 0 12px 20px rgba(0,0,0,0.7)'
              }}
            >
              {customHeadline || `${shortTitle} भर्ती 2026`}
            </h1>

            {/* HIGH-CONTRAST SUBTITLE */}
            <p className={`text-2xl sm:text-3xl font-extrabold ${themeStyles.headerSubtitle} mt-1.5 tracking-wide drop-shadow-sm`}>
              {department}
            </p>
          </div>

          {/* 2. BRIGHT YELLOW MEGA-PILL */}
          <div
            className={`w-full ${themeStyles.megaPillBg} border-4 border-amber-300/80 rounded-2xl sm:rounded-3xl shadow-xl ${isFeed ? 'px-5 py-2.5 sm:py-3' : 'px-7 py-3 sm:py-4'} flex items-center justify-between gap-4`}
          >
            <div className="flex items-baseline gap-2.5">
              <span className={`${isFeed ? 'text-5xl sm:text-6xl' : 'text-6xl sm:text-7xl'} font-black ${themeStyles.megaPillRed} tracking-tight drop-shadow-md`}>
                {totalPosts}
              </span>
              <span className={`${isFeed ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-black text-slate-950`}>
                पद
              </span>
            </div>

            <div className="text-right">
              <span className={`block ${isFeed ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-black text-slate-950 leading-tight drop-shadow-xs`}>
                {roleSubtitle}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-800 uppercase tracking-wide">
                {isTechJob ? 'Corporate Direct Hiring' : 'ऑनलाइन भर्ती विज्ञापन 2026'}
              </span>
            </div>
          </div>

          {/* 3. NOTIFICATION RIBBON */}
          <div className="w-full bg-white/95 border-2 border-slate-300 rounded-2xl px-6 py-2.5 shadow-sm flex items-center justify-between text-base font-bold">
            <div className="flex items-center gap-2.5 text-slate-900">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                <Laptop className="w-5 h-5" />
              </div>
              <span className="text-lg sm:text-xl font-black text-blue-900 tracking-tight">
                NP Job Portal Official • npjobportal.com
              </span>
            </div>

            {customFeeAlert && (
              <span className="hidden sm:inline-block bg-amber-100 text-amber-950 border border-amber-300 px-3 py-1 rounded-lg text-sm font-black">
                शुल्क: {customFeeAlert}
              </span>
            )}

            <div className="flex items-center gap-2 text-red-600 font-black text-lg sm:text-xl">
              <span className="text-2xl animate-pulse">📢</span>
              <span>ऑनलाइन आवेदन शुरू</span>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: 4 HIGH-CONTRAST TILES (87% MAXIMUM SPACE) + CANDIDATE CORNER BADGE (13%) */}
        <div className={`relative z-10 flex items-stretch gap-3.5 ${isFeed ? 'my-2' : 'my-4'} flex-1 min-h-0`}>
          {/* LEFT TILES GRID - 87% MAXIMUM SPACE ALLOCATED TO KEY JOB INFO */}
          <div className={`${hasCharacter ? 'w-[87%]' : 'w-full'} flex flex-col justify-between gap-3.5`}>
            <div className="grid grid-cols-2 gap-3.5 h-full">
              {/* TILE 1: योग्यता / Qualification (Teal to Emerald) */}
              <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white rounded-3xl p-5 shadow-lg border-2 border-teal-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black uppercase text-teal-100 tracking-wider block">
                      {customTile1Label || 'योग्यता'}
                    </span>
                    <span className="text-sm font-black text-teal-200 uppercase tracking-wide">
                      शैक्षणिक पात्रता
                    </span>
                  </div>
                </div>

                <div className="my-auto py-2">
                  <p className="text-2xl sm:text-3xl font-extrabold text-white leading-snug drop-shadow-sm line-clamp-3">
                    {displayEligibility}
                  </p>
                </div>

                <div className="text-xs font-bold text-teal-100 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-teal-200" />
                  <span>विज्ञप्ति अनुसार सभी शाखाएं मान्य</span>
                </div>
              </div>

              {/* TILE 2: आयु सीमा / Age Limit (Purple to Fuchsia) */}
              <div className="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white rounded-3xl p-5 shadow-lg border-2 border-pink-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black uppercase text-pink-100 tracking-wider block">
                      {customTile2Label || 'आयु सीमा'}
                    </span>
                    <span className="text-sm font-black text-pink-200 uppercase tracking-wide">
                      Age Criteria
                    </span>
                  </div>
                </div>

                <div className="my-auto py-2">
                  <p className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-sm">
                    {displayAge}
                  </p>
                  <p className="text-base font-bold text-pink-100 mt-1">
                    {displayAgeSub}
                  </p>
                </div>

                <div className="text-xs font-bold text-pink-100 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-pink-200" />
                  <span>आरक्षित वर्गों को आयु सीमा में छूट</span>
                </div>
              </div>

              {/* TILE 3: आवेदन प्रारंभ / Start Date (Orange to Amber) */}
              <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl p-5 shadow-lg border-2 border-orange-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black uppercase text-amber-100 tracking-wider block">
                      {customTile3Label || 'आवेदन प्रारंभ'}
                    </span>
                    <span className="text-sm font-black text-amber-200 uppercase tracking-wide">
                      Starting Date
                    </span>
                  </div>
                </div>

                <div className="my-auto py-2">
                  <p className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-sm">
                    {displayStartDate}
                  </p>
                  <p className="text-base font-bold text-amber-100 mt-1">
                    {displayStartDateSub}
                  </p>
                </div>

                <div className="text-xs font-bold text-amber-100 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-amber-200" />
                  <span>पोर्टल पर आवेदन पत्र लाइव है</span>
                </div>
              </div>

              {/* TILE 4: अंतिम तिथि / Last Date (Cyan to Royal Blue) */}
              <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg border-2 border-cyan-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl sm:text-3xl font-black uppercase text-cyan-100 tracking-wider block">
                      {customTile4Label || 'अंतिम तिथि'}
                    </span>
                    <span className="text-sm font-black text-cyan-200 uppercase tracking-wide">
                      Last Date Alert
                    </span>
                  </div>
                </div>

                <div className="my-auto py-2">
                  <p className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-sm">
                    {displayLastDate}
                  </p>
                  <p className="text-base font-bold text-cyan-100 mt-1">
                    {displayLastDateSub}
                  </p>
                </div>

                <div className="text-xs font-bold text-cyan-100 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-cyan-200" />
                  <span>सर्वर डाउन होने से पूर्व फॉर्म भरें</span>
                </div>
              </div>
            </div>

            {/* DOCUMENT CHECKLIST PILL */}
            <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-3.5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className={`px-4 py-1.5 rounded-xl text-sm font-black ${themeStyles.docHeader} inline-flex items-center gap-2 shadow-xs`}>
                  <FileText className="w-4 h-4" />
                  <span>आवश्यक दस्तावेज़ (Required Documents):</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-xs sm:text-sm font-extrabold text-slate-900">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>10वीं/12वीं अंकसूची</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>आधार कार्ड</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>जाति / निवास प्रमाण पत्र</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>पासपोर्ट साइज फोटो व हस्ताक्षर</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>मोबाइल नंबर व ईमेल आईडी</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>स्नातक / डिप्लोमा (यदि लागू)</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CANDIDATE CHARACTER GRAPHIC (~13% NEAT CORNER CUTOUT / SIDE BADGE) */}
          {hasCharacter && (
            <div className="w-[13%] flex flex-col items-center justify-end relative self-end pb-1 shrink-0 overflow-visible">
              <div className="relative w-full flex items-end justify-center">
                <CandidateCharacter
                  type={characterType}
                  customUrl={customCharacterUrl}
                  className={`w-full ${charScaleClass} object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.25)]`}
                />
              </div>
              <div className="mt-1 bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full text-center shadow-xs tracking-wider whitespace-nowrap">
                ★ VERIFIED ★
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: BRANDING BAR + WHATSAPP QR CODE + SLOGAN */}
        <div className="relative z-10 shrink-0 pt-2 border-t-2 border-slate-200 mt-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Left Branding Strip */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5 sm:gap-2">
              <div
                className={`w-full ${themeStyles.brandingBar} ${isFeed ? 'py-2 px-4' : 'py-3.5 px-6'} rounded-xl sm:rounded-2xl shadow-lg border-2 text-center overflow-hidden`}
              >
                <p className={`${isFeed ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} font-black tracking-widest uppercase drop-shadow-xs truncate`}>
                  {customWebsiteUrl || 'WWW.NPJOBPORTAL.COM'}
                </p>
                <p className={`${isFeed ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-bold opacity-95 mt-0.5 truncate`}>
                  {customWebsiteTagline || 'घर बैठे सुरक्षित ऑनलाइन फॉर्म भरवाएं • विश्वसनीय सेवा केंद्र'}
                </p>
              </div>

              {/* Slogan & Operator Note */}
              <div className="flex items-center justify-between gap-2 px-1 text-slate-900">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="text-lg shrink-0">⚡</span>
                  <span className={`${isFeed ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'} font-black text-slate-950 truncate`}>
                    {customBottomCallout || `${shortTitle} शुरू - जल्दी आवेदन करें!`}
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className={`${isFeed ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'} font-black text-blue-950 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg block whitespace-nowrap shadow-2xs`}>
                    {customOwnerCallout || `संचालक: ${OWNER_INFO.name} (${OWNER_INFO.phone})`}
                  </span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Channel QR Code Card */}
            {showQrCode && (
              <div className={`bg-white border-2 border-slate-300 rounded-xl sm:rounded-2xl ${isFeed ? 'p-2 w-28 sm:w-32' : 'p-2.5 w-36 sm:w-40'} shadow-md flex flex-col items-center justify-center shrink-0 text-center`}>
                <span className="text-[10px] sm:text-xs font-black text-emerald-700 uppercase tracking-tight block mb-1">
                  Scan for Details
                </span>
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    className={`${isFeed ? 'w-20 h-20 sm:w-22 sm:h-22' : 'w-24 h-24 sm:w-28 sm:h-28'} object-contain rounded`}
                  />
                ) : (
                  <div className={`${isFeed ? 'w-20 h-20 sm:w-22 sm:h-22' : 'w-24 h-24 sm:w-28 sm:h-28'} bg-slate-100 flex items-center justify-center rounded`}>
                    <QrCode className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 mt-0.5 block leading-tight">
                  WhatsApp चैनल
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

JobPoster.displayName = 'JobPoster';
