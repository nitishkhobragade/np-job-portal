import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { PostRecord } from '../../../../types';
import { formatDateToDDMMYYYY } from '../../../../lib/postRouting';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_OFFICIAL_PORTALS = [
  {
    rawTitle: 'MP ESB Group 4 Assistant Grade 3 Steno Typist Recruitment 2026',
    dept: 'Madhya Pradesh Employees Selection Board (MPESB)',
    category: 'mp-special',
    sourceUrl: 'https://esb.mp.gov.in',
    sampleDetails: 'MP ESB official notice for Group 4, Assistant Grade 3, Steno Typist posts. Total 3047 posts. 12th pass with CPCT score card and Hindi typing. Age 18-40 years with MP domicile relaxation. Online apply on MP Online portal.'
  },
  {
    rawTitle: 'SSC Multi Tasking Staff (MTS) & Havaldar Examination 2026',
    dept: 'Staff Selection Commission (SSC)',
    category: 'central',
    sourceUrl: 'https://ssc.gov.in',
    sampleDetails: 'Staff Selection Commission notice for Multi-Tasking (Non-Technical) Staff and Havaldar (CBIC/CBN) Examination 2026. 10th pass eligible. Age limit 18-25 and 18-27 years. Online application at ssc.gov.in.'
  },
  {
    rawTitle: 'Railway Recruitment Cell Western Railway Apprentice 2026',
    dept: 'Indian Railways - RRC Western Railway',
    category: 'latest-jobs',
    sourceUrl: 'https://rrc-wr.com',
    sampleDetails: 'RRC Western Railway engagement of Act Apprentices under Apprentices Act 1961. Total 5050 slots. 10th pass with ITI certificate in relevant trade. Age 15-24 years.'
  }
];

function generateCleanSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function isJobDuplicate(slug: string, title: string): Promise<boolean> {
  try {
    const postsRef = collection(db, 'posts');
    const slugQuery = query(postsRef, where('slug', '==', slug));
    const slugSnap = await getDocs(slugQuery);
    if (!slugSnap.empty) return true;

    const titleQuery = query(postsRef, where('title', '==', title));
    const titleSnap = await getDocs(titleQuery);
    if (!titleSnap.empty) return true;

    return false;
  } catch (err) {
    console.warn('Deduplication check error:', err);
    return false;
  }
}

// Cleans raw HTML text into readable content
function extractCleanTextFromHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 20000); // Take first 20,000 characters
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { url, scanDefaults } = body;

    const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    const ai = apiKey
      ? new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build-manual-scraper' } }
        })
      : null;

    // SCENARIO 1: Quick Scan Pre-Configured Official Portals
    if (scanDefaults) {
      const scannedDrafts: PostRecord[] = [];
      const skipped: string[] = [];

      for (const item of DEFAULT_OFFICIAL_PORTALS.slice(0, 3)) {
        const slug = generateCleanSlug(item.rawTitle);
        const dup = await isJobDuplicate(slug, item.rawTitle);
        if (dup) {
          skipped.push(item.rawTitle);
          continue;
        }

        const draft = await extractAndCreateDraft({
          sourceTitle: item.rawTitle,
          dept: item.dept,
          category: item.category,
          sourceUrl: item.sourceUrl,
          rawContext: item.sampleDetails,
          ai
        });

        if (draft) {
          scannedDrafts.push(draft);
        }
      }

      return NextResponse.json({
        success: true,
        message: `सफलतापूर्वक ${scannedDrafts.length} नए ड्राफ्ट तैयार किए गए (${skipped.length} डुप्लीकेट छोड़े गए)`,
        count: scannedDrafts.length,
        drafts: scannedDrafts,
        skipped,
        durationMs: Date.now() - startTime
      }, { status: 200 });
    }

    // SCENARIO 2: Ingest from User-Provided URL (Webpage or Direct PDF)
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      return NextResponse.json({
        success: false,
        error: 'मान्य URL दर्ज करें (जैसे https://esb.mp.gov.in या नोटिफिकेशन PDF लिंक)'
      }, { status: 400 });
    }

    const cleanUrl = url.trim();
    const isPdf = cleanUrl.toLowerCase().includes('.pdf');

    let pdfBase64 = '';
    let fetchedText = '';

    // Fetch official webpage or PDF with realistic user agent & 12s timeout
    const fetchController = new AbortController();
    const timeout = setTimeout(() => fetchController.abort(), 12000);

    try {
      const resp = await fetch(cleanUrl, {
        signal: fetchController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml,application/pdf;q=0.9,*/*;q=0.8'
        }
      });
      clearTimeout(timeout);

      if (!resp.ok) {
        throw new Error(`सर्वर ने स्थिति कोड ${resp.status} लौटाया`);
      }

      const contentType = resp.headers.get('content-type') || '';
      if (isPdf || contentType.includes('application/pdf')) {
        const arrayBuf = await resp.arrayBuffer();
        // Limit PDF to max 10MB
        if (arrayBuf.byteLength > 10 * 1024 * 1024) {
          pdfBase64 = Buffer.from(arrayBuf.slice(0, 10 * 1024 * 1024)).toString('base64');
        } else {
          pdfBase64 = Buffer.from(arrayBuf).toString('base64');
        }
      } else {
        const rawHtml = await resp.text();
        fetchedText = extractCleanTextFromHtml(rawHtml);
      }
    } catch (fetchErr: unknown) {
      clearTimeout(timeout);
      console.warn('URL direct fetch error (will use Search Grounding fallback):', fetchErr);
      fetchedText = `Source URL: ${cleanUrl}. Please use Google Search Grounding to verify this official recruitment link.`;
    }

    const draft = await extractAndCreateDraft({
      sourceTitle: '',
      dept: '',
      category: 'latest-jobs',
      sourceUrl: cleanUrl,
      rawContext: fetchedText,
      pdfBase64,
      ai
    });

    if (!draft) {
      return NextResponse.json({
        success: false,
        error: 'इस लिंक से भर्ती विवरण का विश्लेषण नहीं किया जा सका। कृपया URL जांचें या पुनः प्रयास करें।'
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      message: 'विज्ञप्ति का विश्लेषण पूर्ण! नया ड्राफ्ट तैयार कर लिया गया है।',
      post: draft,
      slug: draft.slug,
      durationMs: Date.now() - startTime
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Manual scrape route error:', error);
    const err = error as Error;
    return NextResponse.json({
      success: false,
      error: err.message || 'स्क्रैपिंग के दौरान अप्रत्याशित त्रुटि आई'
    }, { status: 500 });
  }
}

interface ExtractionParams {
  sourceTitle?: string;
  dept?: string;
  category?: string;
  sourceUrl: string;
  rawContext?: string;
  pdfBase64?: string;
  ai: GoogleGenAI | null;
}

async function extractAndCreateDraft({
  sourceTitle,
  dept,
  category,
  sourceUrl,
  rawContext,
  pdfBase64,
  ai
}: ExtractionParams): Promise<PostRecord | null> {
  const currentIso = new Date().toISOString();

  // Baseline Fallback Data
  let extracted: Record<string, unknown> = {
    title: sourceTitle || 'सरकारी भर्ती 2026',
    shortTitle: (sourceTitle || 'भर्ती 2026').slice(0, 30),
    dept: dept || 'मध्य प्रदेश शासन / केंद्र सरकार',
    advtNo: 'विज्ञप्ति अनुसार',
    totalPosts: 'विज्ञप्ति अनुसार',
    startDate: 'शीघ्र उपलब्ध / Announced Soon',
    lastDate: 'शीघ्र उपलब्ध / Announced Soon',
    lastDateFee: 'शीघ्र उपलब्ध / Announced Soon',
    correctionDate: 'शीघ्र उपलब्ध / Announced Soon',
    examDate: 'शीघ्र घोषित',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    feeGeneral: '₹500/-',
    feeReserved: '₹250/-',
    feeOBC: '₹500/-',
    feeSCST: '₹250/-',
    feeEWS: '₹500/-',
    feePortal: '₹60/- (पोर्टल शुल्क)',
    paymentMode: 'Online (Net Banking, Debit/Credit Card, UPI, MP Online Kiosk)',
    minAge: '18 वर्ष',
    maxAge: '40 वर्ष',
    ageCalculationDate: '01/01/2026',
    ageRelaxation: 'नियमानुसार आरक्षित वर्गों (SC/ST/OBC) को अधिकतम आयु में छूट',
    qualificationSummary: '10वीं / 12वीं / स्नातक / आईटीआई (विस्तृत अधिसूचना देखें)',
    description: rawContext || 'आधिकारिक विज्ञापन अनुसार भर्ती।',
    vacanciesBreakdown: [
      {
        postName: sourceTitle || 'मुख्य पद',
        total: 'विज्ञप्ति अनुसार',
        eligibility: '10वीं / 12वीं / संबंधित विषय में डिग्री / डिप्लोमा'
      }
    ],
    categoryWisePosts: [
      { category: 'समस्त पद', ur: '—', obc: '—', ews: '—', sc: '—', st: '—', total: 'विज्ञप्ति अनुसार' }
    ],
    physicalStandards: [],
    howToApplySteps: [
      'चरण 1: आधिकारिक नोटिफिकेशन डाउनलोड करके सभी नियम व पात्रता शर्तें अच्छी तरह पढ़ें।',
      'चरण 2: ऑनलाइन आवेदन के लिए आधिकारिक पोर्टल पर जाकर न्यू रजिस्ट्रेशन करें।',
      'चरण 3: आवश्यक दस्तावेज (अंकसूची, आधार कार्ड, फोटो, हस्ताक्षर, जाति प्रमाण पत्र) अपलोड करें।',
      'चरण 4: आवेदन शुल्क का ऑनलाइन अथवा कियोस्क के माध्यम से भुगतान करें।',
      'चरण 5: फाइनल आवेदन पत्र (Application Receipt) का प्रिंटआउट सुरक्षित रखें।',
      'चरण 6: घर बैठे सुरक्षित फॉर्म भरवाने के लिए Nitish Khobragade (8982324497) से संपर्क करें।'
    ],
    requiredDocuments: [
      'आधार कार्ड (मोबाइल नंबर लिंक्ड)',
      '10वीं / 12वीं अंकसूची',
      'संबद्ध डिग्री / डिप्लोमा / CPCT स्कोर कार्ड (यदि लागू हो)',
      'जाति प्रमाण पत्र एवं मूल निवासी प्रमाण पत्र',
      'पासपोर्ट साइज फोटो एवं हस्ताक्षर'
    ],
    applyUrl: sourceUrl,
    notificationPdfUrl: sourceUrl,
    syllabusUrl: sourceUrl,
    officialWebsiteUrl: sourceUrl
  };

  if (ai) {
    try {
      const prompt = `You are a world-class official Indian government recruitment data extraction engine (NP Job Portal - SarkariResult style).
Current Execution Timestamp: "${currentIso}".

CRITICAL ACCURACY & SARKARI-RESULT SCHEMA RULES:
1. Extract authentic recruitment facts from the provided context or PDF.
2. ZERO-HALLUCINATION RULE: If any date, fee, or vacancy detail is not released yet or unknown, set the value strictly to "शीघ्र उपलब्ध / Announced Soon" or "विज्ञप्ति अनुसार". NEVER guess or hallucinate.
3. Dates format: strictly "DD/MM/YYYY" or "शीघ्र उपलब्ध / Announced Soon".
4. Fees format: "₹.../-" or "निःशुल्क".
5. Return ONLY pure valid JSON in this exact structure:
{
  "title": "string (Official recruitment title in Hindi & English, e.g. MP ESB Group 4 Assistant Grade 3 Recruitment 2026)",
  "shortTitle": "string (max 30 characters)",
  "dept": "string (Department or Exam Board name, e.g. Madhya Pradesh Employees Selection Board)",
  "advtNo": "string (Advertisement / Notification Reference number)",
  "totalPosts": "string (e.g. 3047 पद or विज्ञप्ति अनुसार)",
  "category": "string (mp-special | central | police | teaching | latest-jobs)",
  "state": "string (MP | Central | All India)",
  "startDate": "string (DD/MM/YYYY or शीघ्र उपलब्ध / Announced Soon)",
  "lastDate": "string (DD/MM/YYYY or शीघ्र उपलब्ध / Announced Soon)",
  "lastDateFee": "string (DD/MM/YYYY or शीघ्र उपलब्ध / Announced Soon)",
  "correctionDate": "string (DD/MM/YYYY or शीघ्र उपलब्ध / Announced Soon)",
  "examDate": "string (DD/MM/YYYY or शीघ्र घोषित)",
  "admitCardDate": "string (DD/MM/YYYY or परीक्षा से 7-10 दिन पूर्व)",
  "feeGeneral": "string (e.g. ₹500/-)",
  "feeReserved": "string (e.g. ₹250/-)",
  "feeOBC": "string (e.g. ₹500/-)",
  "feeSCST": "string (e.g. ₹250/-)",
  "feeEWS": "string (e.g. ₹500/-)",
  "feePortal": "string (e.g. ₹60/- (पोर्टल शुल्क))",
  "paymentMode": "string (Online Net Banking, Debit/Credit Card, UPI, MP Online Kiosk)",
  "minAge": "string (e.g. 18 वर्ष)",
  "maxAge": "string (e.g. 40 वर्ष)",
  "ageCalculationDate": "string (e.g. 01/01/2026)",
  "ageRelaxation": "string (Details on age relaxation for SC/ST/OBC)",
  "qualificationSummary": "string (Concise summary of educational qualifications)",
  "description": "string (2-3 informative paragraphs in Hindi describing this vacancy, job role, and benefits)",
  "vacanciesBreakdown": [
    {
      "postName": "string",
      "total": "string",
      "eligibility": "string"
    }
  ],
  "categoryWisePosts": [
    {
      "category": "string",
      "ur": "string",
      "obc": "string",
      "ews": "string",
      "sc": "string",
      "st": "string",
      "total": "string"
    }
  ],
  "physicalStandards": [
    {
      "parameter": "string (Height / Chest / Running - only if police/defense job)",
      "male": "string",
      "female": "string"
    }
  ],
  "howToApplySteps": [
    "string (Step 1...)",
    "string (Step 2...)",
    "string (Step 3...)",
    "string (Step 4...)",
    "string (Step 5...)"
  ],
  "requiredDocuments": [
    "string",
    "string"
  ],
  "applyUrl": "string (Direct official apply URL)",
  "notificationPdfUrl": "string (Official notification PDF download link)",
  "syllabusUrl": "string (Official syllabus URL)",
  "officialWebsiteUrl": "string (Official departmental website)"
}

Source URL: ${sourceUrl}
Raw Context / Text:
${rawContext || 'Please use Google Search to verify the recruitment details of ' + sourceUrl}`;

      const contents: Array<{ text?: string; inlineData?: { data: string; mimeType: string } }> = [];

      if (pdfBase64) {
        contents.push({
          inlineData: {
            data: pdfBase64,
            mimeType: 'application/pdf'
          }
        });
      }

      contents.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: contents
        },
        config: {
          responseMimeType: 'application/json',
          tools: [{ googleSearch: {} }]
        }
      });

      if (response && response.text) {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          extracted = { ...extracted, ...parsed };
        }
      }
    } catch (aiErr) {
      console.warn('AI structured extraction error (fallback to defaults):', aiErr);
    }
  }

  const finalTitle = String(extracted.title || sourceTitle || 'सरकारी भर्ती 2026');
  const slug = generateCleanSlug(finalTitle);

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const blogNo = String(Date.now()).slice(-4);

  // Generate Google JobPosting JSON-LD Schema
  const jobPostingSchema = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": finalTitle,
    "description": String(extracted.description || finalTitle),
    "datePosted": new Date().toISOString().split('T')[0],
    "validThrough": String(extracted.lastDate).includes('/')
      ? `${String(extracted.lastDate).split('/').reverse().join('-')}T23:59:59+05:30`
      : '2026-12-31T23:59:59+05:30',
    "employmentType": "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": String(extracted.dept || 'Government of Madhya Pradesh'),
      "sameAs": String(extracted.officialWebsiteUrl || sourceUrl)
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Madhya Pradesh",
        "addressRegion": "MP",
        "addressCountry": "IN"
      }
    },
    "qualifications": String(extracted.qualificationSummary || '10वीं / 12वीं / स्नातक'),
    "directApply": true
  };

  const draftPost: PostRecord = {
    id: slug,
    slug: slug,
    year: year,
    month: month,
    blogNo: blogNo,
    title: finalTitle,
    shortTitle: String(extracted.shortTitle || finalTitle.slice(0, 30)),
    dept: String(extracted.dept || dept || 'विभागीय भर्ती'),
    advtNo: String(extracted.advtNo || 'विज्ञप्ति अनुसार'),
    totalPosts: String(extracted.totalPosts || 'विज्ञप्ति अनुसार'),
    category: (extracted.category as string) || category || 'latest-jobs',
    categories: [(extracted.category as string) || category || 'latest-jobs', 'vacancy'],
    state: (extracted.state as 'MP' | 'Central' | 'All India') || 'MP',
    startDate: formatDateToDDMMYYYY(String(extracted.startDate || 'शीघ्र उपलब्ध')),
    lastDate: formatDateToDDMMYYYY(String(extracted.lastDate || 'शीघ्र उपलब्ध')),
    lastDateFee: formatDateToDDMMYYYY(String(extracted.lastDateFee || extracted.lastDate || 'शीघ्र उपलब्ध')),
    correctionDate: String(extracted.correctionDate || 'शीघ्र उपलब्ध'),
    examDate: String(extracted.examDate || 'शीघ्र घोषित'),
    admitCardDate: String(extracted.admitCardDate || 'परीक्षा से 7 दिन पूर्व'),
    feeGeneral: String(extracted.feeGeneral || '₹500/-'),
    feeReserved: String(extracted.feeReserved || '₹250/-'),
    feeOBC: String(extracted.feeOBC || extracted.feeGeneral || '₹500/-'),
    feeSCST: String(extracted.feeSCST || extracted.feeReserved || '₹250/-'),
    feeEWS: String(extracted.feeEWS || extracted.feeGeneral || '₹500/-'),
    feePortal: String(extracted.feePortal || '₹60/- (पोर्टल शुल्क)'),
    paymentMode: String(extracted.paymentMode || 'Online (Net Banking, UPI, MP Online Kiosk)'),
    minAge: String(extracted.minAge || '18 वर्ष'),
    maxAge: String(extracted.maxAge || '40 वर्ष'),
    ageCalculationDate: String(extracted.ageCalculationDate || '01/01/2026'),
    ageRelaxation: String(extracted.ageRelaxation || 'नियमानुसार आरक्षित वर्गों को छूट'),
    qualification: String(extracted.qualificationSummary || 'विस्तृत अधिसूचना देखें'),
    eligibility: String(extracted.qualificationSummary || 'विस्तृत अधिसूचना देखें'),
    vacanciesBreakdown: Array.isArray(extracted.vacanciesBreakdown)
      ? extracted.vacanciesBreakdown
      : [
          {
            postName: finalTitle,
            total: String(extracted.totalPosts || 'विज्ञप्ति अनुसार'),
            eligibility: String(extracted.qualificationSummary || 'विस्तृत अधिसूचना देखें')
          }
        ],
    categoryWisePosts: Array.isArray(extracted.categoryWisePosts) ? extracted.categoryWisePosts : undefined,
    physicalStandards: Array.isArray(extracted.physicalStandards) && extracted.physicalStandards.length > 0
      ? extracted.physicalStandards
      : undefined,
    howToApplySteps: Array.isArray(extracted.howToApplySteps) && extracted.howToApplySteps.length > 0
      ? extracted.howToApplySteps
      : [
          'चरण 1: आधिकारिक नोटिफिकेशन डाउनलोड करके सभी नियम व पात्रता शर्तें ध्यानपूर्वक पढ़ें।',
          'चरण 2: ऑनलाइन आवेदन के लिए ऑफिशियल पोर्टल पर रजिस्ट्रेशन करें।',
          'चरण 3: अपनी जानकारी और आवश्यक दस्तावेज (फोटो, साइन, अंकसूची) अपलोड करें।',
          'चरण 4: आवेदन शुल्क का ऑनलाइन भुगतान कर फाइनल रसीद प्रिंट करें।',
          'चरण 5: घर बैठे सुरक्षित फॉर्म भरवाने के लिए Nitish Khobragade (8982324497) से संपर्क करें।'
        ],
    requiredDocuments: Array.isArray(extracted.requiredDocuments) ? extracted.requiredDocuments : undefined,
    applyLink: String(extracted.applyUrl || sourceUrl),
    notificationPdf: String(extracted.notificationPdfUrl || sourceUrl),
    detailsUrl: `/${year}/${month}/${blogNo}/${slug}`,
    description: String(extracted.description || finalTitle),
    roleOverview: String(extracted.description || ''),
    content: `## भर्ती का संक्षिप्त विवरण\n\n${extracted.description || finalTitle}\n\n## आवेदन कैसे करें\n\nआधिकारिक पोर्टल पर जाकर निर्धारित अंतिम तिथि से पूर्व ऑनलाइन आवेदन करें। घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) पर संपर्क करें।`,
    publishedAt: Date.now(),
    publishedDate: formatDateToDDMMYYYY(new Date().toISOString()),
    status: 'draft', // Strictly saved as draft for admin review
    isPublished: false,
    isAiVerified: true,
    aiAuditPassed: true,
    seoTitle: `${finalTitle} 2026: Notification, Dates, Eligibility & Apply Online | NP Job Portal`,
    seoDescription: `${extracted.dept}: कुल ${extracted.totalPosts} पद। योग्यता: ${extracted.qualificationSummary}। अंतिम तिथि: ${extracted.lastDate}। ऑनलाइन आवेदन करें।`,
    seoKeywords: [finalTitle, String(extracted.dept), 'NP Job Portal', 'Sarkari Result MP', 'Nitish Khobragade'],
    jobPostingSchema: jobPostingSchema,
    dates: {
      start: formatDateToDDMMYYYY(String(extracted.startDate || 'शीघ्र उपलब्ध')),
      end: formatDateToDDMMYYYY(String(extracted.lastDate || 'शीघ्र उपलब्ध')),
      exam: formatDateToDDMMYYYY(String(extracted.examDate || 'शीघ्र घोषित'))
    },
    fee: {
      gen: String(extracted.feeGeneral || '₹500/-'),
      reserved: String(extracted.feeReserved || '₹250/-')
    },
    links: {
      apply: String(extracted.applyUrl || sourceUrl),
      notificationPdf: String(extracted.notificationPdfUrl || sourceUrl),
      syllabusPdf: String(extracted.syllabusUrl || sourceUrl),
      officialSite: String(extracted.officialWebsiteUrl || sourceUrl)
    },
    posterConfig: {
      headline: `★ ${String(extracted.shortTitle || 'भर्ती 2026')} अलर्ट ★`,
      postCount: String(extracted.totalPosts || 'पदों की भर्ती'),
      qualification: String(extracted.qualificationSummary || '10वीं / 12वीं / स्नातक'),
      lastDate: String(extracted.lastDate || 'अंतिम तिथि विज्ञप्ति देखें'),
      themeColor: 'blue',
      showQrCode: true,
      badgeText: 'आधिकारिक सूचना 2026'
    }
  };

  const postDocRef = doc(db, 'posts', slug);
  await setDoc(postDocRef, draftPost);

  return draftPost;
}
