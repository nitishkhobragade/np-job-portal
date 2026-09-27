"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, RotateCw, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas } from '../../lib/pdfHelper';
import { getRealFileBytes } from '../../lib/fileHelper';

interface PageItem {
  originalPageNumber: number; // 1-based
  currentRotation: number; // 0, 90, 180, 270
  thumbnailUrl: string;
}

export const PdfRotateOrganizeTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadSizeKb, setDownloadSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    setProgressMsg('PDF पेज लोड किए जा रहे हैं...');

    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      const loadedPages: PageItem[] = [];
      for (let i = 1; i <= count; i++) {
        setProgressMsg(`पेज ${i}/${count} का थंबनेल बनाया जा रहा है...`);
        const canvas = await renderPdfPageToCanvas(buffer, i, 0.7);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        loadedPages.push({
          originalPageNumber: i,
          currentRotation: 0,
          thumbnailUrl: dataUrl,
        });
      }
      setPages(loadedPages);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'PDF पेज लोड करने में समस्या आई।'
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

  const handleRotatePage = (index: number) => {
    setPages((prev) => {
      const next = [...prev];
      next[index].currentRotation = (next[index].currentRotation + 90) % 360;
      return next;
    });
  };

  const handleRotateAll = () => {
    setPages((prev) =>
      prev.map((p) => ({ ...p, currentRotation: (p.currentRotation + 90) % 360 }))
    );
  };

  const handleRemovePage = (index: number) => {
    if (pages.length <= 1) {
      setErrorMessage('कम से कम 1 पेज होना आवश्यक है।');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMovePage = (index: number, direction: 'up' | 'down') => {
    setPages((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const handleSaveOrganizedPdf = async () => {
    if (!selectedFile || pages.length === 0) return;

    setIsSaving(true);
    setProgressMsg('नया PDF बनाया जा रहा है...');
    setErrorMessage(null);

    try {
      const originalBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      for (let i = 0; i < pages.length; i++) {
        const item = pages[i];
        // 0-indexed in copyPages
        const [copiedPage] = await newPdf.copyPages(originalPdf, [item.originalPageNumber - 1]);

        if (item.currentRotation !== 0) {
          const existingRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((existingRotation + item.currentRotation) % 360));
        }

        newPdf.addPage(copiedPage);
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
        err instanceof Error ? err.message : 'PDF सेव करने में विफलता आई।'
      );
    } finally {
      setIsSaving(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-amber-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <RotateCw className="w-4 h-4" />
          <span>Rotate &amp; Organize PDF (पेज घुमाएं, हटाएं व क्रम बदलें)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          पेज मैनेजमेंट
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF Rotate & Organize"
          errorMessage={errorMessage}
          onRetry={handleSaveOrganizedPdf}
        />
      )}

      {/* Upload Box */}
      <ToolUploadBox
        label="1. अपनी PDF फ़ाइल चुनें (Select PDF to Organize)"
        subLabel="PDF फ़ाइलें (.pdf) समर्थित हैं"
        accept=".pdf,application/pdf"
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        fileType="pdf"
      />

      {isLoadingPages && (
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-600 mx-auto" />
          <p className="text-xs font-bold text-neutral-800">{progressMsg}</p>
        </div>
      )}

      {pages.length > 0 && !isLoadingPages && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-neutral-200">
            <div>
              <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                2. पेजों को घुमाएं, क्रम बदलें या अवांछित पेज हटाएं
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                कुल {pages.length} पृष्ठ उपलब्ध हैं
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotateAll}
                className="px-2.5 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>सभी घुमाएं (Rotate All 90°)</span>
              </button>
            </div>
          </div>

          {/* Grid of Pages */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map((p, idx) => (
              <div
                key={p.originalPageNumber}
                className="bg-neutral-50 border border-neutral-200 rounded-xl p-2 flex flex-col items-center justify-between space-y-2 shadow-2xs group relative"
              >
                <div className="w-full flex items-center justify-between text-[11px] font-black text-neutral-700 px-1">
                  <span>पेज {idx + 1}</span>
                  <span className="text-[9px] text-neutral-400">#{p.originalPageNumber}</span>
                </div>

                {/* Thumbnail with rotation */}
                <div className="w-full h-36 bg-white border border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center p-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.thumbnailUrl}
                    alt={`Page ${idx + 1}`}
                    style={{ transform: `rotate(${p.currentRotation}deg)` }}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 w-full justify-between pt-1 border-t border-neutral-200">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMovePage(idx, 'up')}
                      className="p-1 rounded bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                      title="आगे ले जाएं"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === pages.length - 1}
                      onClick={() => handleMovePage(idx, 'down')}
                      className="p-1 rounded bg-neutral-200 hover:bg-neutral-300 disabled:opacity-30 cursor-pointer"
                      title="पीछे ले जाएं"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRotatePage(idx)}
                    className="p-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 cursor-pointer"
                    title="90° घुमाएं"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemovePage(idx)}
                    className="p-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 cursor-pointer"
                    title="पेज हटाएं"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Save Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveOrganizedPdf}
              disabled={isSaving}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white text-xs sm:text-sm font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'सेव हो रहा है...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>परिवर्तन लागू करें व PDF बनाएं (Save &amp; Download PDF)</span>
                </>
              )}
            </button>
          </div>

          {downloadUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>नई PDF तैयार है ({downloadSizeKb} KB)!</span>
              </div>
              <a
                href={downloadUrl}
                download={`organized_${selectedFile?.name || 'document.pdf'}`}
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
