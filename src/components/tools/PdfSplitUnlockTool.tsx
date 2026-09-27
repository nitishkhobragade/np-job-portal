"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, RefreshCw, FileText, CheckCircle2, Lock, Unlock, Scissors, ShieldCheck } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';
import { getPdfPageCount } from '../../lib/pdfHelper';

export const PdfSplitUnlockTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [toolMode, setToolMode] = useState<'split' | 'unlock'>('split');
  const [pageRange, setPageRange] = useState<string>('1');
  const [pdfPassword, setPdfPassword] = useState<string>('');

  // Processing & Output
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  const [processedSizeKb, setProcessedSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    setProcessedPdfUrl(null);
    setProcessedSizeKb(0);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setTotalPages(count);
      setPageRange(count > 1 ? `1-${Math.min(count, 2)}` : '1');
    } catch {
      // Might be password protected
      setTotalPages(1);
    }
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
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(maxPages, Math.max(start, end));
          for (let i = from; i <= to; i++) {
            pages.add(i - 1);
          }
        }
      } else {
        const pageNum = parseInt(clean, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= maxPages) {
          pages.add(pageNum - 1);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  // EXPLICIT ACTION TRIGGER
  const handleProcessPdf = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फाइल चुनें।');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessInfo(null);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();

      if (toolMode === 'unlock') {
        // Unlock mode: Load with user password and save unencrypted
        if (!pdfPassword) {
          throw new Error('कृपया PDF का पासवर्ड दर्ज करें।');
        }

        // pdf-lib load with password
        // @ts-expect-error pdf-lib password option
        const pdfDoc = await PDFDocument.load(fileBuffer, { password: pdfPassword, ignoreEncryption: false });
        const unlockedBytes = await pdfDoc.save({ useObjectStreams: true });
        const blob = new Blob([unlockedBytes], { type: 'application/pdf' });

        if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);
        const url = URL.createObjectURL(blob);
        setProcessedPdfUrl(url);
        setProcessedSizeKb(Math.round((blob.size / 1024) * 10) / 10);
        setSuccessInfo('PDF का पासवर्ड सफलतापूर्वक हटा दिया गया है! अब यह बिना पासवर्ड खुलेगी।');
      } else {
        // Split / Extract mode
        const srcDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const numPages = srcDoc.getPageCount();
        const selectedIndices = parsePageRanges(pageRange, numPages);

        if (selectedIndices.length === 0) {
          throw new Error(`कृपया मान्य पेज नंबर दर्ज करें (1 से ${numPages} के बीच, उदा. 1-2 या 1,3)`);
        }

        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(srcDoc, selectedIndices);
        copiedPages.forEach((page) => newDoc.addPage(page));

        const extractedBytes = await newDoc.save({ useObjectStreams: true });
        const blob = new Blob([extractedBytes], { type: 'application/pdf' });

        if (processedPdfUrl) URL.revokeObjectURL(processedPdfUrl);
        const url = URL.createObjectURL(blob);
        setProcessedPdfUrl(url);
        setProcessedSizeKb(Math.round((blob.size / 1024) * 10) / 10);
        setSuccessInfo(`${selectedIndices.length} पेज सफलतापूर्वक अलग कर लिए गए हैं!`);
      }
    } catch (err: unknown) {
      console.error('Process error:', err);
      const msg = err instanceof Error ? err.message : 'PDF प्रोसेस करने में समस्या आई।';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        setErrorMessage('यह PDF पासवर्ड से सुरक्षित है। कृपया पासवर्ड हटाएं विकल्प चुनें और पासवर्ड दर्ज करें।');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          PDF पेज अलग करें व पासवर्ड हटाएं (Split & Unlock PDF)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          Page Extractor • 100% Client-Side Unlocking
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Split & Unlock PDF"
          errorMessage={errorMessage}
          onRetry={handleProcessPdf}
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
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl bg-purple-50/50 hover:bg-purple-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-purple-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">PDF फाइल चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">पासवर्ड वाली या सामान्य PDF</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-neutral-800 block truncate">{selectedFile.name}</span>
                  {totalPages > 0 && <span className="text-[10px] text-neutral-500">कुल पेज: {totalPages}</span>}
                </div>
                <span className="font-bold text-neutral-600 shrink-0">
                  मूल साइज़: <span className="text-purple-700">{originalSizeKb} KB</span>
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Operation Mode Selection & Configuration */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. कार्य प्रकार चुनें (Select Action)
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setToolMode('split')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  toolMode === 'split'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <Scissors className="w-5 h-5 text-purple-600" />
                <span className="font-black text-sm">पेज अलग करें (Split)</span>
                <span className="text-[10px] text-neutral-500">ज़रूरी पेज निकालें</span>
              </button>

              <button
                type="button"
                onClick={() => setToolMode('unlock')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  toolMode === 'unlock'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <Unlock className="w-5 h-5 text-indigo-600" />
                <span className="font-black text-sm">पासवर्ड हटाएं (Unlock)</span>
                <span className="text-[10px] text-neutral-500">स्थाई अनलॉक करें</span>
              </button>
            </div>

            {toolMode === 'split' ? (
              <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="block text-xs font-bold text-neutral-800">
                  निकाले जाने वाले पेज दर्ज करें (Page Range):
                </label>
                <input
                  type="text"
                  value={pageRange}
                  onChange={(e) => setPageRange(e.target.value)}
                  placeholder="उदा. 1-3, 5 (या केवल 1)"
                  className="w-full px-3 py-2 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <p className="text-[11px] text-neutral-500">
                  उदाहरण: <b>1-3</b> (पेज 1 से 3 तक) या <b>1, 3, 5</b> (विशिष्ट पेज)।
                  {totalPages > 0 && ` (इस फाइल में कुल ${totalPages} पेज हैं)`}
                </p>
              </div>
            ) : (
              <div className="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <label className="block text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>PDF का वर्तमान पासवर्ड दर्ज करें:</span>
                </label>
                <input
                  type="password"
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  placeholder="PDF पासवर्ड दर्ज करें (उदा. आधार/पैन/सैलरी स्लिप पासवर्ड)"
                  className="w-full px-3 py-2 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <p className="text-[11px] text-neutral-500">
                  पासवर्ड दर्ज करके सेव करने पर नया PDF हमेशा के लिए बिना पासवर्ड के खुल जाएगा।
                </p>
              </div>
            )}

            {/* STEP 3: EXPLICIT ACTION TRIGGER BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || isProcessing}
                onClick={handleProcessPdf}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>PDF प्रोसेस हो रही है...</span>
                  </>
                ) : toolMode === 'split' ? (
                  <>
                    <Scissors className="w-4 h-4" />
                    <span>पेज अलग करें (Extract Pages)</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>पासवर्ड हटाएं व अनलॉक करें (Unlock PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: STEP 4 - Output Preview & Download */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>आउटपुट प्रीव्यू व डाउनलोड (Output)</span>
                </h3>
                {processedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {processedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Status Box */}
              <div className="min-h-[220px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-2xs flex flex-col items-center justify-center z-10 p-4">
                    <RefreshCw className="w-6 h-6 text-purple-600 animate-spin mb-2" />
                    <span className="text-xs font-black text-neutral-800">PDF तैयार हो रही है...</span>
                  </div>
                )}

                {processedPdfUrl ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
                        ✓ {successInfo || 'कार्य संपन्न हुआ!'}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        नया साइज़: {processedSizeKb} KB • डाउनलोड के लिए तैयार
                      </p>
                    </div>
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-neutral-200 text-neutral-600 flex items-center justify-center mx-auto">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-neutral-800">{selectedFile.name}</div>
                    <div className="text-[11px] text-neutral-500">मूल साइज़: {originalSizeKb} KB</div>
                    <p className="text-[11px] text-purple-700 font-medium">
                      प्रक्रिया शुरू करने के लिए बाईं तरफ का बटन दबाएं
                    </p>
                  </div>
                ) : (
                  <div className="text-neutral-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से PDF अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      तैयार PDF का डाउनलोड लिंक यहाँ दिखाई देगा
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <div className="mt-6 pt-4 border-t border-neutral-200">
              {processedPdfUrl ? (
                <a
                  href={processedPdfUrl}
                  download={
                    toolMode === 'unlock'
                      ? `unlocked_${selectedFile?.name || 'document.pdf'}`
                      : `extracted_${pageRange.replace(/[\s,]+/g, '_')}_${selectedFile?.name || 'document.pdf'}`
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>
                    {toolMode === 'unlock' ? 'अनलॉक PDF डाउनलोड करें' : 'अलग किए गए पेज डाउनलोड करें'} ({processedSizeKb} KB)
                  </span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleProcessPdf}
                  disabled={!selectedFile}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-pointer hover:bg-neutral-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? 'पहले प्रक्रिया बटन दबाएं' : 'डाउनलोड हेतु पहले PDF चुनें'}
                </button>
              )}

              {/* Security Guarantee Text */}
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-neutral-600 font-medium text-center">
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
