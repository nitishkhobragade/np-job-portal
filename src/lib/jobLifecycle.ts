import { PostRecord, AdmitCardItem, ResultItem } from '../types';

/**
 * Parses dates in DD/MM/YYYY or YYYY-MM-DD or English formats into timestamp
 */
export function parseDateToTimestamp(dateStr?: string): number | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (!clean || clean.includes('शीघ्र') || clean.includes('विज्ञप्ति') || clean.includes('Soon')) {
    return null;
  }

  // DD/MM/YYYY
  const ddmmyyyy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    const d = parseInt(ddmmyyyy[1], 10);
    const m = parseInt(ddmmyyyy[2], 10) - 1;
    const y = parseInt(ddmmyyyy[3], 10);
    return new Date(y, m, d, 23, 59, 59).getTime();
  }

  // Standard date parse
  const parsed = Date.parse(clean);
  if (!isNaN(parsed)) return parsed;

  return null;
}

/**
 * Determines dynamic lifecycle flags:
 * - hasActiveApplication: apply link exists and deadline is today or in future
 * - hasAdmitCard: admitCardUrl or examCityUrl is populated, or specific admitCardDate exists
 * - hasResult: resultUrl or answerKeyUrl is populated
 * - lifecycleStage: 'result' | 'admit_card' | 'application' | 'archived'
 */
export function computeJobLifecycle(post: Partial<PostRecord>): {
  hasActiveApplication: boolean;
  hasAdmitCard: boolean;
  hasResult: boolean;
  lifecycleStage: 'application' | 'admit_card' | 'result' | 'archived';
} {
  const now = Date.now();

  // 1. Result detection
  const hasResultLink = Boolean(
    post.resultUrl?.trim() ||
    post.answerKeyUrl?.trim() ||
    post.importantLinks?.some(l => 
      l.title.toLowerCase().includes('result') ||
      l.title.toLowerCase().includes('score') ||
      l.title.toLowerCase().includes('answer key') ||
      l.title.includes('रिजल्ट') ||
      l.title.includes('परिणाम') ||
      l.title.includes('उत्तर कुंजी')
    )
  );
  const hasResultCategory = post.category === 'results' || post.categories?.includes('result') || post.categories?.includes('results');
  const hasResultTitle = post.title ? (post.title.toLowerCase().includes('result') || post.title.toLowerCase().includes('answer key')) : false;
  const hasResult = Boolean(post.hasResult || hasResultLink || hasResultCategory || hasResultTitle);

  // 2. Admit Card detection
  const hasAdmitLink = Boolean(
    post.admitCardUrl?.trim() ||
    post.examCityUrl?.trim() ||
    post.importantLinks?.some(l =>
      l.title.toLowerCase().includes('admit card') ||
      l.title.toLowerCase().includes('hall ticket') ||
      l.title.toLowerCase().includes('exam city') ||
      l.title.includes('प्रवेश पत्र') ||
      l.title.includes('एडमिट कार्ड')
    )
  );
  const hasAdmitDate = Boolean(
    post.admitCardDate &&
    !post.admitCardDate.includes('शीघ्र') &&
    !post.admitCardDate.includes('7 दिन पूर्व') &&
    post.admitCardDate.length > 5
  );
  const hasAdmitCategory = post.category === 'admit-card' || post.categories?.includes('admit-card') || post.categories?.includes('admit_card');
  const hasAdmitTitle = post.title ? (post.title.toLowerCase().includes('admit card') || post.title.toLowerCase().includes('hall ticket')) : false;
  const hasAdmitCard = Boolean(post.hasAdmitCard || hasAdmitLink || hasAdmitDate || hasAdmitCategory || hasAdmitTitle);

  // 3. Application Active detection
  const applyLink = post.applyLink || post.links?.apply || (post.importantLinks?.find(l => l.title.toLowerCase().includes('apply'))?.url);
  const lastDateTs = parseDateToTimestamp(post.dates?.end || post.lastDate);
  const isPastDeadline = lastDateTs !== null ? lastDateTs < now : false;
  const hasActiveApplication = Boolean(applyLink && !isPastDeadline);

  // 4. Combined lifecycle stage
  let lifecycleStage: 'application' | 'admit_card' | 'result' | 'archived' = 'application';
  if (hasResult) {
    lifecycleStage = 'result';
  } else if (hasAdmitCard) {
    lifecycleStage = 'admit_card';
  } else if (hasActiveApplication) {
    lifecycleStage = 'application';
  } else if (isPastDeadline) {
    lifecycleStage = 'archived';
  }

  return {
    hasActiveApplication,
    hasAdmitCard,
    hasResult,
    lifecycleStage
  };
}

/**
 * Checks whether a post belongs in the Admit Card category / column
 */
export function isAdmitCardPost(p: PostRecord): boolean {
  if (p.hasAdmitCard) return true;
  if (p.admitCardUrl?.trim() || p.examCityUrl?.trim()) return true;
  if (p.category === 'admit-card' || p.categories?.includes('admit-card') || p.categories?.includes('admit_card')) return true;
  if (p.title && (p.title.toLowerCase().includes('admit card') || p.title.toLowerCase().includes('hall ticket') || p.title.includes('एडमिट कार्ड'))) return true;
  if (p.importantLinks?.some(l => l.title.toLowerCase().includes('admit') || l.title.includes('प्रवेश पत्र'))) return true;
  return false;
}

/**
 * Checks whether a post belongs in the Results / Answer Keys category / column
 */
export function isResultPost(p: PostRecord): boolean {
  if (p.hasResult) return true;
  if (p.resultUrl?.trim() || p.answerKeyUrl?.trim()) return true;
  if (p.category === 'results' || p.category === 'result' || p.categories?.includes('result') || p.categories?.includes('results')) return true;
  if (p.title && (p.title.toLowerCase().includes('result') || p.title.toLowerCase().includes('answer key') || p.title.includes('रिजल्ट') || p.title.includes('उत्तर कुंजी'))) return true;
  if (p.importantLinks?.some(l => l.title.toLowerCase().includes('result') || l.title.toLowerCase().includes('answer key') || l.title.includes('परिणाम'))) return true;
  return false;
}

/**
 * Convert PostRecord to AdmitCardItem preserving the original slug/URL for continuous SEO ranking
 */
export function mapPostToLifecycleAdmitCard(p: PostRecord): AdmitCardItem {
  const directDownload =
    p.admitCardUrl ||
    p.examCityUrl ||
    p.importantLinks?.find(l => l.title.toLowerCase().includes('admit') || l.title.toLowerCase().includes('hall ticket'))?.url ||
    p.applyLink ||
    p.links?.apply ||
    p.notificationPdf ||
    p.links?.notificationPdf;

  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title,
    department: p.dept,
    examDate: p.examDate || p.dates?.exam || 'शीघ्र घोषित',
    releaseDate: p.admitCardDate || p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    publishedDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    hallTicketStatus: p.admitCardUrl ? 'Live Now' : (p.examCityUrl ? 'City Slip' : 'Live Now'),
    isNew: true,
    downloadUrl: directDownload,
    admitCardUrl: p.admitCardUrl,
    examCityUrl: p.examCityUrl,
    hasAdmitCard: true,
    sourceJobId: p.id
  };
}

/**
 * Convert PostRecord to ResultItem preserving original slug/URL for continuous SEO ranking
 */
export function mapPostToLifecycleResult(p: PostRecord): ResultItem {
  const directResult =
    p.resultUrl ||
    p.answerKeyUrl ||
    p.importantLinks?.find(l => l.title.toLowerCase().includes('result') || l.title.toLowerCase().includes('answer key'))?.url ||
    p.applyLink ||
    p.links?.apply ||
    p.notificationPdf ||
    p.links?.notificationPdf;

  const isAnswerKey =
    Boolean(p.answerKeyUrl) ||
    p.title.toLowerCase().includes('answer key') ||
    p.title.includes('उत्तर कुंजी');

  return {
    id: p.id,
    slug: p.slug || p.id,
    title: p.title,
    department: p.dept,
    declaredDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    resultDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    publishedDate: p.publishedDate || (typeof p.publishedAt === 'string' ? p.publishedAt : '22/09/2026'),
    type: isAnswerKey ? 'Answer Key' : 'Result',
    isNew: true,
    status: isAnswerKey ? 'Answer Key Released' : 'Declared',
    viewUrl: directResult,
    resultUrl: p.resultUrl || directResult,
    answerKeyUrl: p.answerKeyUrl,
    scoreCardAvailable: Boolean(p.resultUrl),
    hasResult: true,
    sourceJobId: p.id
  };
}
