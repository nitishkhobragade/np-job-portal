"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Download, RefreshCw, FileText, CheckCircle2, Lock, Unlock, Scissors, ShieldCheck } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { getPdfPageCount } from '../../lib/pdfHelper';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

export const PdfSplitUnlockTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [toolMode, setToolMode] = useState<'split' | 'unlock'>('split');
  const [pageRange, setPageRange] = useState<string>('1');
  const [pdfPassword, setPdfPassword] = useState<string>('');

  // Processing & Output
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [processedSizeBytes, setProcessedSizeBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);

    setSelectedFile(file);
    setProcessedPdfUrl(null);
    setProcessedSizeBytes(0);
    setErrorMessage(null);
    setSuccessInfo(null);

    await getRealFileBytes(file);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setTotalPages(count);
      setPageRange(count > 1 ? `1-${Math.min(count, 2)}` : '1');
    } catch {
      setTotalPages(1);
    }
  };

  const handleFileRemove = () => {
    if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);
    setSelectedFile(null);
    setTotalPages(0);
    setProcessedPdfUrl(null);
    setProcessedSizeBytes(0);
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  // Helper to parse page range string like "1-3, 5, 7-9" into zero-indexed page numbers
  const parsePageRanges = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',');

    for (const part of parts) {
      const clean = part.trim();
      if (!clean) continue;

      if (clean.includes('-')) {
        const [startStr, endStr] = clean.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) {
              pages.add(i - 1);
            }
          }
        }
      } else {
        const single = parseInt(clean, 10);
        if (!isNaN(single) && single >= 1 && single <= maxPages) {
          pages.add(single - 1);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleProcessAction = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फाइल चुनें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const buffer = await selectedFile.arrayBuffer();

      if (toolMode === 'split') {
        const srcDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const max = srcDoc.getPageCount();
        const targetIndices = parsePageRanges(pageRange, max);

        if (targetIndices.length === 0) {
          throw new Error(`कृपया मान्य पेज रेंज दर्ज करें (जैसे 1-${max} के बीच)।`);
        }

        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        const newPdfBytes = await newDoc.save({ useObjectStreams: true });
        const finalBlob = new Blob([newPdfBytes], { type: 'application/pdf' });

        if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);
        const url = URL.createObjectURL(finalBlob);
        setProcessedPdfUrl(url);
        setProcessedSizeBytes(finalBlob.size);
        setSuccessInfo(`सफलतापूर्वक ${targetIndices.length} पेज अलग किए गए!`);
      } else {
        // Unlock Mode: Remove encryption
        const unlockedDoc = await PDFDocument.load(buffer, {
          password: pdfPassword || undefined,
          ignoreEncryption: false,
        });

        const newDoc = await PDFDocument.create();
        const pageCount = unlockedDoc.getPageCount();
        const indices = Array.from({ length: pageCount }, (_, i) => i);
        const copiedPages = await newDoc.copyPages(unlockedDoc, indices);
        copiedPages.forEach((p) => newDoc.addPage(p));

        const unlockedBytes = await newDoc.save({ useObjectStreams: true });
        const finalBlob = new Blob([unlockedBytes], { type: 'application/pdf' });

        if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);
        const url = URL.createObjectURL(finalBlob);
        setProcessedPdfUrl(url);
        setProcessedSizeBytes(finalBlob.size);
        setSuccessInfo('PDF से पासवर्ड सफलतापूर्वक हटाया गया! अब यह बिना लॉक के खुलेगा।');
      }
    } catch (err: unknown) {
      console.error(err);
      if (toolMode === 'unlock') {
        setErrorMessage('पासवर्ड गलत है या PDF पासवर्ड एन्क्रिप्टेड नहीं है। कृपया सही पासवर्ड दर्ज करें।');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'PDF प्रोसेस करने में समस्या आई। यदि फाइल पासवर्ड प्रोटेक्टेड है तो अनलॉक टैब चुनें।'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Scissors className="w-4 h-4" />
          <span>Split &amp; Unlock PDF (PDF पेज अलग करें या पासवर्ड हटाएं)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          100% प्राइवेट व लोकल
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF Split & Unlock"
          errorMessage={errorMessage}
          onRetry={handleProcessAction}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. अपनी PDF फ़ाइल चुनें (Select PDF File)"
            subLabel="PDF फ़ाइलें (.pdf) समर्थित हैं"
            accept=".pdf,application/pdf"
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="pdf"
          />

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            {/* Mode selection tabs */}
            <div>
              <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-1.5">
                2. कार्य चुनें (Select Action Mode)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setToolMode('split')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    toolMode === 'split'
                      ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold ring-1 ring-rose-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Scissors className="w-3.5 h-3.5 text-rose-600" />
                    <span>Split PDF (पेज अलग करें)</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">विशिष्ट पेज रेंज निकालें</div>
                </button>

                <button
                  type="button"
                  onClick={() => setToolMode('unlock')}
                  className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                    toolMode === 'unlock'
                      ? 'bg-rose-50 border-rose-600 text-rose-950 font-bold ring-1 ring-rose-600'
                      : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Unlock className="w-3.5 h-3.5 text-rose-600" />
                    <span>Unlock PDF (पासवर्ड हटाएं)</span>
                  </div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">स्थायी रूप से लॉक हटाएं</div>
                </button>
              </div>
            </div>

            {/* Split Mode Inputs */}
            {toolMode === 'split' && (
              <div className="space-y-2 pt-1 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-700">
                    पेज रेंज दर्ज करें (Page Range):
                  </span>
                  {totalPages > 0 && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      कुल {totalPages} पृष्ठ उपलब्ध
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="उदा. 1-3, 5, 7"
                  className="w-full px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <p className="text-[10px] text-neutral-500">
                  उदाहरण: <strong>1-3</strong> (पहले तीन पेज) या <strong>1, 3, 5</strong> (विशिष्ट पृष्ठ)
                </p>
              </div>
            )}

            {/* Unlock Mode Inputs */}
            {toolMode === 'unlock' && (
              <div className="space-y-2 pt-1 border-t border-neutral-200">
                <label className="block text-[11px] font-bold text-neutral-700">
                  PDF का मौजूदा पासवर्ड दर्ज करें:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={pdfPassword}
                    onChange={(e) => setPdfPassword(e.target.value)}
                    placeholder="पासवर्ड दर्ज करें (उदा. आधार/पैन पासवर्ड)"
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  एक बार पासवर्ड हटाने के बाद यह PDF बिना किसी पासवर्ड के सीधे खुल जाएगी।
                </p>
              </div>
            )}

            {/* Action Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleProcessAction}
                disabled={!selectedFile || isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>प्रोसेसिंग हो रही है...</span>
                  </>
                ) : toolMode === 'split' ? (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>3. पेज अलग करें (Split PDF Now)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>3. पासवर्ड हटाएं व अनलॉक करें (Unlock PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {processedPdfUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{successInfo || 'सफलतापूर्वक तैयार हुई!'}</span>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1.5 max-w-sm mx-auto">
                  <FileText className="w-10 h-10 text-rose-600 mx-auto" />
                  <div className="text-xs font-black text-neutral-800 truncate">
                    {toolMode === 'split'
                      ? `split_${selectedFile?.name || 'doc.pdf'}`
                      : `unlocked_${selectedFile?.name || 'doc.pdf'}`}
                  </div>
                  <div className="text-xs font-bold text-rose-700">
                    साइज़: {formatFileSize(processedSizeBytes)}
                  </div>
                </div>

                <a
                  href={processedPdfUrl}
                  download={
                    toolMode === 'split'
                      ? `split_${selectedFile?.name || 'doc.pdf'}`
                      : `unlocked_${selectedFile?.name || 'doc.pdf'}`
                  }
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
                <Scissors className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर PDF अपलोड करें और इच्छित पेज या अनलॉक विकल्प चुनें
                </p>
                <p className="text-[10px] text-neutral-400">
                  बिना पासवर्ड वाली साफ PDF सीधे आपके डिवाइस पर डाउनलोड होगी
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
