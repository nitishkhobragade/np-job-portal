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
      // High-Value Deep Fallback if no API key in environment (800+ words structured Markdown)
      const slug = trimmedPrompt
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'recruitment-guide-2026';

      const fallbackContent = `# ${trimmedPrompt}: सम्पूर्ण गाइड, पात्रता, परीक्षा पैटर्न व ऑनलाइन आवेदन

मध्य प्रदेश और केंद्र सरकार की विभिन्न भर्ती परीक्षाओं की तैयारी कर रहे सभी प्रिय अभ्यर्थियों का **NP Job Portal (A Unit of NTechBay)** पर हार्दिक स्वागत है। हमारे 8+ वर्षों के साइबर कैफ़े संचालन एवं ऑनलाइन फॉर्म परामर्श अनुभव में हमने देखा है कि हजारों योग्य अभ्यर्थी केवल छोटी-छोटी तकनीकी गलतियों (जैसे गलत फोटो बैकग्राउंड, एक्सपायर्ड रोजगार पंजीयन, या अंतिम तिथि का इंतजार) के कारण परीक्षा से वंचित रह जाते हैं। इस विस्तृत लेख में हम आपको **${trimmedPrompt}** के हर एक पहलू, पात्रता, चयन प्रक्रिया एवं फॉर्म भरने के आवश्यक नियमों की 100% सटीक जानकारी प्रदान कर रहे हैं।

---

## 1. भर्ती का अवलोकन (Quick Overview Table)

नीचे दी गई तालिका में भर्ती से संबंधित सभी महत्वपूर्ण विवरण संक्षेप में दिए गए हैं:

| विवरण (Parameter) | महत्वपूर्ण जानकारी (Details) |
| :--- | :--- |
| **भर्ती का नाम (Recruitment)** | ${trimmedPrompt} |
| **संबंधित विभाग (Department)** | मध्य प्रदेश / केंद्र सरकार अधिकृत बोर्ड |
| **कुल पद संख्या (Total Vacancies)** | विज्ञप्ति अनुसार (Official Notification देखें) |
| **आवेदन का माध्यम (Mode of Apply)** | ऑनलाइन (Online Portal) |
| **शैक्षणिक योग्यता (Eligibility)** | 10वीं / 12वीं / स्नातक / डिप्लोमा (पदानुसार) |
| **आयु सीमा (Age Limit)** | 18 वर्ष से 33/40 वर्ष (नियमानुसार छूट लागू) |
| **आवेदन शुल्क (Application Fee)** | सामान्य/ओबीसी: ₹500/-, एससी/एसटी: ₹250/- (अनुमानित) |
| **ऑनलाइन फॉर्म सहायता** | Nitish Khobragade (हेल्पलाइन: 8982324497) |

---

## 2. विस्तृत शैक्षणिक योग्यता एवं पद-वार विवरण (Educational Eligibility & Vacancy Breakdown)

इस भर्ती में आवेदन करने से पहले सभी उम्मीदवारों को अपनी योग्यता की जांच अनिवार्य रूप से कर लेनी चाहिए:
1. **सामान्य ड्यूटी / लिपिकीय पद:** भारत में किसी भी मान्यता प्राप्त बोर्ड से न्यूनतम 10वीं अथवा 12वीं कक्षा उत्तीर्ण होना आवश्यक है।
2. **तकनीकी व विशेषज्ञ पद:** संबंधित ट्रेड में ITI प्रमाण पत्र, कंप्यूटर प्रोफिशिएंसी सर्टिफिकेशन टेस्ट (CPCT स्कोर कार्ड), अथवा इंजीनियरिंग में डिप्लोमा/डिग्री धारक।
3. **रोजगार पंजीयन नियम (MP Candidates):** मध्य प्रदेश के मूल निवासियों के लिए 'MP रोजगार पोर्टल' पर जीवित पंजीयन (Live Registration) होना अत्यंत अनिवार्य है। यदि आपका पंजीयन एक्सपायर हो चुका है, तो आवेदन से पूर्व उसे तत्काल रिन्यू कराएं।

> **महत्वपूर्ण सूचना:** अपने 10वीं की अंकसूची में दर्ज नाम, पिता का नाम और जन्मतिथि का मिलान आधार कार्ड और समग्र आईडी (Samagra e-KYC) से अवश्य करें। स्पेलिंग में अंतर होने पर दस्तावेज सत्यापन (Document Verification) में उम्मीदवारी रद्द हो सकती है।

---

## 3. चयन प्रक्रिया एवं परीक्षा पैटर्न (Selection Process & Syllabus Overview)

उम्मीदवारों का अंतिम चयन निम्नलिखित चरणों के आधार पर किया जाएगा:
- **प्रथम चरण: ऑनलाइन कंप्यूटर आधारित परीक्षा (CBT):** 100 अंकों का वस्तुनिष्ठ प्रश्नपत्र जिसमें सामान्य ज्ञान, तार्किक क्षमता (Reasoning), गणित और हिंदी/अंग्रेजी के प्रश्न शामिल होंगे।
- **द्वितीय चरण: शारीरिक दक्षता / स्किल टेस्ट (PST/PET/Typing):** वर्दीधारी पदों के लिए 800 मीटर दौड़, लंबी कूद व गोला फेंक। लिपिकीय पदों के लिए हिंदी/अंग्रेजी टाइपिंग टेस्ट।
- **तृतीय चरण: दस्तावेज सत्यापन (Document Verification) एवं मेडिकल परीक्षण:** सभी मूल शैक्षणिक दस्तावेजों, जाति, निवास व आय प्रमाण पत्रों की गहन जांच।

---

## 4. ऑनलाइन फॉर्म भरने की चरणबद्ध प्रक्रिया (Step-by-Step Application Guide)

ऑनलाइन आवेदन करते समय किसी भी प्रकार की त्रुटि से बचने के लिए निम्न चरणों का पालन करें:
1. सबसे पहले अधिकृत पोर्टल पर जाएं और नए कैंडिडेट रजिस्ट्रेशन पर क्लिक करें।
2. अपनी बेसिक प्रोफाइल (नाम, माता-पिता का नाम, जन्मतिथि, मोबाइल व ईमेल) दर्ज करें।
3. **फोटो व हस्ताक्षर अपलोड नियम:** 
   - पासपोर्ट फोटो 3.5cm × 4.5cm साइज़ में, हल्के बैकग्राउंड के साथ और 20KB से 50KB के बीच होनी चाहिए।
   - हस्ताक्षर सफेद कागज पर काली स्याही से 10KB से 20KB के बीच होना चाहिए।
   - आप हमारे पोर्टल के **[Tools Menu](/tools)** से फोटो रिसाइज़र व सिग्नेचर क्लीनर का 100% फ्री उपयोग कर सकते हैं।
4. शैक्षणिक विवरण एवं श्रेणी (UR/OBC/SC/ST/EWS) की सटीक प्रविष्टि करें।
5. आवेदन शुल्क का ऑनलाइन भुगतान (Net Banking / UPI / Debit Card) करें और फाइनल सबमिशन रसीद की 2 प्रिंट कॉपी सुरक्षित रखें।

> 💡 **घर बैठे सुरक्षित फॉर्म भरवाएं:** यदि आपके पास इंटरनेट, प्रिंटर या कंप्यूटर की सुविधा नहीं है, तो आप अपने दस्तावेज **Nitish Khobragade (8982324497)** को WhatsApp पर भेजकर घर बैठे 100% त्रुटिरहित फॉर्म भरवा सकते हैं और अधिकृत पोर्टल रसीद प्राप्त कर सकते हैं।

---

## 5. अक्सर पूछे जाने वाले प्रश्न (Frequently Asked Questions - FAQs)

**प्रश्न 1: क्या अन्य राज्यों के उम्मीदवार इस भर्ती के लिए आवेदन कर सकते हैं?**  
**उत्तर:** हाँ, अधिकांश भर्तियों में अन्य राज्यों के अभ्यर्थी सामान्य श्रेणी (Unreserved) के अंतर्गत आवेदन करने हेतु पात्र होते हैं।

**प्रश्न 2: फोटो पर नाम और तारीख (DOP) लिखना जरूरी है क्या?**  
**उत्तर:** SSC और MP Police जैसे कई आयोगों में फोटो खींचने की तारीख (Date of Photo) लिखना अनिवार्य होता है। आप हमारे [Passport Size Photo Maker Tool](/tools) से एक क्लिक में नाम व तारीख जोड़ सकते हैं।

**प्रश्न 3: फॉर्म भरने की अंतिम तिथि के दिन क्या सर्वर चलता है?**  
**उत्तर:** अंतिम 48 घंटों में MP Online और SSC सर्वर पर भारी ट्रैफिक के कारण गेटवे टाइमआउट और पेमेंट फेलियर की समस्याएं आती हैं। अतः अंतिम तिथि से कम से कम 5 दिन पूर्व आवेदन पूर्ण करें।

---

## 6. महत्वपूर्ण आधिकारिक लिंक्स (Official Links Table)

| सेवा / दस्तावेज | आधिकारिक लिंक |
| :--- | :--- |
| **विस्तृत अधिसूचना (Notification PDF)** | [यहाँ से डाउनलोड करें (Official Notice)](https://npjobportal.com) |
| **ऑनलाइन आवेदन लिंक (Apply Online)** | [ऑनलाइन फॉर्म भरें (Official Portal)](https://npjobportal.com) |
| **फोटो व PDF टूल्स (Free Tools)** | [NP Job Portal Tools](/tools) |
| **WhatsApp फॉर्म हेल्पलाइन** | [8982324497 पर संपर्क करें](https://wa.me/918982324497) |`;

      return NextResponse.json({
        success: true,
        title: `${trimmedPrompt}: सम्पूर्ण गाइड एवं ऑनलाइन आवेदन 2026`,
        slug,
        category: category || 'Exam Preparation',
        excerpt: `${trimmedPrompt} के संबंध में 800+ शब्दों की विस्तृत गाइड: शैक्षणिक योग्यता, आयु सीमा, चयन प्रक्रिया, पाठ्यक्रम एवं घर बैठे फॉर्म भरने की जानकारी।`,
        bannerUrl,
        tags: ['NP Job Portal', 'Govt Jobs 2026', 'Sarkari Bharti', 'Exam Preparation'],
        seoKeywords: [trimmedPrompt, 'Sarkari Bharti 2026', 'Exam Syllabus', 'Online Form', 'MP Govt Jobs', 'Nitish Khobragade'],
        content: fallbackContent
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an elite Indian recruitment journalist, master blogger, and cyber-cafe founder named Nitish Khobragade writing for 'NP Job Portal (A Unit of NTechBay)'.
Your mission is to generate a deep, comprehensive, and exhaustive 800+ word long-form recruitment & career guide in Hindi/Hinglish formatted in rich Markdown.

MANDATORY EDITORIAL REQUIREMENTS:
1. MINIMUM LENGTH: The article content must strictly exceed 800 words. Never output shallow 1-2 paragraph summaries. Provide deep, actionable value.
2. AUTHENTIC EXPERT VOICE: Speak with 8+ years of real field experience ('हमारे 8+ वर्षों के साइबर कैफ़े संचालन अनुभव में...', 'प्रिय अभ्यर्थियों').
3. MANDATORY SECTIONS (MUST BE PRESENT IN THIS EXACT ORDER):
   - Catchy H1 Heading & SEO Intro (Empathetic, engaging opening)
   - Overview Table in Markdown (Post name, department, important dates, fees, age limit, helpline)
   - Detailed Educational Eligibility & Post-wise Vacancy Breakdown (Academic criteria, MP Rojgar Panjiyan, Samagra e-KYC)
   - Selection Process & Exam Pattern / Syllabus Overview (Stage-by-stage CBT, Physical, Skill Test, DV)
   - Step-by-Step Online Application Guide (Detailed form submission steps + mention candidates can safely send documents on WhatsApp to Nitish Khobragade at 8982324497 to get forms filled with official payment slip)
   - 3-4 Frequently Asked Questions (FAQs) with thorough, helpful answers
   - Official Links Table (Notification PDF, Apply Online, NP Tools, WhatsApp Helpline)
4. STYLING: Use Markdown headings (# H1, ## H2, ### H3), bold highlights (**text**), bullet points, blockquotes (>), and markdown tables (| Col 1 | Col 2 |).

OUTPUT JSON SPECIFICATION:
Return ONLY a valid JSON object:
{
  "title": "string (Catchy, authentic headline in Hindi with English year/terms)",
  "slug": "string (clean-url-slug-in-english-without-spaces)",
  "category": "Exam Preparation" | "Career Guidance" | "Tech Jobs" | "Notifications" | "Portal Guides",
  "excerpt": "string (compelling 140-160 character meta description)",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"],
  "seoKeywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "kw7", "kw8"],
  "content": "string (an exhaustive 800+ word complete Markdown article with all 7 mandatory sections)"
}`;

    const userPrompt = `Generate an exhaustive, high-value 800+ word long-form guide for:
Topic / Title / Notes: "${trimmedPrompt}"
Additional Keywords: "${keywords || 'Sarkari Bharti 2026, Online Form, Eligibility, Syllabus'}"
Preferred Category: "${category || 'Exam Preparation'}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\n${userPrompt}`,
      config: {
        maxOutputTokens: 6000
      }
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
