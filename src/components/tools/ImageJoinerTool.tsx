"use client";

import React, { useState } from 'react';
import { Upload, Download, RefreshCw, Trash2, ArrowRight, ArrowDown, ShieldCheck, CheckCircle2, Layers } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeKb: number;
  width: number;
  height: number;
}

export const ImageJoinerTool: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [direction, setDirection] = useState<'horizontal' | 'vertical'>('vertical');
  const [arrangeMode, setArrangeMode] = useState<'proper' | 'free'>('proper');
  const [addBorder, setAddBorder] = useState<boolean>(true);
  const [borderWidth, setBorderWidth] = useState<number>(2);
  const [targetKb, setTargetKb] = useState<number>(80);

  // Output states
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [joinedImageUrl, setJoinedImageUrl] = useState<string | null>(null);
  const [joinedSizeKb, setJoinedSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setErrorMessage(null);
    setJoinedImageUrl(null);
    setJoinedSizeKb(0);

    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).substring(2, 9),
            file,
            previewUrl: url,
            name: file.name,
            sizeKb: Math.round((file.size / 1024) * 10) / 10,
            width: img.naturalWidth,
            height: img.naturalHeight,
          }
        ]);
      };
      img.onerror = () => {
        setErrorMessage('कुछ इमेज लोड करने में समस्या आई।');
      };
      img.src = url;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
    setJoinedImageUrl(null);
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const copy = [...images];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setImages(copy);
    setJoinedImageUrl(null);
  };

  // EXPLICIT ACTION TRIGGER: Join Images via Canvas
  const handleJoinImages = async () => {
    if (images.length < 2) {
      setErrorMessage('कृपया जोड़ने के लिए कम से कम 2 फोटो अपलोड करें (उदा. फोटो + हस्ताक्षर)।');
      return;
    }

    setIsJoining(true);
    setErrorMessage(null);

    try {
      // Load all images as HTMLImageElements
      const loadedImgs = await Promise.all(
        images.map(
          (item) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error(`चित्र लोड नहीं हो सका: ${item.name}`));
              img.src = item.previewUrl;
            })
        )
      );

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('ब्राउज़र Canvas 2D सपोर्ट नहीं करता।');

      const gap = addBorder ? borderWidth * 2 : 0;

      if (direction === 'vertical') {
        // Vertical stacking (Photo on top, Signature on bottom)
        let targetWidth = 400;
        if (arrangeMode === 'proper') {
          targetWidth = Math.max(...loadedImgs.map((img) => img.naturalWidth), 400);
        }

        const calculatedHeights = loadedImgs.map((img) => {
          if (arrangeMode === 'proper') {
            const ratio = targetWidth / img.naturalWidth;
            return Math.round(img.naturalHeight * ratio);
          }
          return img.naturalHeight;
        });

        const totalHeight = calculatedHeights.reduce((acc, h) => acc + h, 0) + (loadedImgs.length - 1) * gap;
        const finalWidth = arrangeMode === 'proper' ? targetWidth : Math.max(...loadedImgs.map((img) => img.naturalWidth));

        canvas.width = finalWidth;
        canvas.height = totalHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentY = 0;
        loadedImgs.forEach((img, idx) => {
          const h = calculatedHeights[idx];
          const w = arrangeMode === 'proper' ? finalWidth : img.naturalWidth;
          const x = arrangeMode === 'proper' ? 0 : Math.round((finalWidth - w) / 2);

          ctx.drawImage(img, x, currentY, w, h);

          // Draw border divider
          if (addBorder && idx < loadedImgs.length - 1) {
            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(0, currentY + h, finalWidth, gap);
          }

          currentY += h + gap;
        });
      } else {
        // Horizontal stacking (side by side)
        let targetHeight = 400;
        if (arrangeMode === 'proper') {
          targetHeight = Math.max(...loadedImgs.map((img) => img.naturalHeight), 300);
        }

        const calculatedWidths = loadedImgs.map((img) => {
          if (arrangeMode === 'proper') {
            const ratio = targetHeight / img.naturalHeight;
            return Math.round(img.naturalWidth * ratio);
          }
          return img.naturalWidth;
        });

        const totalWidth = calculatedWidths.reduce((acc, w) => acc + w, 0) + (loadedImgs.length - 1) * gap;
        const finalHeight = arrangeMode === 'proper' ? targetHeight : Math.max(...loadedImgs.map((img) => img.naturalHeight));

        canvas.width = totalWidth;
        canvas.height = finalHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let currentX = 0;
        loadedImgs.forEach((img, idx) => {
          const w = calculatedWidths[idx];
          const h = arrangeMode === 'proper' ? finalHeight : img.naturalHeight;
          const y = arrangeMode === 'proper' ? 0 : Math.round((finalHeight - h) / 2);

          ctx.drawImage(img, currentX, y, w, h);

          if (addBorder && idx < loadedImgs.length - 1) {
            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(currentX + w, 0, gap, finalHeight);
          }

          currentX += w + gap;
        });
      }

      // Target KB iterative compression
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

      if (!bestBlob) throw new Error('तस्वीरें जोड़ने में विफलता आई।');

      if (joinedImageUrl) URL.revokeObjectURL(joinedImageUrl);
      const url = URL.createObjectURL(bestBlob);
      setJoinedImageUrl(url);
      setJoinedSizeKb(Math.round((bestBlob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'अपेक्षित समस्या आई');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          फोटो व सिग्नेचर जॉइनर (Join Images Online)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          Photo + Signature Merger • सरकारी फॉर्म स्पेशल
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Image Joiner"
          errorMessage={errorMessage}
          onRetry={handleJoinImages}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload Multiple Images */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. जोड़ने वाली फोटो चुनें (Select Images / Photo + Signature)
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-indigo-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">फोटो व सिग्नेचर चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">एक से अधिक फोटो एक साथ चुन सकते हैं</span>
              <input type="file" accept="image/*" multiple onChange={handleFilesSelect} className="hidden" />
            </label>

            {/* List of uploaded items with reordering */}
            {images.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold text-neutral-600">
                  चुनी गई तस्वीरें ({images.length}) - क्रम बदलें या हटाएं:
                </div>
                {images.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 p-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={item.previewUrl}
                        alt="thumb"
                        className="w-9 h-9 rounded object-contain bg-white border border-neutral-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-neutral-800 truncate max-w-[150px] sm:max-w-[200px]">
                          {idx + 1}. {item.name}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {item.width}x{item.height}px • {item.sizeKb} KB
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveImage(idx, -1)}
                        disabled={idx === 0}
                        className="p-1 rounded bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 text-neutral-700 cursor-pointer"
                        title="ऊपर करें"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(idx, 1)}
                        disabled={idx === images.length - 1}
                        className="p-1 rounded bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 text-neutral-700 cursor-pointer"
                        title="नीचे करें"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer ml-1"
                        title="हटाएं"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Settings Configuration */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. लेआउट व दिशा सेटिंग्स (Direction & Alignment)
            </label>

            {/* Direction Selection */}
            <div>
              <span className="block text-xs font-bold text-neutral-700 mb-1.5">दिशा (Direction):</span>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  direction === 'vertical'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="direction"
                    checked={direction === 'vertical'}
                    onChange={() => setDirection('vertical')}
                    className="hidden"
                  />
                  <ArrowDown className="w-4 h-4 text-indigo-600" />
                  <span>↕ Vertical (ऊपर-नीचे - फोटो+सिग्नेचर)</span>
                </label>

                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  direction === 'horizontal'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="direction"
                    checked={direction === 'horizontal'}
                    onChange={() => setDirection('horizontal')}
                    className="hidden"
                  />
                  <ArrowRight className="w-4 h-4 text-indigo-600" />
                  <span>↔ Horizontal (अगल-बगल)</span>
                </label>
              </div>
            </div>

            {/* Arrange Mode */}
            <div>
              <span className="block text-xs font-bold text-neutral-700 mb-1.5">अरेंजमेंट (Arrange):</span>
              <div className="grid grid-cols-2 gap-2">
                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  arrangeMode === 'proper'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="arrange"
                    checked={arrangeMode === 'proper'}
                    onChange={() => setArrangeMode('proper')}
                    className="hidden"
                  />
                  <span>✓ Proper Align (समान चौड़ाई/ऊंचाई)</span>
                </label>

                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                  arrangeMode === 'free'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}>
                  <input
                    type="radio"
                    name="arrange"
                    checked={arrangeMode === 'free'}
                    onChange={() => setArrangeMode('free')}
                    className="hidden"
                  />
                  <span>Free Style (मूल आकार)</span>
                </label>
              </div>
            </div>

            {/* Border to Images */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={addBorder}
                    onChange={(e) => setAddBorder(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-neutral-800">
                    तस्वीरों के बीच विभाजक बॉर्डर (Border Divider) जोड़ें
                  </span>
                </label>
              </div>
              {addBorder && (
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-200">
                  <span className="text-[10px] text-neutral-500 font-bold">बॉर्डर मोटाई:</span>
                  {[1, 2, 3, 4].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setBorderWidth(w)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        borderWidth === w
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-neutral-700 border-neutral-300'
                      }`}
                    >
                      {w}px
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Target KB Input Box + Quick Chips */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                टारगेट फाइल साइज़ दर्ज करें (Target KB):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="20"
                  max="2000"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value)))}
                  placeholder="उदा. 50, 100, 200"
                  className="w-full px-3 py-2 pr-12 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <span className="absolute right-3 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  KB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">क्विक साइज़:</span>
                {[50, 80, 100, 150, 200].map((kb) => (
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
                disabled={images.length < 2 || isJoining}
                onClick={handleJoinImages}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isJoining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>तस्वीरें जुड़ रही हैं...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>फोटो व सिग्नेचर जोड़ें (Join Images)</span>
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
                  <span>जुड़ा हुआ परिणाम (Joined Preview)</span>
                </h3>
                {joinedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    आउटपुट: {joinedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Preview Container */}
              <div className="min-h-[300px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isJoining && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-full shadow-md">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>तस्वीरें जोड़ी जा रही हैं...</span>
                    </div>
                  </div>
                )}

                {joinedImageUrl ? (
                  <div className="text-center space-y-2">
                    <img
                      src={joinedImageUrl}
                      alt="Joined Output"
                      className="mx-auto rounded-lg shadow-md max-h-[360px] max-w-[280px] object-contain border border-neutral-300 bg-white"
                    />
                    <div className="text-xs font-bold text-neutral-600">
                      साइज: {joinedSizeKb} KB (टारगेट: {targetKb} KB)
                    </div>
                  </div>
                ) : images.length > 0 ? (
                  <div className="text-center space-y-2 p-4">
                    <div className="flex justify-center gap-2 flex-wrap max-w-xs mx-auto">
                      {images.map((item, idx) => (
                        <div key={item.id} className="text-center">
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="w-16 h-16 rounded object-contain bg-white border border-neutral-300"
                          />
                          <span className="text-[10px] text-neutral-500 font-bold block mt-0.5">#{idx + 1}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs font-bold text-neutral-700 mt-2">
                      {images.length} फोटो चुनी गई हैं
                    </p>
                    <p className="text-[11px] text-indigo-700 font-medium">
                      इन्हें जोड़ने हेतु बाईं तरफ &quot;फोटो व सिग्नेचर जोड़ें&quot; बटन दबाएं
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से 2 या अधिक फोटो अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      फोटो व सिग्नेचर एक साथ जुड़कर यहाँ दिखेंगे
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              {joinedImageUrl ? (
                <a
                  href={joinedImageUrl}
                  download={`joined_photo_signature_${joinedSizeKb}KB.jpg`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>जुड़ी हुई फोटो डाउनलोड करें ({joinedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleJoinImages}
                  disabled={images.length < 2}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-pointer hover:bg-neutral-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {images.length >= 2 ? 'पहले "फोटो व सिग्नेचर जोड़ें" बटन दबाएं' : 'डाउनलोड हेतु पहले कम से कम 2 फोटो अपलोड करें'}
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
