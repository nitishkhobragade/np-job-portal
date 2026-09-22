"use client";

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Phone, MessageCircle } from 'lucide-react';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-6">
          <Link href="/" className="hover:text-red-700 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>होम</span>
          </Link>
          <span>/</span>
          <span className="text-neutral-900 font-bold">डिस्क्लेमर (अस्वीकरण)</span>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                डिस्क्लेमर एवं अस्वीकरण नीति (Disclaimer Policy)
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                अंतिम अद्यतन: 22 सितंबर 2026 • NP Job Portal
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed">
            <p>
              <strong>1. गैर-सरकारी निजी सूचना मंच:</strong> NP Job Portal (npjobportal.com / ais-dev...) एक स्वतंत्र निजी सूचना प्रदाता और ऑनलाइन आवेदन सहायता मंच है। यह वेबसाइट किसी भी सरकारी निकाय, विभाग (जैसे MPESB, MPPSC, UPSC, SSC, NTA आदि) अथवा मंत्रालय से संबद्ध, अधिकृत या प्रायोजित नहीं है।
            </p>

            <p>
              <strong>2. सूचना की प्रामाणिकता एवं सतर्कता:</strong> पोर्टल पर प्रकाशित सभी भर्ती सूचनाएं, तिथियां, शुल्क विवरण और पात्रता मानक केवल सामान्य जन-जागरूकता और संदर्भ के उद्देश्य से विभिन्न आधिकारिक वेबसाइट्स, रोजगार समाचार एवं विज्ञप्तियों से संकलित किए जाते हैं। यद्यपि हम 100% सटीकता का प्रयास करते हैं, फिर भी किसी अनपेक्षित मुद्रण त्रुटि अथवा विभाग द्वारा किए गए आकस्मिक संशोधनों के लिए हम उत्तरदायी नहीं होंगे। अभ्यर्थियों से अनुरोध है कि अंतिम आवेदन से पूर्व संबंधित विभाग की आधिकारिक नियम पुस्तिका अवश्य पढ़ें।
            </p>

            <p>
              <strong>3. ऑनलाइन फॉर्म सहायता सेवा:</strong> पोर्टल संचालक Nitish Khobragade (8982324497) अभ्यर्थियों की सुविधा हेतु घर बैठे सुरक्षित ऑनलाइन फॉर्म भरने एवं तकनीकी परामर्श की सशुल्क निजी सेवा प्रदान करते हैं। यह सेवा अभ्यर्थी द्वारा प्रदान किए गए वैध दस्तावेजों एवं उनकी लिखित सहमति के आधार पर निष्पादित की जाती है।
            </p>

            <p>
              <strong>4. बाह्य वेबसाइट लिंक्स:</strong> पोर्टल पर दिए गए अप्लाई लिंक, नोटिफिकेशन PDF और सिलेबस डाउनलोड लिंक्स संबंधित आयोगों/विभागों की आधिकारिक वेबसाइटों की ओर निर्देशित करते हैं। हम तृतीय-पक्ष वेबसाइटों की गोपनीयता नीतियों अथवा सामग्री के लिए उत्तरदायी नहीं हैं।
            </p>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl space-y-2">
            <div className="text-xs font-bold text-neutral-900">
              किसी भी प्रश्न, सुझाव या फॉर्म सहायता हेतु संपर्क करें:
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                <span>8982324497</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp: 8982324497</span>
              </span>
              <span>ईमेल: nitishkhobragade89@gmail.com</span>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
