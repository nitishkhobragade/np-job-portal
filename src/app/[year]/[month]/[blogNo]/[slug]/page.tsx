"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Calendar,
  CreditCard,
  GraduationCap,
  Users,
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
  Home,
  Check
} from 'lucide-react';
import { getJobDetailBySlug } from '../../../../../data/jobDetailsData';
import { OWNER_INFO } from '../../../../../data/portalData';
import { AdSenseBanner } from '../../../../../components/AdSenseBanner';
import { PosterStudio } from '../../../../../components/PosterStudio';
import { Footer } from '../../../../../components/Footer';
import { PopupAdModal } from '../../../../../components/PopupAdModal';
import { getJobBySlug, getPostByParams } from '../../../../../lib/firebase';
import { JobPostDetail } from '../../../../../types';
import { formatDateToDDMMYYYY } from '../../../../../lib/postRouting';

interface DynamicJobPageProps {
  params: Promise<{
    year: string;
    month: string;
    blogNo: string;
    slug: string;
  }>;
}

export default function UniversalJobDetailPage({ params }: DynamicJobPageProps) {
  const resolvedParams = use(params);
  const { year, month, blogNo, slug } = resolvedParams;

  const staticJob = getJobDetailBySlug(slug);
  const [dynamicJob, setDynamicJob] = useState<JobPostDetail | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showPosterStudio, setShowPosterStudio] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchPost = async () => {
      // 1. First try lookup by full URL parameters (year, month, blogNo, slug)
      let record = await getPostByParams(year, month, blogNo, slug);
      // 2. Fallback to lookup by slug
      if (!record) {
        record = await getJobBySlug(slug);
      }

      if (isMounted && record) {
        const synthesized: JobPostDetail = {
          slug: record.slug || record.id,
          id: record.id,
          year: record.year || year,
          month: record.month || month,
          blogNo: record.blogNo || blogNo,
          title: record.title,
          shortTitle: record.shortTitle || record.title.slice(0, 30),
          department: record.dept,
          advtNo: record.advtNo || `ADV/${year}/${blogNo}`,
          totalPosts: String(record.totalPosts || 'विज्ञप्ति अनुसार'),
          postDate: record.publishedDate || formatDateToDDMMYYYY(record.dates?.start || record.updatedAt),
          publishedDateFormatted: record.publishedDateFormatted,
          importantLinks: record.importantLinks || [],
          startDate: formatDateToDDMMYYYY(record.dates?.start),
          lastDate: formatDateToDDMMYYYY(record.dates?.end),
          lastDateFee: formatDateToDDMMYYYY(record.dates?.end),
          correctionDate: 'अंतिम तिथि के पश्चात',
          examDate: formatDateToDDMMYYYY(record.dates?.exam) || 'शीघ्र घोषित',
          admitCardDate: 'परीक्षा से 7 दिन पूर्व',
          feeGeneral: record.feeGeneral || record.fee?.gen || '₹500/-',
          feeReserved: record.feeReserved || record.fee?.reserved || '₹250/-',
          feeOBC: record.feeOBC,
          feeSCST: record.feeSCST,
          feeEWS: record.feeEWS,
          showEWS: record.showEWS,
          feePortal: record.feePortal || '₹60/- (पोर्टल शुल्क)',
          paymentMode: record.paymentMode || 'Online Net Banking, Debit/Credit Card, UPI',
          minAge: record.minAge || '18 वर्ष',
          maxAge: record.maxAge || '40 वर्ष',
          ageCalculationDate: `01/01/${year}`,
          ageRelaxation: record.ageRelaxation || 'नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट',
          state: record.state || 'MP',
          category: 'Other',
          qualificationSummary: record.qualification || record.eligibility || 'विस्तृत पात्रता हेतु नोटिफिकेशन देखें',
          vacanciesBreakdown: record.vacanciesBreakdown || [
            {
              postName: record.shortTitle || record.title,
              total: String(record.totalPosts || 'विज्ञप्ति अनुसार'),
              eligibility: record.qualification || record.eligibility || 'विज्ञप्ति अनुसार'
            }
          ],
          categoryWisePosts: [
            { category: 'सामान्य / आरक्षित', ur: '—', obc: '—', ews: '—', sc: '—', st: '—', total: String(record.totalPosts || 'विज्ञप्ति अनुसार') }
          ],
          howToApplySteps: record.howToApplySteps || [
            'चरण 1: ऑफिशियल नोटिफिकेशन PDF डाउनलोड कर पात्रता एवं नियमों को ध्यानपूर्वक पढ़ें।',
            'चरण 2: ऑनलाइन फॉर्म घर बैठे सुरक्षित भरवाने के लिए आवश्यक दस्तावेज (आधार कार्ड, 10वीं/12वीं अंकसूची, जाति व निवास प्रमाण पत्र) तैयार रखें।',
            'चरण 3: Nitish Khobragade (8982324497) से व्हाट्सएप पर संपर्क कर घर बैठे सुरक्षित फॉर्म भरवाएं।',
            'चरण 4: फॉर्म का प्रीव्यू जांचें एवं आधिकारिक ऑनलाइन रसीद प्राप्त करें।'
          ],
          requiredDocuments: record.requiredDocuments || [
            'आधार कार्ड (मोबाइल नंबर लिंक)',
            '10वीं/12वीं अंकसूची',
            'जाति प्रमाण पत्र एवं मूल निवासी प्रमाण पत्र',
            'पासपोर्ट साइज फोटो एवं हस्ताक्षर'
          ],
          applyUrl: record.links?.apply || 'https://esb.mp.gov.in',
          notificationPdfUrl: record.links?.notificationPdf || 'https://esb.mp.gov.in',
          syllabusUrl: record.links?.syllabusPdf,
          officialWebsiteUrl: record.links?.officialSite || 'https://esb.mp.gov.in',
          serviceTagline: `घर बैठे सुरक्षित फॉर्म भरवाएं • ${OWNER_INFO.name} (${OWNER_INFO.phone})`,
          customPosterUrl: record.customPosterUrl,
          useCustomPoster: record.useCustomPoster
        };
        setDynamicJob(synthesized);
      }
    };

    fetchPost().catch((err) => console.warn('Error resolving post:', err));

    return () => {
      isMounted = false;
    };
  }, [slug, staticJob, year, month, blogNo]);

  const rawJob = dynamicJob || staticJob || getJobDetailBySlug(slug || 'mp-police-constable-2026');
  const job: JobPostDetail = {
    ...rawJob,
    year: rawJob.year || year,
    month: rawJob.month || month,
    blogNo: rawJob.blogNo || blogNo,
    slug: rawJob.slug || slug,
    startDate: formatDateToDDMMYYYY(rawJob.startDate),
    lastDate: formatDateToDDMMYYYY(rawJob.lastDate),
    lastDateFee: formatDateToDDMMYYYY(rawJob.lastDateFee || rawJob.lastDate),
    examDate: formatDateToDDMMYYYY(rawJob.examDate),
  };

  const handleSharePage = async () => {
    try {
      if (typeof window !== 'undefined') {
        const canonicalUrl = window.location.href;
        if (navigator.share) {
          await navigator.share({
            title: `${job.title} - NP Job Portal`,
            text: `चेक करें: ${job.title} | कुल पद: ${job.totalPosts} | अंतिम तिथि: ${job.lastDate}. फॉर्म भरवाने हेतु Nitish Khobragade: ${OWNER_INFO.phone}`,
            url: canonicalUrl,
          });
        } else {
          await navigator.clipboard.writeText(canonicalUrl);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 3000);
        }
      }
    } catch {
      // Ignore share errors
    }
  };

  const whatsappInquiryUrl = `https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(
    `नमस्ते Nitish Ji,\nमैंने NP Job Portal पर *${job.title}* (#${job.blogNo}) की जानकारी देखी है।\nकुल पद: ${job.totalPosts}\nअंतिम तिथि: ${job.lastDate}\nकृपया मेरा ऑनलाइन फॉर्म भरवाने में सहायता करें।`
  )}`;

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 flex flex-col font-sans antialiased selection:bg-red-600 selection:text-white pb-20 sm:pb-12">
      {/* Top National Accent */}
      <div className="h-1.5 w-full bg-linear-to-r from-orange-500 via-white to-emerald-600" />

      {/* Header Bar */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-neutral-700 hover:text-red-700 bg-neutral-100 hover:bg-neutral-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>मुख्य पृष्ठ</span>
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleSharePage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors cursor-pointer"
              title="Share Vacancy"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'लिंक कॉपी हो गया!' : 'शेयर करें'}</span>
            </button>

            <a
              href={whatsappInquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">घर बैठे फॉर्म भरवाएं</span>
              <span className="sm:hidden">फॉर्म भरवाएं</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 w-full flex-1">
        {/* Breadcrumb with universal [year]/[month]/[blogNo]/[slug] tracking */}
        <nav className="flex items-center flex-wrap gap-1.5 text-xs font-medium text-neutral-500 mb-6 bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
          <Link href="/" className="flex items-center gap-1 text-red-600 hover:underline font-bold">
            <Home className="w-3.5 h-3.5" />
            <span>होम</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-neutral-700 font-semibold">{job.year}</span>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-neutral-700 font-semibold">{job.month}</span>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[11px] font-mono font-black">
            #{job.blogNo}
          </span>
          <ChevronRight className="w-3 h-3 text-neutral-400" />
          <span className="text-neutral-900 font-bold truncate max-w-xs sm:max-w-md">
            {job.shortTitle}
          </span>
        </nav>

        {/* Top AdSense Banner */}
        <div className="mb-6">
          <AdSenseBanner slot="job-detail-top-slot" format="horizontal" />
        </div>

        {/* Job Header Hero Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-red-50 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-black rounded-md">
              {job.state === 'MP' ? '★ MP SPECIAL भर्ती' : '★ ALL INDIA VACANCY'}
            </span>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-xs font-black rounded-md font-mono">
              IDENTIFIER: {job.year}/{job.month}/{job.blogNo}
            </span>
            <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-md">
              विज्ञापन संख्या: {job.advtNo || 'विज्ञप्ति अनुसार'}
            </span>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>सत्यापित भर्ती</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-950 leading-tight mb-2 tracking-tight">
            {job.title}
          </h1>

          <p className="text-sm sm:text-base font-semibold text-neutral-600 mb-6 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-red-600 shrink-0" />
            <span>विभाग: {job.department}</span>
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200/80 mb-6">
            <div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">कुल पद (Total Posts)</div>
              <div className="text-lg sm:text-xl font-black text-red-700 mt-0.5">{job.totalPosts}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">आवेदन प्रारंभ (Start Date)</div>
              <div className="text-base sm:text-lg font-black text-neutral-900 mt-0.5 font-mono">{job.startDate}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">अंतिम तिथि (Last Date)</div>
              <div className="text-base sm:text-lg font-black text-red-600 mt-0.5 font-mono">{job.lastDate}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">परीक्षा तिथि (Exam Date)</div>
              <div className="text-base sm:text-lg font-black text-neutral-900 mt-0.5 font-mono">{job.examDate}</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-neutral-100">
            <a
              href={job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-800 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all text-sm active:scale-98"
            >
              <span>ऑफिशियल ऑनलाइन आवेदन करें</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={job.notificationPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-neutral-800 hover:bg-neutral-900 text-white font-bold rounded-xl shadow-xs transition-all text-sm active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>ऑफिशियल नोटिफिकेशन PDF</span>
            </a>

            <button
              onClick={() => setShowPosterStudio(!showPosterStudio)}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-xs transition-all text-sm active:scale-98 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{showPosterStudio ? 'पोस्टर स्टूडियो बंद करें' : 'WhatsApp पोस्टर बनाएं (HD)'}</span>
            </button>
          </div>
        </div>

        {/* Poster Studio Drawer/Container if Toggled */}
        {showPosterStudio && (
          <div className="mb-8 scroll-mt-20">
            <PosterStudio job={job} onClose={() => setShowPosterStudio(false)} />
          </div>
        )}

        {/* Nitish Khobragade Service Card */}
        <div className="bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-6 sm:p-7 text-white shadow-lg mb-8 border border-emerald-700/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>घर बैठे 100% सुरक्षित फॉर्म सुविधा</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                गलती से बचें! घर बैठे सुरक्षित ऑनलाइन फॉर्म भरवाएं
              </h2>
              <p className="text-sm text-emerald-100 max-w-2xl leading-relaxed">
                दस्तावेजों में त्रुटि से फॉर्म निरस्त हो सकता है। अपने दस्तावेज व्हाट्सएप पर भेजें और अधिकृत कंप्यूटर रसीद प्राप्त करें।
              </p>
              <div className="flex items-center gap-2 pt-1 font-bold text-amber-300 text-sm">
                <span>NP Job Portal • Nitish Khobragade (8982324497)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <a
                href={whatsappInquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm shadow-lg transition-all active:scale-95"
              >
                <MessageCircle className="w-5 h-5 fill-slate-950" />
                <span>व्हाट्सएप पर दस्तावेज भेजें</span>
              </a>
              <a
                href={`tel:${OWNER_INFO.phone}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-950/60 hover:bg-emerald-950 text-white font-bold rounded-xl text-sm border border-emerald-500/40 transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>कॉल करें: 8982324497</span>
              </a>
            </div>
          </div>
        </div>

        {/* Detailed 2-Column Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {/* Left Column (2 Cols Wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Important Dates Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
              <h3 className="text-lg font-black text-neutral-900 mb-4 flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Calendar className="w-5 h-5 text-red-600" />
                <span>महत्वपूर्ण तिथियां (Important Dates)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-600 font-medium">आवेदन प्रारंभ तिथि:</span>
                  <span className="font-bold text-neutral-900 font-mono">{job.startDate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50/60 rounded-lg border border-red-100">
                  <span className="text-red-900 font-medium">ऑनलाइन आवेदन की अंतिम तिथि:</span>
                  <span className="font-black text-red-700 font-mono">{job.lastDate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-600 font-medium">परीक्षा शुल्क भुगतान अंतिम तिथि:</span>
                  <span className="font-bold text-neutral-900 font-mono">{job.lastDateFee}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-600 font-medium">संशोधन (Correction) अंतिम तिथि:</span>
                  <span className="font-bold text-neutral-900 font-mono">{job.correctionDate || 'विज्ञप्ति अनुसार'}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-600 font-medium">परीक्षा तिथि (Exam Date):</span>
                  <span className="font-bold text-neutral-900 font-mono">{job.examDate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-neutral-600 font-medium">प्रवेश पत्र (Admit Card):</span>
                  <span className="font-bold text-neutral-900">{job.admitCardDate || 'परीक्षा से 7 दिन पूर्व'}</span>
                </div>
              </div>
            </div>

            {/* 2. Application Fee Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 mb-4">
                <h3 className="text-lg font-black text-neutral-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <span>आवेदन शुल्क (Application Fee Structure)</span>
                </h3>
                {job.showEWS && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                    EWS आरक्षण मान्य
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                {/* General / UR */}
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
                  <div className="text-[11px] text-neutral-500 font-bold uppercase">सामान्य (General / UR)</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-900 mt-0.5">{job.feeGeneral}</div>
                </div>

                {/* OBC */}
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
                  <div className="text-[11px] text-blue-700 font-bold uppercase">अन्य पिछड़ा वर्ग (OBC)</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-900 mt-0.5">
                    {job.feeOBC || job.feeReserved}
                  </div>
                </div>

                {/* SC / ST */}
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80">
                  <div className="text-[11px] text-red-700 font-bold uppercase">अ.जा. / अ.ज.जा. (SC / ST)</div>
                  <div className="text-lg sm:text-xl font-black text-neutral-900 mt-0.5">
                    {job.feeSCST || job.feeReserved}
                  </div>
                </div>

                {/* EWS */}
                <div className={`p-3 rounded-lg border ${
                  job.showEWS !== false
                    ? 'bg-emerald-50/70 border-emerald-200'
                    : 'bg-neutral-50 border-neutral-200/80'
                }`}>
                  <div className="text-[11px] text-emerald-800 font-bold uppercase flex items-center justify-between">
                    <span>आर्थिक कमजोर (EWS)</span>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-neutral-900 mt-0.5">
                    {job.showEWS !== false
                      ? (job.feeEWS || job.feeGeneral)
                      : 'लागू नहीं / N/A'}
                  </div>
                </div>
              </div>

              {job.feePortal && (
                <div className="mb-3 px-3 py-1.5 bg-neutral-100/80 rounded-md text-xs text-neutral-600 flex items-center justify-between font-medium">
                  <span>पोर्टल / सेवा प्रभार (Portal Fee):</span>
                  <span className="font-bold text-neutral-900 font-mono">{job.feePortal}</span>
                </div>
              )}

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 font-medium">
                <strong>भुगतान का माध्यम:</strong> {job.paymentMode}. नेट बैंकिंग, डेबिट/क्रेडिट कार्ड या UPI से ऑनलाइन शुल्क जमा किया जा सकता है।
              </div>
            </div>

            {/* 3. Vacancy Details & Eligibility */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
              <h3 className="text-lg font-black text-neutral-900 mb-4 flex items-center gap-2 pb-2 border-b border-neutral-100">
                <Users className="w-5 h-5 text-red-600" />
                <span>पदों का विवरण एवं शैक्षणिक योग्यता (Vacancy & Eligibility)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200 text-xs uppercase">
                      <th className="py-2.5 px-3">पद का नाम (Post Name)</th>
                      <th className="py-2.5 px-3">कुल पद</th>
                      <th className="py-2.5 px-3">पात्रता / शैक्षणिक योग्यता</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {job.vacanciesBreakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50">
                        <td className="py-3 px-3 font-bold text-neutral-900">{item.postName}</td>
                        <td className="py-3 px-3 font-black text-red-700">{item.total}</td>
                        <td className="py-3 px-3 text-neutral-600 text-xs leading-relaxed">{item.eligibility}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Age Limit Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 sm:p-6 shadow-xs">
              <h3 className="text-lg font-black text-neutral-900 mb-4 flex items-center gap-2 pb-2 border-b border-neutral-100">
                <GraduationCap className="w-5 h-5 text-red-600" />
                <span>आयु सीमा (Age Limit)</span>
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-xs text-neutral-500 font-semibold block">न्यूनतम आयु (Min Age)</span>
                  <span className="text-base font-black text-neutral-900">{job.minAge}</span>
                </div>
                <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <span className="text-xs text-neutral-500 font-semibold block">अधिकतम आयु (Max Age)</span>
                  <span className="text-base font-black text-neutral-900">{job.maxAge}</span>
                </div>
              </div>
              <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100 leading-relaxed">
                <strong>आयु में छूट:</strong> {job.ageRelaxation}
              </p>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-6">
            {/* Required Documents Checklist */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs">
              <h3 className="text-base font-black text-neutral-900 mb-3 flex items-center gap-2 pb-2 border-b border-neutral-100">
                <FileCheck2 className="w-4 h-4 text-red-600" />
                <span>आवश्यक दस्तावेज (Checklist)</span>
              </h3>
              <ul className="space-y-2 text-xs text-neutral-700">
                {job.requiredDocuments.map((docItem, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{docItem}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Official Useful Links Box */}
            <div className="bg-white rounded-xl border-2 border-red-200 p-5 shadow-xs">
              <h3 className="text-base font-black text-neutral-900 mb-3 flex items-center gap-2 pb-2 border-b border-neutral-100">
                <ExternalLink className="w-4 h-4 text-red-600" />
                <span>महत्वपूर्ण लिंक्स (Official Links)</span>
              </h3>
              <div className="space-y-2.5 text-xs font-bold">
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-red-50 hover:bg-red-100 text-red-900 rounded-lg border border-red-200 transition-colors"
                >
                  <span>ऑफिशियल ऑनलाइन आवेदन लिंक</span>
                  <ExternalLink className="w-3.5 h-3.5 text-red-700" />
                </a>
                <a
                  href={job.notificationPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 rounded-lg border border-neutral-200 transition-colors"
                >
                  <span>ऑफिशियल नोटिफिकेशन PDF</span>
                  <Download className="w-3.5 h-3.5 text-neutral-700" />
                </a>
                {job.syllabusUrl && (
                  <a
                    href={job.syllabusUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 rounded-lg border border-neutral-200 transition-colors"
                  >
                    <span>विस्तृत पाठ्यक्रम (Syllabus PDF)</span>
                    <Download className="w-3.5 h-3.5 text-neutral-700" />
                  </a>
                )}
                <a
                  href={job.officialWebsiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-900 rounded-lg border border-neutral-200 transition-colors"
                >
                  <span>आधिकारिक वेबसाइट (Official Website)</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-700" />
                </a>

                {/* Dynamic Extra Important Hyperlinks */}
                {job.importantLinks && job.importantLinks.length > 0 && (
                  <div className="pt-2 border-t border-neutral-100 space-y-2">
                    <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide">
                      अन्य महत्वपूर्ण लिंक्स:
                    </p>
                    {job.importantLinks.map((linkItem) => (
                      <a
                        key={linkItem.id}
                        href={linkItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg border border-blue-200 transition-colors"
                      >
                        <span className="truncate pr-2">{linkItem.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Direct Contact Card */}
            <div className="bg-amber-50 rounded-xl border border-amber-300/80 p-5 text-amber-950">
              <h4 className="font-black text-sm mb-1.5 flex items-center gap-1.5 text-amber-900">
                <Phone className="w-4 h-4 text-amber-700" />
                <span>घर बैठे फॉर्म सेवा हेल्पलाइन</span>
              </h4>
              <p className="text-xs text-amber-800 leading-relaxed mb-3">
                फॉर्म भरने में कोई समस्या आ रही हो या फोटो/हस्ताक्षर साइज सेट करना हो तो संपर्क करें।
              </p>
              <div className="font-bold text-xs text-amber-950 space-y-1">
                <div>ऑपरेटर: {OWNER_INFO.name}</div>
                <div>कॉल / व्हाट्सएप: {OWNER_INFO.phone}</div>
                <div>समय: सुबह 09:00 से रात्रि 10:00 बजे तक</div>
              </div>
            </div>

            {/* Sidebar AdSense Banner */}
            <AdSenseBanner slot="job-detail-sidebar-slot" format="vertical" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Pop-up Ad Service Modal */}
      <PopupAdModal />
    </div>
  );
}
