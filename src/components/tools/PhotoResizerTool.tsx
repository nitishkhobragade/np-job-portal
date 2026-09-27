"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, Image as ImageIcon, ShieldCheck, CheckCircle2, RotateCw } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';
import { compressCanvasStrictlyUnderTarget } from '../../lib/imageCompressionHelper';

interface Preset {
  name: string;
  category: 'SSC' | 'State Exams' | 'UPSC' | 'Banking' | 'Custom';
  width: number;
  height: number;
  minKb: number;
  maxKb: number;
  description: string;
}

const PRESETS: Preset[] = [
  {
    name: 'Custom (अपनी पसंद अनुसार)',
    category: 'Custom',
    width: 0,
    height: 0,
    minKb: 0,
    maxKb: 0,
    description: 'मूल आस्पेक्ट रेशियो सुरक्षित • अपनी इच्छित KB व आयाम चुनें'
  },
  {
    name: 'SSC CGL / CHSL / MTS / GD',
    category: 'SSC',
    width: 350,
    height: 450,
    minKb: 20,
    maxKb: 50,
    description: '3.5 x 4.5 cm (350x450 px) • 20 KB से 50 KB'
  },
  {
    name: 'MPESB व्यापम (Police / Patwari / Group)',
    category: 'State Exams',
    width: 350,
    height: 450,
    minKb: 20,
    maxKb: 50,
    description: '3.5 x 4.5 cm • 20 KB से 50 KB (सफेद बैकग्राउंड)'
  },
  {
    name: 'Railway RRB (NTPC / Group D / ALP)',
    category: 'State Exams',
    width: 320,
    height: 400,
    minKb: 20,
    maxKb: 70,
    description: '35 x 45 mm • 20 KB से 70 KB'
  },
  {
    name: 'UPSC Civil Services / NDA / CDS',
    category: 'UPSC',
    width: 350,
    height: 350,
    minKb: 20,
    maxKb: 300,
    description: '350 x 350 px min • 20 KB से 300 KB'
  },
  {
    name: 'IBPS / SBI Banking',
    category: 'Banking',
    width: 200,
    height: 230,
    minKb: 20,
    maxKb: 50,
    description: 'पासपोर्ट फोटो • 20 KB से 50 KB'
  }
];

export const PhotoResizerTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Default Custom preset
  const [selectedPreset, setSelectedPreset] = useState<string>('Custom (अपनी पसंद अनुसार)');
  // Dimensions only applied when user checks the box
  const [applyDimensions, setApplyDimensions] = useState<boolean>(false);
  const [width, setWidth] = useState<number | ''>(350);
  const [height, setHeight] = useState<number | ''>(450);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(false);
  const [targetKb, setTargetKb] = useState<number | ''>(50);
  const [rotation, setRotation] = useState<number>(0);

  // Explicit processing output states
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeBytes, setProcessedSizeBytes] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply preset values
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((item) => item.name === presetName);
    if (p) {
      if (p.category === 'Custom') {
        setApplyDimensions(false);
        setTargetKb(50);
      } else {
        setApplyDimensions(true);
        setWidth(p.width);
        setHeight(p.height);
        setTargetKb(Math.round((p.minKb + p.maxKb) / 2));
      }
    }
  };

  const handleFileSelect = async (file: File) => {
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setSelectedFile(file);
    setProcessedImageUrl(null);
    setProcessedSizeBytes(0);
    setErrorMessage(null);

    // Resolve size accurately (fixes Android Chrome 0 KB issue)
    const bytes = await getRealFileBytes(file);
    setOriginalSizeBytes(bytes);

    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      if (!applyDimensions) {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      }
    };
    img.onerror = () => {
      setErrorMessage('फोटो लोड नहीं हो सकी। कृपया वैध JPG, PNG अथवा WEBP फोटो चुनें।');
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

  // EXPLICIT ACTION TRIGGER: Resize & Compress Photo
  const handleProcessImage = async () => {
    if (!selectedFile || !originalImageUrl) {
      setErrorMessage('कृपया पहले फोटो चुनें।');
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
      if (!ctx) throw new Error('ब्राउज़र Canvas 2D सपोर्ट नहीं कर रहा है।');

      const effectiveWidth = applyDimensions && typeof width === 'number' && width > 0 ? width : (originalDimensions.width || img.naturalWidth || 400);
      const effectiveHeight = applyDimensions && typeof height === 'number' && height > 0 ? height : (originalDimensions.height || img.naturalHeight || 500);

      // Rotation handling
      if (rotation % 180 !== 0) {
        canvas.width = effectiveHeight;
        canvas.height = effectiveWidth;
      } else {
        canvas.width = effectiveWidth;
        canvas.height = effectiveHeight;
      }

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (rotation === 90) {
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, 0, 0, effectiveHeight, effectiveWidth);
      } else if (rotation === 180) {
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, 0, 0, effectiveWidth, effectiveHeight);
      } else if (rotation === 270) {
        ctx.translate(0, canvas.height);
        ctx.rotate((3 * Math.PI) / 2);
        ctx.drawImage(img, 0, 0, effectiveHeight, effectiveWidth);
      } else {
        ctx.drawImage(img, 0, 0, effectiveWidth, effectiveHeight);
      }
      ctx.restore();

      // Compress strictly under target KB
      const effectiveTargetKb = typeof targetKb === 'number' && targetKb > 0 ? targetKb : 50;
      const bestBlob = await compressCanvasStrictlyUnderTarget(canvas, {
        targetKb: effectiveTargetKb,
        mimeType: 'image/jpeg',
        safetyMarginBytes: 512,
      });

      if (!bestBlob || bestBlob.size === 0) throw new Error('इमेज कंप्रेस नहीं हो सकी।');

      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const newUrl = URL.createObjectURL(bestBlob);
      setProcessedImageUrl(newUrl);
      setProcessedSizeBytes(bestBlob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'अपेक्षित समस्या आई');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleWidthChange = (valStr: string) => {
    if (valStr === '') {
      setWidth('');
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setWidth('');
      return;
    }
    setWidth(val);
    if (maintainAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (valStr: string) => {
    if (valStr === '') {
      setHeight('');
      return;
    }
    const val = parseInt(valStr, 10);
    if (isNaN(val)) {
      setHeight('');
      return;
    }
    setHeight(val);
    if (maintainAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(val * ratio));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          पासपोर्ट फोटो रिसाइज़र व कंप्रेसर (Photo Resizer &amp; Target KB)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          20KB - 50KB • SSC / व्यापम / UPSC
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Photo Resizer"
          errorMessage={errorMessage}
          onRetry={handleProcessImage}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: 3-Step Configuration */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload with Thumbnail & Remove Cross Button */}
          <ToolUploadBox
            label="1. अपनी पासपोर्ट फोटो अपलोड करें (Upload Photo)"
            subLabel="JPG, JPEG, PNG, WEBP सपोर्टेड"
            accept="image/*"
            selectedFile={selectedFile}
            filePreviewUrl={originalImageUrl}
            dimensions={originalDimensions}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="image"
          />

          {/* STEP 2: Settings & Requirements Configuration */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. परीक्षा अनुसार प्रीसेट चुनें (Select Exam Preset)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => {
                const isSelected = selectedPreset === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p.name)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/70 border-red-600 text-red-950 font-bold shadow-2xs ring-1 ring-red-600'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                    }`}
                  >
                    <div className="text-xs font-black truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 line-clamp-1">{p.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target KB & Dimensions Controls */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            {/* Target Size Controls */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                  टारगेट फाइल साइज़ दर्ज करें (अपनी पसंद का Size KB में डालें):
                </label>
                <span className="text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                  {targetKb !== '' ? `${targetKb} KB` : 'साइज़ दर्ज करें'}
                </span>
              </div>
              <input
                type="number"
                min={5}
                max={1000}
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
                className="w-full px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
              {/* Quick KB Chips */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[20, 30, 40, 50, 70, 100, 200].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {kb} KB
                  </button>
                ))}
              </div>
            </div>

            {/* Dimension Checkbox & Controls */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyDimensions}
                  onChange={(e) => setApplyDimensions(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800">
                  कस्टम आयाम (Width x Height) बदलें (Dimensions)
                </span>
              </label>

              {applyDimensions && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">चौड़ाई (Width px):</label>
                    <input
                      type="number"
                      value={width}
                      placeholder="350"
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-neutral-50 border border-neutral-300 rounded-md font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">ऊंचाई (Height px):</label>
                    <input
                      type="number"
                      value={height}
                      placeholder="450"
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-neutral-50 border border-neutral-300 rounded-md font-bold"
                    />
                  </div>
                  <div className="col-span-2 flex items-center justify-between pt-1">
                    <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintainAspect}
                        onChange={(e) => setMaintainAspect(e.target.checked)}
                        className="w-3.5 h-3.5 text-red-600 rounded border-neutral-300"
                      />
                      <span>समान अनुपात रखें (Maintain Aspect Ratio)</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 rounded-md text-neutral-700 cursor-pointer"
                    >
                      <RotateCw className="w-3 h-3 text-red-600" />
                      <span>फोटो घुमाएं 90°</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* STEP 3: EXPLICIT ACTION TRIGGER BUTTON */}
            <div className="pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleProcessImage}
                disabled={!selectedFile || isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>प्रोसेसिंग हो रही है...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>3. फोटो रिसाइज़ व कंप्रेस करें (Process &amp; Resize)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Comparison & Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {processedImageUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>फोटो सफलतापूर्वक रिसाइज़ हुई!</span>
                </div>

                <div className="max-w-[240px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-neutral-100 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageUrl}
                    alt="Processed Result"
                    className="w-full h-auto max-h-[240px] object-contain mx-auto rounded-lg"
                  />
                </div>

                {/* Size stats */}
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
                  download={`resized_${selectedFile?.name || 'photo.jpg'}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
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
                <ImageIcon className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर फोटो चुनें और &apos;फोटो रिसाइज़ व कंप्रेस करें&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  SSC, MPESB, UPSC पोर्टल लिमिट अनुसार सटीक KB में डाउनलोड होगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
