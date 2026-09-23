import React, { useState, useEffect } from 'react';
import { Megaphone, Flame, ChevronRight, Pause, Play } from 'lucide-react';
import { TICKER_ALERTS, OWNER_INFO } from '../data/portalData';
import { subscribeToTickers } from '../lib/firebase';
import { TickerAlert } from '../types';

export const TopTicker: React.FC = () => {
  const [isPaused, setIsPaused] = useState(false);
  const [tickers, setTickers] = useState<TickerAlert[]>(() =>
    TICKER_ALERTS.map((t) => ({ ...t, active: true }))
  );

  useEffect(() => {
    const unsubscribe = subscribeToTickers((updatedTickers) => {
      if (updatedTickers && updatedTickers.length > 0) {
        setTickers(updatedTickers.filter((t) => t.active !== false));
      }
    });
    return () => unsubscribe();
  }, []);

  const activeItems = tickers.length > 0 ? tickers : TICKER_ALERTS;

  return (
    <div className="bg-neutral-900 text-white border-b border-neutral-800 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
        {/* Left Badge with Blinking Red Alert */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-[11px] font-black tracking-wide text-white uppercase shadow-xs animate-pulse">
            <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300" />
            NEW UPDATE
          </span>
          <span className="hidden md:inline-flex text-xs font-semibold text-amber-400">
            ब्रेकिंग न्यूज़:
          </span>
        </div>

        {/* Continuous Marquee Content (Twin-Track Gapless Engine) */}
        <div
          className="flex-1 overflow-hidden relative w-full py-0.5 cursor-pointer flex ticker-container min-h-[28px] items-center"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* TRACK 1 */}
          <div
            className="animate-marquee-continuous flex items-center shrink-0 pr-8"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {activeItems.map((alert, idx) => (
              <a
                key={`t1-${alert.id || idx}-${idx}`}
                href={alert.link || OWNER_INFO.whatsappUrl}
                target={alert.link && !alert.link.startsWith('/') ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mr-8 text-xs sm:text-sm font-medium text-neutral-200 hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                  alert.isBreaking
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  {alert.date || (alert.isBreaking ? 'BREAKING' : 'NEW')}
                </span>
                <span>{alert.text}</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </a>
            ))}
          </div>

          {/* TRACK 2 (Seamless Twin Track for Gapless Loop) */}
          <div
            className="animate-marquee-continuous flex items-center shrink-0 pr-8"
            aria-hidden="true"
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {activeItems.map((alert, idx) => (
              <a
                key={`t2-${alert.id || idx}-${idx}`}
                href={alert.link || OWNER_INFO.whatsappUrl}
                target={alert.link && !alert.link.startsWith('/') ? '_blank' : undefined}
                rel="noopener noreferrer"
                tabIndex={-1}
                className="inline-flex items-center gap-2 mr-8 text-xs sm:text-sm font-medium text-neutral-200 hover:text-amber-300 transition-colors whitespace-nowrap"
              >
                <span className={`inline-block px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                  alert.isBreaking
                    ? 'bg-red-500/20 border-red-500/40 text-red-300'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                }`}>
                  {alert.date || (alert.isBreaking ? 'BREAKING' : 'NEW')}
                </span>
                <span>{alert.text}</span>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* Marquee Control & Quick Call */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 text-xs text-neutral-400">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="hover:text-white p-1 rounded transition-colors"
            title={isPaused ? "Play Marquee" : "Pause Marquee"}
            aria-label="Toggle marquee animation"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          <span className="text-neutral-600">|</span>
          <a
            href={OWNER_INFO.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <Megaphone className="w-3 h-3" />
            फॉर्म भरवाएं: 8982324497
          </a>
        </div>
      </div>
    </div>
  );
};
