export interface JobPostDetail {
  slug: string;
  id: string;
  year?: string;
  month?: string;
  blogNo?: string;
  title: string;
  shortTitle: string;
  department: string;
  advtNo?: string;
  totalPosts: string;
  postDate: string;
  startDate: string;
  lastDate: string;
  lastDateFee: string;
  correctionDate?: string;
  examDate?: string;
  admitCardDate?: string;
  feeGeneral: string;
  feeReserved: string;
  feePortal?: string;
  paymentMode: string;
  minAge: string;
  maxAge: string;
  ageCalculationDate?: string;
  ageRelaxation: string;
  state: 'MP' | 'Central' | 'All India';
  category: 'Police' | 'Teaching' | 'Defense' | 'SSC/UPSC' | 'Railway' | 'Banking' | 'Health' | 'Tech/IT' | 'Other';
  qualificationSummary: string;
  isTechJob?: boolean;
  companyName?: string;
  role?: string;
  experience?: string;
  location?: string;
  batchEligibility?: string;
  vacanciesBreakdown: {
    postName: string;
    total: string;
    eligibility: string;
  }[];
  categoryWisePosts?: {
    category: string;
    ur: string;
    obc: string;
    ews: string;
    sc: string;
    st: string;
    total: string;
  }[];
  physicalStandards?: {
    parameter: string;
    male: string;
    female: string;
  }[];
  howToApplySteps: string[];
  requiredDocuments: string[];
  applyUrl: string;
  notificationPdfUrl: string;
  syllabusUrl?: string;
  officialWebsiteUrl: string;
  serviceTagline?: string;
}

export interface JobItem {
  id: string;
  slug?: string;
  year?: string;
  month?: string;
  blogNo?: string;
  title: string;
  department: string;
  totalPosts: string;
  lastDate: string;
  state: 'MP' | 'Central' | 'All India';
  qualification: string;
  ageLimit?: string;
  fee?: string;
  postDate?: string;
  isNew?: boolean;
  isHot?: boolean;
  category: 'Police' | 'Teaching' | 'Defense' | 'SSC/UPSC' | 'Railway' | 'Banking' | 'Health' | 'Tech/IT' | 'Other';
  applyUrl?: string;
  notificationUrl?: string;
  // Tech specific fields
  isTechJob?: boolean;
  companyName?: string;
  role?: string;
  experience?: string;
  location?: string;
  batchEligibility?: string;
}

export interface AdmitCardItem {
  id: string;
  title: string;
  department: string;
  examDate: string;
  releaseDate: string;
  hallTicketStatus: 'Live Now' | 'Coming Soon' | 'Out';
  isNew?: boolean;
  downloadUrl?: string;
}

export interface ResultItem {
  id: string;
  title: string;
  department: string;
  declaredDate: string;
  type: 'Result' | 'Answer Key' | 'Cutoff';
  isNew?: boolean;
  viewUrl?: string;
  scoreCardAvailable?: boolean;
}

export interface TrendingCard {
  id: string;
  title: string;
  subtitle: string;
  colorTheme: string;
  badge: string;
  postsOrDate: string;
  category: string;
  targetId?: string;
}

export interface TickerAlert {
  id: string;
  text: string;
  isBreaking?: boolean;
  date?: string;
  category?: string;
}

// Normalized Post Schema for Cloud Firestore optimization
export interface PostRecord {
  id: string; // unique ID, e.g., 'mp-police-constable-2026'
  slug?: string;
  year?: string;
  month?: string;
  blogNo?: string;
  title: string;
  shortTitle?: string;
  category?: string; // mp-special, results, admit-card, latest-jobs, tech-jobs, central
  categories?: string[]; // multi-category tags e.g. ['vacancy', 'mp_special']
  dept: string;
  totalPosts: string | number;
  qualification?: string;
  eligibility?: string; // compact summary
  lastDate?: string;
  detailsUrl?: string;
  content?: string;
  publishedAt?: string; // Strict dd/mm/yyyy
  createdAt?: unknown;
  updatedAt?: unknown;
  status: 'draft' | 'pending_approval' | 'published' | 'suspended';
  dates?: {
    start: string;
    end: string;
    exam: string;
  };
  fee?: {
    gen: string;
    reserved: string;
  };
  links?: {
    apply: string;
    notificationPdf: string;
    syllabusPdf?: string;
    officialSite: string;
  };
  posterConfig?: {
    headline: string;
    keyPoints: string[];
    note: string;
  };
  // Optional enrichments for full Sarkari detail presentation
  state?: 'MP' | 'Central' | 'All India';
  advtNo?: string;
  minAge?: string;
  maxAge?: string;
  ageRelaxation?: string;
  paymentMode?: string;
  vacanciesBreakdown?: Array<{
    postName: string;
    total: string;
    eligibility: string;
  }>;
  requiredDocuments?: string[];
  howToApplySteps?: string[];
  physicalStandards?: Array<{
    parameter: string;
    male: string;
    female: string;
  }>;
  // Tech specific fields
  isTechJob?: boolean;
  companyName?: string;
  role?: string;
  experience?: string;
  location?: string;
  batchEligibility?: string;
}

// Scraper Target Feeds & Sources
export type ScraperBucket = 'govt_portals' | 'mp_special' | 'tech_corporate';

export interface ScraperSource {
  id: string;
  name: string;
  bucket: ScraperBucket;
  url: string;
  feedType: 'rss' | 'html' | 'api';
  enabled: boolean;
  lastScraped?: string;
  itemsFound?: number;
  description?: string;
}

// Single-document settings in Firestore: settings/popup_ad
export interface PopupAdSettings {
  enabled: boolean;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  redirectUrl: string;
  durationSeconds: number; // default 5-6s countdown timer before auto-close or manual dismiss
  ctaText?: string;
  updatedAt?: string | number;
}

// Ingestion & AI Automated Scraping Queue Draft
export interface ScrapedJobDraft {
  id: string;
  sourcePortal: string; // e.g., 'MPESB Bhopal', 'SSC Official', 'RRB Indian Railways'
  rawTitle: string;
  scrapedAt: string;
  confidenceScore: number;
  suggestedPost: Partial<PostRecord>;
  status: 'queued' | 'approved' | 'rejected';
}
