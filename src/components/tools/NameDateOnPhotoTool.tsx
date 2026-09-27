"use client";

import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Type, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';

export const NameDateOnPhotoTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

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
  const [targetKb, setTargetKb] = useState<number>(50);

  // Explicit processing output states
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setSelectedFile(file);
    setProcessedImageUrl(null);
    setProcessedSizeKb(0);
    setErrorMessage(null);

    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setErrorMessage('फोटो लोड नहीं हो सकी। कृपया वैध फोटो चुनें।');
    };
    img.src = url;
  };

  // EXPLICIT ACTION TRIGGER FLOW (Fix Auto-Process Bug)
  const handleGeneratePhoto = async () => {
    if (!originalImageUrl || !selectedFile) {
      setErrorMessage('कृपया पहले फोटो अपलोड करें।');
      return;
    }

    if (!candidateName.trim()) {
      setErrorMessage('कृपया अभ्यर्थी का नाम दर्ज करें।');
      return;
    }

    if (!dopDate.trim()) {
      setErrorMessage('कृपया फोटो खींचने की तारीख (D.O.P.) दर्ज करें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('फोटो लोड करने में समस्या आई।'));
        img.src = originalImageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D उपलब्ध नहीं है।');

      const baseWidth = Math.max(img.naturalWidth, 400);
      const baseHeight = Math.max(img.naturalHeight, 500);

      canvas.width = baseWidth;
      canvas.height = baseHeight;

      const bannerHeight = Math.round(baseHeight * 0.20);
      const photoHeight = baseHeight - bannerHeight;

      // Fill canvas background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // Draw photo
      ctx.drawImage(img, 0, 0, baseWidth, photoHeight);

      // Draw Name & Date Banner at bottom
      ctx.fillStyle = bannerBg === 'white' ? '#ffffff' : '#000000';
      ctx.fillRect(0, photoHeight, baseWidth, bannerHeight);

      // Border line
      ctx.strokeStyle = bannerBg === 'white' ? '#d1d5db' : '#374151';
      ctx.lineWidth = Math.max(2, Math.round(baseWidth * 0.005));
      ctx.beginPath();
      ctx.moveTo(0, photoHeight);
      ctx.lineTo(baseWidth, photoHeight);
      ctx.stroke();

      // Text styling
      const textColor = bannerBg === 'white' ? '#000000' : '#ffffff';
      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const nameFontSize = Math.round(bannerHeight * 0.35);
      const dateFontSize = Math.round(bannerHeight * 0.28);

      // Candidate Name
      ctx.font = `bold ${nameFontSize}px Arial, "Noto Sans", sans-serif`;
      const nameY = photoHeight + bannerHeight * 0.35;
      ctx.fillText(candidateName.toUpperCase().trim(), baseWidth / 2, nameY, baseWidth * 0.92);

      // Date of Photo
      ctx.font = `bold ${dateFontSize}px Arial, "Noto Sans", sans-serif`;
      const dateY = photoHeight + bannerHeight * 0.75;
      const finalDateString = includePrefix ? `${prefixText}${dopDate.trim()}` : dopDate.trim();
      ctx.fillText(finalDateString, baseWidth / 2, dateY, baseWidth * 0.92);

      // Target KB compression
      const targetBytes = targetKb * 1024;
      let low = 0.1;
      let high = 0.98;
      let bestBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85)
      );

      if (bestBlob && targetKb > 0) {
        for (let i = 0; i < 6; i++) {
          const mid = (low + high) / 2;
          const testBlob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', mid)
          );
          if (testBlob) {
            bestBlob = testBlob;
            if (testBlob.size > targetBytes) {
              high = mid;
            } else {
              low = mid;
            }
          }
        }
      }

      if (!bestBlob) throw new Error('इमेज कंप्रेस नहीं हो सकी।');

      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const newUrl = URL.createObjectURL(bestBlob);
      setProcessedImageUrl(newUrl);
      setProcessedSizeKb(Math.round((bestBlob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'अपेक्षित समस्या आई');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetToday = () => {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    setDopDate(`${d}/${m}/${y}`);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          फोटो पर नाम व तारीख जोड़ें (Name & Date on Photo)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          MP ESB / SSC / पुलिस भर्ती अनिवार्य
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Name & Date on Photo"
          errorMessage={errorMessage}
          onRetry={handleGeneratePhoto}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: 3-Step Configuration */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. पासपोर्ट फोटो अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-indigo-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">पासपोर्ट फोटो चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">साफ चेहरे वाली फोटो अपलोड करें</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">
                  मूल साइज़: <span className="text-indigo-700">{originalSizeKb} KB</span>
                  {originalDimensions.width > 0 && ` (${originalDimensions.width}x${originalDimensions.height}px)`}
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Name & Date Details */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. नाम व तारीख विवरण (Candidate Details)
            </label>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">अभ्यर्थी का पूरा नाम (Candidate Name)</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="उदा. NITISH KHOBRAGADE"
                className="w-full px-3 py-2 text-xs font-bold border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden uppercase"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">फोटो खींचने की तारीख (Date of Photo - DOP)</label>
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
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
                className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="dopPrefix" className="text-xs font-semibold text-neutral-700 cursor-pointer">
                तारीख से पहले &quot;D.O.P. : &quot; जोड़ें (उदा. D.O.P. : {dopDate})
              </label>
            </div>
          </div>

          {/* Style & Target KB */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
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
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-neutral-400 bg-white"></div>
                <span>सफेद पट्टी (White Strip - मानक)</span>
              </button>

              <button
                type="button"
                onClick={() => setBannerBg('black')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  bannerBg === 'black'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full border border-neutral-400 bg-black"></div>
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
                  min="10"
                  max="500"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value)))}
                  placeholder="उदा. 40, 50, 100"
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

            {/* STEP 3: EXPLICIT ACTION TRIGGER BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || isProcessing}
                onClick={handleGeneratePhoto}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>नाम व तारीख वाली फोटो तैयार हो रही है...</span>
                  </>
                ) : (
                  <>
                    <Type className="w-4 h-4" />
                    <span>नाम व तारीख वाली फोटो बनाएं (Generate Photo)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: STEP 4 - Live Canvas Preview & Download */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
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
              <div className="min-h-[300px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center z-10">
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
                      className="mx-auto rounded-lg shadow-xl max-h-[320px] max-w-[250px] object-contain border-2 border-neutral-400 bg-white"
                    />
                    <div className="text-xs font-bold text-neutral-700">
                      {candidateName} • {includePrefix ? `${prefixText}${dopDate}` : dopDate}
                    </div>
                  </div>
                ) : originalImageUrl ? (
                  <div className="text-center space-y-2 p-4">
                    <img
                      src={originalImageUrl}
                      alt="Original Photo"
                      className="mx-auto rounded-lg opacity-85 object-contain max-h-[220px] max-w-[200px] border border-neutral-300 bg-white"
                    />
                    <p className="text-xs font-bold text-neutral-700">मूल फोटो ({originalSizeKb} KB)</p>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      नाम व तारीख लगाने के लिए बाईं तरफ &quot;नाम व तारीख वाली फोटो बनाएं&quot; बटन दबाएं
                    </p>
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
                  type="button"
                  onClick={handleGeneratePhoto}
                  disabled={!selectedFile}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-pointer hover:bg-neutral-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? 'पहले "नाम व तारीख वाली फोटो बनाएं" बटन दबाएं' : 'डाउनलोड करने हेतु पहले फोटो अपलोड करें'}
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
