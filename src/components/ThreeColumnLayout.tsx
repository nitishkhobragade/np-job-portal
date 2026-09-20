import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  CreditCard,
  FileCheck2,
  Calendar,
  Users,
  ExternalLink,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { JobItem, AdmitCardItem, ResultItem } from '../types';
import { OWNER_INFO } from '../data/portalData';

interface ThreeColumnLayoutProps {
  jobs: JobItem[];
  admitCards: AdmitCardItem[];
  results: ResultItem[];
  searchQuery: string;
  selectedCategory: string;
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
        (selectedCategory === 'MP Special' && job.state === 'MP') ||
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
    <section className="w-full max-w-7xl mx-auto px-4 my-6">
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

        {(searchQuery || selectedCategory !== 'All Updates') && (
          <div className="flex items-center gap-2 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-amber-700" />
            <span>फ़िल्टर सक्रिय: {selectedCategory} {searchQuery && `| "${searchQuery}"`}</span>
          </div>
        )}
      </div>

      {/* 3-Column SarkariResult Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        
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
                        
                        <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                          {job.department}
                        </p>
                      </div>

                      {job.isNew && (
                        <span className="shrink-0 text-[10px] font-black uppercase text-white bg-red-600 px-1.5 py-0.5 rounded shadow-2xs animate-pulse">
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Badges: Total Posts & Last Date */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded text-[11px]">
                        <Users className="w-3 h-3 text-blue-600" />
                        {job.totalPosts}
                      </span>

                      <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded text-[11px]">
                        <Calendar className="w-3 h-3 text-rose-600" />
                        अंतिम तिथि: {job.lastDate}
                      </span>
                    </div>

                    {/* Fast WhatsApp Call-to-Action */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => onSelectJob(job)}
                        className="text-neutral-600 hover:text-neutral-900 font-medium text-[11px] flex items-center gap-1"
                      >
                        पात्रता विवरण <ChevronRight className="w-3 h-3" />
                      </button>

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

                    {/* Badges: Exam Date Tag */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                        <Clock className="w-3 h-3 text-amber-700" />
                        {card.examDate}
                      </span>

                      <span className="inline-flex items-center text-[11px] text-neutral-500">
                        {card.releaseDate}
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
                    <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                        <Calendar className="w-3 h-3 text-emerald-600" />
                        {res.declaredDate}
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
    </section>
  );
};
