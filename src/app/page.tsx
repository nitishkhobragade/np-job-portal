"use client";

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { TopTicker } from '../components/TopTicker';
import { TrendingGrid } from '../components/TrendingGrid';
import { ThreeColumnLayout } from '../components/ThreeColumnLayout';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { ProminentServiceBanner } from '../components/ProminentServiceBanner';
import { DetailModal } from '../components/DetailModal';
import { FloatingMobileBar } from '../components/FloatingMobileBar';
import { Footer } from '../components/Footer';
import { PopupAdModal } from '../components/PopupAdModal';
import { JobItem, AdmitCardItem, ResultItem, TrendingCard, PostRecord } from '../types';
import { subscribeToPosts } from '../lib/firebase';
import { seedPostsIfEmpty, getInitialSeedPosts } from '../lib/seedDatabase';
import { runDatabaseSanitizationAudit } from '../lib/autoCorrectPosts';

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

  // Initial seed posts baseline to guarantee zero blank flash
  const initialRecords = getInitialSeedPosts();

  const [liveJobs, setLiveJobs] = useState<JobItem[]>(() =>
    initialRecords
      .filter((p) => p.status === 'published' && !p.categories?.includes('admit-card') && !p.categories?.includes('result'))
      .map(mapPostToJob)
  );

  const [liveAdmitCards, setLiveAdmitCards] = useState<AdmitCardItem[]>(() =>
    initialRecords
      .filter((p) => p.status === 'published' && (p.category === 'admit-card' || p.categories?.includes('admit-card') || p.title.toLowerCase().includes('admit')))
      .map(mapPostToAdmitCard)
  );

  const [liveResults, setLiveResults] = useState<ResultItem[]>(() =>
    initialRecords
      .filter((p) => p.status === 'published' && (p.category === 'results' || p.categories?.includes('result') || p.title.toLowerCase().includes('result') || p.title.toLowerCase().includes('answer key')))
      .map(mapPostToResult)
  );

  // Modal State for Viewing Detailed Notification
  const [selectedItem, setSelectedItem] = useState<JobItem | AdmitCardItem | ResultItem | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'job' | 'admit' | 'result' | null>(null);

  useEffect(() => {
    // 1. Run database sanitization audit to ensure all existing & draft posts comply with schema
    runDatabaseSanitizationAudit().catch((err) => console.warn('Sanitization audit check:', err));

    // 2. Ensure Firestore is seeded if empty
    seedPostsIfEmpty().catch((err) => console.warn('Seeding check:', err));

    // 3. Realtime listener for Firestore posts
    const unsubscribe = subscribeToPosts((allPosts) => {
      if (!allPosts || allPosts.length === 0) return;

      const published = allPosts.filter((p) => p.status === 'published');

      // Separate into Jobs, Admit Cards, and Results
      const jobsList = published
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

      const admitList = published
        .filter(
          (p) =>
            p.category === 'admit-card' ||
            p.categories?.includes('admit-card') ||
            p.categories?.includes('admit_card') ||
            p.title.toLowerCase().includes('admit')
        )
        .map(mapPostToAdmitCard);

      const resultsList = published
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

      if (jobsList.length > 0) setLiveJobs(jobsList);
      if (admitList.length > 0) setLiveAdmitCards(admitList);
      if (resultsList.length > 0) setLiveResults(resultsList);
    }, 'all');

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
    const matchingJob = liveJobs.find((j) =>
      j.title.toLowerCase().includes(card.title.toLowerCase().slice(0, 10))
    );
    if (matchingJob) {
      setSelectedItem(matchingJob);
      setSelectedItemType('job');
    } else {
      const fallbackJob: JobItem = {
        id: card.id,
        title: card.title + ' 2026 भर्ती एवं चयन परीक्षा',
        department: card.subtitle,
        totalPosts: card.badge,
        lastDate: card.postsOrDate,
        state: card.category.includes('MP') ? 'MP' : 'Central',
        qualification: 'मान्यता प्राप्त बोर्ड / विश्वविद्यालय से 10वीं/12वीं/स्नातक पास',
        fee: 'सामान्य / ओबीसी: ₹500 | आरक्षित: ₹250',
        category: 'Other',
        isNew: true
      };
      setSelectedItem(fallbackJob);
      setSelectedItemType('job');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden">
      {/* 1. Top Alert / Ticker Bar */}
      <TopTicker />

      {/* Main Header with Dark-Slate Navigation & Mobile Hamburger Drawer */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Top AdSense Banner (Responsive Leaderboard format) */}
      <AdSenseBanner slotType="leaderboard" id="header-leaderboard-adsense" />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {/* Trending Cards Grid */}
        <TrendingGrid onSelectCard={handleSelectTrendingCard} />

        {/* Fixed / Prominent Service Banner (Nitish Khobragade 8982324497) */}
        <ProminentServiceBanner />

        {/* Middle In-Feed AdSense Container */}
        <AdSenseBanner slotType="in-feed" id="middle-infeed-adsense" />

        {/* SarkariResult Style 3-Column Layout (Jobs, Admit Card, Results/Keys) */}
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
