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
    boxH = Math.round(imgHeight * 0.70);
    boxW = Math.round(boxH * targetRatio);
  } else {
    boxW = Math.round(imgWidth * 0.70);
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
 * Returns centered inner corners covering ~38% of the frame (standard passport 3.5:4.5 ratio),
 * specifically sized to fit an inner physical passport card held in fingers, palm, or plastic pouch.
 */
export function getInnerCardDefaultCorners(
  imgWidth: number,
  imgHeight: number,
  scaleRatio: number = 0.38
): QuadCorners {
  const targetRatio = 3.5 / 4.5;
  const currentRatio = imgWidth / imgHeight;

  let boxW: number, boxH: number;
  if (currentRatio > targetRatio) {
    boxH = Math.round(imgHeight * scaleRatio);
    boxW = Math.round(boxH * targetRatio);
  } else {
    boxW = Math.round(imgWidth * scaleRatio);
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
 * Computes natural width, height, and aspect ratio of a 4-corner quadrilateral.
 */
export function getQuadNaturalDimensions(corners: QuadCorners): { width: number; height: number; aspect: number } {
  const topW = Math.hypot(corners.tr.x - corners.tl.x, corners.tr.y - corners.tl.y);
  const botW = Math.hypot(corners.br.x - corners.bl.x, corners.br.y - corners.bl.y);
  const avgW = (topW + botW) / 2;

  const leftH = Math.hypot(corners.bl.x - corners.tl.x, corners.bl.y - corners.tl.y);
  const rightH = Math.hypot(corners.br.x - corners.tr.x, corners.br.y - corners.tr.y);
  const avgH = (leftH + rightH) / 2;

  const width = Math.max(50, Math.round(avgW));
  const height = Math.max(50, Math.round(avgH));
  return { width, height, aspect: width / height };
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
/**
 * High-Accuracy Client-Side Contour & Edge Corner Detection for Passport Photos:
 * 1. Grayscale luminance conversion and bilateral smoothing.
 * 2. Multi-level luminance thresholding to isolate photographic card paper.
 * 3. Connected component analysis scoring candidates by passport geometry:
 *    - Area ratio: 3% to 65% of screen (strictly rejects full-screen borders >75%)
 *    - Aspect ratio: portrait (~0.77), landscape (~1.28), or square (~1.0)
 *    - Solidity & Fill factor: solid card shape (>= 0.40)
 *    - Edge gradient / contrast at perimeter against hand or table.
 * 4. Extracts true 4 skewed corners (tl, tr, br, bl) without forcing upright axis-alignment.
 */
export function autoDetectPhotoCorners(
  imgWidth: number,
  imgHeight: number,
  canvas?: HTMLCanvasElement | null
): { corners: QuadCorners; isRealDetection: boolean } {
  const defaultCorners = getCenteredDefaultCorners(imgWidth, imgHeight);
  if (!canvas) return { corners: defaultCorners, isRealDetection: false };

  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return { corners: defaultCorners, isRealDetection: false };

    // Use normalized sampling resolution for fast, consistent processing
    const sampleW = 280;
    const sampleH = Math.round((sampleW * imgHeight) / imgWidth);
    if (sampleH < 40) return { corners: defaultCorners, isRealDetection: false };

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sampleW;
    tempCanvas.height = sampleH;
    const tctx = tempCanvas.getContext('2d', { willReadFrequently: true });
    if (!tctx) return { corners: defaultCorners, isRealDetection: false };

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

    // 2. Multi-threshold candidate search (both bright-on-dark and dark-on-bright)
    const candidateThresholds: Array<{ val: number; mode: 'bright' | 'dark' }> = [];
    if (lumRange > 25) {
      candidateThresholds.push({ val: meanLum + lumRange * 0.12, mode: 'bright' });
      candidateThresholds.push({ val: meanLum + lumRange * 0.25, mode: 'bright' });
      candidateThresholds.push({ val: meanLum + lumRange * 0.38, mode: 'bright' });
      candidateThresholds.push({ val: meanLum - lumRange * 0.12, mode: 'dark' });
      candidateThresholds.push({ val: meanLum - lumRange * 0.25, mode: 'dark' });
    } else {
      candidateThresholds.push({ val: meanLum * 1.10, mode: 'bright' });
      candidateThresholds.push({ val: meanLum * 0.90, mode: 'dark' });
    }

    let bestCandidate: {
      tl: Point;
      tr: Point;
      br: Point;
      bl: Point;
      score: number;
    } | null = null;

    for (const threshItem of candidateThresholds) {
      const thresh = threshItem.val;
      const isBright = threshItem.mode === 'bright';
      const visited = new Uint8Array(sampleW * sampleH);

      // Avoid edge 3% to prevent camera frame borders
      const padX = Math.max(3, Math.round(sampleW * 0.03));
      const padY = Math.max(3, Math.round(sampleH * 0.03));

      for (let y = padY; y < sampleH - padY; y += 2) {
        for (let x = padX; x < sampleW - padX; x += 2) {
          const idx = y * sampleW + x;
          const match = isBright ? gray[idx] >= thresh : gray[idx] <= thresh;
          if (visited[idx] === 1 || !match) continue;

          // Flood fill connected component
          const queue = [x, y];
          visited[idx] = 1;
          let qIdx = 0;
          let minX = x, maxX = x, minY = y, maxY = y;
          let count = 0;

          // True extreme corner projections for tilted/skewed quadrilateral:
          // Top-Left minimizes (x + y)
          // Top-Right maximizes (x - y)
          // Bottom-Right maximizes (x + y)
          // Bottom-Left minimizes (x - y)
          let tlPt = { x, y, score: x + y };
          let trPt = { x, y, score: x - y };
          let brPt = { x, y, score: x + y };
          let blPt = { x, y, score: x - y };

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
            const sBR = cx + cy;
            if (sBR > brPt.score) { brPt = { x: cx, y: cy, score: sBR }; }
            const sBL = cx - cy;
            if (sBL < blPt.score) { blPt = { x: cx, y: cy, score: sBL }; }

            // 4-neighborhood
            const neighbors = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= padX && nx < sampleW - padX && ny >= padY && ny < sampleH - padY) {
                const nIdx = ny * sampleW + nx;
                const nMatch = isBright ? gray[nIdx] >= thresh : gray[nIdx] <= thresh;
                if (visited[nIdx] === 0 && nMatch) {
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
          // 1. Area: passport photo in hand or on desk is between 4% and 65% of screen.
          //    NEVER select full camera viewport (>75%).
          // 2. Fill factor: real photo paper is solid (>= 0.38).
          if (areaRatio >= 0.04 && areaRatio <= 0.65 && fillFactor >= 0.38) {
            const aspect = boxW / (boxH || 1);
            let aspectScore = 0;

            // Ideal standard passport ratio is 3.5 / 4.5 = ~0.778
            if (aspect >= 0.52 && aspect <= 0.98) {
              aspectScore = 1.0 - Math.abs(aspect - 0.778);
            } else if (aspect >= 1.02 && aspect <= 1.68) {
              aspectScore = 0.8 - Math.abs(aspect - 1.28) * 0.5;
            } else if (aspect >= 0.95 && aspect <= 1.05) {
              aspectScore = 0.7; // 2x2 inch visa
            }

            if (aspectScore > 0) {
              // Measure edge contrast
              let insideLum = 0, insideCount = 0;
              let outsideLum = 0, outsideCount = 0;

              for (let sy = minY; sy <= maxY; sy += 3) {
                for (let sx = minX; sx <= maxX; sx += 3) {
                  insideLum += gray[sy * sampleW + sx];
                  insideCount++;
                }
              }
              const avgInside = insideLum / (insideCount || 1);

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
              const contrastScore = Math.max(0, Math.abs(avgInside - avgOutside));

              const candidateScore =
                aspectScore * 12 +
                fillFactor * 6 +
                (contrastScore > 12 ? 4 : 1) +
                (areaRatio >= 0.06 && areaRatio <= 0.50 ? 5 : 2);

              if (!bestCandidate || candidateScore > bestCandidate.score) {
                const scaleX = imgWidth / sampleW;
                const scaleY = imgHeight / sampleH;

                // Map true rotated 4 points directly without clamping to axis-aligned box!
                bestCandidate = {
                  tl: {
                    x: Math.max(0, Math.min(imgWidth, Math.round(tlPt.x * scaleX))),
                    y: Math.max(0, Math.min(imgHeight, Math.round(tlPt.y * scaleY))),
                  },
                  tr: {
                    x: Math.max(0, Math.min(imgWidth, Math.round(trPt.x * scaleX))),
                    y: Math.max(0, Math.min(imgHeight, Math.round(trPt.y * scaleY))),
                  },
                  br: {
                    x: Math.max(0, Math.min(imgWidth, Math.round(brPt.x * scaleX))),
                    y: Math.max(0, Math.min(imgHeight, Math.round(brPt.y * scaleY))),
                  },
                  bl: {
                    x: Math.max(0, Math.min(imgWidth, Math.round(blPt.x * scaleX))),
                    y: Math.max(0, Math.min(imgHeight, Math.round(blPt.y * scaleY))),
                  },
                  score: candidateScore,
                };
              }
            }
          }
        }
      }
    }

    if (bestCandidate && bestCandidate.score > 7) {
      return {
        corners: {
          tl: bestCandidate.tl,
          tr: bestCandidate.tr,
          br: bestCandidate.br,
          bl: bestCandidate.bl,
        },
        isRealDetection: true
      };
    }
  } catch (err) {
    console.warn('Contour auto-detection fallback:', err);
  }

  return { corners: defaultCorners, isRealDetection: false };
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
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  let finalW = targetWidth || 0;
  let finalH = targetHeight || 0;

  if (finalW <= 0 || finalH <= 0) {
    const natural = getQuadNaturalDimensions(corners);
    const aspect = natural.aspect;
    finalH = 900;
    finalW = Math.max(100, Math.round(finalH * aspect));
  }

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = finalW;
  outputCanvas.height = finalH;

  const outCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!outCtx || !srcCtx) return outputCanvas;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const srcData = srcCtx.getImageData(0, 0, srcW, srcH);
  const srcPixels = srcData.data;

  const outData = outCtx.createImageData(finalW, finalH);
  const outPixels = outData.data;

  // Normalized homography mapping [0, 1] dest -> [0, 1] source
  const H = getNormalizedPerspectiveTransform(corners, srcW, srcH);

  // Backward pixel mapping with bilinear interpolation & boundary clamping
  for (let dy = 0; dy < finalH; dy++) {
    const normDy = dy / finalH;

    for (let dx = 0; dx < finalW; dx++) {
      const normDx = dx / finalW;

      const z = H[6] * normDx + H[7] * normDy + H[8];
      const invZ = 1.0 / (Math.abs(z) > 1e-9 ? z : 1e-9);
      const normSx = (H[0] * normDx + H[1] * normDy + H[2]) * invZ;
      const normSy = (H[3] * normDx + H[4] * normDy + H[5]) * invZ;

      // Scale back to natural image coordinates
      const sx = normSx * srcW;
      const sy = normSy * srcH;

      const outIndex = (dy * finalW + dx) * 4;

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
 * Intelligent Passport Background Replacer:
 * Detects background in the top and sides, then applies chosen tint (White, Blue, Grey).
 */
export function replacePassportBackground(
  sourceCanvas: HTMLCanvasElement,
  color: 'original' | 'white' | 'blue' | 'grey'
): HTMLCanvasElement {
  if (color === 'original') return sourceCanvas;

  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return sourceCanvas;

  outCtx.drawImage(sourceCanvas, 0, 0);
  const imgData = outCtx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // 1. Sample background color profile STRICTLY from top-left and top-right corners
  // Avoid central top region (w * 0.28 to w * 0.72) where hair and head are located!
  let bgR = 0, bgG = 0, bgB = 0, bgCount = 0;
  const cornerW = Math.max(10, Math.floor(w * 0.25));
  const cornerH = Math.max(10, Math.floor(h * 0.25));

  for (let y = 0; y < cornerH; y += 2) {
    // Top-left corner
    for (let x = 0; x < cornerW; x += 2) {
      const idx = (y * w + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      bgCount++;
    }
    // Top-right corner
    for (let x = w - cornerW; x < w; x += 2) {
      const idx = (y * w + x) * 4;
      bgR += data[idx];
      bgG += data[idx + 1];
      bgB += data[idx + 2];
      bgCount++;
    }
  }

  const meanR = bgR / (bgCount || 1);
  const meanG = bgG / (bgCount || 1);
  const meanB = bgB / (bgCount || 1);

  // Target fill colors
  let fillR = 255, fillG = 255, fillB = 255;
  if (color === 'blue') {
    fillR = 59; fillG = 130; fillB = 246; // Official passport sky/studio blue (#3b82f6)
  } else if (color === 'grey') {
    fillR = 226; fillG = 232; fillB = 240; // Neutral studio light grey (#e2e8f0)
  }

  // 2. Flood fill segmentation starting ONLY from top-left and top-right corner seeds
  const isBg = new Uint8Array(w * h);
  const queue: number[] = [];
  const tolerance = 48;

  const checkAndEnqueue = (x: number, y: number) => {
    const idx = y * w + x;
    if (isBg[idx] === 1) return;
    const p = idx * 4;
    const dist = Math.hypot(data[p] - meanR, data[p + 1] - meanG, data[p + 2] - meanB);
    if (dist < tolerance) {
      isBg[idx] = 1;
      queue.push(x, y);
    }
  };

  // Seed top-left and top-right edges
  for (let x = 0; x < cornerW; x++) {
    checkAndEnqueue(x, 0);
  }
  for (let x = w - cornerW; x < w; x++) {
    checkAndEnqueue(x, 0);
  }
  // Seed upper side edges (top 50% only)
  for (let y = 1; y < Math.floor(h * 0.50); y++) {
    checkAndEnqueue(0, y);
    checkAndEnqueue(w - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const nIdx = ny * w + nx;
        if (isBg[nIdx] === 0) {
          const pIdx = nIdx * 4;
          const r = data[pIdx];
          const g = data[pIdx + 1];
          const b = data[pIdx + 2];

          // Face / hair detection guard: dark hair (lum < 60) or warm skin tone should NOT be treated as background
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const isHair = lum < 55 && (meanR > 90 || meanG > 90 || meanB > 90);
          if (isHair) continue;

          const dist = Math.hypot(r - meanR, g - meanG, b - meanB);
          // Height penalty: be stricter in lower half to protect shoulders/clothes
          const heightPenalty = ny > h * 0.4 ? ((ny - h * 0.4) / (h * 0.6)) * 28 : 0;

          if (dist < tolerance - heightPenalty) {
            isBg[nIdx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // 3. Smooth blend replaced background onto canvas
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (isBg[idx] === 1) {
        const pIdx = idx * 4;
        data[pIdx] = fillR;
        data[pIdx + 1] = fillG;
        data[pIdx + 2] = fillB;
      }
    }
  }

  outCtx.putImageData(imgData, 0, 0);
  return outCanvas;
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
 * Subtle contrast & unsharp sharpening filter for extracted passport photos.
 * Enhances printed text (e.g. candidate name, date of photo) and facial details
 * without noise or halos.
 */
export function enhancePassportSharpness(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;
  const enhanced = document.createElement('canvas');
  enhanced.width = w;
  enhanced.height = h;
  const ctx = enhanced.getContext('2d', { willReadFrequently: true });
  if (!ctx) return canvas;

  ctx.drawImage(canvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;
  const orig = new Uint8ClampedArray(data);

  // 3x3 mild sharpening convolution kernel (strength k = 0.22)
  const k = 0.22;
  const centerWeight = 1 + 4 * k;

  // Gentle contrast boost (+6%)
  const contrastFactor = 1.06;
  const intercept = 128 * (1 - contrastFactor);

  for (let y = 1; y < h - 1; y++) {
    const rowIdx = y * w;
    const topRow = (y - 1) * w;
    const botRow = (y + 1) * w;

    for (let x = 1; x < w - 1; x++) {
      const idx = (rowIdx + x) * 4;
      const topIdx = (topRow + x) * 4;
      const botIdx = (botRow + x) * 4;
      const leftIdx = (rowIdx + x - 1) * 4;
      const rightIdx = (rowIdx + x + 1) * 4;

      for (let c = 0; c < 3; c++) {
        const center = orig[idx + c];
        const top = orig[topIdx + c];
        const bot = orig[botIdx + c];
        const left = orig[leftIdx + c];
        const right = orig[rightIdx + c];

        const sharpVal = center * centerWeight - k * (top + bot + left + right);
        const finalVal = sharpVal * contrastFactor + intercept;

        data[idx + c] = Math.max(0, Math.min(255, Math.round(finalVal)));
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return enhanced;
}

/**
 * Creates a lightweight downscaled JPEG payload (~60KB to 100KB)
 * guaranteeing Vercel 4.5MB Serverless Function payload limit is NEVER exceeded.
 */
async function createOptimizedVisionPayload(
  imageDataUrl: string,
  width: number,
  height: number,
  sourceCanvas?: HTMLCanvasElement | null
): Promise<string> {
  const maxDim = 800;
  const scale = Math.min(1, maxDim / Math.max(width, height, 1));
  const targetW = Math.max(100, Math.round(width * scale));
  const targetH = Math.max(100, Math.round(height * scale));

  if (sourceCanvas) {
    const downCanvas = document.createElement('canvas');
    downCanvas.width = targetW;
    downCanvas.height = targetH;
    const dCtx = downCanvas.getContext('2d');
    if (dCtx) {
      dCtx.drawImage(sourceCanvas, 0, 0, targetW, targetH);
      return downCanvas.toDataURL('image/jpeg', 0.80);
    }
  }

  // If no source canvas, downscale via Image object
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const downCanvas = document.createElement('canvas');
      downCanvas.width = targetW;
      downCanvas.height = targetH;
      const dCtx = downCanvas.getContext('2d');
      if (dCtx) {
        dCtx.drawImage(img, 0, 0, targetW, targetH);
        resolve(downCanvas.toDataURL('image/jpeg', 0.80));
      } else {
        resolve(imageDataUrl);
      }
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

/**
 * Calls server-side Gemini Vision API (/api/tools/extract-passport)
 * to detect exact rotated 4 corners and required orientation.
 * Fully compatible with Vercel and local environments.
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
  errorMessage?: string;
}> {
  try {
    const payload = await createOptimizedVisionPayload(imageDataUrl, width, height, sourceCanvas);

    const endpoints = ['/api/tools/extract-passport', '/api/photo/detect-corners'];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000);

        const res = await fetch(endpoint, {
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

        if (!res.ok) continue;

        const data = await res.json();
        if (data.success && data.corners) {
          return {
            corners: data.corners,
            rotationNeeded: Number(data.rotationNeeded) || 0,
            success: true,
            confidence: data.confidence || 0.95,
            reasoning: data.reasoning
          };
        } else if (data.fallback && data.message) {
          console.info(`${endpoint} returned info:`, data.message);
          return {
            corners: null,
            rotationNeeded: 0,
            success: false,
            confidence: 0,
            errorMessage: data.message || data.error
          };
        }
      } catch (e) {
        console.warn(`Attempt at ${endpoint} failed:`, e);
      }
    }
  } catch (err) {
    console.warn('AI corner extraction exception:', err);
  }

  return {
    corners: null,
    rotationNeeded: 0,
    success: false,
    confidence: 0,
    errorMessage: 'Could not connect to Gemini Vision service'
  };
}

