"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Trash2, ArrowUp, ArrowDown, FileText, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

interface UploadedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeKb: number;
}

export const ImageToPdfTool: React.FC = () => {
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'FIT'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const margin = 15; // in points
  const [compressionQuality, setCompressionQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfSizeKb, setPdfSizeKb] = useState<number>(0);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: UploadedImageItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
      name: f.name,
      sizeKb: Math.round((f.size / 1024) * 10) / 10
    }));

    setImages((prev) => [...prev, ...newItems]);
    // Reset previous generated PDF
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return filtered;
    });
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= images.length - 1) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    try {
      const pdfDoc = await PDFDocument.create();

      // Quality mapping
      const qualityMap = {
        high: 0.9,
        medium: 0.75,
        low: 0.55
      };
      const jpegQuality = qualityMap[compressionQuality];

      for (const item of images) {
        // Read file into image element to get dimensions & draw to canvas for compressed JPEG bytes
        const img = new Image();
        const loadedImg: HTMLImageElement = await new Promise((resolve) => {
          img.onload = () => resolve(img);
          img.src = item.previewUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = loadedImg.naturalWidth;
        canvas.height = loadedImg.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(loadedImg, 0, 0);

        const jpegDataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
        const jpegBytes = await fetch(jpegDataUrl).then((res) => res.arrayBuffer());
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

        if (pageSize === 'A4') {
          // Standard A4 dimensions in points: 595.28 x 841.89
          const a4Width = orientation === 'portrait' ? 595.28 : 841.89;
          const a4Height = orientation === 'portrait' ? 841.89 : 595.28;

          const page = pdfDoc.addPage([a4Width, a4Height]);
          const availWidth = a4Width - margin * 2;
          const availHeight = a4Height - margin * 2;

          // Scale image proportionally to fit inside available area
          const imgRatio = embeddedImage.width / embeddedImage.height;
          let drawWidth = availWidth;
          let drawHeight = availWidth / imgRatio;

          if (drawHeight > availHeight) {
            drawHeight = availHeight;
            drawWidth = availHeight * imgRatio;
          }

          const x = margin + (availWidth - drawWidth) / 2;
          const y = margin + (availHeight - drawHeight) / 2;

          page.drawImage(embeddedImage, {
            x,
            y,
            width: drawWidth,
            height: drawHeight
          });
        } else {
          // Exact image size page
          const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: embeddedImage.width,
            height: embeddedImage.height
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setPdfSizeKb(Math.round((blob.size / 1024) * 10) / 10);
    } catch (err) {
      console.error('PDF Generation Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-700 to-amber-600 text-white p-5 rounded-2xl shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>मार्कशीट • आधार कार्ड • जाति प्रमाण पत्र • निवास</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">फोटो से PDF बनाएं (Images to PDF Converter)</h2>
            <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-2xl">
              10वीं/12वीं मार्कशीट, आधार कार्ड आगे-पीछे, जाति व निवास प्रमाण पत्र की फोटो को एक साथ मिलाकर सिंगल A4 PDF फाइल बनाएं। 100% प्राइवेट व सुरक्षित।
            </p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>ब्राउज़र में प्रोसेस / नो अपलोड</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & List */}
        <div className="lg:col-span-7 space-y-5">
          {/* Upload Dropzone */}
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. दस्तावेज़ों की फोटो चुनें (Upload Documents)
            </label>
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 hover:border-red-500 rounded-xl bg-red-50/50 hover:bg-red-50 cursor-pointer transition-colors text-center">
              <Upload className="w-9 h-9 text-red-600 mb-2 animate-bounce" />
              <span className="text-sm font-bold text-neutral-900">एक या अधिक फोटो चुनें</span>
              <span className="text-xs text-neutral-500 mt-1">
                (उदा. मार्कशीट, आधार, जाति, आय, निवास - आप एक साथ कई फोटो चुन सकते हैं)
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Images List */}
          {images.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                  चुनी गई फोटो ({images.length} पेज) - क्रम व्यवस्थित करें:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
                    setImages([]);
                    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  सभी हटाएं
                </button>
              </div>

              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {images.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-red-700 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <img
                        src={item.previewUrl}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border border-neutral-300 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-neutral-900 truncate max-w-[200px] sm:max-w-xs">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-medium">{item.sizeKb} KB</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        title="ऊपर ले जाएं"
                        className="p-1.5 rounded-md hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4 text-neutral-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === images.length - 1}
                        title="नीचे ले जाएं"
                        className="p-1.5 rounded-md hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4 text-neutral-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        title="हटाएं"
                        className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings & Generate PDF */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. PDF लेआउट व कंप्रेशन सेटिंग्स (PDF Options)
            </label>

            {/* Page Size */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">पेज साइज़ (Page Size):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPageSize('A4')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    pageSize === 'A4'
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div>A4 (मानक सरकारी फॉर्म)</div>
                  <div className="text-[10px] text-neutral-500 font-normal">210 x 297 mm</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPageSize('FIT')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    pageSize === 'FIT'
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div>फोटो अनुसार (Fit Image)</div>
                  <div className="text-[10px] text-neutral-500 font-normal">बिना किसी मार्जिन के</div>
                </button>
              </div>
            </div>

            {/* Orientation */}
            {pageSize === 'A4' && (
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">दिशा (Orientation):</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    लंबा (Portrait)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                        : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    आड़ा (Landscape)
                  </button>
                </div>
              </div>
            )}

            {/* Compression Quality */}
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                कंप्रेशन लेवल (पोर्टल KB अनुसार):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCompressionQuality('low')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    compressionQuality === 'low'
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div>छोटा साइज़</div>
                  <div className="text-[9px] text-neutral-500">&lt; 200 KB</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCompressionQuality('medium')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    compressionQuality === 'medium'
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div>संतुलित</div>
                  <div className="text-[9px] text-neutral-500">मानक क्वालिटी</div>
                </button>
                <button
                  type="button"
                  onClick={() => setCompressionQuality('high')}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    compressionQuality === 'high'
                      ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div>उच्चतम</div>
                  <div className="text-[9px] text-neutral-500">HD स्पष्ट</div>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                type="button"
                onClick={generatePdf}
                disabled={images.length === 0 || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>PDF बन रहा है...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>{images.length > 0 ? `${images.length} पेज का PDF बनाएं` : 'पहले फोटो अपलोड करें'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Download Link when Ready */}
            {pdfBlobUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>PDF सफलतापूर्वक तैयार है!</span>
                  </span>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                    {pdfSizeKb} KB
                  </span>
                </div>

                <a
                  href={pdfBlobUrl}
                  download={`documents_${new Date().toISOString().slice(0, 10)}.pdf`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>तैयार PDF डाउनलोड करें ({pdfSizeKb} KB)</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
