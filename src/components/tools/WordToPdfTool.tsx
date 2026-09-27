"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, FileType } from 'lucide-react';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';

export const WordToPdfTool: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfSizeKb, setPdfSizeKb] = useState<number>(0);
  const [extractedParagraphCount, setExtractedParagraphCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setSelectedFile(file);
    setPdfBlobUrl(null);
    setPdfSizeKb(0);
    setExtractedParagraphCount(0);
    setErrorMessage(null);
  };

  const handleFileRemove = () => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setSelectedFile(null);
    setPdfBlobUrl(null);
    setPdfSizeKb(0);
    setExtractedParagraphCount(0);
    setErrorMessage(null);
  };

  const parseDocxText = async (arrayBuffer: ArrayBuffer): Promise<string[]> => {
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (!docXml) {
      throw new Error('Word फ़ाइल में document.xml नहीं मिला। कृपया मान्य .docx फ़ाइल चुनें।');
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');

    const result: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName('w:t');
      let pText = '';
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || '';
      }
      if (pText.trim()) {
        result.push(pText.trim());
      }
    }

    return result.length > 0 ? result : ['(खाली दस्तावेज़)'];
  };

  const handleConvertToPdf = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले Word (.docx) फ़ाइल चुनें।');
      return;
    }

    setIsConverting(true);
    setProgressMsg('Word फ़ाइल पढ़ी जा रही है...');
    setErrorMessage(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const paragraphs = await parseDocxText(arrayBuffer);
      setExtractedParagraphCount(paragraphs.length);

      setProgressMsg('A4 PDF दस्तावेज़ बनाया जा रहा है...');

      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

      // A4 dimensions: 595.28 x 841.89 points
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const printableWidth = pageWidth - margin * 2;
      const fontSize = 11;
      const lineHeight = fontSize * 1.4;

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw header with file title
      const title = selectedFile.name.replace(/\.docx?$/i, '');
      currentPage.drawText(title, {
        x: margin,
        y: currentY,
        size: 16,
        font: timesBoldFont,
        color: rgb(0.1, 0.1, 0.2),
      });
      currentY -= 25;

      // Draw divider line
      currentPage.drawLine({
        start: { x: margin, y: currentY },
        end: { x: pageWidth - margin, y: currentY },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      currentY -= 20;

      // Word wrapping helper
      const wrapText = (text: string, maxWidth: number, font: typeof timesRomanFont, fSize: number) => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let curLine = '';

        for (const w of words) {
          const testLine = curLine ? `${curLine} ${w}` : w;
          const wWidth = font.widthOfTextAtSize(testLine, fSize);
          if (wWidth <= maxWidth) {
            curLine = testLine;
          } else {
            if (curLine) lines.push(curLine);
            curLine = w;
          }
        }
        if (curLine) lines.push(curLine);
        return lines;
      };

      for (const p of paragraphs) {
        const wrappedLines = wrapText(p, printableWidth, timesRomanFont, fontSize);

        for (const line of wrappedLines) {
          if (currentY - lineHeight < margin + 30) {
            // New Page needed
            currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
            currentY = pageHeight - margin;
          }

          currentPage.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: timesRomanFont,
            color: rgb(0.15, 0.15, 0.15),
          });
          currentY -= lineHeight;
        }

        // Paragraph gap
        currentY -= 6;
      }

      // Add page numbers at bottom
      const totalPages = pdfDoc.getPageCount();
      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPage(i);
        page.drawText(`Page ${i + 1} of ${totalPages}`, {
          x: pageWidth / 2 - 30,
          y: margin - 20,
          size: 9,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(url);
      setPdfSizeKb(Math.round((blob.size / 1024) * 10) / 10);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Word से PDF बनाने में समस्या आई।'
      );
    } finally {
      setIsConverting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-rose-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span>Word to PDF Converter (.docx से PDF)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          A4 रेडी • सरकारी फॉर्म पोर्टल अपलोड
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Word to PDF Converter"
          errorMessage={errorMessage}
          onRetry={handleConvertToPdf}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-6 space-y-3">
          <ToolUploadBox
            label="1. अपनी Word फ़ाइल चुनें (.docx)"
            subLabel="Microsoft Word (.docx) समर्थित"
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onFileRemove={handleFileRemove}
            fileType="word"
          />

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              2. PDF लेआउट व सेटिंग्स
            </label>

            <p className="text-[11px] text-neutral-600">
              यह टूल Word डॉक्यूमेंट को मानक <strong>A4 पोर्ट्रेट PDF</strong> में रूपांतरित करता है जिसे किसी भी सरकारी नौकरी पोर्टल पर बिना किसी एरर के अपलोड किया जा सकता है।
            </p>

            {extractedParagraphCount > 0 && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-900 flex items-center justify-between">
                <span>पहचाने गए पैराग्राफ:</span>
                <span className="bg-rose-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                  {extractedParagraphCount} पैराग्राफ
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleConvertToPdf}
              disabled={!selectedFile || isConverting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs sm:text-sm font-black shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'PDF में कनवर्ट किया जा रहा है...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Word से PDF बनाएं (Convert to PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: PDF Download & Preview */}
        <div className="lg:col-span-6 space-y-3">
          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs flex flex-col justify-center min-h-[340px]">
            {pdfBlobUrl ? (
              <div className="w-full space-y-3 text-center">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full text-xs font-black border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PDF सफलतापूर्वक तैयार हो गई!</span>
                </div>

                <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-2">
                  <div className="text-xs font-black text-neutral-800">
                    {selectedFile?.name.replace(/\.docx?$/i, '.pdf')}
                  </div>
                  <div className="text-xs font-bold text-red-700">
                    PDF साइज़: {pdfSizeKb} KB
                  </div>
                </div>

                <a
                  href={pdfBlobUrl}
                  download={selectedFile ? selectedFile.name.replace(/\.docx?$/i, '.pdf') : 'document.pdf'}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>PDF डाउनलोड करें ({pdfSizeKb} KB)</span>
                </a>

                <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400 space-y-2">
                <FileType className="w-12 h-12 mx-auto text-neutral-300 stroke-[1.5]" />
                <p className="text-xs font-bold text-neutral-600">
                  बाईं ओर Word फ़ाइल अपलोड करें और &apos;Word से PDF बनाएं&apos; पर क्लिक करें
                </p>
                <p className="text-[10px] text-neutral-400">
                  मानक A4 प्रिंट-रेडी PDF 100% आपके डिवाइस में तैयार होगी
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
