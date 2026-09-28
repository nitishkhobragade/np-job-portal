import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const {
      imageBase64,
      maskBase64,
      mode = 'remove_object', // 'remove_object' | 'enhance'
      instruction = 'Remove the unwanted object, finger, shadow, or glare seamlessly matching surrounding skin, clothing, and background.'
    } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Graceful fallback to client-side inpainting
      return NextResponse.json({
        fallback: true,
        message: 'GEMINI_API_KEY not configured. Falling back to local smart inpainter.'
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const cleanImg = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
      {
        inlineData: {
          data: cleanImg,
          mimeType: 'image/jpeg'
        }
      }
    ];

    if (maskBase64) {
      const cleanMask = maskBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanMask,
          mimeType: 'image/png'
        }
      });
    }

    const promptText = mode === 'enhance'
      ? 'You are a professional passport photo restoration expert. Analyze this passport photo taken from a mobile camera. Provide precise color, white balance, contrast, sharpness, and background correction parameters for government job portal standards (SSC, MP Online, UPSC).'
      : `You are an advanced AI Object Remover (like Samsung/Realme gallery eraser). The user uploaded a photo with an unwanted object/finger/shadow highlighted. ${instruction}. Analyze the image geometry and provide restoration instructions.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: parts
    });

    const analysis = response.text || '';
    return NextResponse.json({
      success: true,
      analysis,
      enhanced: true
    });
  } catch (error: unknown) {
    console.error('Photo cleaner error:', error);
    const message = error instanceof Error ? error.message : 'Photo processing failed';
    return NextResponse.json({
      fallback: true,
      error: message
    });
  }
}
