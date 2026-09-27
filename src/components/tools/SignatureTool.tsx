"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, Feather, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';
import { compressCanvasStrictlyUnderTarget } from '../../lib/imageCompressionHelper';

interface SignaturePreset {
  name: string;
  category: 'SSC' | 'State Exams' | 'Banking' | 'UPSC' | 'Custom';
  width: number;
  height: number;
  minKb: number;
  maxKb: number;
  description: string;
}

const SIGNATURE_PRESETS: SignaturePreset[] = [
  {
    name: 'Custom (अपनी पसंद अनुसार)',
    category: 'Custom',
    width: 0,
    height: 0,
    minKb: 0,
    maxKb: 0,
    description: 'मूल आस्पेक्ट रेशियो व ओरिजिनल क्वालिटी सुरक्षित'
  },
  {
    name: 'SSC (CGL, CHSL, GD, MTS)',
    category: 'SSC',
    width: 140,
    height: 60,
    minKb: 10,
    maxKb: 20,
    description: '4.0 x 2.0 cm (140x60 px) • 10 KB से 20 KB'
  },
  {
    name: 'MPESB व्यापम (Police / Subedar)',
    category: 'State Exams',
    width: 150,
    height: 60,
    minKb: 10,
    maxKb: 20,
    description: '150 x 60 px • 10 KB से 20 KB'
  },
  {
    name: 'IBPS / SBI Banking Sign',
    category: 'Banking',
    width: 140,
    height: 60,
    minKb: 10,
    maxKb: 20,
    description: '140 x 60 px • 10 KB से 20 KB (Black Ink)'
  },
  {
    name: 'UPSC Civil Services Sign',
    category: 'UPSC',
    width: 350,
    height: 150,
    minKb: 20,
    maxKb: 300,
    description: '350 x 150 px • 20 KB से 300 KB'
  }
];

export const SignatureTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Default to Custom preset
  const [selectedPreset, setSelectedPreset] = useState<string>('Custom (अपनी पसंद अनुसार)');

  // Dimensions configuration (as requested by user)
  const [applyDimensions, setApplyDimensions] = useState<boolean>(false);
  const [width, setWidth] = useState<number | ''>(140);
  const [height, setHeight] = useState<number | ''>(60);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(false);

  // Target KB Compression Checkbox (UNCHECKED by default for 100% Original Quality)
  const [applyTargetKb, setApplyTargetKb] = useState<boolean>(false);
  const [targetKb, setTargetKb] = useState<number | ''>(15);

  // Clean Ink & Background options
  const [cleanBackground, setCleanBackground] = useState<boolean>(true);
  const [contrastThreshold, setContrastThreshold] = useState<number>(190);
  const [inkDarkness, setInkDarkness] = useState<number>(1.2);

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
      if (!applyDimensions) {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
      }
    };
    img.onerror = () => {
      setErrorMessage('हस्ताक्षर लोड नहीं हो सके। कृपया वैध इमेज फ़ाइल चुनें।');
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

  const selectPreset = (preset: SignaturePreset) => {
    setSelectedPreset(preset.name);
    if (preset.category === 'Custom') {
      setApplyDimensions(false);
      setApplyTargetKb(false);
    } else {
      setApplyDimensions(true);
      setWidth(preset.width);
      setHeight(preset.height);
      setApplyTargetKb(true);
      setTargetKb(Math.round((preset.minKb + preset.maxKb) / 2));
    }
  };

  const handleProcessSignature = async () => {
    if (!selectedFile || !originalImageUrl) {
      setErrorMessage('कृपया पहले हस्ताक्षर फोटो चुनें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('हस्ताक्षर लोड नहीं हो सका।'));
        img.src = originalImageUrl;
      });

      const effectiveWidth = applyDimensions && typeof width === 'number' && width > 0 ? width : (originalDimensions.width || img.naturalWidth || 300);
      const effectiveHeight = applyDimensions && typeof height === 'number' && height > 0 ? height : (originalDimensions.height || img.naturalHeight || 120);

      const canvas = document.createElement('canvas');
      canvas.width = effectiveWidth;
      canvas.height = effectiveHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Clean background & ink thresholding
      if (cleanBackground) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Grayscale luminance
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          if (gray > contrastThreshold) {
            // Pure clean paper white
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          } else {
            // Dark crisp ink
            const darkened = Math.max(0, gray / inkDarkness);
            data[i] = darkened;
            data[i + 1] = darkened;
            data[i + 2] = darkened;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      }

      let finalBlob: Blob | null = null;

      // If user enabled Target KB compression
      if (applyTargetKb) {
        const effectiveTargetKb = typeof targetKb === 'number' && targetKb > 0 ? targetKb : 15;
        finalBlob = await compressCanvasStrictlyUnderTarget(canvas, {
          targetKb: effectiveTargetKb,
          mimeType: 'image/jpeg',
          safetyMarginBytes: 300,
        });
      } else {
        // 100% Original Quality
        finalBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.98));
      }

      if (!finalBlob || finalBlob.size === 0) throw new Error('सिग्नेचर प्रोसेस करने में विफलता आई।');

      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const url = URL.createObjectURL(finalBlob);
      setProcessedImageUrl(url);
      setProcessedSizeBytes(finalBlob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'हस्ताक्षर प्रोसेस नहीं हो सका।');
    } finally {
      setIsProcessing(false);
    }
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
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Feather className="w-4 h-4" />
          <span>सिग्नेचर रिसाइज़र व बैकग्राउंड क्लीनर (Signature Resizer 10-20KB)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          काली स्याही • डार्क इंक थ्रेशोल्डिंग
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Signature Resizer"
          errorMessage={errorMessage}
          onRetry={handleProcessSignature}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. हस्ताक्षर की फोटो चुनें (Select Signature Image)"
            subLabel="JPG, JPEG, PNG, WEBP समर्थित"
            accept="image/*"
            selectedFile={selectedFile}
            filePreviewUrl={originalImageUrl}
            dimensions={originalDimensions}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="image"
          />

          {/* Exam Presets */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. परीक्षा अनुसार मानक साइज़ चुनें (Exam Presets)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SIGNATURE_PRESETS.map((p) => {
                const isSelected = selectedPreset === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => selectPreset(p)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold shadow-2xs ring-1 ring-blue-600'
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

          {/* Dimension Controls & Target KB (With Checkbox for Original Quality) */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            {/* Dimensions Checkbox Mode */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyDimensions}
                  onChange={(e) => setApplyDimensions(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800">
                  हस्ताक्षर के आयाम (Dimensions Width x Height) बदलें
                </span>
              </label>

              {applyDimensions && (
                <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">चौड़ाई (Width px):</label>
                    <input
                      type="number"
                      value={width}
                      placeholder="140"
                      onChange={(e) => handleWidthChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-neutral-50 border border-neutral-300 rounded-md font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-600 mb-0.5">ऊंचाई (Height px):</label>
                    <input
                      type="number"
                      value={height}
                      placeholder="60"
                      onChange={(e) => handleHeightChange(e.target.value)}
                      className="w-full px-2 py-1 text-xs bg-neutral-50 border border-neutral-300 rounded-md font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="flex items-center gap-1.5 text-[11px] text-neutral-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={maintainAspect}
                        onChange={(e) => setMaintainAspect(e.target.checked)}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-neutral-300"
                      />
                      <span>समान अनुपात रखें (Maintain Aspect Ratio)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Target File Size Checkbox (User Controlled, Unchecked = Original Quality) */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyTargetKb}
                  onChange={(e) => setApplyTargetKb(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800">
                  टारगेट फाइल साइज़ सीमित करें (Target KB Compress)
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
                    <span className="text-xs font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                      {targetKb !== '' ? `${targetKb} KB` : 'साइज़ दर्ज करें'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={targetKb}
                    placeholder="उदा. 15"
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === '') {
                        setTargetKb('');
                      } else {
                        const n = parseInt(v, 10);
                        setTargetKb(isNaN(n) ? '' : n);
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[10, 15, 20, 30, 50].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetKb(kb)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          targetKb === kb
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                        }`}
                      >
                        {kb} KB
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Ink & Shadow Enhancement */}
            <div className="pt-2 border-t border-neutral-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={cleanBackground}
                  onChange={(e) => setCleanBackground(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800">
                  छाया व पीलापन हटाएं (Clean Paper Shadow &amp; Dark Ink)
                </span>
              </label>

              {cleanBackground && (
                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-600 mb-0.5">
                      <span>कागज़ की सफेदी (White Paper Level):</span>
                      <span className="font-bold">{contrastThreshold}</span>
                    </div>
                    <input
                      type="range"
                      min={140}
                      max={240}
                      value={contrastThreshold}
                      onChange={(e) => setContrastThreshold(parseInt(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-neutral-600 mb-0.5">
                      <span>स्याही का कालापन (Dark Ink Boost):</span>
                      <span className="font-bold">{inkDarkness}x</span>
                    </div>
                    <input
                      type="range"
                      min={1.0}
                      max={2.0}
                      step={0.1}
                      value={inkDarkness}
                      onChange={(e) => setInkDarkness(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Trigger Button */}
            <div className="pt-2 border-t border-neutral-200">
              <button
                type="button"
                onClick={handleProcessSignature}
                disabled={!selectedFile || isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>हस्ताक्षर प्रोसेस हो रहे हैं...</span>
                  </>
                ) : (
                  <>
                    <Feather className="w-4 h-4" />
                    <span>3. हस्ताक्षर रिसाइज़ करें (Process Signature)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Preview & Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {processedImageUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>हस्ताक्षर सफलतापूर्वक तैयार हुआ!</span>
                </div>

                <div className="max-w-[280px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-white p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageUrl}
                    alt="Processed Signature"
                    className="w-full h-auto max-h-[160px] object-contain mx-auto"
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
                  download={`signature_${selectedFile?.name || 'sign.jpg'}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
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
                <Feather className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर हस्ताक्षर चुनें और &apos;हस्ताक्षर रिसाइज़ करें&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  कागज़ का पीलापन व छाया हटकर साफ़ सफ़ेद बैकग्राउंड पर हस्ताक्षर तैयार होगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
