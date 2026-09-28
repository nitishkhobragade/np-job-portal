/**
 * Perspective transform, corner detection, and AI object removal utilities
 * for Smart Passport Photo Maker.
 */

export interface Point {
  x: number;
  y: number;
}

export interface QuadCorners {
  tl: Point; // Top-Left
  tr: Point; // Top-Right
  br: Point; // Bottom-Right
  bl: Point; // Bottom-Left
}

/**
 * Automatically estimate 4 corners of a physical photo placed on a surface/table.
 * Falls back to a centered 3.5:4.5 rectangle if high-contrast edges aren't unambiguous.
 */
export function autoDetectPhotoCorners(
  imgWidth: number,
  imgHeight: number,
  canvas?: HTMLCanvasElement | null
): QuadCorners {
  // If no canvas or very small, use standard 12% margin rectangle with 3.5:4.5 ratio
  const defaultCorners = getCenteredDefaultCorners(imgWidth, imgHeight);

  if (!canvas) return defaultCorners;

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return defaultCorners;

    // Work on a downsampled copy for fast processing
    const sampleW = 200;
    const sampleH = Math.round((sampleW * imgHeight) / imgWidth);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tctx) return defaultCorners;

    tctx.drawImage(canvas, 0, 0, sampleW, sampleH);
    const imgData = tctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    // Convert to grayscale luminance
    const gray = new Uint8Array(sampleW * sampleH);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    }

    // Sample border background average (assumed to be table surface)
    let borderSum = 0;
    let borderCount = 0;
    for (let x = 0; x < sampleW; x++) {
      borderSum += gray[x] + gray[(sampleH - 1) * sampleW + x];
      borderCount += 2;
    }
    for (let y = 0; y < sampleH; y++) {
      borderSum += gray[y * sampleW] + gray[y * sampleW + sampleW - 1];
      borderCount += 2;
    }
    const bgLum = borderSum / (borderCount || 1);

    // Find boundaries where luminance differs significantly from table background
    const threshold = 28;
    let minX = sampleW, maxX = 0, minY = sampleH, maxY = 0;

    for (let y = Math.floor(sampleH * 0.05); y < Math.floor(sampleH * 0.95); y++) {
      for (let x = Math.floor(sampleW * 0.05); x < Math.floor(sampleW * 0.95); x++) {
        const val = gray[y * sampleW + x];
        if (Math.abs(val - bgLum) > threshold) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const scaleX = imgWidth / sampleW;
    const scaleY = imgHeight / sampleH;

    // If detected area is reasonably sized (at least 20% of image), use it
    const detectedW = (maxX - minX) * scaleX;
    const detectedH = (maxY - minY) * scaleY;
    if (detectedW > imgWidth * 0.25 && detectedH > imgHeight * 0.25) {
      const pad = 4;
      return {
        tl: { x: Math.max(0, (minX - pad) * scaleX), y: Math.max(0, (minY - pad) * scaleY) },
        tr: { x: Math.min(imgWidth, (maxX + pad) * scaleX), y: Math.max(0, (minY - pad) * scaleY) },
        br: { x: Math.min(imgWidth, (maxX + pad) * scaleX), y: Math.min(imgHeight, (maxY + pad) * scaleY) },
        bl: { x: Math.max(0, (minX - pad) * scaleX), y: Math.min(imgHeight, (maxY + pad) * scaleY) },
      };
    }
  } catch (e) {
    console.warn('Auto corner detection fallback:', e);
  }

  return defaultCorners;
}

/**
 * Returns centered corners with 3.5 : 4.5 passport aspect ratio
 */
export function getCenteredDefaultCorners(imgWidth: number, imgHeight: number): QuadCorners {
  const targetRatio = 3.5 / 4.5;
  const currentRatio = imgWidth / imgHeight;

  let boxW: number, boxH: number;
  if (currentRatio > targetRatio) {
    boxH = imgHeight * 0.8;
    boxW = boxH * targetRatio;
  } else {
    boxW = imgWidth * 0.8;
    boxH = boxW / targetRatio;
  }

  const startX = (imgWidth - boxW) / 2;
  const startY = (imgHeight - boxH) / 2;

  return {
    tl: { x: Math.round(startX), y: Math.round(startY) },
    tr: { x: Math.round(startX + boxW), y: Math.round(startY) },
    br: { x: Math.round(startX + boxW), y: Math.round(startY + boxH) },
    bl: { x: Math.round(startX), y: Math.round(startY + boxH) },
  };
}

/**
 * Solve 8 linear equations for 3x3 Homography Matrix (Perspective Transform)
 * mapping [TL, TR, BR, BL] -> [ (0,0), (dstW, 0), (dstW, dstH), (0, dstH) ]
 */
function getPerspectiveTransform(srcCorners: QuadCorners, dstW: number, dstH: number): number[] {
  // Destination points
  const dstPts = [
    { x: 0, y: 0 },
    { x: dstW, y: 0 },
    { x: dstW, y: dstH },
    { x: 0, y: dstH },
  ];
  const srcPts = [srcCorners.tl, srcCorners.tr, srcCorners.br, srcCorners.bl];

  // We want H that maps (dstX, dstY) -> (srcX, srcY) for inverse backward sampling
  // So we compute transformation from Dest to Source
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const d = dstPts[i];
    const s = srcPts[i];
    A.push([d.x, d.y, 1, 0, 0, 0, -d.x * s.x, -d.y * s.x]);
    B.push(s.x);
    A.push([0, 0, 0, d.x, d.y, 1, -d.x * s.y, -d.y * s.y]);
    B.push(s.y);
  }

  // Gaussian elimination to solve for [h00, h01, h02, h10, h11, h12, h20, h21]
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
        maxRow = k;
      }
    }
    const tempA = A[i];
    A[i] = A[maxRow];
    A[maxRow] = tempA;

    const tempB = B[i];
    B[i] = B[maxRow];
    B[maxRow] = tempB;

    if (Math.abs(A[i][i]) < 1e-8) continue;

    for (let k = i + 1; k < n; k++) {
      const factor = A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] -= factor * A[i][j];
      }
      B[k] -= factor * B[i];
    }
  }

  const h = new Array(9).fill(0);
  h[8] = 1;

  for (let i = n - 1; i >= 0; i--) {
    let sum = B[i];
    for (let j = i + 1; j < n; j++) {
      sum -= A[i][j] * h[j];
    }
    h[i] = sum / (A[i][i] || 1);
  }

  return h;
}

/**
 * Warp angled/skewed physical photo defined by 4 corners into perfectly flat,
 * upright, perspective-corrected rectangular canvas.
 */
export function warpPerspective(
  sourceCanvas: HTMLCanvasElement,
  corners: QuadCorners,
  targetWidth: number = 700,
  targetHeight: number = 900
): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;

  const outCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!outCtx || !srcCtx) return outputCanvas;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const srcData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcPixels = srcData.data;

  const outData = outCtx.createImageData(targetWidth, targetHeight);
  const outPixels = outData.data;

  // Inverse mapping matrix: target -> source
  const H = getPerspectiveTransform(corners, targetWidth, targetHeight);

  // Backward pixel mapping with bilinear interpolation
  for (let dy = 0; dy < targetHeight; dy++) {
    for (let dx = 0; dx < targetWidth; dx++) {
      const z = H[6] * dx + H[7] * dy + H[8];
      const invZ = 1.0 / (Math.abs(z) > 1e-8 ? z : 1e-8);
      const sx = (H[0] * dx + H[1] * dy + H[2]) * invZ;
      const sy = (H[3] * dx + H[4] * dy + H[5]) * invZ;

      const outIndex = (dy * targetWidth + dx) * 4;

      if (sx >= 0 && sx < srcW - 1 && sy >= 0 && sy < srcH - 1) {
        // Bilinear interpolation
        const x0 = Math.floor(sx);
        const y0 = Math.floor(sy);
        const x1 = x0 + 1;
        const y1 = y0 + 1;

        const wx1 = sx - x0;
        const wx0 = 1.0 - wx1;
        const wy1 = sy - y0;
        const wy0 = 1.0 - wy1;

        const i00 = (y0 * srcW + x0) * 4;
        const i10 = (y0 * srcW + x1) * 4;
        const i01 = (y1 * srcW + x0) * 4;
        const i11 = (y1 * srcW + x1) * 4;

        for (let c = 0; c < 3; c++) {
          const val =
            (srcPixels[i00 + c] * wx0 + srcPixels[i10 + c] * wx1) * wy0 +
            (srcPixels[i01 + c] * wx0 + srcPixels[i11 + c] * wx1) * wy1;
          outPixels[outIndex + c] = Math.round(val);
        }
        outPixels[outIndex + 3] = 255;
      } else {
        // Out of bounds - white background
        outPixels[outIndex] = 255;
        outPixels[outIndex + 1] = 255;
        outPixels[outIndex + 2] = 255;
        outPixels[outIndex + 3] = 255;
      }
    }
  }

  outCtx.putImageData(outData, 0, 0);
  return outputCanvas;
}

/**
 * Fast client-side smart object removal / patch inpainting.
 * Removes unwanted objects, fingers, glare or shadows covered by user mask,
 * seamlessly blending surrounding textures.
 */
export function clientInpaintObject(
  targetCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement
): void {
  const ctx = targetCanvas.getContext('2d', { willReadFrequently: true });
  const mCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx || !mCtx) return;

  const w = targetCanvas.width;
  const h = targetCanvas.height;

  const imgData = ctx.getImageData(0, 0, w, h);
  const maskData = mCtx.getImageData(0, 0, w, h);
  const pixels = imgData.data;
  const mask = maskData.data;

  // Find all masked pixels (alpha > 50 or red channel > 50)
  const isMasked = new Uint8Array(w * h);
  let maskedCount = 0;
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    if (mask[idx + 3] > 30 && (mask[idx] > 100 || mask[idx + 3] > 100)) {
      isMasked[i] = 1;
      maskedCount++;
    }
  }

  if (maskedCount === 0) return;

  // Diffusion / Telea-like boundary blend: iteratively fill from perimeter
  const passes = 12;
  const radius = 6;

  for (let pass = 0; pass < passes; pass++) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (isMasked[i] !== 1) continue;

        let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;

        for (let dy = -radius; dy <= radius; dy++) {
          const ny = y + dy;
          if (ny < 0 || ny >= h) continue;

          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            if (nx < 0 || nx >= w) continue;

            const ni = ny * w + nx;
            if (isMasked[ni] === 0) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              const weight = 1.0 / (dist + 0.1);

              const nIdx = ni * 4;
              rSum += pixels[nIdx] * weight;
              gSum += pixels[nIdx + 1] * weight;
              bSum += pixels[nIdx + 2] * weight;
              weightSum += weight;
            }
          }
        }

        if (weightSum > 0) {
          const idx = i * 4;
          pixels[idx] = Math.round(rSum / weightSum);
          pixels[idx + 1] = Math.round(gSum / weightSum);
          pixels[idx + 2] = Math.round(bSum / weightSum);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
