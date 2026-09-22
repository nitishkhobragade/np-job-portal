import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';

interface AdSenseBannerProps {
  slotType: 'leaderboard' | 'in-feed';
  id?: string;
}

export const AdSenseBanner: React.FC<AdSenseBannerProps> = ({ slotType, id }) => {
  if (slotType === 'leaderboard') {
    return (
      <div id={id || 'adsense-header-leaderboard'} className="w-full max-w-7xl mx-auto px-2 sm:px-4 my-2 sm:my-3 overflow-hidden box-border">
        <div className="w-full max-w-full relative overflow-hidden rounded-xl border border-dashed border-amber-300 bg-linear-to-r from-amber-50/90 via-orange-50/70 to-yellow-50/90 p-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <span className="shrink-0 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 rounded">
                Sponsored / Ad
              </span>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-neutral-800">
                  Google AdSense Responsive Leaderboard (728x90 / 970x90 Auto Slot)
                </p>
                <p className="text-[11px] text-neutral-600">
                  Targeted Government Exam Prep, Mock Test Series & Study Material Ads
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-amber-800 font-medium bg-white/80 border border-amber-200 px-2.5 py-1 rounded-md shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-600" /> High CTR Placement
              </span>
              <span className="inline-flex items-center text-[10px] text-neutral-500 hover:text-neutral-700">
                AdChoices <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id={id || 'adsense-infeed-ad'} className="w-full max-w-7xl mx-auto px-4 my-6">
      <div className="relative overflow-hidden rounded-xl border border-dashed border-sky-300 bg-linear-to-r from-sky-50/90 via-indigo-50/60 to-blue-50/90 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="shrink-0 mt-0.5 inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 bg-sky-200/80 rounded">
              AdSense Native
            </span>
            <div>
              <p className="text-sm sm:text-base font-bold text-neutral-900">
                Govt Exam Test Series & Books 2026 - Free PDF Notes & Live Classes
              </p>
              <p className="text-xs text-neutral-600 mt-0.5">
                MP Police, MP TET, SSC, Railway & Banking Mock Tests • Daily Current Affairs Quizzes
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-2xs transition-colors"
            >
              Learn More
            </button>
            <span className="text-[10px] text-neutral-500">AdSense In-Feed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
