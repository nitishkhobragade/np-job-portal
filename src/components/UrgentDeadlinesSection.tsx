"use client";

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Flame,
  Zap,
  MessageCircle,
  ShieldAlert,
  FileText,
  Calendar
} from 'lucide-react';
import { JobItem, PostRecord } from '../types';
import { extractUrgentDeadlineJobs, UrgentPostItem, UrgencyType } from '../lib/deadlines';
import { OWNER_INFO } from '../data/portalData';

interface UrgentDeadlinesSectionProps {
  posts: (JobItem | PostRecord)[];
  onSelectJob?: (job: JobItem) => void;
}

export const UrgentDeadlinesSection: React.FC<UrgentDeadlinesSectionProps> = ({
  posts,
  onSelectJob,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | UrgencyType>('all');

  // Extract jobs that expire Today (0), Tomorrow (1), or Day After Tomorrow (2)
  const urgentJobs = useMemo(() => {
    return extractUrgentDeadlineJobs(posts, 2);
  }, [posts]);

  // Counts for each tab
  const todayJobs = useMemo(
    () => urgentJobs.filter((j) => j.urgency.urgencyType === 'today'),
    [urgentJobs]
  );
  const tomorrowJobs = useMemo(
    () => urgentJobs.filter((j) => j.urgency.urgencyType === 'tomorrow'),
    [urgentJobs]
  );
  const dayAfterJobs = useMemo(
    () => urgentJobs.filter((j) => j.urgency.urgencyType === 'day_after_tomorrow'),
    [urgentJobs]
  );

  // Filtered list according to tab
  const displayedJobs = useMemo(() => {
    if (filterTab === 'today') return todayJobs;
    if (filterTab === 'tomorrow') return tomorrowJobs;
    if (filterTab === 'day_after_tomorrow') return dayAfterJobs;
    return urgentJobs;
  }, [filterTab, urgentJobs, todayJobs, tomorrowJobs, dayAfterJobs]);

  // If there are no jobs expiring today, tomorrow, or day after tomorrow,
  // we do not render clutter, or we show a clean verified notice.
  if (urgentJobs.length === 0) {
    return null;
  }

  const handleCardClick = (job: UrgentPostItem) => {
    if (onSelectJob) {
      // Cast or map rawJob to JobItem
      const raw = job.rawJob;
      const jobItem: JobItem = 'lastDate' in raw && 'qualification' in raw
        ? (raw as JobItem)
        : {
            id: job.id,
            slug: job.slug,
            year: job.year,
            month: job.month,
            blogNo: job.blogNo,
            title: job.title,
            department: job.dept || 'विज्ञप्ति अनुसार',
            totalPosts: job.totalPosts || 'विज्ञप्ति अनुसार',
            lastDate: job.lastDate,
            qualification: job.qualification || 'विज्ञप्ति अनुसार',
            state: (job.state as 'MP' | 'Central') || 'Central',
            category: 'Jobs',
            isNew: true,
            applyUrl: job.applyUrl,
            notificationUrl: job.notificationUrl,
          };
      onSelectJob(jobItem);
    }
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-4 animate-in fade-in duration-300">
      {/* High-Urgency Warning Container */}
      <div className="bg-gradient-to-b from-red-950 via-slate-900 to-slate-950 border-2 border-red-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        {/* Glowing Ambient Light Effect */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Urgency Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3.5 border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 bg-gradient-to-br from-red-600 to-rose-700 text-white rounded-xl shadow-lg shrink-0">
              <Flame className="w-6 h-6 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 border-2 border-slate-900"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wide shadow-sm flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>अंतिम तिथि चेतावनी • FILL FORMS FAST</span>
                </span>
                <span className="text-amber-400 text-xs font-bold">
                  ({urgentJobs.length} भर्तियां आज/कल/परसों समाप्त)
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1 flex items-center gap-1.5 flex-wrap">
                <span>अंतिम तिथि समाप्त होने वाली है! तुरंत फॉर्म भरें</span>
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 rounded-md font-bold">
                  लास्ट डेट अलर्ट
                </span>
              </h2>
            </div>
          </div>

          {/* Quick WhatsApp Help Booking Button */}
          <a
            href={`https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(
              'नमस्ते नीतीश जी, मुझे आज/कल अंतिम तिथि वाला ऑनलाइन फॉर्म तुरंत भरवाना है। कृपया मेरा फॉर्म अभी सबमिट करवाएं।'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>नीतीश जी से तत्काल फॉर्म भरवाएं ({OWNER_INFO.phone})</span>
          </a>
        </div>

        {/* Warning Banner Text Box */}
        <div className="mt-3.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-100 leading-relaxed">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <span className="font-bold text-amber-300">उम्मीदवार ध्यान दें:</span> जिन भर्तियों की अंतिम तिथि{' '}
            <strong className="text-white underline decoration-red-400">आज, कल या परसों</strong> है, उनके अधिकृत
            सर्वर पर अंतिम घंटों में भारी ट्रैफिक के कारण साइट क्रैश या पेमेंट फेल होने का खतरा रहता है। अंतिम समय का
            इंतज़ार न करें, अभी अपना फॉर्म भरें या तुरंत संपर्क करें!
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-4 flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1 scrollbar-none text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              filterTab === 'all'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>सभी जल्दी समाप्त होने वाले ({urgentJobs.length})</span>
          </button>

          {todayJobs.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab('today')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'today'
                  ? 'bg-red-600 text-white font-black shadow-lg shadow-red-500/40'
                  : 'bg-slate-800/80 text-red-400 hover:bg-slate-800 border border-red-500/40'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>🔴 आज अंतिम तिथि ({todayJobs.length})</span>
            </button>
          )}

          {tomorrowJobs.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab('tomorrow')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'tomorrow'
                  ? 'bg-orange-500 text-white font-black shadow-lg shadow-orange-500/40'
                  : 'bg-slate-800/80 text-orange-400 hover:bg-slate-800 border border-orange-500/40'
              }`}
            >
              <span>🟠 कल अंतिम तिथि ({tomorrowJobs.length})</span>
            </button>
          )}

          {dayAfterJobs.length > 0 && (
            <button
              type="button"
              onClick={() => setFilterTab('day_after_tomorrow')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterTab === 'day_after_tomorrow'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800 border border-amber-500/40'
              }`}
            >
              <span>🟡 परसों अंतिम तिथि ({dayAfterJobs.length})</span>
            </button>
          )}
        </div>

        {/* Grid of Urgent Expiring Job Cards */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedJobs.map((job) => {
            const isToday = job.urgency.urgencyType === 'today';
            const isTomorrow = job.urgency.urgencyType === 'tomorrow';

            const cardBorder = isToday
              ? 'border-2 border-red-500 shadow-lg shadow-red-950/60 bg-gradient-to-b from-red-950/50 via-slate-900 to-slate-950'
              : isTomorrow
              ? 'border-2 border-orange-500/80 shadow-md bg-gradient-to-b from-orange-950/30 via-slate-900 to-slate-950'
              : 'border border-amber-500/60 bg-gradient-to-b from-amber-950/20 via-slate-900 to-slate-950';

            const whatsappMessage = `नमस्ते नीतीश जी, मुझे "${job.title}" का ऑनलाइन फॉर्म तुरंत भरवाना है क्योंकि इसकी अंतिम तिथि (${job.lastDate}) बहुत नजदीक है। कृपया सर्वर बंद होने से पहले मेरा फॉर्म अभी भर दीजिए।`;

            return (
              <div
                key={job.id}
                className={`rounded-xl p-4 flex flex-col justify-between transition-all hover:-translate-y-0.5 ${cardBorder}`}
              >
                <div>
                  {/* Top Badge: Urgency Tag */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-[10px] sm:text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        job.urgency.badgeColorClass
                      } ${job.urgency.pulse ? 'animate-pulse' : ''}`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{job.urgency.badgeText}</span>
                    </span>

                    <span className="text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {job.dept}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => handleCardClick(job)}
                    className="text-sm font-black text-white hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer leading-snug"
                    title={job.title}
                  >
                    {job.title}
                  </h3>

                  {/* Key Metadata Pills */}
                  <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60 font-semibold">
                      पद: {job.totalPosts}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {job.qualification}
                    </span>
                  </div>

                  {/* Deadline Notice Box */}
                  <div
                    className={`mt-3 p-2.5 rounded-lg border flex items-center justify-between gap-2 text-xs ${
                      isToday
                        ? 'bg-red-900/40 border-red-500/50 text-red-200'
                        : isTomorrow
                        ? 'bg-orange-900/30 border-orange-500/40 text-orange-200'
                        : 'bg-amber-900/20 border-amber-500/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>अंतिम तिथि:</span>
                      <span className="font-black underline tracking-wide">{job.lastDate}</span>
                    </div>

                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-black/40">
                      {isToday ? 'आज रात 11:59' : isTomorrow ? 'कल शाम तक' : '48 घंटे शेष'}
                    </span>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* View Details Button */}
                    <button
                      type="button"
                      onClick={() => handleCardClick(job)}
                      className="w-full py-2 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" />
                      <span>विवरण देखें</span>
                    </button>

                    {/* Direct Apply Button */}
                    {job.applyUrl ? (
                      <a
                        href={job.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Apply Online</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCardClick(job)}
                        className="w-full py-2 px-2 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1 shadow-md transition-all cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>फॉर्म भरें</span>
                      </button>
                    )}
                  </div>

                  {/* Nitish Ji WhatsApp Urgent Apply Button */}
                  <a
                    href={`https://wa.me/91${OWNER_INFO.phone}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>नीतीश जी से तुरंत भरवाएं (WhatsApp)</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
