"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, Trash2, ArrowUp, ArrowDown, FileText, CheckCircle2, RefreshCw, Layers, ShieldCheck } from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  sizeKb: number;
}

export const PdfMergeTool: React.FC = () => {
  const [pdfFiles, setPdfFiles] = useState<PdfFileItem[]>([]);
  const [isMerging, setIsMerging] = useState<boolean>(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [mergedSizeKb, setMergedSizeKb] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMsg(null);
    const newItems: PdfFileItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      name: f.name,
      sizeKb: Math.round((f.size / 1024) * 10) / 10
    }));

    setPdfFiles((prev) => [...prev, ...newItems]);
    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
    setMergedPdfUrl(null);
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

  const handleMergePdfs = async () => {
    if (pdfFiles.length < 2) {
      setErrorMsg('कृपया कम से कम 2 PDF फाइलें अपलोड करें जिन्हें आप जोड़ना चाहते हैं।');
      return;
    }

    setIsMerging(true);
    setErrorMsg(null);

    try {
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfFiles) {
        const fileBuffer = await item.file.arrayBuffer();
        const donorPdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes], { type: 'application/pdf' });

      if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      setMergedSizeKb(Math.round((blob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error('PDF Merge Error:', err);
      setErrorMsg('PDF जोड़ने में समस्या आई। सुनिश्चित करें कि फाइलें पासवर्ड प्रोटेक्टेड नहीं हैं।');
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          PDF जोड़ें व कम्बाइन करें (PDF Merge Tool)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          मार्कशीट व प्रमाण पत्र कम्बाइन
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. जोड़ने वाली PDF फाइलें चुनें (Select PDF Files)
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl bg-purple-50/50 hover:bg-purple-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-purple-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">2 या अधिक PDF फाइलें चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">
                (मार्कशीट, सर्टिफिकेट, फॉर्म - एक साथ कई चुनें)
              </span>
              <input
                type="file"
                multiple
                accept="application/pdf"
                onChange={handleFilesChange}
                className="hidden"
              />
            </label>
          </div>

          {pdfFiles.length > 0 && (
            <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="text-xs font-black text-neutral-800 uppercase tracking-wider">
                  फाइलों का क्रम ({pdfFiles.length} फाइलें):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPdfFiles([]);
                    if (mergedPdfUrl) URL.revokeObjectURL(mergedPdfUrl);
                    setMergedPdfUrl(null);
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  सभी हटाएं
                </button>
              </div>

              <div className="space-y-2">
                {pdfFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <FileText className="w-6 h-6 text-purple-600 shrink-0" />
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
                        disabled={index === pdfFiles.length - 1}
                        title="नीचे ले जाएं"
                        className="p-1.5 rounded-md hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4 text-neutral-700" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
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

        {/* Right Column: Action & Download */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. PDF जोड़ें व डाउनलोड करें
            </label>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={handleMergePdfs}
              disabled={pdfFiles.length < 2 || isMerging}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-300 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
            >
              {isMerging ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PDF फाइलों को जोड़ा जा रहा है...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>{pdfFiles.length >= 2 ? `${pdfFiles.length} PDF फाइलें आपस में जोड़ें` : 'कम से कम 2 PDF अपलोड करें'}</span>
                </>
              )}
            </button>

            {mergedPdfUrl && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>सभी PDF सफलतापूर्वक जुड़ गई हैं!</span>
                  </span>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded-full">
                    {mergedSizeKb} KB
                  </span>
                </div>

                <a
                  href={mergedPdfUrl}
                  download={`merged_document_${new Date().toISOString().slice(0, 10)}.pdf`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>जुड़ा हुआ PDF डाउनलोड करें ({mergedSizeKb} KB)</span>
                </a>

                {/* Security Guarantee Text */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-neutral-600 font-medium text-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            )}

            <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-200 text-[11px] text-neutral-600 space-y-1">
              <span className="font-bold block text-neutral-800">💡 उपयोगी टिप:</span>
              <p>ऊपर दिए गए बाण (Arrows) का उपयोग करके आप फाइलों का क्रम आगे-पीछे कर सकते हैं। उसी क्रम में पेज एक के बाद एक जुड़ेंगे।</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
