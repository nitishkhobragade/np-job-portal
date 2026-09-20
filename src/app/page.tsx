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
import {
  LATEST_JOBS_DATA,
  ADMIT_CARD_DATA,
  RESULTS_DATA
} from '../data/portalData';
import { JobItem, AdmitCardItem, ResultItem, TrendingCard } from '../types';
import { getJobs } from '../lib/firebase';

export default function NPJobPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Updates');

  // Dynamic Jobs from Firestore / Local Cache merged with baseline
  const [liveJobs, setLiveJobs] = useState<JobItem[]>(LATEST_JOBS_DATA);

  // Modal State for Viewing Detailed Notification
  const [selectedItem, setSelectedItem] = useState<JobItem | AdmitCardItem | ResultItem | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'job' | 'admit' | 'result' | null>(null);

  useEffect(() => {
    let isMounted = true;
    getJobs().then((fetched) => {
      if (!isMounted || !fetched || fetched.length === 0) return;
      const mapped: JobItem[] = fetched
        .filter((p) => p.status === 'published')
        .map((p) => ({
          id: p.id,
          slug: p.id,
          title: p.title,
          department: p.dept,
          totalPosts: String(p.totalPosts),
          lastDate: p.dates?.end || 'विज्ञप्ति देखें',
          state: p.state || (p.categories?.includes('mp_special') ? 'MP' : 'Central'),
          qualification: p.eligibility,
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
        }));

      // Deduplicate by ID
      const existingIds = new Set(mapped.map((m) => m.id));
      const rest = LATEST_JOBS_DATA.filter((j) => !existingIds.has(j.id) && !existingIds.has(j.slug || ''));
      setLiveJobs([...mapped, ...rest]);
    });

    return () => {
      isMounted = false;
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
    <div className="min-h-screen bg-neutral-100/70 text-neutral-900 flex flex-col font-sans antialiased">
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
      <main className="flex-1 w-full">
        {/* Trending Cards Grid */}
        <TrendingGrid onSelectCard={handleSelectTrendingCard} />

        {/* Fixed / Prominent Service Banner (Nitish Khobragade 8982324497) */}
        <ProminentServiceBanner />

        {/* Middle In-Feed AdSense Container */}
        <AdSenseBanner slotType="in-feed" id="middle-infeed-adsense" />

        {/* SarkariResult Style 3-Column Layout (Jobs, Admit Card, Results/Keys) */}
        <ThreeColumnLayout
          jobs={liveJobs}
          admitCards={ADMIT_CARD_DATA}
          results={RESULTS_DATA}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
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
