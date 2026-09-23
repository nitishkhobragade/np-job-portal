import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight, Calendar, Users, PhoneCall, Sparkles } from 'lucide-react';
import { PostRecord } from '../types';
import { subscribeToPosts } from '../lib/firebase';
import { OWNER_INFO } from '../data/portalData';

interface TrendingJobsWidgetProps {
  currentPostId?: string;
  limit?: number;
  className?: string;
}

export const TrendingJobsWidget: React.FC<TrendingJobsWidgetProps> = ({
  currentPostId,
  limit = 4,
  className = ''
}) => {
  const [jobs, setJobs] = useState<PostRecord[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((allPosts) => {
      const filtered = allPosts
        .filter((p) => p.status === 'published' && p.id !== currentPostId)
        .slice(0, limit);
      setJobs(filtered);
    }, 'published');

    return () => unsubscribe();
  }, [currentPostId, limit]);

  if (jobs.length === 0) return null;

  return (
    <aside className={`bg-white rounded-xl border-2 border-red-500 shadow-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-400 text-neutral-950 font-black">
            <Flame className="w-4 h-4 fill-current" />
          </span>
          <h3 className="font-extrabold text-sm sm:text-base tracking-wide">
            🔥 नवीनतम ट्रेंडिंग भर्तियां (Trending Jobs)
          </h3>
        </div>
        <span className="text-[11px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
          LIVE
        </span>
      </div>

      {/* Jobs List */}
      <div className="divide-y divide-slate-100 p-2 sm:p-3">
        {jobs.map((job) => {
          const targetUrl = job.detailsUrl || `/jobs/${job.slug || job.id}`;
          return (
            <div
              key={job.id}
              className="py-3 px-2 hover:bg-amber-50/60 rounded-lg transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={targetUrl}
                  className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug"
                >
                  {job.title}
                </Link>
              </div>

              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                {job.totalPosts && (
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                    <Users className="w-3 h-3 text-red-600" />
                    {job.totalPosts}
                  </span>
                )}
                {job.lastDate && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Calendar className="w-3 h-3" />
                    अंतिम तिथि: {job.lastDate}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {job.dept?.slice(0, 24) || 'Govt Recruitment'}
                </span>
                <Link
                  href={targetUrl}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-red-700 hover:text-red-800 hover:underline"
                >
                  विवरण देखें <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Service Promotion */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3 text-slate-950 flex items-center justify-between gap-2">
        <div className="text-xs">
          <p className="font-extrabold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            घर बैठे सुरक्षित फॉर्म भरवाएं
          </p>
          <p className="text-[11px] opacity-90">Nitish Khobragade (8982324497)</p>
        </div>
        <a
          href={OWNER_INFO.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-900 text-white font-bold text-xs rounded-md shadow-xs inline-flex items-center gap-1 shrink-0"
        >
          <PhoneCall className="w-3 h-3 text-emerald-400" /> WhatsApp
        </a>
      </div>
    </aside>
  );
};
