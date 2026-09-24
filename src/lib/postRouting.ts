/**
 * Universal Post Routing, Auto-Numbering & Date Formatting Helpers
 * Strictly enforces [year]/[month]/[blogNo]/[slug] routing schema
 * and dd/mm/yyyy standardized date formats across NP Job Portal.
 */

export interface PostRoutingMeta {
  year: string;
  month: string;
  blogNo: string;
  slug: string;
  identifier: string; // e.g. "2026/09/21" or "2026/09/02"
  fullPath: string;   // e.g. "/2026/09/21/mp-sub-engineer-recruitment-2026"
  canonicalUrl: string;
  displayId: string;  // e.g. "2026/09/21 • mp-sub-engineer-recruitment-2026"
}

// Known default mapping for core static jobs
const DEFAULT_SLUG_META: Record<string, { year: string; month: string; blogNo: string }> = {
  'mpesb-sub-engineer-draftsman-2026': { year: '2026', month: '09', blogNo: '01' },
  'mp-sub-engineer-recruitment-2026': { year: '2026', month: '09', blogNo: '21' },
  'mp-forest-guard-4399': { year: '2026', month: '09', blogNo: '02' },
  'mp-forest-guard-2026': { year: '2026', month: '09', blogNo: '02' },
  'ssc-chsl-1018': { year: '2026', month: '09', blogNo: '03' },
  'rrb-ntpc-ug-8663': { year: '2026', month: '09', blogNo: '04' },
  'mp-cm-rise-sandipani-school-bharti-2026': { year: '2026', month: '09', blogNo: '05' },
  'mp-police-constable-2026': { year: '2026', month: '09', blogNo: '06' },
  'mp-ayush-ug-counselling': { year: '2026', month: '09', blogNo: '07' },
  'ssc-chsl-2026': { year: '2026', month: '09', blogNo: '08' },
  'railway-rrc-group-d': { year: '2026', month: '09', blogNo: '09' },
  'ibps-po-clerk-2026': { year: '2026', month: '09', blogNo: '10' },
  'mp-tet-varg-3-shikshak-2026': { year: '2026', month: '09', blogNo: '11' },
  'ssc-cgl-recruitment-2026': { year: '2026', month: '09', blogNo: '12' },
  'railway-rrb-ntpc-recruitment-2026': { year: '2026', month: '09', blogNo: '13' },
  'mp-patwari-bharti-2026': { year: '2026', month: '09', blogNo: '14' },
  'upsc-civil-services-ias-2026': { year: '2026', month: '09', blogNo: '15' },
  'tcs-ninja-digital-hiring-2026': { year: '2026', month: '09', blogNo: '16' },
  'infosys-sp-dse-freshers-2026': { year: '2026', month: '09', blogNo: '17' },
  'wipro-elite-national-talent-hunt-2026': { year: '2026', month: '09', blogNo: '18' },
  'accenture-associate-software-engineer-2026': { year: '2026', month: '09', blogNo: '19' },
  'capgemini-exceller-recruitment-2026': { year: '2026', month: '09', blogNo: '20' },
  'google-software-engineer-early-career-2026': { year: '2026', month: '09', blogNo: '22' }
};

/**
 * Universal Post Routing Resolver
 * Resolves year, month, blogNo, slug, unique identifier, and canonical URL
 */
export function getPostRoutingMeta(item: {
  year?: string;
  month?: string;
  blogNo?: string;
  slug?: string;
  id?: string;
  detailsUrl?: string;
  publishedDate?: string;
  publishedAt?: string | number;
  dates?: { start?: string; end?: string; exam?: string };
}): PostRoutingMeta {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  let parsedYear = item.year || '';
  let parsedMonth = item.month || '';
  let parsedBlogNo = item.blogNo || '';
  let parsedSlug = item.slug || (item.id && !item.id.startsWith('http') ? item.id : '');

  // 1. Parse detailsUrl if available (e.g. /2026/09/21/mp-sub-engineer-recruitment-2026)
  if (item.detailsUrl && typeof item.detailsUrl === 'string') {
    const cleanUrl = item.detailsUrl.replace(/^https?:\/\/[^/]+/, '');
    const segments = cleanUrl.split('/').filter(Boolean);
    if (segments.length >= 4 && /^\d{4}$/.test(segments[0]) && /^\d{1,2}$/.test(segments[1])) {
      if (!parsedYear) parsedYear = segments[0];
      if (!parsedMonth) parsedMonth = segments[1].padStart(2, '0');
      if (!parsedBlogNo) parsedBlogNo = segments[2].padStart(2, '0');
      if (!parsedSlug) parsedSlug = segments[3];
    } else if (segments.length >= 3 && /^\d{4}$/.test(segments[0]) && /^\d{1,2}$/.test(segments[1])) {
      if (!parsedYear) parsedYear = segments[0];
      if (!parsedMonth) parsedMonth = segments[1].padStart(2, '0');
      if (!parsedSlug) parsedSlug = segments[2];
    }
  }

  // 2. Clean up slug
  let slug = (parsedSlug || item.id || 'job-update')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
  if (!slug) slug = 'job-update';

  // 3. Check default slug mapping
  const mapped = DEFAULT_SLUG_META[slug];

  // 4. Resolve year and month
  const year = parsedYear || mapped?.year || currentYear;
  const month = (parsedMonth || mapped?.month || currentMonth).padStart(2, '0');

  // 5. Resolve blogNo
  let blogNo = parsedBlogNo || mapped?.blogNo || '';

  // If still missing, check publishedDate (e.g. '21/09/2026' -> day '21')
  if (!blogNo && item.publishedDate && typeof item.publishedDate === 'string') {
    const dayMatch = item.publishedDate.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (dayMatch) {
      blogNo = dayMatch[1].padStart(2, '0');
    }
  }

  // If still missing, check publishedAt if it contains day or timestamp
  if (!blogNo && item.publishedAt) {
    if (typeof item.publishedAt === 'string') {
      const dayMatch = item.publishedAt.match(/^(\d{1,2})[\/-](\d{1,2})/);
      if (dayMatch) {
        blogNo = dayMatch[1].padStart(2, '0');
      }
    } else if (typeof item.publishedAt === 'number') {
      const d = new Date(item.publishedAt);
      if (!isNaN(d.getTime())) {
        blogNo = String(d.getDate()).padStart(2, '0');
      }
    }
  }

  // If still missing, derive a deterministic, distinct 2-digit number from the slug
  if (!blogNo) {
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = (hash * 31 + slug.charCodeAt(i)) % 997;
    }
    const derived = (Math.abs(hash) % 28) + 1;
    blogNo = String(derived).padStart(2, '0');
  }

  const identifier = `${year}/${month}/${blogNo}`;
  const fullPath = `/${year}/${month}/${blogNo}/${slug}`;

  return {
    year,
    month,
    blogNo,
    slug,
    identifier,
    fullPath,
    canonicalUrl: fullPath,
    displayId: `${identifier} • ${slug}`
  };
}

/**
 * Generate canonical dynamic post URL: /[year]/[month]/[blogNo]/[slug]
 */
export function getPostUrl(item: {
  year?: string;
  month?: string;
  blogNo?: string;
  slug?: string;
  id?: string;
  detailsUrl?: string;
  publishedDate?: string;
  publishedAt?: string | number;
  dates?: { start?: string; end?: string; exam?: string };
}): string {
  return getPostRoutingMeta(item).fullPath;
}

/**
 * Calculates next sequential blog number for a given year and month
 * Ensures blogNo is strictly unique, 2-digit formatted ('01', '02', '03'...)
 */
export function getNextBlogNumber(
  existingPosts: Array<{ year?: string; month?: string; blogNo?: string }>,
  targetYear: string,
  targetMonth: string
): string {
  const matching = existingPosts.filter(
    (p) => (p.year || '2026') === targetYear && (p.month || '09') === targetMonth
  );

  let highest = 0;
  for (const post of matching) {
    if (post.blogNo) {
      const num = parseInt(post.blogNo, 10);
      if (!isNaN(num) && num > highest) {
        highest = num;
      }
    }
  }

  const nextNum = highest + 1;
  return String(nextNum).padStart(2, '0');
}

/**
 * Date Format Utilities (Strict dd/mm/yyyy)
 */

/**
 * Formats any date string or Date object into standard dd/mm/yyyy
 */
export function formatDateToDDMMYYYY(val: string | Date | number | undefined | null): string {
  if (!val) return '21/09/2026';

  if (typeof val === 'string') {
    const trimmed = val.trim();
    // Pure 4-digit year like "2026" - NEVER convert to 01/01/2026
    if (/^\d{4}$/.test(trimmed)) {
      return `दिसंबर ${trimmed}`;
    }
    // Hindi/Devanagari text like "नवंबर 2026", "शीघ्र घोषित" - preserve as is
    if (/[\u0900-\u097F]/.test(trimmed)) {
      return trimmed;
    }
    // Already in dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // yyyy-mm-dd format (from HTML5 date picker)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-');
      return `${d}/${m}/${y}`;
    }
    // dd-mm-yyyy format
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed.replace(/-/g, '/');
    }
    // Descriptive string with letters (e.g. "Notified Soon", "Tier 1: Nov 2026") - preserve
    if (/[a-zA-Z]/.test(trimmed) && !/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed;
    }
    // Try parsing as timestamp / ISO string ONLY if it has month and day
    if (trimmed.includes('-') || trimmed.includes('/') || trimmed.includes('T')) {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        const d = String(parsed.getDate()).padStart(2, '0');
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const y = parsed.getFullYear();
        return `${d}/${m}/${y}`;
      }
    }
    return trimmed;
  }

  const dObj = val instanceof Date ? val : new Date(val);
  if (isNaN(dObj.getTime())) return '21/09/2026';

  const d = String(dObj.getDate()).padStart(2, '0');
  const m = String(dObj.getMonth() + 1).padStart(2, '0');
  const y = dObj.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Validates and sanitizes exam date against recruitment timeline.
 * Fixes erroneous retroactive dates like 01/01/2026 for jobs announced in late 2026.
 */
export function sanitizeExamDate(
  examDateVal: string | undefined | null,
  startDateVal?: string | undefined | null,
  lastDateVal?: string | undefined | null
): string {
  if (!examDateVal) return 'दिसंबर 2026 (अपेक्षित)';
  const trimmed = String(examDateVal).trim();
  if (
    !trimmed ||
    trimmed === '01/01/2026' ||
    trimmed === '2026' ||
    trimmed.toLowerCase() === 'notified soon'
  ) {
    return 'दिसंबर 2026 (अपेक्षित)';
  }

  // Preserve Hindi / Devanagari text
  if (/[\u0900-\u097F]/.test(trimmed)) {
    return trimmed;
  }

  // If dd/mm/yyyy format, ensure year/month is not in the past relative to start date
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/').map(Number);
    if (d === 1 && m === 1 && y === 2026) {
      return 'दिसंबर 2026 (अपेक्षित)';
    }

    const examTime = new Date(y, m - 1, d).getTime();

    if (startDateVal && /^\d{2}\/\d{2}\/\d{4}$/.test(startDateVal)) {
      const [sd, sm, sy] = startDateVal.split('/').map(Number);
      const startTime = new Date(sy, sm - 1, sd).getTime();
      if (examTime < startTime) {
        return 'दिसंबर 2026 (अपेक्षित)';
      }
    }

    if (lastDateVal && /^\d{2}\/\d{2}\/\d{4}$/.test(lastDateVal)) {
      const [ld, lm, ly] = lastDateVal.split('/').map(Number);
      const lastTime = new Date(ly, lm - 1, ld).getTime();
      if (examTime < lastTime) {
        return 'दिसंबर 2026 (अपेक्षित)';
      }
    }

    return trimmed;
  }

  return trimmed;
}

/**
 * Converts dd/mm/yyyy string into yyyy-mm-dd string for HTML5 <input type="date" />
 */
export function ddmmyyyyToInputDate(val: string | undefined | null): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('-');
    return `${y}-${m}-${d}`;
  }
  // Try standard parse
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return '';
}

/**
 * Converts HTML5 <input type="date" /> value (yyyy-mm-dd) to dd/mm/yyyy
 */
export function inputDateToDDMMYYYY(val: string): string {
  if (!val) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  }
  return formatDateToDDMMYYYY(val);
}
