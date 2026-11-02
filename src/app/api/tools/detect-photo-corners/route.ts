import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 30;

interface RawCorner {
  x: number;
  y: number;
}

/**
 * Topologically sorts 4 arbitrary quadrilateral corner points into
 * [Top-Left (tl), Top-Right (tr), Bottom-Right (br), Bottom-Left (bl)].
 */
function sortQuadCorners(pts: RawCorner[]): { tl: RawCorner; tr: RawCorner; br: RawCorner; bl: RawCorner } {
  if (pts.length < 4) {
    throw new Error('Expected at least 4 corner points');
  }

  // Centroid
  const cx = pts.slice(0, 4).reduce((sum, p) => sum + p.x, 0) / 4;
  const cy = pts.slice(0, 4).reduce((sum, p) => sum + p.y, 0) / 4;

  // Sort by polar angle around centroid in clockwise order
  const sorted = [...pts.slice(0, 4)].sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });

  // Top-left is point with smallest (x + y)
  let minSumIndex = 0;
  let minSum = Infinity;
  for (let i = 0; i < 4; i++) {
    const sum = sorted[i].x + sorted[i].y;
    if (sum < minSum) {
      minSum = sum;
      minSumIndex = i;
    }
  }

  const tl = sorted[minSumIndex];
  const tr = sorted[(minSumIndex + 1) % 4];
  const br = sorted[(minSumIndex + 2) % 4];
  const bl = sorted[(minSumIndex + 3) % 4];

  return { tl, tr, br, bl };
}

/**
 * Gemini Flash Vision endpoint (/api/tools/detect-photo-corners)
 * Detects the 4 exact corner coordinates of printed photo paper held in the image.
 * Ignores hands, skin, plastic covers, or backgrounds.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, image, width, height } = body;
    const rawImage = imageBase64 || image;

    if (!rawImage) {
      return NextResponse.json({
        success: false,
        error: 'Image data is required'
      }, { status: 400 });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        fallback: true,
        error: 'GEMINI_API_KEY is not configured in environment variables.',
        message: 'GEMINI_API_KEY missing from server environment.'
      }, { status: 200 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-passport-extractor',
        }
      }
    });

    let mimeType = 'image/jpeg';
    const mimeMatch = rawImage.match(/^data:([^;]+);base64,/);
    if (mimeMatch && mimeMatch[1]) {
      mimeType = mimeMatch[1];
    }
    const cleanImg = rawImage.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    // User's exact prompt specification:
    const prompt = `Detect the 4 exact corner coordinates of the printed photo paper held in the image. Ignore hands, skin, plastic covers, or backgrounds. Return strictly JSON: { "corners": [{"x": x1, "y": y1}, {"x": x2, "y": y2}, {"x": x3, "y": y3}, {"x": x4, "y": y4}] }`;

    const candidateModels = [
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview'
    ];

    let responseText = '';
    let usedModel = '';
    let lastErrorMsg = '';

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanImg,
                  mimeType: mimeType
                }
              },
              {
                text: prompt
              }
            ]
          },
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response && response.text) {
          responseText = response.text;
          usedModel = modelName;
          break;
        }
      } catch (mErr: unknown) {
        const err = mErr as Error;
        lastErrorMsg = err.message || String(mErr);
        console.warn(`Vision model ${modelName} corner detection attempt failed:`, lastErrorMsg);
      }
    }

    if (!responseText) {
      return NextResponse.json({
        success: false,
        fallback: true,
        error: lastErrorMsg || 'Could not reach vision model API.',
        message: lastErrorMsg
      }, { status: 200 });
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({
        success: false,
        fallback: true,
        error: 'Gemini did not return valid JSON'
      }, { status: 200 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    let rawCornersArray: Array<{ x: number; y: number }> | null = null;
    if (Array.isArray(parsed.corners) && parsed.corners.length >= 4) {
      rawCornersArray = parsed.corners;
    } else if (Array.isArray(parsed) && parsed.length >= 4) {
      rawCornersArray = parsed;
    } else if (parsed.corners && typeof parsed.corners === 'object') {
      const c = parsed.corners;
      if (c.tl && c.tr && c.br && c.bl) {
        rawCornersArray = [c.tl, c.tr, c.br, c.bl];
      }
    }

    if (!rawCornersArray || rawCornersArray.length < 4) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'Could not isolate 4 photo paper corner coordinates.'
      }, { status: 200 });
    }

    const imgW = Number(width) > 0 ? Number(width) : 1000;
    const imgH = Number(height) > 0 ? Number(height) : 1000;

    // Detect coordinate normalization
    const maxX = Math.max(...rawCornersArray.map(p => Number(p.x) || 0));
    const maxY = Math.max(...rawCornersArray.map(p => Number(p.y) || 0));

    const scaledCorners: RawCorner[] = rawCornersArray.map(p => {
      let px = Number(p.x) || 0;
      let py = Number(p.y) || 0;

      if (maxX <= 1.05 && maxY <= 1.05) {
        // [0..1] normalized
        px = px * imgW;
        py = py * imgH;
      } else if (maxX <= 1005 && maxY <= 1005 && (imgW > 1000 || imgH > 1000)) {
        // [0..1000] normalized
        px = (px / 1000) * imgW;
        py = (py / 1000) * imgH;
      }

      return {
        x: Math.max(0, Math.min(imgW, Math.round(px))),
        y: Math.max(0, Math.min(imgH, Math.round(py)))
      };
    });

    const sortedCorners = sortQuadCorners(scaledCorners);

    return NextResponse.json({
      success: true,
      modelUsed: usedModel,
      corners: sortedCorners,
      rawCorners: scaledCorners
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in /api/tools/detect-photo-corners:', error);
    return NextResponse.json({
      success: false,
      fallback: true,
      error: err.message || 'Failed to detect photo corners'
    }, { status: 200 });
  }
}
