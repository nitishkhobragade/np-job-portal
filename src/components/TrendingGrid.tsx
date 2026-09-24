"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, MessageCircle, Calendar, Flame } from 'lucide-react';
import { TRENDING_CARDS, OWNER_INFO } from '../data/portalData';
import { TrendingCard, PostRecord, JobItem } from '../types';

interface TrendingGridProps {
  onSelectCard: (card: TrendingCard) => void;
  posts?: PostRecord[];
  onSelectJob?: (job: JobItem) => void;
}

const GRADIENTS = [
  'from-red-600 via-rose-500 to-amber-500',
  'from-emerald-600 via-teal-500 to-cyan-500',
  'from-blue-600 via-indigo-600 to-purple-600',
  'from-amber-500 via-orange-600 to-red-600',
  'from-purple-600 via-fuchsia-600 to-pink-600',
  'from-cyan-600 via-blue-600 to-indigo-700',
  'from-teal-600 via-emerald-600 to-green-600',
  'from-rose-600 via-red-600 to-orange-500'
];

export const TrendingGrid: React.FC<TrendingGridProps> = ({ onSelectCard, posts = [], onSelectJob }) => {
  // Dynamically compute the 8 trending cards based on published jobs
  const displayCards: {
    card: TrendingCard;
    postOrigin?: PostRecord;
    directUrl?: string;
  }[] = useMemo(() => {
    // If no dynamic posts yet, fallback to curated portal trending cards
    if (!posts || posts.length === 0) {
      return TRENDING_CARDS.map((c) => {
        let directUrl = '';
        if (c.id === 'trend-1') directUrl = '/2026/09/02/mp-police-constable-2026';
        else if (c.id === 'trend-2') directUrl = '/2026/09/03/mp-ayush-ug-counselling';
        else if (c.id === 'trend-3') directUrl = '/2026/09/04/ssc-chsl-2026';
        else if (c.id === 'trend-4') directUrl = '/2026/09/05/railway-rrc-group-d';
        return { card: c, directUrl };
      });
    }

    // Filter relevant job posts
    const activeJobs = posts.filter(
      (p) =>
        p.status === 'published' &&
        (p.category === 'latest-jobs' ||
          p.category === 'mp-special' ||
          p.category === 'tech-jobs' ||
          p.category === 'central' ||
          !p.categories?.includes('result'))
    );

    // Map the latest published jobs into trending card format
    const dynamicList = activeJobs.slice(0, 8).map((p, index) => {
      const gradient = GRADIENTS[index % GRADIENTS.length];
      const shortTitle = p.shortTitle || (p.title.length > 50 ? `${p.title.slice(0, 48)}...` : p.title);
      const postCount = p.totalPosts ? `${p.totalPosts} पद` : 'विज्ञप्ति अनुसार';
      const lastDate = p.dates?.end || p.lastDate || 'अंतिम तिथि शीघ्र';
      const badge =
        index === 0
          ? '🔥 TOP ट्रेंडिंग'
          : index === 1
          ? '⚡ ऑनलाइन लाइव'
          : p.isTechJob
          ? '💻 IT डायरेक्ट'
          : p.state === 'MP' || p.categories?.includes('mp_special')
          ? '🏛️ MP स्पेशल'
          : '📢 नई भर्ती';

      const categoryLabel = p.isTechJob
        ? 'IT & TECH MNC'
        : p.category === 'mp-special'
        ? 'मध्य प्रदेश शासन'
        : p.category === 'railway'
        ? 'रेलवे भर्ती'
        : p.dept || 'शासकीय भर्ती';

      const directUrl =
        p.year && p.month && p.blogNo && p.slug
          ? `/${p.year}/${p.month}/${p.blogNo}/${p.slug}`
          : p.slug
          ? `/jobs/${p.slug}`
          : `/jobs/${p.id}`;

      const card: TrendingCard = {
        id: `dyn-${p.id}`,
        title: shortTitle,
        subtitle: p.dept || p.role || 'ऑनलाइन आवेदन प्रक्रिया लाइव है',
        badge,
        category: categoryLabel,
        colorTheme: gradient,
        postsOrDate: `${postCount} • ${lastDate}`,
        link: directUrl
      };

      return { card, postOrigin: p, directUrl };
    });

    // If we have fewer than 8 dynamic posts, fill remaining spots with curated portal cards
    if (dynamicList.length < 8) {
      const remainingNeeded = 8 - dynamicList.length;
      const fillCards = TRENDING_CARDS.slice(0, remainingNeeded).map((c) => ({
        card: c,
        directUrl:
          c.id === 'trend-1'
            ? '/2026/09/02/mp-police-constable-2026'
            : c.id === 'trend-2'
            ? '/2026/09/03/mp-ayush-ug-counselling'
            : c.id === 'trend-3'
            ? '/2026/09/04/ssc-chsl-2026'
            : '/2026/09/05/railway-rrc-group-d'
      }));
      return [...dynamicList, ...fillCards];
    }

    return dynamicList;
  }, [posts]);

  return (
    <section className="w-full max-w-7xl mx-auto px-4 my-5">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 text-red-600 shadow-2xs">
            <Flame className="w-5 h-5 fill-red-600 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              ट्रेंडिंग सरकारी भर्तियां एवं काउंसलिंग 2026
              <span className="text-[11px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                लाइव अपडेट
              </span>
            </h2>
            <p className="text-xs text-neutral-500">
              जैसे-जैसे नई नौकरियां पोस्ट होती हैं, यह ट्रेंडिंग बुलेट ग्रिड स्वतः अपडेट होता है • 100% सही फॉर्म भरवाएं
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 8 Dynamic High-Contrast Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {displayCards.map(({ card, postOrigin, directUrl }, idx) => {
          const whatsappPrefill = `https://wa.me/91${OWNER_INFO.phone}?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20*${encodeURIComponent(
            card.title
          )}*%20%E0%A4%95%E0%A4%BE%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4%20%E0%A4%95%E0%A5%83%E0%A4%AA%E0%A4%AF%E0%A4%BE%20%E0%A4%9C%E0%A4%BE%E0%A4%A8%E0%A4%95%E0%A4%BE%E0%A4%B1%E0%A5%80%20%E0%A4%A6%E0%A5%87%E0%A4%82%E0%A5%A4`;

          const handleOpenDetails = () => {
            if (postOrigin && onSelectJob) {
              onSelectJob({
                id: postOrigin.id,
                slug: postOrigin.slug || postOrigin.id,
                year: postOrigin.year,
                month: postOrigin.month,
                blogNo: postOrigin.blogNo,
                title: postOrigin.title,
                department: postOrigin.dept || 'शासकीय विभाग',
                totalPosts: String(postOrigin.totalPosts || 'विज्ञप्ति अनुसार'),
                lastDate: postOrigin.dates?.end || postOrigin.lastDate || 'विज्ञप्ति देखें',
                postDate: postOrigin.publishedDate || '22/09/2026',
                publishedDate: postOrigin.publishedDate || '22/09/2026',
                state: postOrigin.state || 'MP',
                qualification: postOrigin.qualification || postOrigin.eligibility || 'विज्ञप्ति अनुसार',
                fee: `सामान्य: ${postOrigin.fee?.gen || '₹500/-'} | आरक्षित: ${postOrigin.fee?.reserved || '₹250/-'}`,
                category: postOrigin.category || 'Other',
                isNew: true,
                applyUrl: postOrigin.applyLink,
                notificationUrl: postOrigin.notificationPdf
              });
            } else {
              onSelectCard(card);
            }
          };

          return (
            <div
              key={card.id || idx}
              className="group relative flex flex-col justify-between rounded-xl bg-white border border-neutral-200/90 shadow-2xs hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden"
            >
              {/* Top Accent Gradient Header */}
              <div className={`h-2.5 w-full bg-gradient-to-r ${card.colorTheme}`} />

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded truncate max-w-[140px]">
                      {card.category}
                    </span>
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">
                      {card.badge}
                    </span>
                  </div>

                  <h3
                    onClick={handleOpenDetails}
                    className="font-bold text-sm sm:text-base text-neutral-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug cursor-pointer hover:underline"
                    title="विवरण देखने हेतु क्लिक करें"
                  >
                    {card.title}
                  </h3>

                  <p className="text-xs text-neutral-600 mt-1 line-clamp-2 leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs text-neutral-600 mb-2.5">
                    <span className="flex items-center gap-1 font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200/50 truncate">
                      <Calendar className="w-3 h-3 text-amber-700 shrink-0" />
                      <span className="truncate">{card.postsOrDate}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleOpenDetails}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-800 bg-neutral-100 hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      विवरण <ArrowRight className="w-3 h-3" />
                    </button>

                    <a
                      href={whatsappPrefill}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-2xs"
                      title="घर बैठे Nitish Khobragade से फॉर्म भरवाएं"
                    >
                      <MessageCircle className="w-3 h-3 fill-white" />
                      फॉर्म भरें
                    </a>
                  </div>

                  {/* Direct Link to Job Page */}
                  {directUrl && (
                    <Link
                      href={directUrl}
                      className="mt-2 text-center text-[10px] font-bold text-blue-700 hover:underline block truncate"
                    >
                      ★ भर्ती पृष्ठ, तालिका व WhatsApp पोस्टर देखें →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
