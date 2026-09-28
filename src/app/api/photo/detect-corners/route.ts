import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, width, height } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'GEMINI_API_KEY is not configured on the server.'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const cleanImg = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const prompt = `You are a world-class AI computer vision assistant specializing in document scanning and passport photo extraction.
Analyze this photo taken by a smartphone.
In this scene, a physical printed passport-sized photo (or ID photo card) is visible. It might be held in human fingers/hands, placed inside a plastic sleeve/pouch, or lying on a paper/desk/bedsheet.

YOUR MISSION:
1. Locate the physical passport photo print held in hand or on surface.
2. Return strictly the normalized coordinates bounding the inner photo paper print itself:
   - NOT the fingers or hands holding it.
   - NOT the plastic pouch or envelope border.
   - NOT the desk, paper, or background.
   - Strictly the 4 corners of the inner printed photo paper!
3. Determine if the photo is rotated and what clockwise rotation (0, 90, 180, or 270 degrees) is needed to make the person's face upright (head at the top, chin at the bottom, upright posture).
4. Return normalized coordinates from 0 to 1000 (where x=0 is left edge, x=1000 is right edge, y=0 is top edge, y=1000 is bottom edge).

Return a JSON object in this exact schema:
{
  "found": true,
  "confidence": 0.96,
  "corners": {
    "tl": { "x": 280, "y": 320 },
    "tr": { "x": 620, "y": 360 },
    "br": { "x": 560, "y": 740 },
    "bl": { "x": 220, "y": 700 }
  },
  "boundingBox": {
    "ymin": 320,
    "xmin": 220,
    "ymax": 740,
    "xmax": 620
  },
  "rotationNeeded": 0,
  "reasoning": "Detected inner printed passport photo held in fingers. Excluded fingers and surrounding plastic pouch."
}

If no distinct physical photo print can be isolated, return:
{ "found": false, "corners": null, "rotationNeeded": 0 }

Respond ONLY with valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanImg,
              mimeType: 'image/jpeg'
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

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.found || !parsed.corners) {
      return NextResponse.json({
        success: false,
        fallback: true,
        message: 'Could not confidently isolate passport photo corners'
      });
    }

    // Convert 0..1000 normalized coords to actual image dimensions
    const w = Number(width) || 1000;
    const h = Number(height) || 1000;

    const corners = {
      tl: {
        x: Math.max(0, Math.min(w, Math.round((parsed.corners.tl.x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((parsed.corners.tl.y / 1000) * h)))
      },
      tr: {
        x: Math.max(0, Math.min(w, Math.round((parsed.corners.tr.x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((parsed.corners.tr.y / 1000) * h)))
      },
      br: {
        x: Math.max(0, Math.min(w, Math.round((parsed.corners.br.x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((parsed.corners.br.y / 1000) * h)))
      },
      bl: {
        x: Math.max(0, Math.min(w, Math.round((parsed.corners.bl.x / 1000) * w))),
        y: Math.max(0, Math.min(h, Math.round((parsed.corners.bl.y / 1000) * h)))
      }
    };

    const rotationNeeded = Number(parsed.rotationNeeded) || 0;

    return NextResponse.json({
      success: true,
      corners,
      normalizedCorners: parsed.corners,
      rotationNeeded,
      confidence: parsed.confidence || 0.95,
      reasoning: parsed.reasoning || ''
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
