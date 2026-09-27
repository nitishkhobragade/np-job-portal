"use client";

import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Download, RefreshCw, FileText, CheckCircle2, Minimize2, ShieldCheck } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas, getPdfPageCount } from '../../lib/pdfHelper';
import { formatFileSize, getRealFileBytes } from '../../lib/fileHelper';

export const PdfCompressTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalSizeBytes, setOriginalSizeBytes] = useState<number>(0);
  const [pageCount, setPageCount] = useState<number>(0);

  const [targetKb, setTargetKb] = useState<number | ''>(200);
  const [compressionMode, setCompressionMode] = useState<'strong' | 'medium' | 'light'>('medium');

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [compressedSizeBytes, setCompressedSizeBytes] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);

    setSelectedFile(file);
    setCompressedPdfUrl(null);
    setCompressedSizeBytes(0);
    setErrorMessage(null);

    const bytes = await getRealFileBytes(file);
    setOriginalSizeBytes(bytes);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setPageCount(count);
    } catch {
      setPageCount(1);
    }
  };

  const handleFileRemove = () => {
    if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
    setSelectedFile(null);
    setOriginalSizeBytes(0);
    setPageCount(0);
    setCompressedPdfUrl(null);
    setCompressedSizeBytes(0);
    setErrorMessage(null);
  };

  // EXPLICIT ACTION TRIGGER: Target KB iterative compressor
  const handleCompress = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फाइल चुनें।');
      return;
    }

    setIsCompressing(true);
    setProgressMsg('PDF संरचना का विश्लेषण किया जा रहा है...');
    setErrorMessage(null);

    try {
      const fileBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

      // Clean metadata to shed unnecessary bytes
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setCreator('');

      const effectiveTargetKb = typeof targetKb === 'number' && targetKb > 0 ? targetKb : 200;
      const hardCeilingBytes = Math.floor(effectiveTargetKb * 1024);

      let compressedBytes = await pdfDoc.save({ useObjectStreams: true });

      // If current size exceeds hardCeilingBytes, rasterize and optimize scanned/image pages
      if (compressedBytes.byteLength > hardCeilingBytes) {
        setProgressMsg('पेजों का आकार अनुकूलित किया जा रहा है...');

        const totalPages = await getPdfPageCount(fileBuffer);
        const configs = [
          { scale: 1.3, quality: 0.65 },
          { scale: 1.1, quality: 0.48 },
          { scale: 0.95, quality: 0.38 },
          { scale: 0.8, quality: 0.28 },
          { scale: 0.65, quality: 0.18 },
        ];

        if (compressionMode === 'strong') {
          configs.shift();
        } else if (compressionMode === 'light') {
          configs.unshift({ scale: 1.5, quality: 0.78 });
        }

        let bestRasterBytes: Uint8Array | null = null;

        for (let attempt = 0; attempt < configs.length; attempt++) {
          const cfg = configs[attempt];
          const newPdf = await PDFDocument.create();

          for (let i = 1; i <= totalPages; i++) {
            setProgressMsg(`पेज ${i}/${totalPages} अनुकूलित हो रहा है (पास ${attempt + 1})...`);
            const canvas = await renderPdfPageToCanvas(fileBuffer, i, cfg.scale);

            const jpegBlob: Blob | null = await new Promise((resolve) =>
              canvas.toBlob(resolve, 'image/jpeg', cfg.quality)
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

          const rasterAttemptBytes = await newPdf.save({ useObjectStreams: true });
          bestRasterBytes = rasterAttemptBytes;

          // If this pass fits strictly under hardCeilingBytes, break successfully
          if (rasterAttemptBytes.byteLength <= hardCeilingBytes) {
            break;
          }
        }

        if (bestRasterBytes && (bestRasterBytes.byteLength < compressedBytes.byteLength || compressedBytes.byteLength > hardCeilingBytes)) {
          compressedBytes = bestRasterBytes;
        }
      }

      const finalBlob = new Blob([compressedBytes], { type: 'application/pdf' });
      if (compressedPdfUrl) URL.revokeObjectURL(compressedPdfUrl);
      const url = URL.createObjectURL(finalBlob);
      setCompressedPdfUrl(url);
      setCompressedSizeBytes(finalBlob.size);
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
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. अपनी PDF फ़ाइल चुनें (Select PDF)"
            subLabel="PDF फ़ाइलें (.pdf) समर्थित हैं"
            accept=".pdf,application/pdf"
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="pdf"
          />

          {/* STEP 2: Target Size Input & Quick Chips */}
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. लक्षित फाइल साइज़ दर्ज करें (Target KB)
            </label>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-neutral-600">आवश्यक साइज़ (अपनी पसंद का Size KB में डालें):</span>
                <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                  {targetKb !== '' ? `< ${targetKb} KB` : 'साइज़ दर्ज करें'}
                </span>
              </div>
              <input
                type="number"
                min={20}
                max={5000}
                value={targetKb}
                placeholder="उदा. 200"
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === '') {
                    setTargetKb('');
                  } else {
                    const n = parseInt(v, 10);
                    setTargetKb(isNaN(n) ? '' : n);
                  }
                }}
                className="w-full px-3 py-1.5 text-xs font-bold bg-neutral-50 border border-neutral-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Quick KB Chips */}
            <div className="flex flex-wrap gap-1.5">
              {[100, 150, 200, 300, 400, 500].map((kb) => (
                <button
                  key={kb}
                  type="button"
                  onClick={() => setTargetKb(kb)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                    targetKb === kb
                      ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                      : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border-neutral-300'
                  }`}
                >
                  {kb} KB
                </button>
              ))}
            </div>

            {/* Mode Selector */}
            <div className="pt-2 border-t border-neutral-200">
              <span className="text-[11px] font-bold text-neutral-600 block mb-1">कंप्रेशन स्तर (Level):</span>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'light', label: 'हल्का (Light)', desc: 'अधिकतम स्पष्टता' },
                  { id: 'medium', label: 'संतुलित (Medium)', desc: 'अनुशंसित स्तर' },
                  { id: 'strong', label: 'तीव्र (Strong)', desc: 'अत्यधिक छोटा साइज़' },
                ] as const).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCompressionMode(mode.id)}
                    className={`p-2 rounded-xl text-left border transition-colors cursor-pointer ${
                      compressionMode === mode.id
                        ? 'border-rose-600 bg-rose-50 text-rose-950 font-bold ring-1 ring-rose-600'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-black">{mode.label}</div>
                    <div className="text-[9px] text-neutral-500 mt-0.5">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Trigger Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCompress}
                disabled={!selectedFile || isCompressing}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-800 hover:to-red-900 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
              >
                {isCompressing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{progressMsg || 'कंप्रेशन हो रहा है...'}</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    <span>3. PDF साइज़ कम करें (Compress Now)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Output & Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {compressedPdfUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PDF सफलतापूर्वक कंप्रेस हुई!</span>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2 max-w-sm mx-auto">
                  <FileText className="w-10 h-10 text-rose-600 mx-auto" />
                  <div className="text-xs font-black text-neutral-800 truncate">
                    {selectedFile?.name}
                  </div>
                  <div className="text-[11px] text-neutral-500 font-bold">
                    कुल पृष्ठ: {pageCount} पृष्ठ
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-xs bg-neutral-50 p-2 rounded-xl border border-neutral-200 font-bold">
                  <span className="text-neutral-500">
                    मूल: <strong className="text-neutral-700">{formatFileSize(originalSizeBytes)}</strong>
                  </span>
                  <span className="text-emerald-600">➔</span>
                  <span className="text-emerald-700">
                    नया साइज़: <strong className="text-emerald-800">{formatFileSize(compressedSizeBytes)}</strong>
                  </span>
                </div>

                <a
                  href={compressedPdfUrl}
                  download={`compressed_${selectedFile?.name || 'document.pdf'}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>कंप्रेस्ड PDF डाउनलोड करें ({formatFileSize(compressedSizeBytes)})</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर PDF अपलोड करें, Target KB चुनें और कंप्रेस करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  सरकारी फॉर्म अपलोड की 200KB लिमिट में आसानी से तैयार होगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
