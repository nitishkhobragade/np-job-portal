"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

export const DocumentEnhancerTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);

  const [mode, setMode] = useState<'clean_bw' | 'enhance_color' | 'grayscale'>('clean_bw');
  const [contrast, setContrast] = useState<number>(140);
  const [brightness, setBrightness] = useState<number>(115);
  const [targetKb, setTargetKb] = useState<number>(180);

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedUrl) URL.revokeObjectURL(processedUrl);

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
      let low = 0.1;
      let high = 0.95;
      let bestBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.8)
      );

      if (bestBlob && targetKb > 0) {
        for (let i = 0; i < 4; i++) {
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
        if (processedUrl) URL.revokeObjectURL(processedUrl);
        const newUrl = URL.createObjectURL(bestBlob);
        setProcessedUrl(newUrl);
        setProcessedSizeKb(Math.round((bestBlob.size / 1024) * 10) / 10);
        setIsProcessing(false);
      }
    };
    img.src = originalImageUrl;

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [originalImageUrl, mode, contrast, brightness, targetKb]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-slate-900 text-white p-5 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>मार्कशीट • जाति • निवास • आय प्रमाण पत्र</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">दस्तावेज़ स्कैनर व साफ करें (Document Scanner)</h2>
            <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-2xl">
              मोबाइल से खींची गई मार्कशीट व सर्टिफिकेट की फोटो से अंधेरा, छाया व पीलापन हटाकर उसे एकदम साफ और प्रिंटर जैसे स्पष्ट स्कैन में बदलें।
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% प्राइवेट / सुरक्षित</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. दस्तावेज़ की फोटो अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl bg-teal-50/50 hover:bg-teal-50 cursor-pointer transition-colors text-center">
              <Upload className="w-9 h-9 text-teal-600 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-neutral-900">मार्कशीट या सर्टिफिकेट चुनें</span>
              <span className="text-xs text-neutral-500 mt-1">मोबाइल कैमरे से ली गई फोटो भी चलेगी</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-3 flex items-center justify-between text-xs bg-neutral-100 p-2.5 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">मूल साइज़: <span className="text-teal-700">{originalSizeKb} KB</span></span>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. स्कैनिंग मोड चुनें (Enhance Mode)
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
                <div>क्लियर B&amp;W</div>
                <div className="text-[10px] text-neutral-500 font-normal">सफेद कागज + काली स्याही</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('enhance_color')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  mode === 'enhance_color'
                    ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <div>रंगीन बूस्ट</div>
                <div className="text-[10px] text-neutral-500 font-normal">रंगीन सील व स्टैम्प</div>
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

            <div className="grid grid-cols-2 gap-3 pt-2">
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
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-semibold text-neutral-700">टारगेट साइज़ (Target KB):</span>
                <span className="font-black text-teal-700 text-sm">{targetKb} KB</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="25"
                value={targetKb}
                onChange={(e) => setTargetKb(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-neutral-500 mt-0.5">
                <span>100 KB</span>
                <span>200 KB (पोर्टल लिमिट)</span>
                <span>500 KB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
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
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-10">
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
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-400 font-bold text-sm cursor-not-allowed text-center"
                >
                  डाउनलोड करने हेतु पहले दस्तावेज़ अपलोड करें
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
