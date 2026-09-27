import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { title, content, category } = await req.json();

    if (!title && !content) {
      return NextResponse.json(
        { error: 'Please provide blog title or content to optimize' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: true,
          isAiOptimized: false,
          optimizedTitle: title,
          optimizedContent: content,
          excerpt: content?.slice(0, 160) || '',
          seoKeywords: ['NP Job Portal', 'Career Advice', 'Exam Preparation'],
          tags: ['Career', 'Exams']
        }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a Senior Editor-in-Chief, SEO Authority, and Career Counselor for NP Job Portal (A Unit of NTechBay, operated by Nitish Khobragade, Helpline 8982324497).
A writer has drafted a recruitment or career guidance article. Your task is to expand, polish, and transform this draft into a comprehensive 800+ word deep-dive guide in Hindi/Hinglish formatted in rich Markdown.

MANDATORY SECTIONS (MUST BE EXPANDED IN FULL DETAIL):
1. Catchy H1 Heading & SEO Intro (addressing real candidate concerns)
2. Overview Table in Markdown (| Parameter | Details |)
3. Detailed Educational Eligibility & Post-wise vacancy breakdown (MP Rojgar Panjiyan, Samagra e-KYC)
4. Selection Process & Exam Pattern / Syllabus overview
5. Step-by-Step Online Application Guide (with prominent advice that candidates can get their form filled safely from home through Nitish Khobragade at 8982324497 with verified portal receipt)
6. 3-4 Frequently Asked Questions (FAQs) with clear answers
7. Official Links Table

Return ONLY valid JSON in this exact structure:
{
  "optimizedTitle": "string",
  "optimizedContent": "string (full 800+ word structured article in rich Markdown)",
  "excerpt": "string (concise summary max 160 chars)",
  "seoKeywords": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6"],
  "tags": ["tag 1", "tag 2", "tag 3", "tag 4"]
}`;

    const prompt = `Category: ${category || 'Career Guidance'}
Title: ${title || 'Untitled Post'}
Draft Content / Topic:
${content || title}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\n${prompt}`,
      config: {
        maxOutputTokens: 6000
      }
    });

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      isAiOptimized: true,
      ...parsed
    });
  } catch (error: unknown) {
    console.error('Error enhancing blog post:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to optimize blog article' },
      { status: 500 }
    );
  }
}
