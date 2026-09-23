import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { url, rawText } = await req.json();

    if (!url && !rawText) {
      return NextResponse.json(
        { error: 'Please provide a URL or job post text to extract' },
        { status: 400 }
      );
    }

    let contentToAnalyze = rawText || '';

    // If URL is provided, attempt to fetch the HTML / text content
    if (url && !contentToAnalyze) {
      try {
        const fetchRes = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9'
          },
          next: { revalidate: 0 }
        });

        if (fetchRes.ok) {
          const html = await fetchRes.text();
          // Strip basic scripts and tags to extract readable text
          contentToAnalyze = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 15000); // Send first 15k chars to Gemini
        }
      } catch (fetchErr) {
        console.warn('Direct fetch failed, relying on URL prompt context:', fetchErr);
      }
    }

    // Initialize Gemini SDK with GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return structured fallback if API key is not yet set
      const fallbackTitle = url ? url.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'New Job Alert' : 'New Job Alert';
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`;

      return NextResponse.json({
        success: true,
        isGeminiVerified: false,
        extractedJob: {
          title: fallbackTitle.toUpperCase(),
          shortTitle: fallbackTitle.slice(0, 30),
          dept: 'Recruitment Board',
          totalPosts: 'विज्ञप्ति अनुसार',
          qualification: 'विस्तृत अधिसूचना देखें',
          eligibility: 'विस्तृत अधिसूचना देखें',
          lastDate: todayStr,
          startDate: todayStr,
          examDate: 'शीघ्र घोषित',
          admitCardDate: 'परीक्षा से 7 दिन पूर्व',
          feeGeneral: '₹500/-',
          feeReserved: '₹250/-',
          feePortal: '₹50/-',
          minAge: '18 वर्ष',
          maxAge: '35 वर्ष',
          ageRelaxation: 'नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट',
          showReservationSection: true,
          applyUrl: url || 'https://esb.mp.gov.in',
          notificationPdfUrl: url || 'https://esb.mp.gov.in',
          status: 'draft',
          sourceUrl: url || ''
        }
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert Government & Corporate Job data extractor for "NP Job Portal" in India.
Analyze the provided job URL or text and extract clean, structured job post data.
All dates MUST strictly be in dd/mm/yyyy format (e.g. 15/04/2026). If unknown, use "शीघ्र घोषित" or "विज्ञप्ति अनुसार".
All fee amounts must include currency symbol (e.g. ₹500/- or Free).
If it is an IT / Corporate / MNC job:
- set isTechJob: true
- set showReservationSection: false
- extract role, location, batchEligibility
If it is a Government job:
- set isTechJob: false
- set showReservationSection: true

You MUST return pure valid JSON matching this schema:
{
  "title": "string (Full Job Title e.g. MP Police Constable Recruitment 2026)",
  "shortTitle": "string (Max 30 chars e.g. MP Police Constable)",
  "dept": "string (Department name e.g. MP Police / TCS / SSC)",
  "category": "string (one of: mp-special, latest-jobs, tech-jobs, admit-card, results)",
  "totalPosts": "string (e.g. 7500 or Various)",
  "qualification": "string (e.g. 10th / 12th Pass or B.Tech/MCA)",
  "eligibility": "string (compact summary)",
  "startDate": "string (dd/mm/yyyy)",
  "lastDate": "string (dd/mm/yyyy)",
  "lastDateFee": "string (dd/mm/yyyy)",
  "examDate": "string (dd/mm/yyyy or शीघ्र घोषित)",
  "admitCardDate": "string (dd/mm/yyyy or परीक्षा से 7 दिन पूर्व)",
  "feeGeneral": "string (e.g. ₹500/-)",
  "feeReserved": "string (e.g. ₹250/-)",
  "feePortal": "string (e.g. ₹50/-)",
  "paymentMode": "string (e.g. Online Net Banking, Debit/Credit Card, UPI)",
  "minAge": "string (e.g. 18 वर्ष)",
  "maxAge": "string (e.g. 33 वर्ष)",
  "ageRelaxation": "string (e.g. SC/ST/OBC 5 वर्ष छूट)",
  "showReservationSection": true,
  "isTechJob": false,
  "description": "string (A detailed, high-quality, 2-3 paragraph Hindi explanation of what this recruitment is, what work the selected candidates do, and why candidates should apply)",
  "roleOverview": "string (Key responsibilities & work profile in Hindi)",
  "selectionProcess": "string (Step-by-step selection stages in Hindi)",
  "location": "string (if tech job, e.g. Gurugram / Remote)",
  "batchEligibility": "string (if tech job, e.g. 2025/2026 Passouts)",
  "applyUrl": "string (official application link)",
  "notificationPdfUrl": "string (official PDF notification link)",
  "officialSite": "string (official website home)"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemPrompt}\n\nTarget URL: ${url || 'N/A'}\n\nContent:\n${contentToAnalyze.slice(0, 10000)}`
            }
          ]
        }
      ]
    });

    const responseText = response.text || '';
    // Extract JSON block
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini did not return valid JSON');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      isGeminiVerified: true,
      extractedJob: {
        ...parsedData,
        status: 'draft',
        sourceUrl: url || ''
      }
    });
  } catch (error: unknown) {
    console.error('Error extracting job data:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to extract job data' },
      { status: 500 }
    );
  }
}
