import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt = 'Extract all text from this document accurately in original layout. Keep all Hindi and English words, roll numbers, marks, dates and headings intact.' } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data missing' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured', fallback: true }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Clean base64 prefix if present
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType.includes('pdf') ? 'application/pdf' : mimeType,
              },
            },
            {
              text: `${prompt}\nReturn ONLY the extracted text with proper line breaks and paragraphs. Do not add conversational comments or markdown codeblocks unless necessary.`,
            },
          ],
        },
      ],
    });

    const text = response.text || '';
    return NextResponse.json({ text, success: true });
  } catch (error: unknown) {
    console.error('OCR API Error:', error);
    const message = error instanceof Error ? error.message : 'OCR processing failed';
    return NextResponse.json(
      { error: message, fallback: true },
      { status: 500 }
    );
  }
}
