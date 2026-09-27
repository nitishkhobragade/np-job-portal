"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, Copy, Check, FileType, Sparkles } from 'lucide-react';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { loadPdfJs, renderPdfPageToCanvas } from '../../lib/pdfHelper';
import { getRealFileBytes } from '../../lib/fileHelper';

export const OcrWordTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);

    setSelectedFile(file);
    setExtractedText('');
    setDocxBlob(null);
    setErrorMessage(null);

    await getRealFileBytes(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileRemove = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setExtractedText('');
    setDocxBlob(null);
    setErrorMessage(null);
  };

  const handleRunOcr = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF या इमेज फ़ाइल चुनें।');
      return;
    }

    setIsProcessing(true);
    setProgressMsg('फ़ाइल प्रोसेस की जा रही है...');
    setErrorMessage(null);
    setExtractedText('');
    setDocxBlob(null);

    try {
      let base64Data = '';
      let mimeType = selectedFile.type;

      if (selectedFile.type === 'application/pdf' || selectedFile.name.endsWith('.pdf')) {
        setProgressMsg('PDF पेज को हाई-डेफिनिशन स्कैन में तैयार किया जा रहा है...');
        const buffer = await selectedFile.arrayBuffer();
        
        // First try client-side direct text stream
        const pdfjs = await loadPdfJs();
        let directText = '';
        if (pdfjs) {
          try {
            const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
            const pdfDoc = await loadingTask.promise;
            for (let i = 1; i <= Math.min(pdfDoc.numPages, 5); i++) {
              const page = await pdfDoc.getPage(i);
              const tc = await page.getTextContent();
              const pageText = tc.items
                .map((it) => ('str' in it ? (it.str as string) : ''))
                .join(' ');
              if (pageText.trim().length > 30) {
                directText += `--- पृष्ठ ${i} ---\n` + pageText + '\n\n';
              }
            }
          } catch (e) {
            console.warn('Direct text extract fallback:', e);
          }
        }

        if (directText.trim().length > 50) {
          await finalizeExtractedText(directText);
          setIsProcessing(false);
          return;
        }

        // Otherwise rasterize first page to image for OCR
        const canvas = await renderPdfPageToCanvas(buffer, 1, 2.0);
        base64Data = canvas.toDataURL('image/jpeg', 0.9);
        mimeType = 'image/jpeg';
      } else {
        // Image file
        const buffer = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        base64Data = `data:${selectedFile.type};base64,` + btoa(binary);
      }

      setProgressMsg('OCR द्वारा हिंदी व अंग्रेज़ी टेक्स्ट पहचाना जा रहा है...');

      // Call OCR endpoint
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: mimeType || 'image/jpeg',
          prompt: 'Extract all text from this scanned document/marksheet accurately in Hindi and English with proper headings, tables, roll numbers and dates.',
        }),
      });

      if (!res.ok) {
        throw new Error('OCR सर्वर रिस्पॉन्स में त्रुटि आई। कृपया पुनः प्रयास करें।');
      }

      const data = await res.json();
      if (!data.text) {
        throw new Error('दस्तावेज़ से कोई टेक्स्ट नहीं मिल सका। कृपया साफ़ दस्तावेज़ चुनें।');
      }

      await finalizeExtractedText(data.text);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'OCR प्रोसेस करने में समस्या आई।'
      );
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const finalizeExtractedText = async (text: string) => {
    setExtractedText(text);

    // Build Word .docx file
    const paragraphs: Paragraph[] = [
      new Paragraph({
        text: 'OCR Extracted Document / टेक्स्ट दस्तावेज़',
        heading: HeadingLevel.TITLE,
        spacing: { after: 250 },
      }),
    ];

    const lines = text.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            spacing: { after: 120 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    setDocxBlob(blob);
  };

  const handleDownloadDocx = () => {
    if (!docxBlob) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = selectedFile ? selectedFile.name.replace(/\.[a-zA-Z0-9]+$/i, '') : 'ocr_document';
    a.download = `${baseName}_ocr_word.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = selectedFile ? selectedFile.name.replace(/\.[a-zA-Z0-9]+$/i, '') : 'ocr_document';
    a.download = `${baseName}_ocr.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>PDF / Image to OCR Word Converter (टेक्स्ट पहचानें व Word में बदलें)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          हिंदी + अंग्रेज़ी OCR
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="OCR to Word Converter"
          errorMessage={errorMessage}
          onRetry={handleRunOcr}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. स्कैन PDF अथवा इमेज फ़ाइल चुनें (Upload Document / Marksheet)"
            subLabel="PDF, JPG, PNG, WEBP स्कैन समर्थित"
            accept="image/*,.pdf,application/pdf"
            selectedFile={selectedFile}
            filePreviewUrl={filePreviewUrl}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType={selectedFile?.type.includes('pdf') ? 'pdf' : 'image'}
          />

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. OCR भाषा व सेटिंग्स
            </label>

            <p className="text-[11px] text-neutral-600">
              यह टूल मार्कशीट, सर्टिफिकेट, एडमिट कार्ड या नोटिस फोटो से सारा टेक्स्ट पहचानकर उसे <strong>एडिटेबल Word (.docx)</strong> व टेक्स्ट में बदल देता है।
            </p>

            <div className="p-2.5 bg-violet-50 border border-violet-200 rounded-lg text-xs font-bold text-violet-900 flex items-center justify-between">
              <span>पहचानी जाने वाली भाषाएं:</span>
              <span className="bg-violet-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                हिंदी + English (द्विभाषी)
              </span>
            </div>

            <button
              type="button"
              onClick={handleRunOcr}
              disabled={!selectedFile || isProcessing}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'OCR टेक्स्ट पहचाना जा रहा है...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>टेक्स्ट पहचानें व Word बनाएं (Run OCR Now)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Text Preview & Word Download */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {extractedText ? (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>OCR टेक्स्ट सफलतापूर्वक निकाला गया!</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'कॉपी हुआ!' : 'कॉपी करें'}</span>
                  </button>
                </div>

                {/* Editable Text Area */}
                <textarea
                  value={extractedText}
                  onChange={(e) => finalizeExtractedText(e.target.value)}
                  rows={8}
                  className="w-full p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono text-neutral-800 leading-relaxed focus:bg-white focus:ring-2 focus:ring-violet-500 focus:outline-hidden"
                  placeholder="निकाला गया टेक्स्ट..."
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadDocx}
                    className="py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Word (.docx) डाउनलोड</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTxt}
                    className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>टेक्स्ट (.txt) डाउनलोड</span>
                  </button>
                </div>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <FileType className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर स्कैन फ़ाइल अपलोड करें और &apos;टेक्स्ट पहचानें व Word बनाएं&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  स्कैन की गई मार्कशीट या फोटो से टेक्स्ट पहचानकर एडिटेबल वर्ड डॉक्यूमेंट मिलेगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
