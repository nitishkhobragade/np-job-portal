"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Upload, Download, RefreshCw, FileText, CheckCircle2, Minimize2, ShieldCheck } from 'lucide-react';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas, getPdfPageCount } from '../../lib/pdfHelper';

export const PdfCompressTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSizeKb, setOriginalSizeKb] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);

  const [targetKb, setTargetKb] = useState<number>(200);
  const [compressionMode, setCompressionMode] = useState<'strong' | 'medium' | 'light'>('medium');

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [compressedSizeKb, setCompressedSizeKb] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);

    setSelectedFile(file);
    setOriginalSizeKb(Math.round((file.size / 1024) * 10) / 10);
    setCompressedPdfUrl(null);
    setCompressedSizeKb(0);
    setErrorMessage(null);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setPageCount(count);
    } catch {
      setPageCount(1);
    }
  };

  // EXPLICIT ACTION TRIGGER: Target KB iterative compressor
  const handleCompress = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फाइल चुनें।');
      return;
    }

    setIsCompressing(true);
    setProgressMsg('PDF विश्लेषण हो रहा है...');
    setErrorMessage(null);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

      // Clean metadata
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('');
      pdfDoc.setCreator('');

      let compressedBytes = await pdfDoc.save({ useObjectStreams: true });
      const currentSizeKb = compressedBytes.byteLength / 1024;

      // If current size is still higher than targetKb or user wants strong compression,
      // rasterize and optimize scanned/image pages iteratively
      if (currentSizeKb > targetKb && targetKb > 0) {
        setProgressMsg('पेजों का आकार अनुकूलित (Raster Optimization) किया जा रहा है...');

        const totalPages = await getPdfPageCount(fileBuffer);
        const newPdf = await PDFDocument.create();

        // Calculate quality based on target ratio
        const ratio = targetKb / currentSizeKb;
        let quality = Math.max(0.35, Math.min(0.85, ratio));
        if (compressionMode === 'strong') quality = Math.min(quality, 0.55);
        if (compressionMode === 'light') quality = Math.max(quality, 0.75);

        for (let i = 1; i <= totalPages; i++) {
          setProgressMsg(`पेज ${i}/${totalPages} कंप्रेस किया जा रहा है...`);
          const canvas = await renderPdfPageToCanvas(fileBuffer, i, 1.3);

          const jpegBlob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, 'image/jpeg', quality)
          );

          if (jpegBlob) {
            const jpegBuffer = await jpegBlob.arrayBuffer();
            const embeddedImage = await newPdf.embedJpg(jpegBuffer);
            const page = newPdf.addPage([canvas.width, canvas.height]);
            page.drawImage(embeddedImage, {
              x: 0,
              y: 0,
              width: canvas.width,
              height: canvas.height,
            });
          }
        }

        const rasterCompressedBytes = await newPdf.save({ useObjectStreams: true });
        // Use rasterized version if smaller
        if (rasterCompressedBytes.byteLength < compressedBytes.byteLength) {
          compressedBytes = rasterCompressedBytes;
        }
      }

      const finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      const finalSizeKb = Math.round((finalBlob.size / 1024) * 10) / 10;

      if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
      const url = URL.createObjectURL(finalBlob);
      setCompressedPdfUrl(url);
      setCompressedSizeKb(finalSizeKb);
    } catch (err: unknown) {
      console.error('Compress Error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'PDF कंप्रेस करने में समस्या आई। यदि फाइल पासवर्ड प्रोटेक्टेड है तो अनलॉक टूल का उपयोग करें।'
      );
    } finally {
      setIsCompressing(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Tool Header Strip */}
      <div className="bg-gradient-to-r from-rose-700 via-red-700 to-red-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black truncate">
          PDF कंप्रेसर व साइज़ कम करें (PDF Target KB Compressor)
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          पोर्टल लिमिट &lt; 200 KB / 300 KB
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF Compressor"
          errorMessage={errorMessage}
          onRetry={handleCompress}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: 3-Step Configuration */}
        <div className="lg:col-span-6 space-y-3">
          {/* STEP 1: Upload */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider mb-2">
              1. बड़ी PDF फाइल अपलोड करें (Upload PDF)
            </label>
            <label className="flex flex-col items-center justify-center p-4 sm:p-5 border-2 border-dashed border-rose-300 hover:border-rose-500 rounded-xl bg-rose-50/50 hover:bg-rose-50 cursor-pointer transition-colors text-center">
              <Upload className="w-7 h-7 text-rose-600 mb-1.5 animate-bounce" />
              <span className="text-xs sm:text-sm font-bold text-neutral-900">PDF फाइल चुनें</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">मार्कशीट, जाति, निवास या अन्य दस्तावेज</span>
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
            </label>

            {selectedFile && (
              <div className="mt-2.5 flex items-center justify-between text-xs bg-neutral-100 p-2 rounded-lg border border-neutral-200">
                <div className="truncate max-w-[200px]">
                  <span className="font-semibold text-neutral-800 block truncate">{selectedFile.name}</span>
                  {pageCount > 0 && <span className="text-[10px] text-neutral-500">कुल पेज: {pageCount}</span>}
                </div>
                <span className="font-bold text-neutral-600 shrink-0">
                  मूल साइज़: <span className="text-rose-700">{originalSizeKb} KB</span>
                </span>
              </div>
            )}
          </div>

          {/* STEP 2: Target KB & Compression Mode Configuration */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-neutral-200 shadow-xs space-y-4">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. टारगेट साइज़ व कंप्रेशन मोड (Target KB & Level)
            </label>

            {/* Target KB Input Box + Quick Chips */}
            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                टारगेट फाइल साइज़ (Target KB में दर्ज करें):
              </label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="30"
                  max="5000"
                  value={targetKb || ''}
                  onChange={(e) => setTargetKb(Math.max(10, Number(e.target.value)))}
                  placeholder="उदा. 100, 200, 300"
                  className="w-full px-3 py-2 pr-12 text-sm font-black border border-neutral-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden text-neutral-900 bg-white"
                />
                <span className="absolute right-3 text-xs font-black text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                  KB
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-neutral-500 font-semibold self-center">क्विक साइज़:</span>
                {[100, 200, 300, 400, 500].map((kb) => (
                  <button
                    key={kb}
                    type="button"
                    onClick={() => setTargetKb(kb)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      targetKb === kb
                        ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                    }`}
                  >
                    &lt; {kb} KB
                  </button>
                ))}
              </div>
            </div>

            {/* Compression Levels */}
            <div>
              <span className="block text-xs font-bold text-neutral-700 mb-1.5">कंप्रेशन मोड:</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCompressionMode('strong')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    compressionMode === 'strong'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Minimize2 className="w-4 h-4 text-rose-600" />
                  <span className="font-black text-xs">अत्यधिक (Max)</span>
                  <span className="text-[10px] text-neutral-500">&lt; 150 KB</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompressionMode('medium')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    compressionMode === 'medium'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Minimize2 className="w-4 h-4 text-amber-600" />
                  <span className="font-black text-xs">संतुलित</span>
                  <span className="text-[10px] text-neutral-500">200-300 KB</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCompressionMode('light')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    compressionMode === 'light'
                      ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <Minimize2 className="w-4 h-4 text-blue-600" />
                  <span className="font-black text-xs">हल्का</span>
                  <span className="text-[10px] text-neutral-500">बेहतर टेक्स्ट</span>
                </button>
              </div>
            </div>

            {/* STEP 3: EXPLICIT ACTION TRIGGER BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedFile || isCompressing}
                onClick={handleCompress}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                {isCompressing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || 'PDF साइज़ कम हो रहा है...'}</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>PDF साइज़ कम करें (Compress PDF)</span>
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
                  <CheckCircle2 className="w-4 h-4 text-rose-600" />
                  <span>कंप्रेस आउटपुट (Output)</span>
                </h3>
                {compressedSizeKb > 0 && (
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    compressedSizeKb <= targetKb ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    आउटपुट: {compressedSizeKb} KB
                  </span>
                )}
              </div>

              {/* Status Box */}
              <div className="min-h-[220px] bg-neutral-100/80 rounded-xl border border-dashed border-neutral-300 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                {isCompressing && (
                  <div className="absolute inset-0 bg-white/85 backdrop-blur-2xs flex flex-col items-center justify-center z-10 p-4">
                    <RefreshCw className="w-6 h-6 text-rose-600 animate-spin mb-2" />
                    <span className="text-xs font-black text-neutral-800">{progressMsg}</span>
                    <span className="text-[10px] text-neutral-500 mt-1">ब्राउज़र में सुरक्षित लोकल प्रोसेसिंग</span>
                  </div>
                )}

                {compressedPdfUrl ? (
                  <div className="space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
                        ✓ कंप्रेस सफल: {originalSizeKb} KB ➔ {compressedSizeKb} KB
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        फाइल साइज में लगभग {Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))}% की बचत हुई!
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
                    <p className="text-[11px] text-rose-600 font-medium">
                      कंप्रेस करने के लिए बाईं तरफ &quot;PDF साइज़ कम करें&quot; बटन दबाएं
                    </p>
                  </div>
                ) : (
                  <div className="text-neutral-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">कृपया बाईं तरफ से PDF अपलोड करें</p>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      आउटपुट साइज व डाउनलोड लिंक यहाँ दिखेगा
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
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
                  type="button"
                  onClick={handleCompress}
                  disabled={!selectedFile}
                  className="w-full py-3 px-4 rounded-xl bg-neutral-200 text-neutral-500 font-bold text-sm cursor-pointer hover:bg-neutral-300 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedFile ? 'पहले "PDF साइज़ कम करें" बटन दबाएं' : 'कंप्रेस होने के बाद डाउनलोड बटन सक्रिय होगा'}
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
