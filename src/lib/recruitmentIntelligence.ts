import { GoogleGenAI } from '@google/genai';
import { PostRecord } from '../types';

export interface AuditDiagnosticItem {
  status: 'verified' | 'warning' | 'critical';
  details: string;
  verifiedValue?: string;
  currentValue?: string;
}

export interface AuditIssue {
  field: string;
  issue: string;
  current: string;
  verified: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface PostAuditResult {
  jobId: string;
  title: string;
  healthScore: number; // 0 - 100
  statusBadge: 'verified' | 'warning' | 'critical';
  summary: string;
  isVerified: boolean;
  diagnosticBreakdown: {
    timeline: AuditDiagnosticItem;
    officialSource: AuditDiagnosticItem;
    vacanciesAndEligibility: AuditDiagnosticItem;
    feeStructure: AuditDiagnosticItem;
    categorization: AuditDiagnosticItem;
  };
  issues: AuditIssue[];
  suggestedPatch: Partial<PostRecord>;
  groundingSources: Array<{ title: string; url: string }>;
  verifiedAt: string;
}

export type RecruitmentRecordType = 
  | 'job_vacancy'
  | 'admit_card'
  | 'result_answerkey'
  | 'notification_corrigendum';

export interface UniversalExtractedData {
  recordType: RecruitmentRecordType;
  title: string;
  shortTitle: string;
  dept: string;
  category: 'mp-special' | 'latest-jobs' | 'tech-jobs' | 'admit-card' | 'results' | 'central';
  categories: string[];
  state: 'MP' | 'Central' | 'All India';
  totalPosts: string;
  qualification: string;
  eligibility: string;
  startDate: string | null;
  lastDate: string | null;
  lastDateFee: string | null;
  examDate: string | null;
  admitCardDate: string | null;
  feeGeneral: string;
  feeReserved: string;
  feePortal: string;
  minAge: string;
  maxAge: string;
  ageRelaxation: string;
  showReservationSection: boolean;
  isTechJob: boolean;
  description: string;
  roleOverview: string;
  selectionProcessText: string;
  applyUrl: string;
  notificationPdfUrl: string;
  officialSite: string;
  releaseDate?: string | null;
  downloadUrl?: string;
  resultDate?: string | null;
  scorecardUrl?: string;
  corrigendumDetails?: string;
  status: 'draft';
  isPublished: false;
  verificationTag: string;
  groundingSources: Array<{ title: string; url: string }>;
}

/**
 * Strict Anti-Hallucination & Recruitment Verification Instructions
 */
export function getRecruitmentVerificationSystemPrompt(currentIso: string): string {
  return `You are an authoritative verification agent for government and corporate recruitment data in India (NP Job Portal).
Current Execution Timestamp: "${currentIso}".

CRITICAL TIME-AWARENESS & DYNAMIC CYCLE RULES:
1. Do NOT assume, hardcode, or bias toward any specific calendar year.
2. Evaluate recruitment cycles strictly relative to the current execution timestamp (${currentIso}).
3. Recognize if a recruitment cycle is:
   - "Active ongoing application" (Start date <= current date <= Last date)
   - "Upcoming future notification" (Announced to start after current date)
   - "Announced exam date" (Exam date in the future)
   - "Recent release" (Admit card or result published within recent days/weeks)
   - "Closed / Expired" (Last date has passed)

STRICT ANTI-HALLUCINATION & DATE VERIFICATION RULES:
1. NEVER invent, project, or guess dates, vacancies, fees, or download links.
2. Accept dates, admit card links, and results ONLY if confirmed by official government portals (.gov.in, .nic.in, official exam boards like MPESB, MPOnline, SSC, UPSC, Railway RRB, NTA, IBPS, State PSCs) or authorized circulars.
3. If an application or exam is announced without firm dates, mark dates as null and status flag as 'शीघ्र उपलब्ध / Announced Soon'.
4. Do not treat clickbait articles, unverified forum leaks, or speculative blog posts as authoritative sources.
5. Direct download links and application links MUST point to official servers or authentic source pages, NOT third-party ad sites or link-shorteners.`;
}

const CANDIDATE_GEMINI_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite'
];

interface GenerateWithFallbackParams {
  contents: unknown;
  config?: unknown;
}

async function generateContentWithModelFallback(
  ai: GoogleGenAI,
  params: GenerateWithFallbackParams
) {
  let lastError: unknown = null;
  for (const modelName of CANDIDATE_GEMINI_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents as never,
        config: params.config as never
      });
      if (response && response.text) {
        return response;
      }
    } catch (err: unknown) {
      lastError = err;
      const errObj = err as { status?: string | number; code?: string | number; message?: string };
      console.warn(`Gemini model ${modelName} returned status ${errObj?.status || errObj?.code || 'error'}: ${errObj?.message || 'failed'}, trying fallback model...`);
    }
  }
  throw lastError || new Error('All candidate Gemini models are currently busy or unavailable');
}

/**
 * Performs deep audit and fact check on a single PostRecord using Google Search Grounding
 */
export async function auditPostWithGeminiGrounding(post: PostRecord): Promise<PostAuditResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const currentIso = new Date().toISOString();

  // Defensive fallback if no API key is provided
  if (!apiKey) {
    return createDefensiveAuditFallback(post, 'Gemini API key is not configured on the server.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstructions = getRecruitmentVerificationSystemPrompt(currentIso);

  const auditPrompt = `${systemInstructions}

TASK: Cross-examine the following portal recruitment post against LIVE official government sources using Google Search:
Target Job Title: "${post.title}"
Department / Board: "${post.dept || 'N/A'}"
Current Start Date: "${post.startDate || post.dates?.start || 'N/A'}"
Current Last Date: "${post.lastDate || post.dates?.end || 'N/A'}"
Current Exam Date: "${post.examDate || post.dates?.exam || 'N/A'}"
Current Total Vacancies: "${post.totalPosts || 'N/A'}"
Current Minimum Age: "${post.minAge || post.ageLimit?.min || 'N/A'}"
Current Maximum Age: "${post.maxAge || post.ageLimit?.max || 'N/A'}"
Current Qualification: "${post.qualification || 'N/A'}"
Current General Fee: "${post.feeGeneral || post.fee?.gen || 'N/A'}"
Current Reserved Fee: "${post.feeReserved || post.fee?.reserved || 'N/A'}"
Current Apply URL: "${post.applyLink || post.links?.apply || 'N/A'}"
Current Notification PDF URL: "${post.notificationPdf || post.links?.notificationPdf || 'N/A'}"
Current Official Website: "${post.links?.officialSite || 'N/A'}"
Current Category & State: "${post.category || 'latest-jobs'}" | "${post.state || 'MP'}"

CONDUCT MULTI-FIELD CONSISTENCY CHECK:
1. Dates Consistency:
   - Cross-check start dates, end dates, and exam dates against official circulars (.gov.in, .nic.in, MPESB, SSC, etc.).
   - Flag fabricated or expired dates. If rumors exist with no official notification, flag as unconfirmed and suggest removing fabricated dates.
2. Vacancies & Eligibility:
   - Verify post count, essential educational qualifications, and min/max age criteria.
3. Fee Structure:
   - Confirm category-wise application fees (UR/OBC/SC/ST/EWS).
4. Link Validation:
   - Check if Apply links and Notification PDF links point to authentic government portals rather than third-party spam/ad-farms.
5. Categorization:
   - Verify correct tagging (State vs Central, category).
6. Calculate Health Score (0 - 100):
   - 90-100: Fully verified with active official circulars.
   - 65-89: Minor date or fee discrepancies, but official notice exists.
   - Below 65: Unverified rumors, fabricated timeline, broken links, or expired post.
7. Self-Correction & Suggested Resolution:
   - Provide the EXACT corrected values found on official portals so the admin can fix them with a single click.

You MUST respond ONLY with a valid JSON object matching this structure:
{
  "healthScore": 95,
  "summary": "Brief 1-2 sentence diagnostic summary in Hindi/English",
  "timeline": {
    "status": "verified" | "warning" | "critical",
    "details": "string description",
    "verifiedStart": "dd/mm/yyyy or null or शीघ्र उपलब्ध",
    "verifiedEnd": "dd/mm/yyyy or null or शीघ्र उपलब्ध",
    "verifiedExam": "dd/mm/yyyy or null or शीघ्र घोषित"
  },
  "officialSource": {
    "status": "verified" | "warning" | "critical",
    "details": "string description",
    "verifiedPdfUrl": "official .gov.in/.nic.in PDF URL or authentic page",
    "verifiedApplyUrl": "official apply URL or portal"
  },
  "vacanciesAndEligibility": {
    "status": "verified" | "warning" | "critical",
    "details": "string description",
    "verifiedPosts": "e.g. 7500 or विज्ञप्ति अनुसार",
    "verifiedEligibility": "string concise eligibility",
    "verifiedAge": "e.g. 18-33 वर्ष"
  },
  "feeStructure": {
    "status": "verified" | "warning" | "critical",
    "details": "string description",
    "verifiedGeneralFee": "₹500/-",
    "verifiedReservedFee": "₹250/-"
  },
  "categorization": {
    "status": "verified" | "warning" | "critical",
    "details": "string description",
    "verifiedCategory": "mp-special or latest-jobs or central",
    "verifiedState": "MP or Central or All India"
  },
  "issues": [
    {
      "field": "Field Name (e.g. Last Date, Total Posts, Notification PDF)",
      "issue": "Specific issue description (e.g. Start/End dates mismatch with MPESB notification)",
      "current": "current portal value",
      "verified": "AI-verified ground truth value",
      "severity": "critical" | "warning" | "info"
    }
  ],
  "suggestedPatch": {
    "startDate": "dd/mm/yyyy",
    "lastDate": "dd/mm/yyyy",
    "examDate": "dd/mm/yyyy or शीघ्र घोषित",
    "totalPosts": "verified posts",
    "qualification": "verified qualification",
    "applyLink": "verified official URL",
    "notificationPdf": "verified official PDF URL"
  }
}`;

  try {
    const response = await generateContentWithModelFallback(ai, {
      contents: auditPrompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const responseText = response.text || '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini did not return a valid JSON verification object');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Extract search grounding sources
    const groundingMetadata = (response.candidates?.[0] as { groundingMetadata?: { groundingChunks?: Array<{ web?: { title?: string; uri?: string } }> } })?.groundingMetadata;
    const groundingSources: Array<{ title: string; url: string }> = [];
    if (groundingMetadata?.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || 'Official Government Portal',
            url: chunk.web.uri
          });
        }
      }
    }

    const healthScore = Math.min(100, Math.max(0, Number(parsed.healthScore) || 75));
    const statusBadge: 'verified' | 'warning' | 'critical' = 
      healthScore >= 85 ? 'verified' : healthScore >= 60 ? 'warning' : 'critical';

    // Format clean suggested patch
    const patch: Partial<PostRecord> = {
      ...(parsed.suggestedPatch || {})
    };

    // If patch contains dates, ensure both top-level and nested dates object are formatted
    if (patch.startDate || patch.lastDate || patch.examDate) {
      patch.dates = {
        start: patch.startDate || post.dates?.start || post.startDate || '',
        end: patch.lastDate || post.dates?.end || post.lastDate || '',
        exam: patch.examDate || post.dates?.exam || post.examDate || 'शीघ्र घोषित'
      };
    }

    if (patch.applyLink || patch.notificationPdf) {
      patch.links = {
        apply: patch.applyLink || post.links?.apply || post.applyLink || '',
        notificationPdf: patch.notificationPdf || post.links?.notificationPdf || post.notificationPdf || '',
        officialSite: post.links?.officialSite || 'https://esb.mp.gov.in'
      };
    }

    return {
      jobId: post.id,
      title: post.title,
      healthScore,
      statusBadge,
      summary: parsed.summary || 'जांच पूर्ण हुई।',
      isVerified: healthScore >= 85,
      diagnosticBreakdown: {
        timeline: parsed.timeline || { status: 'warning', details: 'समयसीमा की पुनः पुष्टि करें' },
        officialSource: parsed.officialSource || { status: 'verified', details: 'अधिकृत यूआरएल लिंक' },
        vacanciesAndEligibility: parsed.vacanciesAndEligibility || { status: 'verified', details: 'पात्रता मानक सत्यापित' },
        feeStructure: parsed.feeStructure || { status: 'verified', details: 'शुल्क संरचना' },
        categorization: parsed.categorization || { status: 'verified', details: 'सही श्रेणीबद्ध' }
      },
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      suggestedPatch: patch,
      groundingSources,
      verifiedAt: currentIso
    };
  } catch (err) {
    console.error('Gemini Audit Error:', err);
    return createDefensiveAuditFallback(post, (err as Error).message || 'जांच के दौरान नेटवर्क या सत्यापन में त्रुटि आई।');
  }
}

/**
 * Fallback audit response when API key is missing or internet search fails gracefully
 */
function createDefensiveAuditFallback(post: PostRecord, reason: string): PostAuditResult {
  const hasGovPdf = post.notificationPdf?.includes('.gov.in') || post.links?.notificationPdf?.includes('.gov.in');
  const hasApply = Boolean(post.applyLink || post.links?.apply);

  const score = hasGovPdf && hasApply ? 80 : 50;
  return {
    jobId: post.id,
    title: post.title,
    healthScore: score,
    statusBadge: score >= 80 ? 'warning' : 'critical',
    summary: `स्वचालित सत्यापन सीमित मोड में है (${reason})। अधिकृत पोर्टल पर मैन्युअल जांच की सिफारिश की जाती है।`,
    isVerified: false,
    diagnosticBreakdown: {
      timeline: {
        status: post.lastDate ? 'warning' : 'critical',
        details: post.lastDate ? `वर्तमान अंतिम तिथि: ${post.lastDate}` : 'अंतिम तिथि उपलब्ध नहीं है।'
      },
      officialSource: {
        status: hasGovPdf ? 'verified' : 'warning',
        details: hasGovPdf ? 'अधिकृत .gov.in लिंक संलग्न है।' : 'नोटिफिकेशन लिंक की पुष्टि आवश्यक है।'
      },
      vacanciesAndEligibility: {
        status: 'verified',
        details: `कुल पद: ${post.totalPosts || 'विज्ञप्ति अनुसार'}`
      },
      feeStructure: {
        status: 'verified',
        details: `सामान्य: ${post.feeGeneral || 'विज्ञप्ति अनुसार'}`
      },
      categorization: {
        status: 'verified',
        details: `राज्य: ${post.state || 'MP'}`
      }
    },
    issues: [
      {
        field: 'Live Grounding',
        issue: 'लाइव सर्च ग्राउंडिंग परिणाम उपलब्ध नहीं हो सके।',
        current: post.lastDate || 'N/A',
        verified: 'पुनः जांच (Retry) करें',
        severity: 'warning'
      }
    ],
    suggestedPatch: {},
    groundingSources: [
      { title: 'MP Employees Selection Board (MPESB)', url: 'https://esb.mp.gov.in' },
      { title: 'MP Online Portal', url: 'https://mponline.gov.in' }
    ],
    verifiedAt: new Date().toISOString()
  };
}

/**
 * Universal Scraper & Extractor with Google Search Grounding & Multi-Category Extraction
 */
export async function extractUniversalRecruitmentWithGrounding(
  urlOrText: { url?: string; rawText?: string }
): Promise<UniversalExtractedData> {
  const apiKey = process.env.GEMINI_API_KEY;
  const currentIso = new Date().toISOString();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for Recruitment Intelligence Engine');
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemPrompt = getRecruitmentVerificationSystemPrompt(currentIso);

  const extractionPrompt = `${systemPrompt}

You are an advanced recruitment intelligence extractor for India's NP Job Portal.
Analyze the target URL or text, search the live web for official government notices, and classify the record into EXACTLY ONE of the 4 distinct record types:

1. "job_vacancy" - Latest Jobs / Vacancies
   Required: Verified Start Date, Last Date, Fee Payment Last Date, Total Vacancies, Eligibility, Official Notification PDF Link, and Direct Apply Link.
2. "admit_card" - Admit Cards / Hall Tickets
   Required: Exam Name, Release Date, Exact Exam Date/Schedule, and Direct Official Admit Card Download URL.
3. "result_answerkey" - Results / Merit Lists / Answer Keys
   Required: Exam/Post Name, Declaration Date, Cut-off / Result Notice PDF Link, and Official Scorecard Portal URL.
4. "notification_corrigendum" - Important Notifications / Corrigendum
   Required: Re-opened dates, postponement notices, syllabus revisions, or vacancy updates with exact reference links.

CRITICAL EXTRACTION RULES:
- All dates MUST strictly be in dd/mm/yyyy format or null if not firmly announced.
- NEVER invent, project, or guess dates, vacancies, or download links.
- Direct download links must point to official servers or authentic source pages (.gov.in, .nic.in, mponline, official boards), NOT third-party ad sites.
- Newly scraped records MUST default to status: "draft" and isPublished: false.

Return pure valid JSON matching this schema:
{
  "recordType": "job_vacancy" | "admit_card" | "result_answerkey" | "notification_corrigendum",
  "title": "Full Official Title in English & Hindi",
  "shortTitle": "Compact Title (max 30 chars)",
  "dept": "Official Department / Board (e.g. MPESB, SSC, UPSC, Railway)",
  "category": "mp-special" | "latest-jobs" | "tech-jobs" | "admit-card" | "results" | "central",
  "categories": ["vacancy", "mp_special"],
  "state": "MP" | "Central" | "All India",
  "totalPosts": "string (e.g. 7500 or विज्ञप्ति अनुसार)",
  "qualification": "Essential educational qualification in Hindi/English",
  "eligibility": "Compact eligibility summary",
  "startDate": "dd/mm/yyyy or null",
  "lastDate": "dd/mm/yyyy or null",
  "lastDateFee": "dd/mm/yyyy or null",
  "examDate": "dd/mm/yyyy or null",
  "admitCardDate": "dd/mm/yyyy or null",
  "feeGeneral": "₹500/- or Free",
  "feeReserved": "₹250/- or Free",
  "feePortal": "₹50/-",
  "minAge": "18 वर्ष",
  "maxAge": "33 वर्ष",
  "ageRelaxation": "नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट",
  "showReservationSection": true,
  "isTechJob": false,
  "description": "Rich 2-3 paragraph informative overview in Hindi",
  "roleOverview": "Key duties and role overview in Hindi",
  "selectionProcessText": "Written Exam -> Physical Test -> Document Verification",
  "applyUrl": "Official application URL",
  "notificationPdfUrl": "Official PDF link or notice circular URL",
  "officialSite": "Official authority website home page",
  "releaseDate": "dd/mm/yyyy (if admit card or result)",
  "downloadUrl": "Direct download link (if admit card)",
  "resultDate": "dd/mm/yyyy (if result)",
  "scorecardUrl": "Direct scorecard portal (if result)",
  "corrigendumDetails": "Details of amendment/postponement/re-open (if corrigendum)",
  "verificationTag": "Live Internet Grounded"
}`;

  const response = await generateContentWithModelFallback(ai, {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${extractionPrompt}\n\nTarget URL: ${urlOrText.url || 'N/A'}\n\nInput Content:\n${(urlOrText.rawText || '').slice(0, 10000)}`
          }
        ]
      }
    ],
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const responseText = response.text || '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Gemini did not return valid JSON for multi-category extraction');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  // Extract grounding sources
  const groundingMetadata = (response.candidates?.[0] as { groundingMetadata?: { groundingChunks?: Array<{ web?: { title?: string; uri?: string } }> } })?.groundingMetadata;
  const groundingSources: Array<{ title: string; url: string }> = [];
  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      if (chunk.web?.uri) {
        groundingSources.push({
          title: chunk.web.title || 'Official Source',
          url: chunk.web.uri
        });
      }
    }
  }

  return {
    ...parsed,
    status: 'draft',
    isPublished: false,
    groundingSources
  };
}
