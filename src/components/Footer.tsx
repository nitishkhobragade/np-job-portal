"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, ShieldAlert, Award, ExternalLink, Lock, Send, BellRing, Sparkles } from 'lucide-react';
import { OWNER_INFO } from '../data/portalData';
import { ContactModal } from './ContactModal';

export const Footer: React.FC = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);

  const quickLinks = [
    { name: 'MP ESB भोपाल', url: 'https://esb.mp.gov.in' },
    { name: 'SSC पोर्टल', url: 'https://ssc.gov.in' },
    { name: 'Railway RRB', url: 'https://indianrailways.gov.in' },
    { name: 'UPSC पोर्टल', url: 'https://upsc.gov.in' },
    { name: 'MP AYUSH नीट', url: 'https://ayush.mponline.gov.in' },
    { name: 'MP Online Kiosk', url: 'https://mponline.gov.in' },
  ];

  const onlineServices = [
    'MP ESB / व्यापम समस्त ऑनलाइन फॉर्म',
    'रोजगार पंजीयन नवीन व नवीनीकरण',
    'समग्र e-KYC एवं आधार लिंकिंग',
    'जाति, आय, मूल निवासी प्रमाण पत्र',
    'फोटो व सिग्नेचर रिसाइज़ एवं दस्तावेज स्कैनिंग'
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-6 pb-16 md:pb-6 border-t border-neutral-800 mt-8 text-xs">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Grid: Compact 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          
          {/* Col 1: About Portal & Owner */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-red-600 text-white font-black flex items-center justify-center text-xs">
                NP
              </div>
              <span className="text-base font-black text-white tracking-tight">
                NP <span className="text-red-500">Job Portal</span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              मध्य प्रदेश एवं केन्द्रीय सरकारी भर्तियों, एडमिट कार्ड, परीक्षा परिणाम व काउंसलिंग की विश्वसनीय सूचना वेबसाइट।
            </p>
            <div className="pt-0.5 text-[11px]">
              <p className="text-neutral-200 font-bold">
                संचालक: <span className="text-amber-400">{OWNER_INFO.name} ({OWNER_INFO.phone})</span>
              </p>
              <p className="text-neutral-400 text-[10px]">
                घर बैठे सुरक्षित फॉर्म भरवाएं • {OWNER_INFO.address}
              </p>
            </div>
            <div>
              <Link
                href="/about-us"
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold hover:underline"
              >
                <Sparkles className="w-3 h-3" />
                <span>हमारी ऑनलाइन सेवाएं देखें &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Col 2: Services Offered */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> ऑनलाइन फॉर्म सेवाएं
            </h4>
            <ul className="space-y-1 text-[11px] text-neutral-400">
              {onlineServices.map((service, idx) => (
                <li key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{service}</span>
                </li>
              ))}
            </ul>
            <div className="pt-1.5">
              <Link
                href="/category/syllabus"
                className="text-[11px] text-slate-300 hover:text-white font-semibold inline-flex items-center gap-1 hover:underline"
              >
                📑 परीक्षा सिलेबस व नियम &rarr;
              </Link>
            </div>
          </div>

          {/* Col 3: Official Govt Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
              सरकारी वेबसाइट्स
            </h4>
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-1 text-[11px] text-neutral-400">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-400 transition-colors inline-flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{link.name}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Social Badges (Compact) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              संपर्क एवं सहायता
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-300">
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="hover:text-amber-400 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Phone className="w-3 h-3 text-blue-400" />
                <span>+91 {OWNER_INFO.phone}</span>
              </button>
              <a
                href={OWNER_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-300 font-bold text-emerald-400 inline-flex items-center gap-1"
              >
                <MessageCircle className="w-3 h-3 text-emerald-400" />
                <span>व्हाट्सएप</span>
              </a>
              <span className="text-[10px] text-neutral-400">समय: {OWNER_INFO.hours}</span>
            </div>

            {/* Compact Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] transition-colors cursor-pointer"
              >
                <Phone className="w-3 h-3 text-white" />
                <span>संपर्क सूत्र</span>
              </button>

              <a
                href="https://whatsapp.com/channel/0029Vb9N2gfGZNClzwFazG3L"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors truncate"
              >
                <BellRing className="w-3 h-3 text-amber-300 shrink-0" />
                <span className="truncate">WA चैनल</span>
              </a>

              <a
                href="https://t.me/npjobportal"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold text-[11px] transition-colors"
              >
                <Send className="w-3 h-3" />
                <span>Telegram चैनल से जुड़ें</span>
              </a>
            </div>
          </div>

        </div>

        {/* Compact Disclaimer & Copyright Strip */}
        <div id="footer-disclaimer" className="border-t border-neutral-800 pt-3 text-[10px] text-neutral-500 space-y-1.5">
          <div className="flex items-start gap-1.5 leading-snug">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>अस्वीकरण:</strong> NP Job Portal एक निजी सूचना व ऑनलाइन फॉर्म सेवा मंच है (किसी सरकारी एजेंसी से सीधे संबद्ध नहीं)। आवेदन से पूर्व संबंधित विभाग की आधिकारिक विज्ञप्ति अवश्य पढ़ें।{' '}
              <Link href="/disclaimer" className="text-amber-400 hover:underline">
                विस्तृत डिस्क्लेमर नीति &rarr;
              </Link>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 pt-1.5 border-t border-neutral-800/60 text-neutral-400">
            <p>
              © {new Date().getFullYear()} NP Job Portal • Nitish Khobragade (8982324497) • घर बैठे सुरक्षित फॉर्म भरवाएं
            </p>
            <div className="flex items-center gap-3">
              <Link href="/disclaimer" className="hover:text-white">डिस्क्लेमर</Link>
              <Link href="/about-us" className="hover:text-white">सेवाएं</Link>
              <Link href="/blogs" className="text-amber-400 font-bold hover:text-amber-300">करियर ब्लॉग्स</Link>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-neutral-400 hover:text-amber-400 px-1.5 py-0.5 rounded bg-neutral-800/80"
              >
                <Lock className="w-2.5 h-2.5" />
                <span>एडमिन</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </footer>
  );
};
