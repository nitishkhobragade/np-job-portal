import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  CreditCard,
  FileCheck2,
  Calendar,
  Users,
  MessageCircle,
  Clock,
  ChevronRight,
  Filter,
  Building2,
  Table as TableIcon,
  AlignLeft
} from 'lucide-react';
import { JobItem, AdmitCardItem, ResultItem } from '../types';
import { OWNER_INFO } from '../data/portalData';
import { getPostUrl } from '../lib/postRouting';

interface ThreeColumnLayoutProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  searchQuery: string;
  selectedCategory: string;
  currentLayout?: 'A' | 'B';
  onLayoutChange?: (layout: 'A' | 'B') => void;
  onSelectJob: (job: JobItem) => void;
  onSelectAdmitCard: (card: AdmitCardItem) => void;
  onSelectResult: (res: ResultItem) => void;
}

export const ThreeColumnLayout: React.FC<ThreeColumnLayoutProps> = ({
  jobs,
  admitCards,
  results,
  searchQuery,
  selectedCategory,
  currentLayout = 'A',
  onLayoutChange,
  onSelectJob,
  onSelectAdmitCard,
  onSelectResult,
}) => {
  // Filter jobs based on search and category
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.qualification.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'All Updates' ||
        selectedCategory === 'Latest Jobs' ||
        (selectedCategory === 'Tech Jobs' && (job.isTechJob || job.category === 'Tech/IT')) ||
        (selectedCategory === 'MP Special' && (job.state === 'MP' || job.department.includes('MP') || job.title.includes('MP'))) ||
        (selectedCategory === 'SSC/UPSC' && (job.category === 'SSC/UPSC' || job.title.includes('SSC') || job.title.includes('UPSC'))) ||
        (selectedCategory === 'Police' && (job.category === 'Police' || job.title.includes('Police'))) ||
        (selectedCategory === 'Railway' && (job.category === 'Railway' || job.title.includes('Railway'))) ||
        (selectedCategory === 'Banking' && (job.category === 'Banking' || job.title.includes('IBPS') || job.title.includes('Bank'))) ||
        (selectedCategory === 'Teaching' && (job.category === 'Teaching' || job.title.includes('TET') || job.title.includes('Teacher'))) ||
        (selectedCategory === 'Health' && (job.category === 'Health' || job.title.includes('AYUSH') || job.title.includes('Nursing')));

      return matchesSearch && matchesCategory;
    });
  }, [jobs, searchQuery, selectedCategory]);

  // Filter admit cards
  const filteredAdmitCards = useMemo(() => {
    return admitCards.filter((card) => {
      return (
        searchQuery.trim() === '' ||
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [admitCards, searchQuery]);

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter((res) => {
      return (
        searchQuery.trim() === '' ||
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [results, searchQuery]);

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-6 overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-neutral-200">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-6 bg-red-600 rounded-sm inline-block"></span>
            सरकारी भर्ती, प्रवेश पत्र एवं परीक्षा परिणाम
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Sarkari Result स्टाइल लाइव अपडेट्स • किसी भी भर्ती की सहायता के लिए Nitish Khobragade (8982324497) से संपर्क करें
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {(searchQuery || selectedCategory !== 'All Updates') && (
            <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-amber-700" />
              <span>फ़िल्टर: {selectedCategory} {searchQuery && `| "${searchQuery}"`}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg border border-slate-300">
            <button
              type="button"
              onClick={() => onLayoutChange?.('A')}
              className={`px-2.5 py-1 font-bold rounded-md transition-all flex items-center gap-1.5 ${
                currentLayout === 'A'
                  ? 'bg-red-700 text-white shadow-md'
                  : 'text-neutral-700 hover:text-neutral-900 border border-transparent'
              }`}
              title="Layout A (Sarkari Classic)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Layout A (Sarkari Classic)</span>
            </button>
            <button
              type="button"
              onClick={() => onLayoutChange?.('B')}
              className={`px-2.5 py-1 font-bold rounded-md transition-all flex items-center gap-1.5 ${
                currentLayout === 'B'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-neutral-700 hover:text-neutral-900 border border-transparent'
              }`}
              title="Layout B (FreeJobAlert Table)"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Layout B (FreeJobAlert)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Layout: Layout A (3-Column Sarkari Classic Grid) vs Layout B (FreeJobAlert Compact Table) */}
      {currentLayout === 'A' ? (
      /* 3-Column SarkariResult Layout */
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start w-full max-w-full overflow-hidden">
        
        {/* ================= COLUMN 1: LATEST JOBS ================= */}
        <div className="bg-white rounded-xl border-2 border-red-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Column Header */}
          <div className="bg-linear-to-r from-red-700 via-rose-700 to-red-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-300" />
              <h3 className="font-extrabold text-base sm:text-lg tracking-wide uppercase">
                Latest Jobs (नवीनतम नौकरियां)
              </h3>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
              {filteredJobs.length} एक्टिव
            </span>
          </div>

          {/* Column Body List */}
          <div className="divide-y divide-neutral-100 max-h-[640px] overflow-y-auto">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                कोई भर्ती नहीं मिली। कृपया सर्च फ़िल्टर रीसेट करें।
              </div>
            ) : (
              filteredJobs.map((job) => {
                const formBharwayeinUrl = `https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
                  job.title
                )}*%20%E0%A4%95%E0%A4%BE%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4%20Total%20Posts%3A%20${encodeURIComponent(
                  job.totalPosts
                )}%20Last%20Date%3A%20${encodeURIComponent(
                  job.lastDate
                )}`;

                return (
                  <div
                    key={job.id}
                    className="p-3.5 hover:bg-red-50/40 transition-colors group relative"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        {/* Title with click to view detail */}
                        <button
                          type="button"
                          onClick={() => onSelectJob(job)}
                          className="text-left font-bold text-sm text-neutral-900 group-hover:text-red-700 leading-snug transition-colors line-clamp-2"
                        >
                          {job.title}
                        </button>
                        
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[11px] text-neutral-500 line-clamp-1">
                            {job.department}
                          </p>
                          {job.companyName && (
                            <span className="bg-blue-600 text-white font-black text-[9px] px-1.5 py-0.2 rounded shrink-0">
                              {job.companyName}
                            </span>
                          )}
                        </div>
                      </div>

                      {job.isNew && (
                        <span className="shrink-0 text-[10px] font-black uppercase text-white bg-red-600 px-1.5 py-0.5 rounded shadow-2xs animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Badges: Total Posts, Published Date & Last Date */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded text-[11px] shrink-0">
                        <Users className="w-3 h-3 text-blue-600" />
                        {job.totalPosts}
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        प्रकाशित: {job.publishedDateFormatted || job.publishedDate || job.postDate || '22/09/2026'}
                      </span>

                      <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded text-[11px] shrink-0">
                        <Calendar className="w-3 h-3 text-rose-600" />
                        अंतिम तिथि: {job.lastDate}
                      </span>
                    </div>

                    {/* Fast WhatsApp Call-to-Action */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs flex-wrap gap-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectJob(job)}
                          className="text-neutral-600 hover:text-neutral-900 font-medium text-[11px] flex items-center gap-0.5"
                        >
                          क्विक व्यू
                        </button>
                        <span className="text-neutral-300">|</span>
                        <Link
                          href={getPostUrl(job)}
                          className="text-red-700 hover:text-red-800 font-bold text-[11px] flex items-center gap-0.5"
                        >
                          पेज व पोस्टर <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <a
                        href={formBharwayeinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition-colors"
                        title="Nitish Khobragade से ऑनलाइन फॉर्म भरवाएं"
                      >
                        <MessageCircle className="w-3 h-3 fill-emerald-600 text-white" />
                        घर बैठे फॉर्म भरवाएं
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of Column */}
          <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 text-center">
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-red-700 hover:text-red-800 inline-flex items-center gap-1"
            >
              सभी सरकारी नौकरियों की सूची हेतु WhatsApp करें <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ================= COLUMN 2: ADMIT CARD ================= */}
        <div className="bg-white rounded-xl border-2 border-blue-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Column Header */}
          <div className="bg-linear-to-r from-blue-700 via-indigo-700 to-blue-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-300" />
              <h3 className="font-extrabold text-base sm:text-lg tracking-wide uppercase">
                Admit Card (प्रवेश पत्र)
              </h3>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
              {filteredAdmitCards.length} लाइव
            </span>
          </div>

          {/* Column Body List */}
          <div className="divide-y divide-neutral-100 max-h-[640px] overflow-y-auto">
            {filteredAdmitCards.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                कोई एडमिट कार्ड नहीं मिला।
              </div>
            ) : (
              filteredAdmitCards.map((card) => {
                const printCardUrl = `https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
                  card.title
                )}*%20%E0%A4%95%E0%A4%BE%20%E0%A4%8F%E0%A4%A1%E0%A4%AE%E0%A4%BF%E0%A4%9F%20%E0%A4%95%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%A1%20%E0%A4%A1%E0%A4%BE%E0%A4%89%E0%A4%A8%E0%A4%B2%E0%A5%8B%E0%A4%A1%20%2F%20%E0%A4%AA%E0%A5%8D%E0%A4%B0%E0%A4%BF%E0%A4%82%E0%A4%9F%20%E0%A4%95%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4`;

                return (
                  <div
                    key={card.id}
                    className="p-3.5 hover:bg-blue-50/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => onSelectAdmitCard(card)}
                          className="text-left font-bold text-sm text-neutral-900 group-hover:text-blue-700 leading-snug transition-colors line-clamp-2"
                        >
                          {card.title}
                        </button>
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                          {card.department}
                        </p>
                      </div>

                      <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded">
                        {card.hallTicketStatus}
                      </span>
                    </div>

                    {/* Badges: Exam Date & Published Date Tag */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] shrink-0">
                        <Clock className="w-3 h-3 text-amber-700" />
                        {card.examDate}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 shrink-0">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        प्रकाशित: {card.publishedDate || card.releaseDate || '22/09/2026'}
                      </span>
                    </div>

                    {/* Download & Service CTA */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectAdmitCard(card)}
                        className="text-neutral-600 hover:text-neutral-900 font-medium text-[11px] flex items-center gap-1"
                      >
                        डाउनलोड लिंक <ChevronRight className="w-3 h-3" />
                      </button>

                      <a
                        href={printCardUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-300 px-2 py-0.5 rounded transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 fill-blue-600 text-white" />
                        प्रिंट आउट निकालें
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of Column */}
          <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 text-center">
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1"
            >
              एडमिट कार्ड लिंक न मिलने पर WhatsApp करें <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ================= COLUMN 3: RESULTS / ANSWER KEYS ================= */}
        <div className="bg-white rounded-xl border-2 border-emerald-200/90 shadow-sm overflow-hidden flex flex-col">
          {/* Column Header */}
          <div className="bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-amber-300" />
              <h3 className="font-extrabold text-base sm:text-lg tracking-wide uppercase">
                Results / Keys (परिणाम व उत्तर कुंजी)
              </h3>
            </div>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">
              {filteredResults.length} घोषित
            </span>
          </div>

          {/* Column Body List */}
          <div className="divide-y divide-neutral-100 max-h-[640px] overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs">
                कोई रिजल्ट नहीं मिला।
              </div>
            ) : (
              filteredResults.map((res) => {
                const checkResultUrl = `https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
                  res.title
                )}*%20%E0%A4%95%E0%A4%BE%20%E0%A4%B0%E0%A4%BF%E0%A4%9C%E0%A4%B2%E0%A5%8D%E0%A4%9F%20%2F%20%E0%A4%B8%E0%A5%8D%E0%A4%95%E0%A5%8B%E0%A4%B0%E0%A4%95%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%A1%20%E0%A4%9A%E0%A5%87%E0%A4%95%20%E0%A4%95%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4`;

                return (
                  <div
                    key={res.id}
                    className="p-3.5 hover:bg-emerald-50/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <button
                          type="button"
                          onClick={() => onSelectResult(res)}
                          className="text-left font-bold text-sm text-neutral-900 group-hover:text-emerald-700 leading-snug transition-colors line-clamp-2"
                        >
                          {res.title}
                        </button>
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                          {res.department}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          res.type === 'Result'
                            ? 'text-purple-800 bg-purple-50 border-purple-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {res.type}
                      </span>
                    </div>

                    {/* Declaration Date & Scorecard status */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] shrink-0">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        {res.declaredDate}
                      </span>

                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 shrink-0">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        प्रकाशित: {res.publishedDate || res.declaredDate || '22/09/2026'}
                      </span>

                      {res.scoreCardAvailable && (
                        <span className="text-[10px] font-semibold text-neutral-600 bg-neutral-100 px-1.5 py-0.5 rounded">
                          स्कोरकार्ड उपलब्ध
                        </span>
                      )}
                    </div>

                    {/* View Result & Service CTA */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectResult(res)}
                        className="text-neutral-600 hover:text-neutral-900 font-medium text-[11px] flex items-center gap-1"
                      >
                        परिणाम विवरण <ChevronRight className="w-3 h-3" />
                      </button>

                      <a
                        href={checkResultUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded transition-colors"
                      >
                        <MessageCircle className="w-3 h-3 fill-emerald-600 text-white" />
                        रिजल्ट चेक करवाएं
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer of Column */}
          <div className="p-2.5 bg-neutral-50 border-t border-neutral-100 text-center">
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
            >
              मेरिट लिस्ट व कट-ऑफ PDF प्राप्त करें <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
      ) : (
      /* ================================================================= */
      /* LAYOUT B: FREEJOBALERT HIGH-DENSITY COMPACT TABLE VIEW            */
      /* ================================================================= */
      <div className="w-full bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
        {/* Table Header Bar */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-emerald-400">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-emerald-300" />
            <h3 className="font-extrabold text-base tracking-wide uppercase">
              FreeJobAlert Style - Live Government Job Notification Table
            </h3>
          </div>
          <span className="text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full">
            कुल {filteredJobs.length} भर्तियां उपलब्ध
          </span>
        </div>

        {/* Responsive Table Container */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-black text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3 border-r border-slate-300 w-28 whitespace-nowrap">पोस्ट / प्रकाशित</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-44">बोर्ड / विभाग</th>
                <th className="py-2.5 px-3 border-r border-slate-300">परीक्षा / पद नाम (Post Title)</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-40 hidden md:table-cell">योग्यता</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-24 hidden sm:table-cell">कुल पद</th>
                <th className="py-2.5 px-3 border-r border-slate-300 w-28 whitespace-nowrap">अंतिम तिथि</th>
                <th className="py-2.5 px-3 text-center w-36">कार्रवाई (Action)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    कोई भर्ती नहीं मिली। कृपया सर्च फ़िल्टर रीसेट करें।
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  const formBharwayeinUrl = `https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
                    job.title
                  )}*%20%E0%A4%95%E0%A4%BE%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4%20Total%20Posts%3A%20${encodeURIComponent(
                    job.totalPosts
                  )}%20Last%20Date%3A%20${encodeURIComponent(job.lastDate)}`;

                  return (
                    <tr key={job.id} className="even:bg-slate-50/70 hover:bg-amber-50/60 transition-colors">
                      {/* Post Date */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{job.publishedDateFormatted || job.publishedDate || job.postDate || '22/09/2026'}</span>
                        </div>
                      </td>

                      {/* Board / Department */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-slate-800">
                        {job.companyName ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="text-blue-900">{job.companyName}</span>
                          </div>
                        ) : (
                          <span className="line-clamp-2">{job.department}</span>
                        )}
                      </td>

                      {/* Post Title */}
                      <td className="py-2.5 px-3 border-r border-slate-200">
                        <div className="flex items-start gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => onSelectJob(job)}
                            className="font-bold text-slate-900 hover:text-red-700 hover:underline text-left leading-tight"
                          >
                            {job.title}
                          </button>
                          {job.isNew && (
                            <span className="bg-red-600 text-white font-black text-[9px] px-1 py-0.2 rounded shrink-0 uppercase animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Qualification */}
                      <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 hidden md:table-cell">
                        <span className="line-clamp-2">{job.qualification}</span>
                      </td>

                      {/* Total Posts */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-blue-700 hidden sm:table-cell whitespace-nowrap">
                        {job.totalPosts}
                      </td>

                      {/* Last Date */}
                      <td className="py-2.5 px-3 border-r border-slate-200 font-bold text-rose-700 whitespace-nowrap">
                        {job.lastDate}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={getPostUrl(job)}
                            className="px-2 py-1 bg-red-700 hover:bg-red-800 text-white font-bold rounded text-[11px] shadow-2xs transition-colors"
                          >
                            Get Details
                          </Link>
                          <a
                            href={formBharwayeinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded transition-colors"
                            title="घर बैठे ऑनलाइन फॉर्म भरवाएं - Nitish Khobragade (8982324497)"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-white text-white" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FreeJobAlert Table Footer Help Bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>* किसी भी भर्ती की अंतिम तिथि से पूर्व आवेदन करें। अधिक जानकारी हेतु विज्ञप्ति (Notification PDF) डाउनलोड करें।</span>
          <a
            href={OWNER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 shrink-0"
          >
            फॉर्म भरवाने हेतु संपर्क करें: 8982324497 <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      )}
    </section>
  );
};
