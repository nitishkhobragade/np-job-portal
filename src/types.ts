export interface JobItem {
  id: string;
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
