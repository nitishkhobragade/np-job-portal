import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

function generateFallbackJobIntelligence(params: {
  title?: string;
  dept?: string;
  totalPosts?: string | number;
  qualification?: string;
  category?: string;
  state?: string;
}) {
  const { title = 'सरकारी नौकरी भर्ती', dept = 'संबंधित विभाग', totalPosts = 'विज्ञप्ति अनुसार', qualification = 'विज्ञप्ति अनुसार', state = 'MP' } = params;

  const isMp = state.toUpperCase().includes('MP') || state.includes('मध्य प्रदेश');
  const postCountStr = totalPosts ? `${totalPosts} पदों` : 'विभिन्न पदों';

  return {
    description: `${dept} द्वारा योग्य एवं इच्छुक महिला व पुरुष अभ्यर्थियों के लिए ${title} के कुल ${postCountStr} पर सीधी भर्ती का आधिकारिक विज्ञापन जारी किया गया है। यह भर्ती राज्य एवं केंद्र स्तर पर सरकारी सेवा में शामिल होने के इच्छुक युवाओं के लिए एक सुनहरा अवसर है।

इस भर्ती के माध्यम से विभाग के विभिन्न कार्यालयों एवं क्षेत्रीय इकाइयों में कार्यभार को सुचारू रूप से संचालित किया जाएगा। सभी चयनित उम्मीदवारों को विभाग के नियमानुसार नियमित वेतनमान, भत्ते एवं अन्य शासकीय सुविधाएं प्रदान की जाएंगी।

अभ्यर्थियों को सलाह दी जाती है कि आवेदन पत्र भरने से पूर्व अपनी शैक्षणिक योग्यता (${qualification}), आयु सीमा, एवं संबंधित दिशानिर्देशों का भलीभांति अध्ययन कर लें। निर्धारित अंतिम तिथि से पूर्व आधिकारिक पोर्टल पर जाकर ऑनलाइन आवेदन प्रक्रिया पूर्ण करें।`,
    roleOverview: `चयनित ${title} का मुख्य कार्य ${dept} के दैनिक प्रशासकीय कार्यों, अभिलेखों के संधारण, फील्ड अथवा कार्यालयीन समन्वय, एवं आम नागरिकों को समयबद्ध शासकीय सेवाएं उपलब्ध कराना होगा। इसके अतिरिक्त विभाग के उच्चाधिकारियों द्वारा समय-समय पर सौंपे गए दायित्वों का निष्ठापूर्वक निर्वहन करना अनिवार्य होगा।`,
    selectionProcess: `1. ऑनलाइन/ऑफलाइन लिखित परीक्षा (CBT / OMR आधारित वस्तुनिष्ठ प्रश्न)
2. पद अनुसार कौशल परीक्षण / टाइपिंग टेस्ट / शारीरिक दक्षता परीक्षा (यदि लागू हो)
3. मूल दस्तावेज सत्यापन (Document Verification)
4. अंतिम मेरिट सूची एवं मेडिकल परीक्षण (Medical Fitness)`,
    requiredDocuments: [
      'आधार कार्ड (मोबाइल नंबर व समग्र आईडी से लिंक)',
      '10वीं बोर्ड अंकसूची (जन्म तिथि सत्यापन हेतु)',
      '12वीं बोर्ड अंकसूची एवं स्नातक/डिप्लोमा प्रमाण पत्र',
      qualification && qualification !== 'विज्ञप्ति अनुसार' ? `${qualification} संबंधित मूल अंकसूची व डिग्री` : 'संबंधित शैक्षणिक योग्यता प्रमाण पत्र',
      'सक्षम अधिकारी द्वारा जारी डिजिटल जाति प्रमाण पत्र (SC/ST/OBC/EWS हेतु)',
      'मूल निवासी प्रमाण पत्र (Domicile Certificate)',
      isMp ? 'मध्य प्रदेश का अद्यतन जीवित रोजगार कार्यालय पंजीयन (Employment Registration)' : 'राज्य का वैध रोजगार पंजीयन',
      'हाल ही में खिंचवाई गई 3.5×4.5 सेमी पासपोर्ट साइज रंगीन फोटो (सफेद पृष्ठभूमि)',
      'काली/नीली स्याही से किए गए स्पष्ट डिजिटल हस्ताक्षर'
    ]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { title, dept, totalPosts, qualification, category, state } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found in process.env, providing rich intelligent fallback description.');
      const fallbackData = generateFallbackJobIntelligence({ title, dept, totalPosts, qualification, category, state });
      return NextResponse.json({
        success: true,
        data: fallbackData,
        source: 'smart-template-engine'
      });
    }

    try {
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
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          data: parsed,
          source: 'gemini-3.8-flash'
        });
      }
    } catch (aiError) {
      console.warn('Gemini generation failed, using intelligent template engine:', aiError);
    }

    // Defensive fallback if AI model parsing failed
    const fallbackData = generateFallbackJobIntelligence({ title, dept, totalPosts, qualification, category, state });
    return NextResponse.json({
      success: true,
      data: fallbackData,
      source: 'smart-template-engine'
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
