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
}

// Known default mapping for core static jobs
const DEFAULT_SLUG_META: Record<string, { year: string; month: string; blogNo: string }> = {
  'mp-cm-rise-sandipani-school-bharti-2026': { year: '2026', month: '09', blogNo: '01' },
  'mp-police-constable-2026': { year: '2026', month: '09', blogNo: '02' },
  'mp-ayush-ug-counselling': { year: '2026', month: '09', blogNo: '03' },
  'ssc-chsl-2026': { year: '2026', month: '09', blogNo: '04' },
  'railway-rrc-group-d': { year: '2026', month: '09', blogNo: '05' },
  'ibps-po-clerk-2026': { year: '2026', month: '09', blogNo: '06' },
  'mp-tet-varg-3-shikshak-2026': { year: '2026', month: '09', blogNo: '07' },
  'ssc-cgl-recruitment-2026': { year: '2026', month: '09', blogNo: '08' },
  'railway-rrb-ntpc-recruitment-2026': { year: '2026', month: '09', blogNo: '09' },
  'mp-patwari-bharti-2026': { year: '2026', month: '09', blogNo: '10' },
  'upsc-civil-services-ias-2026': { year: '2026', month: '09', blogNo: '11' },
  'tcs-ninja-digital-hiring-2026': { year: '2026', month: '09', blogNo: '12' },
  'infosys-sp-dse-freshers-2026': { year: '2026', month: '09', blogNo: '13' },
  'wipro-elite-national-talent-hunt-2026': { year: '2026', month: '09', blogNo: '14' },
  'accenture-associate-software-engineer-2026': { year: '2026', month: '09', blogNo: '15' },
  'capgemini-exceller-recruitment-2026': { year: '2026', month: '09', blogNo: '16' },
  'google-software-engineer-early-career-2026': { year: '2026', month: '09', blogNo: '17' }
};

/**
 * Generate canonical dynamic post URL: /[year]/[month]/[blogNo]/[slug]
 */
export function getPostUrl(item: {
  year?: string;
  month?: string;
  blogNo?: string;
  slug?: string;
  id?: string;
}): string {
  const rawSlug = (item.slug || item.id || 'job-update')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');

  const mapped = DEFAULT_SLUG_META[rawSlug];

  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

  const year = item.year || mapped?.year || currentYear;
  const month = item.month || mapped?.month || currentMonth;
  const blogNo = item.blogNo || mapped?.blogNo || '01';
  const slug = item.slug || rawSlug;

  return `/${year}/${month}/${blogNo}/${slug}`;
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
    // Try parsing as timestamp / ISO string
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
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
