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
  publishedDateFormatted?: string;
  importantLinks?: Array<{ id: string; title: string; url: string }>;
  startDate: string;
  lastDate: string;
  lastDateFee: string;
  correctionDate?: string;
  examDate?: string;
  admitCardDate?: string;
  feeGeneral: string;
  feeReserved: string;
  feeOBC?: string;
  feeSCST?: string;
  feeEWS?: string;
  showEWS?: boolean;
  feePortal?: string;
  paymentMode: string;
  minAge: string;
  maxAge: string;
  ageCalculationDate?: string;
  ageRelaxation: string;
  showReservationSection?: boolean;
  state: 'MP' | 'Central' | 'All India';
  category: 'Police' | 'Teaching' | 'Defense' | 'SSC/UPSC' | 'Railway' | 'Banking' | 'Health' | 'Tech/IT' | 'Other';
  qualificationSummary: string;
  description?: string;
  roleOverview?: string;
  workProfile?: string;
  selectionProcessText?: string;
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
  customPosterUrl?: string;
  useCustomPoster?: boolean;
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
  publishedDate?: string; // dd/mm/yyyy
  publishedDateFormatted?: string; // e.g. "22/09/2026, 09:15 PM"
  importantLinks?: Array<{ id: string; title: string; url: string }>;
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
  publishedDate?: string; // dd/mm/yyyy
  hallTicketStatus: 'Live Now' | 'Coming Soon' | 'Out';
  isNew?: boolean;
  downloadUrl?: string;
}

export interface ResultItem {
  id: string;
  title: string;
  department: string;
  declaredDate: string;
  resultDate?: string;
  publishedDate?: string; // dd/mm/yyyy
  type: 'Result' | 'Answer Key' | 'Cutoff' | 'Final Result';
  isNew?: boolean;
  viewUrl?: string;
  resultUrl?: string;
  scoreCardAvailable?: boolean;
  status?: string;
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
  link?: string;
  isBreaking?: boolean;
  date?: string;
  category?: string;
  active?: boolean;
}

// Normalized Post Schema for Cloud Firestore - Single Source of Truth
export interface PostRecord {
  id: string; // unique ID, e.g., 'mp-police-constable-2026'
  blogNo?: string; // e.g. "01", "02"
  year?: string; // e.g. "2026"
  month?: string; // e.g. "09"
  slug?: string; // e.g. "mp-police-constable-2026"
  title: string;
  shortTitle?: string;
  dept: string;
  category?: string; // mp-special, results, admit-card, latest-jobs, tech-jobs, central
  categories?: string[]; // multi-category tags e.g. ['vacancy', 'mp_special']
  status: 'published' | 'draft' | 'suspended'; // Single Source of Truth
  isPublished?: boolean; // Explicit boolean flag for draft filtering
  publishedDate?: string; // Mandatory dd/mm/yyyy (Date of publication on portal)
  publishedAt?: unknown; // Firestore serverTimestamp, ISO string, or number timestamp
  publishedDateFormatted?: string; // Date & exact time string e.g. "22/09/2026, 09:15 PM"
  importantLinks?: Array<{ id: string; title: string; url: string }>; // Dynamic repeater hyperlinks
  startDate?: string; // dd/mm/yyyy
  lastDate?: string; // dd/mm/yyyy
  examDate?: string; // dd/mm/yyyy or "शीघ्र घोषित"
  admitCardDate?: string; // dd/mm/yyyy or "परीक्षा से 7 दिन पूर्व"
  totalPosts: string | number;
  qualification?: string;
  eligibility?: string; // compact summary
  ageLimit?: {
    min: string;
    max: string;
    relaxation: string;
  };
  applicationFees?: {
    ur: string;
    reserved: string;
    portalFee: string;
  };
  isItMnc?: boolean; // If true, hide reservation badges & show location/batch
  jobLocation?: string;
  batch?: string;
  applyLink?: string;
  notificationPdf?: string;
  createdAt?: unknown;
  updatedAt?: unknown;

  // Additional display / backward compatibility fields
  detailsUrl?: string;
  description?: string;
  roleOverview?: string;
  workProfile?: string;
  selectionProcessText?: string;
  content?: string;
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
    headline?: string;
    keyPoints?: string[];
    note?: string;
    theme?: 'classic' | 'navy' | 'emerald' | 'crimson' | 'purple' | 'cyber';
    characterType?: 'male' | 'female' | 'custom' | 'none';
    customCharacterUrl?: string;
    titleScale?: 'sm' | 'md' | 'lg' | 'xl';
    aspectRatio?: 'feed' | 'story';
    customPosts?: string;
    customLastDate?: string;
    customFeeAlert?: string;
    showQrCode?: boolean;
    customTile1Label?: string;
    customTile1Value?: string;
    customTile2Label?: string;
    customTile2Value?: string;
    customTile2Sub?: string;
    customTile3Label?: string;
    customTile3Value?: string;
    customTile3Sub?: string;
    customTile4Label?: string;
    customTile4Value?: string;
    customTile4Sub?: string;
    customWebsiteUrl?: string;
    customWebsiteTagline?: string;
    customBottomCallout?: string;
    customRoleSubtitle?: string;
    customDeptSubtitle?: string;
  };
  state?: 'MP' | 'Central' | 'All India';
  advtNo?: string;
  minAge?: string;
  maxAge?: string;
  ageRelaxation?: string;
  lastDateFee?: string;
  paymentMode?: string;
  feeGeneral?: string;
  feeReserved?: string;
  feeOBC?: string;
  feeSCST?: string;
  feeEWS?: string;
  showEWS?: boolean;
  feePortal?: string;
  showReservationSection?: boolean;
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
  // Routing helper fields
  routingYear?: string;
  routingMonth?: string;
  routingBlogNo?: string;
  routingSlug?: string;
  // Custom Poster Engine
  customPosterUrl?: string;
  useCustomPoster?: boolean;
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

export type BlogCategory = 'Exam Prep' | 'Career Guidance' | 'Tech Tips' | 'Gov Schemes' | 'General';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // HTML or Markdown formatted content
  category: BlogCategory;
  author: {
    name: string;
    phone?: string;
    role?: string;
  };
  bannerUrl?: string;
  status: 'draft' | 'published';
  tags?: string[];
  readingTimeMinutes?: number;
  views?: number;
  seoKeywords?: string[];
  createdAt: string | number;
  publishedAt?: string | number;
  updatedAt?: string | number;
}

