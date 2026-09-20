export interface JobPostDetail {
  slug: string;
  id: string;
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
  category: 'Police' | 'Teaching' | 'Defense' | 'SSC/UPSC' | 'Railway' | 'Banking' | 'Health' | 'Other';
  qualificationSummary: string;
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
  title: string;
  department: string;
  totalPosts: string;
  lastDate: string;
  state: 'MP' | 'Central' | 'All India';
  qualification: string;
  ageLimit?: string;
  fee?: string;
  isNew?: boolean;
  isHot?: boolean;
  category: 'Police' | 'Teaching' | 'Defense' | 'SSC/UPSC' | 'Railway' | 'Banking' | 'Health' | 'Other';
  applyUrl?: string;
  notificationUrl?: string;
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
