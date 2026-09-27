"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, Type, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';
import { compressCanvasStrictlyUnderTarget } from '../../lib/imageCompressionHelper';

export const NameDateOnPhotoTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Fields
  const [candidateName, setCandidateName] = useState<string>('NITISH KHOBRAGADE');
  const [dateOfPhoto, setDateOfPhoto] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [datePrefix, setDatePrefix] = useState<string>('D.O.P : ');
  const [fontSize, setFontSize] = useState<number>(20);
  const [stripHeight, setStripHeight] = useState<number>(75);
  const [stripColor, setStripColor] = useState<'white' | 'black'>('white');
  const [fontColor, setFontColor] = useState<'black' | 'white'>('black');
  const [forceDimensions, setForceDimensions] = useState<boolean>(true); // 350 x 450 px

  // Target KB Compression Checkbox (UNCHECKED by default for 100% Original Quality)
  const [applyTargetKb, setApplyTargetKb] = useState<boolean>(false);
  const [targetKb, setTargetKb] = useState<number | ''>(50);

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
    img.onerror = () => {
      setErrorMessage('फोटो लोड नहीं हो सकी।');
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

  const formatDisplayDate = (isoStr: string) => {
    if (!isoStr) return '';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return isoStr;
  };

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
        img.onerror = () => reject(new Error('फोटो लोड नहीं हो सका।'));
        img.src = originalImageUrl;
      });

      const targetW = forceDimensions ? 350 : (originalDimensions.width || img.naturalWidth || 350);
      const targetH = forceDimensions ? 450 : (originalDimensions.height || img.naturalHeight || 450);

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('कैनवास संदर्भ उपलब्ध नहीं है');

      // 1. Draw photo covering upper area
      const photoAreaH = targetH - stripHeight;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);

      // Maintain aspect crop to fill photo area
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const areaAspect = targetW / photoAreaH;
      let sX = 0, sY = 0, sW = img.naturalWidth, sH = img.naturalHeight;

      if (imgAspect > areaAspect) {
        sW = img.naturalHeight * areaAspect;
        sX = (img.naturalWidth - sW) / 2;
      } else {
        sH = img.naturalWidth / areaAspect;
        sY = 0;
      }

      ctx.drawImage(img, sX, sY, sW, sH, 0, 0, targetW, photoAreaH);

      // 2. Draw white/black bottom strip
      ctx.fillStyle = stripColor === 'white' ? '#ffffff' : '#000000';
      ctx.fillRect(0, photoAreaH, targetW, stripHeight);

      // Divider line
      ctx.strokeStyle = stripColor === 'white' ? '#dddddd' : '#333333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, photoAreaH);
      ctx.lineTo(targetW, photoAreaH);
      ctx.stroke();

      // 3. Draw Candidate Name and DOP
      ctx.fillStyle = fontColor === 'black' ? '#000000' : '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lineGap = stripHeight / 3;
      const line1Y = photoAreaH + lineGap - 2;
      const line2Y = photoAreaH + lineGap * 2 + 2;

      // Line 1: Name
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.fillText(candidateName.toUpperCase(), targetW / 2, line1Y, targetW - 20);

      // Line 2: DOP Date
      ctx.font = `bold ${Math.max(12, fontSize - 2)}px sans-serif`;
      const dateText = `${datePrefix}${formatDisplayDate(dateOfPhoto)}`;
      ctx.fillText(dateText, targetW / 2, line2Y, targetW - 20);

      let finalBlob: Blob | null = null;

      // If user enabled Target KB compression
      if (applyTargetKb) {
        const effectiveTargetKb = typeof targetKb === 'number' && targetKb > 0 ? targetKb : 50;
        finalBlob = await compressCanvasStrictlyUnderTarget(canvas, {
          targetKb: effectiveTargetKb,
          mimeType: 'image/jpeg',
          safetyMarginBytes: 512,
        });
      } else {
        // 100% Original Quality
        finalBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.98));
      }

      if (!finalBlob || finalBlob.size === 0) throw new Error('फोटो प्रोसेस नहीं हो सकी।');

      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const url = URL.createObjectURL(finalBlob);
      setProcessedImageUrl(url);
      setProcessedSizeBytes(finalBlob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'प्रोसेसिंग में त्रुटि आई।');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Type className="w-4 h-4" />
          <span>Name &amp; Date on Photo Maker (फोटो पर नाम व D.O.P तारीख जोड़ें)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          SSC / MP Police नियम अनुसार
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Name & Date on Photo"
          errorMessage={errorMessage}
          onRetry={handleProcessImage}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. अपनी पासपोर्ट फोटो अपलोड करें (Upload Photo)"
            subLabel="JPG, JPEG, PNG, WEBP समर्थित"
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
              2. नाम व तारीख विवरण (Candidate Details)
            </label>

            {/* Candidate Name Input */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                उम्मीदवार का नाम (Candidate Name):
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="उम्मीदवार का नाम दर्ज करें"
                className="w-full px-3 py-1.5 text-xs font-bold uppercase bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
              />
            </div>

            {/* DOP Date Input */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  फोटो लेने की तारीख (DOP):
                </label>
                <input
                  type="date"
                  value={dateOfPhoto}
                  onChange={(e) => setDateOfPhoto(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                  तारीख का प्रिफिक्स:
                </label>
                <input
                  type="text"
                  value={datePrefix}
                  onChange={(e) => setDatePrefix(e.target.value)}
                  placeholder="D.O.P : "
                  className="w-full px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Formatting sliders */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-200">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 mb-0.5">
                  <span>फ़ॉन्ट साइज़:</span>
                  <span>{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={28}
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-neutral-600 mb-0.5">
                  <span>सफेद पट्टी ऊंचाई:</span>
                  <span>{stripHeight}px</span>
                </div>
                <input
                  type="range"
                  min={55}
                  max={100}
                  value={stripHeight}
                  onChange={(e) => setStripHeight(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                />
              </div>
            </div>

            {/* Strip color toggle */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-neutral-700">पट्टी स्टाइल:</span>
              <button
                type="button"
                onClick={() => {
                  setStripColor('white');
                  setFontColor('black');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border cursor-pointer transition-colors ${
                  stripColor === 'white'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                सफेद पट्टी (काले अक्षर)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStripColor('black');
                  setFontColor('white');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md border cursor-pointer transition-colors ${
                  stripColor === 'black'
                    ? 'bg-neutral-900 text-white border-neutral-900'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                काली पट्टी (सफेद अक्षर)
              </button>
            </div>

            {/* SSC / MP Police Standard Dimensions Toggle */}
            <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceDimensions}
                  onChange={(e) => setForceDimensions(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-neutral-800">
                  मानक 3.5cm x 4.5cm (350x450 px) में सेट करें (SSC नियम)
                </span>
              </label>
            </div>

            {/* Target File Size Checkbox (User Controlled, Unchecked = Original Quality) */}
            <div className="p-2.5 bg-neutral-50 rounded-lg border border-neutral-200 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyTargetKb}
                  onChange={(e) => setApplyTargetKb(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500 cursor-pointer"
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
                    <span className="text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {targetKb !== '' ? `${targetKb} KB` : 'साइज़ दर्ज करें'}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={10}
                    max={500}
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
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                  <div className="flex flex-wrap gap-1">
                    {[20, 30, 40, 50, 75, 100].map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setTargetKb(kb)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          targetKb === kb
                            ? 'bg-red-600 text-white border-red-600'
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

            {/* Action Trigger Button */}
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
                    <span>फोटो बनाई जा रही है...</span>
                  </>
                ) : (
                  <>
                    <Type className="w-4 h-4" />
                    <span>3. नाम व तारीख वाली फोटो बनाएं (Generate Photo)</span>
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
                  <span>DOP फोटो सफलतापूर्वक तैयार हुई!</span>
                </div>

                <div className="max-w-[240px] mx-auto border border-neutral-300 rounded-xl overflow-hidden shadow-xs bg-neutral-100 p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={processedImageUrl}
                    alt="Processed DOP Photo"
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
                  download={`dop_${selectedFile?.name || 'photo.jpg'}`}
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
                <Type className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर फोटो अपलोड करें, नाम व तारीख दर्ज करें और बटन दबाएं
                </p>
                <p className="text-[10px] text-neutral-400">
                  फोटो के नीचे मानक सफेद पट्टी में नाम व DOP स्पष्ट अक्षरों में आ जाएगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
