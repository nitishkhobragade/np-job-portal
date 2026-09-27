"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, ArrowUp, ArrowDown, FileText, CheckCircle2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

interface UploadedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
}

export const ImageToPdfTool: React.FC = () => {
  const [images, setImages] = useState<UploadedImageItem[]>([]);
  const [pageSize, setPageSize] = useState<'A4' | 'FIT'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const margin = 15; // in points
  const [compressionQuality, setCompressionQuality] = useState<'high' | 'medium' | 'low'>('medium');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfSizeBytes, setPdfSizeBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newItems: UploadedImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeBytes = await getRealFileBytes(f);
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        previewUrl: URL.createObjectURL(f),
        name: f.name,
        sizeBytes,
      });
    }

    setImages((prev) => [...prev, ...newItems]);
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const filtered = prev.filter((item) => {
        if (item.id === id) {
          URL.revokeObjectURL(item.previewUrl);
          return false;
        }
        return true;
      });
      return filtered;
    });
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index - 1];
      next[index - 1] = temp;
      return next;
    });
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[index + 1];
      next[index + 1] = temp;
      return next;
    });
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
  };

  // Convert image to optimized JPEG bytes
  const getOptimizedJpegBytes = async (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let scale = 1;

        if (compressionQuality === 'low') {
          scale = 0.6;
        } else if (compressionQuality === 'medium') {
          scale = 0.85;
        }

        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const qualityVal = compressionQuality === 'high' ? 0.92 : compressionQuality === 'medium' ? 0.8 : 0.6;

        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Blob conversion failed'));
              return;
            }
            const buf = await blob.arrayBuffer();
            resolve(buf);
          },
          'image/jpeg',
          qualityVal
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = objectUrl;
    });
  };

  const generatePdf = async () => {
    if (images.length === 0) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();

      const a4Width = orientation === 'portrait' ? 595.28 : 841.89;
      const a4Height = orientation === 'portrait' ? 841.89 : 595.28;

      for (const item of images) {
        const jpegBytes = await getOptimizedJpegBytes(item.file);
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);

        let pWidth = a4Width;
        let pHeight = a4Height;

        if (pageSize === 'FIT') {
          pWidth = embeddedImage.width;
          pHeight = embeddedImage.height;
          const page = pdfDoc.addPage([pWidth, pHeight]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: pWidth,
            height: pHeight,
          });
        } else {
          // Standard A4
          const page = pdfDoc.addPage([pWidth, pHeight]);
          const availWidth = pWidth - margin * 2;
          const availHeight = pHeight - margin * 2;

          const imgRatio = embeddedImage.width / embeddedImage.height;
          const availRatio = availWidth / availHeight;

          let drawWidth = availWidth;
          let drawHeight = availHeight;

          if (imgRatio > availRatio) {
            drawHeight = availWidth / imgRatio;
          } else {
            drawWidth = availHeight * imgRatio;
          }

          const posX = margin + (availWidth - drawWidth) / 2;
          const posY = margin + (availHeight - drawHeight) / 2;

          page.drawImage(embeddedImage, {
            x: posX,
            y: posY,
            width: drawWidth,
            height: drawHeight,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setPdfSizeBytes(blob.size);
      setErrorMessage(null);
    } catch (err: unknown) {
      console.error('PDF Generation Error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'फोटो से PDF बनाने में समस्या आई। कृपया इमेज की साइज़ अथवा फॉर्मेट जांचें।'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span>Images to PDF Converter (फोटो से एक संयुक्त PDF बनाएं)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          A4 रेडी • सभी सरकारी फॉर्म हेतु
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Images to PDF Converter"
          errorMessage={errorMessage}
          onRetry={generatePdf}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                1. तस्वीरें चुनें (Select Images)
              </label>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    images.forEach((it) => URL.revokeObjectURL(it.previewUrl));
                    setImages([]);
                    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
                    setPdfBlobUrl(null);
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                >
                  सभी हटाएं
                </button>
              )}
            </div>

            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-red-300 hover:border-red-500 rounded-xl bg-red-50/40 hover:bg-red-50 cursor-pointer transition-colors text-center group">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-1.5 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4 animate-bounce" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-900">
                तस्वीरें चुनें (एक साथ कई चुन सकते हैं)
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">
                JPG, JPEG, PNG, WEBP समर्थित
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>

            {/* Selected Images List with Thumbnail, Accurate Size, and Cross Delete */}
            {images.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-black text-neutral-700">
                  चुनी गई तस्वीरें ({images.length}) - क्रम बदलें या हटाएं:
                </div>
                {images.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
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
                          साइज़: <strong className="text-red-700">{formatFileSize(item.sizeBytes)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveUp(idx)}
                        className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                        title="ऊपर ले जाएं"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === images.length - 1}
                        onClick={() => moveDown(idx)}
                        className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                        title="नीचे ले जाएं"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(item.id)}
                        className="p-1.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                        title="हटाएं"
                      >
                        <X className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings Box */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. PDF लेआउट व सेटिंग्स (Layout Options)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] font-bold text-neutral-600 block mb-1">पेज साइज़:</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value === 'FIT' ? 'FIT' : 'A4')}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg"
                >
                  <option value="A4">A4 (मानक सरकारी दस्तावेज़)</option>
                  <option value="FIT">Fit to Image (तस्वीर के आकार अनुसार)</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] font-bold text-neutral-600 block mb-1">दिशा (Orientation):</span>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value === 'landscape' ? 'landscape' : 'portrait')}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg"
                >
                  <option value="portrait">Portrait (सीधा)</option>
                  <option value="landscape">Landscape (आड़ा)</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-neutral-600 block mb-1">कंप्रेशन स्तर (Compression Quality):</span>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'high', name: 'हाई क्वालिटी', desc: 'बेस्ट प्रिंट' },
                  { id: 'medium', name: 'मीडियम (200KB)', desc: 'अनुशंसित' },
                  { id: 'low', name: 'लो (सुपर स्मॉल)', desc: 'कम से कम KB' },
                ] as const).map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCompressionQuality(q.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      compressionQuality === q.id
                        ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold ring-1 ring-rose-600'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-black">{q.name}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={generatePdf}
              disabled={images.length === 0 || isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PDF बनाई जा रही है...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>3. फोटो से PDF बनाएं (Generate PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: PDF Download & Preview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {pdfBlobUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PDF सफलतापूर्वक तैयार हुई!</span>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 max-w-sm mx-auto">
                  <FileText className="w-10 h-10 text-rose-600 mx-auto" />
                  <div className="text-xs font-black text-neutral-800">
                    {images.length} तस्वीरों से निर्मित PDF
                  </div>
                  <div className="text-xs font-bold text-red-700">
                    PDF साइज़: {formatFileSize(pdfSizeBytes)}
                  </div>
                </div>

                <a
                  href={pdfBlobUrl}
                  download="combined_document.pdf"
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF डाउनलोड करें ({formatFileSize(pdfSizeBytes)})</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  तस्वीरें जोड़ें और &apos;फोटो से PDF बनाएं&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  मार्कशीट, आधार, जाति, निवास की कई फोटो से एक A4 PDF तैयार होगी
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
