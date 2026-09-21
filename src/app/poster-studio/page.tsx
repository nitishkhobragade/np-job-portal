"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  Share2,
  Smartphone,
  ShieldCheck,
  Flame
} from 'lucide-react';
import { Header } from '../../components/Header';
import { TopTicker } from '../../components/TopTicker';
import { Footer } from '../../components/Footer';
import { PosterStudio } from '../../components/PosterStudio';
import { PostRecord } from '../../types';
import { getJobs } from '../../lib/firebase';

export default function PosterStudioPage() {
  const [jobs, setJobs] = useState<PostRecord[]>([]);
  const [selectedJob, setSelectedJob] = useState<PostRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const allJobs = await getJobs();
        setJobs(allJobs);
        if (allJobs.length > 0) {
          setSelectedJob(allJobs[0]);
        }
      } catch (err) {
        console.error('Failed to load jobs for poster studio:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      job.title.toLowerCase().includes(q) ||
      (job.shortTitle && job.shortTitle.toLowerCase().includes(q)) ||
      job.dept.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col selection:bg-amber-400 selection:text-slate-950 font-sans">
      <TopTicker />
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-neutral-300">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-600">
            <Link href="/" className="hover:text-red-700 font-bold flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              <span>होम पेज</span>
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-black">पोस्टर स्टूडियो (1080×1920 & 1080×1350 HD)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-slate-950 text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Creator Tool</span>
            </span>
          </div>
        </div>

        {/* Hero Title Strip */}
        <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-800 text-white rounded-2xl p-6 sm:p-8 mb-6 shadow-xl border-b-4 border-amber-400">
          <div className="max-w-3xl">
            <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider">
              HD Poster Generator
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2 leading-tight">
              व्हाट्सएप स्टेटस एवं सोशल मीडिया पोस्टर स्टूडियो
            </h1>
            <p className="text-amber-100 text-sm sm:text-base mt-2 leading-relaxed">
              किसी भी सरकारी भर्ती का 1080×1920 (9:16 Story) अथवा 1080×1350 (4:3 Feed) रेडीमेड अल्ट्रा-HD पोस्टर 1-क्लिक में डाउनलोड करें। 
              छात्रों के ग्रुप में शेयर करने एवं व्हाट्सएप स्टेटस लगाने हेतु सर्वोत्तम टूल।
            </p>
          </div>
        </div>

        {/* Job Selector Bar */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600" />
              <h2 className="text-base font-black text-neutral-900">
                भर्ती चुनें (Select Job for Poster):
              </h2>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="भर्ती या विभाग का नाम खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-600 font-medium"
              />
            </div>
          </div>

          {/* Quick Horizontal Scroll Pills */}
          <div className="flex items-center gap-2 overflow-x-auto py-3 mt-2 scrollbar-thin">
            {filteredJobs.slice(0, 10).map((job) => {
              const isSelected = selectedJob?.id === job.id;
              return (
                <button
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-red-700 text-white border-red-800 shadow-sm'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-200'
                  }`}
                >
                  <span>{job.shortTitle || job.title.slice(0, 24)}</span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Poster Studio Render Section */}
        {loading ? (
          <div className="bg-slate-900 text-white p-12 rounded-2xl flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-300">पोस्टर स्टूडियो लोड हो रहा है...</p>
          </div>
        ) : selectedJob ? (
          <div className="space-y-6">
            <PosterStudio job={selectedJob} />

            {/* Quick Share Instructions & Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-neutral-900">व्हाट्सएप स्टेटस (9:16)</h4>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    9:16 रेशियो चुनें और डाउनलोड कर सीधे अपने व्हाट्सएप स्टेटस एवं इंस्टाग्राम स्टोरी पर शेयर करें।
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-neutral-900">छात्र ग्रुप्स एवं फेसबुक (4:3)</h4>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    4:3 अथवा 1:1 स्क्वायर फीड रेशियो में पूरी जानकारी स्पष्ट दिखाई देती है बिना किसी क्रॉपिंग के।
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-neutral-900">ओरिजिनल अधिकृत मुहर</h4>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    प्रत्येक पोस्टर पर NP Job Portal का एंटी-कॉपी वाटरमार्क एवं संचालक संपर्क नंबर अंतर्निहित है।
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl text-center border border-neutral-200">
            <p className="text-neutral-600 font-bold">कोई भर्ती उपलब्ध नहीं है।</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
