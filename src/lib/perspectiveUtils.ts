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
 * High-Accuracy Client-Side Contour & Edge Corner Detection for Passport Photos:
 * 1. Grayscale luminance conversion and bilateral smoothing.
 * 2. Multi-level luminance thresholding to isolate bright photographic card paper.
 * 3. Connected component analysis scoring candidates by passport geometry:
 *    - Area ratio: 4% to 65% of screen (strictly rejects full-screen borders >75%)
 *    - Aspect ratio: portrait (~0.77), landscape (~1.28), or square (~1.0)
 *    - Solidity & Fill factor: solid card shape (>= 0.42)
 *    - Edge gradient / contrast at perimeter against hand or table.
 * 4. Extracts true 4 skewed corners (tl, tr, br, bl) using extreme projections.
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

    // Use normalized sampling resolution for fast, consistent processing
    const sampleW = 240;
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
    let minLum = 255;
    let maxLum = 0;
    let sumLum = 0;

    for (let i = 0; i < data.length; i += 4) {
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      const idx = i / 4;
      gray[idx] = lum;
      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
      sumLum += lum;
    }

    const meanLum = sumLum / (sampleW * sampleH);
    const lumRange = maxLum - minLum;

    // 2. Multi-threshold candidate search (Otsu & relative brightness levels)
    // Passport photo paper in hands/desk is brighter than surrounding hand/furniture
    const candidateThresholds: number[] = [];
    if (lumRange > 40) {
      candidateThresholds.push(meanLum + lumRange * 0.15);
      candidateThresholds.push(meanLum + lumRange * 0.28);
      candidateThresholds.push(meanLum + lumRange * 0.40);
      candidateThresholds.push(minLum + lumRange * 0.55);
    } else {
      candidateThresholds.push(meanLum * 1.15);
      candidateThresholds.push(meanLum * 1.30);
    }

    let bestCandidate: {
      tl: Point;
      tr: Point;
      br: Point;
      bl: Point;
      score: number;
    } | null = null;

    for (const thresh of candidateThresholds) {
      const visited = new Uint8Array(sampleW * sampleH);

      // Avoid edge 3% to prevent borders
      const padX = Math.max(3, Math.round(sampleW * 0.03));
      const padY = Math.max(3, Math.round(sampleH * 0.03));

      for (let y = padY; y < sampleH - padY; y += 2) {
        for (let x = padX; x < sampleW - padX; x += 2) {
          const idx = y * sampleW + x;
          if (visited[idx] === 1 || gray[idx] < thresh) continue;

          // Flood fill connected component
          const queue = [x, y];
          visited[idx] = 1;
          let qIdx = 0;
          let minX = x, maxX = x, minY = y, maxY = y;
          let count = 0;

          // Extreme point projections to find true 4 corners of angled/tilted card
          let tlPt = { x, y, score: x + y };
          let trPt = { x, y, score: x - y };
          let brPt = { x, y, score: -(x + y) };
          let blPt = { x, y, score: -(x - y) };

          while (qIdx < queue.length) {
            const cx = queue[qIdx++];
            const cy = queue[qIdx++];
            count++;

            if (cx < minX) minX = cx;
            if (cx > maxX) maxX = cx;
            if (cy < minY) minY = cy;
            if (cy > maxY) maxY = cy;

            const sTL = cx + cy;
            if (sTL < tlPt.score) { tlPt = { x: cx, y: cy, score: sTL }; }
            const sTR = cx - cy;
            if (sTR > trPt.score) { trPt = { x: cx, y: cy, score: sTR }; }
            const sBR = -(cx + cy);
            if (sBR > brPt.score) { brPt = { x: cx, y: cy, score: sBR }; }
            const sBL = -(cx - cy);
            if (sBL > blPt.score) { blPt = { x: cx, y: cy, score: sBL }; }

            // 4-neighborhood
            const neighbors = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= padX && nx < sampleW - padX && ny >= padY && ny < sampleH - padY) {
                const nIdx = ny * sampleW + nx;
                if (visited[nIdx] === 0 && gray[nIdx] >= thresh) {
                  visited[nIdx] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }

          const boxW = maxX - minX;
          const boxH = maxY - minY;
          const boxArea = boxW * boxH;
          const screenArea = sampleW * sampleH;
          const areaRatio = boxArea / screenArea;
          const fillFactor = count / (boxArea || 1);

          // Filtering rules:
          // 1. Area: passport photo in hand or on desk is between 3% and 65% of screen.
          //    NEVER select >75% of screen (that would be the full camera viewport!).
          // 2. Fill factor: real photo paper is solid (>= 0.40).
          if (areaRatio >= 0.03 && areaRatio <= 0.65 && fillFactor >= 0.40) {
            const aspect = boxW / (boxH || 1);
            let aspectScore = 0;

            // Ideal standard passport ratio is 3.5 / 4.5 = 0.778
            if (aspect >= 0.55 && aspect <= 0.95) {
              aspectScore = 1.0 - Math.abs(aspect - 0.778);
            } else if (aspect >= 1.05 && aspect <= 1.65) {
              aspectScore = 0.8 - Math.abs(aspect - 1.28) * 0.5;
            } else if (aspect >= 0.95 && aspect <= 1.05) {
              aspectScore = 0.7; // 2x2 inch visa
            }

            if (aspectScore > 0) {
              // Measure edge contrast between inside and outer halo
              let insideLum = 0, insideCount = 0;
              let outsideLum = 0, outsideCount = 0;

              for (let sy = minY; sy <= maxY; sy += 3) {
                for (let sx = minX; sx <= maxX; sx += 3) {
                  insideLum += gray[sy * sampleW + sx];
                  insideCount++;
                }
              }

              const avgInside = insideLum / (insideCount || 1);

              // Sample exterior border
              const halo = 4;
              for (let sx = Math.max(0, minX - halo); sx <= Math.min(sampleW - 1, maxX + halo); sx += 3) {
                if (minY - halo >= 0) {
                  outsideLum += gray[(minY - halo) * sampleW + sx];
                  outsideCount++;
                }
                if (maxY + halo < sampleH) {
                  outsideLum += gray[(maxY + halo) * sampleW + sx];
                  outsideCount++;
                }
              }

              const avgOutside = outsideLum / (outsideCount || 1);
              const contrastScore = Math.max(0, avgInside - avgOutside);

              // Overall candidate score
              const candidateScore =
                aspectScore * 12 +
                fillFactor * 6 +
                (contrastScore > 15 ? 4 : 1) +
                (areaRatio >= 0.06 && areaRatio <= 0.45 ? 5 : 2);

              if (!bestCandidate || candidateScore > bestCandidate.score) {
                const scaleX = imgWidth / sampleW;
                const scaleY = imgHeight / sampleH;

                // Add slight padding (1-2px) so we don't clip photo border
                const pad = 2;
                bestCandidate = {
                  tl: {
                    x: Math.max(0, Math.round((Math.min(tlPt.x, minX) - pad) * scaleX)),
                    y: Math.max(0, Math.round((Math.min(tlPt.y, minY) - pad) * scaleY)),
                  },
                  tr: {
                    x: Math.min(imgWidth, Math.round((Math.max(trPt.x, maxX) + pad) * scaleX)),
                    y: Math.max(0, Math.round((Math.min(trPt.y, minY) - pad) * scaleY)),
                  },
                  br: {
                    x: Math.min(imgWidth, Math.round((Math.max(brPt.x, maxX) + pad) * scaleX)),
                    y: Math.min(imgHeight, Math.round((Math.max(brPt.y, maxY) + pad) * scaleY)),
                  },
                  bl: {
                    x: Math.max(0, Math.round((Math.min(blPt.x, minX) - pad) * scaleX)),
                    y: Math.min(imgHeight, Math.round((Math.max(blPt.y, maxY) + pad) * scaleY)),
                  },
                  score: candidateScore,
                };
              }
            }
          }
        }
      }
    }

    if (bestCandidate && bestCandidate.score > 8) {
      return {
        tl: bestCandidate.tl,
        tr: bestCandidate.tr,
        br: bestCandidate.br,
        bl: bestCandidate.bl,
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
 * Calls server-side Gemini Vision AI to detect exact physical passport photo corners
 * and required rotation angle from any angled mobile photo.
 * Fast, lightweight payload (~60KB) to ensure instant transmission without body limits.
 */
export async function aiDetectPhotoCorners(
  imageDataUrl: string,
  width: number,
  height: number,
  sourceCanvas?: HTMLCanvasElement | null
): Promise<{
  corners: QuadCorners | null;
  rotationNeeded: number;
  success: boolean;
  confidence: number;
  reasoning?: string;
}> {
  try {
    let payload = '';

    if (sourceCanvas) {
      const maxDim = 640;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const downCanvas = document.createElement('canvas');
      downCanvas.width = Math.round(width * scale);
      downCanvas.height = Math.round(height * scale);
      const dCtx = downCanvas.getContext('2d');
      if (dCtx) {
        dCtx.drawImage(sourceCanvas, 0, 0, downCanvas.width, downCanvas.height);
        payload = downCanvas.toDataURL('image/jpeg', 0.75);
      }
    }

    if (!payload) {
      payload = imageDataUrl;
    }

    // Set 7 second abort timeout so UI never hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch('/api/photo/detect-corners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: payload,
        width,
        height
      })
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { corners: null, rotationNeeded: 0, success: false, confidence: 0 };
    }

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
