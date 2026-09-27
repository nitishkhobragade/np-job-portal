"use client";

import React, { useState } from 'react';
import {
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
  X
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

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
      <Header />

      {/* DESKTOP TOP HORIZONTAL TOOL BAR (Laptop/Desktop View) - Ultra Sleek & Compact */}
      <nav className="hidden lg:block bg-white border-b border-neutral-200 sticky top-[49px] sm:top-[53px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
          {/* Desktop Horizontal Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {TOOLS_CONFIG.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTool(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xs'
                      : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-red-600'}`} />
                  <span className="whitespace-nowrap">{t.shortName}</span>
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-full font-black uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-xs font-semibold text-neutral-500 shrink-0 border-l border-neutral-200 pl-3">
            सक्रिय: <span className="font-black text-red-600">{currentTool.shortName}</span>
          </div>
        </div>
      </nav>

      {/* MOBILE SCREEN TOP STRIP WITH SIDEBAR TRIGGER & QUICK SCROLL - Compact */}
      <div className="lg:hidden bg-white border-b border-neutral-200 sticky top-[45px] z-30 shadow-xs px-2.5 py-1.5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold shadow-xs active:scale-95 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5 text-amber-300" />
            <span>सभी टूल्स ({TOOLS_CONFIG.length})</span>
          </button>

          <span className="text-xs font-black text-red-700 truncate max-w-[180px]">
            {currentTool.shortName}
          </span>
        </div>

        {/* Mobile Horizontal Quick Pills */}
        <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
          {TOOLS_CONFIG.map((t) => {
            const Icon = t.icon;
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTool(t.id)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                }`}
              >
                <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-red-600'}`} />
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
          </div>
        </div>
      )}

      {/* MAIN TOOL WORKSPACE CONTAINER */}
      <main id="tool-workspace" className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-3 sm:py-4">
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
      </main>

      <Footer />
    </div>
  );
}
