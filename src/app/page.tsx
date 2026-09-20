"use client";

import React, { useState } from 'react';
import { Header } from '../components/Header';
import { TopTicker } from '../components/TopTicker';
import { TrendingGrid } from '../components/TrendingGrid';
import { ThreeColumnLayout } from '../components/ThreeColumnLayout';
import { AdSenseBanner } from '../components/AdSenseBanner';
import { ProminentServiceBanner } from '../components/ProminentServiceBanner';
import { DetailModal } from '../components/DetailModal';
import { FloatingMobileBar } from '../components/FloatingMobileBar';
import { Footer } from '../components/Footer';
import {
  LATEST_JOBS_DATA,
  ADMIT_CARD_DATA,
  RESULTS_DATA
} from '../data/portalData';
import { JobItem, AdmitCardItem, ResultItem, TrendingCard } from '../types';

export default function NPJobPortalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Updates');

  // Modal State for Viewing Detailed Notification
  const [selectedItem, setSelectedItem] = useState<JobItem | AdmitCardItem | ResultItem | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'job' | 'admit' | 'result' | null>(null);

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
    // Find matching job in mock data or create preview
    const matchingJob = LATEST_JOBS_DATA.find((j) =>
      j.title.toLowerCase().includes(card.title.toLowerCase().slice(0, 10))
    );
    if (matchingJob) {
      setSelectedItem(matchingJob);
      setSelectedItemType('job');
    } else {
      // Fallback synthetic job item from trending card
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
      {/* 1. Top Alert / Ticker Bar (Breaking news with blinking red NEW badge) */}
      <TopTicker />

      {/* Main Header with Logo, Owner Info, WhatsApp and Search Navigation */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* 4. Top AdSense Banner (Responsive Leaderboard format) */}
      <AdSenseBanner slotType="leaderboard" id="header-leaderboard-adsense" />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {/* 2. Trending Cards Grid (6-8 colorful top cards) */}
        <TrendingGrid onSelectCard={handleSelectTrendingCard} />

        {/* 5. Fixed / Prominent Service Banner (Nitish Khobragade 8982324497) */}
        <ProminentServiceBanner />

        {/* 4. Middle In-Feed AdSense Container */}
        <AdSenseBanner slotType="in-feed" id="middle-infeed-adsense" />

        {/* 3. SarkariResult Style 3-Column Layout (Jobs, Admit Card, Results/Keys) */}
        <ThreeColumnLayout
          jobs={LATEST_JOBS_DATA}
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

      {/* Interactive Detail & Form Booking Modal */}
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
    </div>
  );
}
