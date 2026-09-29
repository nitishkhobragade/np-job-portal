import { GoogleGenAI } from '@google/genai';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PostRecord } from '../types';

export interface SarkariListingItem {
  title: string;
  url: string;
  source: string;
}

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8216;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function generateCleanSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Checks whether a job with matching slug or title already exists in Firestore.
 */
export async function isJobAlreadyInFirestore(slug: string, title: string): Promise<boolean> {
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
    console.warn('Firestore duplicate check warning:', err);
    return false;
  }
}

/**
 * Fetches recent job links from https://sarkariresult.com.cm/latest-jobs/ and https://sarkariresult.com.cm/
 */
export async function fetchSarkariCmJobListings(): Promise<SarkariListingItem[]> {
  const listings: SarkariListingItem[] = [];
  const urls = [
    'https://sarkariresult.com.cm/latest-jobs/',
    'https://sarkariresult.com.cm/'
  ];

  const seenUrls = new Set<string>();

  for (const pageUrl of urls) {
    try {
      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(8000)
      });

      if (!res.ok) continue;

      const html = await res.text();
      const linkRegex = /<a[^>]+href=["'](https:\/\/sarkariresult\.com\.cm\/[^"']+)["'][^>]*>(.*?)<\/a>/gi;
      const matches = [...html.matchAll(linkRegex)];

      const ignoredSlugs = [
        'latest-jobs', 'admit-card', 'result', 'admission', 'syllabus',
        'answer-key', 'contact-us', 'disclaimer', 'privacy-policy', 'about-us',
        'category', 'tag', 'page', 'author', 'feed'
      ];

      for (const m of matches) {
        const link = m[1].trim();
        const rawTitle = cleanHtmlEntities(m[2]);

        if (seenUrls.has(link)) continue;
        if (rawTitle.length < 12) continue;

        const isIgnored = ignoredSlugs.some(ign => link.endsWith(`/${ign}/`) || link.endsWith(`/${ign}`));
        if (isIgnored) continue;

        seenUrls.add(link);
        listings.push({
          title: rawTitle,
          url: link,
          source: 'sarkariresult.com.cm'
        });
      }
    } catch (err) {
      console.warn(`Error fetching ${pageUrl}:`, err);
    }
  }

  return listings;
}

/**
 * Cleans raw HTML text into readable text for AI processing
 */
export function extractCleanText(html: string): string {
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
    .slice(0, 18000);
}

/**
 * Extracts comprehensive job schema using Gemini with Google Search Grounding
 */
export async function extractJobDataWithGemini(
  title: string,
  url: string,
  pageText: string
): Promise<Partial<PostRecord> | null> {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  if (!apiKey) return null;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'np-job-portal-scraper' } }
  });

  const prompt = `You are an expert government recruitment analyst for NP Job Portal (by Nitish Khobragade).
Analyze this official recruitment circular/page text and extract verified structured details.
Use Google Search Grounding to verify actual official notification dates, vacancy counts, and links if missing in the text.

Job Title: ${title}
Page URL: ${url}

Raw Page Content:
${pageText || 'Use Google Search Grounding to verify this recruitment'}

Strictly follow these rules:
1. Zero-Hallucination: If any date or fee is unannounced or not released yet, write "शीघ्र उपलब्ध / Announced Soon".
2. Categorization: Choose category strictly from: "latest-jobs", "mp-special", "central", "police", "teaching", "railway", "banking", "tech-jobs".
3. Dates format: Standard DD/MM/YYYY or text.
4. Output MUST be valid JSON adhering to this exact schema:

{
  "title": "string (Clean official title in Hindi/English, e.g. RRC Western Railway Apprentice 2026 Online Form)",
  "shortTitle": "string (Short title under 35 chars)",
  "dept": "string (Department or Board name)",
  "advtNo": "string (Advt No or Notification No)",
  "category": "string (one of: latest-jobs, mp-special, central, police, teaching, railway, banking, tech-jobs)",
  "totalPosts": "string (Total number of posts, e.g. 5050 Posts)",
  "startDate": "string",
  "lastDate": "string",
  "lastDateFee": "string",
  "correctionDate": "string",
  "examDate": "string",
  "admitCardDate": "string",
  "feeGeneral": "string (e.g. ₹100/- or 0/-)",
  "feeOBC": "string",
  "feeEWS": "string",
  "feeSCST": "string",
  "feeFemale": "string",
  "paymentMode": "string (Online Debit Card / Credit Card / Net Banking / UPI)",
  "minAge": "string (e.g. 15 वर्ष)",
  "maxAge": "string (e.g. 24 वर्ष)",
  "ageCalculationDate": "string (Crucial cutoff date)",
  "ageRelaxation": "string",
  "qualificationSummary": "string (Essential eligibility in 1-2 lines)",
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
  "physicalStandards": [],
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
  "applyUrl": "string (Direct link to apply online)",
  "notificationPdfUrl": "string (Direct official PDF notification link)",
  "syllabusUrl": "string",
  "officialWebsiteUrl": "string"
}

Respond ONLY with valid JSON.`;

  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ];

  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          tools: [{ googleSearch: {} }]
        }
      });

      if (response && response.text) {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
    } catch (err) {
      console.warn(`Gemini extraction with ${model} warning:`, err);
    }
  }

  return null;
}

/**
 * Runs a batch auto-scraper within Vercel execution limits (< 20 seconds)
 * and Firebase rules. Extracts up to `limit` new government jobs and saves drafts.
 */
export async function runSafeBatchAutoScraper(limit: number = 3): Promise<{
  success: boolean;
  imported: PostRecord[];
  skipped: string[];
  totalScanned: number;
  message: string;
}> {
  const imported: PostRecord[] = [];
  const skipped: string[] = [];

  try {
    // 1. Fetch recent listings from sarkariresult.com.cm
    const listings = await fetchSarkariCmJobListings();
    if (listings.length === 0) {
      return {
        success: true,
        imported: [],
        skipped: [],
        totalScanned: 0,
        message: 'No new listings fetched at this moment.'
      };
    }

    // 2. Filter non-duplicates
    const candidatesToProcess: SarkariListingItem[] = [];

    for (const item of listings) {
      if (candidatesToProcess.length >= limit) break;

      const slug = generateCleanSlug(item.title);
      const isDup = await isJobAlreadyInFirestore(slug, item.title);

      if (isDup) {
        skipped.push(item.title);
      } else {
        candidatesToProcess.push(item);
      }
    }

    // 3. For each candidate, fetch page content and extract structured data
    for (const item of candidatesToProcess) {
      try {
        let pageText = '';
        try {
          const pageRes = await fetch(item.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            signal: AbortSignal.timeout(6000)
          });
          if (pageRes.ok) {
            const rawHtml = await pageRes.text();
            pageText = extractCleanText(rawHtml);
          }
        } catch (fetchErr) {
          console.warn(`Could not fetch details for ${item.url}:`, fetchErr);
        }

        const extracted = await extractJobDataWithGemini(item.title, item.url, pageText);
        const finalTitle = extracted?.title || item.title;
        const slug = generateCleanSlug(finalTitle);
        const id = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
        const nowIso = new Date().toISOString();

        const newPost: PostRecord = {
          id,
          slug,
          title: finalTitle,
          shortTitle: extracted?.shortTitle || finalTitle.slice(0, 35),
          category: extracted?.category || 'latest-jobs',
          dept: extracted?.dept || 'सरकारी भर्ती प्रकोष्ठ',
          advtNo: extracted?.advtNo || 'विज्ञप्ति अनुसार',
          totalPosts: extracted?.totalPosts || 'विज्ञप्ति अनुसार',
          startDate: extracted?.startDate || 'शीघ्र उपलब्ध / Announced Soon',
          lastDate: extracted?.lastDate || 'शीघ्र उपलब्ध / Announced Soon',
          lastDateFee: extracted?.lastDateFee || extracted?.lastDate || 'शीघ्र उपलब्ध / Announced Soon',
          correctionDate: extracted?.correctionDate || 'शीघ्र उपलब्ध / Announced Soon',
          examDate: extracted?.examDate || 'शीघ्र घोषित',
          admitCardDate: extracted?.admitCardDate || 'परीक्षा से 7 दिन पूर्व',
          feeGeneral: extracted?.feeGeneral || 'विस्तृत अधिसूचना देखें',
          feeOBC: extracted?.feeOBC || extracted?.feeGeneral || 'विस्तृत अधिसूचना देखें',
          feeEWS: extracted?.feeEWS || extracted?.feeGeneral || 'विस्तृत अधिसूचना देखें',
          feeSCST: extracted?.feeSCST || 'नियमानुसार',
          feeFemale: extracted?.feeFemale || 'नियमानुसार',
          feePortal: '₹60/- (पोर्टल शुल्क अतिरिक्त)',
          paymentMode: extracted?.paymentMode || 'ऑनलाइन (डेबिट/क्रेडिट कार्ड, नेट बैंकिंग, यूपीआई)',
          minAge: extracted?.minAge || '18 वर्ष',
          maxAge: extracted?.maxAge || '40 वर्ष',
          ageCalculationDate: extracted?.ageCalculationDate || '01/01/2026',
          ageRelaxation: extracted?.ageRelaxation || 'आरक्षित वर्गों को नियमानुसार आयु सीमा में छूट',
          qualificationSummary: extracted?.qualificationSummary || '10वीं / 12वीं / स्नातक / आईटीआई (विस्तृत अधिसूचना देखें)',
          description: pageText ? pageText.slice(0, 1500) : 'आधिकारिक अधिसूचना अनुसार पद विवरण।',
          vacanciesBreakdown: extracted?.vacanciesBreakdown || [
            { postName: finalTitle, total: extracted?.totalPosts || 'विज्ञप्ति अनुसार', eligibility: 'विस्तृत अधिसूचना देखें' }
          ],
          categoryWisePosts: extracted?.categoryWisePosts || [],
          physicalStandards: extracted?.physicalStandards || [],
          howToApplySteps: extracted?.howToApplySteps || [
            'चरण 1: आधिकारिक नोटिफिकेशन डाउनलोड करके सभी नियम व पात्रता शर्तें अच्छी तरह पढ़ें।',
            'चरण 2: ऑनलाइन आवेदन के लिए आधिकारिक पोर्टल पर जाकर न्यू रजिस्ट्रेशन करें।',
            'चरण 3: आवश्यक दस्तावेज (अंकसूची, आधार कार्ड, फोटो, हस्ताक्षर) अपलोड करें।',
            'चरण 4: श्रेणीवार निर्धारित आवेदन शुल्क का ऑनलाइन भुगतान करें।',
            'चरण 5: भरे हुए आवेदन फॉर्म का फाइनल प्रिंटआउट सुरक्षित निकाल लें।'
          ],
          requiredDocuments: extracted?.requiredDocuments || [
            '10वीं / 12वीं अंकसूची',
            'आधार कार्ड / पहचान पत्र',
            'नवीनतम पासपोर्ट साइज फोटो',
            'हस्ताक्षर',
            'जाति व निवास प्रमाण पत्र (लागू होने पर)'
          ],
          applyUrl: extracted?.applyUrl || item.url,
          notificationPdfUrl: extracted?.notificationPdfUrl || item.url,
          syllabusUrl: extracted?.syllabusUrl || '',
          officialWebsiteUrl: extracted?.officialWebsiteUrl || 'https://sarkariresult.com.cm',
          sourceUrl: item.url,
          sourceName: item.source,
          status: 'draft',
          isPublished: false,
          views: 0,
          shares: 0,
          author: 'Nitish Khobragade (NP Job Portal - NTechBay)',
          createdAt: nowIso,
          updatedAt: nowIso,
          isTrending: false,
          isUrgent: false
        };

        // Write directly to Firestore
        await setDoc(doc(db, 'posts', id), newPost);
        imported.push(newPost);
      } catch (itemErr) {
        console.warn(`Failed to process item ${item.title}:`, itemErr);
      }
    }

    return {
      success: true,
      imported,
      skipped,
      totalScanned: listings.length,
      message: `सफलतापूर्वक ${imported.length} नए जॉब ड्राफ्ट तैयार किए गए (${skipped.length} डुप्लीकेट स्किप किए गए)`
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      imported,
      skipped,
      totalScanned: 0,
      message: error.message || 'Auto-scraper batch failed'
    };
  }
}
