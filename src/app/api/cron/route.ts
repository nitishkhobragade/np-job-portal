import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    decommissioned: true,
    message: 'Automated cron-job architecture has been replaced with on-demand manual AI scraper inside the Admin Dashboard.'
  }, { status: 200 });
}

export async function POST() {
  return GET();
}
