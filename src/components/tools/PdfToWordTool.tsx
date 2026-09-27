"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, Copy, Check, FileType } from 'lucide-react';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { loadPdfJs, getPdfPageCount } from '../../lib/pdfHelper';
import { getRealFileBytes } from '../../lib/fileHelper';

export const PdfToWordTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [extractedPages, setExtractedPages] = useState<{ page: number; text: string }[]>([]);
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [docxSizeKb, setDocxSizeKb] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setExtractedPages([]);
    setDocxBlob(null);
    setDocxSizeKb(0);
    setErrorMessage(null);

    await getRealFileBytes(file);

    try {
      const buffer = await file.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setPageCount(count);
    } catch {
      setPageCount(1);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    setPageCount(0);
    setExtractedPages([]);
    setDocxBlob(null);
    setDocxSizeKb(0);
    setErrorMessage(null);
  };

  const handleConvertToWord = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले PDF फ़ाइल चुनें।');
      return;
    }

    setIsConverting(true);
    setProgressMsg('PDF लोड हो रहा है...');
    setErrorMessage(null);
    setExtractedPages([]);
    setDocxBlob(null);

    try {
      const pdfjs = await loadPdfJs();
      if (!pdfjs) throw new Error('PDF प्रोसेसिंग इंजन लोड नहीं हो सका।');

      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDoc = await loadingTask.promise;
      const numPages = pdfDoc.numPages;

      const pageTexts: { page: number; text: string }[] = [];
      const docxChildren: Paragraph[] = [];

      // Document title header in Word
      docxChildren.push(
        new Paragraph({
          text: selectedFile.name.replace(/\.pdf$/i, ''),
          heading: HeadingLevel.TITLE,
          spacing: { after: 300 },
        })
      );

      for (let i = 1; i <= numPages; i++) {
        setProgressMsg(`पेज ${i}/${numPages} से टेक्स्ट व फॉर्मेट निकाला जा रहा है...`);
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();

        // Group text items by roughly identical Y-position to form proper lines & paragraphs
        const items = textContent.items as Array<{ str: string; transform: number[]; height: number }>;
        
        // Sort items: top-to-bottom (Y desc), then left-to-right (X asc)
        items.sort((a, b) => {
          const yA = a.transform[5];
          const yB = b.transform[5];
          if (Math.abs(yA - yB) > 5) {
            return yB - yA;
          }
          return a.transform[4] - b.transform[4];
        });

        const lines: string[] = [];
        let currentLine = '';
        let lastY: number | null = null;

        for (const item of items) {
          const y = item.transform[5];
          if (lastY !== null && Math.abs(y - lastY) > 6) {
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            currentLine = item.str;
          } else {
            currentLine += (currentLine ? ' ' : '') + item.str;
          }
          lastY = y;
        }
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }

        const pageJoinedText = lines.join('\n');
        pageTexts.push({ page: i, text: pageJoinedText || '(इस पेज पर कोई टेक्स्ट लेयर नहीं मिली - यह स्कैन फोटो हो सकती है)' });

        // Add to Word Document
        docxChildren.push(
          new Paragraph({
            text: `--- पृष्ठ ${i} / Page ${i} ---`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );

        if (lines.length > 0) {
          for (const line of lines) {
            docxChildren.push(
              new Paragraph({
                children: [new TextRun({ text: line, size: 24 })], // 12pt
                spacing: { after: 120 },
              })
            );
          }
        } else {
          docxChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: '[स्कैन की गई छवि / Scanned Image Content. कृपया OCR टूल का प्रयोग करें]',
                  italics: true,
                }),
              ],
            })
          );
        }
      }

      // Generate the genuine .docx file
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: docxChildren,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      setDocxBlob(blob);
      setDocxSizeKb(Math.round((blob.size / 1024) * 10) / 10);
      setExtractedPages(pageTexts);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'PDF से Word बनाने में विफलता आई।'
      );
    } finally {
      setIsConverting(false);
      setProgressMsg('');
    }
  };

  const handleDownloadDocx = () => {
    if (!docxBlob) return;
    const url = URL.createObjectURL(docxBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = selectedFile ? selectedFile.name.replace(/\.pdf$/i, '') : 'document';
    a.download = `${baseName}_converted.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAllText = () => {
    const fullText = extractedPages.map((p) => `--- पृष्ठ ${p.page} ---\n${p.text}`).join('\n\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <FileType className="w-4 h-4" />
          <span>PDF to Word Converter (.docx) • एडिटेबल वर्ड फाइल</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          Microsoft Word (.docx) कम्पेटीबल
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="PDF to Word Converter"
          errorMessage={errorMessage}
          onRetry={handleConvertToWord}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Trigger */}
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
              2. Word कनवर्टर सेटिंग्स (Options)
            </label>

            <p className="text-[11px] text-neutral-600">
              यह टूल आपकी PDF के सभी पेजों से टेक्स्ट, पैराग्राफ, हेडिंग और संरचना निकालता है और वास्तविक <strong>Microsoft Word (.docx)</strong> दस्तावेज़ बनाता है।
            </p>

            {pageCount > 0 && (
              <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-bold text-blue-900 flex items-center justify-between">
                <span>कुल पृष्ठ (Total Pages):</span>
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                  {pageCount} पृष्ठ
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConvertToWord}
              disabled={!selectedFile || isConverting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'Word में कनवर्ट किया जा रहा है...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>PDF से Word (.docx) बनाएं (Convert Now)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output & Text Preview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {docxBlob ? (
              <div className="w-full space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Word फाइल (.docx) तैयार है!</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAllText}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'कॉपी हुआ!' : 'टेक्स्ट कॉपी करें'}</span>
                  </button>
                </div>

                {/* Extracted text scrollable preview */}
                <div className="max-h-56 overflow-y-auto p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-xs font-mono text-neutral-800 space-y-2 whitespace-pre-wrap select-text">
                  {extractedPages.map((p) => (
                    <div key={p.page} className="pb-2 border-b border-neutral-200 last:border-b-0">
                      <div className="text-[10px] font-bold text-blue-700 uppercase mb-1">
                        📄 पृष्ठ {p.page} / {extractedPages.length}:
                      </div>
                      <div className="leading-relaxed">{p.text}</div>
                    </div>
                  ))}
                </div>

                {/* Download Word Document Button */}
                <button
                  type="button"
                  onClick={handleDownloadDocx}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Word फाइल डाउनलोड करें ({docxSizeKb} KB .docx)</span>
                </button>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <FileType className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर PDF अपलोड करें और &apos;PDF से Word बनाएं&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  Word डॉक्यूमेंट Microsoft Word, Google Docs व WPS Office में सीधे खुलेगा
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
