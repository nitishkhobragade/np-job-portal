import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 30;

/**
 * AI Photo Corner Detection Route
 * Re-uses the passport extraction engine for maximum accuracy.
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
        message: 'GEMINI_API_KEY is missing from environment. Please redeploy in Vercel.'
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

    const prompt = `You are an expert computer vision bounding system specialized in physical passport photos.

CRITICAL TARGET INSTRUCTION - INNER PHOTO CARD VS OUTER PACKAGING:
- The user has taken a mobile photo of a printed passport photo print (often held in fingers, on a desk, or INSIDE A TRANSPARENT OR TRANSLUCENT PLASTIC POUCH, SLEEVE, OR BAG).
- DO NOT detect or bound the outer plastic pouch, polythene sleeve, plastic packaging margins, fingers, palm, or background!
- LOOK INSIDE THE PACKET: Locate the ACTUAL INNER RECTANGULAR PAPER PHOTO PRINT CARD containing the human face, hair, shirt, and candidate name/date text (e.g. "YASH SONTAKE", date, etc.) on white/light paper with a distinct photo border.
- The 4 corners MUST tightly and strictly enclose ONLY the 4 corners of that INNER PRINTED PHOTO PAPER CARD itself.

Detect its exact 4 corner points in clockwise order starting from Top-Left:
[
  {"x": normalized_x_TL, "y": normalized_y_TL},
  {"x": normalized_x_TR, "y": normalized_y_TR},
  {"x": normalized_x_BR, "y": normalized_y_BR},
  {"x": normalized_x_BL, "y": normalized_y_BL}
]
Note: The photo might be tilted/skewed at an angle. Return the actual rotated 4 corners of the photo paper itself, NOT an upright bounding box, and do NOT include surrounding fingers, plastic pouches, or background. Coordinates must be normalized (0 to 1000). Map the returned coordinates directly to the canvas overlay so the 4 corners align directly onto the tilted photo corners.

Also determine if the inner photo is rotated and what clockwise degrees (0, 90, 180, or 270) is needed to make the human face upright.

Respond with a JSON object in this exact schema:
{
  "found": true,
  "confidence": 0.98,
  "corners": [
    {"x": normalized_x_TL, "y": normalized_y_TL},
    {"x": normalized_x_TR, "y": normalized_y_TR},
    {"x": normalized_x_BR, "y": normalized_y_BR},
    {"x": normalized_x_BL, "y": normalized_y_BL}
  ],
  "rotationNeeded": 0,
  "reasoning": "Detected inner rotated passport photo card held in hand. Corners strictly bound inner photo paper."
}

If no distinct physical photo print can be isolated, return:
{ "found": false, "corners": null, "rotationNeeded": 0 }

Respond ONLY with valid JSON.`;

    const candidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
      'gemini-flash-latest',
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
        console.warn(`Model ${modelName} corner detection attempt failed:`, lastErrorMsg);
      }
    }

    if (!responseText) {
      return NextResponse.json({
        success: false,
        fallback: true,
        error: lastErrorMsg || 'Could not reach vision model API.',
        message: lastErrorMsg.includes('API_KEY_INVALID') || lastErrorMsg.includes('API key not valid')
          ? 'Gemini API Key अमान्य (Invalid) है। कृपया aistudio.google.com से सही API key प्राप्त करें।'
          : lastErrorMsg || 'Could not reach vision model API.'
      }, { status: 200 });
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    let rawCornersArray: Array<{ x: number; y: number }> | null = null;
    let rotationNeeded = 0;
    let confidence = 0.95;
    let reasoning = '';

    if (Array.isArray(parsed)) {
      rawCornersArray = parsed;
    } else if (parsed && typeof parsed === 'object') {
      rotationNeeded = Number(parsed.rotationNeeded) || 0;
      confidence = Number(parsed.confidence) || 0.95;
      reasoning = parsed.reasoning || '';

      if (Array.isArray(parsed.corners) && parsed.corners.length >= 4) {
        rawCornersArray = parsed.corners;
      } else if (parsed.corners && typeof parsed.corners === 'object') {
        const c = parsed.corners;
        if (c.tl && c.tr && c.br && c.bl) {
          rawCornersArray = [c.tl, c.tr, c.br, c.bl];
        }
      } else if (Array.isArray(parsed.points) && parsed.points.length >= 4) {
        rawCornersArray = parsed.points;
      }
    }

    if (!rawCornersArray || rawCornersArray.length < 4) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'Could not confidently isolate passport photo corners'
      }, { status: 200 });
    }

    let isZeroToOne = true;
    for (let i = 0; i < 4; i++) {
      if (rawCornersArray[i].x > 1.05 || rawCornersArray[i].y > 1.05) {
        isZeroToOne = false;
        break;
      }
    }

    const normalizedPoints = rawCornersArray.slice(0, 4).map((pt) => ({
      x: isZeroToOne ? Math.round(pt.x * 1000) : Math.round(pt.x),
      y: isZeroToOne ? Math.round(pt.y * 1000) : Math.round(pt.y),
    }));

    const w = Number(width) || 1000;
    const h = Number(height) || 1000;

    const corners = {
      tl: {
        x: Math.max(0, Math.min(w, Math.round((normalizedPoints[0].x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((normalizedPoints[0].y / 1000) * h)))
      },
      tr: {
        x: Math.max(0, Math.min(w, Math.round((normalizedPoints[1].x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((normalizedPoints[1].y / 1000) * h)))
      },
      br: {
        x: Math.max(0, Math.min(w, Math.round((normalizedPoints[2].x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((normalizedPoints[2].y / 1000) * h)))
      },
      bl: {
        x: Math.max(0, Math.min(w, Math.round((normalizedPoints[3].x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((normalizedPoints[3].y / 1000) * h)))
      }
    };

    return NextResponse.json({
      success: true,
      corners,
      points: [
        corners.tl,
        corners.tr,
        corners.br,
        corners.bl
      ],
      normalizedCorners: {
        tl: normalizedPoints[0],
        tr: normalizedPoints[1],
        br: normalizedPoints[2],
        bl: normalizedPoints[3]
      },
      rotationNeeded,
      confidence,
      reasoning,
      model: usedModel
    });
  } catch (error: unknown) {
    console.error('Error detecting photo corners:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to detect photo corners', fallback: true },
      { status: 500 }
    );
  }
}
