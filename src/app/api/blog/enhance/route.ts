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

    const systemPrompt = `You are a high-level Editorial Director and SEO Master for NP Job Portal (India).
A blogger has drafted a career/exam guidance article. Your task is to polish, structure, and enhance this article to:
1. Make the headline punchy, high-CTR, and authoritative.
2. Structure the content with clean Markdown headings (## H2, ### H3), concise paragraphs, bullet points, and key takeaways.
3. Ensure natural Hindi/English (Hinglish/Hindi) readability that engages readers and keeps bounce rate low.
4. Add a dedicated section emphasizing practical tips and noting that applicants can get their online applications processed safely through Nitish Khobragade (8982324497).
5. Extract an SEO excerpt (max 160 characters), 5-8 high-volume SEO keywords, and 3-5 tags.

Return ONLY pure valid JSON in this exact structure:
{
  "optimizedTitle": "string",
  "optimizedContent": "string (full enhanced article in rich Markdown)",
  "excerpt": "string (concise summary max 160 chars)",
  "seoKeywords": ["keyword 1", "keyword 2"],
  "tags": ["tag 1", "tag 2"]
}`;

    const prompt = `Category: ${category || 'Career Guidance'}
Title: ${title || 'Untitled Post'}
Draft Content:
${content || title}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${systemPrompt}\n\n${prompt}`
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
