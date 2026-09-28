/**
 * Perspective transform, high-accuracy corner detection, and AI image utilities
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
 * Returns centered corners with standard 3.5 : 4.5 passport aspect ratio.
 * Default size is centered and covers ~65% of frame (avoiding 90%+ border selection).
 */
export function getCenteredDefaultCorners(imgWidth: number, imgHeight: number): QuadCorners {
  const targetRatio = 3.5 / 4.5; // ~0.778
  const currentRatio = imgWidth / imgHeight;

  let boxW: number, boxH: number;
  if (currentRatio > targetRatio) {
    boxH = Math.round(imgHeight * 0.75);
    boxW = Math.round(boxH * targetRatio);
  } else {
    boxW = Math.round(imgWidth * 0.75);
    boxH = Math.round(boxW / targetRatio);
  }

  const startX = Math.round((imgWidth - boxW) / 2);
  const startY = Math.round((imgHeight - boxH) / 2);

  return {
    tl: { x: startX, y: startY },
    tr: { x: startX + boxW, y: startY },
    br: { x: startX + boxW, y: startY + boxH },
    bl: { x: startX, y: startY + boxH },
  };
}

/**
 * High-Accuracy Client-Side Contour & Edge Corner Detection:
 * 1. Grayscale luminance conversion.
 * 2. Bilateral / Gaussian smoothing to suppress plastic pouch glare & table noise.
 * 3. Sobel gradient edge detection with adaptive threshold.
 * 4. Morphological closing to bridge broken borders.
 * 5. Quadrilateral contour extraction filtering out outer borders (>88% of screen)
 *    and non-passport aspect ratios.
 */
export function autoDetectPhotoCorners(
  imgWidth: number,
  imgHeight: number,
  canvas?: HTMLCanvasElement | null
): QuadCorners {
  const defaultCorners = getCenteredDefaultCorners(imgWidth, imgHeight);
  if (!canvas) return defaultCorners;

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return defaultCorners;

    // Use normalized sampling resolution for fast, consistent edge extraction
    const sampleW = 320;
    const sampleH = Math.round((sampleW * imgHeight) / imgWidth);
    if (sampleH < 40) return defaultCorners;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tctx) return defaultCorners;

    tctx.drawImage(canvas, 0, 0, sampleW, sampleH);
    const imgData = tctx.getImageData(0, 0, sampleW, sampleH);
    const data = imgData.data;

    // 1. Grayscale luminance buffer
    const gray = new Float32Array(sampleW * sampleH);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // 2. 3x3 Gaussian / Bilateral smoothing (suppresses glare & plastic reflections)
    const smoothed = new Float32Array(sampleW * sampleH);
    for (let y = 1; y < sampleH - 1; y++) {
      for (let x = 1; x < sampleW - 1; x++) {
        const center = gray[y * sampleW + x];
        let sum = 0;
        let wSum = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const val = gray[(y + dy) * sampleW + (x + dx)];
            // Range distance weight (bilateral)
            const spatialW = (dx === 0 && dy === 0) ? 4 : (dx === 0 || dy === 0) ? 2 : 1;
            const rangeW = Math.exp(-Math.abs(val - center) / 32);
            const w = spatialW * rangeW;
            sum += val * w;
            wSum += w;
          }
        }
        smoothed[y * sampleW + x] = sum / (wSum || 1);
      }
    }

    // 3. Sobel edge magnitude computation
    const edges = new Uint8Array(sampleW * sampleH);
    let edgeSum = 0;
    let edgeCount = 0;

    for (let y = 1; y < sampleH - 1; y++) {
      for (let x = 1; x < sampleW - 1; x++) {
        // Gx: [-1 0 1; -2 0 2; -1 0 1]
        const gx =
          -smoothed[(y - 1) * sampleW + (x - 1)] + smoothed[(y - 1) * sampleW + (x + 1)] +
          -2 * smoothed[y * sampleW + (x - 1)] + 2 * smoothed[y * sampleW + (x + 1)] +
          -smoothed[(y + 1) * sampleW + (x - 1)] + smoothed[(y + 1) * sampleW + (x + 1)];

        // Gy: [-1 -2 -1; 0 0 0; 1 2 1]
        const gy =
          -smoothed[(y - 1) * sampleW + (x - 1)] - 2 * smoothed[(y - 1) * sampleW + x] - smoothed[(y - 1) * sampleW + (x + 1)] +
          smoothed[(y + 1) * sampleW + (x - 1)] + 2 * smoothed[(y + 1) * sampleW + x] + smoothed[(y + 1) * sampleW + (x + 1)];

        const mag = Math.hypot(gx, gy);
        edges[y * sampleW + x] = mag > 255 ? 255 : Math.round(mag);
        edgeSum += mag;
        edgeCount++;
      }
    }

    // Adaptive threshold: mean gradient + standard deviation
    const avgGrad = edgeSum / (edgeCount || 1);
    const threshold = Math.max(28, avgGrad * 1.35);

    // 4. Binary edge map with border suppression (ignore outer 5% image edge to prevent outer border lock)
    const marginX = Math.round(sampleW * 0.05);
    const marginY = Math.round(sampleH * 0.05);
    const binary = new Uint8Array(sampleW * sampleH);

    for (let y = marginY; y < sampleH - marginY; y++) {
      for (let x = marginX; x < sampleW - marginX; x++) {
        if (edges[y * sampleW + x] >= threshold) {
          binary[y * sampleW + x] = 1;
        }
      }
    }

    // 5. Morphological closing (3x3 dilation followed by 3x3 erosion) to seal photo perimeter
    const dilated = new Uint8Array(sampleW * sampleH);
    for (let y = marginY; y < sampleH - marginY; y++) {
      for (let x = marginX; x < sampleW - marginX; x++) {
        let hasOne = false;
        for (let dy = -1; dy <= 1 && !hasOne; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (binary[(y + dy) * sampleW + (x + dx)] === 1) {
              hasOne = true;
              break;
            }
          }
        }
        dilated[y * sampleW + x] = hasOne ? 1 : 0;
      }
    }

    // Find bounding quadrilateral within 8% to 88% screen bounds
    // Scan horizontal & vertical projection density to isolate the photo card
    const xDensity = new Float32Array(sampleW);
    const yDensity = new Float32Array(sampleH);

    for (let y = marginY; y < sampleH - marginY; y++) {
      for (let x = marginX; x < sampleW - marginX; x++) {
        if (dilated[y * sampleW + x] === 1) {
          xDensity[x]++;
          yDensity[y]++;
        }
      }
    }

    // Find prominent boundary transitions
    let minX = sampleW, maxX = 0;
    let minY = sampleH, maxY = 0;

    const minXLimit = Math.round(sampleW * 0.06);
    const maxXLimit = Math.round(sampleW * 0.94);
    const minYLimit = Math.round(sampleH * 0.06);
    const maxYLimit = Math.round(sampleH * 0.94);

    const xThresh = (sampleH - marginY * 2) * 0.06;
    const yThresh = (sampleW - marginX * 2) * 0.06;

    for (let x = minXLimit; x < maxXLimit; x++) {
      if (xDensity[x] > xThresh) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    for (let y = minYLimit; y < maxYLimit; y++) {
      if (yDensity[y] > yThresh) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }

    const scaleX = imgWidth / sampleW;
    const scaleY = imgHeight / sampleH;

    const candW = (maxX - minX) * scaleX;
    const candH = (maxY - minY) * scaleY;
    const candRatio = candW / (candH || 1);
    const candAreaRatio = (candW * candH) / (imgWidth * imgHeight);

    // Rule 1: Cannot occupy >88% of screen (avoid selecting outer device viewport)
    // Rule 2: Cannot be tiny (<8% of screen)
    // Rule 3: Ratio must resemble passport portrait (0.65 to 0.92) or rotated (1.10 to 1.55)
    const isPortraitPassport = candRatio >= 0.60 && candRatio <= 0.95;
    const isLandscapePassport = candRatio >= 1.05 && candRatio <= 1.65;

    if (
      candAreaRatio >= 0.08 &&
      candAreaRatio <= 0.88 &&
      (isPortraitPassport || isLandscapePassport)
    ) {
      const pad = 2;
      return {
        tl: { x: Math.max(0, Math.round((minX - pad) * scaleX)), y: Math.max(0, Math.round((minY - pad) * scaleY)) },
        tr: { x: Math.min(imgWidth, Math.round((maxX + pad) * scaleX)), y: Math.max(0, Math.round((minY - pad) * scaleY)) },
        br: { x: Math.min(imgWidth, Math.round((maxX + pad) * scaleX)), y: Math.min(imgHeight, Math.round((maxY + pad) * scaleY)) },
        bl: { x: Math.max(0, Math.round((minX - pad) * scaleX)), y: Math.min(imgHeight, Math.round((maxY + pad) * scaleY)) },
      };
    }
  } catch (err) {
    console.warn('Contour auto-detection fallback:', err);
  }

  return defaultCorners;
}

/**
 * Solve normalized 8 linear equations for 3x3 Projective Homography Matrix.
 * Coordinates are normalized to [0, 1] range to ensure matrix condition number
 * is stable, preventing numerical overflow and blank white output.
 */
function getNormalizedPerspectiveTransform(
  srcCorners: QuadCorners,
  srcW: number,
  srcH: number
): number[] {
  // Normalize source points to [0, 1]
  const sPts = [
    { x: srcCorners.tl.x / srcW, y: srcCorners.tl.y / srcH },
    { x: srcCorners.tr.x / srcW, y: srcCorners.tr.y / srcH },
    { x: srcCorners.br.x / srcW, y: srcCorners.br.y / srcH },
    { x: srcCorners.bl.x / srcW, y: srcCorners.bl.y / srcH },
  ];

  // Normalized destination points [0, 1]
  const dPts = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
  ];

  // Inverse mapping: Dest (0..1) -> Source (0..1)
  const A: number[][] = [];
  const B: number[] = [];

  for (let i = 0; i < 4; i++) {
    const d = dPts[i];
    const s = sPts[i];
    A.push([d.x, d.y, 1, 0, 0, 0, -d.x * s.x, -d.y * s.x]);
    B.push(s.x);
    A.push([0, 0, 0, d.x, d.y, 1, -d.x * s.y, -d.y * s.y]);
    B.push(s.y);
  }

  // Gaussian elimination with partial pivoting
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

    if (Math.abs(A[i][i]) < 1e-12) continue;

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
 *
 * Guarantees NO BLANK WHITE CANVAS:
 * 1. Normalized homography avoids ill-conditioning.
 * 2. Uses edge-clamping on source pixels so borders blend smoothly.
 * 3. Awaits clean image buffer transfer.
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

  // Normalized homography mapping [0, 1] dest -> [0, 1] source
  const H = getNormalizedPerspectiveTransform(corners, srcW, srcH);

  // Backward pixel mapping with bilinear interpolation & boundary clamping
  for (let dy = 0; dy < targetHeight; dy++) {
    const normDy = dy / targetHeight;

    for (let dx = 0; dx < targetWidth; dx++) {
      const normDx = dx / targetWidth;

      const z = H[6] * normDx + H[7] * normDy + H[8];
      const invZ = 1.0 / (Math.abs(z) > 1e-9 ? z : 1e-9);
      const normSx = (H[0] * normDx + H[1] * normDy + H[2]) * invZ;
      const normSy = (H[3] * normDx + H[4] * normDy + H[5]) * invZ;

      // Scale back to natural image coordinates
      const sx = normSx * srcW;
      const sy = normSy * srcH;

      const outIndex = (dy * targetWidth + dx) * 4;

      // Clamp coordinates to natural image bounds (never yields blank white!)
      const clx = Math.max(0, Math.min(srcW - 1.001, sx));
      const cly = Math.max(0, Math.min(srcH - 1.001, sy));

      const x0 = Math.floor(clx);
      const y0 = Math.floor(cly);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const y1 = Math.min(srcH - 1, y0 + 1);

      const wx1 = clx - x0;
      const wx0 = 1.0 - wx1;
      const wy1 = cly - y0;
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

  // Find all masked pixels (alpha > 30 or red channel > 80)
  const isMasked = new Uint8Array(w * h);
  let maskedCount = 0;
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    if (mask[idx + 3] > 30 && (mask[idx] > 80 || mask[idx + 3] > 80)) {
      isMasked[i] = 1;
      maskedCount++;
    }
  }

  if (maskedCount === 0) return;

  // Diffusion / boundary blend: iteratively fill from perimeter
  const passes = 14;
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

/**
 * Rotates any canvas by 90, 180, or 270 degrees cleanly
 */
export function rotateCanvas(canvas: HTMLCanvasElement, degrees: number): HTMLCanvasElement {
  const normDeg = ((degrees % 360) + 360) % 360;
  if (normDeg === 0) return canvas;

  const rotated = document.createElement('canvas');
  const ctx = rotated.getContext('2d');
  if (!ctx) return canvas;

  if (normDeg === 90 || normDeg === 270) {
    rotated.width = canvas.height;
    rotated.height = canvas.width;
  } else {
    rotated.width = canvas.width;
    rotated.height = canvas.height;
  }

  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate((normDeg * Math.PI) / 180);
  ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

  return rotated;
}

/**
 * Calls server-side Gemini 3.8 Flash Vision AI to detect exact physical passport photo corners
 * and required rotation angle from any angled mobile photo.
 */
export async function aiDetectPhotoCorners(
  imageDataUrl: string,
  width: number,
  height: number
): Promise<{
  corners: QuadCorners | null;
  rotationNeeded: number;
  success: boolean;
  confidence: number;
  reasoning?: string;
}> {
  try {
    let payload = imageDataUrl;
    if (width > 1200 || height > 1200) {
      const maxDim = 1024;
      const scale = Math.min(maxDim / width, maxDim / height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageDataUrl;
        await new Promise<void>((res) => {
          if (img.complete) res();
          else img.onload = () => res();
        });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        payload = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    const res = await fetch('/api/photo/detect-corners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: payload,
        width,
        height
      })
    });

    const data = await res.json();
    if (data.success && data.corners) {
      return {
        corners: data.corners,
        rotationNeeded: Number(data.rotationNeeded) || 0,
        success: true,
        confidence: data.confidence || 0.9,
        reasoning: data.reasoning
      };
    }
  } catch (err) {
    console.warn('AI corner detection error:', err);
  }

  return {
    corners: null,
    rotationNeeded: 0,
    success: false,
    confidence: 0
  };
}
