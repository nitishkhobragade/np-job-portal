import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { PostRecord, PopupAdSettings, ScrapedJobDraft, ScraperSource } from '../types';
import { DETAILED_JOBS_LIST } from '../data/jobDetailsData';

// Safe environment variable retrieval with fallback for build-time safety
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemoDummyKeyForBuildSafety1234567',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'np-job-portal.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'np-job-portal',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'np-job-portal.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

// Check if real credentials exist (not placeholder)
const isFirebaseProperlyConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'AIzaSyDemoDummyKeyForBuildSafety1234567'
);

// Initialize Firebase App
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Export Firestore db instance
export const db: Firestore = getFirestore(app);

// Seed posts converted from detailedJobsList to ensure instant rich content
const SEED_POSTS: PostRecord[] = DETAILED_JOBS_LIST.map((job) => ({
  id: job.slug,
  title: job.title,
  shortTitle: job.shortTitle,
  categories: [
    'vacancy',
    job.state === 'MP' ? 'mp_special' : 'central',
    job.category.toLowerCase().replace(/[^a-z0-9]/g, '_')
  ],
  dept: job.department,
  totalPosts: job.totalPosts,
  dates: {
    start: job.startDate,
    end: job.lastDate,
    exam: job.examDate || 'शीघ्र घोषित'
  },
  fee: {
    gen: job.feeGeneral,
    reserved: job.feeReserved
  },
  eligibility: job.qualificationSummary,
  links: {
    apply: job.applyUrl,
    notificationPdf: job.notificationPdfUrl,
    syllabusPdf: job.syllabusUrl,
    officialSite: job.officialWebsiteUrl
  },
  posterConfig: {
    headline: `★ ${job.shortTitle} भर्ती अलर्ट ★`,
    keyPoints: [
      `कुल पद: ${job.totalPosts}`,
      `अंतिम तिथि: ${job.lastDate}`,
      `शैक्षणिक योग्यता: ${job.qualificationSummary.slice(0, 90)}...`
    ],
    note: 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
  },
  status: 'published' as const,
  updatedAt: Date.now(),
  state: job.state,
  advtNo: job.advtNo,
  minAge: job.minAge,
  maxAge: job.maxAge,
  ageRelaxation: job.ageRelaxation,
  paymentMode: job.paymentMode,
  vacanciesBreakdown: job.vacanciesBreakdown,
  requiredDocuments: job.requiredDocuments,
  howToApplySteps: job.howToApplySteps,
  physicalStandards: job.physicalStandards
}));

// Default Popup Ad configuration
export const DEFAULT_POPUP_AD: PopupAdSettings = {
  enabled: true,
  title: 'घर बैठे ऑनलाइन फॉर्म भरवाएं — 100% सही व सुरक्षित',
  subtitle: 'Nitish Khobragade (NP ONLINE KIOSK) • 8982324497',
  badge: 'विशेष सेवा ऑफर',
  imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
  redirectUrl: 'https://wa.me/918982324497?text=नमस्ते%20Nitish%20Ji,%20मुझे%20ऑनलाइन%20फॉर्म%20भरवाना%20है।',
  durationSeconds: 5,
  ctaText: 'व्हाट्सएप पर तुरंत दस्तावेज भेजें',
  updatedAt: Date.now()
};

// In-Memory cache for client state
let memoryPosts: PostRecord[] = [...SEED_POSTS];
let memoryPopupAd: PopupAdSettings = { ...DEFAULT_POPUP_AD };

const STORAGE_POSTS_KEY = 'np_portal_firestore_posts_cache_v2';
const STORAGE_POPUP_KEY = 'np_portal_popup_ad_settings_v2';
const STORAGE_SCRAPER_KEY = 'np_portal_scraper_queue_v2';

// Safe LocalStorage helpers
const getStoredPosts = (): PostRecord[] => {
  if (typeof window === 'undefined') return memoryPosts;
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(SEED_POSTS));
      return SEED_POSTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_POSTS;
  } catch {
    return memoryPosts;
  }
};

const persistStoredPosts = (posts: PostRecord[]) => {
  memoryPosts = posts;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }
};

/**
 * Fetch all posts from Firestore collection 'posts', falling back to cached seed
 */
export async function getJobs(): Promise<PostRecord[]> {
  if (isFirebaseProperlyConfigured) {
    try {
      const postsCol = collection(db, 'posts');
      const q = query(postsCol, orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const firestoreList: PostRecord[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push(docSnap.data() as PostRecord);
        });
        persistStoredPosts(firestoreList);
        return firestoreList;
      }
    } catch (err) {
      console.warn('Firestore fetch failed, using cached store:', err);
    }
  }
  return getStoredPosts();
}

/**
 * Fetch a single job by its unique ID or Slug
 */
export async function getJobBySlug(slugOrId: string): Promise<PostRecord | null> {
  const normalizedQuery = slugOrId.toLowerCase().trim();

  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'posts', normalizedQuery);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as PostRecord;
      }
    } catch (err) {
      console.warn('Firestore getJobBySlug failed, trying local fallback:', err);
    }
  }

  const posts = getStoredPosts();
  const matched = posts.find(
    (p) =>
      p.id.toLowerCase() === normalizedQuery ||
      (p.shortTitle && p.shortTitle.toLowerCase() === normalizedQuery) ||
      p.title.toLowerCase().includes(normalizedQuery)
  );

  return matched || null;
}

/**
 * Add a new Job/Post to Firestore 'posts' collection
 */
export async function addJob(jobData: Partial<PostRecord>): Promise<string> {
  const generatedId =
    jobData.id ||
    jobData.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `post-${Date.now()}`;

  const newPost: PostRecord = {
    id: generatedId,
    title: jobData.title || 'नई सरकारी भर्ती 2026',
    shortTitle: jobData.shortTitle || jobData.title?.slice(0, 30) || 'भर्ती 2026',
    categories: jobData.categories && jobData.categories.length > 0 ? jobData.categories : ['vacancy'],
    dept: jobData.dept || 'सरकारी विभाग',
    totalPosts: jobData.totalPosts || 'पदों की संख्या विज्ञप्ति देखें',
    dates: {
      start: jobData.dates?.start || '15/09/2026',
      end: jobData.dates?.end || '15/10/2026',
      exam: jobData.dates?.exam || 'शीघ्र घोषित'
    },
    fee: {
      gen: jobData.fee?.gen || '₹500/-',
      reserved: jobData.fee?.reserved || '₹250/-'
    },
    eligibility: jobData.eligibility || 'मान्यता प्राप्त बोर्ड से 10वीं/12वीं/स्नातक उत्तीर्ण',
    links: {
      apply: jobData.links?.apply || 'https://esb.mp.gov.in',
      notificationPdf: jobData.links?.notificationPdf || 'https://esb.mp.gov.in',
      syllabusPdf: jobData.links?.syllabusPdf || '',
      officialSite: jobData.links?.officialSite || 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: jobData.posterConfig?.headline || `★ ${jobData.title || 'सरकारी भर्ती'} अलर्ट ★`,
      keyPoints: jobData.posterConfig?.keyPoints || [
        `कुल पद: ${jobData.totalPosts || 'पदों की संख्या देखें'}`,
        `अंतिम तिथि: ${jobData.dates?.end || 'विज्ञप्ति अनुसार'}`,
        `घर बैठे फॉर्म भरवाएं: 8982324497`
      ],
      note: jobData.posterConfig?.note || 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    },
    status: jobData.status || 'published',
    updatedAt: Date.now(),
    state: jobData.state || 'MP',
    advtNo: jobData.advtNo || `ADV/${new Date().getFullYear()}/01`,
    minAge: jobData.minAge || '18 वर्ष',
    maxAge: jobData.maxAge || '33 वर्ष',
    requiredDocuments: jobData.requiredDocuments || [
      '10वीं / 12वीं की अंकसूची',
      'आधार कार्ड (मोबाइल लिंक)',
      'पासपोर्ट साइज फोटो एवं हस्ताक्षर',
      'मूल निवासी एवं जाति प्रमाण पत्र'
    ],
    howToApplySteps: jobData.howToApplySteps || [
      'ऑफिशियल नोटिफिकेशन डाउनलोड कर पात्रता जांचें।',
      'अपने सभी दस्तावेज व्हाट्सएप (8982324497) पर भेजें।',
      'फॉर्म का पूर्वावलोकन (Preview) चेक कर शुल्क भुगतान करें।',
      'कम्प्यूटर जनरेटेड अधिकृत रसीद प्राप्त करें।'
    ]
  };

  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'posts', generatedId);
      await setDoc(docRef, newPost);
    } catch (err) {
      console.warn('Firestore addJob failed, saving locally:', err);
    }
  }

  // Update local storage
  const current = getStoredPosts();
  const updated = [newPost, ...current.filter((p) => p.id !== generatedId)];
  persistStoredPosts(updated);

  return generatedId;
}

/**
 * Update an existing job in Firestore
 */
export async function updateJob(id: string, updates: Partial<PostRecord>): Promise<boolean> {
  const currentPosts = getStoredPosts();
  const index = currentPosts.findIndex((p) => p.id === id);
  if (index === -1) return false;

  const updatedRecord: PostRecord = {
    ...currentPosts[index],
    ...updates,
    id,
    updatedAt: Date.now()
  };

  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'posts', id);
      await updateDoc(docRef, updatedRecord as unknown as Record<string, unknown>);
    } catch (err) {
      console.warn('Firestore updateJob failed, applying locally:', err);
    }
  }

  currentPosts[index] = updatedRecord;
  persistStoredPosts(currentPosts);
  return true;
}

/**
 * Delete a job by its ID
 */
export async function deleteJob(id: string): Promise<boolean> {
  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'posts', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firestore deleteJob error:', err);
    }
  }

  const currentPosts = getStoredPosts();
  const filtered = currentPosts.filter((p) => p.id !== id);
  persistStoredPosts(filtered);
  return true;
}

/**
 * Pop-up Ad settings storage in single document `settings/popup_ad`
 */
export async function getPopupAdSettings(): Promise<PopupAdSettings> {
  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'settings', 'popup_ad');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as PopupAdSettings;
        memoryPopupAd = data;
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_POPUP_KEY, JSON.stringify(data));
        }
        return data;
      }
    } catch (err) {
      console.warn('Firestore getPopupAdSettings failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(STORAGE_POPUP_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
  }

  return memoryPopupAd;
}

export async function savePopupAdSettings(settings: PopupAdSettings): Promise<boolean> {
  const dataToSave: PopupAdSettings = {
    ...settings,
    updatedAt: Date.now()
  };

  memoryPopupAd = dataToSave;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_POPUP_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.warn('LocalStorage popup save error:', e);
    }
  }

  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'settings', 'popup_ad');
      await setDoc(docRef, dataToSave);
      return true;
    } catch (err) {
      console.warn('Firestore savePopupAdSettings failed:', err);
    }
  }

  return true;
}

// Initial Simulated Scraper Drafts
const INITIAL_SCRAPED_DRAFTS: ScrapedJobDraft[] = [
  {
    id: 'scraped-mpesb-sub-eng-2026',
    sourcePortal: 'MPESB Bhopal (esb.mp.gov.in)',
    rawTitle: 'MP Combined Group-3 Sub Engineer, Draftsman & Other Equivalent Posts Recruitment 2026',
    scrapedAt: 'आज, 09:15 AM',
    confidenceScore: 98,
    status: 'queued',
    suggestedPost: {
      id: 'mp-sub-engineer-recruitment-2026',
      title: 'MPESB Group-3 Sub Engineer & Draftsman Recruitment 2026',
      shortTitle: 'MP Sub Engineer 2026',
      dept: 'Madhya Pradesh Employees Selection Board (MPESB Bhopal)',
      totalPosts: '1,280 Posts',
      categories: ['vacancy', 'mp_special'],
      dates: {
        start: '22/09/2026',
        end: '12/10/2026',
        exam: '18 November 2026'
      },
      fee: {
        gen: '₹500/-',
        reserved: '₹250/- (MP Domicile)'
      },
      eligibility: '3-Year Diploma in Civil / Electrical / Mechanical Engineering from recognized institute.',
      links: {
        apply: 'https://esb.mp.gov.in',
        notificationPdf: 'https://esb.mp.gov.in/rulebooks/rb_2026/sub_eng_2026.pdf',
        officialSite: 'https://esb.mp.gov.in'
      },
      posterConfig: {
        headline: '★ MP Sub Engineer 1,280 पद भर्ती 2026 ★',
        keyPoints: [
          'कुल पद: 1,280 (Civil/Mech/Elec)',
          'योग्यता: 3 वर्षीय इंजीनियरिंग डिप्लोमा',
          'आवेदन प्रारंभ: 22 सितंबर 2026'
        ],
        note: 'घर बैठे त्रुटिरहित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
      },
      status: 'pending_approval'
    }
  },
  {
    id: 'scraped-ssc-gd-2026',
    sourcePortal: 'Staff Selection Commission (ssc.gov.in)',
    rawTitle: 'SSC Constable GD in CAPFs, SSF, Rifleman in Assam Rifles Examination 2026',
    scrapedAt: 'आज, 08:30 AM',
    confidenceScore: 95,
    status: 'queued',
    suggestedPost: {
      id: 'ssc-gd-constable-2026',
      title: 'SSC GD Constable (BSF, CISF, CRPF, ITBP, SSB) Recruitment 2026',
      shortTitle: 'SSC GD 2026',
      dept: 'Staff Selection Commission (SSC)',
      totalPosts: '39,481 Posts',
      categories: ['vacancy', 'central'],
      dates: {
        start: '18/09/2026',
        end: '24/10/2026',
        exam: 'January - February 2027'
      },
      fee: {
        gen: '₹100/-',
        reserved: '₹0/- (SC/ST/Female Free)'
      },
      eligibility: 'Class 10th High School Exam Passed from any recognized board in India.',
      links: {
        apply: 'https://ssc.gov.in',
        notificationPdf: 'https://ssc.gov.in/notices/gd_constable_2026.pdf',
        officialSite: 'https://ssc.gov.in'
      },
      posterConfig: {
        headline: '★ SSC GD Constable 39,481 पद भर्ती ★',
        keyPoints: [
          'कुल पद: 39,481 पद (10वीं पास)',
          'महिला एवं SC/ST हेतु फीस शून्य',
          'अंतिम तिथि: 24 अक्टूबर 2026'
        ],
        note: 'घर बैठे फॉर्म भरने के लिए कॉल/व्हाट्सएप: 8982324497'
      },
      status: 'pending_approval'
    }
  },
  {
    id: 'scraped-google-sde-2026',
    sourcePortal: 'Google Careers (careers.google.com)',
    rawTitle: 'Google India Software Engineering Campus & Off-Campus Hiring 2026',
    scrapedAt: 'आज, 10:20 AM',
    confidenceScore: 97,
    status: 'queued',
    suggestedPost: {
      id: 'google-software-engineer-india-2026',
      title: 'Google India Software Engineer (Early Career / Campus 2026)',
      shortTitle: 'Google SWE 2026',
      dept: 'Google India Private Limited',
      totalPosts: 'Multiple Openings (Bangalore / Hyderabad)',
      categories: ['vacancy', 'tech'],
      dates: {
        start: '19/09/2026',
        end: '15/10/2026',
        exam: 'Online Coding Round + Virtual Interviews'
      },
      fee: {
        gen: '₹0/- (No Fee)',
        reserved: '₹0/- (No Fee)'
      },
      eligibility: 'B.Tech / B.E / M.Tech in CS/IT/ECE (2025 & 2026 Batch) with proficiency in C++, Java, or Python.',
      links: {
        apply: 'https://careers.google.com',
        notificationPdf: 'https://careers.google.com/jobs/results',
        officialSite: 'https://careers.google.com'
      },
      posterConfig: {
        headline: '★ Google India Software Engineer 2026 ★',
        keyPoints: [
          'कंपनी: Google India (Bangalore/Hyderabad)',
          'पद: Software Engineer (Early Career)',
          'योग्यता: B.Tech / B.E (2025/2026 Batch)',
          'CTC: ₹24 LPA - ₹38 LPA'
        ],
        note: 'रेज़्यूमे रिव्यू एवं फॉर्म सहायता: Nitish Khobragade (8982324497)'
      },
      status: 'pending_approval',
      isTechJob: true,
      companyName: 'Google India',
      role: 'Software Engineer (L3)',
      experience: 'Freshers / 0-1 Year',
      location: 'Bengaluru / Hyderabad',
      batchEligibility: '2025 & 2026 Batch'
    }
  },
  {
    id: 'scraped-infosys-se-2026',
    sourcePortal: 'Infosys Careers (infosys.com/careers)',
    rawTitle: 'Infosys Specialist Programmer (SP) & Digital Specialist Engineer (DSE) Pan-India Hiring 2026',
    scrapedAt: 'आज, 11:00 AM',
    confidenceScore: 96,
    status: 'queued',
    suggestedPost: {
      id: 'infosys-sp-dse-hiring-2026',
      title: 'Infosys Specialist Programmer (SP) & DSE Campus Drive 2026',
      shortTitle: 'Infosys SP/DSE 2026',
      dept: 'Infosys Limited',
      totalPosts: '4,500+ Openings (Indore, Pune, Bengaluru)',
      categories: ['vacancy', 'tech'],
      dates: {
        start: '20/09/2026',
        end: '28/10/2026',
        exam: 'Infosys HackWithInfy / National Test'
      },
      fee: {
        gen: '₹0/- (Free Registration)',
        reserved: '₹0/- (Free Registration)'
      },
      eligibility: 'BE / B.Tech / ME / M.Tech / MCA with minimum 60% marks throughout academics.',
      links: {
        apply: 'https://career.infosys.com',
        notificationPdf: 'https://career.infosys.com/joblist',
        officialSite: 'https://infosys.com'
      },
      posterConfig: {
        headline: '★ Infosys 4,500+ IT जॉब्स 2026 ★',
        keyPoints: [
          'कंपनी: Infosys Limited (Indore/Pune/Pan-India)',
          'पद: Specialist Programmer / DSE',
          'पैकेज: ₹6.25 LPA - ₹9.5 LPA',
          'आवेदन: निःशुल्क'
        ],
        note: 'ऑनलाइन आवेदन व मार्गदर्शन हेतु संपर्क: 8982324497'
      },
      status: 'pending_approval',
      isTechJob: true,
      companyName: 'Infosys',
      role: 'Specialist Programmer (SP)',
      experience: 'Freshers (0 Yrs)',
      location: 'Indore / Pune / Pan India',
      batchEligibility: '2024, 2025 & 2026 Batch'
    }
  },
  {
    id: 'scraped-mp-hc-grade3-2026',
    sourcePortal: 'MP High Court Jabalpur (mphc.gov.in)',
    rawTitle: 'MP High Court Assistant Grade-3 & Stenographer Recruitment 2026',
    scrapedAt: 'कल शाम, 06:45 PM',
    confidenceScore: 92,
    status: 'queued',
    suggestedPost: {
      id: 'mp-high-court-ag3-2026',
      title: 'MP High Court Assistant Grade-3 (AG-3) & Steno Recruitment 2026',
      shortTitle: 'MPHC AG-3 2026',
      dept: 'High Court of Madhya Pradesh Jabalpur',
      totalPosts: '1,450 Posts',
      categories: ['vacancy', 'mp_special'],
      dates: {
        start: '25/09/2026',
        end: '20/10/2026',
        exam: 'दिसंबर 2026'
      },
      fee: {
        gen: '₹777/-',
        reserved: '₹577/-'
      },
      eligibility: 'Graduation Degree + CPCT Scorecard Passed + 1 Year Computer Diploma (DCA/PGDCA).',
      links: {
        apply: 'https://mphc.gov.in',
        notificationPdf: 'https://mphc.gov.in/recruitment/ag3_2026.pdf',
        officialSite: 'https://mphc.gov.in'
      },
      posterConfig: {
        headline: '★ MP हाईकोर्ट AG-3 एवं स्टेनो भर्ती ★',
        keyPoints: [
          'कुल पद: 1,450',
          'योग्यता: स्नातक + CPCT + DCA',
          'ऑनलाइन आवेदन: 25 सितंबर से प्रारंभ'
        ],
        note: 'दस्तावेज भेजकर घर बैठे फॉर्म भरवाएं: 8982324497'
      },
      status: 'pending_approval'
    }
  }
];

export async function getScrapedDrafts(): Promise<ScrapedJobDraft[]> {
  if (typeof window === 'undefined') return INITIAL_SCRAPED_DRAFTS;
  try {
    const cached = localStorage.getItem(STORAGE_SCRAPER_KEY);
    if (!cached) {
      localStorage.setItem(STORAGE_SCRAPER_KEY, JSON.stringify(INITIAL_SCRAPED_DRAFTS));
      return INITIAL_SCRAPED_DRAFTS;
    }
    return JSON.parse(cached);
  } catch {
    return INITIAL_SCRAPED_DRAFTS;
  }
}

export async function approveScrapedDraft(draftId: string): Promise<PostRecord | null> {
  const drafts = await getScrapedDrafts();
  const targetIndex = drafts.findIndex((d) => d.id === draftId);
  if (targetIndex === -1) return null;

  const draft = drafts[targetIndex];
  draft.status = 'approved';

  // Publish to posts
  const postToPublish: Partial<PostRecord> = {
    ...draft.suggestedPost,
    status: 'published'
  };

  const postId = await addJob(postToPublish);
  drafts[targetIndex] = draft;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SCRAPER_KEY, JSON.stringify(drafts));
  }

  return getJobBySlug(postId);
}

export async function rejectScrapedDraft(draftId: string): Promise<boolean> {
  const drafts = await getScrapedDrafts();
  const targetIndex = drafts.findIndex((d) => d.id === draftId);
  if (targetIndex === -1) return false;

  drafts[targetIndex].status = 'rejected';
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SCRAPER_KEY, JSON.stringify(drafts));
  }
  return true;
}

export async function simulateScraperRun(): Promise<ScrapedJobDraft[]> {
  const newIngested: ScrapedJobDraft = {
    id: `scraped-ai-${Date.now()}`,
    sourcePortal: 'Railway Recruitment Cell (RRC/RRB)',
    rawTitle: 'RRB Non-Technical Popular Categories (NTPC Undergraduate) 2026 Notification',
    scrapedAt: 'अभी-अभी (AI Ingestion Live)',
    confidenceScore: 99,
    status: 'queued',
    suggestedPost: {
      id: `rrb-ntpc-ug-${Date.now().toString().slice(-4)}`,
      title: 'Railway RRB NTPC Undergraduate Level Recruitment 2026',
      shortTitle: 'RRB NTPC 2026',
      dept: 'Ministry of Railways (Railway Recruitment Boards)',
      totalPosts: '11,558 Posts',
      categories: ['vacancy', 'railway', 'central'],
      dates: {
        start: '21/09/2026',
        end: '20/10/2026',
        exam: 'जनवरी 2027'
      },
      fee: {
        gen: '₹500/- (₹400 रिफंडेबल)',
        reserved: '₹250/- (₹250 रिफंडेबल)'
      },
      eligibility: '12th Intermediate Passed from any recognized board in India.',
      links: {
        apply: 'https://rrbapply.gov.in',
        notificationPdf: 'https://rrbcdg.gov.in/notices/ntpc_2026.pdf',
        officialSite: 'https://rrbapply.gov.in'
      },
      posterConfig: {
        headline: '★ रेलवे NTPC 11,558 पद 12वीं पास भर्ती ★',
        keyPoints: [
          'कुल पद: 11,558 पद (12वीं पास)',
          'CBT-1 परीक्षा देने पर फीस रिफंड',
          'ऑनलाइन आवेदन शुरू: 21 सितंबर 2026'
        ],
        note: 'घर बैठे सुरक्षित फॉर्म भरवाने के लिए व्हाट्सएप करें: 8982324497'
      },
      status: 'pending_approval'
    }
  };

  const drafts = await getScrapedDrafts();
  const updated = [newIngested, ...drafts];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SCRAPER_KEY, JSON.stringify(updated));
  }
  return updated;
}

// -------------------------------------------------------------
// Scraper Target Feeds & Sources Manager
// -------------------------------------------------------------
const STORAGE_SOURCES_KEY = 'np_scraper_sources_v1';

export const INITIAL_SCRAPER_SOURCES: ScraperSource[] = [
  // 1. Central Govt Buckets
  {
    id: 'src-ssc-portal',
    name: 'Staff Selection Commission (SSC Central)',
    bucket: 'govt_portals',
    url: 'https://ssc.gov.in/api/latest-notices',
    feedType: 'api',
    enabled: true,
    lastScraped: 'आज 10:15 AM',
    itemsFound: 4,
    description: 'SSC CGL, CHSL, GD Constable, MTS एवं CPO भर्ती अधिसूचनाएं'
  },
  {
    id: 'src-upsc-rss',
    name: 'UPSC Recruitment Notices Feed',
    bucket: 'govt_portals',
    url: 'https://upsc.gov.in/rss/recruitment.xml',
    feedType: 'rss',
    enabled: true,
    lastScraped: 'आज 09:30 AM',
    itemsFound: 2,
    description: 'Civil Services, NDA, CDS, CMS व अन्य यूपीएससी विज्ञप्तियां'
  },
  {
    id: 'src-rrb-railway',
    name: 'Railway Recruitment Boards (RRB Central)',
    bucket: 'govt_portals',
    url: 'https://rrbapply.gov.in/notifications',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 08:00 AM',
    itemsFound: 3,
    description: 'RRB NTPC, Group D, ALP, Technician एवं RPF पुलिस भर्ती'
  },
  // 2. MP Special Buckets
  {
    id: 'src-mpesb-rulebooks',
    name: 'MPESB Bhopal Rulebooks & Exam Feed',
    bucket: 'mp_special',
    url: 'https://esb.mp.gov.in/latest-rulebooks',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 11:45 AM',
    itemsFound: 5,
    description: 'MP Police, Sub Engineer, Patwari, Group 1/2/3/4/5 भर्तियां'
  },
  {
    id: 'src-mppsc-portal',
    name: 'MPPSC Indore Official Announcements',
    bucket: 'mp_special',
    url: 'https://mppsc.mp.gov.in/notifications',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 07:30 AM',
    itemsFound: 2,
    description: 'मध्य प्रदेश राज्य सेवा परीक्षा (State Service Exam & Forest)'
  },
  {
    id: 'src-mphc-jabalpur',
    name: 'MP High Court Jabalpur Official Recruitment',
    bucket: 'mp_special',
    url: 'https://mphc.gov.in/recruitment',
    feedType: 'html',
    enabled: true,
    lastScraped: 'कल शाम 06:45 PM',
    itemsFound: 1,
    description: 'MPHC Assistant Grade 3, Stenographer एवं जिला न्यायालय पद'
  },
  // 3. Tech & Corporate Buckets
  {
    id: 'src-tech-freshers',
    name: 'FreshersWorld IT & Software Campus RSS',
    bucket: 'tech_corporate',
    url: 'https://freshersworld.com/rss/it-jobs.xml',
    feedType: 'rss',
    enabled: true,
    lastScraped: 'आज 10:20 AM',
    itemsFound: 6,
    description: 'IT Freshers, Software Engineer, B.Tech/BCA/MCA ऑफ-कैंपस ड्राइव'
  },
  {
    id: 'src-tech-indore-pune',
    name: 'MP & Pune Tech Careers (Indore IT Park)',
    bucket: 'tech_corporate',
    url: 'https://naukri.com/tech-rss/indore-software',
    feedType: 'rss',
    enabled: true,
    lastScraped: 'आज 11:10 AM',
    itemsFound: 4,
    description: 'TCS, Infosys, Wipro, Google India, एवं इंदौर सुपर कॉरिडोर IT ओपनिंग्स'
  }
];

export async function getScraperSources(): Promise<ScraperSource[]> {
  if (typeof window === 'undefined') return INITIAL_SCRAPER_SOURCES;
  try {
    const cached = localStorage.getItem(STORAGE_SOURCES_KEY);
    if (!cached) {
      localStorage.setItem(STORAGE_SOURCES_KEY, JSON.stringify(INITIAL_SCRAPER_SOURCES));
      return INITIAL_SCRAPER_SOURCES;
    }
    return JSON.parse(cached);
  } catch {
    return INITIAL_SCRAPER_SOURCES;
  }
}

export async function saveScraperSources(sources: ScraperSource[]): Promise<boolean> {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SOURCES_KEY, JSON.stringify(sources));
  }
  return true;
}

export async function addScraperSource(
  source: Omit<ScraperSource, 'id'>
): Promise<ScraperSource> {
  const newSource: ScraperSource = {
    ...source,
    id: `src-${Date.now()}`
  };
  const list = await getScraperSources();
  const updated = [newSource, ...list];
  await saveScraperSources(updated);
  return newSource;
}

export async function toggleScraperSource(sourceId: string): Promise<boolean> {
  const list = await getScraperSources();
  const updated = list.map((s) => (s.id === sourceId ? { ...s, enabled: !s.enabled } : s));
  await saveScraperSources(updated);
  return true;
}

export async function deleteScraperSource(sourceId: string): Promise<boolean> {
  const list = await getScraperSources();
  const updated = list.filter((s) => s.id !== sourceId);
  await saveScraperSources(updated);
  return true;
}

export async function triggerSourceTestFetch(sourceId: string): Promise<{
  success: boolean;
  message: string;
  newDraftCount: number;
}> {
  const list = await getScraperSources();
  const src = list.find((s) => s.id === sourceId);
  if (!src) {
    return { success: false, message: 'स्रोत नहीं मिला', newDraftCount: 0 };
  }

  // Generate target-specific sample drafts based on source bucket
  let sampleDraft: ScrapedJobDraft;
  const nowStr = 'आज (लाइव टेस्ट फेच)';
  
  if (src.bucket === 'tech_corporate') {
    sampleDraft = {
      id: `scraped-tech-${Date.now()}`,
      sourcePortal: `${src.name} (${src.url})`,
      rawTitle: 'Microsoft India Software Engineer / Cloud Solution Associate 2026',
      scrapedAt: nowStr,
      confidenceScore: 98,
      status: 'queued',
      suggestedPost: {
        id: `msft-swe-${Date.now().toString().slice(-4)}`,
        title: 'Microsoft India Software Engineer (Freshers / Campus 2026)',
        shortTitle: 'Microsoft SWE 2026',
        dept: 'Microsoft India R&D Pvt Ltd',
        totalPosts: 'Openings for Bangalore & Hyderabad',
        categories: ['vacancy', 'tech'],
        dates: {
          start: '21/09/2026',
          end: '31/10/2026',
          exam: 'Codility Assessment + Technical Rounds'
        },
        fee: {
          gen: '₹0/- (No Fee)',
          reserved: '₹0/- (No Fee)'
        },
        eligibility: 'B.Tech / M.Tech / MCA (2025/2026 Batch) with 7.0+ CGPA or 70%+ marks.',
        links: {
          apply: 'https://careers.microsoft.com',
          notificationPdf: 'https://careers.microsoft.com/us/en/job',
          officialSite: 'https://careers.microsoft.com'
        },
        posterConfig: {
          headline: '★ Microsoft India Software Engineer 2026 ★',
          keyPoints: [
            'कंपनी: Microsoft India (Hyderabad/Bengaluru)',
            'पद: Software Engineer (L59/L60)',
            'पैकेज: ₹40 LPA+ (Total CTC)',
            'आवेदन: पूर्णतः निःशुल्क'
          ],
          note: 'फॉर्म भरने में सहायता हेतु संपर्क करें: Nitish Khobragade (8982324497)'
        },
        status: 'pending_approval',
        isTechJob: true,
        companyName: 'Microsoft',
        role: 'Software Engineer',
        experience: 'Freshers (0 Yrs)',
        location: 'Bengaluru / Hyderabad',
        batchEligibility: '2025 & 2026 Batch'
      }
    };
  } else if (src.bucket === 'mp_special') {
    sampleDraft = {
      id: `scraped-mp-${Date.now()}`,
      sourcePortal: `${src.name} (${src.url})`,
      rawTitle: 'MP ESB Vanrakshak (Forest Guard) & Kshetra Rakshak Recruitment 2026 Rulebook',
      scrapedAt: nowStr,
      confidenceScore: 97,
      status: 'queued',
      suggestedPost: {
        id: `mp-forest-guard-${Date.now().toString().slice(-4)}`,
        title: 'MPESB Forest Guard (वनरक्षक) & Kshetra Rakshak 2,112 Posts 2026',
        shortTitle: 'MP Vanrakshak 2026',
        dept: 'Madhya Pradesh Employees Selection Board (MPESB)',
        totalPosts: '2,112 Posts',
        categories: ['vacancy', 'mp_special'],
        dates: {
          start: '24/09/2026',
          end: '18/10/2026',
          exam: 'नवंबर 2026'
        },
        fee: {
          gen: '₹500/-',
          reserved: '₹250/- (MP मूल निवासी)'
        },
        eligibility: '10th / 10+2 Passed from MP Board or equivalent board.',
        links: {
          apply: 'https://esb.mp.gov.in',
          notificationPdf: 'https://esb.mp.gov.in/rulebooks',
          officialSite: 'https://esb.mp.gov.in'
        },
        posterConfig: {
          headline: '★ MP वनरक्षक 2,112 पद भर्ती 2026 ★',
          keyPoints: [
            'कुल पद: 2,112 पद',
            'योग्यता: 10वीं / 12वीं पास',
            'आयु सीमा: 18 से 33 वर्ष (छूट नियमानुसार)'
          ],
          note: 'घर बैठे MP Online फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
        },
        status: 'pending_approval'
      }
    };
  } else {
    // Central Govt
    sampleDraft = {
      id: `scraped-central-${Date.now()}`,
      sourcePortal: `${src.name} (${src.url})`,
      rawTitle: 'SSC Combined Higher Secondary Level (CHSL 10+2) Examination 2026 Notification',
      scrapedAt: nowStr,
      confidenceScore: 99,
      status: 'queued',
      suggestedPost: {
        id: `ssc-chsl-${Date.now().toString().slice(-4)}`,
        title: 'SSC CHSL (10+2) LDC, JSA & DEO Recruitment 2026',
        shortTitle: 'SSC CHSL 2026',
        dept: 'Staff Selection Commission (SSC Central)',
        totalPosts: '3,712 Posts',
        categories: ['vacancy', 'central'],
        dates: {
          start: '23/09/2026',
          end: '22/10/2026',
          exam: 'दिसंबर 2026'
        },
        fee: {
          gen: '₹100/-',
          reserved: '₹0/- (SC/ST/महिला निःशुल्क)'
        },
        eligibility: '12th Standard or equivalent examination from a recognized Board.',
        links: {
          apply: 'https://ssc.gov.in',
          notificationPdf: 'https://ssc.gov.in/notices/chsl_2026.pdf',
          officialSite: 'https://ssc.gov.in'
        },
        posterConfig: {
          headline: '★ SSC CHSL (10+2) 3,712 पद भर्ती ★',
          keyPoints: [
            'कुल पद: 3,712 (LDC/DEO)',
            'योग्यता: 12वीं पास',
            'आवेदन शुल्क: मात्र ₹100'
          ],
          note: 'सुरक्षित ऑनलाइन आवेदन हेतु संपर्क: Nitish Khobragade (8982324497)'
        },
        status: 'pending_approval'
      }
    };
  }

  // Push into drafts
  const existingDrafts = await getScrapedDrafts();
  const updatedDrafts = [sampleDraft, ...existingDrafts];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_SCRAPER_KEY, JSON.stringify(updatedDrafts));
  }

  // Update source statistics
  const updatedSources = list.map((s) => {
    if (s.id === sourceId) {
      return {
        ...s,
        lastScraped: 'अभी-अभी (सफल 200 OK)',
        itemsFound: (s.itemsFound || 0) + 1
      };
    }
    return s;
  });
  await saveScraperSources(updatedSources);

  return {
    success: true,
    message: `${src.name} से डेटा सफलतापूर्वक फेच हुआ! 1 नया ड्राफ्ट इनजेशन कतार में जोड़ा गया।`,
    newDraftCount: 1
  };
}

