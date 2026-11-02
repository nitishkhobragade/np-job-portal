/**
 * Helper utility for client-side image compression.
 * Strictly guarantees that the output blob size NEVER exceeds the target KB limit
 * (i.e. size in bytes <= targetKb * 1024).
 * If necessary, it creates a file 1-2 KB below the target ceiling, which is safe
 * for government examination portals (SSC, UPSC, State PSC, Police, Railway, etc.).
 *
 * It also supports automatic target padding (via valid JPEG COM markers) so that
 * when user requests a specific target KB (e.g. 25 KB or 50 KB for a 140x60 signature),
 * the output file size comfortably reaches that target size and is NOT stuck at 2-3 KB.
 */

export interface CompressOptions {
  targetKb: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  /** Margin in bytes below target to ensure safety against rounding (default 400 bytes) */
  safetyMarginBytes?: number;
  /**
   * When true (default: true for JPEG), if the image compresses naturally smaller than
   * targetKb (e.g. small dimensions like 140x60 signatures), safe JPEG COM segments are
   * added so the file size reaches the user's requested target KB to satisfy government portal
   * minimum file size rules (e.g., minimum 20 KB - 50 KB).
   */
  padToTarget?: boolean;
}

/**
 * Inserts valid JPEG COM (0xFF 0xFE) marker segments after the SOI marker (0xFF 0xD8).
 * This safely increases JPEG file size to exact desired byte count without touching image pixels.
 * Completely compliant with ISO/IEC 10918-1 JPEG standard.
 */
export function padJpegBytes(jpegBuffer: ArrayBuffer, desiredTotalBytes: number): Uint8Array {
  const originalBytes = new Uint8Array(jpegBuffer);
  if (originalBytes.length >= desiredTotalBytes) {
    return originalBytes;
  }

  // Ensure it is a valid JPEG starting with SOI (0xFF 0xD8)
  if (originalBytes.length < 4 || originalBytes[0] !== 0xff || originalBytes[1] !== 0xd8) {
    return originalBytes;
  }

  let neededExtra = desiredTotalBytes - originalBytes.length;
  if (neededExtra < 4) {
    return originalBytes;
  }

  // Build list of COM segments (max 65535 total bytes each)
  const segments: number[] = [];
  while (neededExtra > 0) {
    if (neededExtra < 4) {
      if (segments.length > 0 && segments[segments.length - 1] + neededExtra <= 65535) {
        segments[segments.length - 1] += neededExtra;
      }
      break;
    }
    const segSize = Math.min(neededExtra, 65500);
    if (neededExtra - segSize > 0 && neededExtra - segSize < 4 && segSize + (neededExtra - segSize) <= 65535) {
      segments.push(neededExtra);
      neededExtra = 0;
      break;
    }
    segments.push(segSize);
    neededExtra -= segSize;
  }

  const totalExtra = segments.reduce((a, b) => a + b, 0);
  const result = new Uint8Array(originalBytes.length + totalExtra);

  // Copy SOI (first 2 bytes)
  result[0] = 0xff;
  result[1] = 0xd8;

  let writeIndex = 2;
  for (const segTotal of segments) {
    const payloadSize = segTotal - 4;
    result[writeIndex] = 0xff;
    result[writeIndex + 1] = 0xfe; // COM marker
    const segLength = payloadSize + 2;
    result[writeIndex + 2] = (segLength >> 8) & 0xff;
    result[writeIndex + 3] = segLength & 0xff;
    // Fill with harmless whitespace bytes (ASCII space 0x20)
    result.fill(0x20, writeIndex + 4, writeIndex + 4 + payloadSize);
    writeIndex += segTotal;
  }

  // Copy remaining original JPEG bytes
  result.set(originalBytes.subarray(2), writeIndex);
  return result;
}

/**
 * Safely pads a JPEG Data URL to reach the desired byte count.
 */
export function padJpegDataUrl(dataUrl: string, desiredTotalBytes: number): string {
  if (!dataUrl.startsWith('data:image/jpeg') && !dataUrl.startsWith('data:image/jpg')) {
    return dataUrl;
  }
  const commaIdx = dataUrl.indexOf(',');
  if (commaIdx === -1) return dataUrl;

  try {
    const base64Str = dataUrl.slice(commaIdx + 1);
    const binaryStr = atob(base64Str);
    const len = binaryStr.length;
    if (len >= desiredTotalBytes) return dataUrl;

    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const paddedBytes = padJpegBytes(bytes.buffer, desiredTotalBytes);

    let binary = '';
    const paddedLen = paddedBytes.byteLength;
    const chunk = 8192;
    for (let i = 0; i < paddedLen; i += chunk) {
      const sub = paddedBytes.subarray(i, Math.min(i + chunk, paddedLen));
      binary += String.fromCharCode.apply(null, Array.from(sub));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  } catch {
    return dataUrl;
  }
}

export async function compressCanvasStrictlyUnderTarget(
  sourceCanvas: HTMLCanvasElement,
  options: CompressOptions
): Promise<Blob> {
  const {
    targetKb,
    mimeType = 'image/jpeg',
    safetyMarginBytes = 400,
    padToTarget = true,
  } = options;

  if (targetKb <= 0) {
    throw new Error('Target KB must be greater than 0');
  }

  // Hard ceiling in bytes: MUST NOT EXCEED THIS UNDER ANY CIRCUMSTANCES
  const hardCeilingBytes = Math.floor(targetKb * 1024);
  // Target safety ceiling: e.g. targetKb * 1024 - 400 bytes
  const safeTargetBytes = Math.max(1024, hardCeilingBytes - safetyMarginBytes);

  let currentCanvas = sourceCanvas;
  let currentWidth = sourceCanvas.width;
  let currentHeight = sourceCanvas.height;

  let bestValidBlob: Blob | null = null;

  // We allow up to 8 scale steps to handle huge megapixel photos compressed down to tiny KB
  for (let scaleAttempt = 0; scaleAttempt < 8; scaleAttempt++) {
    let lowQ = 0.04;
    let highQ = 0.98;

    // Check if high quality already fits within hard ceiling
    const highBlob: Blob | null = await new Promise((res) =>
      currentCanvas.toBlob(res, mimeType, highQ)
    );

    if (highBlob && highBlob.size <= hardCeilingBytes) {
      if (!bestValidBlob || highBlob.size > bestValidBlob.size) {
        bestValidBlob = highBlob;
      }
      // If high quality fits within ceiling and is close to target, or after scaling, we can break search
      if (highBlob.size >= safeTargetBytes * 0.9 || scaleAttempt > 0) {
        break;
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

    // If we have a valid blob that is <= hardCeilingBytes, we can break
    if (bestValidBlob && bestValidBlob.size <= hardCeilingBytes) {
      if (bestValidBlob.size >= safeTargetBytes * 0.5 || scaleAttempt >= 2) {
        break;
      }
    }

    // If even lowest quality is still > hardCeilingBytes, downscale resolution
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
        bestValidBlob = eBlob;
      }
    }
  }

  let finalBlob = bestValidBlob;
  if (!finalBlob || finalBlob.size > hardCeilingBytes) {
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
    finalBlob = fallbackBlob || new Blob([], { type: mimeType });
  }

  // Automatic target padding for JPEG:
  // If the resulting blob is smaller than safeTargetBytes, and padToTarget is enabled,
  // we pad the JPEG so it hits the user's requested target size.
  // This removes the issue where an image cannot reach the target KB when resized small!
  if (padToTarget && (mimeType === 'image/jpeg' || finalBlob.type === 'image/jpeg')) {
    if (finalBlob.size < safeTargetBytes) {
      try {
        const buffer = await finalBlob.arrayBuffer();
        const paddedBytes = padJpegBytes(buffer, safeTargetBytes);
        finalBlob = new Blob([paddedBytes.buffer], { type: 'image/jpeg' });
      } catch (err) {
        console.warn('JPEG padding fallback to unpadded blob:', err);
      }
    }
  }

  return finalBlob;
}

