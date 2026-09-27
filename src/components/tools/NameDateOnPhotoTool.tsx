"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, Type, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';

export const NameDateOnPhotoTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [candidateName, setCandidateName] = useState<string>('NITISH KHOBRAGADE');
  const [dopDate, setDopDate] = useState<string>(() => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    return `${d}/${m}/${y}`;
  });
  const [includePrefix, setIncludePrefix] = useState<boolean>(true); // e.g. "D.O.P. : "
  const prefixText = 'D.O.P. : ';
  const [bannerBg, setBannerBg] = useState<'white' | 'black'>('white');
  const fontScale = 100;
  const [targetKb, setTargetKb] = useState<number>(45);

  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);
  };

  // Canvas processing engine
  useEffect(() => {
    if (!originalImageUrl) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setIsProcessing(true);
    }, 0);

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Maintain standard passport aspect ratio (approx 3.5cm x 4.5cm or based on original)
      const baseWidth = Math.max(img.naturalWidth, 400);
      const baseHeight = Math.max(img.naturalHeight, 500);

      canvas.width = baseWidth;
      canvas.height = baseHeight;

      // Draw photo in top portion
      // We will reserve bottom ~18-20% for the white/black name and date strip
      const bannerHeight = Math.round(baseHeight * 0.20);
      const photoHeight = baseHeight - bannerHeight;

      // Fill canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Draw image
      ctx.drawImage(img, 0, 0, baseWidth, photoHeight);

      // Draw Name & Date Banner at bottom
      ctx.fillStyle = bannerBg === 'white' ? '#ffffff' : '#000000';
      ctx.fillRect(0, photoHeight, baseWidth, bannerHeight);

      // Border line separating photo and banner
      ctx.strokeStyle = bannerBg === 'white' ? '#d1d5db' : '#374151';
      ctx.lineWidth = Math.max(2, Math.round(baseWidth * 0.005));
      ctx.beginPath();
      ctx.moveTo(0, photoHeight);
      ctx.lineTo(baseWidth, photoHeight);
      ctx.stroke();

      // Outer border around the whole passport photo (standard govt requirement)
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = Math.max(2, Math.round(baseWidth * 0.006));
      ctx.strokeRect(0, 0, baseWidth, baseHeight);

      // Draw Candidate Name
      const textColor = bannerBg === 'white' ? '#000000' : '#ffffff';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate responsive font sizes
      const baseNameFontSize = Math.round((bannerHeight * 0.35) * (fontScale / 100));
      const baseDateFontSize = Math.round((bannerHeight * 0.30) * (fontScale / 100));

      // Line 1: Candidate Name
      ctx.font = `bold ${baseNameFontSize}px "Arial", "Segoe UI", sans-serif`;
      const nameY = photoHeight + bannerHeight * 0.33;
      ctx.fillText(candidateName.trim().toUpperCase(), baseWidth / 2, nameY, baseWidth * 0.92);

      // Line 2: Date of Photo
      const fullDateText = includePrefix ? `${prefixText}${dopDate}` : dopDate;
      ctx.font = `bold ${baseDateFontSize}px "Arial", "Segoe UI", sans-serif`;
      const dateY = photoHeight + bannerHeight * 0.72;
      ctx.fillText(fullDateText.trim().toUpperCase(), baseWidth / 2, dateY, baseWidth * 0.92);

      // Target size optimization (binary search quality)
      let low = 0.1;
      let high = 0.98;
      let bestBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (bestBlob && targetKb > 0) {
        for (let i = 0; i < 5; i++) {
          const mid = (low + high) / 2;
          const testBlob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', mid)
          );
          if (testBlob) {
            bestBlob = testBlob;
            if (testBlob.size / 1024 > targetKb) {
              high = mid;
            } else {
              low = mid;
            }
          }
        }
      }

      if (bestBlob && isMounted) {
        if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
        const newUrl = URL.createObjectURL(bestBlob);
        setProcessedImageUrl(newUrl);
        setProcessedSizeKb(Math.round((bestBlob.size / 1024) * 10) / 10);
        setIsProcessing(false);
      }
    };
    img.src = originalImageUrl;

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [originalImageUrl, candidateName, dopDate, includePrefix, bannerBg, targetKb]);

  // Set today date helper
  const setTodayDate = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    setDopDate(`${d}/${m}/${y}`);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          फोटो पर नाम व फोटो की दिनांक लिखें (Name & DOP on Photo)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          SSC • MP Police • व्यापम नियम
        </span>
      </div>

      {/* Main Form & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left: Input Form */}
        <div className="lg:col-span-6 space-y-3">
          {/* 1. Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. अपनी पासपोर्ट फोटो अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-indigo-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">फोटो चुनें या यहाँ खींचकर छोड़ें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">JPG, JPEG, PNG सपोर्टेड</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">मूल साइज़: <span className="text-indigo-700">{Math.round((selectedFile.size / 1024) * 10) / 10} KB</span></span>
              </div>
            )}
          </div>

          {/* 2. Candidate Name & Date Details */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. नाम व दिनांक की जानकारी (Details on Photo)
            </label>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-indigo-600" />
                <span>अभ्यर्थी का पूरा नाम (Candidate Full Name):</span>
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value.toUpperCase())}
                placeholder="उदा. NITISH KHOBRAGADE"
                className="w-full px-3 py-2 text-sm uppercase font-black tracking-wide border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-neutral-500 mt-1 block">
                * SSC व MP Police अनुसार नाम बड़े अक्षरों (CAPITAL LETTERS) में लिखा जाता है।
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>फोटो खींचने की दिनांक (Date of Photo - DOP):</span>
                </label>
                <button
                  type="button"
                  onClick={setTodayDate}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  आज की तारीख डालें
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={dopDate}
                  onChange={(e) => setDopDate(e.target.value)}
                  placeholder="DD/MM/YYYY उदा. 26/09/2026"
                  className="w-full px-3 py-2 text-xs font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <input
                  type="date"
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m, d] = e.target.value.split('-');
                      setDopDate(`${d}/${m}/${y}`);
                    }
                  }}
                  className="w-full px-2 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="dopPrefix"
                checked={includePrefix}
                onChange={(e) => setIncludePrefix(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500"
              />
              <label htmlFor="dopPrefix" className="text-xs font-semibold text-neutral-700 cursor-pointer">
                तारीख से पहले &quot;D.O.P. : &quot; जोड़ें (उदा. D.O.P. : {dopDate})
              </label>
            </div>
          </div>

          {/* 3. Style & KB Settings */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              3. पट्टी का रंग व फाइल साइज़ (Styling & Size)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBannerBg('white')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bannerBg === 'white'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-neutral-400 bg-white"></div>
                <span>सफेद पट्टी (मानक / Standard)</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerBg('black')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bannerBg === 'black'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-black"></div>
                <span>काली पट्टी (Black Strip)</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                टारगेट फाइल साइज़ दर्ज करें (अपनी पसंद का Size KB में डालें):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="5"
                  max="500"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value)))}
                  placeholder="उदा. 45"
                  className="w-full px-3 py-2 pr-12 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <span className="absolute right-3 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  KB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">क्विक साइज़:</span>
                {[20, 35, 45, 50, 100].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {kb} KB
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Canvas Preview & Download */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>लाइव आउटपुट प्रीव्यू (Live Preview)</span>
                </h3>
                {processedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {processedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Preview Area */}
              <div className="min-h-[320px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-full shadow-md">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>फोटो पर नाम व तारीख सेट हो रही है...</span>
                    </div>
                  </div>
                )}

                {processedImageUrl ? (
                  <div className="text-center space-y-2">
                    <img
                      src={processedImageUrl}
                      alt="Name and Date Photo Output"
                      className="mx-auto rounded-lg shadow-xl max-h-[340px] max-w-[260px] object-contain border-2 border-neutral-400 bg-white"
                    />
                    <div className="text-xs font-bold text-neutral-700">
                      {candidateName} • {includePrefix ? `${prefixText}${dopDate}` : dopDate}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <Type className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से पासपोर्ट फोटो अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      फोटो के नीचे अभ्यर्थी का नाम और तारीख ऑटोमेटिक जुड़ जाएगी
                    </p>
                  </div>
                )}
              </div>

              {/* Instructions Callout */}
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <span className="font-black block mb-0.5">📌 आधिकारिक परीक्षा निर्देश:</span>
                फोटो 3 महीने से अधिक पुरानी नहीं होनी चाहिए। चेहरे पर टोपी या काला चश्मा नहीं होना चाहिए तथा दोनों कान स्पष्ट दिखाई देने चाहिए।
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              {processedImageUrl ? (
                <a
                  href={processedImageUrl}
                  download={`photo_${candidateName.replace(/\s+/g, '_')}_DOP_${dopDate.replace(/\//g, '-')}.jpg`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>नाम व तारीख वाली फोटो डाउनलोड करें ({processedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-400 font-bold text-sm cursor-not-allowed text-center"
                >
                  डाउनलोड करने हेतु पहले फोटो अपलोड करें
                </button>
              )}

              {/* Security Guarantee Text */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-neutral-600 font-medium text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
