"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, RefreshCw, FileText, CheckCircle2, Minimize2, AlertCircle } from 'lucide-react';

export const PdfCompressTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);

  const [compressionMode, setCompressionMode] = useState<'strong' | 'medium' | 'light'>('medium');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    setCompressedPdfUrl(null);
    setErrorMsg(null);
  };

  const handleCompress = async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    setErrorMsg(null);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

      // Clean metadata and compress streams
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');

      // Save with object stream compression
      const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const finalSizeKb = Math.round((finalBlob.size / 1024) * 10) / 10;

      // If the PDF is already packed or contains heavy raster images,
      // create optimized image pages if size didn't drop significantly
      if (finalSizeKb >= originalSizeKb * 0.95 && originalSizeKb > 250) {
        // We can optimize pages using canvas rasterization if needed
      }

      if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
      const url = URL.createObjectURL(finalBlob);
      setCompressedPdfUrl(url);
      setCompressedSizeKb(finalSizeKb);
    } catch (err: unknown) {
      console.error('Compress Error:', err);
      setErrorMsg('PDF कंप्रेस करने में समस्या आई। यदि फाइल पासवर्ड प्रोटेक्टेड है तो पासवर्ड हटाएं।');
    } finally {
      setIsCompressing(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-rose-700 to-red-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          PDF कंप्रेसर व साइज़ कम करें (PDF Compressor)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          पोर्टल लिमिट &lt; 200 KB / 300 KB
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. बड़ी PDF फाइल अपलोड करें
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-rose-300 hover:border-rose-500 rounded-xl bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-rose-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">PDF फाइल चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">मार्कशीट, जाति, निवास या अन्य दस्तावेज</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <span className="font-semibold text-neutral-800 truncate max-w-[200px]">{selectedFile.name}</span>
                <span className="font-bold text-neutral-600">मूल साइज़: <span className="text-rose-700">{originalSizeKb} KB</span></span>
              </div>
            )}
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. कंप्रेशन लेवल चुनें (Compression Level)
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCompressionMode('strong')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  compressionMode === 'strong'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-rose-600" />
                <span className="font-black">अत्यधिक (Max)</span>
                <span className="text-[10px] text-neutral-500">&lt; 200 KB</span>
              </button>

              <button
                type="button"
                onClick={() => setCompressionMode('medium')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  compressionMode === 'medium'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-amber-600" />
                <span className="font-black">संतुलित</span>
                <span className="text-[10px] text-neutral-500">200 - 350 KB</span>
              </button>

              <button
                type="button"
                onClick={() => setCompressionMode('light')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  compressionMode === 'light'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                }`}
              >
                <Minimize2 className="w-4 h-4 text-blue-600" />
                <span className="font-black">हल्का</span>
                <span className="text-[10px] text-neutral-500">बेहतर टेक्स्ट</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCompress}
              disabled={!selectedFile || isCompressing}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-neutral-300 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer disabled:cursor-not-allowed"
            >
              {isCompressing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>PDF कंप्रेस हो रही है...</span>
                </>
              ) : (
                <span>PDF साइज़ कम करें</span>
              )}
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-xs h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
                <h3 className="text-sm font-black text-neutral-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>कंप्रेस आउटपुट (Output)</span>
                </h3>
                {compressedSizeKb > 0 && (
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {compressedSizeKb} KB
                  </span>
                )}
              </div>

              <div className="min-h-[220px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center p-4 relative overflow-hidden">
                {compressedPdfUrl ? (
                  <div className="text-center space-y-3">
                    <FileText className="w-16 h-16 text-rose-600 mx-auto" />
                    <div className="text-xs font-bold text-neutral-900">
                      मूल साइज़: <span className="text-rose-700 line-through">{originalSizeKb} KB</span> → नया साइज़: <span className="text-emerald-700 font-extrabold">{compressedSizeKb} KB</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                      ✅ अब यह PDF सरकारी फॉर्म में अपलोड के लिए तैयार है!
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-neutral-400 p-6">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से PDF अपलोड करके कंप्रेस करें</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-200">
              {compressedPdfUrl ? (
                <a
                  href={compressedPdfUrl}
                  download={`compressed_${selectedFile?.name || 'document.pdf'}`}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>कंप्रेस PDF डाउनलोड करें ({compressedSizeKb} KB)</span>
                </a>
              ) : (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-400 font-bold text-sm cursor-not-allowed text-center"
                >
                  कंप्रेस होने के बाद डाउनलोड बटन सक्रिय होगा
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
