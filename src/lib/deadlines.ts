/**
 * Deadlines and Urgency Utility for NP Job Portal
 * Detects jobs closing "आज" (Today), "कल" (Tomorrow), or "परसों" (Day after tomorrow).
 */

import { JobItem, PostRecord } from '../types';

export type UrgencyType = 'today' | 'tomorrow' | 'day_after_tomorrow' | 'closing_soon' | 'future' | 'expired';

export interface DeadlineInfo {
  diffDays: number;
  urgencyType: UrgencyType;
  badgeText: string;
  badgeSubText: string;
  badgeColorClass: string;
  borderClass: string;
  bgClass: string;
  pulse: boolean;
  formattedLastDate: string;
}

const HINDI_MONTH_MAP: Record<string, number> = {
  जनवरी: 1,
  फ़रवरी: 2,
  फरवरी: 2,
  मार्च: 3,
  अप्रैल: 4,
  मई: 5,
  जून: 6,
  जुलाई: 7,
  अगस्त: 8,
  सितंबर: 9,
  सितम्बर: 9,
  अक्टूबर: 10,
  अक्तूबर: 10,
  नवंबर: 11,
  नवम्बर: 11,
  दिसंबर: 12,
  दिसम्बर: 12,
};

/**
 * Safely parse a date string into [year, month, day]
 */
export function parseDateComponents(dateStr?: string | null): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const str = String(dateStr).trim();

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    return {
      day: parseInt(dmyMatch[1], 10),
      month: parseInt(dmyMatch[2], 10),
      year: parseInt(dmyMatch[3], 10),
    };
  }

  // Format: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10),
      day: parseInt(ymdMatch[3], 10),
    };
  }

  // Format with Hindi month name e.g. "25 सितंबर 2026"
  const hindiMatch = str.match(/(\d{1,2})\s+([^\s\d]+)\s+(\d{4})/);
  if (hindiMatch) {
    const day = parseInt(hindiMatch[1], 10);
    const monthName = hindiMatch[2];
    const year = parseInt(hindiMatch[3], 10);
    const m = HINDI_MONTH_MAP[monthName];
    if (m) {
      return { year, month: m, day };
    }
  }

  // Fallback to standard Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  }

  return null;
}

/**
 * Calculates days remaining from today midnight to target midnight
 */
export function getDeadlineUrgency(lastDateStr?: string | null): DeadlineInfo {
  const defaultInfo: DeadlineInfo = {
    diffDays: 999,
    urgencyType: 'future',
    badgeText: 'विज्ञप्ति अनुसार',
    badgeSubText: '',
    badgeColorClass: 'bg-slate-700 text-slate-200',
    borderClass: 'border-slate-700',
    bgClass: 'bg-slate-900',
    pulse: false,
    formattedLastDate: lastDateStr || 'विज्ञप्ति देखें',
  };

  if (!lastDateStr) return defaultInfo;

  const comps = parseDateComponents(lastDateStr);
  if (!comps) {
    return {
      ...defaultInfo,
      formattedLastDate: lastDateStr,
    };
  }

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetMidnight = new Date(comps.year, comps.month - 1, comps.day).getTime();

  const diffMs = targetMidnight - todayMidnight;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const pad = (n: number) => String(n).padStart(2, '0');
  const formattedLastDate = `${pad(comps.day)}/${pad(comps.month)}/${comps.year}`;

  if (diffDays < 0) {
    return {
      diffDays,
      urgencyType: 'expired',
      badgeText: 'अंतिम तिथि समाप्त',
      badgeSubText: 'आवेदन प्रक्रिया बंद',
      badgeColorClass: 'bg-slate-800 text-slate-400',
      borderClass: 'border-slate-800',
      bgClass: 'bg-slate-950',
      pulse: false,
      formattedLastDate,
    };
  }

  if (diffDays === 0) {
    return {
      diffDays: 0,
      urgencyType: 'today',
      badgeText: '🔴 आज अंतिम तिथि! (CLOSING TODAY)',
      badgeSubText: 'आज रात 11:59 PM पर पोर्टल बंद हो जाएगा',
      badgeColorClass: 'bg-red-600 text-white shadow-lg shadow-red-500/50',
      borderClass: 'border-red-500 hover:border-red-400',
      bgClass: 'bg-red-950/40',
      pulse: true,
      formattedLastDate,
    };
  }

  if (diffDays === 1) {
    return {
      diffDays: 1,
      urgencyType: 'tomorrow',
      badgeText: '🟠 कल अंतिम तिथि! (CLOSING TOMORROW)',
      badgeSubText: 'कल शाम तक सर्वर स्लो होने की संभावना',
      badgeColorClass: 'bg-orange-600 text-white shadow-lg shadow-orange-500/40',
      borderClass: 'border-orange-500 hover:border-orange-400',
      bgClass: 'bg-orange-950/30',
      pulse: true,
      formattedLastDate,
    };
  }

  if (diffDays === 2) {
    return {
      diffDays: 2,
      urgencyType: 'day_after_tomorrow',
      badgeText: '🟡 परसों अंतिम तिथि! (DAY AFTER TOMORROW)',
      badgeSubText: 'केवल 48 घंटे शेष — तुरंत फॉर्म भरें',
      badgeColorClass: 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black',
      borderClass: 'border-amber-400 hover:border-amber-300',
      bgClass: 'bg-amber-950/20',
      pulse: false,
      formattedLastDate,
    };
  }

  if (diffDays === 3) {
    return {
      diffDays: 3,
      urgencyType: 'closing_soon',
      badgeText: '⚡ 3 दिन शेष (CLOSING IN 3 DAYS)',
      badgeSubText: 'अंतिम समय में सर्वर डाउन से बचें',
      badgeColorClass: 'bg-yellow-500 text-slate-950 font-black',
      borderClass: 'border-yellow-400',
      bgClass: 'bg-yellow-950/20',
      pulse: false,
      formattedLastDate,
    };
  }

  return {
    diffDays,
    urgencyType: 'future',
    badgeText: `${diffDays} दिन शेष`,
    badgeSubText: 'आवेदन प्रक्रिया चालू',
    badgeColorClass: 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40',
    borderClass: 'border-slate-800',
    bgClass: 'bg-slate-900',
    pulse: false,
    formattedLastDate,
  };
}

export interface UrgentPostItem {
  id: string;
  slug?: string;
  year?: string;
  month?: string;
  blogNo?: string;
  title: string;
  shortTitle?: string;
  dept?: string;
  totalPosts?: string;
  lastDate: string;
  qualification?: string;
  state?: string;
  category?: string;
  applyUrl?: string;
  notificationUrl?: string;
  urgency: DeadlineInfo;
  rawJob: JobItem | PostRecord;
}

/**
 * Filter and sort posts that expire today (diffDays === 0), tomorrow (diffDays === 1), or day after tomorrow (diffDays === 2).
 * If maxDays is 2 (default), only strictly "आज", "कल", "परसों" are included.
 */
export function extractUrgentDeadlineJobs(
  items: (JobItem | PostRecord)[],
  maxDays: number = 2
): UrgentPostItem[] {
  const result: UrgentPostItem[] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    const id = item.id || ('slug' in item ? item.slug : '');
    if (!id || seenIds.has(id)) continue;

    // Check last date from either lastDate or dates.end
    let dateStr: string | undefined | null = null;
    if ('dates' in item && item.dates?.end) {
      dateStr = item.dates.end;
    } else if (item.lastDate) {
      dateStr = item.lastDate;
    }

    if (!dateStr) continue;

    const urgency = getDeadlineUrgency(dateStr);

    // If closing today, tomorrow, or day after tomorrow (diffDays between 0 and maxDays)
    if (urgency.diffDays >= 0 && urgency.diffDays <= maxDays) {
      seenIds.add(id);

      const title = item.title || '';
      const shortTitle = ('shortTitle' in item && item.shortTitle) ? item.shortTitle : title;
      const dept = item.dept || ('department' in item ? item.department : '') || '';
      const totalPosts = String(item.totalPosts || 'विज्ञप्ति अनुसार');
      const qualification = item.qualification || ('eligibility' in item ? item.eligibility : '') || '10वीं / 12वीं / स्नातक पास';
      const state = item.state || 'Central';
      const category = item.category || 'Jobs';

      let applyUrl: string | undefined = undefined;
      let notificationUrl: string | undefined = undefined;

      if ('applyUrl' in item && item.applyUrl) applyUrl = item.applyUrl;
      else if ('applyLink' in item && item.applyLink) applyUrl = item.applyLink;
      else if ('links' in item && item.links?.apply) applyUrl = item.links.apply;

      if ('notificationUrl' in item && item.notificationUrl) notificationUrl = item.notificationUrl;
      else if ('notificationPdf' in item && item.notificationPdf) notificationUrl = item.notificationPdf;
      else if ('links' in item && item.links?.notificationPdf) notificationUrl = item.links.notificationPdf;

      result.push({
        id,
        slug: 'slug' in item ? item.slug : id,
        year: 'year' in item ? item.year : '2026',
        month: 'month' in item ? item.month : '09',
        blogNo: 'blogNo' in item ? item.blogNo : '01',
        title,
        shortTitle,
        dept,
        totalPosts,
        lastDate: urgency.formattedLastDate,
        qualification,
        state,
        category,
        applyUrl,
        notificationUrl,
        urgency,
        rawJob: item,
      });
    }
  }

  // Sort strictly by days remaining (today first, then tomorrow, then day after tomorrow)
  result.sort((a, b) => a.urgency.diffDays - b.urgency.diffDays);

  return result;
}
