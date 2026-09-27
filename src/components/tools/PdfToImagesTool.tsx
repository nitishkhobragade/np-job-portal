"use client";

import React, { useState } from 'react';
import JSZip from 'jszip';
import { Upload, Download, RefreshCw, FileText, CheckCircle2, Archive, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas, getPdfPageCount } from '../../lib/pdfHelper';

interface ExtractedPage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  sizeKb: number;
  width: number;
  height: number;
}

export const PdfToImagesTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [scale, setScale] = useState<number>(1.5); // 1.5x for crisp text

  // Processing & Output
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    setExtractedPages([]);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setTotalPages(count);
    } catch {
      setTotalPages(1);
    }
  };

  const getExtension = () => {
    if (format === 'image/jpeg') return 'jpg';
    if (format === 'image/png') return 'png';
    return 'webp';
  };

  // EXPLICIT ACTION TRIGGER: Extract all pages to images client-side
  const handleExtractPages = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फाइल चुनें।');
      return;
    }

    setIsExtracting(true);
    setProgressMsg('PDF लोड हो रहा है...');
    setErrorMessage(null);
    setExtractedPages([]);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const count = totalPages || (await getPdfPageCount(buffer));
      setTotalPages(count);

      const results: ExtractedPage[] = [];

      for (let p = 1; p <= count; p++) {
        setProgressMsg(`पेज ${p} / ${count} को इमेज में कनवर्ट किया जा रहा है...`);
        const canvas = await renderPdfPageToCanvas(buffer, p, scale);

        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, format, 0.92)
        );

        if (blob) {
          const dataUrl = canvas.toDataURL(format, 0.92);
          results.push({
            pageNumber: p,
            dataUrl,
            blob,
            sizeKb: Math.round((blob.size / 1024) * 10) / 10,
            width: canvas.width,
            height: canvas.height,
          });
        }
      }

      setExtractedPages(results);
    } catch (err: unknown) {
      console.error('Extract error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'PDF से पेज निकालने में समस्या आई। यदि फाइल पासवर्ड प्रोटेक्टेड है तो पासवर्ड हटाएं।'
      );
    } finally {
      setIsExtracting(false);
      setProgressMsg('');
    }
  };

  // 1-Click Download All as ZIP
  const handleDownloadZip = async () => {
    if (extractedPages.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const baseName = selectedFile ? selectedFile.name.replace(/\.pdf$/i, '') : 'document';
      const ext = getExtension();

      extractedPages.forEach((page) => {
        zip.file(`${baseName}_page_${page.pageNumber}.${ext}`, page.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${baseName}_all_pages.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('ZIP Error:', err);
      setErrorMessage('ZIP फाइल बनाने में समस्या आई।');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-green-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          PDF से इमेज कनवर्टर (PDF to Image Converter)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          JPG, PNG, WEBP • सिंगल या ZIP डाउनलोड
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF to Image Converter"
          errorMessage={errorMessage}
          onRetry={handleExtractPages}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Configuration */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. PDF फाइल अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-teal-300 hover:border-teal-500 rounded-xl bg-teal-50/50 hover:bg-teal-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-teal-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">PDF फाइल चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">सभी पेजों की हाई-क्वालिटी इमेज अलग होगी</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-neutral-800 block truncate">{selectedFile.name}</span>
                  {totalPages > 0 && <span className="text-[10px] text-neutral-500">कुल पेज: {totalPages}</span>}
                </div>
                <span className="font-bold text-neutral-600 shrink-0">
                  मूल साइज़: <span className="text-teal-700">{originalSizeKb} KB</span>
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Format & Quality Selection */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. आउटपुट फॉर्मेट व क्वालिटी (Format & Resolution)
            </label>

            <div>
              <span className="block text-xs font-bold text-neutral-700 mb-1.5">इमेज फॉर्मेट चुनें:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('image/jpeg')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    format === 'image/jpeg'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className="font-black text-sm">JPG</span>
                  <span className="text-[10px] text-neutral-500">मानक (फोटो)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('image/png')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    format === 'image/png'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className="font-black text-sm">PNG</span>
                  <span className="text-[10px] text-neutral-500">शार्प टेक्स्ट</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('image/webp')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    format === 'image/webp'
                      ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <span className="font-black text-sm">WEBP</span>
                  <span className="text-[10px] text-neutral-500">कम साइज़</span>
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-neutral-700 mb-1.5">क्वालिटी व रेज़ोल्यूशन (Scale):</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setScale(1.5)}
                  className={`p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    scale === 1.5
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-extrabold ring-1 ring-teal-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  मानक (Standard 1.5x) - तेज़
                </button>
                <button
                  type="button"
                  onClick={() => setScale(2.0)}
                  className={`p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    scale === 2.0
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-extrabold ring-1 ring-teal-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  हाई-डेफिनिशन (Ultra HD 2.0x)
                </button>
              </div>
            </div>

            {/* STEP 3: EXPLICIT ACTION TRIGGER BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || isExtracting}
                onClick={handleExtractPages}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isExtracting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || 'पेज निकाले जा रहे हैं...'}</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4" />
                    <span>PDF से फोटो बनाएं (Extract Pages)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: STEP 4 - Live Preview Grid & Download */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>निकाली गई तस्वीरें ({extractedPages.length})</span>
                </h3>

                {extractedPages.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-black text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {isZipping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                    <span>Download All (ZIP)</span>
                  </button>
                )}
              </div>

              {/* Extraction Container */}
              <div className="min-h-[260px] max-h-[460px] overflow-y-auto bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 p-3 relative">
                {isExtracting && (
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-2xs flex flex-col items-center justify-center z-10 p-4">
                    <RefreshCw className="w-6 h-6 text-teal-600 animate-spin mb-2" />
                    <span className="text-xs font-black text-neutral-800">{progressMsg}</span>
                  </div>
                )}

                {extractedPages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {extractedPages.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="bg-white p-2.5 rounded-xl border border-neutral-200 shadow-2xs space-y-1.5 flex flex-col justify-between"
                      >
                        <div className="aspect-[3/4] bg-neutral-50 rounded-lg overflow-hidden flex items-center justify-center border border-neutral-200">
                          <img
                            src={page.dataUrl}
                            alt={`Page ${page.pageNumber}`}
                            className="object-contain max-h-full max-w-full"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-neutral-100">
                          <span className="font-black text-neutral-800">पेज #{page.pageNumber}</span>
                          <span className="text-neutral-500 font-semibold">{page.sizeKb} KB</span>
                        </div>

                        <a
                          href={page.dataUrl}
                          download={`page_${page.pageNumber}.${getExtension()}`}
                          className="w-full py-1.5 px-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer border border-teal-200"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>डाउनलोड</span>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : selectedFile ? (
                  <div className="text-center p-6 space-y-2">
                    <FileText className="w-12 h-12 text-neutral-400 mx-auto" />
                    <div className="text-xs font-bold text-neutral-800">{selectedFile.name}</div>
                    <div className="text-[11px] text-neutral-500">कुल {totalPages} पेज उपलब्ध हैं</div>
                    <p className="text-[11px] text-teal-700 font-medium">
                      इमेज में बदलने हेतु बाईं तरफ &quot;PDF से फोटो बनाएं&quot; बटन दबाएं
                    </p>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-8">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से PDF फाइल अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">सभी पेजों की इमेज यहाँ दिखेगी</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section */}
            <div className="mt-4 pt-3 border-t border-neutral-200">
              {extractedPages.length > 0 && (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={isZipping}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 mb-2"
                >
                  <Archive className="w-4 h-4" />
                  <span>सभी पेज एक साथ ZIP में डाउनलोड करें ({extractedPages.length} इमेज)</span>
                </button>
              )}

              {/* Security Guarantee Text */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-neutral-600 font-medium text-center">
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
