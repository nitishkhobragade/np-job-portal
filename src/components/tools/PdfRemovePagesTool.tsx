"use client";

import React, { useState } from 'react';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Trash2,
  X,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderAllPdfPagesToCanvases } from '../../lib/pdfHelper';
import { getRealFileBytes } from '../../lib/fileHelper';

interface PageThumbnail {
  pageIndex: number; // 0-based
  pageNumber: number; // 1-based
  thumbnailUrl: string;
}

export const PdfRemovePagesTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageThumbnail[]>([]);
  const [selectedIndicesToDelete, setSelectedIndicesToDelete] = useState<Set<number>>(new Set());
  const [pageInputString, setPageInputString] = useState<string>('');
  const [isLoadingPages, setIsLoadingPages] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadSizeKb, setDownloadSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    pages.forEach((p) => URL.revokeObjectURL(p.thumbnailUrl));

    setSelectedFile(file);
    setPages([]);
    setSelectedIndicesToDelete(new Set());
    setPageInputString('');
    setDownloadUrl(null);
    setDownloadSizeKb(0);
    setErrorMessage(null);

    setIsLoadingPages(true);
    setProgressMsg('PDF के सभी पेजों को थंबनेल में लोड किया जा रहा है...');

    try {
      // 1. Get cloned file bytes to prevent any detachment issues
      const bytes = await getRealFileBytes(file);
      const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

      // 2. Validate PDF using pdf-lib on a cloned buffer
      const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      if (count === 0) {
        throw new Error('PDF में कोई पेज नहीं मिला।');
      }

      // 3. Batch render all pages in one single parse session without detached buffer errors
      const renderedCanvases = await renderAllPdfPagesToCanvases(
        buffer.slice(0),
        0.8,
        (current, total) => {
          setProgressMsg(`पेज ${current}/${total} का प्रीव्यू तैयार हो रहा है...`);
        }
      );

      const loaded: PageThumbnail[] = renderedCanvases.map(({ pageNumber, canvas }) => ({
        pageIndex: pageNumber - 1,
        pageNumber,
        thumbnailUrl: canvas.toDataURL('image/jpeg', 0.82),
      }));

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
    setSelectedIndicesToDelete(new Set());
    setPageInputString('');
    setDownloadUrl(null);
    setDownloadSizeKb(0);
    setErrorMessage(null);
  };

  // Sync set to comma-separated string
  const updateInputStringFromSet = (set: Set<number>) => {
    const sorted = Array.from(set)
      .map((idx) => idx + 1)
      .sort((a, b) => a - b);
    setPageInputString(sorted.join(', '));
  };

  const togglePageDelete = (pageIndex: number) => {
    setSelectedIndicesToDelete((prev) => {
      const next = new Set(prev);
      if (next.has(pageIndex)) {
        next.delete(pageIndex);
      } else {
        next.add(pageIndex);
      }
      updateInputStringFromSet(next);
      return next;
    });
  };

  const handleManualInputChange = (text: string) => {
    setPageInputString(text);
    // Parse ranges like "1, 3, 5-7"
    const nextSet = new Set<number>();
    const parts = text.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let p = start; p <= end; p++) {
            if (p >= 1 && p <= pages.length) {
              nextSet.add(p - 1);
            }
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= pages.length) {
          nextSet.add(p - 1);
        }
      }
    }
    setSelectedIndicesToDelete(nextSet);
  };

  const selectOddPages = () => {
    const next = new Set<number>();
    pages.forEach((p) => {
      if (p.pageNumber % 2 !== 0) {
        next.add(p.pageIndex);
      }
    });
    setSelectedIndicesToDelete(next);
    updateInputStringFromSet(next);
  };

  const selectEvenPages = () => {
    const next = new Set<number>();
    pages.forEach((p) => {
      if (p.pageNumber % 2 === 0) {
        next.add(p.pageIndex);
      }
    });
    setSelectedIndicesToDelete(next);
    updateInputStringFromSet(next);
  };

  const selectAllPages = () => {
    // Select all except the first page to prevent empty PDF
    const next = new Set<number>();
    pages.forEach((p, idx) => {
      if (idx > 0) next.add(p.pageIndex);
    });
    setSelectedIndicesToDelete(next);
    updateInputStringFromSet(next);
  };

  const clearSelection = () => {
    setSelectedIndicesToDelete(new Set());
    setPageInputString('');
  };

  const handleRemovePagesAndSave = async () => {
    if (!selectedFile || pages.length === 0) return;

    if (selectedIndicesToDelete.size === 0) {
      setErrorMessage('कृपया हटाने के लिए कम से कम 1 पेज चुनें (पेज के ऊपर लाल ✕ क्रॉस पर क्लिक करें)।');
      return;
    }

    if (selectedIndicesToDelete.size >= pages.length) {
      setErrorMessage('आप सभी पेजों को नहीं हटा सकते। कम से कम 1 पेज रखना आवश्यक है।');
      return;
    }

    setIsProcessing(true);
    setProgressMsg('चयनित पेज हटाए जा रहे हैं...');
    setErrorMessage(null);

    try {
      const bytes = await getRealFileBytes(selectedFile);
      const originalBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
      const originalPdf = await PDFDocument.load(originalBuffer.slice(0), { ignoreEncryption: true });
      const newPdf = await PDFDocument.create();

      // Keep pages that are NOT in selectedIndicesToDelete
      const indicesToKeep = pages
        .map((p) => p.pageIndex)
        .filter((idx) => !selectedIndicesToDelete.has(idx));

      const copiedPages = await newPdf.copyPages(originalPdf, indicesToKeep);
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
        err instanceof Error ? err.message : 'पेज हटाने में त्रुटि हुई।'
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const remainingCount = pages.length - selectedIndicesToDelete.size;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-700 via-red-700 to-red-800 text-white px-3.5 py-2 rounded-xl shadow-xs flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-white" />
            <span>Remove / Delete PDF Pages (PDF से अवांछित पेज हटाएं)</span>
          </h2>
          <p className="text-[11px] text-rose-100 font-medium mt-0.5">
            मल्टी-पेज PDF में से जिन पेजों को हटाना है, उनके ऊपर लाल ✕ (Cross) सिंबल पर क्लिक करें और नई PDF डाउनलोड करें।
          </p>
        </div>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2.5 py-0.5 rounded-full shrink-0">
          पेज डिलीट टूल
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Remove PDF Pages"
          errorMessage={errorMessage}
          onRetry={handleRemovePagesAndSave}
        />
      )}

      {/* Step 1: Upload */}
      <ToolUploadBox
        label="1. अपनी PDF फ़ाइल चुनें (Select PDF to Remove Pages)"
        subLabel="मल्टी-पेज PDF फ़ाइल (.pdf) समर्थित है — सभी पेज नीचे व्यू-पोर्ट में दिखेंगे"
        accept=".pdf,application/pdf"
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        fileType="pdf"
      />

      {isLoadingPages && (
        <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <RefreshCw className="w-7 h-7 animate-spin text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{progressMsg}</p>
          <div className="w-48 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-rose-600 animate-pulse w-3/4 rounded-full" />
          </div>
        </div>
      )}

      {/* Step 2: Interactive Page Removal Viewport */}
      {pages.length > 0 && !isLoadingPages && (
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
          {/* Viewport Control Bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
                <span>पेज व्यू-पोर्ट (Page Selection Viewport)</span>
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                कुल <strong className="text-slate-900 dark:text-white">{pages.length} पेजेस</strong> |{' '}
                हटाने हेतु चुने गए:{' '}
                <strong className="text-rose-600 font-black">
                  {selectedIndicesToDelete.size} पेज
                </strong>{' '}
                | अंतिम PDF में शेष रहेंगे:{' '}
                <strong className="text-emerald-600 font-black">
                  {remainingCount} पेज
                </strong>
              </p>
            </div>

            {/* Quick Action Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto flex-wrap">
              <button
                type="button"
                onClick={selectOddPages}
                className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer shadow-2xs transition-all active:scale-95"
              >
                विषम (Odd)
              </button>
              <button
                type="button"
                onClick={selectEvenPages}
                className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer shadow-2xs transition-all active:scale-95"
              >
                सम (Even)
              </button>
              <button
                type="button"
                onClick={selectAllPages}
                className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-600 cursor-pointer shadow-2xs transition-all active:scale-95"
                title="पहले पेज को छोड़कर बाकी सभी पेज चुनें"
              >
                अन्य सभी
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs transition-all active:scale-95"
              >
                चयन हटाएं (Clear)
              </button>
            </div>
          </div>

          {/* Manual Input Range */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span>हटाने हेतु पेज नंबर दर्ज करें:</span>
            </label>
            <input
              type="text"
              value={pageInputString}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="उदा. 2, 4, 6-8 (पेज 1 से शुरू)"
              className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono text-slate-900 dark:text-white"
            />
          </div>

          {/* Instruction helper */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2 rounded-lg flex items-center gap-2">
            <span className="text-amber-600 font-bold shrink-0">💡 संकेत:</span>
            <span>
              प्रत्येक पेज के ऊपर बने <strong>लाल ✕ (Cross) बटन</strong> या पूरे कार्ड पर क्लिक करें। जिस पेज पर लाल क्रॉस लग जाएगा, वह नई PDF से हटा दिया जाएगा।
            </span>
          </div>

          {/* Page Grid Viewport with Cross (✕) Symbols */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[65vh] overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
            {pages.map((p) => {
              const isSelectedForDeletion = selectedIndicesToDelete.has(p.pageIndex);
              return (
                <div
                  key={p.pageNumber}
                  onClick={() => togglePageDelete(p.pageIndex)}
                  className={`group relative border-2 rounded-2xl p-2.5 flex flex-col items-center justify-between space-y-2 cursor-pointer transition-all duration-150 select-none shadow-xs hover:shadow-md ${
                    isSelectedForDeletion
                      ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-600 ring-2 ring-rose-300 dark:ring-rose-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-400'
                  }`}
                >
                  {/* Top Bar: Page Label + PROMINENT RED CROSS BUTTON */}
                  <div className="w-full flex items-center justify-between">
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                      isSelectedForDeletion
                        ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 line-through'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}>
                      पेज #{p.pageNumber}
                    </span>

                    {/* PROMINENT CROSS (✕) SYMBOL BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePageDelete(p.pageIndex);
                      }}
                      title={isSelectedForDeletion ? 'हटाने से रोकें (Restore Page)' : 'इस पेज को हटाएं (Remove this Page)'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-90 ${
                        isSelectedForDeletion
                          ? 'bg-rose-600 text-white ring-2 ring-rose-400 scale-105'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>

                  {/* Thumbnail Preview Area with Overlay */}
                  <div className="w-full h-40 bg-white rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center p-1 relative shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${p.pageNumber}`}
                      className={`max-w-full max-h-full object-contain pointer-events-none transition-all duration-150 ${
                        isSelectedForDeletion ? 'opacity-30 grayscale blur-[0.5px]' : 'opacity-100'
                      }`}
                    />

                    {/* DELETED OVERLAY WITH LARGE RED CROSS */}
                    {isSelectedForDeletion && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/50 backdrop-blur-[1px] p-2 text-center animate-in zoom-in-95 duration-100">
                        <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg mb-1 ring-4 ring-rose-400/40">
                          <X className="w-6 h-6 stroke-[3.5]" />
                        </div>
                        <span className="text-[10px] font-black text-white bg-rose-700 px-2 py-0.5 rounded-full shadow-xs">
                          पेज हटाया जाएगा
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Status Tag */}
                  <div className="text-[11px] text-center w-full font-black">
                    {isSelectedForDeletion ? (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1">
                        <X className="w-3 h-3 stroke-[3]" />
                        <span>हटाने हेतु चुना गया</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 group-hover:text-rose-600 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span>सुरक्षित रहेगा</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action CTA Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRemovePagesAndSave}
              disabled={isProcessing || selectedIndicesToDelete.size === 0}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-800 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'पेज हटाए जा रहे हैं...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {selectedIndicesToDelete.size > 0
                      ? `चुने हुए ${selectedIndicesToDelete.size} पेज हटाएं और नया PDF बनाएं (Remove ${selectedIndicesToDelete.size} Pages & Save)`
                      : 'हटाने के लिए ऊपर पेजों पर ✕ क्रॉस चुनें'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Download Box */}
          {downloadUrl && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2.5 text-center animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>सफलतापूर्वक {selectedIndicesToDelete.size} पेज हटा दिए गए! नई PDF तैयार है ({downloadSizeKb} KB)</span>
              </div>
              <a
                href={downloadUrl}
                download={`removed_pages_${selectedFile?.name || 'document.pdf'}`}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>नई PDF डाउनलोड करें ({downloadSizeKb} KB)</span>
              </a>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% सुरक्षित: आपकी फाइलें केवल आपके ब्राउज़र में प्रोसेस होती हैं, सर्वर पर नहीं।</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
