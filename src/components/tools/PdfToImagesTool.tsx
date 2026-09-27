"use client";

import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, RefreshCw, CheckCircle2, ShieldCheck, Image as ImageIcon } from 'lucide-react';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { renderPdfPageToCanvas, getPdfPageCount } from '../../lib/pdfHelper';
import { getRealFileBytes } from '../../lib/fileHelper';

interface ExtractedPage {
  pageNumber: number;
  dataUrl: string;
  blob: Blob;
  sizeKb: number;
  width: number;
  height: number;
}

export const PdfToImagesTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  // High default scale (2.5 = ~250-300 DPI for crystal clear text)
  const [scale, setScale] = useState<number>(2.5);

  // Processing & Output
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [extractedPages, setExtractedPages] = useState<ExtractedPage[]>([]);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setExtractedPages([]);
    setErrorMessage(null);

    await getRealFileBytes(file);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setTotalPages(count);
    } catch {
      setTotalPages(1);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setTotalPages(0);
    setExtractedPages([]);
    setErrorMessage(null);
  };

  const getExtension = () => {
    if (format === 'image/jpeg') return 'jpg';
    if (format === 'image/png') return 'png';
    return 'webp';
  };

  // Convert PDF Pages to Crisp High-Res Images
  const handleExtractPages = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फाइल चुनें।');
      return;
    }

    setIsExtracting(true);
    setProgressMsg('PDF लोड हो रहा है...');
    setErrorMessage(null);
    setExtractedPages([]);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const count = totalPages || (await getPdfPageCount(buffer));
      setTotalPages(count);

      const results: ExtractedPage[] = [];

      for (let p = 1; p <= count; p++) {
        setProgressMsg(`पेज ${p} / ${count} को हाई-क्वालिटी इमेज में बदला जा रहा है...`);
        // Render canvas at high DPI
        const canvas = await renderPdfPageToCanvas(buffer, p, scale);

        const quality = format === 'image/png' ? undefined : 0.98; // Highest crystal clear quality
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, format, quality)
        );

        if (blob) {
          const dataUrl = canvas.toDataURL(format, quality);
          results.push({
            pageNumber: p,
            dataUrl,
            blob,
            sizeKb: Math.round((blob.size / 1024) * 10) / 10,
            width: canvas.width,
            height: canvas.height,
          });
        }
      }

      setExtractedPages(results);
    } catch (err: unknown) {
      console.error('Extract error:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'PDF से फोटो निकालने में समस्या आई। यदि फाइल पासवर्ड प्रोटेक्टेड है तो अनलॉक टूल का उपयोग करें।'
      );
    } finally {
      setIsExtracting(false);
      setProgressMsg('');
    }
  };

  // 1-Click Download All as ZIP
  const handleDownloadZip = async () => {
    if (extractedPages.length === 0) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      const baseName = selectedFile ? selectedFile.name.replace(/\.pdf$/i, '') : 'document';
      const ext = getExtension();

      extractedPages.forEach((page) => {
        zip.file(`${baseName}_page_${page.pageNumber}.${ext}`, page.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${baseName}_all_pages_300dpi.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('ZIP Error:', err);
      setErrorMessage('ZIP फाइल बनाने में समस्या आई।');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4" />
          <span>PDF to Images Converter • 300 DPI Ultra HD (PDF से फोटो निकालें)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          300 DPI क्रिस्टल क्लियर
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF to Images Converter"
          errorMessage={errorMessage}
          onRetry={handleExtractPages}
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

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. एक्सपोर्ट क्वालिटी व फॉर्मेट (HD Quality Settings)
            </label>

            {/* Quality Selector */}
            <div>
              <span className="text-xs font-bold text-neutral-700 block mb-1.5">
                इमेज रिज़ॉल्यूशन व क्वालिटी (DPI Quality):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '300 DPI (Ultra HD)', desc: 'क्रिस्टल क्लियर टेक्स्ट', val: 2.8 },
                  { label: '200 DPI (High)', desc: 'प्रिंटिंग व फॉर्म रेडी', val: 2.0 },
                  { label: '150 DPI (Fast)', desc: 'हल्की फाइल साइज़', val: 1.5 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setScale(item.val)}
                    className={`p-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      scale === item.val
                        ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-1 ring-purple-600'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-black">{item.label}</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format choice */}
            <div>
              <span className="text-xs font-bold text-neutral-700 block mb-1.5">
                आउटपुट इमेज फॉर्मेट:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'image/jpeg', name: 'JPG / JPEG (अनुशंसित)' },
                  { id: 'image/png', name: 'PNG (Lossless ओरिजिनल)' },
                  { id: 'image/webp', name: 'WEBP (सुपर कंप्रेस्ड)' },
                ] as const).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setFormat(fmt.id)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer text-center ${
                      format === fmt.id
                        ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {fmt.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Convert Button */}
            <button
              type="button"
              onClick={handleExtractPages}
              disabled={!selectedFile || isExtracting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'इमेज बनाई जा रही हैं...'}</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>PDF से हाई-क्वालिटी फोटो निकालें ({scale === 2.8 ? '300 DPI Ultra HD' : `${scale * 100} DPI`})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output Previews & Download All */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {extractedPages.length > 0 ? (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{extractedPages.length} पृष्ठ सफलतापूर्वक निकाले गए (High DPI)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="py-1.5 px-3 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-black flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isZipping ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>सभी ZIP में डाउनलोड करें</span>
                  </button>
                </div>

                {/* Grid of rendered pages */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                  {extractedPages.map((page) => (
                    <div
                      key={page.pageNumber}
                      className="bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs space-y-1.5 flex flex-col items-center"
                    >
                      <div className="w-full flex items-center justify-between text-[11px] font-bold text-neutral-600">
                        <span>पृष्ठ {page.pageNumber}</span>
                        <span className="text-purple-700 font-black">{page.sizeKb} KB</span>
                      </div>

                      <div className="w-full h-36 bg-neutral-100 rounded-md overflow-hidden flex items-center justify-center border border-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={page.dataUrl}
                          alt={`Page ${page.pageNumber}`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <a
                        href={page.dataUrl}
                        download={`${selectedFile?.name.replace(/\.pdf$/i, '') || 'page'}_${page.pageNumber}.${getExtension()}`}
                        className="w-full py-1 text-center bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-md text-[11px] font-black flex items-center justify-center gap-1 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        <span>पेज {page.pageNumber} डाउनलोड</span>
                      </a>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <ImageIcon className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  PDF अपलोड करें और &apos;PDF से हाई-क्वालिटी फोटो निकालें&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  सभी पृष्ठ 300 DPI क्रिस्टल क्लियर रेज़ोल्यूशन में तैयार होंगे
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
