"use client";

import React, { useState } from 'react';
import { Download, Trash2, ArrowUp, ArrowDown, Layers, ShieldCheck, CheckCircle2, RefreshCw, Upload, X } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';
import { compressCanvasStrictlyUnderTarget } from '../../lib/imageCompressionHelper';

interface JoinedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  width: number;
  height: number;
}

export const ImageJoinerTool: React.FC = () => {
  const [items, setItems] = useState<JoinedImageItem[]>([]);
  const [direction, setDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [alignment, setAlignment] = useState<'match' | 'original'>('match');
  const [addBorder, setAddBorder] = useState<boolean>(true);
  const [borderWidth, setBorderWidth] = useState<number>(2);

  // Target KB Compression Checkbox (UNCHECKED by default = 100% Original Quality)
  const [applyTargetKb, setApplyTargetKb] = useState<boolean>(false);
  const [targetKb, setTargetKb] = useState<number | ''>(100);

  // Output
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [joinedImageUrl, setJoinedImageUrl] = useState<string | null>(null);
  const [joinedSizeBytes, setJoinedSizeBytes] = useState<number>(0);
  const [joinedDimensions, setJoinedDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newItems: JoinedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const previewUrl = URL.createObjectURL(file);
      const sizeBytes = await getRealFileBytes(file);

      // Read dimensions
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file,
            previewUrl,
            name: file.name,
            sizeBytes,
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
        img.src = previewUrl;
      });
    }

    setItems((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((item) => {
        if (item.id === id) {
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }
        return true;
      });
      return filtered;
    });
  };

  const handleClearAll = () => {
    items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    if (joinedImageUrl) URL.revokeObjectURL(joinedImageUrl);
    setItems([]);
    setJoinedImageUrl(null);
    setJoinedSizeBytes(0);
    setErrorMessage(null);
  };

  const handleMoveItem = (index: number, moveDirection: 'up' | 'down') => {
    setItems((prev) => {
      const next = [...prev];
      const targetIndex = moveDirection === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleJoinImages = async () => {
    if (items.length < 2) {
      setErrorMessage('कृपया जोड़ने के लिए कम से कम 2 तस्वीरें चुनें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Pre-load all images
      const loadedImages = await Promise.all(
        items.map(
          (item) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error(`छवि ${item.name} लोड नहीं हो सकी`));
              img.src = item.previewUrl;
            })
        )
      );

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('कैनवास संदर्भ उपलब्ध नहीं है');

      const sep = addBorder ? borderWidth : 0;

      let totalWidth = 0;
      let totalHeight = 0;
      const drawOps: Array<{ img: HTMLImageElement; x: number; y: number; w: number; h: number }> = [];

      if (direction === 'vertical') {
        // Find max width or base width
        const baseWidth = alignment === 'match'
          ? Math.max(...loadedImages.map((img) => img.naturalWidth))
          : Math.max(...loadedImages.map((img) => img.naturalWidth));

        totalWidth = baseWidth;
        let currentY = 0;

        loadedImages.forEach((img, idx) => {
          let drawW = img.naturalWidth;
          let drawH = img.naturalHeight;

          if (alignment === 'match') {
            const scale = baseWidth / img.naturalWidth;
            drawW = baseWidth;
            drawH = Math.round(img.naturalHeight * scale);
          }

          const drawX = Math.round((totalWidth - drawW) / 2);
          drawOps.push({ img, x: drawX, y: currentY, w: drawW, h: drawH });
          currentY += drawH;

          if (idx < loadedImages.length - 1 && addBorder) {
            currentY += sep;
          }
        });
        totalHeight = currentY;
      } else {
        // Horizontal layout
        const baseHeight = alignment === 'match'
          ? Math.max(...loadedImages.map((img) => img.naturalHeight))
          : Math.max(...loadedImages.map((img) => img.naturalHeight));

        totalHeight = baseHeight;
        let currentX = 0;

        loadedImages.forEach((img, idx) => {
          let drawW = img.naturalWidth;
          let drawH = img.naturalHeight;

          if (alignment === 'match') {
            const scale = baseHeight / img.naturalHeight;
            drawH = baseHeight;
            drawW = Math.round(img.naturalWidth * scale);
          }

          const drawY = Math.round((totalHeight - drawH) / 2);
          drawOps.push({ img, x: currentX, y: drawY, w: drawW, h: drawH });
          currentX += drawW;

          if (idx < loadedImages.length - 1 && addBorder) {
            currentX += sep;
          }
        });
        totalWidth = currentX;
      }

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw all images
      drawOps.forEach((op) => {
        ctx.drawImage(op.img, op.x, op.y, op.w, op.h);
      });

      // Draw dividing borders if selected
      if (addBorder && sep > 0) {
        ctx.fillStyle = '#cccccc';
        let linePos = 0;
        for (let i = 0; i < drawOps.length - 1; i++) {
          if (direction === 'vertical') {
            linePos += drawOps[i].h;
            ctx.fillRect(0, linePos, totalWidth, sep);
            linePos += sep;
          } else {
            linePos += drawOps[i].w;
            ctx.fillRect(linePos, 0, sep, totalHeight);
            linePos += sep;
          }
        }
      }

      let finalBlob: Blob | null = null;

      // If user enabled Target KB compression
      if (applyTargetKb) {
        const effectiveTargetKb = typeof targetKb === 'number' && targetKb > 0 ? targetKb : 100;
        finalBlob = await compressCanvasStrictlyUnderTarget(canvas, {
          targetKb: effectiveTargetKb,
          mimeType: 'image/jpeg',
          safetyMarginBytes: 512,
        });
      } else {
        // 100% Original Quality
        finalBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.98));
      }

      if (!finalBlob || finalBlob.size === 0) throw new Error('इमेज कम्बाइन नहीं हो सकी।');

      if (joinedImageUrl) URL.revokeObjectURL(joinedImageUrl);
      const url = URL.createObjectURL(finalBlob);
      setJoinedImageUrl(url);
      setJoinedSizeBytes(finalBlob.size);
      setJoinedDimensions({ width: totalWidth, height: totalHeight });
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'इमेज जोड़ने में समस्या आई।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          <span>Multi Image Joiner (मल्टी इमेज जॉइनर • फोटो, सिग्नेचर व डॉक्यूमेंट्स जोड़ें)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          ओरिजिनल क्वालिटी • हॉरिजॉन्टल या वर्टिकल
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Multi Image Joiner"
          errorMessage={errorMessage}
          onRetry={handleJoinImages}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Configuration */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload Multiple Images with Preview & Cross Removal */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                1. जोड़ने वाली तस्वीरें चुनें (Select Images to Join)
              </label>
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>सभी हटाएं</span>
                </button>
              )}
            </div>

            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-indigo-50/40 hover:bg-indigo-50 cursor-pointer transition-colors text-center group">
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-1.5 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4 animate-bounce" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-900">
                तस्वीरें चुनें (एक से अधिक चुन सकते हैं)
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">
                JPG, JPEG, PNG, WEBP समर्थित
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesAdd}
                className="hidden"
              />
            </label>

            {/* List of Selected Images with Thumbnail, Size, Reorder, and Cross Delete */}
            {items.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-black text-neutral-700">
                  चुनी गई तस्वीरें ({items.length}) - क्रम बदलें या हटाएं:
                </div>
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Thumbnail Preview */}
                      <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-200 border border-neutral-300 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.previewUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-neutral-900 truncate max-w-[170px] sm:max-w-xs">
                          {idx + 1}. {item.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-semibold mt-0.5">
                          {item.width}×{item.height}px •{' '}
                          <strong className="text-indigo-700">{formatFileSize(item.sizeBytes)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Reorder and Red Remove Cross */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveItem(idx, 'up')}
                        className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                        title="ऊपर ले जाएं"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === items.length - 1}
                        onClick={() => handleMoveItem(idx, 'down')}
                        className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                        title="नीचे ले जाएं"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                        title="यह तस्वीर हटाएं"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* STEP 2: Settings (Direction, Border, Target KB Checkbox) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. लेआउट व दिशा सेटिंग्स (Direction &amp; Alignment)
            </label>

            {/* Direction Selection */}
            <div>
              <span className="text-[11px] font-bold text-neutral-600 block mb-1">दिशा (Direction):</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('vertical')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    direction === 'vertical'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="text-xs font-black">↕ Vertical (ऊपर-नीचे)</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">एक के नीचे एक जोड़ें</div>
                </button>

                <button
                  type="button"
                  onClick={() => setDirection('horizontal')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    direction === 'horizontal'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="text-xs font-black">↔ Horizontal (अगल-बगल)</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">साइड-बाई-साइड जोड़ें</div>
                </button>
              </div>
            </div>

            {/* Arrangement Selection */}
            <div>
              <span className="text-[11px] font-bold text-neutral-600 block mb-1">अरेंजमेंट (Arrange):</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAlignment('match')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    alignment === 'match'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="text-xs font-black">✓ Proper Align (समान चौड़ाई/ऊंचाई)</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">एकसमान साफ लेआउट</div>
                </button>

                <button
                  type="button"
                  onClick={() => setAlignment('original')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    alignment === 'original'
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold ring-1 ring-indigo-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="text-xs font-black">Free Style (मूल आकार)</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">ओरिजिनल रेशियो सुरक्षित</div>
                </button>
              </div>
            </div>

            {/* Divider Border */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
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

            {/* Target File Size Checkbox (User Controlled, Unchecked = Original Quality) */}
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyTargetKb}
                  onChange={(e) => setApplyTargetKb(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-neutral-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800">
                  टारगेट फाइल साइज़ सीमित करें (Target KB Compression)
                </span>
                {!applyTargetKb && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    ओरिजिनल क्वालिटी
                  </span>
                )}
              </label>

              {applyTargetKb && (
                <div className="pt-1 animate-in fade-in duration-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-neutral-600">लक्षित साइज़ दर्ज करें (अपनी पसंद का Size KB में डालें):</span>
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {targetKb !== '' ? `${targetKb} KB` : 'साइज़ दर्ज करें'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={2000}
                    value={targetKb}
                    placeholder="उदा. 100"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') {
                        setTargetKb('');
                      } else {
                        const n = parseInt(v, 10);
                        setTargetKb(isNaN(n) ? '' : n);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[50, 80, 100, 150, 200, 300].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetKb(kb)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          targetKb === kb
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleJoinImages}
                disabled={items.length < 2 || isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>तस्वीरें जोड़ी जा रही हैं...</span>
                  </>
                ) : (
                  <>
                    <Layers className="w-4 h-4" />
                    <span>तस्वीरें जोड़ें (Join {items.length} Images Now)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Joined Result & Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {joinedImageUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>तस्वीरें सफलतापूर्वक जुड़ गईं!</span>
                </div>

                <div className="max-w-[320px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-neutral-100 p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={joinedImageUrl}
                    alt="Joined Result"
                    className="w-full h-auto max-h-[300px] object-contain mx-auto rounded-lg"
                  />
                </div>

                <div className="flex items-center justify-center gap-3 text-xs bg-neutral-50 p-2 rounded-xl border border-neutral-200 font-bold">
                  <span className="text-neutral-600">
                    आयाम: <strong>{joinedDimensions.width}×{joinedDimensions.height}px</strong>
                  </span>
                  <span className="text-neutral-400">•</span>
                  <span className="text-indigo-700">
                    साइज़: <strong>{formatFileSize(joinedSizeBytes)}</strong>
                  </span>
                </div>

                <a
                  href={joinedImageUrl}
                  download="joined_image.jpg"
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>डाउनलोड करें ({formatFileSize(joinedSizeBytes)})</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <Layers className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर कम से कम 2 तस्वीरें चुनें और &apos;तस्वीरें जोड़ें&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  हॉरिजॉन्टल या वर्टिकल क्रम में ओरिजिनल शार्पनेस के साथ जुड़ेगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
