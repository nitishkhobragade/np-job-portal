import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Topic-targeted high-quality curated royalty-free banner images
const CURATED_BANNER_IMAGES: Record<string, string> = {
  police: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1080&auto=format&fit=crop&q=80',
  defense: 'https://images.unsplash.com/photo-1579975096649-e773152b04cb?w=1080&auto=format&fit=crop&q=80',
  teacher: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1080&auto=format&fit=crop&q=80',
  technical: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1080&auto=format&fit=crop&q=80',
  iti: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1080&auto=format&fit=crop&q=80',
  engineering: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1080&auto=format&fit=crop&q=80',
  ssc: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1080&auto=format&fit=crop&q=80',
  railway: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1080&auto=format&fit=crop&q=80',
  bank: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1080&auto=format&fit=crop&q=80',
  scheme: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=1080&auto=format&fit=crop&q=80',
  exam: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1080&auto=format&fit=crop&q=80',
  default: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1080&auto=format&fit=crop&q=80'
};

function selectBannerForTopic(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('police') || lower.includes('कांस्टेबल') || lower.includes('sub inspector') || lower.includes('si')) {
    return CURATED_BANNER_IMAGES.police;
  }
  if (lower.includes('army') || lower.includes('defense') || lower.includes('agniveer') || lower.includes('वर्दी')) {
    return CURATED_BANNER_IMAGES.defense;
  }
  if (lower.includes('teacher') || lower.includes('tet') || lower.includes('शिक्षक') || lower.includes('varg')) {
    return CURATED_BANNER_IMAGES.teacher;
  }
  if (lower.includes('iti') || lower.includes('training officer') || lower.includes('ट्रेड')) {
    return CURATED_BANNER_IMAGES.iti;
  }
  if (lower.includes('engineer') || lower.includes('sub engineer') || lower.includes('डिप्लोमा') || lower.includes('b.tech')) {
    return CURATED_BANNER_IMAGES.engineering;
  }
  if (lower.includes('technical') || lower.includes('software') || lower.includes('tech') || lower.includes('coding')) {
    return CURATED_BANNER_IMAGES.technical;
  }
  if (lower.includes('railway') || lower.includes('rrb') || lower.includes('alp') || lower.includes('group d')) {
    return CURATED_BANNER_IMAGES.railway;
  }
  if (lower.includes('bank') || lower.includes('ibps') || lower.includes('sbi')) {
    return CURATED_BANNER_IMAGES.bank;
  }
  if (lower.includes('ssc') || lower.includes('cgl') || lower.includes('chsl') || lower.includes('mts')) {
    return CURATED_BANNER_IMAGES.ssc;
  }
  if (lower.includes('yojna') || lower.includes('ladli') || lower.includes('योजना') || lower.includes('kalyan')) {
    return CURATED_BANNER_IMAGES.scheme;
  }
  return CURATED_BANNER_IMAGES.exam;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, keywords, category } = await req.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'कृपया ब्लॉग निर्माण हेतु विषय अथवा शीर्षक दर्ज करें' },
        { status: 400 }
      );
    }

    const trimmedPrompt = prompt.trim();
    const bannerUrl = selectBannerForTopic(trimmedPrompt);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback if no API key in environment
      const slug = trimmedPrompt
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'recruitment-guide-2026';

      return NextResponse.json({
        success: true,
        title: trimmedPrompt,
        slug,
        category: category || 'Exam Preparation',
        excerpt: `${trimmedPrompt} के संबंध में विस्तृत जानकारी, पात्रता, चयन प्रक्रिया एवं ऑनलाइन फॉर्म भरने के महत्वपूर्ण नियम।`,
        bannerUrl,
        tags: ['NP Job Portal', 'Govt Jobs 2026', 'Sarkari Bharti'],
        seoKeywords: [trimmedPrompt, 'Online Form 2026', 'Exam Preparation', 'MP Govt Jobs'],
        content: `## ${trimmedPrompt}\n\nमध्य प्रदेश एवं केंद्र सरकार की भर्तियों में आवेदन करने से पहले सभी नियमों को ध्यानपूर्वक समझें।\n\n### महत्वपूर्ण दस्तावेज:\n- 10वीं/12वीं अंकसूची\n- आधार कार्ड (मोबाइल लिंक)\n- रोजगार पंजीयन प्रमाण पत्र\n\nघर बैठे सुरक्षित फॉर्म भरवाने हेतु **Nitish Khobragade (8982324497)** से संपर्क करें।`
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a legendary Indian cyber-cafe operator, career counselor, and senior recruitment editor named Nitish Khobragade for 'NP Job Portal'.
You are writing a comprehensive, highly informative, and 100% human-sounding guide for competitive exam aspirants and job seekers in India (especially Madhya Pradesh and Central Govt exams).

CRITICAL REQUIREMENT - BYPASS ALL AI DETECTION (ZERO-GPT / GPTZERO / COPYLEAKS RESISTANT):
1. HUMANIZED NATURAL VOICE: Write in an authentic, conversational yet deeply authoritative Indian mentor tone. Speak directly to students ('प्रिय अभ्यर्थियों', 'अक्सर हमारे केंद्र पर छात्र ये गलती करते हैं', 'हमारे 8+ वर्षों के साइबर कैफ़े संचालन अनुभव में...').
2. BURSTINESS & SENTENCE VARIETY: Mix very short, crisp statements (e.g. 'जल्दबाजी बिल्कुल न करें।', 'एक छोटी सी गलती से फॉर्म निरस्त हो सकता है।') with detailed informative paragraphs. Avoid rhythmic, repetitive AI sentence starters.
3. GROUND REALITIES & HYPER-LOCAL NUANCES: Incorporate real practical details:
   - Mention the mandatory 'MP रोजगार पंजीयन' (MP Rojgar Panjiyan) status and live renewal check.
   - Mention Samagra ID e-KYC name matching with Class 10th marksheet.
   - Warn against waiting for the last 48 hours when MPESB / SSC servers face severe gateway timeout issues.
   - Clarify correct document scanning resolutions (e.g. Photo under 50KB, Signature under 20KB).
4. NO AI CLICHÉS: Never use generic bot phrases like 'In this fast-paced world', 'Delve into', 'In conclusion', 'A tapestry of opportunities', 'Furthermore', or mechanical textbook prose.
5. ARTICLE STRUCTURE (Rich Markdown):
   - Catchy, authentic H1 Title in Hindi with English year/terms.
   - Engaging introduction addressing students' real anxieties.
   - Key highlights & timeline table/bullets.
   - Step-by-step document checklist and eligibility breakdown.
   - 3-4 Deadly mistakes that cause form rejections (and how to avoid them).
   - Practical preparation tips & strategy.
   - Form Assistance Notice: Callout box explaining students can safely send their documents on WhatsApp to Nitish Khobragade (8982324497) to get their online application filled from home with verified official payment receipt.
   - 3-4 Frequently Asked Questions (FAQ) with direct, honest answers.

OUTPUT FORMAT:
Return ONLY a valid JSON object with EXACTLY this structure:
{
  "title": "string (Catchy, authentic headline in Hindi)",
  "slug": "string (clean-url-slug-in-english-without-spaces)",
  "category": "Exam Preparation" | "Career Guidance" | "Tech Jobs" | "Notifications" | "Portal Guides",
  "excerpt": "string (compelling meta description, approx 140-160 characters)",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "content": "string (complete 700-1100 word rich Markdown article with proper ## H2, ### H3, bullet points, callout blockquotes)"
}`;

    const userPrompt = `Generate a full, humanized, high-CTR blog article for:
Topic / Title / Notes: "${trimmedPrompt}"
Additional Keywords: "${keywords || 'Sarkari Bharti 2026, Online Form, Eligibility'}"
Preferred Category: "${category || 'Exam Preparation'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\n${userPrompt}`
    });

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini model did not return valid JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure bannerUrl is set
    parsed.bannerUrl = bannerUrl;

    return NextResponse.json({
      success: true,
      ...parsed
    });
  } catch (error: unknown) {
    console.error('Error generating auto blog:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'ब्लॉग तैयार करने में त्रुटि हुई' },
      { status: 500 }
    );
  }
}
