"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Download, Search, MessageCircle, ArrowLeft } from 'lucide-react';
import { Header } from '../../../components/Header';
import { Footer } from '../../../components/Footer';

interface SyllabusItem {
  id: string;
  title: string;
  department: string;
  year: string;
  type: 'Syllabus' | 'Rulebook';
  pdfUrl: string;
  pagesOrSize: string;
  keyTopics: string[];
}

const SYLLABUS_DATA: SyllabusItem[] = [
  {
    id: 'mp-police-syllabus-2026',
    title: 'MP Police Constable भर्ती 2026 - विस्तृत परीक्षा पाठ्यक्रम एवं नियम पुस्तिका',
    department: 'Madhya Pradesh Employees Selection Board (MPESB)',
    year: '2026',
    type: 'Rulebook',
    pdfUrl: 'https://esb.mp.gov.in',
    pagesOrSize: '48 Pages (Official PDF)',
    keyTopics: ['सामान्य ज्ञान एवं तार्किक ज्ञान (40 अंक)', 'बौद्धिक क्षमता एवं मानसिक अभिरुचि (30 अंक)', 'विज्ञान एवं सरल अंक गणित (30 अंक)', 'शारीरिक दक्षता परीक्षण (PET) मानदंड']
  },
  {
    id: 'mp-sub-eng-syllabus-2026',
    title: 'MPESB Group-3 Sub Engineer, Draftsman भर्ती 2026 विस्तृत सिलेबस',
    department: 'MPESB Bhopal',
    year: '2026',
    type: 'Syllabus',
    pdfUrl: 'https://esb.mp.gov.in',
    pagesOrSize: '24 Pages PDF',
    keyTopics: ['भाग-1: सामान्य ज्ञान, हिंदी, अंग्रेजी, गणित, तर्कशक्ति, विज्ञान व कंप्यूटर (100 अंक)', 'भाग-2: संबंधित इंजीनियरिंग ट्रेड विषय (सिविल/इलेक्ट्रिकल/मैकेनिकल) (100 अंक)']
  },
  {
    id: 'ssc-chsl-syllabus-2026',
    title: 'SSC CHSL (10+2) भर्ती 2026 - Tier 1 & Tier 2 नया एग्जाम पैटर्न एवं सिलेबस',
    department: 'Staff Selection Commission (SSC)',
    year: '2026',
    type: 'Syllabus',
    pdfUrl: 'https://ssc.gov.in',
    pagesOrSize: '65 Pages Notice',
    keyTopics: ['English Language', 'General Intelligence', 'Quantitative Aptitude (Basic Arithmetic Skills)', 'General Awareness', 'Computer Knowledge & Skill/Typing Test']
  },
  {
    id: 'railway-rrc-group-d-2026',
    title: 'Railway RRC Group D 2026 CBT विस्तृत परीक्षा पाठ्यक्रम एवं अंक विभाजन',
    department: 'Railway Recruitment Boards (RRB)',
    year: '2026',
    type: 'Syllabus',
    pdfUrl: 'https://indianrailways.gov.in',
    pagesOrSize: '36 Pages',
    keyTopics: ['General Science (25 Marks)', 'Mathematics (25 Marks)', 'General Intelligence & Reasoning (30 Marks)', 'General Awareness and Current Affairs (20 Marks)']
  },
  {
    id: 'mp-tet-varg-3-2026',
    title: 'MP TET प्राथमिक शिक्षक पात्रता परीक्षा (वर्ग 3) 2026 विस्तृत नियम पुस्तिका',
    department: 'स्कूल शिक्षा एवं जनजातीय कार्य विभाग म.प्र.',
    year: '2026',
    type: 'Rulebook',
    pdfUrl: 'https://esb.mp.gov.in',
    pagesOrSize: '40 Pages',
    keyTopics: ['बाल विकास एवं शिक्षाशास्त्र (Child Development)', 'भाषा 1 (हिंदी)', 'भाषा 2 (अंग्रेजी/संस्कृत/उर्दू)', 'गणित', 'पर्यावरण अध्ययन (EVS)']
  }
];

export default function SyllabusCategoryPage() {
  const [search, setSearch] = useState('');

  const filtered = SYLLABUS_DATA.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase()) ||
      item.keyTopics.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-4">
          <Link href="/" className="hover:text-red-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>होम</span>
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-bold">सिलेबस एवं नियम पुस्तिकाएं</span>
        </div>

        {/* Header */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 shadow-xs mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            Official Exam Syllabus & Rulebooks
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mb-2">
            सरकारी भर्ती सिलेबस एवं नियम पुस्तिकाएं (Syllabus & Rulebooks)
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-3xl">
            मध्य प्रदेश एवं केंद्रीय सरकारी भर्तियों के आधिकारिक परीक्षा पाठ्यक्रम (Syllabus), अंक योजना, चयन प्रक्रिया एवं विस्तृत नियम पुस्तिकाएं। तैयारी व फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।
          </p>

          <div className="mt-4 max-w-md">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="सिलेबस खोजें: MP Police, SSC, Group D, Varg 3..."
                className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:border-red-600"
              />
            </div>
          </div>
        </div>

        {/* List of Syllabus Items */}
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs hover:border-red-300 transition-colors"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      item.type === 'Rulebook' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                    }`}>
                      {item.type}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500">{item.department}</span>
                    <span className="text-xs font-bold text-neutral-700 font-mono">({item.year})</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-neutral-900">
                    {item.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-xs shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>नियम पुस्तिका देखें</span>
                  </a>
                  <a
                    href={`https://wa.me/918982324497?text=नमस्ते%20Nitish%20Ji,%20मुझे%20${encodeURIComponent(item.title)}%20का%20सिलेबस%20और%20फॉर्म%20की%20जानकारी%20चाहिए।`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    title="व्हाट्सएप पर सहायता"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white" />
                    <span>सहायता</span>
                  </a>
                </div>
              </div>

              <div className="pt-3">
                <div className="text-xs font-bold text-neutral-700 mb-1.5">
                  प्रमुख विषय एवं अंक संरचना (Topics Covered):
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.keyTopics.map((top, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-md bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200">
                      • {top}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
