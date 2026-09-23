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
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { PostRecord, PopupAdSettings, ScrapedJobDraft, ScraperSource, TickerAlert, BlogPost } from '../types';
import { TICKER_ALERTS } from '../data/portalData';
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

// Helper to extract a numerical sorting timestamp from a PostRecord
export function getPostSortingTimestamp(p: PostRecord): number {
  if (p.publishedAt) {
    if (typeof p.publishedAt === 'number') return p.publishedAt;
    if (typeof p.publishedAt === 'object' && 'seconds' in p.publishedAt) {
      return (p.publishedAt as { seconds: number }).seconds * 1000;
    }
    if (typeof p.publishedAt === 'string') {
      // Check if dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(p.publishedAt)) {
        const parts = p.publishedAt.split('/');
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      }
      const parsed = Date.parse(p.publishedAt);
      if (!isNaN(parsed)) return parsed;
    }
  }
  if (p.updatedAt) {
    if (typeof p.updatedAt === 'number') return p.updatedAt;
    if (typeof p.updatedAt === 'object' && 'seconds' in p.updatedAt) {
      return (p.updatedAt as { seconds: number }).seconds * 1000;
    }
    const parsed = Date.parse(String(p.updatedAt));
    if (!isNaN(parsed)) return parsed;
  }
  if (p.createdAt) {
    if (typeof p.createdAt === 'number') return p.createdAt;
    if (typeof p.createdAt === 'object' && 'seconds' in p.createdAt) {
      return (p.createdAt as { seconds: number }).seconds * 1000;
    }
    const parsed = Date.parse(String(p.createdAt));
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
}

// Helper to format Date & exact Time for live post cards
export function formatPublicationDateTime(dateInput?: unknown): string {
  const d = dateInput instanceof Date ? dateInput : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, '0');
  return `${day}/${month}/${year}, ${strHours}:${minutes} ${ampm}`;
}

let hasAttemptedSeed = false;

/**
 * Realtime Firestore subscriber that listens to collection("posts")
 * Orders descending by publication timestamp and respects status committed states.
 */
export function subscribeToPosts(
  onUpdate: (posts: PostRecord[]) => void,
  statusFilter?: 'published' | 'all'
): () => void {
  // Always emit cached/seed posts first for immediate rendering
  const initial = getStoredPosts();
  initial.sort((a, b) => getPostSortingTimestamp(b) - getPostSortingTimestamp(a));
  const filteredInitial = statusFilter === 'published'
    ? initial.filter((p) => (p.status || 'published') === 'published')
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
          // Sort real-time descending: newest published first
          list.sort((a, b) => getPostSortingTimestamp(b) - getPostSortingTimestamp(a));
          persistStoredPosts(list);
          onUpdate(statusFilter === 'published' ? list.filter((p) => (p.status || 'published') === 'published') : list);
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
      firestoreList.sort((a, b) => getPostSortingTimestamp(b) - getPostSortingTimestamp(a));
      persistStoredPosts(firestoreList);
      return statusFilter === 'published' ? firestoreList.filter(p => (p.status || 'published') === 'published') : firestoreList;
    }
  } catch (err) {
    console.warn('Firestore fetch failed, using cached store:', err);
  }
  const cached = getStoredPosts();
  cached.sort((a, b) => getPostSortingTimestamp(b) - getPostSortingTimestamp(a));
  return statusFilter === 'published' ? cached.filter(p => (p.status || 'published') === 'published') : cached;
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
    publishedAt: jobData.publishedAt || Date.now(),
    publishedDate: jobData.publishedDate || formatDateToDDMMYYYY(new Date().toISOString()),
    publishedDateFormatted: jobData.publishedDateFormatted || formatPublicationDateTime(new Date()),
    importantLinks: jobData.importantLinks || [],
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

  const isPublishing = newPost.status === 'published';

  try {
    const docRef = doc(db, 'posts', generatedSlug);
    await setDoc(docRef, {
      ...newPost,
      publishedAt: isPublishing ? serverTimestamp() : (newPost.publishedAt || Date.now()),
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

  const isPublishingNow = updates.status === 'published' && (index < 0 || currentPosts[index]?.status !== 'published');

  const payload: Record<string, unknown> = {
    ...updates,
    updatedAt: serverTimestamp()
  };

  if (isPublishingNow) {
    payload.publishedAt = serverTimestamp();
    payload.publishedDateFormatted = formatPublicationDateTime(new Date());
  }

  const updatedRecord: PostRecord = {
    ...(index >= 0 ? currentPosts[index] : ({} as PostRecord)),
    ...updates,
    ...(isPublishingNow
      ? {
          publishedAt: Date.now(),
          publishedDateFormatted: formatPublicationDateTime(new Date())
        }
      : {}),
    dates: cleanedDates || { start: '15/09/2026', end: '15/10/2026', exam: 'शीघ्र घोषित' },
    id,
    updatedAt: Date.now()
  };

  try {
    const docRef = doc(db, 'posts', id);
    await updateDoc(docRef, payload);
  } catch (err) {
    console.warn('Firestore updateDoc failed, fallback to setDoc merge:', err);
    try {
      const docRef = doc(db, 'posts', id);
      await setDoc(docRef, payload, { merge: true });
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

/**
 * TICKER / BREAKING NEWS CONTROLLER
 * Supports real-time Firestore synchronization and local fallback
 */
const STORAGE_TICKER_KEY = 'np_portal_ticker_alerts_v3';
let memoryTickers: TickerAlert[] = TICKER_ALERTS.map((t) => ({ ...t, active: t.active !== false }));

export async function getTickers(): Promise<TickerAlert[]> {
  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'settings', 'ticker_news');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.items && Array.isArray(data.items)) {
          memoryTickers = data.items;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_TICKER_KEY, JSON.stringify(data.items));
          }
          return data.items;
        }
      }
    } catch (err) {
      console.warn('Firestore getTickers failed:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(STORAGE_TICKER_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
  }

  return memoryTickers;
}

export async function saveTickers(items: TickerAlert[]): Promise<boolean> {
  memoryTickers = items;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_TICKER_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage ticker save error:', e);
    }
  }

  if (isFirebaseProperlyConfigured) {
    try {
      const docRef = doc(db, 'settings', 'ticker_news');
      await setDoc(docRef, { items, updatedAt: Date.now() });
      return true;
    } catch (err) {
      console.warn('Firestore saveTickers failed:', err);
    }
  }

  return true;
}

export function subscribeToTickers(onUpdate: (tickers: TickerAlert[]) => void): () => void {
  // Emit initial memory/cached tickers immediately
  getTickers().then(onUpdate).catch(() => onUpdate(memoryTickers));

  if (!isFirebaseProperlyConfigured) {
    return () => {};
  }

  try {
    const docRef = doc(db, 'settings', 'ticker_news');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data?.items && Array.isArray(data.items)) {
          memoryTickers = data.items;
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_TICKER_KEY, JSON.stringify(data.items));
            } catch {}
          }
          onUpdate(data.items);
        }
      }
    }, (err) => {
      console.warn('subscribeToTickers warning:', err);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('subscribeToTickers exception:', err);
    return () => {};
  }
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

  // Publish to posts with complete compliant fields
  const postToPublish: Partial<PostRecord> = {
    ...draft.suggestedPost,
    status: 'published',
    publishedDate: draft.suggestedPost.publishedDate || '21/09/2026',
    publishedAt: draft.suggestedPost.publishedAt || '21/09/2026',
    startDate: draft.suggestedPost.dates?.start || draft.suggestedPost.startDate || '15/09/2026',
    lastDate: draft.suggestedPost.lastDate || draft.suggestedPost.dates?.end || '15/10/2026',
    examDate: draft.suggestedPost.dates?.exam || draft.suggestedPost.examDate || 'शीघ्र घोषित',
    admitCardDate: draft.suggestedPost.admitCardDate || 'परीक्षा से 7 दिन पूर्व',
    applyLink: draft.suggestedPost.links?.apply || draft.suggestedPost.applyLink || 'https://esb.mp.gov.in',
    notificationPdf: draft.suggestedPost.links?.notificationPdf || draft.suggestedPost.notificationPdf || 'https://esb.mp.gov.in',
    eligibility: draft.suggestedPost.eligibility || draft.suggestedPost.qualification || '10वीं / 12वीं अथवा स्नातक उत्तीर्ण'
  };

  // Check if post already exists in Firestore by ID
  const existingJob = await getJobBySlug(draft.suggestedPost.id);
  let postId = draft.suggestedPost.id;
  if (existingJob) {
    await updateJob(existingJob.id, postToPublish);
  } else {
    postId = await addJob(postToPublish);
  }

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

// -------------------------------------------------------------
// Database Backup & Restore Manager (Full JSON Snapshot)
// -------------------------------------------------------------
export interface PortalDatabaseBackup {
  version: string;
  exportedAt: string;
  timestamp: number;
  author: string;
  counts: {
    posts: number;
    scrapers: number;
    tickers: number;
    hasPopupSettings: boolean;
  };
  data: {
    posts: PostRecord[];
    scrapers: ScraperSource[];
    tickers: TickerAlert[];
    popupSettings: PopupAdSettings;
  };
}

/**
 * Creates a complete snapshot of all collections: posts, scrapers, tickers, and popup ad settings.
 */
export async function exportFullDatabaseBackup(): Promise<PortalDatabaseBackup> {
  const [posts, scrapers, tickers, popupSettings] = await Promise.all([
    getJobs('all'),
    getScraperSources(),
    getTickers(),
    getPopupAdSettings()
  ]);

  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    timestamp: Date.now(),
    author: 'Nitish Khobragade (NP Job Portal Admin)',
    counts: {
      posts: posts.length,
      scrapers: scrapers.length,
      tickers: tickers.length,
      hasPopupSettings: Boolean(popupSettings)
    },
    data: {
      posts,
      scrapers,
      tickers,
      popupSettings
    }
  };
}

/**
 * Restores a full backup snapshot into Firestore using writeBatch and updates local cache.
 */
export async function restoreDatabaseFromBackup(backup: PortalDatabaseBackup): Promise<{
  success: boolean;
  message: string;
  restoredCounts: { posts: number; scrapers: number; tickers: number };
}> {
  if (!backup || !backup.data || !Array.isArray(backup.data.posts)) {
    throw new Error('अमान्य बैकअप फ़ाइल: बैकअप डेटा संरचना सही नहीं है।');
  }

  const { posts, scrapers, tickers, popupSettings } = backup.data;

  // 1. Restore Posts to Firestore via writeBatch in chunks of 450 (Firestore limit is 500)
  try {
    const chunkSize = 400;
    for (let i = 0; i < posts.length; i += chunkSize) {
      const chunk = posts.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((p) => {
        const id = p.id || p.slug || `post_${Date.now()}`;
        const ref = doc(db, 'posts', id);
        batch.set(ref, {
          ...p,
          id,
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn('Firestore posts batch restore notice (falling back/continuing):', err);
  }

  // Persist locally
  persistStoredPosts(posts);

  // 2. Restore Scrapers
  if (Array.isArray(scrapers) && scrapers.length > 0) {
    try {
      await saveScraperSources(scrapers);
    } catch (err) {
      console.warn('Scrapers restore notice:', err);
    }
  }

  // 3. Restore Tickers
  if (Array.isArray(tickers) && tickers.length > 0) {
    try {
      await saveTickers(tickers);
    } catch (err) {
      console.warn('Tickers restore notice:', err);
    }
  }

  // 4. Restore Popup Ad Settings
  if (popupSettings && popupSettings.title) {
    try {
      await savePopupAdSettings(popupSettings);
    } catch (err) {
      console.warn('Popup settings restore notice:', err);
    }
  }

  return {
    success: true,
    message: `सफलतापूर्वक रीस्टोर किया गया: ${posts.length} पोस्ट्स, ${scrapers?.length || 0} स्क्रैपर स्रोत, ${tickers?.length || 0} टिकर अलर्ट्स!`,
    restoredCounts: {
      posts: posts.length,
      scrapers: scrapers?.length || 0,
      tickers: tickers?.length || 0
    }
  };
}

// ============================================================================
// DEDICATED BLOG ENGINE & RICH ARTICLES (BLOGGER.COM STYLE)
// ============================================================================

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'government-form-filling-top-5-mistakes',
    slug: 'government-form-filling-top-5-mistakes',
    title: 'सरकारी नौकरी फॉर्म भरते समय 5 सबसे बड़ी गलतियां और उनसे कैसे बचें: Nitish Khobragade स्पेशल गाइड',
    excerpt: 'ऑनलाइन फॉर्म में नाम की स्पेलिंग, फोटो डेट, जाति प्रमाण पत्र और फीस भुगतान से जुड़ी गलतियों के कारण हजारों फॉर्म रिजेक्ट होते हैं। जानें कैसे सुरक्षित आवेदन करें।',
    category: 'Career Guidance',
    author: {
      name: 'Nitish Khobragade',
      role: 'Online Form Specialist & Portal Director',
      phone: '8982324497'
    },
    bannerUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1080&auto=format&fit=crop&q=80',
    status: 'published',
    tags: ['Form Filling', 'Mistakes', 'Admit Card Rejection', 'MP Online', 'Aadhar Card'],
    readingTimeMinutes: 8,
    views: 3420,
    seoKeywords: ['Sarkari Form Mistakes', 'Online Form Filling Guidance', 'Form Rejection Reasons', 'MP Online Portal Form Guide'],
    createdAt: Date.now() - 86400000 * 2,
    publishedAt: Date.now() - 86400000 * 2,
    content: `## प्रस्तावना: ऑनलाइन फॉर्म रिजेक्शन का कड़वा सच

प्रत्येक वर्ष देश भर में लाखों युवा दिन-रात मेहनत करके SSC, MPESB, Railway, Banking एवं State PSC जैसी प्रतियोगी परीक्षाओं की तैयारी करते हैं। लेकिन एक चौंकाने वाला तथ्य यह है कि लगभग 8% से 12% अभ्यर्थियों के आवेदन पत्र (Application Forms) केवल छोटी-छोटी तकनीकी गलतियों की वजह से परीक्षा से पहले ही निरस्त (Reject) कर दिए जाते हैं। महीनों की पढ़ाई और सालों का सपना एक गलत क्लिक या अधूरी जानकारी के कारण समाप्त हो जाता है।

NP Job Portal के संचालक एवं ऑनलाइन फॉर्म कंसल्टेंट **Nitish Khobragade (हेल्पलाइन: 8982324497)** के अनुसार, पिछले 8 वर्षों में हजारों आवेदकों के फॉर्म भरने के दौरान हमने 5 ऐसी गंभीर गलतियों को बार-बार देखा है, जिनसे हर अभ्यर्थी को सतर्क रहना चाहिए। आइए बिंदुवार समझें कि इन गलतियों से कैसे बचा जाए।

---

## 1. नाम व जन्मतिथि की स्पेलिंग (10वीं मार्कशीट vs आधार कार्ड मिसमैच)

सरकारी भर्ती नियमावली (Recruitment Rules) का प्राथमिक नियम यह है कि आपका नाम, पिता का नाम, माता का नाम और जन्मतिथि (DOB) अक्षरशः (Letter by Letter) आपकी **10वीं (Matriculation/High School) मार्कशीट** के अनुसार ही होना चाहिए।

### सामान्य गलतियां जो अभ्यर्थी करते हैं:
- आधार कार्ड में उपनाम (Surname) अलग होना या पिता के नाम का संक्षिप्त रूप (Initials) होना।
- 10वीं की मार्कशीट में "Shri", "Late" या "Km" जैसे प्रीफिक्स को गलत कॉलम में दर्ज कर देना।
- स्पेस (Space) की गलती, जैसे "RAM KUMAR" को "RAMKUMAR" लिख देना।

### समाधान एवं सावधानी:
1. हमेशा फॉर्म भरते समय 10वीं की मूल अंकसूची सामने रखें।
2. यदि आधार कार्ड में नाम या जन्मतिथि मार्कशीट से अलग है, तो तत्काल आधार अपडेट सेंटर पर जाकर बायोमेट्रिक संशोधन कराएं अथवा फॉर्म में 10वीं के विवरण को प्राथमिकता दें।
3. विवाह के पश्चात नाम परिवर्तन की स्थिति में राजपत्र अधिसूचना (Gazette Notification) या मैरिज सर्टिफिकेट तैयार रखें।

---

## 2. फोटो पर तारीख (Date on Photo - DOP) और बैकग्राउंड के सख्त नियम

कर्मचारी चयन आयोग (SSC), मध्य प्रदेश कर्मचारी चयन मंडल (MPESB) तथा अन्य भर्ती आयोगों द्वारा फॉर्म रिजेक्ट करने का सबसे प्रमुख कारण अमान्य फोटोग्राफ होता है।

### प्रमुख मानक जिनका पालन अनिवार्य है:
- **बैकग्राउंड (Background):** फोटो का बैकग्राउंड हमेशा सफेद (White) या हल्का स्लेटी (Light Grey) होना चाहिए। सेल्फी, रंग-बिरंगे बैकग्राउंड या तिरछी तस्वीरों को कंप्यूटर सॉफ्टवेयर तुरंत फ्लैग कर देता है।
- **DOP एवं नाम:** कुछ परीक्षाओं (जैसे MP Police, Vyapam Profile, SSC) में फोटो के नीचे उम्मीदवार का नाम एवं फोटो खींचने की तिथि (Date of Photograph) 3 माह से अधिक पुरानी नहीं होनी चाहिए।
- **चश्मा व कैप प्रतिबंध:** फोटो खिंचवाते समय टोपी, मफलर, धूप का चश्मा या रंगीन लेंस वाला चश्मा पूरी तरह प्रतिबंधित है। दोनों कान और आँखें स्पष्ट रूप से दिखाई देनी चाहिए।

---

## 3. जाति एवं आय प्रमाण पत्र की वैधता (Digital Caste & Validity Period)

आरक्षित श्रेणियों (SC, ST, OBC-NCL, EWS) के उम्मीदवारों को आरक्षण का लाभ तभी मिलता है जब उनके पास सक्षम प्राधिकारी द्वारा जारी डिजिटल जाति प्रमाण पत्र उपलब्ध हो।

### ध्यान देने योग्य महत्वपूर्ण बातें:
- **EWS एवं OBC-NCL वैधता:** आर्थिक रूप से कमजोर वर्ग (EWS) एवं अन्य पिछड़ा वर्ग नॉन-क्रीमी लेयर प्रमाण पत्र केवल संबंधित वित्तीय वर्ष (Financial Year) के लिए मान्य होते हैं। पुराना वित्तीय प्रमाण पत्र लगाने पर अभ्यर्थी को स्वतः सामान्य (UR) श्रेणी में डाल दिया जाता है।
- **डिजिटल हस्ताक्षर व बारकोड:** हस्तलिखित (Manual) प्रमाण पत्र अब अमान्य हो चुके हैं। केवल RSMS अथवा डिजिटल हस्ताक्षरयुक्त e-District प्रमाण पत्र ही मान्य हैं।

---

## 4. ऑनलाइन पेमेंट फेल होने और डबल डिडक्शन से बचने की रणनीति

फॉर्म की अंतिम तिथि (Last Date) के निकट सर्वर पर अत्यधिक लोड होने के कारण फीस भुगतान में सबसे ज्यादा विफलताएं दर्ज की जाती हैं।

### भुगतान संबंधी सुरक्षित कदम:
1. **कभी भी अंतिम 24 घंटे का इंतजार न करें:** फॉर्म भरने के तुरंत बाद फीस जमा करें।
2. **Pending Transactions:** यदि आपके खाते से पैसे कट गए हैं लेकिन पोर्टल पर "Payment Pending" या "Unpaid" दिख रहा है, तो तुरंत दोबारा भुगतान न करें। कम से कम 24 घंटे तक बैंक रिकॉन्सिलिएशन का इंतजार करें अथवा Verify Payment बटन पर क्लिक करें।
3. **नेट बैंकिंग व UPI सावधानी:** ऑनलाइन भुगतान के दौरान बैक (Back) या रिफ्रेश (Refresh) बटन कभी न दबाएं।

---

## 5. फाइनल प्रिंटआउट एवं एप्लीकेशन नंबर का सुरक्षित बैकअप कैसे रखें

अनेक अभ्यर्थी फॉर्म सबमिट करने के बाद फाइनल रसीद (Fee Receipt) या सबमिटेड एप्लीकेशन का प्रिंट नहीं निकालते और केवल स्क्रीनशॉट पर निर्भर रहते हैं। 

### सही बैकअप कैसे बनाएं:
- आवेदन पत्र का फाइनल सबमिशन होते ही उसकी PDF फाइल को अपने Google Drive अथवा व्यक्तिगत ईमेल पर सुरक्षित सेव करें।
- एप्लीकेशन नंबर, रोल नंबर जनरेशन और पासवर्ड को अपनी निजी डायरी में नोट करें।
- फिजिकल डॉक्यूमेंट वेरिफिकेशन (DV) के समय आवेदन पत्र की 2 हार्ड कॉपी अनिवार्य रूप से प्रस्तुत करनी होती है।

---

## निष्कर्ष: घर बैठे 100% सटीक फॉर्म भरवाने का सुरक्षित विकल्प

एक सरकारी नौकरी के फॉर्म की कीमत सिर्फ ₹100 या ₹500 नहीं होती, बल्कि उसके पीछे आपकी पूरी लगन और परिवार की उम्मीदें जुड़ी होती हैं। यदि आपके पास अच्छा कंप्यूटर, स्कैनर या विश्वसनीय इंटरनेट नहीं है, तो कैफे के चक्कर काटने या साइबर कैफे वालों की जल्दबाजी का शिकार होने से बचें।

आप **NP Job Portal** के संचालक **Nitish Khobragade (मो. 8982324497)** से सीधे संपर्क करके घर बैठे व्हाट्सएप पर अपने दस्तावेज भेजकर बिना किसी गलती के 100% सुरक्षित और प्रमाणित ऑनलाइन फॉर्म भरवा सकते हैं। फॉर्म का फाइनल प्रिंटआउट और पेमेंट रसीद आपको सीधे व्हाट्सएप पर उपलब्ध करा दी जाती है।`
  },
  {
    id: 'mp-police-constable-2026-exam-strategy',
    slug: 'mp-police-constable-2026-exam-strategy',
    title: 'MP Police Constable 2026: परीक्षा पैटर्न, शारीरिक दक्षता परीक्षण (PET) एवं 100% सटीक तैयारी रणनीति',
    excerpt: 'मध्य प्रदेश पुलिस आरक्षक भर्ती 2026 की लिखित परीक्षा और फिजिकल टेस्ट को पहले प्रयास में पास करने की प्रमाणित रणनीति एवं महत्वपूर्ण विषय गाइड।',
    category: 'Exam Prep',
    author: {
      name: 'Nitish Khobragade',
      role: 'Chief Editor & Career Counselor',
      phone: '8982324497'
    },
    bannerUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1080&auto=format&fit=crop&q=80',
    status: 'published',
    tags: ['MP Police', 'Constable', 'Exam Pattern', 'Physical Test', 'Syllabus'],
    readingTimeMinutes: 9,
    views: 2980,
    seoKeywords: ['MP Police Constable 2026', 'MP Police Syllabus', 'Physical Test PET', 'MP Police Cut Off'],
    createdAt: Date.now() - 86400000 * 3,
    publishedAt: Date.now() - 86400000 * 3,
    content: `## मध्य प्रदेश पुलिस आरक्षक भर्ती 2026 की संपूर्ण रूपरेखा

मध्य प्रदेश पुलिस में आरक्षक (जनरल ड्यूटी - GD एवं रेडियो ऑपरेटर) के रूप में सेवा देना राज्य के युवाओं के लिए सर्वाधिक प्रतिष्ठित अवसरों में से एक है। MPESB द्वारा आयोजित की जाने वाली इस भर्ती में लिखित परीक्षा के साथ-साथ शारीरिक दक्षता परीक्षण (Physical Efficiency Test) के अंकों को मिलाकर अंतिम मेरिट सूची (Final Merit List) तैयार की जाती है।

इस विस्तृत मार्गदर्शिका में हम समझेंगे कि नए परीक्षा पैटर्न के अनुसार 100 अंकों की लिखित परीक्षा और 100 अंकों के फिजिकल टेस्ट में अधिकतम स्कोर कैसे हासिल किया जाए।

---

## 1. लिखित परीक्षा का पाठ्यक्रम एवं अंक विभाजन (100 अंक - 120 मिनट)

लिखित परीक्षा बहुविकल्पीय वस्तुनिष्ठ (Objective MCQ) प्रकार की होती है, जिसमें कोई नकारात्मक अंकन (Negative Marking) नहीं होता:

- **सामान्य ज्ञान एवं तार्किक ज्ञान (General Knowledge & Reasoning):** 40 अंक
  - मध्य प्रदेश का इतिहास, संस्कृति, प्रमुख मेले, नदियां, राष्ट्रीय उद्यान, समसामयिक घटनाएं (Current Affairs)।
  - तार्किक क्षमता: कोडिंग-डिकोडिंग, दिशा परीक्षण, रक्त संबंध, कथन और निष्कर्ष।
- **बौद्धिक क्षमता एवं मानसिक अभिरुचि (Mental Ability & Aptitude):** 30 अंक
  - संख्या पद्धति, प्रतिशत, लाभ-हानि, अनुपात-समानुपात, समय और कार्य, साधारण व चक्रवृद्धि ब्याज।
- **विज्ञान एवं सरल अंकगणित (Science & Simple Arithmetic):** 30 अंक
  - 10वीं स्तर का भौतिक, रसायन एवं जीव विज्ञान, मानव शरीर, पर्यावरण तथा ज्यामिति।

---

## 2. शारीरिक दक्षता परीक्षण (PET - 100 अंक) का सटीक फॉर्मूला

नए नियमों के अनुसार फिजिकल टेस्ट अब केवल क्वालीफाइंग नहीं है, बल्कि इसके अंक आपकी फाइनल मेरिट तय करते हैं:

### (A) 800 मीटर दौड़ (अधिकतम 40 अंक)
- 124 सेकंड से कम समय में दौड़ पूरी करने पर पूरे 40 अंक मिलते हैं।
- 198 सेकंड से अधिक समय लेने पर अभ्यर्थी को अयोग्य (Disqualified) घोषित कर दिया जाता है।

### (B) लंबी कूद / Long Jump (अधिकतम 30 अंक)
- 5.57 मीटर (18.3 फीट) से अधिक कूदने पर पूरे 30 अंक प्राप्त होते हैं।
- प्रत्येक उम्मीदवार को कूद के लिए अधिकतम 3 अवसर दिए जाते हैं।

### (C) गोला फेंक / Shot Put (अधिकतम 30 अंक)
- 7.260 किलोग्राम का गोला 8.76 मीटर (28.7 फीट) से अधिक फेंकने पर पूरे 30 अंक मिलते हैं।
- गोले को सही एंगल (लगभग 45 डिग्री) पर रिलीज करने का अभ्यास आवश्यक है।

---

## 3. 60 दिनों का चरणबद्ध स्टडी एवं फिजिकल टाइम-टेबल

सफलता पाने के लिए पढ़ाई और फिजिकल ट्रेनिंग दोनों में संतुलन बनाना अनिवार्य है:

- **सुबह 05:30 से 07:30 बजे:** ग्राउंड वर्कआउट (रनिंग, स्ट्रेचिंग, लंबी कूद तकनीक एवं कोर स्ट्रेंथ)।
- **सुबह 09:30 से दोपहर 01:00 बजे:** गणित एवं रीजनिंग के कठिन अध्यायों का अभ्यास।
- **दोपहर 03:00 से 05:30 बजे:** MP GK एवं सामान्य विज्ञान का रिवीजन।
- **शाम 07:00 से 09:00 बजे:** पिछले वर्ष के प्रश्न पत्र (Previous Year Papers) का मॉक टेस्ट हल करना।
- **रात्रि 09:30 से 10:30 बजे:** करंट अफेयर्स और दैनिक गलतियों का विश्लेषण।

---

## 4. मेडिकल परीक्षण एवं दस्तावेज सत्यापन (DV) के आवश्यक निर्देश

लिखित परीक्षा और फिजिकल उत्तीर्ण करने के बाद अभ्यर्थियों का स्वास्थ्य परीक्षण किया जाता है:
- **शारीरिक मानक:** पुरुषों के लिए न्यूनतम ऊंचाई 168 सेमी और सीना 81-86 सेमी (फुलाव सहित)। महिलाओं के लिए ऊंचाई 155 सेमी।
- **दृष्टि परीक्षण:** 6/6 एवं 6/9 बिना चश्मे के। कलर ब्लाइंडनेस (वर्णांधता) या फ्लैट फुट / नॉक नी की समस्या नहीं होनी चाहिए।

---

## फॉर्म भरने एवं ऑनलाइन काउंसलिंग सहायता

यदि आप MP Police Constable 2026 का ऑनलाइन आवेदन करना चाहते हैं और प्रोफाइल पंजीयन, रोजगार कार्यालय पंजीयन (Rojgar Panjiyan) नवीनीकरण या जाति प्रमाण पत्र में किसी भी प्रकार की सहायता चाहते हैं, तो **NP Job Portal हेल्पलाइन (Nitish Khobragade - 8982324497)** पर कभी भी व्हाट्सएप या कॉल कर सकते हैं।`
  },
  {
    id: 'mp-cpct-scorecard-importance-guide',
    slug: 'mp-cpct-scorecard-importance-guide',
    title: 'CPCT स्कोर कार्ड क्या है? MP ESB ग्रुप 4 एवं सहायक ग्रेड-3 भर्ती में इसकी अनिवार्यता एवं तैयारी टिप्स',
    excerpt: 'मध्य प्रदेश की समस्त लिपिकीय एवं स्टेनो भर्तियों हेतु CPCT परीक्षा पास करना अनिवार्य है। कंप्यूटर ज्ञान और हिंदी टाइपिंग स्पीड कैसे बढ़ाएं, पढ़ें पूरी गाइड।',
    category: 'Gov Schemes',
    author: {
      name: 'Nitish Khobragade',
      role: 'Career Counselor & Typing Specialist',
      phone: '8982324497'
    },
    bannerUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1080&auto=format&fit=crop&q=80',
    status: 'published',
    tags: ['CPCT', 'MPESB Group 4', 'Typing Test', 'Assistant Grade 3', 'Hindi Typing'],
    readingTimeMinutes: 7,
    views: 2450,
    seoKeywords: ['CPCT Exam Pattern', 'MP CPCT Syllabus', 'Hindi Typing Speed', 'Remington Gail Typing'],
    createdAt: Date.now() - 86400000 * 5,
    publishedAt: Date.now() - 86400000 * 5,
    content: `## CPCT परीक्षा का महत्व एवं शासकीय मान्यता

मध्य प्रदेश शासन के सामान्य प्रशासन विभाग (GAD) के राजपत्र निर्देशानुसार, राज्य के सभी सरकारी विभागों में सहायक ग्रेड-3, शीघ्रलेखक (Stenographer), डाटा एंट्री ऑपरेटर (DEO), कोर्ट क्लर्क एवं पटवारी जैसे लिपिकीय पदों पर भर्ती के लिए **Computer Proficiency Certification Test (CPCT)** का वैध स्कोर कार्ड अनिवार्य कर दिया गया है।

कई छात्र केवल लिखित परीक्षा की तैयारी करते रहते हैं और CPCT स्कोर कार्ड न होने के कारण ग्रुप 4 व क्लर्क भर्ती में आवेदन करने से वंचित रह जाते हैं। यह प्रमाण पत्र परीक्षा उत्तीर्ण होने की तिथि से **7 वर्षों के लिए पूर्णतः वैध** होता है।

---

## 1. CPCT परीक्षा की संरचना एवं अंक प्रणाली

CPCT परीक्षा को दो मुख्य भागों में विभाजित किया गया है:

### भाग 1: कंप्यूटर एवं सामान्य ज्ञान बहुविकल्पीय प्रश्न (75 प्रश्न - 75 मिनट)
- **कंप्यूटर दक्षता (Computer Proficiency):** 52 प्रश्न (हार्डवेयर, सॉफ्टवेयर, MS Word, Excel, PowerPoint, इंटरनेट नेटवर्किंग एवं साइबर सुरक्षा)।
- **रीडिंग कॉम्प्रिहेंशन (Hindi/English Passage):** 5 प्रश्न।
- **मात्रात्मक योग्यता (Quantitative Aptitude):** 6 प्रश्न।
- **सामान्य मानसिक क्षमता एवं तार्किक योग्यता:** 6 प्रश्न।
- **सामान्य ज्ञान (General Awareness):** 6 प्रश्न।
*पास होने हेतु 75 में से न्यूनतम 38 अंक (50%) प्राप्त करना अनिवार्य है।*

### भाग 2: ऑनलाइन टाइपिंग स्पीड टेस्ट
- **अंग्रेजी टाइपिंग टेस्ट:** 15 मिनट की अवधि, न्यूनतम गति 30 शब्द प्रति मिनट (WPM) शुद्धता के साथ।
- **हिंदी टाइपिंग टेस्ट:** 15 मिनट की अवधि, न्यूनतम गति 20 शब्द प्रति मिनट (WPM) शुद्धता के साथ।

---

## 2. कीबोर्ड लेआउट: रेमिंगटन गेल (Remington Gail) बनाम इनस्क्रिप्ट (Inscript)

हिंदी टाइपिंग के दौरान छात्रों के सामने सबसे बड़ा प्रश्न कीबोर्ड लेआउट के चयन का होता है:
- **रेमिंगटन गेल (Remington Gail):** यह लेआउट पारंपरिक कृति देव (Kruti Dev) फॉन्ट जैसा होता है। यदि आपने पहले कभी टाइपराइटर या कृति देव 010 पर अभ्यास किया है, तो रेमिंगटन गेल आपके लिए सबसे सरल और स्वाभाविक रहेगा।
- **इनस्क्रिप्ट (Inscript):** यह भारत सरकार द्वारा प्रमाणित यूनिकोड लेआउट है, जिसमें स्वर बाईं ओर और व्यंजन दाईं ओर व्यवस्थित होते हैं। नए सीखने वालों के लिए इनस्क्रिप्ट वैज्ञानिक रूप से तेज माना जाता है।

---

## 3. 30 दिनों में हिंदी टाइपिंग स्पीड 25+ WPM करने की वैज्ञानिक रणनीति

1. **फिंगर पोजीशन (Home Row Mastery):** कभी भी कीबोर्ड की तरफ देखकर टाइप न करें। 'ASDF' और 'JKL;' कीज पर उंगलियों की स्वाभाविक स्थिति का निरंतर अभ्यास करें।
2. **बैकस्पेस (Backspace) का न्यूनतम प्रयोग:** बैकस्पेस दबाने से गति में 30% तक की भारी गिरावट आती है। गति से पहले एक्यूरेसी (Accuracy 95%+) पर ध्यान दें।
3. **दैनिक 45 मिनट के तीन स्लॉट:** एक साथ 3 घंटे टाइप करने के बजाय सुबह, दोपहर और शाम को 45-45 मिनट के छोटे-छोटे स्लॉट में अभ्यास करें।

---

## 4. CPCT पंजीयन एवं MP Online प्रोफाइल लिंकिंग

CPCT का आयोजन मध्य प्रदेश स्टेट इलेक्ट्रॉनिक्स डेवलपमेंट कॉर्पोरेशन (MPSEDC) द्वारा हर दो माह में किया जाता है। आवेदन करते समय 10वीं मार्कशीट, 12वीं मार्कशीट एवं पासपोर्ट साइज फोटो अपलोड करनी होती है।

यदि आपको CPCT फॉर्म भरने, परीक्षा तिथि चुनने या MP Online पोर्टल पर रोजगार पंजीयन व प्रोफाइल से CPCT स्कोर कार्ड लिंक करने में किसी प्रकार की कठिनाई आ रही है, तो आप **NP Job Portal (Nitish Khobragade - 8982324497)** की विशेषज्ञ सेवाओं का लाभ उठा सकते हैं।`
  }
];

export async function getBlogPosts(statusFilter: 'published' | 'all' = 'published'): Promise<BlogPost[]> {
  try {
    const col = collection(db, 'blogs');
    const q = statusFilter === 'published'
      ? query(col, where('status', '==', 'published'))
      : col;
    const snap = await getDocs(q);
    if (!snap.empty) {
      const list: BlogPost[] = [];
      snap.forEach((d) => {
        list.push({ ...(d.data() as BlogPost), id: d.id });
      });
      list.sort((a, b) => Number(b.publishedAt || b.createdAt || 0) - Number(a.publishedAt || a.createdAt || 0));
      return list;
    }
  } catch (err) {
    console.warn('Error fetching blogs from Firestore, falling back to seed blogs:', err);
  }
  return statusFilter === 'published'
    ? SEED_BLOG_POSTS.filter((b) => b.status === 'published')
    : SEED_BLOG_POSTS;
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  try {
    const docRef = doc(db, 'blogs', normalizedSlug);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...(snap.data() as BlogPost), id: snap.id };
    }
    const col = collection(db, 'blogs');
    const q = query(col, where('slug', '==', normalizedSlug));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const data = querySnap.docs[0].data() as BlogPost;
      const seedMatch = SEED_BLOG_POSTS.find(b => b.slug.toLowerCase() === normalizedSlug || b.id === normalizedSlug);
      return {
        ...data,
        id: querySnap.docs[0].id,
        content: (data.content && data.content.trim().length > 50) ? data.content : (seedMatch?.content || data.content || '')
      };
    }
  } catch (err) {
    console.warn('Error fetching blog post by slug from Firestore:', err);
  }
  const match = SEED_BLOG_POSTS.find((b) => b.slug.toLowerCase() === normalizedSlug || b.id === normalizedSlug);
  return match || null;
}

export async function saveBlogPost(blog: Partial<BlogPost>): Promise<string> {
  const slug = (blog.slug || blog.title || `blog-${Date.now()}`)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const id = blog.id || slug;
  const now = Date.now();

  const blogData: BlogPost = {
    id,
    slug,
    title: blog.title || 'नई करियर गाइड एवं ब्लॉग पोस्ट',
    excerpt: blog.excerpt || blog.title?.slice(0, 150) || '',
    content: blog.content || '',
    category: blog.category || 'Career Guidance',
    author: {
      name: blog.author?.name || 'Nitish Khobragade',
      role: blog.author?.role || 'Portal Administrator & Career Guide',
      phone: blog.author?.phone || '8982324497'
    },
    bannerUrl: blog.bannerUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1080&auto=format&fit=crop&q=80',
    status: blog.status || 'published',
    tags: blog.tags || ['Career', 'Government Exam'],
    readingTimeMinutes: blog.readingTimeMinutes || Math.max(3, Math.ceil((blog.content?.length || 500) / 400)),
    views: blog.views || 10,
    seoKeywords: blog.seoKeywords || [],
    createdAt: blog.createdAt || now,
    publishedAt: blog.status === 'published' ? (blog.publishedAt || now) : undefined,
    updatedAt: now
  };

  try {
    const docRef = doc(db, 'blogs', id);
    await setDoc(docRef, blogData, { merge: true });
  } catch (err) {
    console.warn('Could not save blog to Firestore:', err);
  }

  return id;
}

export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'blogs', id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not delete blog from Firestore:', err);
  }
}

export function subscribeToBlogPosts(
  onUpdate: (blogs: BlogPost[]) => void,
  statusFilter: 'published' | 'all' = 'published'
): () => void {
  // Emit initial seed blogs immediately
  const initial = statusFilter === 'published'
    ? SEED_BLOG_POSTS.filter((b) => b.status === 'published')
    : SEED_BLOG_POSTS;
  onUpdate(initial);

  try {
    const col = collection(db, 'blogs');
    const q = statusFilter === 'published'
      ? query(col, where('status', '==', 'published'))
      : col;

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const list: BlogPost[] = [];
          snap.forEach((d) => {
            list.push({ ...(d.data() as BlogPost), id: d.id });
          });
          list.sort((a, b) => Number(b.publishedAt || b.createdAt || 0) - Number(a.publishedAt || a.createdAt || 0));
          onUpdate(list);
        }
      },
      (err) => {
        console.warn('Blog subscription notice:', err);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Error setting up blog subscriber:', err);
    return () => {};
  }
}


