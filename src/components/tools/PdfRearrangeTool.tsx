"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, ArrowLeft, ArrowRight, Shuffle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas } from '../../lib/pdfHelper';
import { getRealFileBytes } from '../../lib/fileHelper';

interface PageThumbnail {
  originalIndex: number; // 0-based
  displayPageNumber: number; // 1-based original
  thumbnailUrl: string;
}

export const PdfRearrangeTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadSizeKb, setDownloadSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const handleFileSelect = async (file: File) => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    pages.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));

    setSelectedFile(file);
    setPages([]);
    setDownloadUrl(null);
    setDownloadSizeKb(0);
    setErrorMessage(null);

    await getRealFileBytes(file);
    setIsLoadingPages(true);
    setProgressMsg('PDF के सभी पेजों को थंबनेल में लोड किया जा रहा है...');

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      if (count === 0) {
        throw new Error('PDF में कोई पेज नहीं मिला।');
      }

      const loaded: PageThumbnail[] = [];
      for (let i = 1; i <= count; i++) {
        setProgressMsg(`पेज ${i}/${count} का प्रीव्यू तैयार हो रहा है...`);
        const canvas = await renderPdfPageToCanvas(buffer, i, 0.7);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        loaded.push({
          originalIndex: i - 1,
          displayPageNumber: i,
          thumbnailUrl: dataUrl,
        });
      }
      setPages(loaded);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'PDF पेज लोड करने में त्रुटि हुई।'
      );
    } finally {
      setIsLoadingPages(false);
      setProgressMsg('');
    }
  };

  const handleFileRemove = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    pages.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));
    setSelectedFile(null);
    setPages([]);
    setDownloadUrl(null);
    setDownloadSizeKb(0);
    setErrorMessage(null);
  };

  const movePage = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= pages.length || fromIdx === toIdx) return;
    setPages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, moved);
      return updated;
    });
  };

  const reversePages = () => {
    setPages((prev) => [...prev].reverse());
  };

  const handleDragStart = (idx: number) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    movePage(draggedIdx, idx);
    setDraggedIdx(null);
  };

  const handleSaveRearrangedPdf = async () => {
    if (!selectedFile || pages.length === 0) return;

    setIsProcessing(true);
    setProgressMsg('नया री-अरेंज्ड PDF बनाया जा रहा है...');
    setErrorMessage(null);

    try {
      const originalBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      // Copy pages in the new re-arranged order
      const pageIndicesToCopy = pages.map((p) => p.originalIndex);
      const copiedPages = await newPdf.copyPages(originalPdf, pageIndicesToCopy);

      for (const page of copiedPages) {
        newPdf.addPage(page);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      setDownloadUrl(url);
      setDownloadSizeKb(Math.round((blob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'PDF री-अरेंज करने में त्रुटि हुई।'
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Shuffle className="w-4 h-4" />
          <span>Re-arrange PDF Pages (पेज क्रम बदलें - Drag &amp; Drop)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          पेज रि-ऑर्डर
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Re-arrange PDF Pages"
          errorMessage={errorMessage}
          onRetry={handleSaveRearrangedPdf}
        />
      )}

      {/* Step 1: Upload */}
      <ToolUploadBox
        label="1. अपनी PDF फ़ाइल चुनें (Select PDF to Re-arrange)"
        subLabel="मल्टी-पेज PDF फ़ाइल (.pdf) समर्थित है"
        accept=".pdf,application/pdf"
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        fileType="pdf"
      />

      {isLoadingPages && (
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
          <p className="text-xs font-bold text-neutral-800">{progressMsg}</p>
        </div>
      )}

      {/* Step 2: Interactive Drag & Drop Reorder */}
      {pages.length > 0 && !isLoadingPages && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-200">
            <div>
              <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                2. पेजों को पकड़कर खींचें (Drag) या तीरों द्वारा क्रम बदलें
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                कुल {pages.length} पृष्ठ उपलब्ध हैं | नया क्रम नीचे प्रदर्शित है
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={reversePages}
                className="px-2.5 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                title="क्रम उल्टा करें (Last to First)"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>उल्टा क्रम करें (Reverse)</span>
              </button>
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map((p, idx) => (
              <div
                key={`${p.originalIndex}-${idx}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(idx)}
                className={`bg-neutral-50 border-2 rounded-xl p-2 flex flex-col items-center justify-between space-y-2 shadow-2xs cursor-grab active:cursor-grabbing transition-all ${
                  draggedIdx === idx ? 'border-indigo-600 opacity-50' : 'border-neutral-200 hover:border-indigo-400'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[11px] font-black text-neutral-800 px-1">
                  <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                    स्थिति #{idx + 1}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    मूल पेज {p.displayPageNumber}
                  </span>
                </div>

                <div className="w-full h-36 bg-white border border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnailUrl}
                    alt={`Page ${idx + 1}`}
                    className="max-w-full max-h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Move Controls */}
                <div className="flex items-center justify-between w-full pt-1 border-t border-neutral-200">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => movePage(idx, idx - 1)}
                    className="p-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                    title="बाएं ले जाएं"
                  >
                    <ArrowLeft className="w-3 h-3" />
                  </button>

                  <span className="text-[10px] font-mono text-neutral-400">
                    {idx + 1} / {pages.length}
                  </span>

                  <button
                    type="button"
                    disabled={idx === pages.length - 1}
                    onClick={() => movePage(idx, idx + 1)}
                    className="p-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                    title="दाएं ले जाएं"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action Button: Never auto-converts, user clicks */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveRearrangedPdf}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'PDF तैयार हो रहा है...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>नया क्रम लागू करें व PDF बनाएं (Save Re-arranged PDF)</span>
                </>
              )}
            </button>
          </div>

          {downloadUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>पुनर्व्यवस्थित PDF सफलतापूर्वक तैयार है ({downloadSizeKb} KB)!</span>
              </div>
              <a
                href={downloadUrl}
                download={`rearranged_${selectedFile?.name || 'document.pdf'}`}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>डाउनलोड करें ({downloadSizeKb} KB)</span>
              </a>
              <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
