"use client";

import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Sparkles, ShieldCheck, CheckCircle2, FileType } from 'lucide-react';

export const FormatConverterTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);

  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(90);

  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSizeKb, setConvertedSizeKb] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);
    setConvertedUrl(null);
  };

  const handleConvert = async () => {
    if (!originalImageUrl) return;

    setIsConverting(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // If converting to JPEG, fill white background to avoid transparent black artifact
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            if (convertedUrl) URL.revokeObjectURL(convertedUrl);
            const url = URL.createObjectURL(blob);
            setConvertedUrl(url);
            setConvertedSizeKb(Math.round((blob.size / 1024) * 10) / 10);
          }
          setIsConverting(false);
        },
        targetFormat,
        quality / 100
      );
    };
    img.src = originalImageUrl;
  };

  const getExtension = () => {
    if (targetFormat === 'image/jpeg') return 'jpg';
    if (targetFormat === 'image/png') return 'png';
    return 'webp';
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white p-5 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>JPG • PNG • WEBP • JPEG परिवर्तक</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">फोटो फॉर्मेट कनवर्टर (Image Format Converter)</h2>
            <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-2xl">
              सरकारी नौकरी फॉर्म में केवल JPG/JPEG मांगा जाता है। यदि आपकी फोटो PNG या WEBP है, तो उसे यहाँ बिना किसी क्वालिटी नुकसान के तुरंत JPG में बदलें।
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% प्राइवेट / कोई सर्वर नहीं</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Upload & Settings */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. फोटो चुनें जिसे बदलना है
            </label>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-amber-300 hover:border-amber-500 rounded-xl bg-amber-50/50 hover:bg-amber-50 cursor-pointer transition-colors text-center">
              <Upload className="w-9 h-9 text-amber-600 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-neutral-900">फोटो चुनें</span>
              <span className="text-xs text-neutral-500 mt-1">PNG, WEBP, JPG, BMP कोई भी फॉर्मेट</span>
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-3 flex items-center justify-between text-xs bg-neutral-100 p-2.5 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">साइज़: <span className="text-amber-700">{originalSizeKb} KB</span></span>
              </div>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. नया फॉर्मेट चुनें (Target Format)
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
                <span className="font-black">JPG / JPEG</span>
                <span className="text-[10px] text-neutral-500 font-normal">फॉर्म के लिए बेस्ट</span>
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
                <span className="font-black">PNG</span>
                <span className="text-[10px] text-neutral-500 font-normal">ट्रांसपेरेंट सपोर्ट</span>
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
                <span className="font-black">WEBP</span>
                <span className="text-[10px] text-neutral-500 font-normal">अल्ट्रा लाइट</span>
              </button>
            </div>

            {targetFormat !== 'image/png' && (
              <div>
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-neutral-700">इमेज क्वालिटी (Quality):</span>
                  <span className="font-bold text-amber-700">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-amber-600 cursor-pointer"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleConvert}
              disabled={!originalImageUrl || isConverting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-neutral-300 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>फॉर्मेट बदला जा रहा है...</span>
                </>
              ) : (
                <span>{getExtension().toUpperCase()} में बदलें</span>
              )}
            </button>
          </div>
        </div>

        {/* Right: Output */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>कनवर्टेड आउटपुट (Output)</span>
                </h3>
                {convertedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {convertedSizeKb} KB
                  </span>
                )}
              </div>

              <div className="min-h-[260px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {convertedUrl ? (
                  <div className="text-center space-y-2">
                    <img
                      src={convertedUrl}
                      alt="Converted Output"
                      className="mx-auto rounded-lg shadow-md max-h-[260px] object-contain border border-neutral-300 bg-white"
                    />
                    <div className="text-xs font-bold text-neutral-600">
                      फॉर्मेट: .{getExtension()} • साइज़: {convertedSizeKb} KB
                    </div>
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
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-400 font-bold text-sm cursor-not-allowed text-center"
                >
                  कनवर्ट होने के बाद डाउनलोड बटन सक्रिय होगा
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
