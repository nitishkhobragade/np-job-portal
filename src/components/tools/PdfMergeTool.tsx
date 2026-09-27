"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, ArrowUp, ArrowDown, FileText, CheckCircle2, RefreshCw, Layers, ShieldCheck, X } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  sizeBytes: number;
}

export const PdfMergeTool: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PdfFileItem[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedSizeBytes, setMergedSizeBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newItems: PdfFileItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const sizeBytes = await getRealFileBytes(f);
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        name: f.name,
        sizeBytes,
      });
    }

    setPdfFiles((prev) => [...prev, ...newItems]);
    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setMergedPdfUrl(null);
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setPdfFiles((prev) => prev.filter((item) => item.id !== id));
    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setMergedPdfUrl(null);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setPdfFiles((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveDown = (index: number) => {
    if (index >= pdfFiles.length - 1) return;
    setPdfFiles((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const mergePdfs = async () => {
    if (pdfFiles.length < 2) {
      setErrorMessage('कृपया जोड़ने के लिए कम से कम 2 PDF फाइलें चुनें।');
      return;
    }

    setIsMerging(true);
    setErrorMessage(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfFiles) {
        const fileBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save({ useObjectStreams: true });
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });

      if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      setMergedSizeBytes(blob.size);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'PDF जोड़ने में समस्या आई। यदि कोई फाइल पासवर्ड प्रोटेक्टेड है तो पहले उसे अनलॉक करें।'
      );
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Layers className="w-4 h-4" />
          <span>PDF Merge / Combine (PDF फाइलें जोड़ें)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          एकल संयुक्त PDF तैयार करें
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF Merge"
          errorMessage={errorMessage}
          onRetry={mergePdfs}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & File Management */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                1. जोड़ने वाली PDF फाइलें चुनें (Select PDFs)
              </label>
              {pdfFiles.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPdfFiles([]);
                    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
                    setMergedPdfUrl(null);
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
                PDF फाइलें चुनें (एक साथ 2 या अधिक)
              </span>
              <span className="text-[10px] text-neutral-500 mt-0.5">
                .pdf समर्थित
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,application/pdf"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>

            {/* List of PDFs with Size and Cross Delete */}
            {pdfFiles.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-black text-neutral-700">
                  चुनी गई PDF फाइलें ({pdfFiles.length}) - क्रम बदलें या हटाएं:
                </div>
                {pdfFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2.5 p-2 bg-neutral-50 rounded-xl border border-neutral-200 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 text-red-700 flex items-center justify-center shrink-0 font-black text-[11px]">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-neutral-900 truncate max-w-[180px] sm:max-w-xs">
                          {item.name}
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
                        disabled={idx === pdfFiles.length - 1}
                        onClick={() => moveDown(idx)}
                        className="p-1 rounded-md bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                        title="नीचे ले जाएं"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
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

            <button
              type="button"
              onClick={mergePdfs}
              disabled={pdfFiles.length < 2 || isMerging}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] mt-2"
            >
              {isMerging ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PDF जोड़ी जा रही हैं...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>2. सभी PDF फाइलें जोड़ें (Merge {pdfFiles.length} PDFs)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {mergedPdfUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PDF फाइलें सफलतापूर्वक जुड़ गईं!</span>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 max-w-sm mx-auto">
                  <FileText className="w-10 h-10 text-rose-600 mx-auto" />
                  <div className="text-xs font-black text-neutral-800">
                    {pdfFiles.length} फाइलों की संयुक्त PDF
                  </div>
                  <div className="text-xs font-bold text-red-700">
                    कुल साइज़: {formatFileSize(mergedSizeBytes)}
                  </div>
                </div>

                <a
                  href={mergedPdfUrl}
                  download="merged_document.pdf"
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>संयुक्त PDF डाउनलोड करें ({formatFileSize(mergedSizeBytes)})</span>
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
                  कम से कम 2 PDF फाइलें अपलोड करें और &apos;PDF फाइलें जोड़ें&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  क्रम व्यवस्थित करके एक सिंगल कम्बांइड फाइल डाउनलोड करें
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
