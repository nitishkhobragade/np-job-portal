"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Printer,
  FileText,
  FileImage,
  Download,
  Image as ImageIcon,
  Check,
  Scissors,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Layers,
  Info
} from 'lucide-react';
import {
  SheetPresetId,
  SHEET_PRESETS,
  PaperType,
  calculateSheetPlacement,
  renderSheetToCanvas,
  exportSheetToPdf,
  exportSheetToPsd,
  triggerDirectPrint,
  PHOTO_WIDTH_PX,
  PHOTO_HEIGHT_PX
} from '../../lib/photoSheetEngine';

interface PrintablePhotoSheetToolProps {
  initialPhotoUrl?: string;
  onNavigateToPassportMaker?: () => void;
}

export function PrintablePhotoSheetTool({
  initialPhotoUrl,
  onNavigateToPassportMaker
}: PrintablePhotoSheetToolProps) {
  // State
  const [photoUrl, setPhotoUrl] = useState<string>(initialPhotoUrl || '');
  const [photoImage, setPhotoImage] = useState<HTMLImageElement | null>(null);
  const [paperType, setPaperType] = useState<PaperType>('a4');
  const [selectedPresetId, setSelectedPresetId] = useState<SheetPresetId>('a4_6');
  const [showCuttingGuides, setShowCuttingGuides] = useState<boolean>(true);
  const guideColor = '#d1d5db';
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg'>('png');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isExportingPsd, setIsExportingPsd] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string>('');

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Image when photoUrl changes
  useEffect(() => {
    if (!photoUrl) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setPhotoImage(img);
    };
    img.src = photoUrl;
  }, [photoUrl]);

  // If paperType changes, adjust selected preset if needed
  const handlePaperTypeChange = (type: PaperType) => {
    setPaperType(type);
    if (type === 'a4') {
      if (!selectedPresetId.startsWith('a4_')) {
        setSelectedPresetId('a4_6');
      }
    } else {
      if (!selectedPresetId.startsWith('4x6_')) {
        setSelectedPresetId('4x6_6');
      }
    }
  };

  // Re-render Preview Canvas
  const updatePreview = useCallback(() => {
    if (!photoImage || !previewCanvasRef.current) return;
    const previewCanvas = previewCanvasRef.current;
    const sheetCanvas = renderSheetToCanvas(
      photoImage,
      selectedPresetId,
      showCuttingGuides,
      guideColor
    );

    previewCanvas.width = sheetCanvas.width;
    previewCanvas.height = sheetCanvas.height;
    const ctx = previewCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(sheetCanvas, 0, 0);
    }
  }, [photoImage, selectedPresetId, showCuttingGuides, guideColor]);

  useEffect(() => {
    updatePreview();
  }, [updatePreview]);

  // Handle Photo Upload
  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Load a crisp sample passport photo for instant preview testing
  const loadSamplePhoto = () => {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = PHOTO_WIDTH_PX;
    sampleCanvas.height = PHOTO_HEIGHT_PX;
    const ctx = sampleCanvas.getContext('2d');
    if (ctx) {
      // Clean gradient studio background
      const grad = ctx.createLinearGradient(0, 0, 0, PHOTO_HEIGHT_PX);
      grad.addColorStop(0, '#f8fafc');
      grad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, PHOTO_WIDTH_PX, PHOTO_HEIGHT_PX);

      // Clean placeholder avatar
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(PHOTO_WIDTH_PX / 2, 180, 80, 0, Math.PI * 2);
      ctx.fill();

      // Body silhouette
      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.ellipse(PHOTO_WIDTH_PX / 2, 420, 150, 170, 0, 0, Math.PI * 2);
      ctx.fill();

      // Badge
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SAMPLE 3.5×4.5 cm', PHOTO_WIDTH_PX / 2, 480);
      ctx.font = '14px sans-serif';
      ctx.fillText('300 DPI Passport', PHOTO_WIDTH_PX / 2, 505);

      setPhotoUrl(sampleCanvas.toDataURL('image/png'));
    }
  };

  // 1. Direct Print (100% Scale / No-Margin)
  const handlePrint = () => {
    if (!photoImage) return;
    const sheetCanvas = renderSheetToCanvas(
      photoImage,
      selectedPresetId,
      showCuttingGuides,
      guideColor
    );
    triggerDirectPrint(sheetCanvas, selectedPresetId);
  };

  // 2. Export Print-Ready PDF (exact physical dimensions via pdf-lib)
  const handleExportPdf = async () => {
    if (!photoImage) return;
    try {
      setIsExportingPdf(true);
      const pdfBytes = await exportSheetToPdf(photoImage, selectedPresetId, showCuttingGuides);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Passport_Sheet_${selectedPresetId}_300DPI.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccessMsg('✅ Print-Ready Vector PDF (300 DPI) डाउनलोड हो गया!');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 3. Export Layered PSD (Adobe Photoshop format via ag-psd)
  const handleExportPsd = async () => {
    if (!photoImage) return;
    try {
      setIsExportingPsd(true);
      const psdBytes = await exportSheetToPsd(photoImage, selectedPresetId);
      const blob = new Blob([psdBytes], { type: 'image/vnd.adobe.photoshop' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Passport_Sheet_${selectedPresetId}_Layered.psd`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccessMsg('✅ Photoshop PSD फाइल (व्यक्तिगत लेयर्स सहित) डाउनलोड हो गई!');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (err) {
      console.error('PSD Export Error:', err);
    } finally {
      setIsExportingPsd(false);
    }
  };

  // 4. Export Ultra HD PNG/JPEG (Uncompressed 300 DPI)
  const handleExportImage = () => {
    if (!photoImage) return;
    const sheetCanvas = renderSheetToCanvas(
      photoImage,
      selectedPresetId,
      showCuttingGuides,
      guideColor
    );

    const mime = exportFormat === 'png' ? 'image/png' : 'image/jpeg';
    const quality = exportFormat === 'jpeg' ? 0.98 : undefined;
    const dataUrl = sheetCanvas.toDataURL(mime, quality);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Passport_Sheet_${selectedPresetId}_300DPI.${exportFormat}`;
    a.click();
    setExportSuccessMsg(`✅ Ultra HD ${exportFormat.toUpperCase()} इमेज (300 DPI) डाउनलोड हो गई!`);
    setTimeout(() => setExportSuccessMsg(''), 4000);
  };

  const currentPreset = SHEET_PRESETS[selectedPresetId];
  const placement = calculateSheetPlacement(selectedPresetId);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <Printer className="w-3.5 h-3.5" />
              <span>Epson, Canon & HP Studio Photo Paper Engine</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Printable Photo Sheet Generator</span>
              <span className="text-xs bg-red-600 text-white font-black px-2 py-0.5 rounded uppercase tracking-wider">
                300 DPI Exact Scale
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              सख्त 3.5cm × 4.5cm (413×531px) फिजिकल स्केल इंजन। चाहे 6 फोटो चुनें या 12, फोटो का वास्तविक साइज़ कभी नहीं बदलेगा।
              A4 पेपर पर ऊपर से प्रिंट करें ताकि बाकी का साफ़ पेपर भविष्य में दोबारा इस्तेमाल हो सके।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToPassportMaker && (
              <button
                type="button"
                onClick={onNavigateToPassportMaker}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>← AI पासपोर्ट मेकर</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <ImageIcon className="w-4 h-4" />
              <span>फोटो बदलें / अपलोड करें</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {exportSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Main Workspace: Left Controls, Right Realistic Sheet Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Paper & Layout Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 1. Paper Type Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>1. पेपर साइज चुनें (Select Paper Size)</span>
              </span>
              <span className="text-[11px] text-slate-400">300 DPI Standard</span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePaperTypeChange('a4')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  paperType === 'a4'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">Standard A4 Paper</span>
                  {paperType === 'a4' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">210 × 297 mm • 2480 × 3508 px</div>
                <div className="text-[9px] text-indigo-300 font-semibold mt-1">
                  शीर्ष से प्रिंट (Unused Paper सुरक्षित)
                </div>
              </button>

              <button
                type="button"
                onClick={() => handlePaperTypeChange('4x6')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  paperType === '4x6'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">4×6 Inch Photo Paper</span>
                  {paperType === '4x6' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">101.6 × 152.4 mm • 1200 × 1800 px</div>
                <div className="text-[9px] text-indigo-300 font-semibold mt-1">
                  स्टूडियो ग्लॉसी फोटो कार्ड
                </div>
              </button>
            </div>
          </div>

          {/* 2. Photo Grid Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-red-500" />
                <span>2. फोटो ग्रिड लेआउट (Grid Distribution)</span>
              </label>
              <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold">
                Strict Non-Stretch
              </span>
            </div>

            <div className="space-y-2">
              {Object.values(SHEET_PRESETS)
                .filter((p) => p.paperType === paperType)
                .map((preset) => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPresetId(preset.id)}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-red-500/15 border-red-500 text-white font-bold shadow-xs'
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white">{preset.label}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                            {preset.recommendedFor}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{preset.description}</div>
                      </div>

                      <div className="shrink-0 pl-2">
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* 3. Cutting Guidelines & Trim Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
              <Scissors className="w-4 h-4 text-amber-400" />
              <span>3. कटिंग गाइडलाइन व बॉर्डर (Trimming Rules)</span>
            </label>

            <div className="space-y-2.5 text-xs text-slate-300">
              <label className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 cursor-pointer select-none">
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded border border-slate-400 bg-white" />
                  <span>1px अल्ट्रा-थिन कटिंग बॉर्डर (#d1d5db)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showCuttingGuides}
                  onChange={(e) => setShowCuttingGuides(e.target.checked)}
                  className="rounded text-red-600 focus:ring-0 cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
                <span>कटिंग गैप (Trimming Gap):</span>
                <span className="font-mono font-bold text-amber-300">2.5 mm (~30 px @ 300 DPI)</span>
              </div>

              <div className="flex items-center justify-between px-2 text-[11px] text-slate-400">
                <span>व्यक्तिगत फोटो डायमेंशन:</span>
                <span className="font-mono font-bold text-emerald-400">35 mm × 45 mm (413 × 531 px)</span>
              </div>
            </div>
          </div>

          {/* 4. Export & Download Button Group */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                <span>4. एक्सपोर्ट व प्रिंट विकल्प (Export Formats)</span>
              </label>
              <div className="flex rounded-lg border border-slate-700 overflow-hidden text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setExportFormat('png')}
                  className={`px-2 py-0.5 ${exportFormat === 'png' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  PNG
                </button>
                <button
                  type="button"
                  onClick={() => setExportFormat('jpeg')}
                  className={`px-2 py-0.5 ${exportFormat === 'jpeg' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                  JPG
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Button 1: Direct Print */}
              <button
                type="button"
                onClick={handlePrint}
                className="py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>🖨️ डायरेक्ट प्रिंट (100% स्केल)</span>
              </button>

              {/* Button 2: Vector PDF */}
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="py-3 px-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                {isExportingPdf ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0" />
                )}
                <span>📄 एक्सपोर्ट PDF (300 DPI)</span>
              </button>

              {/* Button 3: Photoshop PSD */}
              <button
                type="button"
                onClick={handleExportPsd}
                disabled={isExportingPsd}
                className="py-3 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                {isExportingPsd ? (
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileImage className="w-4 h-4 shrink-0" />
                )}
                <span>🎨 एक्सपोर्ट PSD (लेयर्स सहित)</span>
              </button>

              {/* Button 4: Ultra HD Image */}
              <button
                type="button"
                onClick={handleExportImage}
                className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>🖼️ Ultra HD {exportFormat.toUpperCase()}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-1">
              Windows Photo Viewer, Epson Easy Photo Print, और Canon Quick Menu में 100% वास्तविक स्केल पर प्रिंट करें।
            </p>
          </div>
        </div>

        {/* Right Column: Realistic Sheet Preview with Top Alignment (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col items-center">
            {/* Preview Header & Metadata */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-200">
                  {currentPreset.label}
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  {currentPreset.sublabel}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                {placement.sheetWidth} × {placement.sheetHeight} px @ 300 DPI
              </div>
            </div>

            {/* Realistic Page Container */}
            <div className="w-full flex items-center justify-center p-4 bg-slate-950 rounded-xl border border-slate-800/80 min-h-[440px]">
              {photoImage ? (
                <div
                  className="relative bg-white shadow-2xl rounded border border-slate-300 overflow-hidden"
                  style={{
                    maxWidth: '100%',
                    width: paperType === 'a4' ? '340px' : currentPreset.orientation === 'landscape' ? '420px' : '300px',
                    aspectRatio: `${placement.sheetWidth} / ${placement.sheetHeight}`
                  }}
                >
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full h-full object-contain block"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-200">कोई पासपोर्ट फोटो लोड नहीं है</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      अपनी पासपोर्ट फोटो अपलोड करें या तुरंत टेस्ट करने के लिए सैंपल फोटो लोड करें।
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      फोटो अपलोड करें
                    </button>
                    <button
                      type="button"
                      onClick={loadSamplePhoto}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs cursor-pointer"
                    >
                      सैंपल फोटो लोड करें
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Strict Physical Scale Engine Rule Bar (As explicitly required) */}
            <div className="w-full mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-semibold">
                  Individual Photo: <span className="font-mono text-emerald-400 font-bold">3.5 × 4.5 cm (413 × 531 px)</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                <span>Resolution: <strong className="text-slate-200">300 DPI</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">Ready for Epson/Canon/HP Print</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
