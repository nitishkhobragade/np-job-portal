import { NextRequest, NextResponse } from 'next/server';
import { extractUniversalRecruitmentWithGrounding } from '../../../../lib/recruitmentIntelligence';

export const maxDuration = 60;

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

    // If URL is provided, attempt to fetch the HTML / text content for prompt grounding context
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
          // Strip scripts and tags to extract clean text
          contentToAnalyze = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .slice(0, 15000);
        }
      } catch (fetchErr) {
        console.warn('Direct fetch failed, relying on Google Search Grounding:', fetchErr);
      }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackTitle = url
        ? url.split('/').filter(Boolean).pop()?.replace(/[-_]/g, ' ') || 'New Recruitment Alert'
        : 'New Recruitment Alert';
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();
      const todayStr = `${dd}/${mm}/${yyyy}`;

      return NextResponse.json({
        success: true,
        isGeminiVerified: false,
        extractedJob: {
          recordType: 'job_vacancy',
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
          officialSite: 'https://esb.mp.gov.in',
          status: 'draft',
          isPublished: false,
          sourceUrl: url || '',
          groundingSources: []
        }
      });
    }

    const extracted = await extractUniversalRecruitmentWithGrounding({
      url,
      rawText: contentToAnalyze
    });

    return NextResponse.json({
      success: true,
      isGeminiVerified: true,
      extractedJob: {
        ...extracted,
        status: 'draft',
        isPublished: false,
        sourceUrl: url || ''
      }
    });
  } catch (error: unknown) {
    console.error('Error in /api/scraper/extract:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to extract recruitment data' },
      { status: 500 }
    );
  }
}
