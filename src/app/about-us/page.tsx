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
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { ContactModal } from '../../components/ContactModal';
import { OWNER_INFO } from '../../data/portalData';

interface ServiceItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  badge: string;
  badgeColor: string;
  description: string;
  highlights: string[];
  whatsappPrompt: string;
}

const SERVICES_LIST: ServiceItem[] = [
  {
    id: 'online-forms',
    icon: FileText,
    title: 'ऑनलाइन फॉर्म सेवाएं',
    badge: '100% त्रुटिरहित',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    description: 'सभी सरकारी एवं निजी भर्तियों के 100% त्रुटिरहित ऑनलाइन आवेदन। MPESB, SSC, UPSC, Railway, Banking, Police, Teaching एवं Defence भर्तियों के अधिकृत फॉर्म घर बैठे भरवाएं।',
    highlights: [
      'दस्तावेज फोटो व हस्ताक्षर का मानक अनुसार सही रिसाइज़िंग',
      'शुल्क भुगतान के पश्चात तत्काल आधिकारिक ऑनलाइन रसीद',
      'फॉर्म सबमिट करने से पूर्व ग्राहक को प्रीव्यू सत्यापन'
    ],
    whatsappPrompt: 'ऑनलाइन%20फॉर्म%20सेवाएं%20(Govt%20Job%20Application)'
  },
  {
    id: 'scholarship-forms',
    icon: GraduationCap,
    title: 'छात्रवृत्ति फॉर्म (Scholarship)',
    badge: 'स्कॉलरशिप विशेषज्ञ',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'मध्य प्रदेश पोस्ट मैट्रिक स्कॉलरशिप (MP Post Matric), सेंट्रल सेक्टर स्कॉलरशिप, NSP नेशनल स्कॉलरशिप एवं अन्य शैक्षणिक छात्रवृत्ति के लिए पूर्ण त्रुटिरहित आवेदन।',
    highlights: [
      'आय, जाति व मूल निवासी प्रमाण पत्र लिंकिंग सत्यापन',
      'कॉलेज/स्कूल प्रोफाइल मैपिंग व कोर्स चयन में सहायता',
      'अंतिम तारीख से पूर्व सुरक्षित सबमिशन व रसीद'
    ],
    whatsappPrompt: 'छात्रवृत्ति%20फॉर्म%20(Scholarship%20Application)'
  },
  {
    id: 'windows-installation',
    icon: Monitor,
    title: 'विंडोज इंस्टॉलेशन / री-इंस्टॉलेशन',
    badge: 'Hardware & OS',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'लैपटॉप एवं कंप्यूटर में Windows 10/11 सुरक्षित इंस्टॉलेशन व री-इंस्टॉलेशन। स्लो पीसी की स्पीड बूस्टिंग, वायरस व मैलवेयर क्लीनिंग के साथ सिस्टम ऑप्टिमाइजेशन।',
    highlights: [
      'Windows 10 एवं 11 Pro 64-bit फ्रेश एवं क्लीन सेटअप',
      'सभी आवश्यक हार्डवेयर ड्राइवर्स (Audio, Display, WiFi) अपडेट',
      'व्यक्तिगत डेटा (C/D/E Drive) का 100% सुरक्षित बैकअप'
    ],
    whatsappPrompt: 'विंडोज%20इंस्टॉलेशन%20(Windows%2010/11%20Setup)'
  },
  {
    id: 'ms-office-setup',
    icon: Cpu,
    title: 'MS Office इंस्टॉलेशन एवं एक्टिवेशन',
    badge: 'Full Suite Setup',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    description: 'Microsoft Office (Word, Excel, PowerPoint, Outlook) का पूर्ण सेटअप व लाइफटाइम एक्टिवेशन। कार्यालयीन एवं छात्र उपयोग के लिए संपूर्ण प्रोडक्टिविटी पैकेज।',
    highlights: [
      'Microsoft Office 2019 / 2021 / 365 कम्पलीट इंस्टॉलेशन',
      'हिंदी टाइपिंग टूल्स (Hindi Mangal / Remington Gail) इंटीग्रेशन',
      'PDF रीडर, ज़िप एक्सट्रैक्टर व आवश्यक उपयोगिता टूल्स सेटअप'
    ],
    whatsappPrompt: 'MS%20Office%20इंस्टॉलेशन%20एवं%20एक्टिवेशन'
  },
  {
    id: 'npci-dbt-mapping',
    icon: Building2,
    title: 'NPCI / DBT बैंक खाता मैपिंग व स्टेटस चेक',
    badge: 'Direct Benefit Transfer',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'सरकारी योजनाओं, लाड़ली बहना, किसान सम्मान निधि व स्कॉलरशिप राशि सीधे बैंक खाते में प्राप्त करने हेतु आधार-NPCI-DBT मैपिंग व लाइव एक्टिव स्टेटस जांच सहायता।',
    highlights: [
      'NPCI Bharat Connect पोर्टल से आधार-सीडिंग स्टेटस सत्यापन',
      'DBT इनएक्टिव होने पर त्वरित बैंक शाखा समाधान मार्गदर्शन',
      'योजनाओं की रुकी हुई राशि पुनः चालू करवाने में विशेषज्ञ परामर्श'
    ],
    whatsappPrompt: 'NPCI%20/%20DBT%20बैंक%20खाता%20मैपिंग%20सहायता'
  },
  {
    id: 'netbanking-passwords',
    icon: KeyRound,
    title: 'नेट बैंकिंग पासवर्ड सेट एवं रीसेट',
    badge: 'सुरक्षित सहायता',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'सुरक्षित इंटरनेट बैंकिंग प्रोफाइल पासवर्ड, लॉगिन पासवर्ड व ट्रांजेक्शन पासवर्ड भूल जाने पर बैंक मानकों के अनुसार सुरक्षित रिकवरी एवं पासवर्ड रीसेट सहायता।',
    highlights: [
      'SBI, PNB, BoB, HDFC, ICICI समेत सभी प्रमुख बैंकों के पोर्टल',
      'यूजर आईडी अनब्लॉक व ई-स्टेटमेंट एक्टिवेशन सहायता',
      'गोपनीयता व पूर्ण सुरक्षा का 100% अनुपालन'
    ],
    whatsappPrompt: 'नेट%20बैंकिंग%20पासवर्ड%20सेट%20एवं%20रीसेट'
  },
  {
    id: 'credit-card-help',
    icon: CreditCard,
    title: 'क्रेडिट कार्ड सहायता व ब्लॉकिंग',
    badge: 'Financial Services',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'नए लाइफटाइम फ्री (LTF) क्रेडिट कार्ड हेतु पात्रता जांच एवं आवेदन। कार्ड चोरी, गुम या संदिग्ध ट्रांजेक्शन होने पर 24x7 तत्काल हॉटलिस्टिंग/ब्लॉकिंग मार्गदर्शन।',
    highlights: [
      'सिबिल स्कोर एवं आय अनुसार बेस्ट रिवॉर्ड क्रेडिट कार्ड सुझाव',
      'खोए हुए कार्ड को बैंक के आधिकारिक चैनल से त्वरित ब्लॉक',
      'क्रेडिट लिमिट वृद्धि एवं रिवॉर्ड पॉइंट रिडेम्पशन सहायता'
    ],
    whatsappPrompt: 'क्रेडिट%20कार्ड%20सहायता%20(Credit%20Card%20Support)'
  },
  {
    id: 'cibil-score-repair',
    icon: TrendingUp,
    title: 'सिबिल (CIBIL) स्कोर सुधार परामर्श',
    badge: 'क्रेडिट एक्सपर्ट',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'कम सिबिल स्कोर होने के कारण लोन या क्रेडिट कार्ड रिजेक्ट हो रहा है? सिबिल स्कोर 750+ तक पहुंचाने हेतु वित्तीय विशेषज्ञ मार्गदर्शन व चरणबद्ध सुधार योजना।',
    highlights: [
      'सिबिल रिपोर्ट का गहन विश्लेषण एवं नकारात्मक प्रविष्टियों की पहचान',
      'क्रेडिट यूटिलाइजेशन रेश्यो (CUR) सही करने के उपाय',
      'डिफॉल्ट या सेटल्ड अकाउंट्स का बैंक से नो-ड्यूज (NOC) निपटान'
    ],
    whatsappPrompt: 'सिबिल%20(CIBIL)%20स्कोर%20सुधार%20परामर्श'
  }
];

export default function AboutUsServicesPage() {
  const [contactModalOpen, setContactModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      <Header />

      {/* Hero Banner Section */}
      <section className="bg-gradient-to-br from-neutral-900 via-slate-900 to-red-950 text-white border-b border-red-800/40 relative overflow-hidden py-10 sm:py-14">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              100% विश्वसनीय डिजिटल समाधान
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white mb-3">
              NP Job Portal - <span className="text-red-500">ऑनलाइन फॉर्म</span> एवं <span className="text-amber-400">तकनीकी सेवाएं</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 font-medium mb-4 leading-relaxed">
              संचालक व फॉर्म विशेषज्ञ: <strong className="text-white font-bold">{OWNER_INFO.name}</strong> • हेल्पलाइन: <a href="tel:8982324497" className="text-amber-400 hover:underline font-mono font-bold">8982324497</a>
            </p>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              हम मध्य प्रदेश एवं पूरे भारत के युवाओं, छात्रों और नागरिकों को घर बैठे सुरक्षित ऑनलाइन आवेदन, छात्रवृत्ति फॉर्म, कंप्यूटर सॉफ्टवेयर इंस्टॉलेशन, बैंक व NPCI मैपिंग तथा वित्तीय सहायता सेवाएं प्रदान करते हैं।
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setContactModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-black text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>सीधे संपर्क करें (8982324497)</span>
              </button>

              <a
                href={OWNER_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>व्हाट्सएप पर चैट करें</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Strip */}
      <section className="bg-white border-b border-neutral-200 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="p-2 flex items-center justify-center gap-2 text-xs font-bold text-neutral-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% त्रुटिरहित फॉर्म सबमिशन</span>
            </div>
            <div className="p-2 flex items-center justify-center gap-2 text-xs font-bold text-neutral-800">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>गोपनीय डेटा पूर्णतः सुरक्षित</span>
            </div>
            <div className="p-2 flex items-center justify-center gap-2 text-xs font-bold text-neutral-800">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>सुबह 8:00 AM से रात 10:00 PM</span>
            </div>
            <div className="p-2 flex items-center justify-center gap-2 text-xs font-bold text-neutral-800">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>सत्यापित अधिकृत संचालक</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-12 flex-1 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            हमारी प्रमुख तकनीकी एवं ऑनलाइन सेवाएं
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 mt-2">
            किसी भी सेवा के लिए नीचे दिए गए बटन पर क्लिक करें। आपका व्हाट्सएप सीधे संचालक Nitish Khobragade (8982324497) से जुड़ जाएगा।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_LIST.map((srv) => {
            const Icon = srv.icon;
            const waUrl = `https://wa.me/918982324497?text=नमस्ते%20Nitish%20ji,%20maine%20aapko%20NP%20Job%20Portal%20se%20sampark%20kiya%20hai.%20Mujhe%20is%20service%20ke%20bare%20me%20jankari%20chahiye:%20${srv.whatsappPrompt}`;

            return (
              <div
                key={srv.id}
                className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center border border-red-100 group-hover:bg-red-700 group-hover:text-white transition-colors shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${srv.badgeColor}`}>
                      {srv.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-neutral-900 group-hover:text-red-700 transition-colors tracking-tight mb-2">
                    {srv.title}
                  </h3>

                  <p className="text-xs text-neutral-600 leading-relaxed mb-4">
                    {srv.description}
                  </p>

                  <div className="space-y-1.5 mb-6 pt-3 border-t border-neutral-100">
                    {srv.highlights.map((h, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-neutral-700 font-medium leading-tight">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs transition-all active:scale-95 group/btn"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>सेवा हेतु संपर्क करें / WhatsApp Direct</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-red-700 via-rose-800 to-red-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
              सुरक्षित व त्वरित सुविधा
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              क्या आपको किसी अन्य तकनीकी कार्य में सहायता चाहिए?
            </h3>
            <p className="text-xs sm:text-sm text-red-100 max-w-xl">
              हम आपके सभी डिजिटल फॉर्म, प्रिंटआउट, फोटो-हस्ताक्षर रिसाइज़, समग्र ई-केवाईसी एवं कंप्यूटर समस्याओं का त्वरित समाधान करते हैं।
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setContactModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-neutral-900 hover:bg-neutral-100 font-black text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-red-700" />
              <span>कॉल करें: 8982324497</span>
            </button>
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-md transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>व्हाट्सएप खोलें</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
    </div>
  );
}
