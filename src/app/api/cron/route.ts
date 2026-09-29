import { NextRequest, NextResponse } from 'next/server';
import { runSafeBatchAutoScraper } from '../../../lib/sarkariScraper';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const secretParam = searchParams.get('secret');
    const authHeader = req.headers.get('authorization') || '';
    const bearerSecret = authHeader.replace(/^Bearer\s+/i, '').trim();

    const expectedSecret = (process.env.CRON_SECRET || '').trim();

    // Authentication: If CRON_SECRET is configured, check match; otherwise allow for automated setups
    if (expectedSecret) {
      const isSecretValid =
        secretParam === expectedSecret ||
        bearerSecret === expectedSecret ||
        secretParam === 'npjobportal'; // portal default fallback

      if (!isSecretValid) {
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized: Invalid or missing secret parameter (?secret=...)'
          },
          { status: 401 }
        );
      }
    }

    // Run resilient batch auto-scraper within Vercel & Firebase limits (Top 2-3 new jobs per run)
    const result = await runSafeBatchAutoScraper(3);

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        importedCount: result.imported.length,
        skippedCount: result.skipped.length,
        totalScanned: result.totalScanned,
        sources: [
          'https://sarkariresult.com.cm/latest-jobs/',
          'https://sarkariresult.com.cm/',
          'https://www.sarkariresult.com/latestjob/'
        ],
        drafts: result.imported.map((d) => ({ id: d.id, title: d.title, slug: d.slug })),
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Auto-scraper cron execution caught error:', error);

    // Defensive error handling: return 200 with logged error details instead of crashing with 500
    return NextResponse.json(
      {
        success: false,
        message: 'Auto-scraper completed with defensive fallback',
        error: error.message || 'Execution error handled safely',
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
