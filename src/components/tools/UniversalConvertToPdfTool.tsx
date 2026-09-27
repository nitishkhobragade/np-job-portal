"use client";

import React, { useState } from 'react';
import { Download, RefreshCw, FileText, CheckCircle2, ShieldCheck, Settings2 } from 'lucide-react';
import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { ToolUploadBox } from './ToolUploadBox';
import { ToolErrorBanner } from './ToolErrorBanner';
import { getRealFileBytes } from '../../lib/fileHelper';

export type InputFormatCategory =
  | 'jpg'
  | 'png'
  | 'webp'
  | 'svg'
  | 'bmp'
  | 'heic'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt';

interface FormatOption {
  value: InputFormatCategory;
  label: string;
  group: 'Images' | 'Documents';
  mimeOrExt: string;
  accept: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  // Images
  { value: 'jpg', label: 'JPG / JPEG to PDF', group: 'Images', mimeOrExt: '.jpg, .jpeg', accept: '.jpg,.jpeg,image/jpeg' },
  { value: 'png', label: 'PNG to PDF', group: 'Images', mimeOrExt: '.png', accept: '.png,image/png' },
  { value: 'webp', label: 'WEBP to PDF', group: 'Images', mimeOrExt: '.webp', accept: '.webp,image/webp' },
  { value: 'svg', label: 'SVG to PDF', group: 'Images', mimeOrExt: '.svg', accept: '.svg,image/svg+xml' },
  { value: 'bmp', label: 'BMP / TIFF to PDF', group: 'Images', mimeOrExt: '.bmp, .tiff', accept: '.bmp,.tiff,image/bmp,image/tiff' },
  { value: 'heic', label: 'HEIC / HEIF to PDF', group: 'Images', mimeOrExt: '.heic, .heif', accept: '.heic,.heif' },
  // Documents
  { value: 'docx', label: 'Word (.docx, .doc) to PDF', group: 'Documents', mimeOrExt: '.docx, .doc', accept: '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword' },
  { value: 'xlsx', label: 'Excel (.xlsx, .xls) to PDF', group: 'Documents', mimeOrExt: '.xlsx, .xls', accept: '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  { value: 'pptx', label: 'PowerPoint (.pptx, .ppt) to PDF', group: 'Documents', mimeOrExt: '.pptx, .ppt', accept: '.pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { value: 'txt', label: 'Text / RTF / Markdown (.txt, .rtf, .md) to PDF', group: 'Documents', mimeOrExt: '.txt, .rtf, .md', accept: '.txt,.rtf,.md,text/plain' },
];

export const UniversalConvertToPdfTool: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<InputFormatCategory>('jpg');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'legal'>('a4');
  const [marginSize, setMarginSize] = useState<'none' | 'normal' | 'wide'>('normal');

  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfSizeKb, setPdfSizeKb] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentOption = FORMAT_OPTIONS.find((f) => f.value === selectedFormat) || FORMAT_OPTIONS[0];

  const handleFormatChange = (newFormat: InputFormatCategory) => {
    setSelectedFormat(newFormat);
    // Clear previously selected file if format changes
    if (selectedFile) {
      handleFileRemove();
    }
  };

  const handleFileSelect = async (file: File) => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setSelectedFile(file);
    setPdfBlobUrl(null);
    setPdfSizeKb(0);
    setTotalPages(0);
    setErrorMessage(null);
    await getRealFileBytes(file);
  };

  const handleFileRemove = () => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setSelectedFile(null);
    setPdfBlobUrl(null);
    setPdfSizeKb(0);
    setTotalPages(0);
    setErrorMessage(null);
  };

  // Convert Image to Canvas DataUrl
  const fileToCanvasDataUrl = (file: File): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }
          // White background for transparent PNG / SVG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve({
            dataUrl: canvas.toDataURL('image/jpeg', 0.92),
            width: img.width,
            height: img.height,
          });
        };
        img.onerror = () => reject(new Error('छवि लोड करने में विफलता।'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('फ़ाइल पढ़ने में त्रुटि।'));
      reader.readAsDataURL(file);
    });
  };

  // Extract DOCX Text
  const extractDocxParagraphs = async (buffer: ArrayBuffer): Promise<string[]> => {
    const zip = await JSZip.loadAsync(buffer);
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (!docXml) throw new Error('मान्य .docx फ़ाइल नहीं है।');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, 'application/xml');
    const paragraphs = xmlDoc.getElementsByTagName('w:p');
    const lines: string[] = [];
    for (let i = 0; i < paragraphs.length; i++) {
      const textNodes = paragraphs[i].getElementsByTagName('w:t');
      let str = '';
      for (let j = 0; j < textNodes.length; j++) {
        str += textNodes[j].textContent || '';
      }
      if (str.trim()) lines.push(str.trim());
    }
    return lines.length > 0 ? lines : ['(रिक्त दस्तावेज़ / Empty Document)'];
  };

  // Extract XLSX Text
  const extractXlsxText = async (buffer: ArrayBuffer): Promise<string[]> => {
    try {
      const zip = await JSZip.loadAsync(buffer);
      // Read shared strings
      const sharedXml = await zip.file('xl/sharedStrings.xml')?.async('text');
      const sharedStrings: string[] = [];
      if (sharedXml) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(sharedXml, 'application/xml');
        const siList = xmlDoc.getElementsByTagName('si');
        for (let i = 0; i < siList.length; i++) {
          sharedStrings.push(siList[i].textContent || '');
        }
      }

      // Read Sheet 1
      const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');
      if (!sheetXml) return ['(Sheet 1 डेटा उपलब्ध नहीं है)'];

      const parser = new DOMParser();
      const sheetDoc = parser.parseFromString(sheetXml, 'application/xml');
      const rows = sheetDoc.getElementsByTagName('row');
      const tableLines: string[] = [];

      for (let i = 0; i < Math.min(rows.length, 100); i++) {
        const cells = rows[i].getElementsByTagName('c');
        const rowVals: string[] = [];
        for (let j = 0; j < cells.length; j++) {
          const c = cells[j];
          const t = c.getAttribute('t');
          const v = c.getElementsByTagName('v')[0]?.textContent || '';
          if (t === 's') {
            const idx = parseInt(v, 10);
            rowVals.push(sharedStrings[idx] || '');
          } else {
            rowVals.push(v);
          }
        }
        if (rowVals.some(Boolean)) {
          tableLines.push(rowVals.join('  |  '));
        }
      }
      return tableLines.length > 0 ? tableLines : ['(रिक्त स्प्रेडशीट / Empty Sheet)'];
    } catch {
      return ['(स्प्रेडशीट डेटा पार्स नहीं हो सका)'];
    }
  };

  // Extract PPTX Text
  const extractPptxText = async (buffer: ArrayBuffer): Promise<string[]> => {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slideFiles = Object.keys(zip.files).filter((f) => f.startsWith('ppt/slides/slide') && f.endsWith('.xml'));
      slideFiles.sort();
      const outputLines: string[] = [];

      for (let i = 0; i < slideFiles.length; i++) {
        outputLines.push(`=== Slide ${i + 1} ===`);
        const xmlText = await zip.file(slideFiles[i])?.async('text');
        if (xmlText) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlText, 'application/xml');
          const tElements = doc.getElementsByTagName('a:t');
          for (let j = 0; j < tElements.length; j++) {
            const txt = tElements[j].textContent || '';
            if (txt.trim()) outputLines.push(txt.trim());
          }
        }
        outputLines.push('');
      }
      return outputLines.length > 0 ? outputLines : ['(खाली स्लाइड प्रेजेंटेशन)'];
    } catch {
      return ['(प्रेजेंटेशन पार्स नहीं हो सकी)'];
    }
  };

  // Convert File to PDF
  const handleConvertToPdf = async () => {
    if (!selectedFile) {
      setErrorMessage('कृपया पहले फ़ाइल चुनें।');
      return;
    }

    setIsConverting(true);
    setProgressMsg('फ़ाइल लोड कर प्रोसेसिंग शुरू हो रही है...');
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();

      // Page dimensions in points
      let width = 595.28; // A4 portrait
      let height = 841.89;

      if (pageSize === 'letter') {
        width = 612;
        height = 792;
      } else if (pageSize === 'legal') {
        width = 612;
        height = 1008;
      }

      if (orientation === 'landscape') {
        const temp = width;
        width = height;
        height = temp;
      }

      const margin = marginSize === 'none' ? 0 : marginSize === 'wide' ? 60 : 36;
      const printableWidth = width - margin * 2;
      const printableHeight = height - margin * 2;

      const isImage = ['jpg', 'png', 'webp', 'svg', 'bmp', 'heic'].includes(selectedFormat);

      if (isImage) {
        setProgressMsg('छवि को PDF में एम्बेड किया जा रहा है...');
        const { dataUrl, width: imgW, height: imgH } = await fileToCanvasDataUrl(selectedFile);
        const imageBytes = await (await fetch(dataUrl)).arrayBuffer();
        const embeddedImg = await pdfDoc.embedJpg(imageBytes);

        const page = pdfDoc.addPage([width, height]);

        if (marginSize === 'none') {
          // Fill page entirely
          page.drawImage(embeddedImg, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
        } else {
          // Fit preserving aspect ratio
          const scale = Math.min(printableWidth / imgW, printableHeight / imgH);
          const drawW = imgW * scale;
          const drawH = imgH * scale;
          const drawX = margin + (printableWidth - drawW) / 2;
          const drawY = margin + (printableHeight - drawH) / 2;

          page.drawImage(embeddedImg, {
            x: drawX,
            y: drawY,
            width: drawW,
            height: drawH,
          });
        }
      } else {
        // Document Text Parsing
        setProgressMsg('दस्तावेज़ की सामग्री पढ़ी जा रही है...');
        const arrayBuffer = await selectedFile.arrayBuffer();
        let paragraphs: string[] = [];

        if (selectedFormat === 'docx') {
          paragraphs = await extractDocxParagraphs(arrayBuffer);
        } else if (selectedFormat === 'xlsx') {
          paragraphs = await extractXlsxText(arrayBuffer);
        } else if (selectedFormat === 'pptx') {
          paragraphs = await extractPptxText(arrayBuffer);
        } else {
          // Text / Markdown
          const text = await selectedFile.text();
          paragraphs = text.split('\n');
        }

        const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        const timesBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

        const fontSize = 11;
        const lineHeight = fontSize * 1.35;
        let currentPage = pdfDoc.addPage([width, height]);
        let currentY = height - margin;

        // Title Header
        const cleanTitle = selectedFile.name.replace(/\.[^/.]+$/, '');
        currentPage.drawText(cleanTitle, {
          x: margin,
          y: currentY - 14,
          size: 15,
          font: timesBoldFont,
          color: rgb(0.1, 0.1, 0.2),
        });
        currentY -= 30;

        // Header divider
        currentPage.drawLine({
          start: { x: margin, y: currentY },
          end: { x: width - margin, y: currentY },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8),
        });
        currentY -= 18;

        const wrap = (txt: string) => {
          const words = txt.split(/\s+/);
          const lines: string[] = [];
          let cur = '';
          for (const w of words) {
            const test = cur ? `${cur} ${w}` : w;
            if (timesRomanFont.widthOfTextAtSize(test, fontSize) <= printableWidth) {
              cur = test;
            } else {
              if (cur) lines.push(cur);
              cur = w;
            }
          }
          if (cur) lines.push(cur);
          return lines;
        };

        for (const p of paragraphs) {
          if (!p.trim()) {
            currentY -= 8;
            continue;
          }

          const isSlideHeader = p.startsWith('=== Slide');
          const fontToUse = isSlideHeader ? timesBoldFont : timesRomanFont;
          const lines = wrap(p);

          for (const line of lines) {
            if (currentY - lineHeight < margin + 25) {
              // Add new page
              currentPage = pdfDoc.addPage([width, height]);
              currentY = height - margin;
            }

            currentPage.drawText(line, {
              x: margin,
              y: currentY,
              size: fontSize,
              font: fontToUse,
              color: isSlideHeader ? rgb(0.8, 0.2, 0.1) : rgb(0.15, 0.15, 0.15),
            });
            currentY -= lineHeight;
          }
          currentY -= 4;
        }

        // Add page numbers
        const count = pdfDoc.getPageCount();
        for (let i = 0; i < count; i++) {
          const p = pdfDoc.getPage(i);
          p.drawText(`Page ${i + 1} of ${count}`, {
            x: width / 2 - 25,
            y: margin > 20 ? margin - 15 : 10,
            size: 9,
            font: timesRomanFont,
            color: rgb(0.5, 0.5, 0.5),
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(url);
      setPdfSizeKb(Math.round((blob.size / 1024) * 10) / 10);
      setTotalPages(pdfDoc.getPageCount());
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : 'फ़ाइल को PDF में बदलने में त्रुटि हुई।'
      );
    } finally {
      setIsConverting(false);
      setProgressMsg('');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-indigo-800 text-white px-3 py-1.5 rounded-lg shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs sm:text-sm font-black flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span>Universal Convert to PDF (मल्टी-फॉर्मेट कनवर्टर हब)</span>
        </h2>
        <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full shrink-0">
          ऑल-इन-वन कनवर्टर
        </span>
      </div>

      {errorMessage && (
        <ToolErrorBanner
          toolName="Universal Convert to PDF"
          errorMessage={errorMessage}
          onRetry={handleConvertToPdf}
        />
      )}

      {/* Format Selection Dropdown Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200">
          <div>
            <label className="block text-xs font-black text-neutral-800 uppercase tracking-wider">
              1. इनपुट फॉर्मेट चुनें (Select Input Format to Convert)
            </label>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              ड्रॉपडाउन से अपनी फ़ाइल का प्रकार चुनें — इमेज या डॉक्यूमेंट
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <select
              value={selectedFormat}
              onChange={(e) => handleFormatChange(e.target.value as InputFormatCategory)}
              className="w-full px-3 py-2 text-xs font-black bg-neutral-50 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-red-600 focus:outline-hidden text-neutral-900 cursor-pointer"
            >
              <optgroup label="📷 Images (इमेज टू PDF)">
                {FORMAT_OPTIONS.filter((f) => f.group === 'Images').map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
              <optgroup label="📄 Documents (दस्तावेज़ टू PDF)">
                {FORMAT_OPTIONS.filter((f) => f.group === 'Documents').map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Step 2: Upload Box */}
        <ToolUploadBox
          label={`2. अपनी ${currentOption.label} फ़ाइल चुनें`}
          subLabel={`स्वीकृत: ${currentOption.mimeOrExt}`}
          accept={currentOption.accept}
          selectedFile={selectedFile}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          fileType={currentOption.group === 'Images' ? 'image' : 'word'}
        />

        {/* Step 3: Page Settings & Action */}
        <div className="bg-neutral-50 p-3 sm:p-4 rounded-xl border border-neutral-200 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-neutral-800">
            <Settings2 className="w-4 h-4 text-red-600" />
            <span>3. पेज लेआउट व मार्जिन सेटिंग्स (Configure Page Settings)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Orientation */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                पेज ओरिएंटेशन (Orientation):
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-neutral-300 rounded-lg text-neutral-800"
              >
                <option value="portrait">खड़ा (Portrait)</option>
                <option value="landscape">आड़ा (Landscape)</option>
              </select>
            </div>

            {/* Page Size */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                पेज साइज़ (Page Size):
              </label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value as 'a4' | 'letter' | 'legal')}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-neutral-300 rounded-lg text-neutral-800"
              >
                <option value="a4">मानक A4 (210 × 297 mm)</option>
                <option value="letter">Letter</option>
                <option value="legal">Legal</option>
              </select>
            </div>

            {/* Margin */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                मार्जिन (Margins):
              </label>
              <select
                value={marginSize}
                onChange={(e) => setMarginSize(e.target.value as 'none' | 'normal' | 'wide')}
                className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-neutral-300 rounded-lg text-neutral-800"
              >
                <option value="normal">सामान्य मार्जिन (Normal)</option>
                <option value="none">बिना मार्जिन (Full Page / No Margin)</option>
                <option value="wide">चौड़ा मार्जिन (Wide)</option>
              </select>
            </div>
          </div>

          {/* Explicit Convert Action Button: Never auto-converts! */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleConvertToPdf}
              disabled={!selectedFile || isConverting}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-black shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{progressMsg || 'PDF में बदला जा रहा है...'}</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>{currentOption.label} कनवर्ट करें (Convert to PDF)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Download Output Box */}
        {pdfBlobUrl && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-center animate-in fade-in duration-200">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>PDF सफलतापूर्वक तैयार हो गई ({totalPages} पृष्ठ, {pdfSizeKb} KB)!</span>
            </div>
            <a
              href={pdfBlobUrl}
              download={`${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'converted'}.pdf`}
              className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Download className="w-4 h-4" />
              <span>PDF डाउनलोड करें ({pdfSizeKb} KB)</span>
            </a>
            <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Safe data: आपका डेटा हमारे सर्वर पर सेव नहीं हो रहा है</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
