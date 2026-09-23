"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/Header';
import { TopTicker } from '../../../components/TopTicker';
import { Footer } from '../../../components/Footer';
import { TrendingJobsWidget } from '../../../components/TrendingJobsWidget';
import { RelatedBlogsWidget } from '../../../components/RelatedBlogsWidget';
import { FloatingMobileBar } from '../../../components/FloatingMobileBar';
import { BlogPost } from '../../../types';
import { getBlogPostBySlug } from '../../../lib/firebase';
import { OWNER_INFO } from '../../../data/portalData';
import {
  Calendar,
  Clock,
  Share2,
  ChevronLeft,
  Tag,
  PhoneCall,
  Sparkles,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [headerSearch, setHeaderSearch] = useState('');
  const [headerCat, setHeaderCat] = useState('All Updates');

  useEffect(() => {
    if (!slug) return;
    let isSubscribed = true;

    getBlogPostBySlug(slug)
      .then((data) => {
        if (isSubscribed) {
          setBlog(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading blog post:', err);
        if (isSubscribed) setLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [slug]);

  const handleShareWhatsApp = () => {
    if (!blog) return;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = encodeURIComponent(
      `📖 *${blog.title}*\n\n${blog.excerpt}\n\n👉 पूरा लेख यहां पढ़ें:\n${url}\n\n★ किसी भी सरकारी नौकरी का ऑनलाइन फॉर्म घर बैठे भरवाने हेतु संपर्क करें:\n*Nitish Khobragade (8982324497)*`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden">
      <TopTicker />
      <Header
        searchQuery={headerSearch}
        setSearchQuery={setHeaderSearch}
        selectedCategory={headerCat}
        setSelectedCategory={setHeaderCat}
      />

      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/" className="hover:text-red-700">होम (Home)</Link>
          <span>/</span>
          <Link href="/blogs" className="hover:text-red-700">ब्लॉग (Blogs)</Link>
          <span>/</span>
          <span className="text-slate-800 font-bold truncate max-w-xs sm:max-w-md">
            {blog?.title || 'लेख विवरण'}
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-500">लेख लोड हो रहा है...</p>
          </div>
        ) : !blog ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-xl mx-auto my-12">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-800">ब्लॉग लेख नहीं मिला</h2>
            <p className="text-xs text-slate-500 mt-2">यह लेख हटाया जा चुका है अथवा इसका यूआरएल गलत है।</p>
            <Link
              href="/blogs"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-red-700 text-white font-bold text-xs rounded-xl shadow-md hover:bg-red-800"
            >
              <ChevronLeft className="w-4 h-4" /> अन्य सभी ब्लॉग देखें
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Left Content Area (2 Cols) */}
            <article className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 sm:p-8">
              
              {/* Category & Date */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-4 border-b border-slate-100">
                <span className="px-3 py-1 bg-red-700 text-white font-black text-xs rounded-md uppercase tracking-wider">
                  {blog.category}
                </span>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('hi-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '2026'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {blog.readingTimeMinutes || 5} मिनट पठन
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-4 leading-tight">
                {blog.title}
              </h1>

              {/* Author & Share Bar */}
              <div className="mt-4 py-3 border-y border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    NK
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      {blog.author?.name || 'Nitish Khobragade'}
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                    </p>
                    <p className="text-[11px] text-slate-500">{blog.author?.role || 'Chief Editor & Career Guide'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp शेयर करें
                </button>
              </div>

              {/* Featured Banner Image */}
              {blog.bannerUrl && (
                <div className="relative h-64 sm:h-96 w-full rounded-xl overflow-hidden my-6 bg-slate-900">
                  <Image
                    src={blog.bannerUrl}
                    alt={blog.title}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Excerpt Lead */}
              {blog.excerpt && (
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-slate-800 text-sm font-medium leading-relaxed my-5">
                  {blog.excerpt}
                </div>
              )}

              {/* Main Rich Content */}
              <div className="prose max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-4 my-6">
                {(blog.content || '').split('\n\n').map((para, idx) => {
                  const formatInline = (text: string) => {
                    const parts = text.split(/(\*\*[^*]+\*\*)/g);
                    return parts.map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return (
                          <strong key={i} className="font-extrabold text-slate-900">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return part;
                    });
                  };

                  const renderedElement = (() => {
                    // Headings
                    if (para.startsWith('## ')) {
                      return (
                        <h2 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 pt-5 pb-1.5 border-b-2 border-red-200">
                          {formatInline(para.replace('## ', ''))}
                        </h2>
                      );
                    }
                    if (para.startsWith('### ')) {
                      return (
                        <h3 key={idx} className="text-lg sm:text-xl font-bold text-slate-900 pt-4">
                          {formatInline(para.replace('### ', ''))}
                        </h3>
                      );
                    }

                    // Tables
                    if (para.trim().startsWith('|') && para.includes('\n|')) {
                      const rows = para.trim().split('\n').filter(r => r.trim().startsWith('|'));
                      if (rows.length >= 2) {
                        const headerCols = rows[0].split('|').map(c => c.trim()).filter(Boolean);
                        const dataRows = rows.slice(rows[1].includes('---') ? 2 : 1);
                        return (
                          <div key={idx} className="overflow-x-auto my-5 rounded-xl border border-slate-200 shadow-xs">
                            <table className="w-full text-xs sm:text-sm text-left border-collapse">
                              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                                <tr>
                                  {headerCols.map((col, cIdx) => (
                                    <th key={cIdx} className="p-3 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                                      {formatInline(col)}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200">
                                {dataRows.map((r, rIdx) => {
                                  const cells = r.split('|').map(c => c.trim()).filter(Boolean);
                                  return (
                                    <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                                      {cells.map((cell, cellIdx) => (
                                        <td key={cellIdx} className="p-3 border-r border-slate-200 last:border-r-0">
                                          {formatInline(cell)}
                                        </td>
                                      ))}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      }
                    }

                    // Numbered List
                    if (/^\d+\.\s/.test(para.trim())) {
                      const items = para.split('\n').filter(Boolean);
                      return (
                        <ol key={idx} className="list-decimal pl-5 space-y-1.5 text-slate-700 my-3">
                          {items.map((it, i) => (
                            <li key={i} className="leading-relaxed">
                              {formatInline(it.replace(/^\d+\.\s+/, ''))}
                            </li>
                          ))}
                        </ol>
                      );
                    }

                    // Bulleted List
                    if (para.startsWith('- ') || para.startsWith('* ')) {
                      const items = para.split('\n').filter(Boolean);
                      return (
                        <ul key={idx} className="list-disc pl-5 space-y-1.5 text-slate-700 my-3">
                          {items.map((it, i) => (
                            <li key={i} className="leading-relaxed">
                              {formatInline(it.replace(/^[-*]\s+/, ''))}
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    // Horizontal Rule
                    if (para.startsWith('---')) {
                      return <hr key={idx} className="my-6 border-slate-200" />;
                    }

                    return <p key={idx} className="leading-relaxed my-2">{formatInline(para)}</p>;
                  })();

                  // Embed high-conversion banner after 3rd paragraph / section
                  const isCalloutPosition = idx === 3;

                  return (
                    <React.Fragment key={idx}>
                      {renderedElement}
                      {isCalloutPosition && (
                        <div className="my-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-center sm:text-left">
                            <div className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-xs font-bold text-amber-200">
                              <Sparkles className="w-3.5 h-3.5" /> घर बैठे ऑनलाइन फॉर्म सेवा
                            </div>
                            <h4 className="text-base sm:text-lg font-black tracking-tight">
                              फॉर्म भरने में सहायता चाहिए? सीधे संपर्क करें: {OWNER_INFO.phone}
                            </h4>
                            <p className="text-xs text-amber-100">
                              फोटो रिसाइजिंग, डोमिसाइल, जाति प्रमाण पत्र व 100% सटीक सबमिशन — Nitish Khobragade द्वारा।
                            </p>
                          </div>
                          <a
                            href={OWNER_INFO.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-4 py-2.5 bg-white text-slate-950 font-black text-xs sm:text-sm rounded-xl hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                          >
                            <PhoneCall className="w-4 h-4 text-emerald-600" />
                            <span>व्हाट्सएप पर संपर्क करें</span>
                          </a>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Tags Strip */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="pt-6 border-t border-slate-100 flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" /> टैग्स:
                  </span>
                  {blog.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Nitish Khobragade Author Help Box */}
              <div className="mt-8 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl p-5 border border-red-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-black text-base text-red-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    फॉर्म भरने में सहायता चाहिए?
                  </h4>
                  <p className="text-xs text-slate-700 mt-1">
                    Nitish Khobragade (8982324497) द्वारा घर बैठे 100% सही व सुरक्षित फॉर्म भरवाएं।
                  </p>
                </div>
                <a
                  href={OWNER_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2 shrink-0"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> फॉर्म भरवाएं
                </a>
              </div>

              {/* Related Blogs Inside Article */}
              <div className="mt-8">
                <RelatedBlogsWidget currentBlogSlug={blog.slug} />
              </div>
            </article>

            {/* Right Sidebar: Trending Jobs Widget */}
            <div className="space-y-6">
              <TrendingJobsWidget />

              {/* WhatsApp Channel Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-base text-slate-900">
                  व्हाट्सएप चैनल से जुड़ें
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  सभी भर्तियों के एडमिट कार्ड एवं रिजल्ट अपडेट सबसे पहले सीधे अपने व्हाट्सएप पर पाएं।
                </p>
                <a
                  href={OWNER_INFO.whatsappChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-colors"
                >
                  चैनल जॉइन करें →
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <FloatingMobileBar />
    </div>
  );
}
