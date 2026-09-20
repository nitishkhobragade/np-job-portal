import React from 'react';
import { MessageCircle, Phone, ShieldCheck, CheckCircle, Clock, Zap, FileCheck } from 'lucide-react';
import { OWNER_INFO, SERVICE_BENEFITS } from '../data/portalData';

export const ProminentServiceBanner: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-4 my-6">
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-800 via-teal-900 to-slate-900 text-white p-5 sm:p-7 shadow-lg border border-emerald-700/50">
        
        {/* Decorative subtle background elements */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Main Info Box */}
          <div className="space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              NP ONLINE KIOSK • 100% सुरक्षित एवं प्रमाणित ऑनलाइन सेवा
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              {OWNER_INFO.tagline}
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
              दुकान या कियोस्क के चक्कर लगाने की जरूरत नहीं! अपने दस्तावेज व्हाट्सएप पर भेजें और घर बैठे किसी भी सरकारी भर्ती, एमपी टेट, पुलिस, एसएससी, रेलवे व कॉलेज काउंसलिंग का फॉर्म सही-सही भरवाएं।
            </p>

            {/* Quick Trust Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>फोटो-सिग्नेचर रिसाइज़िंग</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>रोजगार पंजीयन रिन्यू</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>ओरिजिनल पेमेंट रसीद</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-200 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>एडमिट कार्ड SMS सूचना</span>
              </div>
            </div>
          </div>

          {/* Action Call & WhatsApp CTA */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto min-w-[260px]">
            <a
              href={OWNER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm sm:text-base shadow-lg hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <MessageCircle className="w-5 h-5 fill-slate-950" />
              <span>WhatsApp पर फॉर्म भेजें</span>
            </a>

            <a
              href={OWNER_INFO.callUrl}
              className="flex items-center justify-center gap-3 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm sm:text-base border border-white/20 shadow-xs transition-all"
            >
              <Phone className="w-4 h-4 text-emerald-300" />
              <span>कॉल: {OWNER_INFO.phone}</span>
            </a>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-300 font-medium text-center">
              <Clock className="w-3.5 h-3.5" />
              <span>उपलब्ध: {OWNER_INFO.hours}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
