"use client";

import React, { useState } from 'react';
import {
  Wrench,
  Camera,
  Type,
  Feather,
  FileText,
  Layers,
  Minimize2,
  FileType,
  Wand2,
  Calendar,
  Menu,
  X,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

// Modular Tool Components
import { PhotoResizerTool } from '../../components/tools/PhotoResizerTool';
import { NameDateOnPhotoTool } from '../../components/tools/NameDateOnPhotoTool';
import { SignatureTool } from '../../components/tools/SignatureTool';
import { ImageToPdfTool } from '../../components/tools/ImageToPdfTool';
import { PdfMergeTool } from '../../components/tools/PdfMergeTool';
import { PdfCompressTool } from '../../components/tools/PdfCompressTool';
import { FormatConverterTool } from '../../components/tools/FormatConverterTool';
import { DocumentEnhancerTool } from '../../components/tools/DocumentEnhancerTool';
import { AgeCalculatorTool } from '../../components/tools/AgeCalculatorTool';

export type ToolId =
  | 'photo-resizer'
  | 'name-date-photo'
  | 'signature-resizer'
  | 'image-to-pdf'
  | 'pdf-merge'
  | 'pdf-compress'
  | 'format-converter'
  | 'document-enhancer'
  | 'age-calculator';

interface ToolItem {
  id: ToolId;
  name: string;
  shortName: string;
  hindiName: string;
  category: 'photo' | 'pdf' | 'utility';
  categoryLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TOOLS_CONFIG: ToolItem[] = [
  {
    id: 'photo-resizer',
    name: 'Photo Resizer & KB Compressor',
    shortName: 'Photo Resizer',
    hindiName: 'फोटो रिसाइज़र (20-50KB)',
    category: 'photo',
    categoryLabel: 'इमेज / फोटो',
    badge: 'SSC/MP Police',
    icon: Camera,
    description: 'पासपोर्ट फोटो को 20KB से 50KB और सही पिक्सेल आयाम में सेट करें'
  },
  {
    id: 'name-date-photo',
    name: 'Name & Date of Photo (DOP)',
    shortName: 'Name & Date on Photo',
    hindiName: 'फोटो पर नाम व तारीख लिखें',
    category: 'photo',
    categoryLabel: 'इमेज / फोटो',
    badge: 'अनिवार्य नियम',
    icon: Type,
    description: 'SSC व MP Police नियम अनुसार फोटो के नीचे सफेद पट्टी में नाम व तारीख जोड़ें'
  },
  {
    id: 'signature-resizer',
    name: 'Signature Resizer (10-20KB)',
    shortName: 'Signature Resizer',
    hindiName: 'हस्ताक्षर रिसाइज़र (10-20KB)',
    category: 'photo',
    categoryLabel: 'इमेज / फोटो',
    badge: '10-20 KB',
    icon: Feather,
    description: 'सिग्नेचर से छाया हटाएं, स्याही डार्क करें और 10-20KB में डाउनलोड करें'
  },
  {
    id: 'image-to-pdf',
    name: 'Images to PDF Converter',
    shortName: 'Images to PDF',
    hindiName: 'फोटो से PDF बनाएं',
    category: 'pdf',
    categoryLabel: 'PDF टूल्स',
    badge: 'A4 Single PDF',
    icon: FileText,
    description: 'मार्कशीट, आधार, जाति, निवास की कई फोटो को मिलाकर एक A4 PDF बनाएं'
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merge / Combine',
    shortName: 'Merge PDF',
    hindiName: 'PDF जोड़ें (Merge)',
    category: 'pdf',
    categoryLabel: 'PDF टूल्स',
    badge: 'कम्बाइन',
    icon: Layers,
    description: 'अलग-अलग PDF फाइलों को एक क्रम में जोड़कर सिंगल PDF फाइल बनाएं'
  },
  {
    id: 'pdf-compress',
    name: 'PDF Size Reducer (<200KB)',
    shortName: 'PDF Compress',
    hindiName: 'PDF साइज़ कम करें (<200KB)',
    category: 'pdf',
    categoryLabel: 'PDF टूल्स',
    badge: '200 KB लिमिट',
    icon: Minimize2,
    description: 'पोर्टल अपलोड हेतु 1MB से बड़ी PDF को 200KB से 300KB के अंदर छोटा करें'
  },
  {
    id: 'format-converter',
    name: 'Image Format Converter',
    shortName: 'Format Converter',
    hindiName: 'JPG / PNG / WEBP कनवर्टर',
    category: 'photo',
    categoryLabel: 'इमेज / फोटो',
    badge: 'JPG कन्वर्ट',
    icon: FileType,
    description: 'किसी भी इमेज (PNG, WEBP) को तुरंत सरकारी फॉर्म स्वीकृत JPG में बदलें'
  },
  {
    id: 'document-enhancer',
    name: 'Document Scanner & Cleaner',
    shortName: 'Doc Scanner',
    hindiName: 'दस्तावेज़ स्कैनर व साफ करें',
    category: 'utility',
    categoryLabel: 'स्कैनर व उपयोगिता',
    badge: 'क्लीन B&W',
    icon: Wand2,
    description: 'मोबाइल से खींचे सर्टिफिकेट से पीलापन व अंधेरा हटाकर साफ प्रिंटर कॉपी बनाएं'
  },
  {
    id: 'age-calculator',
    name: 'Sarkari Age Calculator',
    shortName: 'Age Calculator',
    hindiName: 'आयु कैलकुलेटर (कट-ऑफ)',
    category: 'utility',
    categoryLabel: 'स्कैनर व उपयोगिता',
    badge: 'वर्ष-माह-दिन',
    icon: Calendar,
    description: 'विभिन्न भर्तियों की कट-ऑफ तारीख के अनुसार अपनी सटीक आयु व पात्रता जानें'
  }
];

export default function ToolsPage() {
  const [activeTool, setActiveTool] = useState<ToolId>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const validTool = TOOLS_CONFIG.find((t) => t.id === hash);
      if (validTool) return validTool.id;
    }
    return 'photo-resizer';
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'photo' | 'pdf' | 'utility'>('all');

  const selectTool = (id: ToolId) => {
    setActiveTool(id);
    setMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
      // Scroll to tool area smoothly on mobile
      const el = document.getElementById('tool-workspace');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const currentTool = TOOLS_CONFIG.find((t) => t.id === activeTool) || TOOLS_CONFIG[0];

  const filteredTools = TOOLS_CONFIG.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
      <Header />

      {/* Hero Header Strip */}
      <section className="bg-slate-950 text-white border-b border-slate-800 py-4 sm:py-6 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xs">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Sarkari Form Utility Tools</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/80">
                  <CheckCircle2 className="w-3 h-3" />
                  100% Free & Unlimited
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight">
                सरकारी फॉर्म फोटो, हस्ताक्षर व PDF टूल्स (All-In-One Hub)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                SSC, MP Police, व्यापम, Railway और UPSC फॉर्म भरने के लिए फोटो रिसाइज़, नाम-दिनांक, सिग्नेचर 10-20KB और PDF कनवर्टर।
              </p>
            </div>

            {/* Zero-Storage Privacy Guarantee Pill */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-inner text-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-white flex items-center gap-1">
                  <span>नो-डेटाबेस प्राइवेसी</span>
                  <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-black">100% Client-Side</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  फाइल आपके ब्राउज़र में ही प्रोसेस होती है और डाउनलोड के बाद स्वतः समाप्त हो जाती है।
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESKTOP TOP HORIZONTAL TOOL BAR (Laptop/Desktop View) */}
      <nav className="hidden lg:block bg-white border-b border-neutral-200 sticky top-[72px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-2 border-b border-neutral-100">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-extrabold text-neutral-500 uppercase tracking-wider text-[11px] mr-1">
                फिल्टर:
              </span>
              {[
                { key: 'all', label: 'सभी टूल्स (All 9 Tools)' },
                { key: 'photo', label: '📸 फोटो व सिग्नेचर' },
                { key: 'pdf', label: '📄 PDF टूल्स' },
                { key: 'utility', label: '🧮 स्कैनर व आयु' }
              ].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCategory(c.key as 'all' | 'photo' | 'pdf' | 'utility')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activeCategory === c.key
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-neutral-500">
              सक्रिय टूल: <span className="font-black text-red-600">{currentTool.hindiName}</span>
            </div>
          </div>

          {/* Desktop Horizontal Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
            {filteredTools.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTool(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md scale-102 ring-2 ring-red-400/30'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-red-600'}`} />
                  <span className="whitespace-nowrap">{t.shortName}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* MOBILE SCREEN TOP STRIP WITH SIDEBAR TRIGGER & QUICK SCROLL */}
      <div className="lg:hidden bg-white border-b border-neutral-200 sticky top-14 z-30 shadow-xs px-3 py-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
          >
            <Menu className="w-4 h-4 text-amber-300" />
            <span>सभी टूल्स सूची ({TOOLS_CONFIG.length})</span>
          </button>

          <span className="text-xs font-black text-red-700 truncate max-w-[180px]">
            {currentTool.shortName}
          </span>
        </div>

        {/* Mobile Horizontal Quick Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          {TOOLS_CONFIG.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTool(t.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-red-600'}`} />
                <span>{t.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBILE SCREEN SLIDE-OVER SIDEBAR (Drawer) */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-sm">
                  🛠️
                </div>
                <div>
                  <h3 className="text-sm font-black">सभी सरकारी फॉर्म टूल्स</h3>
                  <p className="text-[10px] text-slate-400">अपनी जरूरत अनुसार टूल चुनें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tool List in Drawer */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="text-[11px] font-black uppercase tracking-wider text-neutral-400 px-2 py-1">
                उपलब्ध टूल्स (Select Tool):
              </div>
              {TOOLS_CONFIG.map((t) => {
                const Icon = t.icon;
                const isActive = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTool(t.id)}
                    className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-50 border-2 border-red-600 text-red-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{t.name}</div>
                        <div className="text-[11px] text-neutral-500 font-medium truncate">
                          {t.hindiName}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {t.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer Notice */}
            <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-[10px] text-neutral-500 text-center">
              🔒 100% प्राइवेट: आपकी कोई भी फोटो सर्वर पर सेव नहीं होती है।
            </div>
          </div>
        </div>
      )}

      {/* MAIN TOOL WORKSPACE CONTAINER */}
      <main id="tool-workspace" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-6">
        {/* Render Selected Tool Component */}
        {activeTool === 'photo-resizer' && <PhotoResizerTool />}
        {activeTool === 'name-date-photo' && <NameDateOnPhotoTool />}
        {activeTool === 'signature-resizer' && <SignatureTool />}
        {activeTool === 'image-to-pdf' && <ImageToPdfTool />}
        {activeTool === 'pdf-merge' && <PdfMergeTool />}
        {activeTool === 'pdf-compress' && <PdfCompressTool />}
        {activeTool === 'format-converter' && <FormatConverterTool />}
        {activeTool === 'document-enhancer' && <DocumentEnhancerTool />}
        {activeTool === 'age-calculator' && <AgeCalculatorTool />}

        {/* Quick FAQ / Official Specs Grid */}
        <section className="mt-12 bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-neutral-900">
                प्रमुख सरकारी परीक्षाओं हेतु फोटो, सिग्नेचर व डॉक्यूमेंट नियम (Official Rules)
              </h3>
              <p className="text-xs text-neutral-500">
                गलत साइज़ या बिना नाम-दिनांक की फोटो अपलोड करने से फॉर्म रिजेक्ट हो जाता है। नीचे दिए गए आधिकारिक नियमों का पालन करें:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
              <span className="font-black text-red-700 text-sm flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>1. पासपोर्ट फोटो नियम</span>
              </span>
              <ul className="space-y-1.5 text-neutral-700">
                <li>• साइज़: 20 KB से 50 KB (SSC/UPSC) तथा 40 KB से 100 KB (व्यापम)</li>
                <li>• बैकग्राउंड: सफेद (Light/White background) होना चाहिए</li>
                <li>• चश्मा व टोपी: चश्मा, टोपी व मास्क पहनकर ली गई फोटो अमान्य है</li>
                <li>• दोनों कान व चेहरा 80% साफ दिखाई देना चाहिए</li>
              </ul>
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
              <span className="font-black text-emerald-700 text-sm flex items-center gap-1.5">
                <Feather className="w-4 h-4" />
                <span>2. हस्ताक्षर (Signature) नियम</span>
              </span>
              <ul className="space-y-1.5 text-neutral-700">
                <li>• साइज़: 10 KB से 20 KB (SSC/Bank) तथा 140x60 पिक्सेल</li>
                <li>• कागज: सफेद कोरे कागज पर काली स्याही (Black Ink) से साइन करें</li>
                <li>• कैपिटल लेटर्स में पूरा साइन न करें, सामान्य रनिंग हैंडराइटिंग रखें</li>
                <li>• मोबाइल से खींचते समय बैकग्राउंड की छाया पूरी तरह हटाएं</li>
              </ul>
            </div>

            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2">
              <span className="font-black text-indigo-700 text-sm flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>3. प्रमाण पत्र व PDF नियम</span>
              </span>
              <ul className="space-y-1.5 text-neutral-700">
                <li>• साइज़: अधिकांश पोर्टल्स पर 200 KB से 300 KB का सीमा प्रतिबंध होता है</li>
                <li>• 10वीं मार्कशीट (DOB सत्यापन हेतु) तथा जाति प्रमाण पत्र अनिवार्य</li>
                <li>• दोनों तरफ का आधार कार्ड एक ही सिंगल पेज PDF में होना चाहिए</li>
                <li>• साफ स्कैन कॉपी अपलोड करें ताकि अनुक्रमांक व नाम पठनीय रहे</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
