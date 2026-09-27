"use client";

import React, { useState } from 'react';
import { Upload, Download, RefreshCw, CheckCircle2, FileType, ShieldCheck } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';

export const FormatConverterTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);

  // Explicit processing output states
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSizeKb, setConvertedSizeKb] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);

    setSelectedFile(file);
    setConvertedUrl(null);
    setConvertedSizeKb(0);
    setErrorMessage(null);

    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setErrorMessage('इमेज लोड नहीं हो सकी। कृपया वैध फोटो चुनें।');
    };
    img.src = url;
  };

  // EXPLICIT ACTION TRIGGER
  const handleConvert = async () => {
    if (!originalImageUrl || !selectedFile) {
      setErrorMessage('कृपया पहले फोटो चुनें जिसे बदलना है।');
      return;
    }

    setIsConverting(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('इमेज पढ़ने में त्रुटि आई।'));
        img.src = originalImageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D उपलब्ध नहीं है।');

      // If converting to JPEG, fill white background to avoid transparent black artifacts
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, targetFormat, quality / 100)
      );

      if (!blob) throw new Error('इमेज कनवर्ट नहीं हो सकी।');

      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedSizeKb(Math.round((blob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'अपेक्षित समस्या आई');
    } finally {
      setIsConverting(false);
    }
  };

  const getExtension = () => {
    if (targetFormat === 'image/jpeg') return 'jpg';
    if (targetFormat === 'image/png') return 'png';
    return 'webp';
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          फोटो फॉर्मेट कनवर्टर (Image Format Converter)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          PNG / WEBP से तुरंत JPG (सरकारी फॉर्म कम्पैटिबल)
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Format Converter"
          errorMessage={errorMessage}
          onRetry={handleConvert}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left: Upload & Settings */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. फोटो चुनें जिसे बदलना है
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-amber-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">फोटो चुनें या यहाँ छोड़ें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">PNG, WEBP, JPG, BMP कोई भी फॉर्मेट</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">
                  मूल साइज़: <span className="text-amber-700">{originalSizeKb} KB</span>
                  {originalDimensions.width > 0 && ` (${originalDimensions.width}x${originalDimensions.height}px)`}
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Settings */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. नया फॉर्मेट व क्वालिटी चुनें (Target Format)
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetFormat('image/jpeg')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  targetFormat === 'image/jpeg'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <FileType className="w-5 h-5 text-amber-600" />
                <span className="font-black text-sm">JPG / JPEG</span>
                <span className="text-[10px] text-neutral-500">फॉर्म हेतु सर्वश्रेष्ठ</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetFormat('image/png')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  targetFormat === 'image/png'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <FileType className="w-5 h-5 text-blue-600" />
                <span className="font-black text-sm">PNG</span>
                <span className="text-[10px] text-neutral-500">हाई क्वालिटी</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetFormat('image/webp')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  targetFormat === 'image/webp'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <FileType className="w-5 h-5 text-emerald-600" />
                <span className="font-black text-sm">WEBP</span>
                <span className="text-[10px] text-neutral-500">छोटा साइज़</span>
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-700">आउटपुट इमेज क्वालिटी (Quality):</span>
                <span className="font-bold text-amber-700">{quality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            {/* STEP 3: EXPLICIT ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || isConverting}
                onClick={handleConvert}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>कन्वर्ट किया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <FileType className="w-4 h-4" />
                    <span>फॉर्मेट कनवर्ट करें (Convert Format)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: STEP 4 - Live Preview & Download */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>आउटपुट प्रीव्यू (Preview)</span>
                </h3>
                {convertedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    नया साइज़: {convertedSizeKb} KB
                  </span>
                )}
              </div>

              <div className="min-h-[260px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isConverting && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-white px-3 py-1.5 rounded-full shadow-md">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>कन्वर्ट हो रहा है...</span>
                    </div>
                  </div>
                )}

                {convertedUrl ? (
                  <div className="text-center space-y-2">
                    <img
                      src={convertedUrl}
                      alt="Converted Output"
                      className="mx-auto rounded-lg shadow-md max-h-[260px] max-w-[240px] object-contain border border-neutral-300 bg-white"
                    />
                    <div className="text-xs font-bold text-neutral-600">
                      फॉर्मेट: .{getExtension().toUpperCase()} • साइज़: {convertedSizeKb} KB
                    </div>
                  </div>
                ) : originalImageUrl ? (
                  <div className="text-center space-y-2 p-4">
                    <img
                      src={originalImageUrl}
                      alt="Original"
                      className="mx-auto rounded-lg opacity-85 object-contain max-h-[200px] max-w-[200px] border border-neutral-300 bg-white"
                    />
                    <p className="text-xs font-bold text-neutral-700">मूल फोटो ({originalSizeKb} KB)</p>
                    <p className="text-[11px] text-amber-700 font-medium">
                      कन्वर्ट करने हेतु बाईं तरफ &quot;फॉर्मेट कनवर्ट करें&quot; बटन दबाएं
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <FileType className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">बाईं तरफ से फोटो चुनकर कनवर्ट करें</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              {convertedUrl ? (
                <a
                  href={convertedUrl}
                  download={`converted_image_${convertedSizeKb}KB.${getExtension()}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>.{getExtension().toUpperCase()} फाइल डाउनलोड करें ({convertedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={!selectedFile}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-pointer hover:bg-neutral-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? 'पहले "फॉर्मेट कनवर्ट करें" बटन दबाएं' : 'कनवर्ट होने के बाद डाउनलोड बटन सक्रिय होगा'}
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
