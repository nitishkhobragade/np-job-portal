"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle2, FileType, ShieldCheck } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

export const FormatConverterTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [quality, setQuality] = useState<number>(92);

  // Explicit processing output states
  const [convertedUrl, setConvertedUrl] = useState<string | null>(null);
  const [convertedSizeBytes, setConvertedSizeBytes] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);

    setSelectedFile(file);
    setConvertedUrl(null);
    setConvertedSizeBytes(0);
    setErrorMessage(null);

    const bytes = await getRealFileBytes(file);
    setOriginalSizeBytes(bytes);

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

  const handleFileRemove = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (convertedUrl) URL.revokeObjectURL(convertedUrl);
    setSelectedFile(null);
    setOriginalImageUrl(null);
    setOriginalSizeBytes(0);
    setOriginalDimensions({ width: 0, height: 0 });
    setConvertedUrl(null);
    setConvertedSizeBytes(0);
    setErrorMessage(null);
  };

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

      // White background for transparent PNG to JPG conversion
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const q = targetFormat === 'image/png' ? undefined : quality / 100;
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, targetFormat, q)
      );

      if (!blob) throw new Error('फॉर्मेट कन्वर्शन में विफलता आई।');

      if (convertedUrl) URL.revokeObjectURL(convertedUrl);
      const url = URL.createObjectURL(blob);
      setConvertedUrl(url);
      setConvertedSizeBytes(blob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'कन्वर्शन नहीं हो सका।');
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <FileType className="w-4 h-4" />
          <span>इमेज फॉर्मेट कनवर्टर (JPG, PNG, WEBP, BMP Converter)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          सरकारी फॉर्म स्वीकृत JPG में बदलें
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
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. बदलने वाली फोटो चुनें (Select Image)"
            subLabel="JPG, PNG, WEBP, BMP समर्थित"
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
              2. नया फॉर्मेट व क्वालिटी चुनें (Target Format)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {([
                { id: 'image/jpeg', name: 'JPG / JPEG', desc: 'सरकारी फॉर्म हेतु बेस्ट' },
                { id: 'image/png', name: 'PNG', desc: 'पारदर्शी / लॉसलेस' },
                { id: 'image/webp', name: 'WEBP', desc: 'आधुनिक वेब साइज़' },
              ] as const).map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setTargetFormat(fmt.id)}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    targetFormat === fmt.id
                      ? 'bg-amber-50 border-amber-600 text-amber-950 font-bold ring-1 ring-amber-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="text-xs font-black">{fmt.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">{fmt.desc}</div>
                </button>
              ))}
            </div>

            {targetFormat !== 'image/png' && (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-neutral-600 mb-1">
                  <span>इमेज कंप्रेशन क्वालिटी:</span>
                  <span className="text-amber-700">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={40}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleConvert}
              disabled={!selectedFile || isConverting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>कन्वर्शन हो रहा है...</span>
                </>
              ) : (
                <>
                  <FileType className="w-4 h-4" />
                  <span>3. {getExtension().toUpperCase()} में बदलें (Convert Now)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {convertedUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>सफलतापूर्वक {getExtension().toUpperCase()} में बदला गया!</span>
                </div>

                <div className="max-w-[240px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-neutral-100 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={convertedUrl}
                    alt="Converted Preview"
                    className="w-full h-auto max-h-[240px] object-contain mx-auto rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-center gap-3 text-xs bg-neutral-50 p-2 rounded-xl border border-neutral-200 font-bold">
                  <span className="text-neutral-500">
                    मूल: <strong className="text-neutral-700">{formatFileSize(originalSizeBytes)}</strong>
                  </span>
                  <span className="text-emerald-600">➔</span>
                  <span className="text-emerald-700">
                    नया साइज़: <strong className="text-emerald-800">{formatFileSize(convertedSizeBytes)}</strong>
                  </span>
                </div>

                <a
                  href={convertedUrl}
                  download={`converted_${selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'image'}.${getExtension()}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{getExtension().toUpperCase()} डाउनलोड करें ({formatFileSize(convertedSizeBytes)})</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <FileType className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर फोटो अपलोड करें और इच्छित फॉर्मेट में बदलें
                </p>
                <p className="text-[10px] text-neutral-400">
                  100% सुरक्षित और प्राइवेट लोकल ब्राउज़र प्रोसेसिंग
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
