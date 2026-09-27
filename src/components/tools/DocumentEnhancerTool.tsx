"use client";

import React, { useState } from 'react';
import { Upload, Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';

export const DocumentEnhancerTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [mode, setMode] = useState<'clean_bw' | 'grayscale' | 'color_enhanced'>('clean_bw');
  const [contrast, setContrast] = useState<number>(140);
  const [brightness, setBrightness] = useState<number>(105);
  const [targetKb, setTargetKb] = useState<number>(200);

  // Output states
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);

    setSelectedFile(file);
    setProcessedUrl(null);
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
      setErrorMessage('दस्तावेज़ इमेज लोड करने में समस्या आई।');
    };
    img.src = url;
  };

  // EXPLICIT ACTION TRIGGER: Clean & enhance document
  const handleEnhance = async () => {
    if (!originalImageUrl || !selectedFile) {
      setErrorMessage('कृपया पहले दस्तावेज़ की फोटो अपलोड करें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('इमेज प्रोसेस करने में विफलता आई।'));
        img.src = originalImageUrl;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D उपलब्ध नहीं है।');

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const brightnessOffset = (brightness - 100) * 1.5;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (mode === 'clean_bw' || mode === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = gray;
          g = gray;
          b = gray;
        }

        // Apply contrast & brightness
        r = contrastFactor * (r - 128) + 128 + brightnessOffset;
        g = contrastFactor * (g - 128) + 128 + brightnessOffset;
        b = contrastFactor * (b - 128) + 128 + brightnessOffset;

        // Auto clean background paper for clean_bw mode
        if (mode === 'clean_bw') {
          const avg = (r + g + b) / 3;
          if (avg > 175) {
            r = 255;
            g = 255;
            b = 255;
          } else if (avg < 110) {
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

      // Target size optimization
      const targetBytes = targetKb * 1024;
      let low = 0.1;
      let high = 0.95;
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
            if (testBlob.size > targetBytes) {
              high = mid;
            } else {
              low = mid;
            }
          }
        }
      }

      if (!bestBlob) throw new Error('दस्तावेज़ साफ नहीं हो सका।');

      if (processedUrl) URL.revokeObjectURL(processedUrl);
      const newUrl = URL.createObjectURL(bestBlob);
      setProcessedUrl(newUrl);
      setProcessedSizeKb(Math.round((bestBlob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'अपेक्षित समस्या आई');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-900 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          दस्तावेज़ स्कैनर व क्लीनर (Document Enhancer & Shadow Remover)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          मार्कशीट • जाति • निवास • प्रमाण पत्र
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Document Enhancer"
          errorMessage={errorMessage}
          onRetry={handleEnhance}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. दस्तावेज़ / मार्कशीट की फोटो अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl bg-teal-50/50 hover:bg-teal-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-teal-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">दस्तावेज़ की फोटो चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">मोबाइल से खींची गई मार्कशीट की फोटो भी चलेगी</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">
                  मूल साइज़: <span className="text-teal-700">{originalSizeKb} KB</span>
                  {originalDimensions.width > 0 && ` (${originalDimensions.width}x${originalDimensions.height}px)`}
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Enhancement Mode & Settings */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. क्लीनिंग मोड व साइज़ (Enhancement Mode)
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('clean_bw')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mode === 'clean_bw'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>साफ B&W</div>
                <div className="text-[10px] text-neutral-500 font-normal">छाया हटाए</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('color_enhanced')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mode === 'color_enhanced'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>कलर साफ</div>
                <div className="text-[10px] text-neutral-500 font-normal">रंग सुरक्षित</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('grayscale')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mode === 'grayscale'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>ग्रेस्केल</div>
                <div className="text-[10px] text-neutral-500 font-normal">स्मूथ टोन</div>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-700">कांट्रास्ट:</span>
                  <span className="font-bold text-teal-700">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-neutral-700">ब्राइटनेस:</span>
                  <span className="font-bold text-teal-700">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
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
                  min="20"
                  max="2000"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value)))}
                  placeholder="उदा. 150, 200, 300"
                  className="w-full px-3 py-2 pr-12 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <span className="absolute right-3 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  KB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">क्विक साइज़:</span>
                {[100, 150, 200, 300, 500].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
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
                onClick={handleEnhance}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>दस्तावेज़ को साफ किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>दस्तावेज़ साफ करें (Enhance Document)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: STEP 4 - Live Preview & Download */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>साफ स्कैन प्रीव्यू (Enhanced Preview)</span>
                </h3>
                {processedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {processedSizeKb} KB
                  </span>
                )}
              </div>

              <div className="min-h-[280px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-700 bg-white px-3 py-1.5 rounded-full shadow-md">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>दस्तावेज़ को साफ किया जा रहा है...</span>
                    </div>
                  </div>
                )}

                {processedUrl ? (
                  <div className="text-center space-y-2">
                    <img
                      src={processedUrl}
                      alt="Enhanced Document"
                      className="mx-auto rounded-lg shadow-md max-h-[300px] object-contain border border-neutral-300 bg-white"
                    />
                    <div className="text-xs font-bold text-neutral-600">
                      साफ दस्तावेज़ • साइज़: {processedSizeKb} KB
                    </div>
                  </div>
                ) : originalImageUrl ? (
                  <div className="text-center space-y-2 p-4">
                    <img
                      src={originalImageUrl}
                      alt="Original Document"
                      className="mx-auto rounded-lg opacity-85 object-contain max-h-[200px] border border-neutral-300 bg-white"
                    />
                    <p className="text-xs font-bold text-neutral-700">मूल दस्तावेज़ ({originalSizeKb} KB)</p>
                    <p className="text-[11px] text-teal-700 font-medium">
                      छाया हटाने व साफ करने हेतु बाईं तरफ &quot;दस्तावेज़ साफ करें&quot; बटन दबाएं
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से मार्कशीट या सर्टिफिकेट अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      छाया हटकर एकदम साफ स्कैन कॉपी तैयार हो जाएगी
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              {processedUrl ? (
                <a
                  href={processedUrl}
                  download={`clean_document_${processedSizeKb}KB.jpg`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>साफ दस्तावेज़ डाउनलोड करें ({processedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={!selectedFile}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-pointer hover:bg-neutral-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? 'पहले "दस्तावेज़ साफ करें" बटन दबाएं' : 'डाउनलोड करने हेतु पहले दस्तावेज़ अपलोड करें'}
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
