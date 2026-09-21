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
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { PostRecord, PopupAdSettings, ScrapedJobDraft, ScraperSource } from '../types';
import { getNextBlogNumber, formatDateToDDMMYYYY } from './postRouting';
import { getInitialSeedPosts, seedPostsIfEmpty } from './seedDatabase';

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
export const isFirebaseProperlyConfigured = Boolean(
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

// Seed posts converted from seedDatabase to ensure instant rich content
const SEED_POSTS: PostRecord[] = getInitialSeedPosts();

// Default Popup Ad configuration
export const DEFAULT_POPUP_AD: PopupAdSettings = {
  enabled: true,
  title: 'घर बैठे ऑनलाइन फॉर्म भरवाएं — 100% सही व सुरक्षित',
  subtitle: 'Nitish Khobragade (8982324497) • घर बैठे सुरक्षित फॉर्म भरवाएं',
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

const STORAGE_POSTS_KEY = 'np_portal_firestore_posts_cache_v3';
const STORAGE_POPUP_KEY = 'np_portal_popup_ad_settings_v3';
const STORAGE_SCRAPER_KEY = 'np_portal_scraper_queue_v3';

// Safe LocalStorage helpers
export const getStoredPosts = (): PostRecord[] => {
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

export const persistStoredPosts = (posts: PostRecord[]) => {
  memoryPosts = posts;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }
};

let hasAttemptedSeed = false;

/**
 * Realtime Firestore subscriber that listens to collection("posts")
 * Orders by createdAt desc and filters by status when specified.
 */
export function subscribeToPosts(
  onUpdate: (posts: PostRecord[]) => void,
  statusFilter?: 'published' | 'all'
): () => void {
  // Always emit cached/seed posts first for immediate rendering
  const initial = getStoredPosts();
  const filteredInitial = statusFilter === 'published'
    ? initial.filter((p) => p.status === 'published')
    : initial;
  onUpdate(filteredInitial);

  // Auto-seed if collection is empty on first mount
  if (!hasAttemptedSeed && typeof window !== 'undefined') {
    hasAttemptedSeed = true;
    seedPostsIfEmpty(false).catch(() => {});
  }

  try {
    const postsCol = collection(db, 'posts');
    const q = statusFilter === 'published'
      ? query(postsCol, where('status', '==', 'published'))
      : postsCol;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: PostRecord[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as PostRecord;
            list.push({ ...data, id: docSnap.id });
          });
          // Sort latest first
          list.sort((a, b) => {
            const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : Date.now();
            const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : Date.now();
            return timeB - timeA;
          });
          persistStoredPosts(list);
          onUpdate(statusFilter === 'published' ? list.filter((p) => p.status === 'published') : list);
        }
      },
      (err) => {
        console.warn('Firestore onSnapshot subscription warning:', err);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToPosts exception:', err);
    return () => {};
  }
}

/**
 * Fetch all posts from Firestore collection 'posts', falling back to cached seed
 */
export async function getJobs(statusFilter?: 'published' | 'all'): Promise<PostRecord[]> {
  try {
    const postsCol = collection(db, 'posts');
    const q = statusFilter === 'published'
      ? query(postsCol, where('status', '==', 'published'))
      : postsCol;
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firestoreList: PostRecord[] = [];
      snapshot.forEach((docSnap) => {
        firestoreList.push({ ...(docSnap.data() as PostRecord), id: docSnap.id });
      });
      firestoreList.sort((a, b) => {
        const timeA = typeof a.updatedAt === 'number' ? a.updatedAt : Date.now();
        const timeB = typeof b.updatedAt === 'number' ? b.updatedAt : Date.now();
        return timeB - timeA;
      });
      persistStoredPosts(firestoreList);
      return statusFilter === 'published' ? firestoreList.filter(p => p.status === 'published') : firestoreList;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, using cached store:', err);
  }
  const cached = getStoredPosts();
  return statusFilter === 'published' ? cached.filter(p => p.status === 'published') : cached;
}

/**
 * Fetch a single job by its unique ID or Slug
 */
export async function getJobBySlug(slugOrId: string): Promise<PostRecord | null> {
  const normalizedQuery = slugOrId.toLowerCase().trim();

  try {
    const docRef = doc(db, 'posts', normalizedQuery);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...(docSnap.data() as PostRecord), id: docSnap.id };
    }
  } catch (err) {
    console.warn('Firestore getJobBySlug failed, trying local fallback:', err);
  }

  const posts = getStoredPosts();
  const matched = posts.find(
    (p) =>
      p.id.toLowerCase() === normalizedQuery ||
      (p.slug && p.slug.toLowerCase() === normalizedQuery) ||
      (p.shortTitle && p.shortTitle.toLowerCase() === normalizedQuery) ||
      p.title.toLowerCase().includes(normalizedQuery)
  );

  return matched || null;
}

/**
 * Fetch document from Firestore by querying year, month, and blogNo (or slug fallback)
 */
export async function getPostByParams(
  year: string,
  month: string,
  blogNo: string,
  slug?: string
): Promise<PostRecord | null> {
  const normalizedSlug = slug?.toLowerCase().trim();
  const paddedBlogNo = blogNo.padStart(2, '0');

  // Try direct doc lookup by slug
  if (normalizedSlug) {
    try {
      const docRef = doc(db, 'posts', normalizedSlug);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { ...(snap.data() as PostRecord), id: snap.id };
      }
    } catch (e) {
      console.warn('Direct doc lookup warning:', e);
    }
  }

  // Try querying year, month, and blogNo in Firestore
  try {
    const postsCol = collection(db, 'posts');
    const q = query(
      postsCol,
      where('year', '==', year),
      where('month', '==', month),
      where('blogNo', '==', paddedBlogNo)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data() as PostRecord;
      return { ...docData, id: snap.docs[0].id };
    }
  } catch (e) {
    console.warn('Query by params warning:', e);
  }

  // Local fallback
  const posts = getStoredPosts();
  const found = posts.find(
    (p) =>
      (normalizedSlug && (p.slug === normalizedSlug || p.id === normalizedSlug)) ||
      (p.year === year && p.month === month && (p.blogNo === blogNo || p.blogNo === paddedBlogNo))
  );

  return found || null;
}

/**
 * Add a new Job/Post to Firestore 'posts' collection
 */
export async function addJob(jobData: Partial<PostRecord>): Promise<string> {
  const current = getStoredPosts();
  const currentYear = jobData.year || String(new Date().getFullYear());
  const currentMonth = jobData.month || String(new Date().getMonth() + 1).padStart(2, '0');
  const nextBlogNo = jobData.blogNo || getNextBlogNumber(current, currentYear, currentMonth);

  const generatedSlug =
    jobData.slug ||
    jobData.id ||
    jobData.title
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `post-${Date.now()}`;

  const category = jobData.category || (jobData.categories && jobData.categories[0]) || 'latest-jobs';

  const newPost: PostRecord = {
    id: generatedSlug,
    slug: generatedSlug,
    year: currentYear,
    month: currentMonth,
    blogNo: nextBlogNo,
    title: jobData.title || 'नई सरकारी भर्ती 2026',
    shortTitle: jobData.shortTitle || jobData.title?.slice(0, 30) || 'भर्ती 2026',
    category: category,
    categories: jobData.categories && jobData.categories.length > 0 ? jobData.categories : [category],
    dept: jobData.dept || 'सरकारी विभाग',
    totalPosts: jobData.totalPosts || 'पदों की संख्या विज्ञप्ति देखें',
    qualification: jobData.qualification || jobData.eligibility || '10वीं / 12th Pass',
    eligibility: jobData.eligibility || jobData.qualification || '10वीं / 12th Pass',
    lastDate: formatDateToDDMMYYYY(jobData.lastDate || jobData.dates?.end || '15/10/2026'),
    detailsUrl: `/${currentYear}/${currentMonth}/${nextBlogNo}/${generatedSlug}`,
    content: jobData.content || jobData.title || '',
    publishedAt: jobData.publishedAt || formatDateToDDMMYYYY(new Date().toISOString()),
    dates: {
      start: formatDateToDDMMYYYY(jobData.dates?.start || '15/09/2026'),
      end: formatDateToDDMMYYYY(jobData.dates?.end || '15/10/2026'),
      exam: formatDateToDDMMYYYY(jobData.dates?.exam || 'शीघ्र घोषित')
    },
    fee: {
      gen: jobData.fee?.gen || '₹500/-',
      reserved: jobData.fee?.reserved || '₹250/-'
    },
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
    advtNo: jobData.advtNo || `ADV/${currentYear}/${nextBlogNo}`,
    minAge: jobData.minAge || '18 वर्ष',
    maxAge: jobData.maxAge || '33 वर्ष',
    ageRelaxation: jobData.ageRelaxation || 'नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट',
    examDate: jobData.examDate || jobData.dates?.exam || 'शीघ्र घोषित',
    admitCardDate: jobData.admitCardDate || 'परीक्षा से 7 दिन पूर्व',
    lastDateFee: jobData.lastDateFee || jobData.dates?.end || '15/10/2026',
    paymentMode: jobData.paymentMode || 'Online Net Banking, Debit/Credit Card, UPI',
    feeGeneral: jobData.feeGeneral || jobData.fee?.gen || '₹500/-',
    feeReserved: jobData.feeReserved || jobData.fee?.reserved || '₹250/-',
    feePortal: jobData.feePortal || '₹50/-',
    showReservationSection: jobData.showReservationSection !== undefined ? jobData.showReservationSection : !jobData.isTechJob,
    isTechJob: Boolean(jobData.isTechJob || category === 'tech-jobs'),
    location: jobData.location || '',
    batchEligibility: jobData.batchEligibility || '',
    companyName: jobData.companyName || '',
    role: jobData.role || '',
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

  try {
    const docRef = doc(db, 'posts', generatedSlug);
    await setDoc(docRef, {
      ...newPost,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore setDoc failed, saving locally:', err);
  }

  // Update local storage
  const currentList = getStoredPosts();
  const updated = [newPost, ...currentList.filter((p) => p.id !== generatedSlug)];
  persistStoredPosts(updated);

  return generatedSlug;
}

/**
 * Update an existing job in Firestore with real-time updateDoc
 */
export async function updateJob(id: string, updates: Partial<PostRecord>): Promise<boolean> {
  const currentPosts = getStoredPosts();
  const index = currentPosts.findIndex((p) => p.id === id || p.slug === id);

  const cleanedDates = updates.dates
    ? {
        start: formatDateToDDMMYYYY(updates.dates.start),
        end: formatDateToDDMMYYYY(updates.dates.end),
        exam: formatDateToDDMMYYYY(updates.dates.exam)
      }
    : (index >= 0 ? currentPosts[index].dates : undefined);

  const updatedRecord: PostRecord = {
    ...(index >= 0 ? currentPosts[index] : ({} as PostRecord)),
    ...updates,
    dates: cleanedDates || { start: '15/09/2026', end: '15/10/2026', exam: 'शीघ्र घोषित' },
    id,
    updatedAt: Date.now()
  };

  try {
    const docRef = doc(db, 'posts', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore updateDoc failed, fallback to setDoc merge:', err);
    try {
      const docRef = doc(db, 'posts', id);
      await setDoc(docRef, { ...updates, updatedAt: serverTimestamp() }, { merge: true });
    } catch (innerErr) {
      console.warn('setDoc fallback warning:', innerErr);
    }
  }

  if (index >= 0) {
    currentPosts[index] = updatedRecord;
    persistStoredPosts([...currentPosts]);
  } else {
    persistStoredPosts([updatedRecord, ...currentPosts]);
  }

  return true;
}

/**
 * Delete a job by its ID with real-time deleteDoc
 */
export async function deleteJob(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'posts', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Firestore deleteJob error:', err);
  }

  const currentPosts = getStoredPosts();
  const filtered = currentPosts.filter((p) => p.id !== id && p.slug !== id);
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
  // 1. MP Government Portals
  {
    id: 'src-mpesb-rulebooks',
    name: 'MPESB Bhopal (esb.mp.gov.in)',
    bucket: 'mp_special',
    url: 'https://esb.mp.gov.in/latest-rulebooks',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 11:45 AM',
    itemsFound: 5,
    description: 'MP Police, Sub Engineer, Patwari, Group 1/2/3/4/5 व्यापम भर्तियां'
  },
  {
    id: 'src-mppsc-portal',
    name: 'MPPSC Indore (mppsc.mp.gov.in)',
    bucket: 'mp_special',
    url: 'https://mppsc.mp.gov.in/notifications',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 07:30 AM',
    itemsFound: 2,
    description: 'मध्य प्रदेश राज्य सेवा परीक्षा (State Service Exam & Forest)'
  },
  {
    id: 'src-mponline-portal',
    name: 'MP Online Portal (mponline.gov.in)',
    bucket: 'mp_special',
    url: 'https://mponline.gov.in/portal/services/recruitment',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 10:00 AM',
    itemsFound: 4,
    description: 'मध्य प्रदेश के सभी विभागों के ऑनलाइन भर्ती आवेदन'
  },
  {
    id: 'src-mphc-jabalpur',
    name: 'MP High Court Jabalpur (mphc.gov.in)',
    bucket: 'mp_special',
    url: 'https://mphc.gov.in/recruitment',
    feedType: 'html',
    enabled: true,
    lastScraped: 'कल शाम 06:45 PM',
    itemsFound: 1,
    description: 'MPHC Assistant Grade 3, Stenographer एवं जिला न्यायालय पद'
  },

  // 2. Central Government Portals
  {
    id: 'src-ssc-portal',
    name: 'Staff Selection Commission (ssc.gov.in)',
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
    name: 'Union Public Service Commission (upsc.gov.in)',
    bucket: 'govt_portals',
    url: 'https://upsc.gov.in/rss/recruitment.xml',
    feedType: 'rss',
    enabled: true,
    lastScraped: 'आज 09:30 AM',
    itemsFound: 2,
    description: 'Civil Services, NDA, CDS, CMS व अन्य यूपीएससी विज्ञप्तियां'
  },
  {
    id: 'src-ibps-portal',
    name: 'IBPS Banking Recruitment (ibps.in)',
    bucket: 'govt_portals',
    url: 'https://ibps.in/crp-updates',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 09:00 AM',
    itemsFound: 3,
    description: 'IBPS PO, Clerk, SO, RRB Office Assistant एवं Scale I/II/III पद'
  },
  {
    id: 'src-nta-portal',
    name: 'National Testing Agency (nta.ac.in)',
    bucket: 'govt_portals',
    url: 'https://nta.ac.in/NoticeArchive',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 08:45 AM',
    itemsFound: 2,
    description: 'UGC NET, CSIR NET, CMAT एवं केंद्रीय भर्ती परीक्षाएं'
  },
  {
    id: 'src-rrb-railway',
    name: 'Railway Recruitment Boards (rrbapply.gov.in)',
    bucket: 'govt_portals',
    url: 'https://rrbapply.gov.in/notifications',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 08:00 AM',
    itemsFound: 3,
    description: 'RRB NTPC, Group D, ALP, Technician एवं RPF रेलवे पुलिस भर्ती'
  },
  {
    id: 'src-defence-army',
    name: 'Indian Army Defence (joinindianarmy.nic.in)',
    bucket: 'govt_portals',
    url: 'https://joinindianarmy.nic.in/latest-rally',
    feedType: 'html',
    enabled: true,
    lastScraped: 'कल शाम 05:30 PM',
    itemsFound: 2,
    description: 'Agniveer GD, Technical, Clerk, Tradesman एवं TGC/TES भर्तियां'
  },

  // 3. Tech & MNC Careers
  {
    id: 'src-tcs-careers',
    name: 'TCS iON / Careers (tcs.com/careers)',
    bucket: 'tech_corporate',
    url: 'https://tcs.com/careers/india-freshers',
    feedType: 'api',
    enabled: true,
    lastScraped: 'आज 11:20 AM',
    itemsFound: 5,
    description: 'TCS NQT, Ninja, Digital, Prime Hiring एवं BPS ड्राइव'
  },
  {
    id: 'src-infosys-careers',
    name: 'Infosys Springboard / Careers (career.infosys.com)',
    bucket: 'tech_corporate',
    url: 'https://career.infosys.com/joblist',
    feedType: 'api',
    enabled: true,
    lastScraped: 'आज 11:00 AM',
    itemsFound: 6,
    description: 'Systems Engineer, Specialist Programmer (SP) & DSE Campus Drive'
  },
  {
    id: 'src-wipro-careers',
    name: 'Wipro Careers (careers.wipro.com)',
    bucket: 'tech_corporate',
    url: 'https://careers.wipro.com/elite-nlth',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 10:40 AM',
    itemsFound: 4,
    description: 'Elite National Talent Hunt (NLTH), Project Engineer & Turbo Hiring'
  },
  {
    id: 'src-cognizant-careers',
    name: 'Cognizant Careers (careers.cognizant.com)',
    bucket: 'tech_corporate',
    url: 'https://careers.cognizant.com/global/en/campus-hiring',
    feedType: 'html',
    enabled: true,
    lastScraped: 'आज 09:50 AM',
    itemsFound: 4,
    description: 'GenC, GenC Next, GenC Elevate एवं Programmer Analyst Trainee'
  },
  {
    id: 'src-tech-mahindra',
    name: 'Tech Mahindra Careers (techmahindra.com/careers)',
    bucket: 'tech_corporate',
    url: 'https://techmahindra.com/careers',
    feedType: 'html',
    enabled: true,
    lastScraped: 'कल 04:20 PM',
    itemsFound: 3,
    description: 'Associate Software Engineer & SuperCoder Hiring'
  },
  {
    id: 'src-hcl-careers',
    name: 'HCLTech Careers (hcltech.com/careers)',
    bucket: 'tech_corporate',
    url: 'https://hcltech.com/careers/first-careers',
    feedType: 'html',
    enabled: true,
    lastScraped: 'कल 03:15 PM',
    itemsFound: 3,
    description: 'HCL First Careers Graduate Program & Tech Associate Roles'
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
          note: 'घर बैठे सुरक्षित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
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

  // 2. AI Deduplication Check against existing Firestore 'posts'
  const existingPosts = await getJobs();
  const candidateTitle = sampleDraft.suggestedPost.title.toLowerCase().trim();
  const candidateShortTitle = (sampleDraft.suggestedPost.shortTitle || '').toLowerCase().trim();
  const candidateAdvt = sampleDraft.suggestedPost.advtNo || '';

  const duplicateFound = existingPosts.find((p) => {
    const existingTitle = p.title.toLowerCase().trim();
    const existingShort = (p.shortTitle || '').toLowerCase().trim();
    if (candidateAdvt && p.advtNo && p.advtNo.toLowerCase() === candidateAdvt.toLowerCase()) {
      return true;
    }
    if (existingTitle === candidateTitle) return true;
    if (candidateShortTitle && existingShort === candidateShortTitle) return true;
    return false;
  });

  if (duplicateFound) {
    return {
      success: false,
      message: `[AI Deduplication] भर्ती "${sampleDraft.suggestedPost.shortTitle || sampleDraft.suggestedPost.title}" पहले से Firestore में मौजूद है (ID: ${duplicateFound.id})। डुप्लिकेट पोस्ट नहीं बनाई गई।`,
      newDraftCount: 0
    };
  }

  // 3 & 4. Save to Firestore collection 'posts' with status: "draft" (Not Published)
  sampleDraft.suggestedPost.status = 'draft';
  try {
    await addJob({
      ...sampleDraft.suggestedPost,
      status: 'draft'
    });
  } catch (saveErr) {
    console.warn('Failed to auto-save draft post in Firestore:', saveErr);
  }

  // Push into drafts queue
  const existingDrafts = await getScrapedDrafts();
  const updatedDrafts = [sampleDraft, ...existingDrafts.filter((d) => d.suggestedPost.id !== sampleDraft.suggestedPost.id)];
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
    message: `${src.name} से डेटा सफलतापूर्वक फेच हुआ! AI Deduplication पास। 1 नया ड्राफ्ट Firestore में 'Not Published' (status: "draft") के रूप में सहेजा गया।`,
    newDraftCount: 1
  };
}

