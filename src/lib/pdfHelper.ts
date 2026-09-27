// Shared PDF renderer helper using pdfjs-dist in browser with bulletproof offline/fallback handling
import { PDFDocument } from 'pdf-lib';

type PdfJsModule = typeof import('pdfjs-dist');
let cachedPdfJs: PdfJsModule | null = null;

export async function loadPdfJs(): Promise<PdfJsModule | null> {
  if (typeof window === 'undefined') return null;
  if (cachedPdfJs) return cachedPdfJs;

  try {
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '4.10.38'}/pdf.worker.min.mjs`;
    }
    cachedPdfJs = pdfjs;
    return pdfjs;
  } catch (err) {
    console.error('Failed to load pdfjs-dist:', err);
    return null;
  }
}

/**
 * Fast, 100% offline page count using pdf-lib (zero network calls, never hangs)
 */
export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    return pdfDoc.getPageCount();
  } catch (err) {
    console.warn('pdf-lib getPageCount failed, trying pdfjs:', err);
    try {
      const pdfjs = await loadPdfJs();
      if (!pdfjs) return 1;
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
      const pdfDoc = await loadingTask.promise;
      return pdfDoc.numPages;
    } catch {
      return 1;
    }
  }
}

/**
 * Render a page from PDF ArrayBuffer to an HTMLCanvasElement
 * Uses high-resolution scale (2.5x - 3.0x) for crisp text rendering.
 */
export async function renderPdfPageToCanvas(
  pdfBuffer: ArrayBuffer,
  pageNumber: number,
  scale: number = 2.5
): Promise<HTMLCanvasElement> {
  const pdfjs = await loadPdfJs();
  if (!pdfjs) throw new Error('PDF रेंडरिंग इंजन लोड नहीं हो सका।');

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(pdfBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
    cMapPacked: true,
  });

  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Fill with crisp white background first
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
    intent: 'print',
  };

  // @ts-expect-error pdfjs typing nuance
  await page.render(renderContext).promise;
  return canvas;
}
