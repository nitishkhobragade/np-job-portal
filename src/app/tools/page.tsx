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
  X,
  Search,
  Image as ImageIcon,
  Scissors,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  ArrowLeft,
  Grid,
  Shuffle,
  Trash2,
  Sun,
  Moon,
  Menu
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ToolErrorBoundary } from '../../components/tools/ToolErrorBanner';

// Lightweight fallback while tool lazily loads
function ToolLoadingSkeleton() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 sm:p-12 text-center shadow-lg space-y-4 animate-pulse">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20">
        <RefreshCw className="w-7 h-7 animate-spin text-red-500" />
      </div>
      <div>
        <h3 className="text-base font-black text-slate-100">
          टूल लोड हो रहा है... (Tool Loading)
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          100% Client-Side Private Engine — सुरक्षित ब्राउज़र प्रोसेसिंग
        </p>
      </div>
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-400 font-semibold pt-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>आपका डेटा हमारे सर्वर पर नहीं भेजा जा रहा है</span>
      </div>
    </div>
  );
}

// Dynamic Imports for Sub-Second Lazy Loading
const SmartPassportMakerTool = dynamic(
  () => import('../../components/tools/SmartPassportMakerTool').then((m) => m.SmartPassportMakerTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

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

const UniversalConvertToPdfTool = dynamic(
  () => import('../../components/tools/UniversalConvertToPdfTool').then((m) => m.UniversalConvertToPdfTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfToImagesTool = dynamic(
  () => import('../../components/tools/PdfToImagesTool').then((m) => m.PdfToImagesTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfRearrangeTool = dynamic(
  () => import('../../components/tools/PdfRearrangeTool').then((m) => m.PdfRearrangeTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfRemovePagesTool = dynamic(
  () => import('../../components/tools/PdfRemovePagesTool').then((m) => m.PdfRemovePagesTool),
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

const WordToPdfTool = dynamic(
  () => import('../../components/tools/WordToPdfTool').then((m) => m.WordToPdfTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const PdfToWordTool = dynamic(
  () => import('../../components/tools/PdfToWordTool').then((m) => m.PdfToWordTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const OcrWordTool = dynamic(
  () => import('../../components/tools/OcrWordTool').then((m) => m.OcrWordTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

const AgeCalculatorTool = dynamic(
  () => import('../../components/tools/AgeCalculatorTool').then((m) => m.AgeCalculatorTool),
  { loading: () => <ToolLoadingSkeleton />, ssr: false }
);

export type ToolId =
  | 'photo-resizer'
  | 'smart-passport-maker'
  | 'name-date-photo'
  | 'image-joiner'
  | 'signature-resizer'
  | 'format-converter'
  | 'pdf-compress'
  | 'convert-to-pdf'
  | 'pdf-to-images'
  | 'pdf-rearrange'
  | 'pdf-remove-pages'
  | 'pdf-merge'
  | 'pdf-split-unlock'
  | 'document-enhancer'
  | 'image-increaser'
  | 'word-to-pdf'
  | 'pdf-to-word'
  | 'ocr-word'
  | 'age-calculator';

export type CategoryFilter = 'all' | 'image' | 'pdf' | 'converters' | 'utility';

interface ToolItem {
  id: ToolId;
  name: string;
  shortName: string;
  hindiName: string;
  category: 'image' | 'pdf' | 'converters' | 'utility';
  categoryLabel: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  description: string;
  orderNumber: number;
  keywords: string[];
}

// STRICT ORDERING: IMAGE TOOLS FIRST (1-6), THEN PDF TOOLS (7-12), THEN CONVERTERS & UTILITIES
const TOOLS_CONFIG: ToolItem[] = [
  // 📷 IMAGE TOOLS (1 to 6)
  {
    id: 'photo-resizer',
    name: 'Image Size Reducer in KB',
    shortName: 'Image Size Reducer',
    hindiName: 'इमेज साइज़ कम करें (Target KB)',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: 'SSC/MPESB/UPSC',
    icon: Camera,
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10 border-red-500/30',
    description: 'कस्टम Target KB इनपुट + सरकारी परीक्षा प्रीसेट्स (SSC 20-50KB, MPESB 40-100KB, UPSC, Railway)। 100% सटीक साइज़।',
    orderNumber: 1,
    keywords: ['image compressor in kb', 'reduce image size to 20kb 50kb 100kb online', 'photo resizer', 'ssc photo', 'mpesb']
  },
  {
    id: 'smart-passport-maker',
    name: 'Passport Size Photo Maker (AI Smart Scanner)',
    shortName: 'Passport Photo Maker',
    hindiName: 'स्मार्ट पासपोर्ट फोटो मेकर (4 कॉर्नर स्ट्रेटनर + AI इरेज़र)',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: 'AI 4-Corner Warp • AI Object Remover',
    icon: Camera,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    description: 'टेबल पर रखी टेढ़ी-मेढ़ी पासपोर्ट फोटो को मोबाइल बैक कैमरा से खींचकर अपलोड करें। 4 कॉर्नर चुनकर सीधा करें और AI से उंगली/परछाई मिटाकर 3.5×4.5cm SSC/MPESB फोटो तैयार करें।',
    orderNumber: 2,
    keywords: ['passport size photo maker', 'straighten angled passport photo', 'ai object remover passport photo', 'mobile camera passport photo', 'स्मार्ट पासपोर्ट फोटो']
  },
  {
    id: 'name-date-photo',
    name: 'Name and Signature on Photo (नाम व हस्ताक्षर/तारीख)',
    shortName: 'Name & Signature on Photo',
    hindiName: 'फोटो पर नाम, दिनांक (DOP) व हस्ताक्षर',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: '3.5 × 4.5 cm • DOP + Sign',
    icon: Type,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    description: 'पासपोर्ट फोटो पर उम्मीदवार का नाम, फोटो खींचने की तारीख (DOP) तथा नीचे या ऊपर डिजिटल हस्ताक्षर जोड़ें व तुरंत डाउनलोड करें।',
    orderNumber: 3,
    keywords: ['name and signature on photo', 'name date on photo', 'dop maker ssc', 'police photo date signature', 'फोटो पर नाम व हस्ताक्षर']
  },
  {
    id: 'image-joiner',
    name: 'Multi Image Joiner',
    shortName: 'Multi Image Joiner',
    hindiName: 'मल्टी इमेज जॉइनर (Horizontal / Vertical)',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: 'Multi Image Joiner',
    icon: Layers,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/30',
    description: 'ऑनलाइन फॉर्म हेतु 2 या अधिक फोटो, मार्कशीट, या फोटो+सिग्नेचर को एक साथ क्षैतिज (Horizontal) या लंबवत (Vertical) जोड़ें व टारगेट KB में डाउनलोड करें।',
    orderNumber: 4,
    keywords: ['multi image joiner', 'photo signature joiner online for mponline ssc', 'merge multiple images', 'तस्वीरें जोड़ें', 'multi image combiner']
  },
  {
    id: 'signature-resizer',
    name: 'Signature Resizer & Cleaner',
    shortName: 'Signature Cleaner',
    hindiName: 'हस्ताक्षर साफ व रिसाइज़ (10-20KB)',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: '10-20 KB MP Online',
    icon: Feather,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'सिग्नेचर से छाया व पीलापन हटाएं, डार्क B&W इंक और MP Online / SSC 10-20 KB नियम अनुसार परफेक्ट फिट करें।',
    orderNumber: 5,
    keywords: ['signature resizer 10 to 20 kb', 'clean signature background', 'black and white signature', 'हस्ताक्षर साफ करें']
  },
  {
    id: 'format-converter',
    name: 'Image Format Converter',
    shortName: 'Format Converter',
    hindiName: 'JPG / PNG / WEBP / BMP कनवर्टर',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: 'Instant Convert',
    icon: FileType,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    description: 'JPG, PNG, WEBP, और BMP के बीच बिना क्वालिटी खोए तुरंत क्लाइंट-साइड फॉर्मेट रूपांतरण करें।',
    orderNumber: 6,
    keywords: ['image format converter', 'png to jpg', 'webp to jpg', 'jpg to png', 'इमेज कनवर्टर']
  },

  // 📄 PDF TOOLS (7 to 12)
  {
    id: 'pdf-compress',
    name: 'PDF Target KB Compressor',
    shortName: 'PDF Target Compressor',
    hindiName: 'PDF साइज़ कम करें (<200KB)',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: '100 / 200 / 300 KB',
    icon: Minimize2,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    description: 'टारगेट साइज KB इनपुट + क्विक चिप्स (100KB, 200KB, 300KB) एवं सख्त गारंटी कि PDF टारगेट साइज से 1 KB भी ऊपर नहीं जाएगी।',
    orderNumber: 7,
    keywords: ['pdf compressor under 200kb for sarkari form', 'reduce pdf size in kb', 'pdf compress online free', 'पीडीएफ कंप्रेस']
  },
  {
    id: 'convert-to-pdf',
    name: 'Universal Convert to PDF (Multi-Format Hub)',
    shortName: 'Convert to PDF Hub',
    hindiName: 'किसी भी फ़ाइल को PDF बनाएं',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'Images & Docs',
    icon: FileText,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 border-indigo-500/30',
    description: 'ड्रॉपडाउन से चुनें: JPG, PNG, WEBP, SVG, TIFF, Word (.docx), Excel (.xlsx), PPTX, व Text से A4 PDF बनाएं।',
    orderNumber: 8,
    keywords: ['convert word docx to pdf free', 'universal convert to pdf', 'image to pdf', 'excel to pdf', 'convert to pdf']
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Image Converter (300 DPI)',
    shortName: 'PDF to Images HD',
    hindiName: 'PDF से हाई-रेज़ोल्यूशन फोटो निकालें',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: '300 DPI HD • ZIP',
    icon: ImageIcon,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/30',
    description: 'PDF के सभी पेजों को 300 DPI अल्ट्रा HD JPG/PNG/WEBP में निकालें। सिंगल पेज अथवा पूरी ZIP डाउनलोड करें।',
    orderNumber: 9,
    keywords: ['pdf to jpg converter hd', 'extract images from pdf 300 dpi', 'pdf to png zip', 'पीडीएफ टू फोटो']
  },
  {
    id: 'pdf-rearrange',
    name: 'Re-arrange PDF Pages',
    shortName: 'Re-arrange Pages',
    hindiName: 'PDF पेज क्रम बदलें (Drag & Drop)',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'Drag & Drop',
    icon: Shuffle,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/30',
    description: 'थंबनेल ग्रिड में पेजों को ड्रैग-एंड-ड्रॉप अथवा तीरों से अपनी इच्छानुसार क्रमबद्ध करें और पुनर्व्यवस्थित PDF निर्यात करें।',
    orderNumber: 10,
    keywords: ['rearrange pdf pages free', 'reorder pdf pages online', 'organize pdf pages', 'पेज क्रम बदलें']
  },
  {
    id: 'pdf-remove-pages',
    name: 'Remove / Delete PDF Pages',
    shortName: 'Remove PDF Pages',
    hindiName: 'PDF से अवांछित पेज हटाएं',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'Click to Delete',
    icon: Trash2,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    description: 'इंटरैक्टिव ग्रिड में किसी भी अवांछित या खाली पेज पर क्लिक करके उसे तुरंत हटाएं अथवा पेज रेंज (1, 3, 5-7) डालकर डिलीट करें।',
    orderNumber: 11,
    keywords: ['remove pages from pdf', 'delete pages from pdf online free', 'remove blank pages from pdf', 'पेज हटाएं']
  },
  {
    id: 'pdf-merge',
    name: 'Merge / Split PDF Files',
    shortName: 'Merge & Split PDF',
    hindiName: 'PDF फाइलें जोड़ें या अलग करें',
    category: 'pdf',
    categoryLabel: '📄 PDF Tools',
    badge: 'Combine / Split',
    icon: Scissors,
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/30',
    description: 'कई अलग-अलग PDF को एक साथ जोड़ें (Merge) या किसी बड़ी PDF से अपनी पसंद की पेज रेंज अलग (Split) करें।',
    orderNumber: 12,
    keywords: ['merge pdf files online free', 'split pdf by page range', 'combine pdf documents', 'पीडीएफ जोड़ें']
  },

  // 🔄 CONVERTERS & UTILITIES (13 to 18)
  {
    id: 'document-enhancer',
    name: 'Document Scanner & Cleaner',
    shortName: 'Doc Scanner',
    hindiName: 'दस्तावेज़ स्कैनर व साफ करें',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: 'Clean B&W',
    icon: Wand2,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'मोबाइल से खींची अंकसूची, आधार व प्रमाण पत्र से पीलापन और अंधेरा हटाकर साफ B&W प्रिंटर कॉपी तैयार करें।',
    orderNumber: 13,
    keywords: ['clean marksheet', 'document scanner online', 'enhance certificate', 'दस्तावेज़ साफ करें']
  },
  {
    id: 'image-increaser',
    name: 'Image Size Increaser (Target KB Boost)',
    shortName: 'Image Size Increaser',
    hindiName: 'इमेज साइज़ बढ़ाएं (Min KB Boost)',
    category: 'image',
    categoryLabel: '📷 Image Tools',
    badge: 'KB Booster',
    icon: ArrowUpRight,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border-orange-500/30',
    description: 'यदि सरकारी पोर्टल पर फोटो 20KB या 50KB से कम होने पर रिजेक्ट हो रही है, तो बिना क्वालिटी घटे तुरंत साइज़ बढ़ाएं।',
    orderNumber: 14,
    keywords: ['increase image size in kb', 'boost image kb', 'make photo bigger kb', 'साइज़ बढ़ाएं']
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word Converter (.docx)',
    shortName: 'PDF to Word',
    hindiName: 'PDF से वर्ड फाइल (.docx) बनाएं',
    category: 'converters',
    categoryLabel: '🔄 Converters',
    badge: '.docx Editable',
    icon: FileType,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/30',
    description: 'PDF से टेक्स्ट व संरचना निकालकर वास्तविक एडिटेबल Microsoft Word (.docx) फाइल तैयार करें।',
    orderNumber: 15,
    keywords: ['pdf to word converter free', 'convert pdf to editable docx', 'पीडीएफ टू वर्ड']
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF Converter (.docx to PDF)',
    shortName: 'Word to PDF',
    hindiName: 'Word फाइल से PDF बनाएं',
    category: 'converters',
    categoryLabel: '🔄 Converters',
    badge: 'A4 Print Ready',
    icon: FileText,
    iconColor: 'text-rose-400',
    iconBg: 'bg-rose-500/10 border-rose-500/30',
    description: 'Microsoft Word (.docx) दस्तावेज को मानक A4 पोर्ट्रेट PDF में बदलें। सरकारी नौकरी पोर्टल अपलोड हेतु उपयुक्त।',
    orderNumber: 16,
    keywords: ['word to pdf converter', 'docx to pdf online free', 'वर्ड से पीडीएफ']
  },
  {
    id: 'ocr-word',
    name: 'PDF / Image to OCR Word & Text',
    shortName: 'OCR to Word',
    hindiName: 'स्कैन फोटो से टेक्स्ट व Word बनाएं',
    category: 'converters',
    categoryLabel: '🔄 Converters',
    badge: 'हिंदी + English',
    icon: Sparkles,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 border-yellow-500/30',
    description: 'स्कैन की गई फोटो या PDF से हिंदी व अंग्रेज़ी टेक्स्ट पहचानकर एडिटेबल Word (.docx) व Text बनाएं।',
    orderNumber: 17,
    keywords: ['image ocr to word', 'extract hindi text from image', 'scanned pdf to text', 'ओसीआर']
  },
  {
    id: 'age-calculator',
    name: 'Sarkari Exam Age Calculator',
    shortName: 'Age Calculator',
    hindiName: 'आयु कैलकुलेटर (कट-ऑफ पात्रता)',
    category: 'utility',
    categoryLabel: '🧮 Utility Tools',
    badge: 'वर्ष-माह-दिन',
    icon: Calendar,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'विभिन्न सरकारी भर्तियों (MP Police, SSC, MPESB, Army) की कट-ऑफ तारीख के अनुसार अपनी सटीक आयु व पात्रता तुरंत जांचें।',
    orderNumber: 18,
    keywords: ['sarkari age calculator', 'dob age calculator cutoff', 'mp police age limit calculator', 'आयु कैलकुलेटर']
  }
];

export default function ToolsPage() {
  const router = useRouter();

  // Mode: 'grid' (PDF24 style landing) or 'workspace' (active single tool)
  const [viewMode, setViewMode] = useState<'grid' | 'workspace'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== 'grid' && hash !== 'all') {
        const found = TOOLS_CONFIG.find((t) => t.id === hash);
        if (found) return 'workspace';
      }
    }
    return 'grid';
  });
  const [activeTool, setActiveTool] = useState<ToolId>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const found = TOOLS_CONFIG.find((t) => t.id === hash);
      if (found) return found.id;
    }
    return 'photo-resizer';
  });
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Theme: 'light' (default) or 'dark'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('np_tools_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    }
    return 'light'; // Default to light theme as requested
  });

  // Tools Sidebar / Drawer state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('np_tools_theme', next);
      }
      return next;
    });
  }, []);

  // Refs for bulletproof back-button and hash protection
  const viewModeRef = React.useRef(viewMode);
  const activeToolRef = React.useRef(activeTool);
  const isExitingConfirmedRef = React.useRef(false);

  useEffect(() => {
    viewModeRef.current = viewMode;
    activeToolRef.current = activeTool;
  }, [viewMode, activeTool]);

  // Sync when hash changes externally & protect against accidental back
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');

      // If user was in active workspace and hasn't confirmed exit, accidental back button clicked!
      if (viewModeRef.current === 'workspace' && !isExitingConfirmedRef.current) {
        if (!hash || hash === 'grid' || hash === 'all' || hash !== activeToolRef.current) {
          // Re-lock the hash immediately to keep user on tool
          window.location.hash = activeToolRef.current;
          setShowExitModal(true);
          return;
        }
      }

      if (hash && hash !== 'grid' && hash !== 'all') {
        const found = TOOLS_CONFIG.find((t) => t.id === hash);
        if (found) {
          setActiveTool(found.id);
          setViewMode('workspace');
          return;
        }
      }

      if (isExitingConfirmedRef.current || viewModeRef.current !== 'workspace') {
        setViewMode('grid');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // ACCIDENTAL BACK BUTTON & EXIT PREVENTION SYSTEM
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Ensure there is always an internal history state to intercept
    if (viewMode === 'workspace') {
      window.history.pushState({ page: 'tools-workspace', tool: activeTool }, '', `/tools#${activeTool}`);
    }

    const handlePopState = () => {
      if (viewModeRef.current === 'workspace' && !isExitingConfirmedRef.current) {
        // ALWAYS re-push history state to prevent unconfirmed exit
        window.history.pushState({ page: 'tools-workspace', tool: activeToolRef.current }, '', `/tools#${activeToolRef.current}`);
        // Trigger the explicit confirmation modal
        setShowExitModal(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (viewModeRef.current === 'workspace') {
        e.preventDefault();
        e.returnValue = 'आपके द्वारा किए गए बदलाव या फ़ाइल रिसेट हो सकती है। क्या आप सच में छोड़ना चाहते हैं?';
        return e.returnValue;
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [viewMode, activeTool]);

  const handleConfirmExit = useCallback(() => {
    isExitingConfirmedRef.current = true;
    setShowExitModal(false);
    if (viewMode === 'workspace') {
      setViewMode('grid');
      if (typeof window !== 'undefined') {
        window.history.replaceState({ page: 'tools-grid' }, '', '/tools');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      router.push('/');
    }
    setTimeout(() => {
      isExitingConfirmedRef.current = false;
    }, 400);
  }, [viewMode, router]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const requestBackToGrid = useCallback(() => {
    // Show confirmation modal before leaving the active tool workspace
    setShowExitModal(true);
  }, []);

  // Filter tools based on category and search query
  const filteredTools = useMemo(() => {
    return TOOLS_CONFIG.filter((tool) => {
      if (activeCategory !== 'all') {
        if (activeCategory === 'image' && tool.category !== 'image') return false;
        if (activeCategory === 'pdf' && tool.category !== 'pdf') return false;
        if (activeCategory === 'converters' && tool.category !== 'converters') return false;
        if (activeCategory === 'utility' && tool.category !== 'utility') return false;
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

  const openTool = (id: ToolId) => {
    setActiveTool(id);
    setViewMode('workspace');
    if (typeof window !== 'undefined') {
      window.history.pushState({ page: 'tools-workspace', tool: id, view: 'workspace' }, '', `/tools#${id}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentTool = TOOLS_CONFIG.find((t) => t.id === activeTool) || TOOLS_CONFIG[0];
  const CurrentToolIcon = currentTool.icon;

  const imageCount = TOOLS_CONFIG.filter((t) => t.category === 'image').length;
  const pdfCount = TOOLS_CONFIG.filter((t) => t.category === 'pdf').length;
  const convCount = TOOLS_CONFIG.filter((t) => t.category === 'converters').length;
  const utilCount = TOOLS_CONFIG.filter((t) => t.category === 'utility').length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
    }`}>
      {/* Schema.org WebApplication Metadata for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "NP Job Portal Document & Image Tools Suite",
            "url": "https://npjobportal.com/tools",
            "applicationCategory": "UtilitiesApplication",
            "operatingSystem": "All",
            "author": {
              "@type": "Person",
              "name": "Nitish Khobragade",
              "jobTitle": "Founder & Career Counselor",
              "telephone": "+918982324497"
            },
            "publisher": {
              "@type": "Organization",
              "name": "NP Job Portal — A Unit of NTechBay",
              "url": "https://npjobportal.com"
            },
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "INR"
            },
            "description": "100% Free Client-Side Document & Image Tools Suite: Image compressor in KB, Passport photo maker with DOP, Signature resizer 10-20KB, PDF compressor under 200KB, Universal convert to PDF, PDF to Images 300 DPI, Re-arrange PDF pages, Remove PDF pages, and Age Calculator."
          })
        }}
      />

      <Header />

      {/* ACCIDENTAL EXIT MODAL WITH CONTEXT-AWARE WARNING */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className={`rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border space-y-4 ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-700 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900 shadow-2xl'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="w-7 h-7 animate-pulse text-amber-500" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-base sm:text-lg font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {viewMode === 'workspace'
                    ? '⚠️ क्या आप वापस जाना चाहते हैं?'
                    : 'पोर्टल मुख्य पेज पर जाने की पुष्टि'}
                </h3>
                <p className={`text-xs sm:text-sm mt-1.5 leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {viewMode === 'workspace' ? (
                    <>
                      आप अभी <strong className="text-amber-500 font-bold">{currentTool.name}</strong> में काम कर रहे हैं। यदि आप वापस जाएंगे, तो आपकी अपलोड की गई फ़ाइल व प्रोग्रेस रिसेट हो सकती है। क्या आप सच में वापस जाना चाहते हैं?
                    </>
                  ) : (
                    'क्या आप टूल्स पेज छोड़कर NP Job Portal के मुख्य पेज पर वापस जाना चाहते हैं?'
                  )}
                </p>
                <p className={`text-[11px] mt-1.5 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  (Accidental back prevented: Do you want to go back? Unsaved progress will be discarded.)
                </p>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2.5 pt-3 border-t ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                type="button"
                onClick={handleCancelExit}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black cursor-pointer transition-all shadow-md active:scale-95"
              >
                {viewMode === 'workspace' ? 'नहीं, काम जारी रखें (Stay Here)' : 'नहीं, यहीं रहें'}
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black cursor-pointer transition-all shadow-sm active:scale-95"
              >
                {viewMode === 'workspace' ? 'हाँ, वापस जाएं (Leave)' : 'हाँ, मुख्य पेज पर जाएं'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STICKY TOP SUB-HEADER: SEARCH, FILTERS, SIDEBAR DRAWER & THEME TOGGLE */}
      <nav className={`sticky top-[48px] sm:top-[52px] z-30 shadow-md transition-colors duration-200 border-b ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Left: View Mode Indicator & Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 min-w-0 flex-1">
              {viewMode === 'workspace' && (
                <button
                  type="button"
                  onClick={requestBackToGrid}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="सभी टूल्स की ग्रिड सूची देखें"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">← ग्रिड</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  if (viewMode === 'workspace') requestBackToGrid();
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'all' && viewMode === 'grid'
                    ? 'bg-red-600 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                सभी ({TOOLS_CONFIG.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('image');
                  if (viewMode === 'workspace') requestBackToGrid();
                }}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'image' && viewMode === 'grid'
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-rose-300 border border-rose-500/20'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Image ({imageCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('pdf');
                  if (viewMode === 'workspace') requestBackToGrid();
                }}
                className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'pdf' && viewMode === 'grid'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-purple-300 border border-purple-500/20'
                    : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF ({pdfCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('converters');
                  if (viewMode === 'workspace') requestBackToGrid();
                }}
                className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'converters' && viewMode === 'grid'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-blue-300 border border-blue-500/20'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                }`}
              >
                <FileType className="w-3.5 h-3.5" />
                <span>Converters ({convCount})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('utility');
                  if (viewMode === 'workspace') requestBackToGrid();
                }}
                className={`hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shrink-0 transition-all cursor-pointer ${
                  activeCategory === 'utility' && viewMode === 'grid'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-700 text-white shadow-xs'
                    : theme === 'dark'
                    ? 'bg-slate-800/80 hover:bg-slate-700 text-teal-300 border border-teal-500/20'
                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Utility ({utilCount})</span>
              </button>
            </div>

            {/* Right: Quick Search Box & Tools Sidebar Drawer Button & Theme Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Compact Search Box */}
              <div className="relative w-28 sm:w-44 md:w-52">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="टूल खोजें..."
                  className={`w-full pl-8 pr-6 py-1.5 text-xs rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:outline-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:bg-slate-900'
                      : 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer ${
                      theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Theme Toggle Button (Never cut off) */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border shrink-0 ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-2xs'
                }`}
                title={theme === 'dark' ? 'लाइट मोड (Switch to Light Mode)' : 'डार्क मोड (Switch to Dark Mode)'}
                aria-label="Theme Toggle"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>

              {/* Tools Sidebar Drawer Button (User explicitly requested!) */}
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black bg-red-600 hover:bg-red-700 text-white cursor-pointer shrink-0 shadow-xs active:scale-95"
                title="सभी टूल्स साइडबार मेनू (Tools Sidebar Drawer)"
              >
                <Menu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">टूल्स सूची</span>
                <span className="sm:hidden">टूल्स</span>
                <span className="text-[10px] bg-black/30 text-white px-1.5 py-0.2 rounded-full font-mono ml-0.5">
                  {TOOLS_CONFIG.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* SLIDE-OVER TOOLS SIDEBAR / DRAWER */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Sidebar Drawer Panel */}
          <aside className={`relative w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-250 border-l ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Drawer Header */}
            <div className={`p-4 border-b flex items-center justify-between ${
              theme === 'dark' ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center border border-red-500/20 font-black">
                  🛠️
                </div>
                <div>
                  <h3 className="text-sm font-black">सभी ऑनलाइन टूल्स सुइट</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">18+ सरकारी फॉर्म व फोटो टूल्स</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Search & Category Tabs */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="टूल नाम से खोजें..."
                  className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-500 focus:outline-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-950 border border-slate-700 text-slate-100'
                      : 'bg-slate-100 border border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
                {(['all', 'image', 'pdf', 'converters', 'utility'] as CategoryFilter[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-red-600 text-white'
                        : theme === 'dark'
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'all' ? 'सभी' : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Tool Items */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredTools.map((t) => {
                const Icon = t.icon;
                const isCurrent = activeTool === t.id && viewMode === 'workspace';
                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      openTool(t.id);
                      setSidebarOpen(false);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isCurrent
                        ? 'border-red-500 bg-red-500/10'
                        : theme === 'dark'
                        ? 'bg-slate-850 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                        : 'bg-white border-slate-200 hover:border-red-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${t.iconBg}`}>
                        <Icon className={`w-4 h-4 ${t.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">#{t.orderNumber}</span>
                          <h4 className="text-xs font-black truncate">{t.shortName}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{t.hindiName}</p>
                      </div>
                    </div>

                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                      {t.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PRIMARY VIEW: PDF24-STYLE RESPONSIVE CARD GRID LANDING HUB   */}
      {/* ============================================================== */}
      {viewMode === 'grid' && (
        <section className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6">
          {/* Hero Banner Header */}
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h1 className={`text-xl sm:text-3xl lg:text-4xl font-black tracking-tight ${
              theme === 'dark' ? 'text-white' : 'text-slate-900'
            }`}>
              सरकारी नौकरी फॉर्म <span className="text-red-600">फोटो व PDF टूल्स</span> सुइट
            </h1>

            <p className={`text-xs sm:text-sm leading-relaxed ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
            }`}>
              MP Online, SSC, UPSC, MP Police, Vyapam (MPESB) और रेलवे परीक्षाओं के ऑनलाइन आवेदन हेतु सभी आवश्यक टूल्स।
              आपका कोई भी दस्तावेज़ या फोटो हमारे सर्वर पर अपलोड नहीं होता।
            </p>
          </div>

          {/* PDF24-Style Responsive Card Grid: 2 cols on mobile, 3-4 on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5">
            {filteredTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => openTool(tool.id)}
                  className={`rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between p-3 sm:p-4 relative overflow-hidden ${
                    theme === 'dark'
                      ? 'bg-slate-900/90 border-slate-800 hover:border-red-500/60 hover:bg-slate-850 hover:shadow-xl hover:shadow-red-500/5'
                      : 'bg-white border-slate-200/90 hover:border-red-500/70 hover:shadow-xl hover:shadow-slate-300/60'
                  }`}
                >
                  {/* Top Badge & Number */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className={`text-[10px] font-mono ${
                      theme === 'dark' ? 'text-slate-500' : 'text-slate-400 font-semibold'
                    }`}>
                      #{tool.orderNumber < 10 ? `0${tool.orderNumber}` : tool.orderNumber}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full truncate max-w-[120px] ${
                      theme === 'dark'
                        ? 'bg-slate-800 text-slate-300 border border-slate-700/60'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {tool.badge}
                    </span>
                  </div>

                  {/* Icon & Title Inline (Reduces vertical space consumption) */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start gap-2 sm:gap-2.5">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-105 ${tool.iconBg}`}
                      >
                        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${tool.iconColor}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className={`text-xs sm:text-sm font-black transition-colors line-clamp-2 leading-snug ${
                          theme === 'dark'
                            ? 'text-white group-hover:text-red-400'
                            : 'text-slate-900 group-hover:text-red-600'
                        }`}>
                          {tool.name}
                        </h3>
                        <p className={`text-[11px] font-bold mt-0.5 line-clamp-1 ${
                          theme === 'dark' ? 'text-amber-400/90' : 'text-amber-700'
                        }`}>
                          {tool.hindiName}
                        </p>
                      </div>
                    </div>

                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${
                      theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {tool.description}
                    </p>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className={`pt-3 mt-3 border-t flex items-center justify-between text-[11px] font-black transition-colors ${
                    theme === 'dark'
                      ? 'border-slate-800/80 text-slate-300 group-hover:text-white'
                      : 'border-slate-100 text-slate-600 group-hover:text-red-600'
                  }`}>
                    <span>टूल खोलें (Open)</span>
                    <span className="text-red-500 group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTools.length === 0 && (
            <div className={`text-center py-12 rounded-2xl border p-8 space-y-3 ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <Search className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className={`text-sm font-black ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                &apos;{searchQuery}&apos; से संबंधित कोई टूल नहीं मिला
              </h3>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                कृपया अन्य कीवर्ड खोजें या श्रेणी फ़िल्टर बदलकर पुनः प्रयास करें।
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
              >
                सभी टूल्स रीसेट करें
              </button>
            </div>
          )}

          {/* Privacy & Safe Data Guarantee Card */}
          <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left ${
            theme === 'dark'
              ? 'bg-slate-900/60 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-800 shadow-xs'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className={`text-xs sm:text-sm font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                  100% सुरक्षित और निजी (Browser-Side Processing)
                </h4>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  आपकी कोई भी निजी फोटो, आधार कार्ड, मार्कशीट या पीडीएफ हमारे किसी भी सर्वर पर नहीं भेजी जाती।
                </p>
              </div>
            </div>

            <div className={`text-xs font-bold shrink-0 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>
              संस्थापक: Nitish Khobragade (8982324497)
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 2. SECONDARY VIEW: WORKSPACE FOR SELECTED TOOL                  */}
      {/* ============================================================== */}
      {viewMode === 'workspace' && (
        <div className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-4 py-3 sm:py-5">
          {/* Top Breadcrumb & Action Bar */}
          <div className={`border rounded-xl px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 shadow-sm mb-4 transition-colors ${
            theme === 'dark'
              ? 'bg-slate-900 border-slate-800 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={requestBackToGrid}
                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
                title="सभी टूल्स ग्रिड पर वापस जाएं (Back to Grid)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${currentTool.iconBg}`}>
                <CurrentToolIcon className={`w-4 h-4 ${currentTool.iconColor}`} />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className={`text-xs sm:text-sm font-black truncate ${
                    theme === 'dark' ? 'text-white' : 'text-slate-900'
                  }`}>
                    {currentTool.name}
                  </h1>
                  <span className="hidden sm:inline text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/30">
                    {currentTool.badge}
                  </span>
                </div>
                <p className={`text-[10px] sm:text-xs truncate ${
                  theme === 'dark' ? 'text-amber-400/90' : 'text-amber-700 font-medium'
                }`}>
                  {currentTool.hindiName}
                </p>
              </div>
            </div>

            {/* Quick Switch Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={requestBackToGrid}
                className={`hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700'
                    : 'text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>सभी टूल्स ग्रिड</span>
              </button>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">100% Safe (Local Browser)</span>
                <span className="sm:hidden">Safe</span>
              </div>
            </div>
          </div>

          {/* Quick Tool Pills Switcher Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none pb-3 mb-2">
            {TOOLS_CONFIG.map((t) => {
              const Icon = t.icon;
              const isActive = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openTool(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white shadow-xs ring-1 ring-red-500'
                      : theme === 'dark'
                      ? 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3 h-3 ${isActive ? 'text-white' : t.iconColor}`} />
                  <span>{t.shortName}</span>
                </button>
              );
            })}
          </div>

          {/* Error-Boundary Protected Tool Component */}
          <main id="tool-workspace" className="min-w-0">
            <ToolErrorBoundary toolName={currentTool.name}>
              {activeTool === 'photo-resizer' && <PhotoResizerTool />}
              {activeTool === 'smart-passport-maker' && <SmartPassportMakerTool />}
              {activeTool === 'name-date-photo' && <NameDateOnPhotoTool />}
              {activeTool === 'image-joiner' && <ImageJoinerTool />}
              {activeTool === 'signature-resizer' && <SignatureTool />}
              {activeTool === 'format-converter' && <FormatConverterTool />}
              {activeTool === 'pdf-compress' && <PdfCompressTool />}
              {activeTool === 'convert-to-pdf' && <UniversalConvertToPdfTool />}
              {activeTool === 'pdf-to-images' && <PdfToImagesTool />}
              {activeTool === 'pdf-rearrange' && <PdfRearrangeTool />}
              {activeTool === 'pdf-remove-pages' && <PdfRemovePagesTool />}
              {activeTool === 'pdf-merge' && <PdfMergeTool />}
              {activeTool === 'pdf-split-unlock' && <PdfSplitUnlockTool />}
              {activeTool === 'document-enhancer' && <DocumentEnhancerTool />}
              {activeTool === 'image-increaser' && <ImageSizeIncreaserTool />}
              {activeTool === 'word-to-pdf' && <WordToPdfTool />}
              {activeTool === 'pdf-to-word' && <PdfToWordTool />}
              {activeTool === 'ocr-word' && <OcrWordTool />}
              {activeTool === 'age-calculator' && <AgeCalculatorTool />}
            </ToolErrorBoundary>
          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}
