"use client";

import React, { useState, useEffect } from 'react';
import { Upload, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';

interface Preset {
  name: string;
  category: string;
  width: number;
  height: number;
  minKb: number;
  maxKb: number;
  description: string;
}

const PRESETS: Preset[] = [
  {
    name: 'SSC (CGL/CHSL/MTS/GD)',
    category: 'Central',
    width: 200,
    height: 230,
    minKb: 20,
    maxKb: 50,
    description: '3.5cm x 4.5cm • 20 KB से 50 KB'
  },
  {
    name: 'MP Police / MPESB (व्यापम)',
    category: 'MP State',
    width: 200,
    height: 250,
    minKb: 40,
    maxKb: 100,
    description: 'पासपोर्ट फोटो • 40 KB से 100 KB'
  },
  {
    name: 'Railway RRC / RRB NTPC',
    category: 'Railway',
    width: 240,
    height: 320,
    minKb: 30,
    maxKb: 70,
    description: '35mm x 45mm • 30 KB से 70 KB'
  },
  {
    name: 'UPSC Civil Services / NDA',
    category: 'Central',
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
  },
  {
    name: 'Custom (अपनी पसंद अनुसार)',
    category: 'Custom',
    width: 200,
    height: 230,
    minKb: 20,
    maxKb: 50,
    description: 'कस्टम साइज़ व KB सेट करें'
  }
];

export const PhotoResizerTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const [selectedPreset, setSelectedPreset] = useState<string>('SSC (CGL/CHSL/MTS/GD)');
  const [width, setWidth] = useState<number>(200);
  const [height, setHeight] = useState<number>(230);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(false);
  const [targetKb, setTargetKb] = useState<number>(45);
  const [rotation, setRotation] = useState<number>(0);

  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Apply preset values
  const applyPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const p = PRESETS.find((item) => item.name === presetName);
    if (p) {
      setWidth(p.width);
      setHeight(p.height);
      setTargetKb(Math.round((p.minKb + p.maxKb) / 2));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous object urls
    if (originalImageUrl) URL.revokeObjectURL(originalImageUrl);
    if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);

    const url = URL.createObjectURL(file);
    setOriginalImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  // Re-process image whenever parameters change
  useEffect(() => {
    if (!originalImageUrl || width <= 0 || height <= 0) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setIsProcessing(true);
    }, 0);

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Handle rotation
      if (rotation % 180 !== 0) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (rotation === 90) {
        ctx.translate(canvas.width, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, 0, 0, height, width);
      } else if (rotation === 180) {
        ctx.translate(canvas.width, canvas.height);
        ctx.rotate(Math.PI);
        ctx.drawImage(img, 0, 0, width, height);
      } else if (rotation === 270) {
        ctx.translate(0, canvas.height);
        ctx.rotate((3 * Math.PI) / 2);
        ctx.drawImage(img, 0, 0, height, width);
      } else {
        ctx.drawImage(img, 0, 0, width, height);
      }
      ctx.restore();

      // Optimize quality to reach near target KB if specified
      const currentQuality = 0.85;
      let blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', currentQuality)
      );

      // Binary search quality if targetKb is set
      if (blob && targetKb > 0) {
        let low = 0.1;
        let high = 0.98;
        let bestBlob = blob;
        for (let i = 0; i < 6; i++) {
          const mid = (low + high) / 2;
          const testBlob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', mid)
          );
          if (testBlob) {
            const sizeKb = testBlob.size / 1024;
            bestBlob = testBlob;
            if (sizeKb > targetKb) {
              high = mid;
            } else {
              low = mid;
            }
          }
        }
        blob = bestBlob;
      }

      if (blob && isMounted) {
        if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
        const newUrl = URL.createObjectURL(blob);
        setProcessedImageUrl(newUrl);
        setProcessedSizeKb(Math.round((blob.size / 1024) * 10) / 10);
        setIsProcessing(false);
      }
    };
    img.src = originalImageUrl;

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [originalImageUrl, width, height, targetKb, rotation]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (maintainAspect && originalDimensions.width > 0) {
      const ratio = originalDimensions.height / originalDimensions.width;
      setHeight(Math.round(val * ratio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (maintainAspect && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      setWidth(Math.round(val * ratio));
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          पासपोर्ट फोटो रिसाइज़र व KB कंप्रेसर (Photo Resizer)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          20KB - 50KB • SSC / व्यापम / UPSC
        </span>
      </div>

      {/* Main Grid: Upload & Controls + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Settings */}
        <div className="lg:col-span-6 space-y-3">
          {/* Upload Area */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. अपनी पासपोर्ट फोटो अपलोड करें (Upload Photo)
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-red-300 hover:border-red-500 rounded-xl bg-red-50/50 hover:bg-red-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-red-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">फोटो चुनें या यहाँ खींचकर छोड़ें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">JPG, JPEG, PNG, WEBP सपोर्टेड</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">मूल साइज़: <span className="text-red-700">{originalSizeKb} KB</span></span>
              </div>
            )}
          </div>

          {/* Exam Presets */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              2. परीक्षा अनुसार प्रीसेट चुनें (Select Exam Preset)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESETS.map((p) => {
                const isSelected = selectedPreset === p.name;
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(p.name)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-red-600 bg-red-50 ring-2 ring-red-500/20 text-red-900 font-bold'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <div className="font-extrabold truncate">{p.name}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 leading-tight">{p.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Fine Tuning Controls */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                3. आयाम व KB सेटिंग्स (Dimensions & KB)
              </label>
              <button
                type="button"
                onClick={handleRotate}
                className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 hover:text-red-600 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>घुमाएं (Rotate 90°)</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">चौड़ाई (Width px)</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => handleWidthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">ऊंचाई (Height px)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aspectRatioCheck"
                checked={maintainAspect}
                onChange={(e) => setMaintainAspect(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
              />
              <label htmlFor="aspectRatioCheck" className="text-xs font-semibold text-neutral-700 cursor-pointer">
                आस्पेक्ट रेश्यो बनाए रखें (Keep Aspect Ratio)
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                टारगेट फाइल साइज़ दर्ज करें (अपनी पसंद का Size KB में डालें):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="5"
                  max="2000"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(1, Number(e.target.value)))}
                  placeholder="उदा. 20, 50, 100"
                  className="w-full px-3 py-2 pr-12 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <span className="absolute right-3 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  KB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">क्विक साइज़:</span>
                {[20, 35, 45, 50, 100, 200].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    {kb} KB
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Output & Download */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-red-600" />
                  <span>लाइव प्रीव्यू व आउटपुट (Preview & Download)</span>
                </h3>
                {processedSizeKb > 0 && (
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    processedSizeKb <= targetKb + 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    आउटपुट: {processedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Preview Canvas Box */}
              <div className="min-h-[280px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs flex items-center justify-center z-10">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-700 bg-white px-3 py-1.5 rounded-full shadow-md">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>प्रोसेसिंग हो रही है...</span>
                    </div>
                  </div>
                )}

                {processedImageUrl ? (
                  <div className="text-center space-y-2">
                    <img
                      src={processedImageUrl}
                      alt="Resized Preview"
                      style={{ width: `${Math.min(width, 240)}px`, height: `${Math.min(height, 280)}px` }}
                      className="mx-auto rounded-lg shadow-md object-contain border border-neutral-300 bg-white"
                    />
                    <div className="text-[11px] font-semibold text-neutral-600">
                      {width} x {height} px • {processedSizeKb} KB
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">बाईं तरफ से अपनी फोटो अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">प्रीव्यू यहाँ तुरंत दिखाई देगा</p>
                  </div>
                )}
              </div>

              {/* Specs Comparison Table */}
              {processedImageUrl && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-500 font-semibold block">मूल साइज़ (Original):</span>
                    <span className="font-bold text-neutral-800">{originalSizeKb} KB ({originalDimensions.width}x{originalDimensions.height}px)</span>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-semibold block">नया साइज़ (Compressed):</span>
                    <span className="font-extrabold text-emerald-800">{processedSizeKb} KB ({width}x{height}px)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              {processedImageUrl ? (
                <a
                  href={processedImageUrl}
                  download={`photo_resized_${width}x${height}_${processedSizeKb}KB.jpg`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>तैयार फोटो डाउनलोड करें ({processedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-400 font-bold text-sm cursor-not-allowed text-center"
                >
                  डाउनलोड करने हेतु पहले फोटो अपलोड करें
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
