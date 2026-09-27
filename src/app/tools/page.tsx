"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
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
  X,
  Search,
  Image as ImageIcon,
  Scissors,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  RotateCw,
  AlertTriangle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ToolErrorBoundary } from '../../components/tools/ToolErrorBanner';

// Lightweight fallback while tool lazily loads
function ToolLoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center shadow-xs space-y-4 animate-pulse">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 text-red-600">
        <RefreshCw className="w-7 h-7 animate-spin text-red-600" />
      </div>
      <div>
        <h3 className="text-base font-black text-neutral-800">
          टूल लोड हो रहा है... (Tool Loading)
        </h3>
        <p className="text-xs text-neutral-500 mt-1">
          100% Client-Side Private Processing — हाई परफॉर्मेंस इंजन एक्टिवेट हो रहा है
        </p>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-700 font-semibold pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        <span>आपका डेटा पूरी तरह सुरक्षित है (Zero Server Latency)</span>
      </div>
    </div>
  );
}

// Dynamic Imports for Sub-Second Lazy Loading
const PhotoResizerTool = dynamic(
  () => import('../../components/tools/PhotoResizerTool').then((m) => m.PhotoResizerTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const NameDateOnPhotoTool = dynamic(
  () => import('../../components/tools/NameDateOnPhotoTool').then((m) => m.NameDateOnPhotoTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const SignatureTool = dynamic(
  () => import('../../components/tools/SignatureTool').then((m) => m.SignatureTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const ImageSizeIncreaserTool = dynamic(
  () => import('../../components/tools/ImageSizeIncreaserTool').then((m) => m.ImageSizeIncreaserTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const ImageJoinerTool = dynamic(
  () => import('../../components/tools/ImageJoinerTool').then((m) => m.ImageJoinerTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const FormatConverterTool = dynamic(
  () => import('../../components/tools/FormatConverterTool').then((m) => m.FormatConverterTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const DocumentEnhancerTool = dynamic(
  () => import('../../components/tools/DocumentEnhancerTool').then((m) => m.DocumentEnhancerTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfCompressTool = dynamic(
  () => import('../../components/tools/PdfCompressTool').then((m) => m.PdfCompressTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfToImagesTool = dynamic(
  () => import('../../components/tools/PdfToImagesTool').then((m) => m.PdfToImagesTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const ImageToPdfTool = dynamic(
  () => import('../../components/tools/ImageToPdfTool').then((m) => m.ImageToPdfTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfMergeTool = dynamic(
  () => import('../../components/tools/PdfMergeTool').then((m) => m.PdfMergeTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfSplitUnlockTool = dynamic(
  () => import('../../components/tools/PdfSplitUnlockTool').then((m) => m.PdfSplitUnlockTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfToWordTool = dynamic(
  () => import('../../components/tools/PdfToWordTool').then((m) => m.PdfToWordTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const WordToPdfTool = dynamic(
  () => import('../../components/tools/WordToPdfTool').then((m) => m.WordToPdfTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const OcrWordTool = dynamic(
  () => import('../../components/tools/OcrWordTool').then((m) => m.OcrWordTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfRotateOrganizeTool = dynamic(
  () => import('../../components/tools/PdfRotateOrganizeTool').then((m) => m.PdfRotateOrganizeTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const AgeCalculatorTool = dynamic(
  () => import('../../components/tools/AgeCalculatorTool').then((m) => m.AgeCalculatorTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

export type ToolId =
  | 'photo-resizer'
  | 'name-date-photo'
  | 'signature-resizer'
  | 'image-increaser'
  | 'image-joiner'
  | 'format-converter'
  | 'document-enhancer'
  | 'pdf-compress'
  | 'pdf-to-images'
  | 'image-to-pdf'
  | 'pdf-merge'
  | 'pdf-split-unlock'
  | 'pdf-to-word'
  | 'word-to-pdf'
  | 'ocr-word'
  | 'pdf-rotate-organize'
  | 'age-calculator';

export type CategoryFilter = 'all' | 'photo' | 'pdf' | 'word-ocr' | 'utility';

interface ToolItem {
  id: ToolId;
  name: string;
  shortName: string;
  hindiName: string;
  category: 'photo' | 'pdf' | 'word-ocr' | 'utility';
  categoryLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  keywords: string[];
}

const TOOLS_CONFIG: ToolItem[] = [
  // 📷 IMAGE TOOLS (फोटो व इमेज टूल्स)
  {
    id: 'photo-resizer',
    name: 'Photo Resizer & Target KB Compressor',
    shortName: 'Photo Resizer',
    hindiName: 'फोटो रिसाइज़र (20-50KB)',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: 'SSC/MPESB/UPSC',
    icon: Camera,
    description: 'पासपोर्ट फोटो को 20KB से 50KB, कस्टम KB और सही पिक्सेल आयाम (Checkbox Mode) में सेट करें',
    keywords: ['photo', 'compress', 'resize', 'image', 'kb', 'ssc', 'mpesb', 'upsc', 'railway', 'फोटो', 'रिसाइज़']
  },
  {
    id: 'name-date-photo',
    name: 'Name & Date of Photo (DOP) Maker',
    shortName: 'Name & Date on Photo',
    hindiName: 'फोटो पर नाम व तारीख लिखें',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: 'अनिवार्य नियम',
    icon: Type,
    description: 'SSC व MP Police नियम अनुसार 3.5cm x 4.5cm फोटो के नीचे सफेद पट्टी में नाम व तारीख (DOP) जोड़ें',
    keywords: ['name', 'date', 'dop', 'photo', 'ssc', 'police', 'नाम', 'तारीख', 'पट्टी']
  },
  {
    id: 'signature-resizer',
    name: 'Signature Resizer (10-20KB)',
    shortName: 'Signature Resizer',
    hindiName: 'हस्ताक्षर रिसाइज़र (10-20KB)',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: '10-20 KB',
    icon: Feather,
    description: 'सिग्नेचर के आयाम (Dimensions) बदलें, छाया हटाएं, डार्क B&W इंक व ओरिजिनल क्वालिटी या 10-20KB में डाउनलोड करें',
    keywords: ['signature', 'sign', '10kb', '20kb', 'हस्ताक्षर', 'सिग्नेचर', 'दस्तखत', 'dimension']
  },
  {
    id: 'image-increaser',
    name: 'Image Size Increaser (Target KB Boost)',
    shortName: 'Image Size Increaser',
    hindiName: 'इमेज साइज़ बढ़ाएं (Min KB)',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: 'नया टूल',
    icon: ArrowUpRight,
    description: 'यदि सरकारी पोर्टल पर फोटो 20KB/50KB से कम है, तो बिना क्वालिटी घटे फाइल साइज़ तुरंत बढ़ाएं',
    keywords: ['increase', 'size', 'increaser', 'boost', 'kb', 'साइज़ बढ़ाएं', 'बढ़ाएं']
  },
  {
    id: 'image-joiner',
    name: 'Image Joiner (इमेज जॉइनर)',
    shortName: 'Image Joiner',
    hindiName: 'तस्वीरें जोड़ें (Merge Images)',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: 'ओरिजिनल क्वालिटी',
    icon: Layers,
    description: '2 या अधिक तस्वीरों को एक साथ जोड़ें (Horizontal ↔ या Vertical ↕, ओरिजिनल क्वालिटी या टारगेट KB)',
    keywords: ['join', 'merge', 'image joiner', 'combine', 'जोड़ें', 'इमेज जॉइनर', 'तस्वीरें']
  },
  {
    id: 'format-converter',
    name: 'Image Format Converter',
    shortName: 'Format Converter',
    hindiName: 'JPG / PNG / WEBP / BMP कनवर्टर',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: 'JPG कन्वर्ट',
    icon: FileType,
    description: 'किसी भी इमेज (PNG, WEBP, BMP) को तुरंत सरकारी फॉर्म स्वीकृत JPG फॉर्मेट में बदलें',
    keywords: ['format', 'convert', 'jpg', 'png', 'webp', 'bmp', 'कनवर्टर', 'फॉर्मेट']
  },
  {
    id: 'document-enhancer',
    name: 'Document Scanner & Cleaner',
    shortName: 'Doc Scanner',
    hindiName: 'दस्तावेज़ स्कैनर व साफ करें',
    category: 'photo',
    categoryLabel: '📷 Image Tools',
    badge: 'क्लीन B&W',
    icon: Wand2,
    description: 'मोबाइल से खींची मार्कशीट व सर्टिफिकेट से पीलापन व अंधेरा हटाकर साफ B&W प्रिंटर कॉपी बनाएं',
    keywords: ['scanner', 'clean', 'marksheet', 'certificate', 'document', 'स्कैनर', 'साफ', 'मार्कशीट']
  },

  // 📄 PDF TOOLS (पीडीएफ टूल्स)
  {
    id: 'pdf-compress',
    name: 'PDF Target KB Compressor (<200KB)',
    shortName: 'PDF Compress',
    hindiName: 'PDF साइज़ कम करें (Target KB)',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: '100/200/300 KB',
    icon: Minimize2,
    description: 'पोर्टल अपलोड हेतु 1MB से बड़ी PDF को 100KB, 200KB या कस्टम Target KB में सीधे ब्राउज़र में छोटा करें',
    keywords: ['pdf', 'compress', 'reduce', 'size', 'kb', '200kb', 'पीडीएफ', 'छोटा', 'कंप्रेस']
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Images 300 DPI Ultra HD',
    shortName: 'PDF to Images',
    hindiName: 'PDF से फोटो निकालें (300 DPI)',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: '300 DPI HD',
    icon: ImageIcon,
    description: 'PDF के सभी पेजों को 300 DPI क्रिस्टल क्लियर हाई-रेज़ोल्यूशन JPG, PNG में निकालें और ZIP में डाउनलोड करें',
    keywords: ['pdf', 'images', 'jpg', 'png', 'extract', 'zip', '300 dpi', 'पीडीएफ फोटो', 'इमेज']
  },
  {
    id: 'image-to-pdf',
    name: 'Images to PDF Converter (A4)',
    shortName: 'Images to PDF',
    hindiName: 'फोटो से PDF बनाएं (A4)',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'A4 Single PDF',
    icon: FileText,
    description: 'मार्कशीट, आधार, जाति, निवास की कई फोटो को मिलाकर एक सिंगल A4 PDF दस्तावेज तैयार करें',
    keywords: ['image to pdf', 'photo to pdf', 'a4', 'combine', 'फोटो से पीडीएफ']
  },
  {
    id: 'pdf-merge',
    name: 'PDF Merge / Combine',
    shortName: 'Merge PDF',
    hindiName: 'PDF फाइलें जोड़ें (Merge)',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'कम्बाइन',
    icon: Layers,
    description: 'अलग-अलग PDF फाइलों को अपने इच्छित क्रम में री-ऑर्डर करके एक संयुक्त PDF में कम्बाइन करें',
    keywords: ['pdf merge', 'combine', 'join pdf', 'पीडीएफ जोड़ें', 'कम्बाइन']
  },
  {
    id: 'pdf-split-unlock',
    name: 'Split & Unlock PDF',
    shortName: 'Split / Unlock PDF',
    hindiName: 'PDF अलग करें या अनलॉक करें',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'पासवर्ड हटाएं',
    icon: Scissors,
    description: 'PDF से विशिष्ट पेज रेंज निकालें या पासवर्ड हटाकर बिना लॉक वाली PDF सुरक्षित डाउनलोड करें',
    keywords: ['split', 'unlock', 'password', 'range', 'extract', 'अनलॉक', 'पासवर्ड', 'पेज']
  },
  {
    id: 'pdf-rotate-organize',
    name: 'Rotate & Organize PDF Pages',
    shortName: 'Rotate / Organize PDF',
    hindiName: 'PDF पेज घुमाएं व हटाएं',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'पेज मैनेजमेंट',
    icon: RotateCw,
    description: 'PDF के किसी भी पेज को 90° घुमाएं, अवांछित पेज हटाएं या पेजों का क्रम आसानी से बदलें',
    keywords: ['rotate', 'organize', 'remove page', 'reorder', 'पेज घुमाएं', 'हटाएं']
  },

  // 📝 WORD & OCR TOOLS (वर्ड व ओसीआर टूल्स)
  {
    id: 'pdf-to-word',
    name: 'PDF to Word Converter (.docx)',
    shortName: 'PDF to Word',
    hindiName: 'PDF से वर्ड फाइल (.docx) बनाएं',
    category: 'word-ocr',
    categoryLabel: '📝 Word & OCR',
    badge: '.docx वर्ड',
    icon: FileType,
    description: 'PDF से टेक्स्ट व संरचना निकालकर वास्तविक एडिटेबल Microsoft Word (.docx) फाइल तैयार करें',
    keywords: ['pdf to word', 'docx', 'word', 'convert', 'पीडीएफ वर्ड']
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF Converter (.docx to PDF)',
    shortName: 'Word to PDF',
    hindiName: 'Word फाइल से PDF बनाएं',
    category: 'word-ocr',
    categoryLabel: '📝 Word & OCR',
    badge: 'A4 PDF',
    icon: FileText,
    description: 'Microsoft Word (.docx) दस्तावेज को सरकारी पोर्टल अपलोड हेतु तैयार A4 PDF में बदलें',
    keywords: ['word to pdf', 'docx to pdf', 'convert', 'वर्ड से पीडीएफ']
  },
  {
    id: 'ocr-word',
    name: 'PDF / Image to OCR Word & Text',
    shortName: 'OCR to Word',
    hindiName: 'स्कैन फोटो से टेक्स्ट व Word बनाएं',
    category: 'word-ocr',
    categoryLabel: '📝 Word & OCR',
    badge: 'हिंदी + English',
    icon: Sparkles,
    description: 'स्कैन की गई मार्कशीट या फोटो से हिंदी व अंग्रेज़ी टेक्स्ट पहचानकर एडिटेबल Word (.docx) व Text बनाएं',
    keywords: ['ocr', 'text', 'scanned', 'marksheet', 'hindi ocr', 'ओसीआर', 'टेक्स्ट पहचानें']
  },

  // 🧮 UTILITY TOOLS (अन्य सरकारी उपयोगिता)
  {
    id: 'age-calculator',
    name: 'Sarkari Exam Age Calculator',
    shortName: 'Age Calculator',
    hindiName: 'आयु कैलकुलेटर (कट-ऑफ)',
    category: 'utility',
    categoryLabel: '🧮 Utility Tools',
    badge: 'वर्ष-माह-दिन',
    icon: Calendar,
    description: 'विभिन्न सरकारी भर्तियों की कट-ऑफ तारीख के अनुसार अपनी सटीक आयु व पात्रता तुरंत जांचें',
    keywords: ['age', 'calculator', 'dob', 'cutoff', 'eligibility', 'आयु', 'उम्र', 'कैलकुलेटर']
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

  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // ACCIDENTAL BACK BUTTON PREVENTION
  useEffect(() => {
    // Push internal history state
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'tools-active' }, '');

      const handlePopState = () => {
        // Intercept back button, re-push state and display modal prompt
        window.history.pushState({ page: 'tools-active' }, '');
        setShowExitModal(true);
      };

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
      };

      window.addEventListener('popstate', handlePopState);
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('popstate', handlePopState);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  const handleConfirmExit = useCallback(() => {
    setShowExitModal(false);
    router.push('/');
  }, [router]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  // Filter tools based on category and search query
  const filteredTools = useMemo(() => {
    return TOOLS_CONFIG.filter((tool) => {
      if (activeCategory !== 'all' && tool.category !== activeCategory) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const inName = tool.name.toLowerCase().includes(q);
      const inShort = tool.shortName.toLowerCase().includes(q);
      const inHindi = tool.hindiName.toLowerCase().includes(q);
      const inDesc = tool.description.toLowerCase().includes(q);
      const inBadge = tool.badge.toLowerCase().includes(q);
      const inKeywords = tool.keywords.some((kw) => kw.toLowerCase().includes(q));
      return inName || inShort || inHindi || inDesc || inBadge || inKeywords;
    });
  }, [activeCategory, searchQuery]);

  const selectTool = (id: ToolId) => {
    setActiveTool(id);
    setMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`);
      const el = document.getElementById('tool-workspace');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const currentTool = TOOLS_CONFIG.find((t) => t.id === activeTool) || TOOLS_CONFIG[0];
  const CurrentToolIcon = currentTool.icon;

  const photoCount = TOOLS_CONFIG.filter((t) => t.category === 'photo').length;
  const pdfCount = TOOLS_CONFIG.filter((t) => t.category === 'pdf').length;
  const wordOcrCount = TOOLS_CONFIG.filter((t) => t.category === 'word-ocr').length;

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
      <Header />

      {/* ACCIDENTAL BACK BUTTON PREVENTION CONFIRMATION MODAL */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-neutral-900">
                  पेज छोड़ने की पुष्टि (Unsaved Work Warning)
                </h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  आपके कोई unsaved changes / unfinished task इस पेज पर तो नहीं हैं? क्या आप सच में वापस जाना चाहते हैं?
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  (Do you really want to leave this page?)
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={handleCancelExit}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-black shadow-xs cursor-pointer transition-colors"
              >
                नहीं, यहीं रहें (No, Stay on Page)
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
              >
                हाँ, वापस जाएं (Yes, Go Back)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP DESKTOP & TABLET SUB-HEADER: CATEGORY TABS & QUICK SEARCH */}
      <nav className="bg-white border-b border-neutral-200 sticky top-[48px] sm:top-[52px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                सभी टूल्स ({TOOLS_CONFIG.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'photo'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xs'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>📷 Image Tools ({photoCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'pdf'
                    ? 'bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-xs'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📄 PDF Tools ({pdfCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('word-ocr')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'word-ocr'
                    ? 'bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-xs'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>📝 Word &amp; OCR ({wordOcrCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('utility')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'utility'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>🧮 Utility</span>
              </button>
            </div>

            {/* Quick Search */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="टूल खोजें... (उदा. word, compress, merge)"
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-neutral-100 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden text-neutral-900 font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 cursor-pointer"
              >
                <Menu className="w-3.5 h-3.5 text-amber-300" />
                <span>मेनू</span>
              </button>
            </div>
          </div>

          {/* Quick Horizontal Tool Badges Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pt-2 pb-0.5">
            {filteredTools.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTool(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-700 text-white shadow-xs ring-1 ring-red-800'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : 'text-red-600'}`} />
                  <span>{t.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER WITH CATEGORIZATION & SEARCH */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="p-3.5 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black text-sm">
                  🛠️
                </div>
                <div>
                  <h3 className="text-sm font-black">सरकारी फॉर्म टूल सुइट</h3>
                  <p className="text-[10px] text-slate-400">100% Client-Side Private Suite</p>
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

            {/* Search within Drawer */}
            <div className="p-3 bg-neutral-50 border-b border-neutral-200">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="टूल खोजें... (उदा. photo, docx, PDF)"
                  className="w-full pl-8 pr-7 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden text-neutral-900"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Drawer Category Quick Chips */}
              <div className="flex gap-1 mt-2 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                    activeCategory === 'all'
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  सभी
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('photo')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                    activeCategory === 'photo'
                      ? 'bg-red-600 text-white'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  📷 Image
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('pdf')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                    activeCategory === 'pdf'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  📄 PDF
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCategory('word-ocr')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 cursor-pointer ${
                    activeCategory === 'word-ocr'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  📝 Word &amp; OCR
                </button>
              </div>
            </div>

            {/* Tool List in Drawer */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {filteredTools.map((t) => {
                const Icon = t.icon;
                const isActive = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTool(t.id)}
                    className={`w-full flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-50 border-2 border-red-600 text-red-950 shadow-xs'
                        : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black truncate">{t.shortName}</div>
                        <div className="text-[10px] text-neutral-500 font-medium truncate">
                          {t.hindiName}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-red-600 text-white' : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {t.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Privacy Trust Banner at Bottom */}
            <div className="p-3 bg-neutral-100 border-t border-neutral-200 text-[10px] text-neutral-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>100% Safe Data:</strong> सभी प्रक्रिया आपके डिवाइस में होती है, कोई डेटा सर्वर पर नहीं भेजा जाता।
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TOOL WORKSPACE CONTAINER WITH DUAL-COLUMN DESKTOP SIDEBAR + WORKSPACE */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
          {/* DESKTOP LEFT SIDEBAR: FILTERED TOOLS DIRECTORY */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-[138px] bg-white rounded-2xl border border-neutral-200 p-3 shadow-xs space-y-2.5 max-h-[calc(100vh-160px)] overflow-y-auto">
            <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100">
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                टूल डायरेक्टरी ({filteredTools.length}):
              </span>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                <ShieldCheck className="w-3 h-3" />
                क्लाइंट-साइड
              </span>
            </div>

            <div className="space-y-1">
              {filteredTools.map((t) => {
                const Icon = t.icon;
                const isActive = activeTool === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTool(t.id)}
                    className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-red-50 border border-red-600 text-red-950 font-bold shadow-2xs'
                        : 'bg-white hover:bg-neutral-50 border border-transparent text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate leading-tight">{t.shortName}</div>
                        <div className="text-[10px] text-neutral-500 truncate leading-tight">
                          {t.hindiName}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[8px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                        isActive ? 'bg-red-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {t.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-neutral-100 text-[10px] text-neutral-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>100% प्राइवेट व सुरक्षित प्रोसेसिंग</span>
            </div>
          </aside>

          {/* MAIN WORKSPACE COLUMN */}
          <main id="tool-workspace" className="lg:col-span-9 space-y-3 min-w-0">
            {/* Active Tool Top Status Bar */}
            <div className="bg-white border border-neutral-200 rounded-xl px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <CurrentToolIcon className="w-4 h-4 text-red-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xs sm:text-sm font-black text-neutral-900 truncate">
                      {currentTool.name}
                    </h1>
                    <span className="hidden sm:inline text-[9px] font-black uppercase px-2 py-0.2 rounded-full bg-red-100 text-red-800">
                      {currentTool.badge}
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-neutral-500 truncate">
                    {currentTool.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">100% Safe (Local Browser)</span>
                <span className="sm:hidden">100% Safe</span>
              </div>
            </div>

            {/* Error-Boundary Protected Tool Component */}
            <ToolErrorBoundary toolName={currentTool.name}>
              {activeTool === 'photo-resizer' && <PhotoResizerTool />}
              {activeTool === 'name-date-photo' && <NameDateOnPhotoTool />}
              {activeTool === 'signature-resizer' && <SignatureTool />}
              {activeTool === 'image-increaser' && <ImageSizeIncreaserTool />}
              {activeTool === 'image-joiner' && <ImageJoinerTool />}
              {activeTool === 'format-converter' && <FormatConverterTool />}
              {activeTool === 'document-enhancer' && <DocumentEnhancerTool />}
              {activeTool === 'pdf-compress' && <PdfCompressTool />}
              {activeTool === 'pdf-to-images' && <PdfToImagesTool />}
              {activeTool === 'image-to-pdf' && <ImageToPdfTool />}
              {activeTool === 'pdf-merge' && <PdfMergeTool />}
              {activeTool === 'pdf-split-unlock' && <PdfSplitUnlockTool />}
              {activeTool === 'pdf-to-word' && <PdfToWordTool />}
              {activeTool === 'word-to-pdf' && <WordToPdfTool />}
              {activeTool === 'ocr-word' && <OcrWordTool />}
              {activeTool === 'pdf-rotate-organize' && <PdfRotateOrganizeTool />}
              {activeTool === 'age-calculator' && <AgeCalculatorTool />}
            </ToolErrorBoundary>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}
