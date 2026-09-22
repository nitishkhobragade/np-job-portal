"use client";

import React, { forwardRef } from 'react';
import {
  Calendar,
  Users,
  GraduationCap,
  FileCheck2,
  Sparkles,
  ShieldCheck,
  Phone,
  MessageCircle,
  Check,
  Building2,
  MapPin,
  Clock
} from 'lucide-react';
import { JobPostDetail, PostRecord } from '../types';
import { OWNER_INFO } from '../data/portalData';

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
  aspectRatio?: 'story' | 'feed'; // 'story' (9:16) or 'feed' (4:3)
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
      customPoints,
      customNote,
      customPosterUrl: overrideCustomPosterUrl,
      useCustomPoster: overrideUseCustomPoster,
      aspectRatio = 'story',
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
    const examDate = postRec ? postRec.examDate || postRec.dates?.exam || 'शीघ्र घोषित' : detailRec?.examDate || 'शीघ्र घोषित';
    const feeGen = postRec ? postRec.feeGeneral || postRec.fee?.gen || '₹500/-' : detailRec?.feeGeneral || '₹500/-';
    const feeRes = postRec ? postRec.feeReserved || postRec.fee?.reserved || '₹250/-' : detailRec?.feeReserved || '₹250/-';
    const eligibility = postRec ? postRec.eligibility || postRec.qualification || '' : detailRec?.qualificationSummary || '';
    const minAge = postRec ? postRec.minAge || '18 वर्ष' : detailRec?.minAge || '18 वर्ष';
    const maxAge = postRec ? postRec.maxAge || '33 वर्ष' : detailRec?.maxAge || '33 वर्ष';

    const isTechJob = Boolean(postRec?.isTechJob || detailRec?.isTechJob || postRec?.category === 'tech-jobs');
    const showReservationSection = postRec?.showReservationSection !== undefined
      ? postRec.showReservationSection
      : detailRec?.showReservationSection !== undefined
      ? detailRec.showReservationSection
      : !isTechJob;

    const location = postRec?.location || detailRec?.location || 'Pan India / Remote';
    const batchEligibility = postRec?.batchEligibility || detailRec?.batchEligibility || 'All Batches Eligible';

    const headline = customHeadline || `★ ${shortTitle} भर्ती अलर्ट ★`;
    const feeAlert = customFeeAlert || (showReservationSection ? `${feeGen} / ${feeRes}` : 'विज्ञप्ति अनुसार');
    const note = customNote || 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।';

    const points = customPoints && customPoints.length > 0
      ? customPoints
      : isTechJob
      ? [
          `कंपनी / विभाग: ${department}`,
          `कार्य स्थल: ${location}`,
          `पात्र बैच: ${batchEligibility}`,
          `अंतिम तिथि: ${lastDate}`
        ]
      : [
          `कुल पद: ${totalPosts}`,
          `अंतिम तिथि: ${lastDate}`,
          `शैक्षणिक योग्यता: ${eligibility.slice(0, 65)}...`,
          `आयु सीमा: ${minAge} से ${maxAge}`
        ];

    const targetWidth = 1080;
    const targetHeight = aspectRatio === 'story' ? 1920 : 1440;

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
          {/* Custom Poster Image Canvas */}
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

    return (
      <div
        ref={ref}
        id="job-poster-canvas"
        style={{
          width: `${targetWidth}px`,
          height: `${targetHeight}px`
        }}
        className={`relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between py-4 px-6 select-none font-sans overflow-hidden ${className}`}
      >
        {/* Subtle Decorative Watermark Pattern (-30 deg, faint opacity) */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden z-20 flex flex-col justify-around opacity-[0.10] select-none"
          aria-hidden="true"
        >
          <div
            style={{ transform: 'rotate(-30deg) translateX(-10%)' }}
            className="whitespace-nowrap text-white text-3xl font-black tracking-widest uppercase"
          >
            NP JOB PORTAL • NITISH KHOBRAGADE (8982324497) • NP JOB PORTAL • NITISH KHOBRAGADE
          </div>
          <div
            style={{ transform: 'rotate(-30deg) translateX(-25%)' }}
            className="whitespace-nowrap text-amber-300 text-3xl font-black tracking-widest uppercase"
          >
            NP JOB PORTAL • NITISH KHOBRAGADE (8982324497) • NP JOB PORTAL • NITISH KHOBRAGADE
          </div>
          <div
            style={{ transform: 'rotate(-30deg) translateX(-15%)' }}
            className="whitespace-nowrap text-white text-3xl font-black tracking-widest uppercase"
          >
            NP JOB PORTAL • NITISH KHOBRAGADE (8982324497) • NP JOB PORTAL • NITISH KHOBRAGADE
          </div>
          {aspectRatio === 'story' && (
            <div
              style={{ transform: 'rotate(-30deg) translateX(-20%)' }}
              className="whitespace-nowrap text-amber-300 text-3xl font-black tracking-widest uppercase"
            >
              NP JOB PORTAL • NITISH KHOBRAGADE (8982324497) • NP JOB PORTAL • NITISH KHOBRAGADE
            </div>
          )}
        </div>

        {/* 1. TOP BRANDING HEADER (NP JOB PORTAL + Nitish Khobragade) */}
        <div className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 rounded-3xl p-5 text-white shadow-xl border-b-4 border-amber-400 relative z-10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center shadow-xl border-2 border-amber-300 shrink-0">
                <span className="text-red-700 font-black text-2xl tracking-tighter leading-none">NP</span>
                <span className="text-[9px] font-bold text-slate-800 tracking-widest mt-0.5">PORTAL</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-md">
                    NP JOB PORTAL
                  </h2>
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded shadow-sm">
                    {isTechJob ? 'IT & MNC RECRUITMENT' : 'सरकारी भर्ती अलर्ट'}
                  </span>
                </div>
                <p className="text-amber-100 text-sm font-semibold mt-1">
                  Nitish Khobragade (8982324497) - घर बैठे सुरक्षित फॉर्म भरवाएं
                </p>
              </div>
            </div>

            {/* Top Owner Badge */}
            <div className="bg-slate-950/85 backdrop-blur-xs border border-amber-400/80 rounded-2xl p-3 text-right shadow-lg shrink-0">
              <div className="text-amber-300 text-[11px] font-bold uppercase tracking-wider">
                संचालक व ऑनलाइन फॉर्म विशेषज्ञ
              </div>
              <div className="text-white text-lg font-black mt-0.5">
                {OWNER_INFO.name}
              </div>
              <div className="text-amber-400 font-mono font-bold text-base flex items-center justify-end gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 fill-amber-400" />
                {OWNER_INFO.phone}
              </div>
            </div>
          </div>
        </div>

        {/* 2. MAIN NOTICE BANNER */}
        <div className="px-3 py-2 relative z-10 shrink-0">
          <div className="bg-amber-400 text-slate-950 py-2.5 px-6 rounded-2xl font-black text-center text-xl tracking-wide shadow-md flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6" />
            <span className="truncate">{headline}</span>
            <Sparkles className="w-6 h-6" />
          </div>

          {/* Job Title Box */}
          <div className="mt-3 bg-gradient-to-r from-blue-900/90 via-indigo-950 to-slate-900 border-2 border-blue-500/60 rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-black px-4 py-1 rounded-bl-xl uppercase tracking-wider">
              {'state' in job && job.state ? job.state : isTechJob ? 'Corporate' : 'Central'} 2026
            </div>
            <h1 className="text-3xl font-extrabold text-white leading-tight drop-shadow-sm mt-1 px-4">
              {title}
            </h1>
            <p className="text-lg text-blue-200 font-semibold mt-1.5">
              {department}
            </p>
            <div className="mt-3 inline-flex items-center gap-2.5 bg-amber-400 text-slate-950 px-6 py-2 rounded-full font-black text-xl shadow-lg">
              {isTechJob ? <Building2 className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              <span>{isTechJob ? `स्थान: ${location}` : `कुल पद: ${totalPosts}`}</span>
            </div>
          </div>
        </div>

        {/* 3. KEY HIGHLIGHTS 3-BOX AUTO-SPACED GRID */}
        <div className="grid grid-cols-3 gap-4 px-3 relative z-10 shrink-0">
          {/* Box 1: Qualification / Work Mode */}
          <div className="bg-slate-800/95 border border-slate-600/80 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              {isTechJob ? <MapPin className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
              <span>{isTechJob ? 'वर्क मोड व स्थान' : 'शैक्षणिक योग्यता'}</span>
            </div>
            <div className="text-white text-lg font-bold mt-1.5 leading-snug">
              {isTechJob
                ? location
                : eligibility.length > 60
                ? eligibility.slice(0, 58) + '...'
                : eligibility || 'विज्ञप्ति अनुसार'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">
              {isTechJob ? 'रिमोट / ऑनसाइट' : 'विस्तृत नियम पुस्तिका देखें'}
            </div>
          </div>

          {/* Box 2: Age Limit / Batch Eligibility */}
          <div className="bg-slate-800/95 border border-slate-600/80 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              {isTechJob ? <Clock className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              <span>{isTechJob ? 'पात्र बैच' : 'आयु सीमा'}</span>
            </div>
            <div className="text-white text-xl font-black mt-1.5">
              {isTechJob ? batchEligibility : `${minAge} से ${maxAge}`}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1 font-semibold">
              {isTechJob ? 'फ्रेशर्स व अनुभवी पात्र' : showReservationSection ? 'नियमानुसार आयु छूट लागू' : 'सामान्य आयु नियम'}
            </div>
          </div>

          {/* Box 3: Last Date Highlight */}
          <div className="bg-gradient-to-br from-rose-950 to-red-900 border-2 border-red-500 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
            <div className="flex items-center gap-2 text-red-300 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>अंतिम तिथि</span>
            </div>
            <div className="text-amber-300 text-xl font-black mt-1.5">
              {lastDate}
            </div>
            <div className="text-[11px] text-rose-200 mt-1 font-bold animate-pulse">
              अंतिम तिथि से पूर्व आवेदन करें
            </div>
          </div>
        </div>

        {/* 4. DATES & HIGHLIGHTS GRID */}
        <div className="grid grid-cols-2 gap-4 px-3 relative z-10 shrink-0">
          {/* Important Dates Table */}
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-md">
            <h4 className="text-amber-400 font-bold text-base mb-2 flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <Calendar className="w-4 h-4" /> महत्वपूर्ण तिथियां एवं विवरण
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between items-center text-slate-200">
                <span className="text-slate-400">आवेदन प्रारंभ:</span>
                <span className="font-bold text-white font-mono">{startDate || 'विज्ञप्ति अनुसार'}</span>
              </li>
              <li className="flex justify-between items-center text-slate-200">
                <span className="text-slate-400">अंतिम तिथि:</span>
                <span className="font-black text-rose-400 font-mono">{lastDate}</span>
              </li>
              {!isTechJob && (
                <li className="flex justify-between items-center text-slate-200">
                  <span className="text-slate-400">परीक्षा तिथि:</span>
                  <span className="font-bold text-amber-300">{examDate}</span>
                </li>
              )}
              {showReservationSection && (
                <li className="flex justify-between items-center text-slate-200 pt-1 border-t border-slate-800">
                  <span className="text-slate-400">आवेदन शुल्क:</span>
                  <span className="font-bold text-emerald-300">{feeAlert}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Key Checklist Points */}
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-md">
            <h4 className="text-emerald-400 font-bold text-base mb-2 flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <FileCheck2 className="w-4 h-4" /> मुख्य भर्ती बिंदु
            </h4>
            <ul className="space-y-1.5 text-sm text-slate-200">
              {points.slice(0, 3).map((pt, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-medium text-slate-100 line-clamp-1">{pt}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 text-amber-300 text-xs font-semibold pt-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{note}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 5. CALLOUT SERVICE BOX (100% Guaranteed Online Form Filing) */}
        <div className="mx-3 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 p-4 rounded-2xl shadow-xl flex items-center justify-between border-2 border-amber-300 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight leading-tight">
                घर बैठे 100% सुरक्षित ऑनलाइन फॉर्म भरवाएं!
              </h3>
              <p className="text-slate-900 font-semibold text-xs mt-0.5">
                व्हाट्सएप पर दस्तावेज भेजें, पूर्ण सटीकता व आधिकारिक कंप्यूटर रसीद तुरंत पाएं।
              </p>
            </div>
          </div>
          <div className="bg-slate-950 text-white px-4 py-2 rounded-xl font-black text-sm flex items-center gap-1.5 shadow-lg shrink-0">
            <MessageCircle className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            <span>व्हाट्सएप करें</span>
          </div>
        </div>

        {/* 5.1 EXTRA 9:16 STORY SECTION (DOCUMENTS CHECKLIST) */}
        {aspectRatio === 'story' && (
          <div className="mx-3 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-md relative z-10 shrink-0">
            <h4 className="text-amber-400 font-black text-base mb-2 flex items-center gap-2 border-b border-slate-800 pb-1.5">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <span>फॉर्म भरने हेतु आवश्यक दस्तावेज (Document Checklist):</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>आधार कार्ड (मोबाइल लिंक)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>10वीं / 12वीं / डिग्री अंकसूची</span>
              </div>
              {showReservationSection && (
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>जाति प्रमाण पत्र (SC/ST/OBC/EWS)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>मूल निवासी प्रमाण पत्र</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>पासपोर्ट साइज रंगीन फोटो व हस्ताक्षर</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>ईमेल आईडी व सक्रिय मोबाइल नंबर</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. FIXED BOTTOM BRANDING BAR */}
        <div className="bg-slate-950 border-t-4 border-amber-400 py-3.5 px-6 rounded-2xl flex items-center justify-between text-white relative z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shrink-0 shadow-md">
              NP
            </div>
            <div>
              <div className="text-amber-300 text-xs font-black uppercase tracking-wider">
                घर बैठे फॉर्म भराने संपर्क करें: 8982324497
              </div>
              <div className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
                <span>Nitish Khobragade</span>
                <span className="text-amber-400 font-mono">- 8982324497</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                NP Job Portal • Nitish Khobragade (8982324497) - घर बैठे सुरक्षित फॉर्म भरवाएं
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-600 px-3.5 py-2 rounded-xl font-black text-sm shadow-md text-white">
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp: 8982324497</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-600 px-3.5 py-2 rounded-xl font-black text-sm shadow-md text-white">
              <Phone className="w-4 h-4 fill-white" />
              <span>कॉल करें</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

JobPoster.displayName = 'JobPoster';
