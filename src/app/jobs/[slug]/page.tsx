"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  CreditCard,
  GraduationCap,
  Users,
  FileText,
  Download,
  Share2,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  FileCheck2,
  Home
} from 'lucide-react';
import { getJobDetailBySlug } from '../../../data/jobDetailsData';
import { OWNER_INFO } from '../../../data/portalData';
import { AdSenseBanner } from '../../../components/AdSenseBanner';
import { PosterStudio } from '../../../components/PosterStudio';
import { Footer } from '../../../components/Footer';
import { PopupAdModal } from '../../../components/PopupAdModal';
import { TrendingJobsWidget } from '../../../components/TrendingJobsWidget';
import { RelatedBlogsWidget } from '../../../components/RelatedBlogsWidget';
import { getJobBySlug } from '../../../lib/firebase';
import { JobPostDetail } from '../../../types';

interface JobPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function JobDetailPage({ params }: JobPageProps) {
  // Unwrap Next.js 15+ promise params
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const staticJob = getJobDetailBySlug(slug);

  const [dynamicJob, setDynamicJob] = useState<JobPostDetail | null>(null);

  useEffect(() => {
    if (!staticJob) {
      getJobBySlug(slug).then((record) => {
        if (record) {
          const synthesized: JobPostDetail = {
            slug: record.id,
            id: record.id,
            title: record.title,
            shortTitle: record.shortTitle || record.title.slice(0, 30),
            department: record.dept,
            advtNo: 'ESB/MP/' + record.id,
            totalPosts: String(record.totalPosts),
            postDate: 'नवीनतम अपडेट',
            startDate: record.dates?.start || 'शीघ्र प्रारंभ',
            lastDate: record.dates?.end || 'विज्ञप्ति अनुसार',
            lastDateFee: record.dates?.end || 'विज्ञप्ति अनुसार',
            correctionDate: 'अंतिम तिथि के पश्चात',
            examDate: record.dates?.exam || 'शीघ्र घोषित',
            admitCardDate: 'परीक्षा से 10 दिन पूर्व',
            feeGeneral: record.fee?.gen || '₹500/-',
            feeReserved: record.fee?.reserved || '₹250/-',
            feePortal: '₹60/- (पोर्टल शुल्क)',
            paymentMode: 'Online Net Banking, Debit/Credit Card, UPI',
            minAge: '18 वर्ष',
            maxAge: '40 वर्ष',
            ageCalculationDate: '01/01/2026',
            ageRelaxation: 'मध्य प्रदेश शासन के नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट',
            state: record.state || 'MP',
            category: 'Other',
            qualificationSummary: record.eligibility,
            vacanciesBreakdown: [
              {
                postName: record.shortTitle || record.title,
                total: String(record.totalPosts),
                eligibility: record.eligibility
              }
            ],
            categoryWisePosts: [
              { category: 'सामान्य / आरक्षित', ur: '—', obc: '—', ews: '—', sc: '—', st: '—', total: String(record.totalPosts) }
            ],
            howToApplySteps: [
              'चरण 1: ऑफिशियल नोटिफिकेशन PDF डाउनलोड कर पात्रता एवं नियमों को ध्यानपूर्वक पढ़ें।',
              'चरण 2: ऑनलाइन फॉर्म घर बैठे सुरक्षित भरवाने के लिए आवश्यक दस्तावेज (आधार कार्ड, 10वीं/12वीं अंकसूची, जाति व निवास प्रमाण पत्र) तैयार रखें।',
              'चरण 3: Nitish Khobragade (8982324497) से व्हाट्सएप पर संपर्क कर घर बैठे सुरक्षित फॉर्म भरवाएं।',
              'चरण 4: फॉर्म का प्रीव्यू जांचें एवं आधिकारिक ऑनलाइन रसीद प्राप्त करें।'
            ],
            requiredDocuments: [
              'आधार कार्ड (मोबाइल नंबर लिंक)',
              '10वीं/12वीं अंकसूची',
              'जाति प्रमाण पत्र एवं मूल निवासी प्रमाण पत्र',
              'पासपोर्ट साइज फोटो एवं हस्ताक्षर'
            ],
            applyUrl: record.links?.apply || 'https://esb.mp.gov.in',
            notificationPdfUrl: record.links?.notificationPdf || 'https://esb.mp.gov.in',
            syllabusUrl: record.links?.syllabusPdf,
            officialWebsiteUrl: record.links?.officialSite || 'https://esb.mp.gov.in'
          };
          setDynamicJob(synthesized);
        }
      });
    }
  }, [slug, staticJob]);

  const job = staticJob || dynamicJob || getJobDetailBySlug('mp-police-constable-2026');

  const [copiedLink, setCopiedLink] = useState(false);

  const handleSharePage = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${job.title} - NP Job Portal`,
          text: `चेक करें: ${job.title} | कुल पद: ${job.totalPosts} | अंतिम तिथि: ${job.lastDate}. फॉर्म भरवाने हेतु Nitish Khobragade: ${OWNER_INFO.phone}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }
    } catch {
      // Ignored
    }
  };

  const whatsappInquiryUrl = `https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(
    `नमस्ते Nitish Ji,\nमैंने NP Job Portal पर *${job.title}* की जानकारी देखी है।\nकुल पद: ${job.totalPosts}\nअंतिम तिथि: ${job.lastDate}\nकृपया मेरा ऑनलाइन फॉर्म भरवाने में सहायता करें।`
  )}`;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans antialiased selection:bg-red-600 selection:text-white pb-20 sm:pb-12">
      {/* Top National Tricolor Header Accent */}
      <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600"></div>

      {/* Mini Brand Header for Job Detail */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-neutral-700 hover:text-red-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>मुख्य पृष्ठ (Home)</span>
            </Link>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-700 text-white flex flex-col items-center justify-center font-black text-xs leading-none">
                <span>NP</span>
              </div>
              <span className="font-extrabold text-base sm:text-lg text-neutral-900 tracking-tight">
                NP <span className="text-red-600">Job Portal</span>
              </span>
            </Link>
          </div>

          {/* Direct WhatsApp Callout for Nitish */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSharePage}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
              title="Share Vacancy"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'लिंक कॉपी हो गया!' : 'शेयर करें'}</span>
            </button>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>फॉर्म भरवाएं</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-3 overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:text-red-700 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" /> होम
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <Link href="/" className="hover:text-red-700">
            सरकारी भर्तियां (Latest Jobs)
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-neutral-900 font-semibold truncate max-w-xs sm:max-w-md">
            {job.shortTitle}
          </span>
        </nav>

        {/* 1. ADVERTISEMENT LEADERBOARD BANNER (ABOVE TABLE) */}
        <AdSenseBanner slotType="leaderboard" id="adsense-detail-top" />

        {/* 2. PROMINENT SERVICE BANNER (Owner: Nitish Khobragade) */}
        <div className="my-4 p-4 sm:p-5 rounded-xl bg-linear-to-r from-emerald-800 via-teal-900 to-slate-900 text-white shadow-md border-2 border-emerald-500/40">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                घर बैठे सुरक्षित फॉर्म भरवाएं • NP Job Portal
              </span>
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-amber-300 tracking-tight leading-snug">
                घर बैठे सुरक्षित फॉर्म भरवाएं: {OWNER_INFO.name} - {OWNER_INFO.phone}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
                कहीं भी लाइन में लगने की जरूरत नहीं! व्हाट्सएप पर अपने जरूरी दस्तावेज भेजें और 100% सही विवरण के साथ रसीद प्राप्त करें।
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-center">
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-slate-950" />
                <span>WhatsApp चैट</span>
              </a>
              <a
                href={`tel:${OWNER_INFO.phone}`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl border border-white/20 transition-colors"
              >
                <Phone className="w-4 h-4 text-amber-300" />
                <span>{OWNER_INFO.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* 3. OFFICIAL VACANCY NOTIFICATION CONTAINER */}
        <article className="bg-white border-2 border-red-700 rounded-xl shadow-md overflow-hidden my-5">
          {/* Main Top Header of the Vacancy */}
          <div className="bg-red-700 text-white p-4 sm:p-6 text-center border-b-2 border-red-800">
            <span className="inline-block bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider mb-2 shadow-xs">
              {job.state} Government Recruitment 2026
            </span>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
              {job.title}
            </h1>
            <p className="text-sm sm:text-base text-red-100 font-semibold mt-1">
              {job.department}
            </p>
            {job.advtNo && (
              <p className="text-xs text-amber-200 mt-1 font-mono">
                Advt No. : {job.advtNo} | Short Details of Notification
              </p>
            )}

            {/* Quick Action Badges */}
            <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
              <div className="bg-white text-red-700 font-black text-xs sm:text-sm px-3.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                <Users className="w-4 h-4 text-red-600" />
                <span>कुल पद: {job.totalPosts}</span>
              </div>
              <div className="bg-amber-400 text-slate-950 font-black text-xs sm:text-sm px-3.5 py-1 rounded-md shadow-xs flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>अंतिम तिथि: {job.lastDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Info Strip */}
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs sm:text-sm text-neutral-800 font-medium flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            <span><strong>पोस्ट दिनांक:</strong> {job.postDate}</span>
            <span><strong>राज्य / स्तर:</strong> {job.state}</span>
            <span><strong>श्रेणी:</strong> {job.category}</span>
          </div>

          {/* OFFICIAL 2-COLUMN TABLE: IMPORTANT DATES & APPLICATION FEE */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-neutral-200 border-b-2 border-neutral-200">
            {/* Left Column: Important Dates */}
            <div className="p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-black text-red-700 border-b-2 border-red-200 pb-2 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-600" />
                महत्वपूर्ण तिथियां (Important Dates)
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-600 font-medium">आवेदन प्रारंभ तिथि:</span>
                  <span className="font-bold text-neutral-900">{job.startDate}</span>
                </li>
                <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-600 font-medium">ऑनलाइन आवेदन की अंतिम तिथि:</span>
                  <span className="font-black text-red-600 bg-red-50 px-2 py-0.5 rounded">{job.lastDate}</span>
                </li>
                <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-600 font-medium">परीक्षा शुल्क भुगतान अंतिम तिथि:</span>
                  <span className="font-bold text-neutral-900">{job.lastDateFee}</span>
                </li>
                {job.correctionDate && (
                  <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                    <span className="text-neutral-600 font-medium">फॉर्म संशोधन (Correction) तिथि:</span>
                    <span className="font-bold text-amber-700">{job.correctionDate}</span>
                  </li>
                )}
                <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-600 font-medium">परीक्षा प्रारंभ तिथि (Exam Date):</span>
                  <span className="font-bold text-blue-700">{job.examDate || 'शीघ्र अधिसूचित होगी'}</span>
                </li>
                <li className="flex justify-between items-center py-1">
                  <span className="text-neutral-600 font-medium">प्रवेश पत्र (Admit Card):</span>
                  <span className="font-bold text-emerald-700">{job.admitCardDate || 'परीक्षा से पहले'}</span>
                </li>
              </ul>
            </div>

            {/* Right Column: Application Fee */}
            <div className="p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-black text-emerald-700 border-b-2 border-emerald-200 pb-2 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                आवेदन शुल्क (Application Fee)
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-600 font-medium">सामान्य / अन्य राज्य (General/Other):</span>
                  <span className="font-black text-neutral-900">{job.feeGeneral}</span>
                </li>
                <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                  <span className="text-neutral-600 font-medium">SC / ST / OBC / महिला:</span>
                  <span className="font-bold text-emerald-700">{job.feeReserved}</span>
                </li>
                {job.feePortal && (
                  <li className="flex justify-between items-center py-1 border-b border-neutral-100">
                    <span className="text-neutral-600 font-medium">पोर्टल शुल्क (Portal Fee):</span>
                    <span className="font-bold text-neutral-700">{job.feePortal}</span>
                  </li>
                )}
                <li className="py-2">
                  <span className="text-neutral-600 font-medium block mb-1">भुगतान का माध्यम (Payment Mode):</span>
                  <span className="text-xs text-neutral-700 bg-neutral-100 p-2 rounded-lg block font-medium">
                    {job.paymentMode}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* AGE LIMIT SECTION */}
          <div className="p-4 sm:p-5 bg-neutral-50 border-b-2 border-neutral-200">
            <h3 className="text-base sm:text-lg font-black text-blue-900 border-b border-blue-200 pb-2 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              आयु सीमा (Age Limit Criteria)
              {job.ageCalculationDate && (
                <span className="text-xs font-bold text-neutral-600 ml-auto">
                  (गणना तिथि: {job.ageCalculationDate})
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
                <div className="text-neutral-500 font-medium">न्यूनतम आयु (Minimum Age):</div>
                <div className="text-xl font-black text-neutral-900 mt-0.5">{job.minAge}</div>
              </div>
              <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-2xs">
                <div className="text-neutral-500 font-medium">अधिकतम आयु (Maximum Age):</div>
                <div className="text-xl font-black text-neutral-900 mt-0.5">{job.maxAge}</div>
              </div>
            </div>
            <p className="text-xs text-neutral-600 mt-3 italic">
              <strong>आयु में छूट (Age Relaxation):</strong> {job.ageRelaxation}
            </p>
          </div>

          {/* POST WISE VACANCY & ELIGIBILITY TABLE */}
          <div className="p-4 sm:p-5 border-b-2 border-neutral-200">
            <h3 className="text-base sm:text-lg font-black text-neutral-900 border-b-2 border-neutral-200 pb-2 mb-3 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-neutral-700" />
              पद का विवरण एवं शैक्षणिक योग्यता (Vacancy Details & Eligibility)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-neutral-800 text-white font-bold">
                    <th className="p-3 border border-neutral-700">पद का नाम (Post Name)</th>
                    <th className="p-3 border border-neutral-700 text-center">कुल पद (Total)</th>
                    <th className="p-3 border border-neutral-700">पात्रता / शैक्षणिक योग्यता (Eligibility Criteria)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {job.vacanciesBreakdown.map((item, index) => (
                    <tr key={index} className="hover:bg-neutral-50">
                      <td className="p-3 border border-neutral-200 font-bold text-neutral-900">
                        {item.postName}
                      </td>
                      <td className="p-3 border border-neutral-200 text-center font-black text-blue-700 whitespace-nowrap">
                        {item.total}
                      </td>
                      <td className="p-3 border border-neutral-200 text-neutral-700 leading-relaxed font-medium">
                        {item.eligibility}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Physical Standards Table (if applicable) */}
            {job.physicalStandards && job.physicalStandards.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm sm:text-base font-black text-neutral-900 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  शारीरिक दक्षता एवं मापदंड (Physical Eligibility Criteria)
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-neutral-200 text-neutral-800 font-bold">
                        <th className="p-2.5 border border-neutral-300">मापदंड (Parameter)</th>
                        <th className="p-2.5 border border-neutral-300">पुरुष अभ्यर्थी (Male)</th>
                        <th className="p-2.5 border border-neutral-300">महिला अभ्यर्थी (Female)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {job.physicalStandards.map((std, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50">
                          <td className="p-2.5 border border-neutral-200 font-bold text-neutral-800">{std.parameter}</td>
                          <td className="p-2.5 border border-neutral-200 text-neutral-700">{std.male}</td>
                          <td className="p-2.5 border border-neutral-200 text-neutral-700">{std.female}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* REQUIRED DOCUMENTS CHECKLIST */}
          <div className="p-4 sm:p-5 bg-emerald-50/50 border-b-2 border-neutral-200">
            <h3 className="text-base sm:text-lg font-black text-emerald-800 border-b border-emerald-200 pb-2 mb-3 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              आवेदन हेतु आवश्यक दस्तावेज (Required Documents Checklist)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-neutral-800">
              {job.requiredDocuments.map((doc, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-emerald-200 shadow-2xs font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HOW TO APPLY INSTRUCTIONS */}
          <div className="p-4 sm:p-5 border-b-2 border-neutral-200 bg-white">
            <h3 className="text-base sm:text-lg font-black text-neutral-900 border-b-2 border-neutral-200 pb-2 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-neutral-700" />
              ऑनलाइन फॉर्म कैसे भरें (How to Apply Step-by-Step Guidelines)
            </h3>
            <ol className="space-y-2 text-xs sm:text-sm text-neutral-700 font-medium">
              {job.howToApplySteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 4. IMPORTANT ACTION LINKS BOX */}
          <div className="p-4 sm:p-6 bg-linear-to-b from-amber-50 to-orange-50/60">
            <div className="text-center mb-4">
              <span className="bg-red-700 text-white font-black text-xs uppercase px-3 py-1 rounded-full shadow-xs">
                Direct Links Section
              </span>
              <h3 className="text-lg sm:text-xl font-black text-neutral-900 mt-1">
                महत्वपूर्ण उपयोगी लिंक (Important Action Links)
              </h3>
              <p className="text-xs text-neutral-600">
                ऑफिशियल पोर्टल पर जाएं अथवा व्हाट्सएप पर पोस्टर डाउनलोड कर शेयर करें
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border-2 border-red-700 bg-white shadow-md">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <tbody className="divide-y-2 divide-neutral-200">
                  {/* Apply Online Link */}
                  <tr className="hover:bg-red-50/40 transition-colors">
                    <td className="p-3.5 sm:p-4 font-black text-neutral-900 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4 text-red-700" />
                      <span>Apply Online (ऑनलाइन आवेदन करें)</span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
                      >
                        <span>Click Here (लिंक एक्टिव)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>

                  {/* Download Official Notification PDF */}
                  <tr className="hover:bg-red-50/40 transition-colors">
                    <td className="p-3.5 sm:p-4 font-black text-neutral-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-700" />
                      <span>Download Notification (विस्तृत नोटिफिकेशन PDF)</span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <a
                        href={job.notificationPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
                      >
                        <span>Download PDF</span>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>

                  {/* ACTION BUTTON: DOWNLOAD WHATSAPP POSTER */}
                  <tr className="bg-amber-100/70 hover:bg-amber-100 transition-colors">
                    <td className="p-3.5 sm:p-4 font-black text-amber-950 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-600 fill-amber-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base">Download WhatsApp Poster (1080×1350 HD)</span>
                          <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded">NEW</span>
                        </div>
                        <p className="text-xs font-normal text-amber-800 mt-0.5">
                          व्हाट्सएप स्टेटस, डीपी एवं छात्रों के ग्रुप में शेयर करने हेतु रेडीमेड पोस्टर
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('poster-studio-section');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-lg shadow-md transition-all active:scale-95"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>पोस्टर स्टूडियो खोलें</span>
                      </button>
                    </td>
                  </tr>

                  {/* Nitish Direct Form Bharwayein Link */}
                  <tr className="bg-emerald-50 hover:bg-emerald-100/80 transition-colors">
                    <td className="p-3.5 sm:p-4 font-black text-emerald-950 flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-emerald-700 fill-emerald-600" />
                      <div>
                        <span>घर बैठे फॉर्म भरवाएं (Nitish Khobragade)</span>
                        <p className="text-xs font-normal text-emerald-800 mt-0.5">
                          दुकान जाने की जरूरत नहीं, व्हाट्सएप पर भेजकर भरवाएं
                        </p>
                      </div>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                      <a
                        href={whatsappInquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-lg shadow-xs transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 fill-white" />
                        <span>WhatsApp चैट</span>
                      </a>
                    </td>
                  </tr>

                  {/* Official Website Link */}
                  <tr className="hover:bg-neutral-50 transition-colors">
                    <td className="p-3.5 sm:p-4 font-black text-neutral-800 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-neutral-600" />
                      <span>Official Website (आधिकारिक वेबसाइट)</span>
                    </td>
                    <td className="p-3.5 sm:p-4 text-right">
                      <a
                        href={job.officialWebsiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors"
                      >
                        <span>Official Portal</span>
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>

        {/* 5. ADVERTISEMENT IN-FEED PLACEMENT (BELOW IMPORTANT LINKS) */}
        <AdSenseBanner slotType="in-feed" id="adsense-detail-bottom" />

        {/* 6. WHATSAPP POSTER STUDIO COMPONENT SECTION */}
        <section id="poster-studio-section" className="mt-8 pt-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded">
                  OFFICIAL CREATOR TOOL
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-neutral-900">
                  {job.shortTitle} - पोस्टर स्टूडियो (1080×1350)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                नीचे दिए गए बटन से व्हाट्सएप स्टेटस, इंस्टाग्राम स्टोरी और फेसबुक ग्रुप्स के लिए आकर्षक पोस्टर 1-क्लिक में डाउनलोड करें।
              </p>
            </div>
          </div>

          <PosterStudio job={job} />
        </section>

        {/* Bottom Back Button & Share */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-neutral-200">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-700 hover:text-red-700"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>अन्य सभी सरकारी भर्तियां देखें (Home)</span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSharePage}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>{copiedLink ? 'लिंक कॉपी हो गया!' : 'दोस्तों के साथ शेयर करें'}</span>
            </button>
            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>फॉर्म भरवाने हेतु संपर्क</span>
            </a>
          </div>
        </div>

        {/* 7. CROSS-PROMOTIONAL INTERNAL LINKING WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <TrendingJobsWidget currentPostId={job.id} />
          <RelatedBlogsWidget />
        </div>
      </main>

      {/* Floating Bottom Bar on Mobile Screens */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-neutral-300 p-2.5 sm:hidden z-50 flex items-center justify-between gap-2 shadow-2xl">
        <a
          href={whatsappInquiryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-sm"
        >
          <MessageCircle className="w-4 h-4 fill-white" />
          <span>व्हाट्सएप फॉर्म</span>
        </a>

        <button
          onClick={() => {
            const el = document.getElementById('poster-studio-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>पोस्टर (PNG)</span>
        </button>

        <a
          href={`tel:${OWNER_INFO.phone}`}
          className="px-3.5 py-2.5 bg-neutral-800 text-white rounded-lg font-bold text-xs flex items-center justify-center"
          title="कॉल करें"
        >
          <Phone className="w-4 h-4" />
        </a>
      </div>

      {/* 5-6 Second Custom Pop-Up Ad Campaign Modal (Tied to Admin Settings) */}
      <PopupAdModal />

      <Footer />
    </div>
  );
}
