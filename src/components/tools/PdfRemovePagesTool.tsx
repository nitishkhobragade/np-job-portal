"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle2, ShieldCheck, Trash2 } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas } from '../../lib/pdfHelper';
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
          pageIndex: i - 1,
          pageNumber: i,
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

  const clearSelection = () => {
    setSelectedIndicesToDelete(new Set());
    setPageInputString('');
  };

  const handleRemovePagesAndSave = async () => {
    if (!selectedFile || pages.length === 0) return;

    if (selectedIndicesToDelete.size === 0) {
      setErrorMessage('कृपया हटाने के लिए कम से कम 1 पेज चुनें।');
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
      const originalBuffer = await selectedFile.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
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
      <div className="bg-gradient-to-r from-rose-700 via-red-700 to-red-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Trash2 className="w-4 h-4" />
          <span>Remove / Delete PDF Pages (PDF से अवांछित पेज हटाएं)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          पेज डिलीट
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
        subLabel="मल्टी-पेज PDF फ़ाइल (.pdf) समर्थित है"
        accept=".pdf,application/pdf"
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onFileRemove={handleFileRemove}
        fileType="pdf"
      />

      {isLoadingPages && (
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-600 mx-auto" />
          <p className="text-xs font-bold text-neutral-800">{progressMsg}</p>
        </div>
      )}

      {/* Step 2: Interactive Page Removal Grid */}
      {pages.length > 0 && !isLoadingPages && (
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
            <div>
              <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                2. जिस पेज को हटाना है उस पर क्लिक करें
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                कुल {pages.length} पेजों में से{' '}
                <strong className="text-rose-600 font-bold">{selectedIndicesToDelete.size} पेज</strong> हटाने हेतु चुने गए हैं |{' '}
                <strong className="text-emerald-700 font-bold">{remainingCount} पेज शेष रहेंगे</strong>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={selectOddPages}
                className="px-2 py-1 text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer"
              >
                विषम पेज (Odd)
              </button>
              <button
                type="button"
                onClick={selectEvenPages}
                className="px-2 py-1 text-[11px] font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg cursor-pointer"
              >
                सम पेज (Even)
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-2 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg cursor-pointer border border-rose-200"
              >
                चयन हटाएं (Clear)
              </button>
            </div>
          </div>

          {/* Manual Input Range */}
          <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row sm:items-center gap-2">
            <label className="text-xs font-bold text-neutral-700 shrink-0">
              हटाने हेतु पेज नंबर दर्ज करें:
            </label>
            <input
              type="text"
              value={pageInputString}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="उदा. 2, 4, 6-8 (पेज 1 से शुरू)"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-rose-500 font-mono text-neutral-800"
            />
          </div>

          {/* Thumbnail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {pages.map((p) => {
              const isSelectedForDeletion = selectedIndicesToDelete.has(p.pageIndex);
              return (
                <div
                  key={p.pageNumber}
                  onClick={() => togglePageDelete(p.pageIndex)}
                  className={`border-2 rounded-xl p-2 flex flex-col items-center justify-between space-y-2 cursor-pointer transition-all relative select-none ${
                    isSelectedForDeletion
                      ? 'bg-rose-50/80 border-rose-600 shadow-md ring-2 ring-rose-300'
                      : 'bg-neutral-50 border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-[11px] font-black px-1">
                    <span className={isSelectedForDeletion ? 'text-rose-700' : 'text-neutral-800'}>
                      पेज #{p.pageNumber}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                        isSelectedForDeletion
                          ? 'bg-rose-600 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {isSelectedForDeletion ? 'हटाएं ✕' : 'रखें ✓'}
                    </span>
                  </div>

                  <div className="w-full h-36 bg-white border border-neutral-200 rounded-lg overflow-hidden flex items-center justify-center p-1 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${p.pageNumber}`}
                      className={`max-w-full max-h-full object-contain pointer-events-none transition-all ${
                        isSelectedForDeletion ? 'opacity-40 grayscale contrast-125' : ''
                      }`}
                    />

                    {isSelectedForDeletion && (
                      <div className="absolute inset-0 flex items-center justify-center bg-rose-900/30 backdrop-blur-[1px]">
                        <div className="p-2 bg-rose-600 text-white rounded-full shadow-lg">
                          <Trash2 className="w-6 h-6 animate-pulse" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-center w-full font-bold">
                    {isSelectedForDeletion ? (
                      <span className="text-rose-700">यह पेज हटाया जाएगा</span>
                    ) : (
                      <span className="text-neutral-500">क्लिक करके हटाएं</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Button: Never auto-converts, user clicks */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleRemovePagesAndSave}
              disabled={isProcessing || selectedIndicesToDelete.size === 0}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-800 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
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
                    चुने हुए {selectedIndicesToDelete.size} पेज हटाएं व PDF बनाएं (Remove &amp; Save PDF)
                  </span>
                </>
              )}
            </button>
          </div>

          {downloadUrl && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center animate-in fade-in duration-200">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>सफलतापूर्वक पेज हटाकर नई PDF तैयार है ({downloadSizeKb} KB)!</span>
              </div>
              <a
                href={downloadUrl}
                download={`removed_pages_${selectedFile?.name || 'document.pdf'}`}
                className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Download className="w-4 h-4" />
                <span>नई PDF डाउनलोड करें ({downloadSizeKb} KB)</span>
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
