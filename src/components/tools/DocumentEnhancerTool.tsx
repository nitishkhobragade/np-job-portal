"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, Wand2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

export const DocumentEnhancerTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Filters
  const [mode, setMode] = useState<'clean-bw' | 'grayscale' | 'contrast-color'>('clean-bw');
  const [brightness, setBrightness] = useState<number>(10);
  const [contrast, setContrast] = useState<number>(30);
  const [threshold, setThreshold] = useState<number>(180);

  // Processed Output
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeBytes, setProcessedSizeBytes] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setSelectedFile(file);
    setProcessedImageUrl(null);
    setProcessedSizeBytes(0);
    setErrorMessage(null);

    const bytes = await getRealFileBytes(file);
    setOriginalSizeBytes(bytes);

    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  const handleFileRemove = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    setSelectedFile(null);
    setOriginalImageUrl(null);
    setOriginalSizeBytes(0);
    setOriginalDimensions({ width: 0, height: 0 });
    setProcessedImageUrl(null);
    setProcessedSizeBytes(0);
    setErrorMessage(null);
  };

  const handleEnhance = async () => {
    if (!originalImageUrl || !selectedFile) {
      setErrorMessage('कृपया पहले दस्तावेज़ की फोटो चुनें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('दस्तावेज़ फोटो लोड नहीं हो सकी।'));
        img.src = originalImageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D संदर्भ उपलब्ध नहीं है।');

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;

      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < d.length; i += 4) {
        let r = d[i] + brightness;
        let g = d[i + 1] + brightness;
        let b = d[i + 2] + brightness;

        r = Math.min(255, Math.max(0, contrastFactor * (r - 128) + 128));
        g = Math.min(255, Math.max(0, contrastFactor * (g - 128) + 128));
        b = Math.min(255, Math.max(0, contrastFactor * (b - 128) + 128));

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (mode === 'clean-bw') {
          // Binarize
          const val = gray > threshold ? 255 : Math.max(0, gray * 0.7);
          d[i] = val;
          d[i + 1] = val;
          d[i + 2] = val;
        } else if (mode === 'grayscale') {
          d[i] = gray;
          d[i + 1] = gray;
          d[i + 2] = gray;
        } else {
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = b;
        }
      }

      ctx.putImageData(imgData, 0, 0);

      const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9));
      if (!blob) throw new Error('दस्तावेज़ प्रोसेस करने में विफलता आई।');

      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const url = URL.createObjectURL(blob);
      setProcessedImageUrl(url);
      setProcessedSizeBytes(blob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'दस्तावेज़ साफ करने में त्रुटि आई।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Wand2 className="w-4 h-4" />
          <span>दस्तावेज़ स्कैनर व साफ करें (Document Scanner &amp; Cleaner)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          पीलापन व छाया हटाएं • B&amp;W प्रिंटर रेडी
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
          <ToolUploadBox
            label="1. मार्कशीट या दस्तावेज़ की फोटो चुनें (Upload Document)"
            subLabel="JPG, PNG, WEBP समर्थित"
            accept="image/*"
            selectedFile={selectedFile}
            filePreviewUrl={originalImageUrl}
            dimensions={originalDimensions}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="image"
          />

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. क्लीनिंग मोड व प्रभाव (Enhance Filters)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'clean-bw', name: 'क्लीन B&W', desc: 'सफेद पेपर + डार्क टेक्स्ट' },
                { id: 'grayscale', name: 'ग्रेस्केल', desc: 'प्राकृतिक ब्लैक एंड व्हाइट' },
                { id: 'contrast-color', name: 'हाई कॉन्ट्रास्ट', desc: 'रंगीन स्पष्टता' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    mode === m.id
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-bold ring-1 ring-emerald-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="text-xs font-black">{m.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-2 pt-1 border-t border-neutral-200">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 mb-0.5">
                  <span>कागज़ की सफेदी (Paper Whiteness Threshold):</span>
                  <span>{threshold}</span>
                </div>
                <input
                  type="range"
                  min={120}
                  max={230}
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 mb-0.5">
                  <span>ब्राइटनेस (Brightness):</span>
                  <span>{brightness}</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={50}
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 mb-0.5">
                  <span>कॉन्ट्रास्ट (Contrast):</span>
                  <span>{contrast}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleEnhance}
              disabled={!selectedFile || isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>साफ किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>3. दस्तावेज़ साफ करें (Clean &amp; Enhance)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {processedImageUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>दस्तावेज़ सफलतापूर्वक साफ हुआ!</span>
                </div>

                <div className="max-w-[280px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-neutral-100 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageUrl}
                    alt="Enhanced Document"
                    className="w-full h-auto max-h-[260px] object-contain mx-auto rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-center gap-3 text-xs bg-neutral-50 p-2 rounded-xl border border-neutral-200 font-bold">
                  <span className="text-neutral-500">
                    मूल: <strong className="text-neutral-700">{formatFileSize(originalSizeBytes)}</strong>
                  </span>
                  <span className="text-emerald-600">➔</span>
                  <span className="text-emerald-700">
                    नया साइज़: <strong className="text-emerald-800">{formatFileSize(processedSizeBytes)}</strong>
                  </span>
                </div>

                <a
                  href={processedImageUrl}
                  download={`clean_${selectedFile?.name || 'document.jpg'}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>साफ कॉपी डाउनलोड करें ({formatFileSize(processedSizeBytes)})</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <Wand2 className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  मार्कशीट/सर्टिफिकेट की फोटो अपलोड करें और साफ करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  मोबाइल से खींची फोटो से अंधेरा व पीलापन हटाकर प्रिंटर-कॉपी तैयार होगी
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
