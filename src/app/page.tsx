"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { TopTicker } from '../components/TopTicker';
import { TrendingGrid } from '../components/TrendingGrid';
import { UrgentDeadlinesSection } from '../components/UrgentDeadlinesSection';
import { ThreeColumnLayout } from '../components/ThreeColumnLayout';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { ProminentServiceBanner } from '../components/ProminentServiceBanner';
import { DetailModal } from '../components/DetailModal';
import { FloatingMobileBar } from '../components/FloatingMobileBar';
import { Footer } from '../components/Footer';
import { PopupAdModal } from '../components/PopupAdModal';
import { JobItem, AdmitCardItem, ResultItem, TrendingCard, PostRecord } from '../types';
import { subscribeToPosts, getDeletedPostIds, syncTombstonesFromFirestore } from '../lib/firebase';

// Helper to reliably compute publication timestamp for strict descending ordering
function getPostTimestamp(p: PostRecord): number {
  if (typeof p.publishedAt === 'number') return p.publishedAt;
  if (typeof p.publishedAt === 'string') {
    const parsed = Date.parse(p.publishedAt);
    if (!isNaN(parsed)) return parsed;
  }
  if (p.createdAt && typeof p.createdAt === 'object' && 'seconds' in (p.createdAt as { seconds: number })) {
    return (p.createdAt as { seconds: number }).seconds * 1000;
  }
  if (p.updatedAt && typeof p.updatedAt === 'object' && 'seconds' in (p.updatedAt as { seconds: number })) {
    return (p.updatedAt as { seconds: number }).seconds * 1000;
  }
  return 0;
}

// Helper to convert PostRecord to JobItem
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
    postDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    publishedDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    publishedDateFormatted: p.publishedDateFormatted || p.publishedDate,
    importantLinks: p.importantLinks || [],
    state: p.state || (p.categories?.includes('mp_special') ? 'MP' : 'Central'),
    qualification: p.qualification || p.eligibility || '10वीं / 12वीं अथवा स्नातक उत्तीर्ण',
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
    fee: `सामान्य: ${p.fee?.gen || '₹500/-'} | आरक्षित: ${p.fee?.reserved || '₹250/-'}`,
    isNew: true,
    applyUrl: p.applyLink || p.links?.apply,
    notificationUrl: p.notificationPdf || p.links?.notificationPdf,
    isTechJob: p.isTechJob || p.categories?.includes('tech'),
    companyName: p.companyName,
    role: p.role,
    experience: p.experience,
    location: p.location || p.jobLocation,
    batchEligibility: p.batchEligibility || p.batch
  };
}

// Helper to convert PostRecord to AdmitCardItem
function mapPostToAdmitCard(p: PostRecord): AdmitCardItem {
  return {
    id: p.id,
    title: p.title,
    department: p.dept,
    examDate: p.examDate || p.dates?.exam || 'शीघ्र घोषित',
    releaseDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    publishedDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    hallTicketStatus: 'Live Now',
    isNew: true,
    downloadUrl: p.applyLink || p.links?.apply || p.notificationPdf || p.links?.notificationPdf
  };
}

// Helper to convert PostRecord to ResultItem
function mapPostToResult(p: PostRecord): ResultItem {
  return {
    id: p.id,
    title: p.title,
    department: p.dept,
    declaredDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    resultDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    publishedDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    type: p.title.toLowerCase().includes('answer key') ? 'Answer Key' : 'Final Result',
    isNew: true,
    status: 'Declared',
    viewUrl: p.applyLink || p.links?.apply || p.notificationPdf || p.links?.notificationPdf,
    resultUrl: p.applyLink || p.links?.apply || p.notificationPdf || p.links?.notificationPdf
  };
}

export default function NPJobPortalPage() {
  const [currentLayout, setCurrentLayout] = useState<'A' | 'B'>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Updates');

  // Dynamic real-time states
  const [rawPosts, setRawPosts] = useState<PostRecord[]>([]);
  const [liveJobs, setLiveJobs] = useState<JobItem[]>([]);
  const [liveAdmitCards, setLiveAdmitCards] = useState<AdmitCardItem[]>([]);
  const [liveResults, setLiveResults] = useState<ResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State for Viewing Detailed Notification
  const [selectedItem, setSelectedItem] = useState<JobItem | AdmitCardItem | ResultItem | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'job' | 'admit' | 'result' | null>(null);

  useEffect(() => {
    // Initial sync of tombstones from Firestore
    syncTombstonesFromFirestore().catch(() => {});

    // Real-time Firestore synchronization on published posts with strict tombstone enforcement
    const unsubscribe = subscribeToPosts((publishedList) => {
      setIsLoading(false);
      const deletedIds = getDeletedPostIds();
      const validPosts = (publishedList || []).filter(
        (p) => !deletedIds.has(p.id) && !deletedIds.has(p.slug || p.id)
      );

      // Strict descending order: latest published post strictly on top
      validPosts.sort((a, b) => getPostTimestamp(b) - getPostTimestamp(a));
      setRawPosts(validPosts);

      // Separate into Jobs, Admit Cards, and Results
      const jobsList = validPosts
        .filter(
          (p) =>
            p.category === 'latest-jobs' ||
            p.category === 'mp-special' ||
            p.category === 'tech-jobs' ||
            p.category === 'central' ||
            p.categories?.includes('vacancy') ||
            (!p.categories?.includes('admit-card') && !p.categories?.includes('result'))
        )
        .map(mapPostToJob);

      const admitList = validPosts
        .filter(
          (p) =>
            p.category === 'admit-card' ||
            p.categories?.includes('admit-card') ||
            p.categories?.includes('admit_card') ||
            p.title.toLowerCase().includes('admit')
        )
        .map(mapPostToAdmitCard);

      const resultsList = validPosts
        .filter(
          (p) =>
            p.category === 'results' ||
            p.category === 'result' ||
            p.categories?.includes('result') ||
            p.categories?.includes('results') ||
            p.title.toLowerCase().includes('result') ||
            p.title.toLowerCase().includes('answer key')
        )
        .map(mapPostToResult);

      setLiveJobs(jobsList);
      setLiveAdmitCards(admitList);
      setLiveResults(resultsList);
    }, 'published');

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSelectJob = (job: JobItem) => {
    setSelectedItem(job);
    setSelectedItemType('job');
  };

  const handleSelectAdmitCard = (card: AdmitCardItem) => {
    setSelectedItem(card);
    setSelectedItemType('admit');
  };

  const handleSelectResult = (res: ResultItem) => {
    setSelectedItem(res);
    setSelectedItemType('result');
  };

  const handleSelectTrendingCard = (card: TrendingCard) => {
    const deletedIds = getDeletedPostIds();
    if (deletedIds.has(card.id) || deletedIds.has('railway-rrc-group-d')) return;

    const matchingJob = liveJobs.find((j) =>
      j.title.toLowerCase().includes(card.title.toLowerCase().slice(0, 10))
    );
    if (matchingJob) {
      setSelectedItem(matchingJob);
      setSelectedItemType('job');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden">
      {/* 1. Top Alert / Ticker Bar */}
      <TopTicker />

      {/* Main Header with Navigation & Mobile Drawer */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Top AdSense Banner */}
      <AdSenseBanner slotType="leaderboard" id="header-leaderboard-adsense" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* Trending Cards Grid */}
        <TrendingGrid
          posts={rawPosts}
          onSelectCard={handleSelectTrendingCard}
          onSelectJob={handleSelectJob}
        />

        {/* 🚨 High Urgency Deadline Alert: आज, कल या परसों समाप्त होने वाले फॉर्म (Fill Forms Fast) */}
        <UrgentDeadlinesSection
          posts={rawPosts.length > 0 ? rawPosts : liveJobs}
          onSelectJob={handleSelectJob}
        />

        {/* Fixed / Prominent Service Banner (Nitish Khobragade 8982324497) */}
        <ProminentServiceBanner />

        {/* Middle In-Feed AdSense Container */}
        <AdSenseBanner slotType="in-feed" id="middle-infeed-adsense" />

        {/* Live 3-Column Layout (Jobs, Admit Card, Results/Keys) */}
        {isLoading && liveJobs.length === 0 ? (
          <div className="w-full max-w-7xl mx-auto px-4 py-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs font-bold text-slate-500">लाइव अपडेट्स सिंक किए जा रहे हैं...</p>
          </div>
        ) : (
          <ThreeColumnLayout
            jobs={liveJobs}
            admitCards={liveAdmitCards}
            results={liveResults}
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            currentLayout={currentLayout}
            onLayoutChange={setCurrentLayout}
            onSelectJob={handleSelectJob}
            onSelectAdmitCard={handleSelectAdmitCard}
            onSelectResult={handleSelectResult}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Detail & Form Booking Modal */}
      <DetailModal
        item={selectedItem}
        itemType={selectedItemType}
        onClose={() => {
          setSelectedItem(null);
          setSelectedItemType(null);
        }}
      />

      {/* Mobile Floating Sticky Contact Bar for Nitish Khobragade */}
      <FloatingMobileBar />

      {/* 5-6 Second Custom Pop-up Ad Campaign Modal */}
      <PopupAdModal />
    </div>
  );
}
