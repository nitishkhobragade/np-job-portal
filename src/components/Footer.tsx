import React from 'react';
import Link from 'next/link';
import { Phone, MessageCircle, ShieldAlert, Award, ExternalLink, Lock } from 'lucide-react';
import { OWNER_INFO } from '../data/portalData';

export const Footer: React.FC = () => {
  const quickLinks = [
    { name: 'MP ESB भोपाल पोर्टल', url: 'https://esb.mp.gov.in' },
    { name: 'आधिकारिक भर्ती एवं सेवा पोर्टल', url: 'https://esb.mp.gov.in' },
    { name: 'Staff Selection Commission (SSC)', url: 'https://ssc.gov.in' },
    { name: 'Railway Recruitment Board (RRB)', url: 'https://indianrailways.gov.in' },
    { name: 'UPSC सिविल सेवा पोर्टल', url: 'https://upsc.gov.in' },
    { name: 'MP AYUSH नीट काउंसलिंग', url: 'https://ayush.mponline.gov.in' },
  ];

  const onlineServices = [
    'मध्य प्रदेश व्यापम / ESB समस्त फॉर्म',
    'रोजगार पंजीयन नवीन व नवीनीकरण',
    'समग्र ई-केवाईसी एवं आधार लिंकिंग',
    'जाति, आय एवं मूल निवासी प्रमाण पत्र',
    'फोटो, हस्ताक्षर रिसाइज़ एवं दस्तावेज स्कैनिंग',
    'एडमिट कार्ड व रिजल्ट रंगीन प्रिंट आउट'
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-10 pb-20 md:pb-10 border-t border-neutral-800 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          
          {/* Col 1: About Portal & Owner */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-red-600 text-white font-black flex items-center justify-center text-sm">
                NP
              </div>
              <span className="text-xl font-black text-white tracking-tight">
                NP <span className="text-red-500">Job Portal</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              NP Job Portal द्वारा संचालित मध्य प्रदेश एवं केन्द्रीय सरकारी भर्तियों, एडमिट कार्ड, परीक्षा परिणाम व काउंसलिंग की सबसे विश्वसनीय सूचना वेबसाइट।
            </p>
            <div className="pt-2">
              <p className="text-xs text-neutral-200 font-bold">
                पोर्टल संचालक: <span className="text-amber-400">{OWNER_INFO.name} (8982324497)</span>
              </p>
              <p className="text-xs text-neutral-400 mt-0.5">
                घर बैठे सुरक्षित फॉर्म भरवाएं • {OWNER_INFO.address}
              </p>
            </div>
          </div>

          {/* Col 2: Services Offered */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" /> ऑनलाइन फॉर्म सेवाएं
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-400">
              {onlineServices.map((service, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Official Govt Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              महत्वपूर्ण सरकारी वेबसाइट्स
            </h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <span>{link.name}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
              संपर्क एवं सहायता
            </h4>
            <div className="space-y-2 text-xs text-neutral-300">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href={OWNER_INFO.callUrl} className="hover:text-white font-bold">
                  +91 {OWNER_INFO.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <a
                  href={OWNER_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white font-bold text-emerald-400"
                >
                  व्हाट्सएप: 8982324497
                </a>
              </p>
              <p className="text-[11px] text-neutral-400 pt-1">
                समय: {OWNER_INFO.hours}
              </p>
            </div>

            <div className="pt-2">
              <a
                href={OWNER_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>सीधे WhatsApp पर संपर्क करें</span>
              </a>
            </div>
          </div>

        </div>

        {/* Disclaimer Note */}
        <div className="border-t border-neutral-800 pt-5 text-[11px] text-neutral-500 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>अस्वीकरण (Disclaimer):</strong> NP Job Portal एक निजी सूचना प्रदाता एवं ऑनलाइन फॉर्म सेवा मंच है। हम किसी भी सरकारी एजेंसी से सीधे संबद्ध नहीं हैं। सभी अभ्यर्थियों से अनुरोध है कि आवेदन से पूर्व संबंधित विभाग (MPESB, SSC, UPSC आदि) की आधिकारिक विज्ञप्ति अवश्य पढ़ें।
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 text-neutral-400">
            <p>
              © {new Date().getFullYear()} NP Job Portal. All Rights Reserved. Managed by <strong>Nitish Khobragade (8982324497)</strong> • घर बैठे सुरक्षित फॉर्म भरवाएं.
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-[10px] text-neutral-400 hover:text-amber-400 transition-colors px-2 py-1 rounded bg-neutral-800/80 hover:bg-neutral-800"
            >
              <Lock className="w-3 h-3" />
              <span>पोर्टल एडमिन लॉगिन</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
