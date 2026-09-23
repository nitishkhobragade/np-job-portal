import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { title, dept, totalPosts, qualification, category, state } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured on the server.' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a Senior Government Job Career Counselor & Editorial Journalist for "NP Job Portal" (operated by Nitish Khobragade, Helpline 8982324497).
Write a high-quality, comprehensive, humanized Hindi explanation for the following job recruitment:
- Title: ${title || 'Government Job Vacancy'}
- Department: ${dept || 'Official Department'}
- Total Posts: ${totalPosts || 'विज्ञप्ति अनुसार'}
- Qualification: ${qualification || 'विज्ञप्ति अनुसार'}
- State: ${state || 'MP'}
- Category: ${category || 'Govt Jobs'}

You must provide a structured JSON response with the following keys:
{
  "description": "3-4 concise paragraphs in Hindi explaining: (1) यह भर्ती क्या है और विभाग का मुख्य कार्य क्या है (2) चयनित होने पर उम्मीदवार को क्या कार्य करना होगा / Work Profile (3) यह भर्ती क्यों महत्वपूर्ण है",
  "roleOverview": "चयनित कर्मचारी की मुख्य जिम्मेदारियां और कार्यक्षेत्र (Work Profile)",
  "selectionProcess": "चरणबद्ध चयन प्रक्रिया (CBT परीक्षा, ट्रेड/कौशल टेस्ट, शारीरिक परीक्षा, दस्तावेज सत्यापन आदि)",
  "requiredDocuments": [
    "आधार कार्ड (मोबाइल नंबर लिंक)",
    "10वीं/12वीं अंकसूची",
    "संबंधित योग्यता डिग्री/डिप्लोमा/सर्टिफिकेट",
    "जाति प्रमाण पत्र एवं मूल निवासी प्रमाण पत्र",
    "मध्य प्रदेश का जीवित रोजगार पंजीयन (यदि MP की भर्ती हो)",
    "पासपोर्ट साइज फोटो एवं हस्ताक्षर"
  ]
}

Ensure the Hindi is clear, natural, encouraging, and authoritative. Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON for description');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: parsed
    });
  } catch (error: unknown) {
    console.error('Error generating job description:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to generate job description' },
      { status: 500 }
    );
  }
}
