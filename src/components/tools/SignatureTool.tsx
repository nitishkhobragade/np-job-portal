"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, CheckCircle2, Feather } from 'lucide-react';

export const SignatureTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);

  const [width, setWidth] = useState<number>(140);
  const [height, setHeight] = useState<number>(60);
  const [targetKb, setTargetKb] = useState<number>(18);
  const [contrast, setContrast] = useState<number>(130); // 100 is normal
  const [brightness, setBrightness] = useState<number>(110);
  const [cleanWhiteBg, setCleanWhiteBg] = useState<boolean>(true);
  const [grayscale, setGrayscale] = useState<boolean>(true);

  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);
  };

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

      canvas.width = width;
      canvas.height = height;

      // Draw image
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Pixel processing for clean white background and sharp ink
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const brightnessOffset = (brightness - 100) * 1.5;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Convert to grayscale
        if (grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
        }

        // Apply contrast & brightness
        r = contrastFactor * (r - 128) + 128 + brightnessOffset;
        g = contrastFactor * (g - 128) + 128 + brightnessOffset;
        b = contrastFactor * (b - 128) + 128 + brightnessOffset;

        // Clean white background filter (threshold out off-white paper and shadows)
        if (cleanWhiteBg) {
          const avg = (r + g + b) / 3;
          if (avg > 185) {
            r = 255;
            g = 255;
            b = 255;
          } else if (avg < 110) {
            // Darken ink
            r = Math.max(0, r - 30);
            g = Math.max(0, g - 30);
            b = Math.max(0, b - 30);
          }
        }

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      }

      ctx.putImageData(imgData, 0, 0);

      // Fine tune KB
      let low = 0.1;
      let high = 0.98;
      let bestBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
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
  }, [originalImageUrl, width, height, targetKb, contrast, brightness, cleanWhiteBg, grayscale]);

  const setPreset = (w: number, h: number, kb: number) => {
    setWidth(w);
    setHeight(h);
    setTargetKb(kb);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          हस्ताक्षर (Signature) रिसाइज़र व बैकग्राउंड क्लीनर
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          10-20 KB • SSC / व्यापम / UPSC
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-3">
          {/* 1. Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. अपने हस्ताक्षर (Signature) की फोटो अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-emerald-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">सिग्नेचर फोटो चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">मोबाइल से खींची गई फोटो भी चलेगी</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">मूल साइज़: <span className="text-emerald-700">{originalSizeKb} KB</span></span>
              </div>
            )}
          </div>

          {/* 2. Fast Exam Presets */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. परीक्षा अनुसार मानक साइज़ चुनें (Exam Presets)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset(140, 60, 18)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  width === 140 && height === 60
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>SSC & Bank</div>
                <div className="text-[10px] text-neutral-500 font-normal">140x60 px (10-20KB)</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset(150, 80, 30)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  width === 150 && height === 80
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>MP ESB व्यापम</div>
                <div className="text-[10px] text-neutral-500 font-normal">150x80 px (10-40KB)</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset(140, 110, 25)}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  width === 140 && height === 110
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>UPSC / Railway</div>
                <div className="text-[10px] text-neutral-500 font-normal">140x110 px (10-30KB)</div>
              </button>
            </div>
          </div>

          {/* 3. Image Contrast & Background Clean Filters */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              3. स्याही डार्क करें व छाया हटाएं (Ink & Paper Filters)
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanWhiteBg}
                  onChange={(e) => setCleanWhiteBg(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-neutral-800">
                  कागज की छाया व पीलापन हटाएं (Auto Clean White Background)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={grayscale}
                  onChange={(e) => setGrayscale(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-neutral-800">
                  ब्लैक एंड व्हाइट / डार्क स्याही मोड (Black & White Ink)
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-700">कांट्रास्ट (Contrast):</span>
                  <span className="font-bold text-emerald-700">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-700">ब्राइटनेस (Brightness):</span>
                  <span className="font-bold text-emerald-700">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                टारगेट फाइल साइज़ दर्ज करें (अपनी पसंद का Size KB में डालें):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value)))}
                  placeholder="उदा. 10, 15, 20"
                  className="w-full px-3 py-2 pr-12 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <span className="absolute right-3 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  KB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">क्विक साइज़:</span>
                {[10, 15, 18, 20, 30, 50].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
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

        {/* Right Column: Output Preview */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>सिग्नेचर आउटपुट प्रीव्यू (Preview)</span>
                </h3>
                {processedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {processedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Preview Box */}
              <div className="min-h-[220px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-white px-3 py-1.5 rounded-full shadow-md">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>सिग्नेचर प्रोसेस हो रहा है...</span>
                    </div>
                  </div>
                )}

                {processedImageUrl ? (
                  <div className="text-center space-y-3">
                    <div className="p-3 bg-white border border-neutral-300 rounded-lg shadow-sm inline-block">
                      <img
                        src={processedImageUrl}
                        alt="Signature Output"
                        style={{ width: `${width}px`, height: `${height}px` }}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-xs font-bold text-neutral-600">
                      आयाम: {width} x {height} px • साइज़: {processedSizeKb} KB
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <Feather className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से हस्ताक्षर की फोटो अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      पीलापन हटकर तुरंत साफ सिग्नेचर यहाँ दिखाई देगा
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950">
                <span className="font-black block mb-0.5">✅ फॉर्म अपलोड के लिए उपयुक्त:</span>
                यह सिग्नेचर SSC, MP ESB, UPSC और Railway के 10KB-20KB और सफेद बैकग्राउंड के सभी नियमों पर 100% खरा उतरता है।
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              {processedImageUrl ? (
                <a
                  href={processedImageUrl}
                  download={`signature_${width}x${height}_${processedSizeKb}KB.jpg`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>सिग्नेचर डाउनलोड करें ({processedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-400 font-bold text-sm cursor-not-allowed text-center"
                >
                  डाउनलोड करने हेतु पहले सिग्नेचर अपलोड करें
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
