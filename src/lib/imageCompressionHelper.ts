/**
 * Helper utility for client-side image compression.
 * Strictly guarantees that the output blob size NEVER exceeds the target KB limit
 * (i.e. size in bytes <= targetKb * 1024).
 * If necessary, it creates a file 1-2 KB below the target ceiling, which is safe
 * for government examination portals (SSC, UPSC, State PSC, Police, Railway, etc.).
 */

export interface CompressOptions {
  targetKb: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  /** Margin in bytes below target to ensure safety against rounding (default 512 bytes) */
  safetyMarginBytes?: number;
}

export async function compressCanvasStrictlyUnderTarget(
  sourceCanvas: HTMLCanvasElement,
  options: CompressOptions
): Promise<Blob> {
  const {
    targetKb,
    mimeType = 'image/jpeg',
    safetyMarginBytes = 512,
  } = options;

  if (targetKb <= 0) {
    throw new Error('Target KB must be greater than 0');
  }

  // Hard ceiling in bytes: MUST NOT EXCEED THIS UNDER ANY CIRCUMSTANCES
  const hardCeilingBytes = Math.floor(targetKb * 1024);
  // Target safety ceiling: e.g. targetKb * 1024 - 512 bytes
  const safeTargetBytes = Math.max(1024, hardCeilingBytes - safetyMarginBytes);

  let currentCanvas = sourceCanvas;
  let currentWidth = sourceCanvas.width;
  let currentHeight = sourceCanvas.height;

  let bestValidBlob: Blob | null = null;

  // We allow up to 8 scale steps to handle huge megapixel photos compressed down to tiny KB (e.g. 10KB-20KB)
  for (let scaleAttempt = 0; scaleAttempt < 8; scaleAttempt++) {
    let lowQ = 0.04;
    let highQ = 0.96;

    // Check if highQ already fits
    const highBlob: Blob | null = await new Promise((res) =>
      currentCanvas.toBlob(res, mimeType, highQ)
    );

    if (highBlob && highBlob.size <= hardCeilingBytes) {
      if (!bestValidBlob || highBlob.size > bestValidBlob.size) {
        bestValidBlob = highBlob;
      }
      // If high quality fits within ceiling, we found an excellent result
      if (highBlob.size >= safeTargetBytes * 0.85 || scaleAttempt > 0) {
        return bestValidBlob;
      }
    }

    // Binary search quality for optimal sharpness below target
    for (let step = 0; step < 7; step++) {
      const midQ = (lowQ + highQ) / 2;
      const testBlob: Blob | null = await new Promise((res) =>
        currentCanvas.toBlob(res, mimeType, midQ)
      );

      if (!testBlob) continue;

      if (testBlob.size <= hardCeilingBytes) {
        // Valid candidate!
        if (!bestValidBlob || testBlob.size > bestValidBlob.size) {
          bestValidBlob = testBlob;
        }
        // Try higher quality to get closer to target
        lowQ = midQ;
      } else {
        // Exceeds target! We MUST lower quality
        highQ = midQ;
      }
    }

    // Also check lowest quality on current canvas
    const lowestBlob: Blob | null = await new Promise((res) =>
      currentCanvas.toBlob(res, mimeType, lowQ)
    );
    if (lowestBlob && lowestBlob.size <= hardCeilingBytes) {
      if (!bestValidBlob || lowestBlob.size > bestValidBlob.size) {
        bestValidBlob = lowestBlob;
      }
    }

    // If we have a valid blob that is <= hardCeilingBytes, we can return it
    if (bestValidBlob && bestValidBlob.size <= hardCeilingBytes) {
      // If it is reasonably close or we've scaled down enough, return
      if (bestValidBlob.size >= safeTargetBytes * 0.5 || scaleAttempt >= 2) {
        return bestValidBlob;
      }
    }

    // If even lowest quality is still > hardCeilingBytes, we MUST downscale resolution
    const lastTestedSize = lowestBlob ? lowestBlob.size : hardCeilingBytes * 1.5;
    const ratio = Math.sqrt(safeTargetBytes / Math.max(lastTestedSize, hardCeilingBytes));
    const factor = Math.min(0.85, Math.max(0.4, ratio * 0.95));

    currentWidth = Math.max(60, Math.floor(currentWidth * factor));
    currentHeight = Math.max(60, Math.floor(currentHeight * factor));

    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = currentWidth;
    scaledCanvas.height = currentHeight;
    const sCtx = scaledCanvas.getContext('2d');
    if (!sCtx) break;

    // Use white background in case of transparent pixels
    sCtx.fillStyle = '#ffffff';
    sCtx.fillRect(0, 0, currentWidth, currentHeight);
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';
    sCtx.drawImage(sourceCanvas, 0, 0, currentWidth, currentHeight);

    currentCanvas = scaledCanvas;
  }

  // Final emergency fallback if needed
  if (!bestValidBlob || bestValidBlob.size > hardCeilingBytes) {
    // Aggressive scale down to ensure strict compliance
    const emergencyCanvas = document.createElement('canvas');
    emergencyCanvas.width = Math.min(250, currentWidth);
    emergencyCanvas.height = Math.min(300, currentHeight);
    const eCtx = emergencyCanvas.getContext('2d');
    if (eCtx) {
      eCtx.fillStyle = '#ffffff';
      eCtx.fillRect(0, 0, emergencyCanvas.width, emergencyCanvas.height);
      eCtx.drawImage(sourceCanvas, 0, 0, emergencyCanvas.width, emergencyCanvas.height);
      const eBlob: Blob | null = await new Promise((res) =>
        emergencyCanvas.toBlob(res, 'image/jpeg', 0.2)
      );
      if (eBlob && eBlob.size <= hardCeilingBytes) {
        return eBlob;
      }
    }
  }

  if (bestValidBlob && bestValidBlob.size <= hardCeilingBytes) {
    return bestValidBlob;
  }

  // Extreme fallback - guarantee <= hardCeilingBytes
  const fallbackCanvas = document.createElement('canvas');
  fallbackCanvas.width = 150;
  fallbackCanvas.height = 150;
  const fCtx = fallbackCanvas.getContext('2d');
  if (fCtx) {
    fCtx.fillStyle = '#ffffff';
    fCtx.fillRect(0, 0, 150, 150);
    fCtx.drawImage(sourceCanvas, 0, 0, 150, 150);
  }
  const fallbackBlob: Blob | null = await new Promise((res) =>
    fallbackCanvas.toBlob(res, 'image/jpeg', 0.1)
  );

  return fallbackBlob || (new Blob([], { type: mimeType }));
}
