"use client";

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { CompactCategoryView, CategorySlug } from '../../../components/CompactCategoryView';
import { DetailModal } from '../../../components/DetailModal';
import { Footer } from '../../../components/Footer';
import { FloatingMobileBar } from '../../../components/FloatingMobileBar';
import { JobItem, AdmitCardItem, ResultItem, PostRecord } from '../../../types';
import { subscribeToPosts } from '../../../lib/firebase';
import { getInitialSeedPosts } from '../../../lib/seedDatabase';
import { ChevronRight, ArrowLeft } from 'lucide-react';

function mapPostToJob(p: PostRecord): JobItem {
  return {
    id: p.id,
    slug: p.slug || p.id,
    year: p.year,
    month: p.month,
    blogNo: p.blogNo,
    title: p.title,
    department: p.dept,
    totalPosts: String(p.totalPosts || 'विज्ञप्ति अनुसार'),
    lastDate: p.dates?.end || p.lastDate || 'विज्ञप्ति देखें',
    state: p.state || (p.categories?.includes('mp_special') ? 'MP' : 'Central'),
    qualification: p.qualification || p.eligibility || '10वीं / 12वीं / स्नातक',
    category: (p.isTechJob || p.categories?.includes('tech'))
      ? 'Tech/IT'
      : p.categories?.includes('police')
      ? 'Police'
      : p.categories?.includes('railway')
      ? 'Railway'
      : p.categories?.includes('banking')
      ? 'Banking'
      : p.categories?.includes('teaching')
      ? 'Teaching'
      : p.categories?.includes('central')
      ? 'SSC/UPSC'
      : 'Other',
    fee: `सामान्य: ${p.fee?.gen || '₹500'} | आरक्षित: ${p.fee?.reserved || '₹250'}`,
    isNew: true,
    applyUrl: p.links?.apply,
    notificationUrl: p.links?.notificationPdf,
    isTechJob: p.isTechJob || p.categories?.includes('tech'),
    companyName: p.companyName,
    role: p.role,
    experience: p.experience,
    location: p.location,
    batchEligibility: p.batchEligibility
  };
}

function mapPostToAdmitCard(p: PostRecord): AdmitCardItem {
  return {
    id: p.id,
    title: p.title,
    department: p.dept,
    examDate: p.dates?.exam || 'शीघ्र घोषित',
    releaseDate: p.dates?.start || p.publishedAt || 'जारी',
    hallTicketStatus: 'Live Now',
    isNew: true,
    downloadUrl: p.links?.apply || p.links?.notificationPdf
  };
}

function mapPostToResult(p: PostRecord): ResultItem {
  return {
    id: p.id,
    title: p.title,
    department: p.dept,
    resultDate: p.publishedAt || p.dates?.start || 'जारी',
    type: p.title.toLowerCase().includes('answer key') ? 'Answer Key' : 'Final Result',
    isNew: true,
    status: 'Declared',
    resultUrl: p.links?.apply || p.links?.notificationPdf
  };
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const rawSlug = resolvedParams.slug || 'latest-jobs';

  // Normalize slug to valid CategorySlug
  const slugToCategory = (s: string): CategorySlug => {
    switch (s.toLowerCase()) {
      case 'latest-jobs':
      case 'latest':
      case 'jobs':
        return 'latest-jobs';
      case 'admit-card':
      case 'admit':
        return 'admit-card';
      case 'results':
      case 'result':
        return 'results';
      case 'mp-special':
      case 'mp':
        return 'mp-special';
      case 'tech-jobs':
      case 'tech':
      case 'corporate':
        return 'tech-jobs';
      case 'ssc-upsc':
      case 'ssc':
      case 'upsc':
        return 'ssc-upsc';
      case 'police':
        return 'police';
      case 'railway':
        return 'railway';
      default:
        return 'latest-jobs';
    }
  };

  const currentCategorySlug = slugToCategory(rawSlug);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHeaderCategory, setSelectedHeaderCategory] = useState(
    currentCategorySlug === 'tech-jobs'
      ? 'Tech Jobs'
      : currentCategorySlug === 'mp-special'
      ? 'MP Special'
      : 'All Updates'
  );

  const initialPosts = getInitialSeedPosts();
  const [liveJobs, setLiveJobs] = useState<JobItem[]>(() =>
    initialPosts.map(mapPostToJob)
  );

  const [liveAdmitCards, setLiveAdmitCards] = useState<AdmitCardItem[]>(() =>
    initialPosts
      .filter((p) => p.category === 'admit-card' || p.categories?.includes('admit-card') || p.title.toLowerCase().includes('admit'))
      .map(mapPostToAdmitCard)
  );

  const [liveResults, setLiveResults] = useState<ResultItem[]>(() =>
    initialPosts
      .filter((p) => p.category === 'results' || p.categories?.includes('result') || p.title.toLowerCase().includes('result') || p.title.toLowerCase().includes('answer key'))
      .map(mapPostToResult)
  );

  // Detail Modal state
  const [selectedItem, setSelectedItem] = useState<JobItem | AdmitCardItem | ResultItem | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'job' | 'admit' | 'result' | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToPosts((fetched) => {
      if (!fetched || fetched.length === 0) return;
      const published = fetched.filter((p) => p.status === 'published');
      
      const mapped = published.map(mapPostToJob);
      if (mapped.length > 0) setLiveJobs(mapped);

      const admits = published
        .filter((p) => p.category === 'admit-card' || p.categories?.includes('admit-card') || p.title.toLowerCase().includes('admit'))
        .map(mapPostToAdmitCard);
      if (admits.length > 0) setLiveAdmitCards(admits);

      const results = published
        .filter((p) => p.category === 'results' || p.categories?.includes('result') || p.title.toLowerCase().includes('result') || p.title.toLowerCase().includes('answer key'))
        .map(mapPostToResult);
      if (results.length > 0) setLiveResults(results);
    }, 'all');

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectJob = (job: JobItem) => {
    setSelectedItem(job);
    setSelectedItemType('job');
  };

  const handleSelectAdmit = (card: AdmitCardItem) => {
    setSelectedItem(card);
    setSelectedItemType('admit');
  };

  const handleSelectResult = (res: ResultItem) => {
    setSelectedItem(res);
    setSelectedItemType('result');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 font-sans">
      {/* 1. Portal Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedHeaderCategory}
        setSelectedCategory={setSelectedHeaderCategory}
      />

      {/* 2. Breadcrumb bar */}
      <div className="bg-white border-b border-slate-200 py-2 px-4 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Link href="/" className="hover:text-red-700 font-bold flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>होम (Home)</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-black capitalize">
              {rawSlug.replace('-', ' ')}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            घर बैठे सुरक्षित फॉर्म भरवाएं • Nitish Khobragade (8982324497)
          </div>
        </div>
      </div>

      {/* 3. Main High-Density Compact Category Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1">
        <CompactCategoryView
          initialCategory={currentCategorySlug}
          jobs={liveJobs}
          admitCards={liveAdmitCards}
          results={liveResults}
          onSelectJob={handleSelectJob}
          onSelectAdmit={handleSelectAdmit}
          onSelectResult={handleSelectResult}
        />
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Floating Mobile Action Bar */}
      <FloatingMobileBar />

      {/* 6. Detail Modal */}
      <DetailModal
        item={selectedItem}
        itemType={selectedItemType}
        onClose={() => {
          setSelectedItem(null);
          setSelectedItemType(null);
        }}
      />
    </div>
  );
}
