"use client";

import React, { useEffect, useState } from 'react';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import { getAdSenseConfig } from '../lib/adsenseConfig';
import { OWNER_INFO } from '../data/portalData';
import { AdSenseConfig } from '../types';

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSenseBannerProps {
  slotType: 'leaderboard' | 'in-feed';
  id?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ slotType, id }) => {
  const [config, setConfig] = useState<AdSenseConfig>(getAdSenseConfig);

  useEffect(() => {
    const onUpdate = () => setConfig(getAdSenseConfig());
    window.addEventListener('np_adsense_config_updated', onUpdate);
    return () => window.removeEventListener('np_adsense_config_updated', onUpdate);
  }, []);

  // When AdSense is actively configured and enabled with a publisher ID
  const isAdSenseActive = Boolean(config.enabled && config.client);
  const slotId = slotType === 'leaderboard' ? config.slots?.leaderboard : config.slots?.inFeed;

  useEffect(() => {
    if (isAdSenseActive && typeof window !== 'undefined') {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Suppress AdSense already loaded warnings
      }
    }
  }, [isAdSenseActive, slotId]);

  if (isAdSenseActive) {
    return (
      <div id={id || `adsense-${slotType}`} className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-3 overflow-hidden text-center">
        <ins
          className="adsbygoogle"
          style={{ display: 'block', textAlign: 'center', minHeight: slotType === 'leaderboard' ? '90px' : '140px' }}
          data-ad-client={config.client}
          data-ad-slot={slotId || ''}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Pre-AdSense / Inactive State: Clean, authentic portal service banner (NO artificial ad labels)
  const whatsappUrl = `https://wa.me/91${OWNER_INFO.phone}?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20%E0%A4%91%E0%A4%A8%E0%A4%B2%E0%A4%BE%E0%A4%87%E0%A4%A8%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A5%87%20%E0%A4%B9%E0%A5%87%E0%A4%A4%E0%A5%81%20%E0%A4%B8%E0%A4%82%E0%A4%AA%E0%A4%B0%E0%A5%8D%E0%A4%95%20%E0%A4%95%E0%A4%B0%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4`;

  if (slotType === 'leaderboard') {
    return (
      <div id={id || 'portal-service-leaderboard'} className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-2.5 sm:my-3">
        <div className="w-full relative overflow-hidden rounded-xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <span className="shrink-0 p-1.5 bg-amber-500 text-slate-950 font-black rounded-lg text-xs">
                ★ सेवा केंद्र
              </span>
              <div>
                <p className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                  घर बैठे सभी सरकारी व प्राइवेट नौकरियों के ऑनलाइन फॉर्म सुरक्षित भरवाएं
                </p>
                <p className="text-[11px] text-neutral-600">
                  MP Online • ESB व्यापमं • SSC • Railway • बैंक • पुलिस भर्ती (संचालक: {OWNER_INFO.name})
                </p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>फॉर्म भरवाएं (WhatsApp)</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={id || 'portal-service-infeed'} className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-5">
      <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-900">
                100% सटीक आवेदन व प्रिंट रसीद • परीक्षा प्रवेश पत्र एवं रिजल्ट सूचना
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                दस्तावेज व्हाट्सएप (8982324497) पर भेजें, ऑनलाइन आवेदन करवाएं और तुरंत पावती रसीद प्राप्त करें।
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>व्हाट्सएप पर संपर्क करें</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
