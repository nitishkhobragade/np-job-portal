"use client";

import React, { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle2, AlertCircle, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export const AgeCalculatorTool: React.FC = () => {
  const [dob, setDob] = useState<string>('2002-05-15');
  const [cutoffDate, setCutoffDate] = useState<string>('2026-01-01');
  const [selectedCategory, setSelectedCategory] = useState<'UR' | 'OBC' | 'SC_ST' | 'FEMALE'>('UR');

  const ageData = useMemo(() => {
    if (!dob || !cutoffDate) return null;

    const birthDate = new Date(dob);
    const targetDate = new Date(cutoffDate);

    if (isNaN(birthDate.getTime()) || isNaN(targetDate.getTime())) return null;
    if (birthDate > targetDate) {
      return { isFuture: true };
    }

    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    // Total days & weeks
    const diffMs = targetDate.getTime() - birthDate.getTime();
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const totalWeeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    const totalHours = totalDays * 24;

    // Next Birthday calculation
    const currentYear = new Date().getFullYear();
    let nextBday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
    const today = new Date();
    if (nextBday < today) {
      nextBday = new Date(currentYear + 1, birthDate.getMonth(), birthDate.getDate());
    }
    const daysUntilNextBday = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      isFuture: false,
      years,
      months,
      days,
      totalDays,
      totalWeeks,
      remainingDays,
      totalHours,
      daysUntilNextBday
    };
  }, [dob, cutoffDate]);

  // Exam age limits matrix
  const EXAM_LIMITS = [
    { name: 'MP Police Constable 2026', min: 18, maxUR: 33, maxRes: 38, note: 'MP मूल निवासी को 5 वर्ष की छूट' },
    { name: 'SSC GD Constable', min: 18, maxUR: 23, maxRes: 28, note: 'SC/ST +5y, OBC +3y' },
    { name: 'SSC CHSL / MTS (10+2)', min: 18, maxUR: 27, maxRes: 32, note: 'OBC 30y, SC/ST 32y' },
    { name: 'SSC CGL (Graduate Level)', min: 18, maxUR: 30, maxRes: 35, note: 'विभिन्न पदों अनुसार 27-32 वर्ष' },
    { name: 'Railway RRC Group D / RRB', min: 18, maxUR: 33, maxRes: 38, note: 'आरक्षित वर्गों को आयु छूट' },
    { name: 'MP ESB सब इंजीनियर / व्यापम', min: 18, maxUR: 40, maxRes: 45, note: 'MP के अभ्यर्थियों हेतु 40-45 वर्ष' },
    { name: 'UPSC Civil Services (IAS/IPS)', min: 21, maxUR: 32, maxRes: 37, note: 'OBC 35y, SC/ST 37y' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-sky-700 to-indigo-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>वर्ष, माह, दिन व कट-ऑफ तारीख कैलकुलेटर</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">सरकारी नौकरी आयु कैलकुलेटर (Sarkari Age Calculator)</h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-2xl">
              विभिन्न सरकारी परीक्षाओं (MP Police, SSC, Railway, UPSC) की कट-ऑफ तारीख के अनुसार अपनी सटीक आयु (वर्ष, माह, दिन) जानें और पात्रता जांचें।
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% सटीक व तुरंत</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Input Dates & Category */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              1. अपनी जन्मतिथि व कट-ऑफ तारीख डालें
            </label>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>आपकी जन्मतिथि (Date of Birth - DOB):</span>
              </label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>आयु गणना की कट-ऑफ तारीख (Age as on Date):</span>
              </label>
              <input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="w-full px-3 py-2 text-sm font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">लोकप्रिय कट-ऑफ:</span>
                <button
                  type="button"
                  onClick={() => setCutoffDate('2026-01-01')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                >
                  01/01/2026
                </button>
                <button
                  type="button"
                  onClick={() => setCutoffDate('2026-07-01')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                >
                  01/07/2026
                </button>
                <button
                  type="button"
                  onClick={() => setCutoffDate('2026-08-01')}
                  className="px-2 py-0.5 rounded text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                >
                  01/08/2026
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                आरक्षण श्रेणी (Category for Age Relaxation):
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'UR', label: 'General / अनारक्षित' },
                  { key: 'OBC', label: 'OBC (+3 वर्ष)' },
                  { key: 'SC_ST', label: 'SC / ST (+5 वर्ष)' },
                  { key: 'FEMALE', label: 'महिला अभ्यर्थी (+5-10 वर्ष)' }
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key as 'UR' | 'OBC' | 'SC_ST' | 'FEMALE')}
                    className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat.key
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Calculated Age & Eligibility Matrix */}
        <div className="lg:col-span-7 space-y-5">
          {ageData && !ageData.isFuture ? (
            <>
              {/* Highlight Age Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-5 rounded-2xl shadow-sm">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  कट-ऑफ तारीख ({cutoffDate.split('-').reverse().join('/')}) के अनुसार आपकी सटीक आयु:
                </span>

                <div className="grid grid-cols-3 gap-3 my-3 text-center">
                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                    <div className="text-2xl sm:text-3xl font-black text-blue-700">{ageData.years}</div>
                    <div className="text-xs font-bold text-neutral-600">वर्ष (Years)</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                    <div className="text-2xl sm:text-3xl font-black text-indigo-700">{ageData.months}</div>
                    <div className="text-xs font-bold text-neutral-600">माह (Months)</div>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700">{ageData.days}</div>
                    <div className="text-xs font-bold text-neutral-600">दिन (Days)</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs mt-3 pt-3 border-t border-blue-200/60">
                  <div className="bg-white/80 p-2 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">कुल दिन</span>
                    <span className="font-extrabold text-neutral-900">{ageData.totalDays?.toLocaleString()} दिन</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">कुल सप्ताह</span>
                    <span className="font-extrabold text-neutral-900">{ageData.totalWeeks} सप्ताह</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">कुल घंटे</span>
                    <span className="font-extrabold text-neutral-900">{ageData.totalHours?.toLocaleString()} hrs</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg">
                    <span className="text-[10px] text-neutral-500 block">अगला जन्मदिन</span>
                    <span className="font-extrabold text-blue-700">{ageData.daysUntilNextBday} दिन बाद</span>
                  </div>
                </div>
              </div>

              {/* Eligibility Verification List */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                  <span className="text-xs font-black text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>प्रमुख भर्ती परीक्षाओं में आयु पात्रता जांच (Exam Eligibility):</span>
                  </span>
                </div>

                <div className="space-y-2">
                  {EXAM_LIMITS.map((exam) => {
                    const maxAllowed = selectedCategory === 'UR' ? exam.maxUR : exam.maxRes;
                    const isEligible = (ageData.years ?? 0) >= exam.min && (ageData.years ?? 0) <= maxAllowed;

                    return (
                      <div
                        key={exam.name}
                        className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all ${
                          isEligible
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-black text-neutral-900">{exam.name}</div>
                          <div className="text-[10px] text-neutral-500">
                            आयु सीमा: {exam.min} से {maxAllowed} वर्ष • {exam.note}
                          </div>
                        </div>

                        <div>
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>योग्य (Eligible)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>अयोग्य</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white p-8 rounded-2xl border border-neutral-200 text-center text-neutral-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-bold">कृपया सही जन्मतिथि व कट-ऑफ तारीख चुनें</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
