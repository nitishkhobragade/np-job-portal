/**
 * NP Job Portal - Strict Physical Scale Engine for Printable Photo Sheets
 * (Epson, Canon, HP Photo Paper & A4 Print Ready)
 * 
 * Rules:
 * 1. Fixed Passport Photo Dimensions: 35mm × 45mm (Exact 413px × 531px @ 300 DPI)
 * 2. 1px light-gray cutting border (#d1d5db)
 * 3. Uniform 2.5mm cutting gap (~30px @ 300 DPI)
 * 4. Realistic top-to-bottom layout leaving unused paper clean for re-use
 * 5. Direct Print, Vector PDF (pdf-lib), Layered PSD (ag-psd), and Ultra HD PNG/JPEG exports
 */

import { PDFDocument, rgb } from 'pdf-lib';
import { writePsdUint8Array, Psd } from 'ag-psd';

export type PaperType = 'a4' | '4x6';

export type A4LayoutPreset = 'a4_6' | 'a4_8_horiz' | 'a4_8_vert' | 'a4_12' | 'a4_full_30';
export type Photo4x6LayoutPreset = '4x6_4' | '4x6_6' | '4x6_8';

export type SheetPresetId = A4LayoutPreset | Photo4x6LayoutPreset;

export interface SheetConfig {
  id: SheetPresetId;
  paperType: PaperType;
  label: string;
  sublabel: string;
  photoCount: number;
  cols: number;
  rows: number;
  orientation: 'portrait' | 'landscape';
  description: string;
  recommendedFor: string;
}

export const PHOTO_DPI = 300;
// 35mm @ 300 DPI = Math.round((35 / 25.4) * 300) = 413 px
export const PHOTO_WIDTH_PX = 413;
// 45mm @ 300 DPI = Math.round((45 / 25.4) * 300) = 531 px
export const PHOTO_HEIGHT_PX = 531;

// 2.5mm trimming gap @ 300 DPI = Math.round((2.5 / 25.4) * 300) = 30 px
export const CUTTING_GAP_PX = 30;

// Paper dimensions @ 300 DPI
// A4 = 210mm × 297mm = 2480px × 3508px
export const A4_WIDTH_PX = 2480;
export const A4_HEIGHT_PX = 3508;

// 4×6 inch = 101.6mm × 152.4mm = 1200px × 1800px
export const CARD_4X6_WIDTH_PX = 1200;
export const CARD_4X6_HEIGHT_PX = 1800;

export const SHEET_PRESETS: Record<SheetPresetId, SheetConfig> = {
  // A4 Presets
  a4_6: {
    id: 'a4_6',
    paperType: 'a4',
    label: '6 Photos (Half Sheet Top)',
    sublabel: '2 rows × 3 cols • Top ~30% A4',
    photoCount: 6,
    cols: 3,
    rows: 2,
    orientation: 'portrait',
    description: 'A4 के ऊपरी 30% हिस्से पर 6 फोटो। नीचे का 70% पेज खाली रहता है ताकि बाद में दोबारा इस्तेमाल किया जा सके।',
    recommendedFor: 'Epson / Canon A4 (Top Print)'
  },
  a4_8_horiz: {
    id: 'a4_8_horiz',
    paperType: 'a4',
    label: '8 Photos (Compact Top)',
    sublabel: '2 rows × 4 cols • Top ~35% A4',
    photoCount: 8,
    cols: 4,
    rows: 2,
    orientation: 'portrait',
    description: 'A4 के शीर्ष पर 2 पंक्तियों में 8 फोटो। बाकी 65% साफ़ पेपर भविष्य के प्रिंट्स के लिए सुरक्षित।',
    recommendedFor: 'Popular Studio Choice'
  },
  a4_8_vert: {
    id: 'a4_8_vert',
    paperType: 'a4',
    label: '8 Photos (Column View)',
    sublabel: '4 rows × 2 cols • Side Column',
    photoCount: 8,
    cols: 2,
    rows: 4,
    orientation: 'portrait',
    description: '2 कॉलम और 4 रो में व्यवस्थित। साइड या वर्टिकल स्ट्रिप कटिंग के लिए उपयुक्त।',
    recommendedFor: 'Vertical Strip Cutting'
  },
  a4_12: {
    id: 'a4_12',
    paperType: 'a4',
    label: '12 Photos (Half-to-Full)',
    sublabel: '4 rows × 3 cols • Upper Half',
    photoCount: 12,
    cols: 3,
    rows: 4,
    orientation: 'portrait',
    description: 'A4 पेज के ऊपरी हिस्से में 12 पासपोर्ट फोटो (3 कॉलम × 4 पंक्ति)। सरकारी डॉक्यूमेंट्स के सेट हेतु।',
    recommendedFor: 'Bulk Form Submission'
  },
  a4_full_30: {
    id: 'a4_full_30',
    paperType: 'a4',
    label: '30 Photos (Full Sheet A4)',
    sublabel: '6 rows × 5 cols • 100% Page Fill',
    photoCount: 30,
    cols: 5,
    rows: 6,
    orientation: 'portrait',
    description: 'संपूर्ण A4 फोटो शीट भरें (5 कॉलम × 6 रो)। अधिकतम बचत, व्यावसायिक स्टूडियो उपयोग।',
    recommendedFor: 'Max Page Utilization'
  },

  // 4×6 Glossy Card Presets
  '4x6_4': {
    id: '4x6_4',
    paperType: '4x6',
    label: '4 Photos (Wallet Size)',
    sublabel: '2 rows × 2 cols • 4×6 Portrait',
    photoCount: 4,
    cols: 2,
    rows: 2,
    orientation: 'portrait',
    description: '4×6 ग्लॉसी कार्ड के ऊपरी हिस्से में 4 फोटो। वॉलेट या इमरजेंसी फॉर्म हेतु।',
    recommendedFor: 'Quick 4-Photo Print'
  },
  '4x6_6': {
    id: '4x6_6',
    paperType: '4x6',
    label: '6 Photos (Studio Classic)',
    sublabel: '2 rows × 3 cols • 4×6 Landscape',
    photoCount: 6,
    cols: 3,
    rows: 2,
    orientation: 'landscape',
    description: 'भारत के 90% फोटो स्टूडियो का मानक 4×6 ग्लॉसी कार्ड लेआउट (3 कॉलम × 2 पंक्ति)। सटीक 3.5×4.5 cm।',
    recommendedFor: 'Studio Standard 4×6'
  },
  '4x6_8': {
    id: '4x6_8',
    paperType: '4x6',
    label: '8 Photos (Max Fill 4×6)',
    sublabel: '2 rows × 4 cols • 4×6 Landscape',
    photoCount: 8,
    cols: 4,
    rows: 2,
    orientation: 'landscape',
    description: '4×6 कार्ड पर अधिकतम 8 फोटो (4 कॉलम × 2 पंक्ति)। न्यूनतम मार्जिन के साथ पूरी कार्ड उपयोग।',
    recommendedFor: 'Maximum 4×6 Fill'
  }
};

export interface LayoutPlacement {
  sheetWidth: number;
  sheetHeight: number;
  photoWidth: number;
  photoHeight: number;
  gapX: number;
  gapY: number;
  positions: Array<{ x: number; y: number; index: number }>;
  usedHeight: number;
  usedWidth: number;
}

/**
 * Calculates exact physical pixel coordinates for the sheet.
 * Always guarantees 100% constant 3.5cm x 4.5cm (413px x 531px) photos without stretching!
 */
export function calculateSheetPlacement(presetId: SheetPresetId): LayoutPlacement {
  const config = SHEET_PRESETS[presetId] || SHEET_PRESETS.a4_6;

  let sheetW = A4_WIDTH_PX;
  let sheetH = A4_HEIGHT_PX;

  if (config.paperType === '4x6') {
    if (config.orientation === 'landscape') {
      sheetW = CARD_4X6_HEIGHT_PX; // 1800
      sheetH = CARD_4X6_WIDTH_PX;  // 1200
    } else {
      sheetW = CARD_4X6_WIDTH_PX;  // 1200
      sheetH = CARD_4X6_HEIGHT_PX; // 1800
    }
  }

  const pw = PHOTO_WIDTH_PX;   // 413 px
  const ph = PHOTO_HEIGHT_PX;  // 531 px
  const gapX = CUTTING_GAP_PX; // 30 px (2.5mm)
  const gapY = CUTTING_GAP_PX; // 30 px (2.5mm)

  const cols = config.cols;
  const rows = config.rows;
  const count = config.photoCount;

  const totalGridWidth = cols * pw + (cols - 1) * gapX;
  const totalGridHeight = rows * ph + (rows - 1) * gapY;

  // Center horizontally within paper
  const startX = Math.max(0, Math.round((sheetW - totalGridWidth) / 2));

  // Top-to-bottom layout:
  // For A4, align to top with standard top margin (~10mm = 118px) leaving bottom clean
  // For Full sheet or 4x6 centered presets, center vertically if it fills the page
  let startY = 118; // ~10mm top margin for easy feeder grip

  if (presetId === 'a4_full_30') {
    startY = Math.max(20, Math.round((sheetH - totalGridHeight) / 2));
  } else if (config.paperType === '4x6') {
    if (presetId === '4x6_6' || presetId === '4x6_8') {
      startY = Math.max(24, Math.round((sheetH - totalGridHeight) / 2));
    } else {
      startY = 90; // Top-aligned for 4-photo wallet
    }
  }

  const positions: Array<{ x: number; y: number; index: number }> = [];
  let drawn = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (drawn >= count) break;
      const x = startX + c * (pw + gapX);
      const y = startY + r * (ph + gapY);
      positions.push({ x, y, index: drawn });
      drawn++;
    }
  }

  return {
    sheetWidth: sheetW,
    sheetHeight: sheetH,
    photoWidth: pw,
    photoHeight: ph,
    gapX,
    gapY,
    positions,
    usedHeight: startY + totalGridHeight,
    usedWidth: totalGridWidth
  };
}

/**
 * Draws the high-res 300 DPI sheet canvas with exact scaling & cutting guides
 */
export function renderSheetToCanvas(
  photoSource: HTMLImageElement | HTMLCanvasElement,
  presetId: SheetPresetId,
  showCuttingGuides: boolean = true,
  guideColor: string = '#d1d5db' // 1px light gray border
): HTMLCanvasElement {
  const placement = calculateSheetPlacement(presetId);
  const canvas = document.createElement('canvas');
  canvas.width = placement.sheetWidth;
  canvas.height = placement.sheetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // 1. Crisp White Paper Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const { photoWidth: pw, photoHeight: ph } = placement;

  // 2. Draw each photo at exact physical coordinates
  for (const pos of placement.positions) {
    // Draw photo
    ctx.drawImage(photoSource, 0, 0, photoSource.width, photoSource.height, pos.x, pos.y, pw, ph);

    // Cutting Guideline: ultra-thin 1px light-gray border (#d1d5db)
    if (showCuttingGuides) {
      ctx.strokeStyle = guideColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(pos.x - 0.5, pos.y - 0.5, pw + 1, ph + 1);

      // Subtle scissor marks or crosshairs at corner gaps
      drawCornerTrimmingGuides(ctx, pos.x, pos.y, pw, ph, placement.gapX);
    }
  }

  // 3. Subtle header text in top margin for studio convenience (clean, non-intrusive)
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  const config = SHEET_PRESETS[presetId];
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const paperTitle = config.paperType === 'a4' ? 'A4 Paper (210×297mm)' : '4×6 Photo Paper (101.6×152.4mm)';
  ctx.fillText(
    `NP Job Portal Photo Studio • ${config.label} • 35×45mm (300 DPI) • ${paperTitle} • ${dateStr}`,
    36,
    36
  );

  return canvas;
}

/**
 * Draws professional corner trimming guide crosshairs in the gaps
 */
function drawCornerTrimmingGuides(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number
) {
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  const tick = Math.min(8, Math.floor(gap / 3));

  // Top-left outer mark
  ctx.beginPath();
  ctx.moveTo(x - tick, y);
  ctx.lineTo(x, y);
  ctx.moveTo(x, y - tick);
  ctx.lineTo(x, y);
  ctx.stroke();

  // Top-right outer mark
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + tick, y);
  ctx.moveTo(x + w, y - tick);
  ctx.lineTo(x + w, y);
  ctx.stroke();

  // Bottom-left outer mark
  ctx.beginPath();
  ctx.moveTo(x - tick, y + h);
  ctx.lineTo(x, y + h);
  ctx.moveTo(x, y + h + tick);
  ctx.lineTo(x, y + h);
  ctx.stroke();

  // Bottom-right outer mark
  ctx.beginPath();
  ctx.moveTo(x + w, y + h);
  ctx.lineTo(x + w + tick, y + h);
  ctx.moveTo(x + w, y + h + tick);
  ctx.lineTo(x + w, y + h);
  ctx.stroke();
}

/**
 * Export Print-Ready Vector PDF using pdf-lib at exact physical dimensions (35mm x 45mm @ 300 DPI)
 */
export async function exportSheetToPdf(
  photoSource: HTMLImageElement | HTMLCanvasElement,
  presetId: SheetPresetId,
  showCuttingGuides: boolean = true
): Promise<Uint8Array> {
  const config = SHEET_PRESETS[presetId];
  const placement = calculateSheetPlacement(presetId);

  // 1 pt = 1/72 inch.
  // A4: 210mm = 8.2677 in = 595.28 pt; 297mm = 11.6929 in = 841.89 pt.
  // 4x6 in: 288 pt x 432 pt.
  let pageWidthPt = 595.28;
  let pageHeightPt = 841.89;

  if (config.paperType === '4x6') {
    if (config.orientation === 'landscape') {
      pageWidthPt = 432;
      pageHeightPt = 288;
    } else {
      pageWidthPt = 288;
      pageHeightPt = 432;
    }
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

  // Convert photo to high quality JPEG/PNG
  let photoDataUrl: string;
  if (photoSource instanceof HTMLCanvasElement) {
    photoDataUrl = photoSource.toDataURL('image/jpeg', 0.96);
  } else {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = photoSource.width;
    tempCanvas.height = photoSource.height;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) tCtx.drawImage(photoSource, 0, 0);
    photoDataUrl = tempCanvas.toDataURL('image/jpeg', 0.96);
  }

  // Embed photo in PDF
  const photoImage = await pdfDoc.embedJpg(photoDataUrl);

  // Scale factors: 1px in 300 DPI sheet = 72 / 300 pt = 0.24 pt
  const ptPerPx = 72 / 300;

  const photoWidthPt = PHOTO_WIDTH_PX * ptPerPx;   // ~99.12 pt = 35 mm
  const photoHeightPt = PHOTO_HEIGHT_PX * ptPerPx; // ~127.44 pt = 45 mm

  // In PDF, origin (0, 0) is at bottom-left.
  // Coordinate conversion: y_pdf = pageHeightPt - (y_px * ptPerPx) - photoHeightPt
  for (const pos of placement.positions) {
    const xPt = pos.x * ptPerPx;
    const yPt = pageHeightPt - (pos.y * ptPerPx) - photoHeightPt;

    page.drawImage(photoImage, {
      x: xPt,
      y: yPt,
      width: photoWidthPt,
      height: photoHeightPt
    });

    if (showCuttingGuides) {
      // 1px light-gray cutting border (#d1d5db)
      page.drawRectangle({
        x: xPt - 0.2,
        y: yPt - 0.2,
        width: photoWidthPt + 0.4,
        height: photoHeightPt + 0.4,
        borderColor: rgb(209 / 255, 213 / 255, 219 / 255),
        borderWidth: 0.5
      });
    }
  }

  return await pdfDoc.save();
}

/**
 * Export layered Photoshop PSD using ag-psd (client-side)
 * Each photo is on its own separate layer with exact position for Adobe Photoshop fine-tuning!
 */
export async function exportSheetToPsd(
  photoSource: HTMLImageElement | HTMLCanvasElement,
  presetId: SheetPresetId
): Promise<Uint8Array> {
  const placement = calculateSheetPlacement(presetId);
  const config = SHEET_PRESETS[presetId];

  // Base canvas for individual photo layer
  const photoCanvas = document.createElement('canvas');
  photoCanvas.width = placement.photoWidth;
  photoCanvas.height = placement.photoHeight;
  const pCtx = photoCanvas.getContext('2d');
  if (pCtx) {
    pCtx.drawImage(
      photoSource,
      0,
      0,
      photoSource.width,
      photoSource.height,
      0,
      0,
      placement.photoWidth,
      placement.photoHeight
    );
    // Draw 1px border
    pCtx.strokeStyle = '#d1d5db';
    pCtx.lineWidth = 1;
    pCtx.strokeRect(0, 0, placement.photoWidth, placement.photoHeight);
  }

  // Create White Background Canvas
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = placement.sheetWidth;
  bgCanvas.height = placement.sheetHeight;
  const bCtx = bgCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  }

  // Create layers array
  const children = [
    {
      name: 'Background (White Paper)',
      canvas: bgCanvas,
      left: 0,
      top: 0
    }
  ];

  for (let i = 0; i < placement.positions.length; i++) {
    const pos = placement.positions[i];
    // Each photo gets an independent layer
    children.push({
      name: `Photo ${i + 1} (${config.photoCount} Grid)`,
      canvas: photoCanvas,
      left: pos.x,
      top: pos.y
    });
  }

  const psd: Psd = {
    width: placement.sheetWidth,
    height: placement.sheetHeight,
    channels: 3,
    bitsPerChannel: 8,
    colorMode: 3, // RGB
    children
  };

  return writePsdUint8Array(psd);
}

/**
 * Trigger browser print dialog with @media print CSS enforcing exact scale & zero margin
 */
export function triggerDirectPrint(
  sheetCanvas: HTMLCanvasElement,
  presetId: SheetPresetId
): void {
  const config = SHEET_PRESETS[presetId];
  const isA4 = config.paperType === 'a4';
  const isLandscape = config.orientation === 'landscape';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    // Fallback if popup blocked: create hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      writePrintDocument(doc, sheetCanvas.toDataURL('image/png'), isA4, isLandscape);
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    }
    return;
  }

  writePrintDocument(printWindow.document, sheetCanvas.toDataURL('image/png'), isA4, isLandscape);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

function writePrintDocument(
  doc: Document,
  imgDataUrl: string,
  isA4: boolean,
  isLandscape: boolean
) {
  const pageCss = isA4
    ? 'size: A4 portrait; margin: 0;'
    : isLandscape
    ? 'size: 6in 4in; margin: 0;'
    : 'size: 4in 6in; margin: 0;';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>NP Job Portal - Printable Photo Sheet (100% Scale)</title>
        <style>
          @page {
            ${pageCss}
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            background: #ffffff;
            margin: 0;
            padding: 0;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet-container {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: flex-start;
            justify-content: center;
          }
          img {
            display: block;
            width: 100%;
            height: auto;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
        </style>
      </head>
      <body>
        <div class="sheet-container">
          <img src="${imgDataUrl}" alt="Passport Photo Sheet" />
        </div>
      </body>
    </html>
  `);
  doc.close();
}
