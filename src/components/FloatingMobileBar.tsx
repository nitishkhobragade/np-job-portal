import React from 'react';
import { MessageCircle, Phone, ShieldCheck } from 'lucide-react';
import { OWNER_INFO } from '../data/portalData';

export const FloatingMobileBar: React.FC = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-neutral-800 py-1.5 px-3 shadow-2xl safe-area-bottom">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        <div className="flex flex-col min-w-0">
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5 shrink-0" /> NP Job Portal
          </span>
          <span className="text-[11px] font-black text-white truncate max-w-[130px]">
            Nitish: 8982324497
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <a
            href={OWNER_INFO.callUrl}
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs active:scale-95 transition-all min-h-[36px]"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>कॉल</span>
          </a>

          <a
            href={OWNER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs active:scale-95 transition-all min-h-[36px]"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-white" />
            <span>फॉर्म भरवाएं</span>
          </a>
        </div>
      </div>
    </div>
  );
};
