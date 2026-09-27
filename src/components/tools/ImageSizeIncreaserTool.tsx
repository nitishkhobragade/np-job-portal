"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, ShieldCheck, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';
import { compressCanvasStrictlyUnderTarget } from '../../lib/imageCompressionHelper';

export const ImageSizeIncreaserTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [targetKb, setTargetKb] = useState<number | ''>(50);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeBytes, setProcessedSizeBytes] = useState<number>(0);
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
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      // Set reasonable target KB (at least 20KB more than original or 50KB)
      const currentKb = Math.ceil(bytes / 1024);
      if (currentKb >= 50) {
        setTargetKb(currentKb + 30);
      } else {
        setTargetKb(50);
      }
    };
    img.src = url;
  };

  const handleFileRemove = () => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    setSelectedFile(null);
    setOriginalImageUrl(null);
    setOriginalSizeBytes(0);
    setDimensions({ width: 0, height: 0 });
    setProcessedImageUrl(null);
    setProcessedSizeBytes(0);
    setErrorMessage(null);
  };

  // Safe JPEG padding function that inserts a valid COM (0xFF 0xFE) marker segment
  const padJpegBytes = (jpegBuffer: ArrayBuffer, desiredTotalBytes: number): Uint8Array => {
    const originalBytes = new Uint8Array(jpegBuffer);
    if (originalBytes.length >= desiredTotalBytes) {
      return originalBytes;
    }

    const neededExtra = desiredTotalBytes - originalBytes.length;
    // JPEG COM segment header is 4 bytes (0xFF, 0xFE, lengthHigh, lengthLow)
    // We can insert after SOI (0xFF 0xD8 at index 2)
    const result = new Uint8Array(originalBytes.length + neededExtra);

    // Copy SOI (first 2 bytes)
    result[0] = originalBytes[0];
    result[1] = originalBytes[1];

    let writeIndex = 2;
    let remainingToPad = neededExtra;

    while (remainingToPad > 0) {
      // Max payload in a single JPEG segment is 65533 bytes (since length field is 16-bit)
      const segmentTotal = Math.min(remainingToPad, 65535);
      const payloadSize = Math.max(0, segmentTotal - 4);

      result[writeIndex] = 0xff;
      result[writeIndex + 1] = 0xfe; // COM marker
      const segLength = payloadSize + 2;
      result[writeIndex + 2] = (segLength >> 8) & 0xff;
      result[writeIndex + 3] = segLength & 0xff;

      // Fill harmless whitespace/padding
      result.fill(0x20, writeIndex + 4, writeIndex + 4 + payloadSize);

      writeIndex += 4 + payloadSize;
      remainingToPad -= (4 + payloadSize);
    }

    // Copy rest of the original JPEG
    result.set(originalBytes.subarray(2), writeIndex);
    return result;
  };

  const handleIncreaseSize = async () => {
    if (!selectedFile || !originalImageUrl) {
      setErrorMessage('कृपया पहले फोटो चुनें।');
      return;
    }

    const effectiveTargetKb = typeof targetKb === 'number' && targetKb > 0 ? targetKb : 50;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('फोटो लोड नहीं हो सकी।'));
        img.src = originalImageUrl;
      });

      // Draw onto canvas at 100% full original resolution
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 400;
      canvas.height = img.naturalHeight || 500;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const targetBytes = effectiveTargetKb * 1024;

      // Render at quality 1.0 (Maximum crystal clarity)
      const initialBlob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 1.0)
      );

      if (!initialBlob) throw new Error('इमेज कनवर्ट नहीं हो सकी।');

      const initialBuffer = await initialBlob.arrayBuffer();

      let finalBlob: Blob;
      if (initialBuffer.byteLength < targetBytes) {
        // Pad safely to exact target bytes
        const paddedBytes = padJpegBytes(initialBuffer, targetBytes);
        finalBlob = new Blob([paddedBytes.buffer], { type: 'image/jpeg' });
      } else if (initialBuffer.byteLength > targetBytes) {
        // If initial rendering exceeds target, compress strictly under target
        finalBlob = await compressCanvasStrictlyUnderTarget(canvas, {
          targetKb: effectiveTargetKb,
          mimeType: 'image/jpeg',
          safetyMarginBytes: 512,
        });
      } else {
        finalBlob = initialBlob;
      }

      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const url = URL.createObjectURL(finalBlob);
      setProcessedImageUrl(url);
      setProcessedSizeBytes(finalBlob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'साइज़ बढ़ाने में त्रुटि आई।');
    } finally {
      setIsProcessing(false);
    }
  };

  const originalKb = Math.ceil(originalSizeBytes / 1024);

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <ArrowUpRight className="w-4 h-4" />
          <span>इमेज साइज़ बढ़ाएं (Image Size Increaser / Target KB Boost)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          मिनिमम साइज़ नियम (Min KB Requirement)
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Image Size Increaser"
          errorMessage={errorMessage}
          onRetry={handleIncreaseSize}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-3">
          {/* Universal Upload Box with Thumbnail and Cross Button */}
          <ToolUploadBox
            label="1. अपनी फोटो चुनें (Select Image)"
            subLabel="JPG, JPEG, PNG, WEBP सपोर्टेड"
            accept="image/*"
            selectedFile={selectedFile}
            filePreviewUrl={originalImageUrl}
            dimensions={dimensions}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="image"
          />

          {/* Settings Box */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. लक्षित साइज़ दर्ज करें (Target KB To Increase)
            </label>

            <p className="text-[11px] text-neutral-600">
              मूल साइज़: <strong>{originalKb > 0 ? `${originalKb} KB` : '0 KB'}</strong> • यदि सरकारी पोर्टल पर <strong>&quot;File size must be greater than 20KB or 50KB&quot;</strong> आ रहा है, तो यहाँ आवश्यक साइज़ दर्ज करें। फोटो की क्वालिटी बिल्कुल नहीं घटेगी!
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={2000}
                value={targetKb}
                placeholder="उदा. 50"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setTargetKb('');
                  } else {
                    const n = parseInt(v, 10);
                    setTargetKb(isNaN(n) ? '' : n);
                  }
                }}
                className="w-36 px-3 py-2 text-sm font-black bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <span className="text-xs font-black text-neutral-700">
                {targetKb !== '' ? `${targetKb} KB तक बढ़ाएं` : 'KB दर्ज करें'}
              </span>
            </div>

            {/* Quick Target Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[30, 45, 50, 75, 100, 150, 200].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setTargetKb(kb)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                    targetKb === kb
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-200'
                  }`}
                >
                  {kb} KB
                </button>
              ))}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleIncreaseSize}
                disabled={!selectedFile || isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>साइज़ बढ़ाया जा रहा है...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>इमेज साइज़ बढ़ाएं (Increase File Size to {targetKb} KB)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col items-center justify-center min-h-[320px]">
            {processedImageUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>सफलतापूर्वक साइज़ बढ़ाया गया!</span>
                </div>

                <div className="max-w-[260px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-neutral-100 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageUrl}
                    alt="Processed Preview"
                    className="w-full h-auto max-h-[260px] object-contain mx-auto rounded-lg"
                  />
                </div>

                {/* Size comparison pill */}
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
                  download={`increased_${selectedFile?.name || 'photo.jpg'}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>डाउनलोड करें ({formatFileSize(processedSizeBytes)})</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <ArrowUpRight className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर फोटो अपलोड करें और &apos;इमेज साइज़ बढ़ाएं&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  सरकारी फॉर्म पोर्टल द्वारा मान्य मिनिमम KB सुरक्षित रूप से तैयार होगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
