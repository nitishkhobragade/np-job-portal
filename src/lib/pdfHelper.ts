// Shared PDF renderer helper using pdfjs-dist in browser
export async function loadPdfJs() {
  if (typeof window === 'undefined') return null;
  const pdfjs = await import('pdfjs-dist');
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    // Use unpkg / cdnjs worker compatible with the pdfjs-dist version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return pdfjs;
}

/**
 * Render a page from PDF ArrayBuffer to an HTMLCanvasElement
 */
export async function renderPdfPageToCanvas(
  pdfBuffer: ArrayBuffer,
  pageNumber: number,
  scale: number = 1.5
): Promise<HTMLCanvasElement> {
  const pdfjs = await loadPdfJs();
  if (!pdfjs) throw new Error('PDF.js could not be loaded');

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  const renderContext = {
    canvasContext: ctx,
    viewport: viewport,
  };

  // @ts-expect-error pdfjs typing nuance
  await page.render(renderContext).promise;
  return canvas;
}

/**
 * Get total number of pages in a PDF
 */
export async function getPdfPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  const pdfjs = await loadPdfJs();
  if (!pdfjs) return 1;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(pdfBuffer) });
  const pdfDoc = await loadingTask.promise;
  return pdfDoc.numPages;
}
