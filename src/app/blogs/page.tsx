"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../components/Header';
import { TopTicker } from '../../components/TopTicker';
import { Footer } from '../../components/Footer';
import { TrendingJobsWidget } from '../../components/TrendingJobsWidget';
import { FloatingMobileBar } from '../../components/FloatingMobileBar';
import { BlogPost, BlogCategory } from '../../types';
import { subscribeToBlogPosts } from '../../lib/firebase';
import { OWNER_INFO } from '../../data/portalData';
import { BookOpen, Clock, User, Sparkles, Search, ArrowRight, Tag, Eye } from 'lucide-react';

const CATEGORIES: ('All' | BlogCategory)[] = [
  'All',
  'Exam Prep',
  'Career Guidance',
  'Tech Tips',
  'Gov Schemes'
];

export default function BlogsListingPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');
  const [headerCat, setHeaderCat] = useState('All Updates');

  useEffect(() => {
    const unsubscribe = subscribeToBlogPosts((updatedBlogs) => {
      setBlogs(updatedBlogs);
    }, 'published');

    return () => unsubscribe();
  }, []);

  const filteredBlogs = blogs.filter((b) => {
    const matchesCat = selectedCategory === 'All' || b.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const featuredPost = filteredBlogs[0] || blogs[0];
  const regularPosts = filteredBlogs.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden">
      <TopTicker />
      <Header
        searchQuery={headerSearch}
        setSearchQuery={setHeaderSearch}
        selectedCategory={headerCat}
        setSelectedCategory={setHeaderCat}
      />

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-r from-red-800 via-rose-800 to-red-900 text-white py-10 px-4 border-b-4 border-amber-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              NP Job Portal Career Journal
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              करियर मार्गदर्शन, परीक्षा तैयारी एवं सरकारी योजना गाइड
            </h1>
            <p className="mt-2 text-red-100 text-sm sm:text-base leading-relaxed">
              सटीक परीक्षा रणनीति, महत्वपूर्ण टिप्स एवं ऑनलाइन फॉर्म भरने की प्रमाणित गाइडेंस — Nitish Khobragade (8982324497) के साथ।
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-80">
            <div className="relative">
              <input
                type="text"
                placeholder="ब्लॉग या विषय खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 text-white placeholder-red-200 border border-white/20 focus:outline-hidden focus:ring-2 focus:ring-amber-400 text-sm backdrop-blur-xs"
              />
              <Search className="w-4 h-4 text-red-200 absolute left-3.5 top-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Categories Filter Strip */}
      <div className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'All' ? 'सभी लेख (All Articles)' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Blog Articles (2 Cols) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Post Card */}
            {featuredPost && (
              <article className="bg-white rounded-2xl border-2 border-slate-200 shadow-md overflow-hidden hover:shadow-xl transition-shadow group">
                {featuredPost.bannerUrl && (
                  <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
                    <Image
                      src={featuredPost.bannerUrl}
                      alt={featuredPost.title}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 700px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 bg-red-700 text-white font-black text-xs px-3 py-1 rounded-md shadow-md uppercase tracking-wider">
                      {featuredPost.category}
                    </div>
                  </div>
                )}

                <div className="p-5 sm:p-7">
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 flex-wrap">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <User className="w-3.5 h-3.5 text-red-600" />
                      {featuredPost.author?.name || 'Nitish Khobragade'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readingTimeMinutes || 5} मिनट पठन
                    </span>
                    {featuredPost.views && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {featuredPost.views} पाठक
                      </span>
                    )}
                  </div>

                  <Link href={`/blogs/${featuredPost.slug}`}>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-red-700 transition-colors leading-snug">
                      {featuredPost.title}
                    </h2>
                  </Link>

                  <p className="mt-3 text-slate-600 text-sm leading-relaxed line-clamp-3">
                    {featuredPost.excerpt}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {featuredPost.tags?.slice(0, 3).map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          <Tag className="w-2.5 h-2.5" /> {t}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/blogs/${featuredPost.slug}`}
                      className="inline-flex items-center gap-1 text-sm font-black text-red-700 hover:text-red-800 hover:underline"
                    >
                      पूरा लेख पढ़ें <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* Regular Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {regularPosts.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
                >
                  {post.bannerUrl && (
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                      <Image
                        src={post.bannerUrl}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 350px"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {post.category}
                      </span>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                        <span className="flex items-center gap-1 text-slate-600 font-medium">
                          <User className="w-3 h-3 text-red-600" />
                          {post.author?.name || 'Nitish'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.readingTimeMinutes || 5} min
                        </span>
                      </div>

                      <Link href={`/blogs/${post.slug}`}>
                        <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('hi-IN') : 'हाल ही में प्रकाशित'}
                      </span>
                      <Link
                        href={`/blogs/${post.slug}`}
                        className="text-xs font-black text-red-700 hover:underline inline-flex items-center gap-1"
                      >
                        पढ़ें →
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredBlogs.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">कोई लेख नहीं मिला</h3>
                <p className="text-xs text-slate-400 mt-1">कृपया अन्य श्रेणी चुनें अथवा सर्च क्वेरी बदलें।</p>
              </div>
            )}
          </div>

          {/* Right Sidebar: Trending Jobs & Nitish Khobragade Contact */}
          <div className="space-y-6">
            <TrendingJobsWidget />

            {/* Nitish Khobragade Form Filling Promotion Box */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-orange-400 rounded-2xl p-5 text-slate-950 shadow-md">
              <span className="inline-block px-2.5 py-0.5 bg-slate-950 text-white text-[10px] font-black rounded-full uppercase tracking-wider mb-2">
                ऑफिशियल सेवा
              </span>
              <h3 className="text-lg font-black leading-tight">
                घर बैठे 100% सही व सुरक्षित फॉर्म भरवाएं
              </h3>
              <p className="text-xs font-medium text-slate-900 mt-2 leading-relaxed">
                फॉर्म में गलती होने पर एडमिट कार्ड रिजेक्ट हो सकता है। किसी भी सरकारी अथवा प्राइवेट भर्ती का ऑनलाइन आवेदन सुरक्षित करवाएं।
              </p>
              <div className="mt-4 pt-3 border-t border-amber-600/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-900">Nitish Khobragade</p>
                  <p className="text-xs font-black text-slate-950">Helpline: 8982324497</p>
                </div>
                <a
                  href={OWNER_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-slate-950 hover:bg-neutral-900 text-white font-black text-xs rounded-xl shadow-md"
                >
                  व्हाट्सएप करें →
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <FloatingMobileBar />
    </div>
  );
}
