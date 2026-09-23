"use client";

import React, { forwardRef, useEffect, useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  QrCode,
  Laptop
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { CandidateCharacter, CharacterType } from './CandidateCharacter';
import { getWhatsAppQrCodeDataUrl, WHATSAPP_CHANNEL_URL } from '../lib/qrCodeHelper';

export type PosterTheme = 'classic' | 'navy' | 'emerald' | 'crimson';
export type TitleScale = 'sm' | 'md' | 'lg' | 'xl';

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
  titleScale?: TitleScale;
  showQrCode?: boolean;
  qrCodeDataUrl?: string;
  scale?: number;
  className?: string;
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
      characterType = 'male',
      customCharacterUrl,
      titleScale = 'md',
      showQrCode = true,
      qrCodeDataUrl: passedQrDataUrl,
      className = ''
    },
    ref
  ) => {
    const isPostRecord = (j: JobPostDetail | PostRecord): j is PostRecord => 'dates' in j;
    const postRec = isPostRecord(job) ? job : null;
    const detailRec = !isPostRecord(job) ? (job as JobPostDetail) : null;

    const title = job.title;
    const shortTitle = job.shortTitle || job.title.slice(0, 32);
    const department = postRec ? postRec.dept : detailRec?.department || 'शासकीय विभाग';
    const totalPosts = customPosts || String(job.totalPosts || 'विज्ञप्ति अनुसार');
    const startDate = postRec ? postRec.dates?.start || '' : detailRec?.startDate || '';
    const lastDate = customLastDate || (postRec ? postRec.dates?.end || '' : detailRec?.lastDate || '');
    const eligibility = postRec ? postRec.eligibility || postRec.qualification || '' : detailRec?.qualificationSummary || '';
    const minAge = postRec ? postRec.minAge || '18 वर्ष' : detailRec?.minAge || '18 वर्ष';
    const maxAge = postRec ? postRec.maxAge || '33 वर्ष' : detailRec?.maxAge || '33 वर्ष';

    const isTechJob = Boolean(postRec?.isTechJob || detailRec?.isTechJob || postRec?.category === 'tech-jobs');
    const roleSubtitle = postRec?.role || department || (isTechJob ? 'IT & Tech Hiring' : 'विज्ञप्ति अनुसार');

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
    const useCustomPoster = overrideUseCustomPoster !== undefined
      ? overrideUseCustomPoster
      : Boolean(postRec?.useCustomPoster || detailRec?.useCustomPoster);
    const customPosterUrl = overrideCustomPosterUrl !== undefined
      ? overrideCustomPosterUrl
      : (postRec?.customPosterUrl || detailRec?.customPosterUrl);

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

    // Headline Scaler Styles
    const titleSizeClasses = {
      sm: 'text-4xl md:text-5xl leading-tight',
      md: 'text-5xl md:text-6xl leading-tight',
      lg: 'text-6xl md:text-7xl leading-tight',
      xl: 'text-7xl md:text-8xl leading-tight'
    }[titleScale];

    // Theme Configuration
    const themeStyles = {
      classic: {
        accentRibbon: 'from-amber-500 via-rose-500 to-indigo-600',
        headerBadge: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 border-amber-300',
        headerText: 'text-white drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)]',
        headerSubtitle: 'text-amber-200',
        megaPillBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-200',
        megaPillRed: 'text-red-700',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 border-emerald-400 text-white',
        docHeader: 'bg-indigo-950 text-amber-300 border-indigo-700'
      },
      navy: {
        accentRibbon: 'from-cyan-500 via-blue-600 to-indigo-900',
        headerBadge: 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border-amber-400',
        headerText: 'text-amber-300 drop-shadow-[0_6px_8px_rgba(0,0,0,0.8)]',
        headerSubtitle: 'text-blue-200',
        megaPillBg: 'bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 border-amber-200',
        megaPillRed: 'text-rose-800',
        megaPillBlack: 'text-slate-900',
        brandingBar: 'bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border-blue-400 text-white',
        docHeader: 'bg-slate-900 text-cyan-300 border-slate-700'
      },
      emerald: {
        accentRibbon: 'from-emerald-400 via-teal-500 to-cyan-600',
        headerBadge: 'bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 border-emerald-300',
        headerText: 'text-white drop-shadow-[0_6px_8px_rgba(0,0,0,0.6)]',
        headerSubtitle: 'text-emerald-200',
        megaPillBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-lime-400 border-yellow-200',
        megaPillRed: 'text-red-700',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 border-emerald-400 text-white',
        docHeader: 'bg-teal-950 text-emerald-300 border-teal-700'
      },
      crimson: {
        accentRibbon: 'from-amber-400 via-rose-500 to-red-600',
        headerBadge: 'bg-gradient-to-r from-red-800 via-rose-800 to-purple-900 border-amber-300',
        headerText: 'text-yellow-300 drop-shadow-[0_6px_8px_rgba(0,0,0,0.7)]',
        headerSubtitle: 'text-rose-100',
        megaPillBg: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 border-amber-200',
        megaPillRed: 'text-red-800',
        megaPillBlack: 'text-slate-950',
        brandingBar: 'bg-gradient-to-r from-rose-700 via-red-800 to-rose-900 border-amber-400 text-white',
        docHeader: 'bg-rose-950 text-amber-300 border-rose-700'
      }
    }[theme];

    const isFeed = aspectRatio === 'feed';
    const hasCharacter = characterType !== 'none';

    // Formatted Qualification text
    const displayEligibility = eligibility
      ? eligibility.replace(/<[^>]+>/g, '').trim()
      : '10वीं / 12वीं अथवा स्नातक डिग्री';

    const displayAge = `${minAge} से ${maxAge}`;

    // Clean Start & Last Dates
    const displayStartDate = startDate || 'प्रारंभ हो चुका है';
    const displayLastDate = lastDate || 'शीघ्र घोषित';

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

        {/* Top-Right Faint Watermark Seal */}
        <div className="absolute top-4 right-6 pointer-events-none flex items-center gap-2 opacity-80 z-10">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black flex items-center justify-center text-xs shadow-md">
            NP
          </div>
          <span className="text-[11px] font-black tracking-widest text-slate-700 uppercase">
            NP JOB PORTAL
          </span>
        </div>

        {/* TOP SECTION: 3D Header Badge + Yellow Mega-Pill + Notification Ribbon */}
        <div className="relative z-10 space-y-3.5 pt-2">
          {/* 1. 3D BOLD HEADER BADGE */}
          <div
            className={`w-full ${themeStyles.headerBadge} border-4 rounded-3xl p-4 sm:p-5 shadow-[0_16px_30px_rgba(0,0,0,0.3)] text-center relative overflow-hidden`}
          >
            {/* Glossy top bevel reflection */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 pointer-events-none" />

            <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3.5 py-1 rounded-full text-xs font-black tracking-wider uppercase mb-1 border border-white/20 text-white">
              <span>★</span>
              <span>{isTechJob ? 'IT & TECH VACANCY 2026' : 'OFFICIAL VACANCY UPDATE 2026'}</span>
              <span>★</span>
            </div>

            <h1
              className={`font-black ${titleSizeClasses} ${themeStyles.headerText} tracking-tight`}
              style={{
                textShadow:
                  '0 2px 0 #1e1b4b, 0 4px 0 #1e1b4b, 0 6px 0 #0f172a, 0 8px 14px rgba(0,0,0,0.6)'
              }}
            >
              {customHeadline || `${shortTitle} भर्ती 2026`}
            </h1>

            <p className={`text-base sm:text-lg font-bold ${themeStyles.headerSubtitle} mt-1`}>
              {department}
            </p>
          </div>

          {/* 2. YELLOW MEGA-PILL */}
          <div
            className={`w-full ${themeStyles.megaPillBg} border-3 rounded-2xl sm:rounded-3xl shadow-xl px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-4`}
          >
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl sm:text-5xl font-black ${themeStyles.megaPillRed} tracking-tight drop-shadow-sm`}>
                {totalPosts}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-950">
                पद
              </span>
            </div>

            <div className="text-right">
              <span className="block text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                {roleSubtitle}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                {isTechJob ? 'Corporate Hiring' : 'ऑनलाइन भर्ती विज्ञापन'}
              </span>
            </div>
          </div>

          {/* 3. NOTIFICATION RIBBON */}
          <div className="w-full bg-white/95 border-2 border-slate-200 rounded-2xl px-5 py-2 shadow-sm flex items-center justify-between text-xs sm:text-sm font-bold">
            <div className="flex items-center gap-2 text-slate-800">
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                <Laptop className="w-4 h-4" />
              </div>
              <span className="text-sm font-black text-blue-900">
                NP Job Portal Official • npjobportal.com
              </span>
            </div>

            {customFeeAlert && (
              <span className="hidden sm:inline-block bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-bold">
                शुल्क: {customFeeAlert}
              </span>
            )}

            <div className="flex items-center gap-1.5 text-red-600 font-black text-sm sm:text-base">
              <span className="text-lg">📢</span>
              <span>ऑनलाइन आवेदन शुरू</span>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: 2x2 HIGH-CONTRAST TILES (LEFT) + CANDIDATE CHARACTER (RIGHT) */}
        <div className={`relative z-10 flex items-stretch gap-4 ${isFeed ? 'my-2.5' : 'my-4'} flex-1 min-h-0`}>
          {/* LEFT TILES GRID */}
          <div className={`${hasCharacter ? 'w-[58%]' : 'w-full'} flex flex-col justify-between gap-3`}>
            <div className="grid grid-cols-2 gap-3 h-full">
              {/* TILE 1: योग्यता / Qualification (Teal to Emerald) */}
              <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 text-white rounded-3xl p-4 sm:p-4.5 shadow-lg border-2 border-teal-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-teal-100 tracking-wider block">
                      शैक्षणिक योग्यता
                    </span>
                    <span className="text-xs font-bold text-teal-200">
                      पात्रता विवरण
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-lg sm:text-xl font-black text-white leading-snug line-clamp-3 drop-shadow-xs">
                    {displayEligibility}
                  </p>
                </div>
              </div>

              {/* TILE 2: आयु सीमा / Age Limit (Purple to Pink) */}
              <div className="bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-600 text-white rounded-3xl p-4 sm:p-4.5 shadow-lg border-2 border-pink-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-pink-100 tracking-wider block">
                      आयु सीमा
                    </span>
                    <span className="text-xs font-bold text-pink-200">
                      Age Criteria
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-xs">
                    {displayAge}
                  </p>
                  <p className="text-[11px] font-bold text-pink-100 mt-0.5">
                    नियमानुसार आयु में छूट लागू
                  </p>
                </div>
              </div>

              {/* TILE 3: आवेदन प्रारंभ / Start Date (Orange to Coral) */}
              <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white rounded-3xl p-4 sm:p-4.5 shadow-lg border-2 border-orange-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-amber-100 tracking-wider block">
                      आवेदन प्रारंभ
                    </span>
                    <span className="text-xs font-bold text-amber-200">
                      Starting Date
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-xs">
                    {displayStartDate}
                  </p>
                  <p className="text-[11px] font-bold text-amber-100 mt-0.5">
                    ऑनलाइन पोर्टल खुला है
                  </p>
                </div>
              </div>

              {/* TILE 4: अंतिम तिथि / Last Date (Cyan to Royal Blue) */}
              <div className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-3xl p-4 sm:p-4.5 shadow-lg border-2 border-cyan-300/40 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/40 shadow-xs">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase text-cyan-100 tracking-wider block">
                      अंतिम तिथि
                    </span>
                    <span className="text-xs font-bold text-cyan-200">
                      Last Date Alert
                    </span>
                  </div>
                </div>

                <div className="mt-2">
                  <p className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-xs">
                    {displayLastDate}
                  </p>
                  <p className="text-[11px] font-bold text-cyan-100 mt-0.5">
                    अंतिम तिथि से पूर्व आवेदन करें
                  </p>
                </div>
              </div>
            </div>

            {/* DOCUMENT CHECKLIST PILL */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <div className={`px-3 py-1 rounded-xl text-xs font-black ${themeStyles.docHeader} inline-flex items-center gap-1.5 shadow-xs`}>
                  <FileText className="w-3.5 h-3.5" />
                  <span>आवश्यक दस्तावेज़ (Required Documents):</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-bold text-slate-800">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>10वीं/12वीं अंकसूची</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>आधार कार्ड</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>जाति/निवास प्रमाण पत्र</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>फोटो व हस्ताक्षर</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>मोबाइल व ईमेल आईडी</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                  <span>स्नातक/डिप्लोमा (यदि लागू)</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT CANDIDATE CHARACTER GRAPHIC */}
          {hasCharacter && (
            <div className="w-[42%] flex items-end justify-center relative overflow-hidden">
              <CandidateCharacter
                type={characterType}
                customUrl={customCharacterUrl}
                className="w-full h-full"
              />
            </div>
          )}
        </div>

        {/* BOTTOM SECTION: BRANDING BAR + WHATSAPP QR CODE + SLOGAN */}
        <div className="relative z-10 pt-2 border-t-2 border-slate-200">
          <div className="flex items-center gap-4">
            {/* Left Branding Strip */}
            <div className="flex-1 space-y-2">
              <div
                className={`w-full ${themeStyles.brandingBar} py-3 px-6 rounded-2xl shadow-lg border-2 text-center`}
              >
                <p className="text-xl sm:text-2xl font-black tracking-wider uppercase">
                  WWW.NPJOBPORTAL.COM
                </p>
                <p className="text-xs sm:text-sm font-semibold opacity-95 mt-0.5">
                  घर बैठे सुरक्षित ऑनलाइन फॉर्म भरवाएं • विश्वसनीय सेवा केंद्र
                </p>
              </div>

              {/* Slogan */}
              <div className="flex items-center justify-between px-2 text-slate-900">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">⚡</span>
                  <span className="text-lg sm:text-xl font-black text-slate-950">
                    {shortTitle} शुरू - जल्दी आवेदन करें!
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-black text-blue-900 block">
                    संचालक: {OWNER_INFO.name} ({OWNER_INFO.phone})
                  </span>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Channel QR Code Card */}
            {showQrCode && (
              <div className="bg-white border-2 border-slate-300 rounded-2xl p-2.5 shadow-md flex flex-col items-center justify-center shrink-0 w-32 sm:w-36 text-center">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-tight block mb-1">
                  Scan for Details
                </span>
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="WhatsApp QR Code"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain rounded"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-slate-100 flex items-center justify-center rounded">
                    <QrCode className="w-10 h-10 text-slate-400" />
                  </div>
                )}
                <span className="text-[9px] font-bold text-slate-500 mt-1 block leading-tight">
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
