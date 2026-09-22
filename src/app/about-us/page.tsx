"use client";

import React, { useState } from 'react';
import {
  FileText,
  GraduationCap,
  Monitor,
  Cpu,
  Building2,
  KeyRound,
  CreditCard,
  TrendingUp,
  MessageCircle,
  Phone,
  CheckCircle2,
  Sparkles,
  Zap,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ContactModal } from '../../components/ContactModal';
import { OWNER_INFO } from '../../data/portalData';

interface VibrantServiceCard {
  id: string;
  serviceKey: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  tag: string;
  theme: {
    border: string;
    borderHover: string;
    cardBg: string;
    iconBg: string;
    iconColor: string;
    tagBg: string;
    tagColor: string;
    tagBorder: string;
    btnBg: string;
    glowShadow: string;
  };
  bullets: string[];
  btnText: string;
  whatsappMessage: string;
}

const SERVICES_DATA: VibrantServiceCard[] = [
  {
    id: 'govt-private-forms',
    serviceKey: 'सरकारी व निजी फॉर्म',
    icon: FileText,
    title: 'सरकारी व निजी फॉर्म',
    tag: '100% एरर-फ्री',
    theme: {
      border: 'border-blue-500/30',
      borderHover: 'hover:border-blue-500',
      cardBg: 'from-blue-50/50 via-white to-white',
      iconBg: 'bg-blue-100 text-blue-600',
      iconColor: 'text-blue-600',
      tagBg: 'bg-blue-50',
      tagColor: 'text-blue-700',
      tagBorder: 'border-blue-200',
      btnBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white',
      glowShadow: 'hover:shadow-blue-500/10'
    },
    bullets: [
      'MPESB, SSC, UPSC, Railway, Police, Teaching फॉर्म्स',
      'मानक अनुसार फोटो-सिग्नेचर रिसाइज़िंग',
      'सबमिशन से पूर्व प्रीव्यू सत्यापन एवं अधिकृत रसीद'
    ],
    btnText: 'व्हाट्सएप पर फॉर्म भरवाएं →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se सरकारी व निजी फॉर्म (Govt Forms) ke liye sampark kiya hai.'
  },
  {
    id: 'scholarship-forms',
    serviceKey: 'छात्रवृत्ति (Scholarship)',
    icon: GraduationCap,
    title: 'छात्रवृत्ति (Scholarship)',
    tag: 'गारंटीड सबमिशन',
    theme: {
      border: 'border-amber-500/30',
      borderHover: 'hover:border-amber-500',
      cardBg: 'from-amber-50/50 via-white to-white',
      iconBg: 'bg-amber-100 text-amber-600',
      iconColor: 'text-amber-600',
      tagBg: 'bg-amber-50',
      tagColor: 'text-amber-800',
      tagBorder: 'border-amber-200',
      btnBg: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white',
      glowShadow: 'hover:shadow-amber-500/10'
    },
    bullets: [
      'MP Post Matric, NSP, मेधावी छात्र योजना',
      'आय-जाति प्रमाण पत्र लिंकिंग',
      'कॉलेज प्रोफाइल मैपिंग व कोर्स चयन सत्यापन'
    ],
    btnText: 'स्कॉलरशिप फॉर्म भरवाएं →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se छात्रवृत्ति (Scholarship) ke liye sampark kiya hai.'
  },
  {
    id: 'windows-os-setup',
    serviceKey: 'Windows 10/11 इंस्टॉलेशन',
    icon: Monitor,
    title: 'Windows 10/11 इंस्टॉलेशन',
    tag: 'Hardware & OS',
    theme: {
      border: 'border-indigo-500/30',
      borderHover: 'hover:border-indigo-500',
      cardBg: 'from-indigo-50/50 via-white to-white',
      iconBg: 'bg-indigo-100 text-indigo-600',
      iconColor: 'text-indigo-600',
      tagBg: 'bg-indigo-50',
      tagColor: 'text-indigo-700',
      tagBorder: 'border-indigo-200',
      btnBg: 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white',
      glowShadow: 'hover:shadow-indigo-500/10'
    },
    bullets: [
      'फ्रेश व क्लीन ओएस सेटअप (Win 10/11 Pro)',
      'स्लो लैपटॉप स्पीड बूस्टिंग व ट्यून-अप',
      'ऑडियो, डिस्प्ले व वाईफाई ड्राइवर्स अपडेट',
      'पर्सनल डेटा 100% सुरक्षित'
    ],
    btnText: 'विंडोज सेटअप करवाएं →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se Windows 10/11 इंस्टॉलेशन ke liye sampark kiya hai.'
  },
  {
    id: 'ms-office-suite',
    serviceKey: 'MS Office एक्टिवेशन',
    icon: Cpu,
    title: 'MS Office एक्टिवेशन',
    tag: 'Full Productivity',
    theme: {
      border: 'border-rose-500/30',
      borderHover: 'hover:border-rose-500',
      cardBg: 'from-rose-50/50 via-white to-white',
      iconBg: 'bg-rose-100 text-rose-600',
      iconColor: 'text-rose-600',
      tagBg: 'bg-rose-50',
      tagColor: 'text-rose-700',
      tagBorder: 'border-rose-200',
      btnBg: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white',
      glowShadow: 'hover:shadow-rose-500/10'
    },
    bullets: [
      'Word, Excel, PowerPoint पूर्ण पैकेज',
      'लाइफटाइम जेनुइन एक्टिवेशन',
      'ऑफिशियल व स्टूडेंट उपयोग हेतु रेडी',
      'हिंदी टाइपिंग फॉन्ट व टूल्स इंस्टॉलेशन'
    ],
    btnText: 'ऑफिस पैकेज एक्टिव करवाएं →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se MS Office एक्टिवेशन ke liye sampark kiya hai.'
  },
  {
    id: 'npci-dbt-mapping',
    serviceKey: 'NPCI / DBT बैंक लिंकिंग',
    icon: Building2,
    title: 'NPCI / DBT बैंक लिंकिंग',
    tag: 'Direct Benefit',
    theme: {
      border: 'border-emerald-500/30',
      borderHover: 'hover:border-emerald-500',
      cardBg: 'from-emerald-50/50 via-white to-white',
      iconBg: 'bg-emerald-100 text-emerald-600',
      iconColor: 'text-emerald-600',
      tagBg: 'bg-emerald-50',
      tagColor: 'text-emerald-700',
      tagBorder: 'border-emerald-200',
      btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white',
      glowShadow: 'hover:shadow-emerald-500/10'
    },
    bullets: [
      'लाड़ली बहना, पीएम किसान व स्कॉलरशिप राशि हेतु आधार-NPCI मैपिंग स्टेटस जांच',
      'बैंक खाता डीबीटी एक्टिवेशन समाधान',
      'रुकी हुई किश्त पुनः चालू कराने का मार्गदर्शन'
    ],
    btnText: 'DBT स्टेटस चेक करवाएं →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se NPCI / DBT बैंक लिंकिंग ke liye sampark kiya hai.'
  },
  {
    id: 'net-banking-recovery',
    serviceKey: 'नेट बैंकिंग पासवर्ड रीसेट',
    icon: KeyRound,
    title: 'नेट बैंकिंग पासवर्ड रीसेट',
    tag: '100% सुरक्षित',
    theme: {
      border: 'border-purple-500/30',
      borderHover: 'hover:border-purple-500',
      cardBg: 'from-purple-50/50 via-white to-white',
      iconBg: 'bg-purple-100 text-purple-600',
      iconColor: 'text-purple-600',
      tagBg: 'bg-purple-50',
      tagColor: 'text-purple-700',
      tagBorder: 'border-purple-200',
      btnBg: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white',
      glowShadow: 'hover:shadow-purple-500/10'
    },
    bullets: [
      'बैंक प्रोफाइल पासवर्ड, लॉगिन पासवर्ड व ट्रांजैक्शन पासवर्ड भूल जाने पर बैंक मानकों अनुसार सुरक्षित रिकवरी',
      'यूजर आईडी अनब्लॉक व ई-स्टेटमेंट एक्टिवेशन',
      'पूर्ण गोपनीयता का 100% पालन'
    ],
    btnText: 'पासवर्ड रीसेट सहायता →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se नेट बैंकिंग पासवर्ड रीसेट ke liye sampark kiya hai.'
  },
  {
    id: 'credit-card-assistance',
    serviceKey: 'क्रेडिट कार्ड अप्लाई / ब्लॉक',
    icon: CreditCard,
    title: 'क्रेडिट कार्ड अप्लाई / ब्लॉक',
    tag: 'Banking Help',
    theme: {
      border: 'border-teal-500/30',
      borderHover: 'hover:border-teal-500',
      cardBg: 'from-teal-50/50 via-white to-white',
      iconBg: 'bg-teal-100 text-teal-600',
      iconColor: 'text-teal-600',
      tagBg: 'bg-teal-50',
      tagColor: 'text-teal-700',
      tagBorder: 'border-teal-200',
      btnBg: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white',
      glowShadow: 'hover:shadow-teal-500/10'
    },
    bullets: [
      'लाइफटाइम फ्री (LTF) क्रेडिट कार्ड आवेदन',
      'चोरी या गुम होने पर तुरंत कार्ड ब्लॉकिंग व फ्रॉड प्रोटेक्शन गाइडेंस',
      'क्रेडिट कार्ड लिमिट वृद्धि परामर्श'
    ],
    btnText: 'क्रेडिट कार्ड सहायता लें →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se क्रेडिट कार्ड अप्लाई / ब्लॉक ke liye sampark kiya hai.'
  },
  {
    id: 'cibil-score-guidance',
    serviceKey: 'CIBIL स्कोर सुधार सलाह',
    icon: TrendingUp,
    title: 'CIBIL स्कोर सुधार सलाह',
    tag: 'क्रेडिट स्कोर बूस्टर',
    theme: {
      border: 'border-fuchsia-500/30',
      borderHover: 'hover:border-fuchsia-500',
      cardBg: 'from-fuchsia-50/50 via-white to-white',
      iconBg: 'bg-fuchsia-100 text-fuchsia-600',
      iconColor: 'text-fuchsia-600',
      tagBg: 'bg-fuchsia-50',
      tagColor: 'text-fuchsia-700',
      tagBorder: 'border-fuchsia-200',
      btnBg: 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white',
      glowShadow: 'hover:shadow-fuchsia-500/10'
    },
    bullets: [
      'कम सिबिल स्कोर से लोन नहीं मिल रहा?',
      'डिफॉल्ट्स क्लियर करने व सिबिल 750+ करने हेतु एक्सपर्ट कंसल्टेंसी',
      'CIBIL रिपोर्ट गहन विश्लेषण व नो-ड्यूज (NOC) निपटान'
    ],
    btnText: 'सिबिल सुधार परामर्श लें →',
    whatsappMessage: 'नमस्ते Nitish ji, maine NP Job Portal se CIBIL स्कोर सुधार सलाह ke liye sampark kiya hai.'
  }
];

export default function AboutUsServicesPage() {
  const [contactModalOpen, setContactModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header />

      {/* 1. COMPACT HERO BANNER (REDUCED PADDING BY 70%) */}
      <section className="bg-gradient-to-r from-slate-950 via-neutral-900 to-red-950 text-white border-b border-red-800/50 py-5 sm:py-7 px-4 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Compact Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-amber-300 text-[11px] font-bold tracking-wide">
                <Zap className="w-3 h-3 text-amber-400" />
                ⚡ 100% विश्वसनीय डिजिटल समाधान
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-[11px] font-bold">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                ⭐ 8+ वर्ष का तकनीकी अनुभव
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
              <span className="text-white">NP Job Portal • </span>
              <span className="bg-gradient-to-r from-red-400 via-rose-300 to-amber-300 bg-clip-text text-transparent">
                डिजिटल सेवाएं एवं टेक क्लीनिक
              </span>
            </h1>

            {/* Sub-strip */}
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              संचालक: <strong className="text-white font-bold">{OWNER_INFO.name}</strong> ({OWNER_INFO.phone}) | <span className="text-amber-300 font-semibold">घर बैठे त्वरित एवं सुरक्षित समाधान</span>
            </p>
          </div>

          {/* Quick Action Bar (Two Compact Pills) */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>📞 डायरेक्ट कॉल करें</span>
            </button>

            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>💬 व्हाट्सएप पर बात करें</span>
            </a>
          </div>
        </div>
      </section>

      {/* 2. VIBRANT 3D / COLOR-CODED SERVICE CARDS */}
      <main className="max-w-7xl mx-auto px-3 py-4 sm:py-6 flex-1 w-full space-y-4">
        {/* Section Intro Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
              <span>हमारी प्रमुख सेवाएं (All Tech & Digital Services)</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              किसी भी सेवा हेतु संबंधित कार्ड के बटन पर टैप करें — व्हाट्सएप पर त्वरित सीधा समाधान मिलेगा
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold self-start sm:self-auto">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
              <Check className="w-3 h-3 text-emerald-600" /> 100% ऑनलाइन
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> सुरक्षित भुगतान
            </span>
          </div>
        </div>

        {/* 8 Vibrant Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {SERVICES_DATA.map((card) => {
            const Icon = card.icon;
            const waUrl = `https://wa.me/918982324497?text=${encodeURIComponent(card.whatsappMessage)}`;

            return (
              <div
                key={card.id}
                className={`bg-gradient-to-b ${card.theme.cardBg} rounded-xl border ${card.theme.border} ${card.theme.borderHover} p-3.5 sm:p-4 shadow-xs hover:shadow-lg ${card.theme.glowShadow} hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group`}
              >
                <div>
                  {/* Card Header: Icon & Tag Pill */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className={`w-9 h-9 rounded-lg ${card.theme.iconBg} flex items-center justify-center shrink-0 shadow-xs group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${card.theme.tagBg} ${card.theme.tagColor} ${card.theme.tagBorder}`}>
                      {card.tag}
                    </span>
                  </div>

                  {/* Card Title */}
                  <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-red-700 transition-colors tracking-tight mb-2">
                    {card.title}
                  </h3>

                  {/* Bullet Points */}
                  <div className="space-y-1.5 mb-3.5 pt-2 border-t border-slate-200/70">
                    {card.bullets.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium leading-snug">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${card.theme.iconColor} shrink-0 mt-0.5`} />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compact CTA Button */}
                <div className="pt-2 border-t border-slate-100">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-lg shadow-xs hover:scale-[1.02] transition-all cursor-pointer ${card.theme.btnBg}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                    <span>{card.btnText}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. COMPACT FOOTER STRIP */}
        <div className="bg-white rounded-xl border border-amber-300/80 p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2 text-xs text-slate-800 font-bold">
            <span className="text-base">💡</span>
            <span>दुकान जाने की आवश्यकता नहीं — सभी कार्य घर बैठे सुरक्षित व्हाट्सएप एवं ऑनलाइन माध्यम से संपन्न।</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="text-xs text-red-700 hover:text-red-800 font-black hover:underline cursor-pointer"
            >
              संपर्क विवरण देखें →
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
