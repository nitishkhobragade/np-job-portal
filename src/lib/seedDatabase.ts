import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { PostRecord } from '../types';

export interface SeedPostData {
  blogNo: string;
  year: string;
  month: string;
  slug: string;
  title: string;
  shortTitle?: string;
  dept: string;
  category: 'mp-special' | 'results' | 'admit-card' | 'latest-jobs' | 'tech-jobs' | 'central';
  categories: string[];
  status: 'published' | 'draft' | 'suspended';
  publishedAt: string; // dd/mm/yyyy
  totalPosts: string;
  qualification: string;
  lastDate: string;
  detailsUrl: string;
  content: string;
  state: 'MP' | 'Central' | 'All India';
  dates: {
    start: string;
    end: string;
    exam: string;
  };
  fee: {
    gen: string;
    reserved: string;
  };
  links: {
    apply: string;
    notificationPdf: string;
    syllabusPdf?: string;
    officialSite: string;
  };
  posterConfig: {
    headline: string;
    keyPoints: string[];
    note: string;
  };
  minAge?: string;
  maxAge?: string;
  requiredDocuments?: string[];
  howToApplySteps?: string[];
  isTechJob?: boolean;
  companyName?: string;
  role?: string;
  experience?: string;
  location?: string;
  batchEligibility?: string;
}

export const INITIAL_SEED_POSTS: SeedPostData[] = [
  {
    blogNo: '01',
    year: '2026',
    month: '09',
    slug: 'mp-police-constable-recruitment-2026',
    title: 'MP Police Constable (GD & Radio Operator) Recruitment 2026',
    shortTitle: 'MP Police Constable 2026',
    dept: 'MP Police / MPESB',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special', 'police'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '7,500',
    qualification: '10th / 12th Pass',
    lastDate: '15/10/2026',
    detailsUrl: '/2026/09/01/mp-police-constable-recruitment-2026',
    content:
      'Madhya Pradesh Employees Selection Board (MPESB Bhopal) invites online applications for 7,500 Constable GD and Radio Operator positions. Complete syllabus, physical parameters, and safe home-based online form filling available.',
    state: 'MP',
    dates: {
      start: '15/09/2026',
      end: '15/10/2026',
      exam: '15/12/2026'
    },
    fee: {
      gen: '₹500/-',
      reserved: '₹250/-'
    },
    links: {
      apply: 'https://esb.mponline.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/Rulebooks/RB_2026/Police_Constable_2026_Rulebook.pdf',
      syllabusPdf: 'https://esb.mp.gov.in/Syllabus/Police_2026_Syllabus.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ मध्य प्रदेश पुलिस आरक्षक (GD / रेडियो) 7,500 पद भर्ती ★',
      keyPoints: [
        'कुल पद: 7,500 (GD: 7090 | रेडियो: 410)',
        'योग्यता: 10वीं/12वीं पास (रेडियो हेतु ITI)',
        'अंतिम तिथि: 15/10/2026',
        'घर बैठे सुरक्षित फॉर्म भरवाएं: 8982324497'
      ],
      note: 'घर बैठे 100% त्रुटिरहित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    },
    minAge: '18 वर्ष',
    maxAge: '36 वर्ष (आरक्षित वर्गों को 3-5 वर्ष की छूट)',
    requiredDocuments: [
      'आधार कार्ड (मोबाइल नंबर लिंक)',
      '10वीं एवं 12वीं की अंकसूची',
      'मध्य प्रदेश का मूल निवासी प्रमाण पत्र',
      'जाति प्रमाण पत्र (SC/ST/OBC/EWS)',
      'जीवित रोजगार पंजीयन क्रमांक',
      'नवीनतम पासपोर्ट फोटो एवं हस्ताक्षर'
    ],
    howToApplySteps: [
      'ऑफिशियल नोटिफिकेशन डाउनलोड कर पात्रता जांचें।',
      'अपने सभी दस्तावेज व्हाट्सएप (8982324497) पर भेजें।',
      'फॉर्म का पूर्वावलोकन (Preview) चेक कर शुल्क भुगतान करें।',
      'कम्प्यूटर जनरेटेड अधिकृत रसीद प्राप्त करें।'
    ]
  },
  {
    blogNo: '02',
    year: '2026',
    month: '09',
    slug: 'mp-ayush-ug-counselling',
    title: 'MP AYUSH UG (BAMS / BHMS / BUMS) Online Counselling 2026',
    shortTitle: 'MP AYUSH UG Counselling 2026',
    dept: 'Directorate of AYUSH, Madhya Pradesh',
    category: 'mp-special',
    categories: ['counselling', 'mp_special', 'health'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: 'State Quota Seats',
    qualification: 'NEET UG Qualified',
    lastDate: '05/10/2026',
    detailsUrl: '/2026/09/02/mp-ayush-ug-counselling',
    content:
      'Directorate of AYUSH Madhya Pradesh online counselling for admission into BAMS, BHMS, and BUMS government and private colleges. Complete choice filling and registration assistance.',
    state: 'MP',
    dates: {
      start: '18/09/2026',
      end: '05/10/2026',
      exam: 'NEET UG 2026 आधारित'
    },
    fee: {
      gen: '₹2,000/-',
      reserved: '₹2,000/-'
    },
    links: {
      apply: 'https://ayush.mponline.gov.in',
      notificationPdf: 'https://ayush.mponline.gov.in/Portal/Services/AYUSH/Counselling_Schedule_2026.pdf',
      officialSite: 'https://ayush.mponline.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी आयुष यूजी (BAMS/BHMS) ऑनलाइन काउंसलिंग 2026 ★',
      keyPoints: [
        'सत्र: 2026-27 स्टेट कोटा सीटें',
        'योग्यता: NEET UG 2026 स्कोरकार्ड धारक',
        'अंतिम तिथि: 05/10/2026',
        'चॉइस फिलिंग व रजिस्ट्रेशन: 8982324497'
      ],
      note: 'घर बैठे त्रुटिरहित काउंसलिंग रजिस्ट्रेशन हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    },
    minAge: '17 वर्ष',
    maxAge: 'कोई ऊपरी आयु सीमा नहीं'
  },
  {
    blogNo: '03',
    year: '2026',
    month: '09',
    slug: 'ssc-chsl-2026',
    title: 'SSC Combined Higher Secondary (10+2) Level CHSL 2026',
    shortTitle: 'SSC CHSL 10+2 Bharti',
    dept: 'Staff Selection Commission (SSC Central)',
    category: 'central',
    categories: ['vacancy', 'central', 'ssc'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '4,500',
    qualification: '10+2 Intermediate Pass',
    lastDate: '20/10/2026',
    detailsUrl: '/2026/09/03/ssc-chsl-2026',
    content:
      'Staff Selection Commission conducts Combined Higher Secondary Level examination for Lower Division Clerk (LDC), Junior Secretariat Assistant (JSA), and Data Entry Operator (DEO).',
    state: 'Central',
    dates: {
      start: '10/09/2026',
      end: '20/10/2026',
      exam: 'दिसंबर 2026'
    },
    fee: {
      gen: '₹100/-',
      reserved: '₹0/- (निशुल्क)'
    },
    links: {
      apply: 'https://ssc.gov.in',
      notificationPdf: 'https://ssc.gov.in/notice_chsl_2026.pdf',
      officialSite: 'https://ssc.gov.in'
    },
    posterConfig: {
      headline: '★ SSC CHSL (10+2) 4,500 पद केंद्रीय भर्ती 2026 ★',
      keyPoints: [
        'पद: LDC / JSA / डाटा एंट्री ऑपरेटर',
        'योग्यता: 12वीं उत्तीर्ण (किसी भी विषय से)',
        'अंतिम तिथि: 20/10/2026',
        'फॉर्म भरवाएं: 8982324497'
      ],
      note: 'घर बैठे फॉर्म भरने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    },
    minAge: '18 वर्ष',
    maxAge: '27 वर्ष'
  },
  {
    blogNo: '04',
    year: '2026',
    month: '09',
    slug: 'railway-rrc-group-d',
    title: 'Railway RRC Group D Level-1 Centralized Recruitment 2026',
    shortTitle: 'Railway Group D 2026',
    dept: 'Railway Recruitment Cell (RRC / Indian Railways)',
    category: 'latest-jobs',
    categories: ['vacancy', 'central', 'railway'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '1,03,769',
    qualification: '10th Pass or ITI from NCVT/SCVT',
    lastDate: '28/10/2026',
    detailsUrl: '/2026/09/04/railway-rrc-group-d',
    content:
      'Indian Railways Centralized Employment Notification for Track Maintainer Grade IV, Helper/Assistant across electrical, mechanical, and S&T departments.',
    state: 'Central',
    dates: {
      start: '12/09/2026',
      end: '28/10/2026',
      exam: 'जनवरी 2027'
    },
    fee: {
      gen: '₹500/-',
      reserved: '₹250/-'
    },
    links: {
      apply: 'https://www.rrcb.gov.in',
      notificationPdf: 'https://www.rrcb.gov.in/notice_group_d_2026.pdf',
      officialSite: 'https://www.rrcb.gov.in'
    },
    posterConfig: {
      headline: '★ रेलवे RRC ग्रुप-D 1 लाख+ पदों पर महाभर्ती 2026 ★',
      keyPoints: [
        'कुल पद: 1,03,769 पद',
        'योग्यता: 10वीं पास या ITI',
        'अंतिम तिथि: 28/10/2026',
        'घर बैठे सुरक्षित आवेदन: 8982324497'
      ],
      note: 'संपर्क करें: Nitish Khobragade (8982324497)'
    },
    minAge: '18 वर्ष',
    maxAge: '33 वर्ष'
  },
  {
    blogNo: '05',
    year: '2026',
    month: '09',
    slug: 'mp-iti-training-officer-to',
    title: 'MP ITI Training Officer (कौशल विकास) Recruitment 2026',
    shortTitle: 'MP ITI TO Bharti 2026',
    dept: 'MP Technical Education & Skill Development Dept',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special', 'teaching'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '450',
    qualification: 'ITI / Polytechnic / BE / B.Tech',
    lastDate: '12/10/2026',
    detailsUrl: '/2026/09/05/mp-iti-training-officer-to',
    content:
      'Madhya Pradesh Directorate of Skill Development recruitment for ITI Training Officers across COPA, Electrician, Fitter, Diesel Mechanic, and Welder trades.',
    state: 'MP',
    dates: {
      start: '10/09/2026',
      end: '12/10/2026',
      exam: 'नवंबर 2026'
    },
    fee: {
      gen: '₹500/-',
      reserved: '₹250/-'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/Rulebooks/RB_2026/ITI_TO_2026.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी ITI ट्रेनिंग ऑफिसर भर्ती 2026 ★',
      keyPoints: [
        'कुल पद: 450 पद',
        'योग्यता: ITI / डिप्लोमा / डिग्री',
        'अंतिम तिथि: 12/10/2026',
        'घर बैठे फॉर्म भरवाएं: 8982324497'
      ],
      note: 'संपर्क करें: Nitish Khobragade (8982324497)'
    },
    minAge: '18 वर्ष',
    maxAge: '40 वर्ष'
  },
  {
    blogNo: '06',
    year: '2026',
    month: '09',
    slug: 'tcs-nqt-freshers-hiring-2026',
    title: 'TCS Off-Campus NQT Freshers Hiring 2026 (Ninja & Digital)',
    shortTitle: 'TCS NQT IT Hiring 2026',
    dept: 'Tata Consultancy Services (TCS Corporate)',
    category: 'tech-jobs',
    categories: ['tech_job', 'corporate', 'freshers'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: 'Pan-India',
    qualification: 'BE / B.Tech / MCA / M.Sc (2025/2026)',
    lastDate: '30/10/2026',
    detailsUrl: '/2026/09/06/tcs-nqt-freshers-hiring-2026',
    content:
      'Tata Consultancy Services National Qualifier Test for software engineers, cloud trainees, and system analysts. Online test & interview schedule.',
    state: 'All India',
    isTechJob: true,
    companyName: 'Tata Consultancy Services',
    role: 'Ninja Developer / Digital Specialist',
    experience: 'Freshers (2025/2026 Batch)',
    location: 'Pan India (Indore/Pune/Bangalore/Bhopal)',
    batchEligibility: '2025 & 2026 Passing Out',
    dates: {
      start: '01/09/2026',
      end: '30/10/2026',
      exam: '05/11/2026'
    },
    fee: {
      gen: 'निःशुल्क (Free)',
      reserved: 'निःशुल्क (Free)'
    },
    links: {
      apply: 'https://nextstep.tcs.com',
      notificationPdf: 'https://nextstep.tcs.com/campus/#/nqt_guidelines_2026',
      officialSite: 'https://www.tcs.com'
    },
    posterConfig: {
      headline: '★ TCS ऑफ-कैंपस फ्रेशर्स हायरिंग 2026 ★',
      keyPoints: [
        'पद: सॉफ्टवेयर इंजीनियर / डेवलपर',
        'पैकेज: ₹3.6 LPA से ₹9.0 LPA',
        'बैच: 2025 एवं 2026 पासआउट',
        'आवेदन सहायता: 8982324497'
      ],
      note: 'घर बैठे रिज्यूमे व प्रोफाइल रजिस्ट्रेशन हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    }
  },
  {
    blogNo: '07',
    year: '2026',
    month: '09',
    slug: 'mp-police-constable-admit-card-2026',
    title: 'MP Police Constable 2026 Written Exam Admit Card (प्रवेश पत्र)',
    shortTitle: 'MP Police Admit Card',
    dept: 'MPESB Bhopal',
    category: 'admit-card',
    categories: ['admit_card', 'mp_special', 'police'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '7,500 Posts Exam',
    qualification: 'Registered Candidates',
    lastDate: 'Exam: 15 Dec 2026',
    detailsUrl: '/2026/09/07/mp-police-constable-admit-card-2026',
    content:
      'Download MP Police Constable 2026 Hall Ticket using Application Number and Date of Birth. High quality colored printout service available via WhatsApp 8982324497.',
    state: 'MP',
    dates: {
      start: '01/12/2026',
      end: '15/12/2026',
      exam: '15/12/2026 Onwards'
    },
    fee: {
      gen: 'डाउनलोड निशुल्क',
      reserved: 'डाउनलोड निशुल्क'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/tacs/tac_police_2026.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी पुलिस कांस्टेबल एडमिट कार्ड 2026 जारी ★',
      keyPoints: [
        'परीक्षा तिथि: 15 दिसंबर 2026 से प्रारंभ',
        'आवश्यक: एप्लीकेशन नंबर एवं जन्मतिथि',
        'कलर प्रिंट आउट प्राप्त करें: 8982324497'
      ],
      note: 'एडमिट कार्ड प्रिंट आउट निकालने हेतु संपर्क करें: Nitish Khobragade (8982324497)'
    }
  },
  {
    blogNo: '08',
    year: '2026',
    month: '09',
    slug: 'mp-patwari-final-results-2026',
    title: 'MP Patwari & Group-2 Sub Group-4 Final Selection Result & Cutoff',
    shortTitle: 'MP Patwari Final Results',
    dept: 'Revenue Department MP & MPESB',
    category: 'results',
    categories: ['results', 'mp_special'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '9,073 Posts Selected',
    qualification: 'Appeared Candidates',
    lastDate: 'Scorecard Live',
    detailsUrl: '/2026/09/08/mp-patwari-final-results-2026',
    content:
      'Check MP Patwari district-wise cutoff marks, document verification schedule, and final merit list scorecard.',
    state: 'MP',
    dates: {
      start: '20/09/2026',
      end: '20/11/2026',
      exam: 'परिणाम घोषित'
    },
    fee: {
      gen: 'निशुल्क',
      reserved: 'निशुल्क'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/results/Result_Patwari_2026.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी पटवारी भर्ती 2026 फाइनल रिजल्ट एवं कटऑफ घोषित ★',
      keyPoints: [
        'जिलावार कटऑफ व चयन सूची जारी',
        'दस्तावेज सत्यापन शीघ्र',
        'स्कोरकार्ड चेक करवाएं: 8982324497'
      ],
      note: 'संपर्क करें: Nitish Khobragade (8982324497)'
    }
  },
  {
    blogNo: '09',
    year: '2026',
    month: '09',
    slug: 'ssc-cgl-tier-1-admit-card-2026',
    title: 'SSC CGL (Combined Graduate Level) Tier-1 Exam Admit Card',
    shortTitle: 'SSC CGL Admit Card 2026',
    dept: 'Staff Selection Commission (SSC Central)',
    category: 'admit-card',
    categories: ['admit_card', 'central', 'ssc'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: '17,727 Posts Exam',
    qualification: 'Registered Candidates',
    lastDate: 'Exam: 24 Oct 2026',
    detailsUrl: '/2026/09/09/ssc-cgl-tier-1-admit-card-2026',
    content:
      'Download SSC CGL Tier-1 Hall Ticket for MP Region and all central zones with exam city intimation slip.',
    state: 'Central',
    dates: {
      start: '10/10/2026',
      end: '24/10/2026',
      exam: '24/10/2026'
    },
    fee: {
      gen: 'निशुल्क',
      reserved: 'निशुल्क'
    },
    links: {
      apply: 'https://ssc.gov.in',
      notificationPdf: 'https://sscmpr.org/admitcard_cgl_2026',
      officialSite: 'https://ssc.gov.in'
    },
    posterConfig: {
      headline: '★ SSC CGL Tier-1 परीक्षा एडमिट कार्ड 2026 जारी ★',
      keyPoints: [
        'परीक्षा तिथि: 24 अक्टूबर 2026',
        'मध्य क्षेत्र (MPR) एवं सभी रीजन लाइव',
        'प्रिंट आउट सेवा: 8982324497'
      ],
      note: 'Nitish Khobragade (8982324497)'
    }
  },
  {
    blogNo: '10',
    year: '2026',
    month: '09',
    slug: 'mp-mptet-varg-2-results-2026',
    title: 'MP Teacher Eligibility Test (MPTET Varg-2) Scorecard & Qualified List',
    shortTitle: 'MPTET Varg-2 Results',
    dept: 'School Education Department MP',
    category: 'results',
    categories: ['results', 'mp_special', 'teaching'],
    status: 'published',
    publishedAt: '21/09/2026',
    totalPosts: 'TET Qualified List',
    qualification: 'Appeared Candidates',
    lastDate: 'Scorecard Active',
    detailsUrl: '/2026/09/10/mp-mptet-varg-2-results-2026',
    content:
      'MPTET Class 6 to 8 Middle School Teacher eligibility scorecard declared. Download certificate with marks breakdown.',
    state: 'MP',
    dates: {
      start: '15/09/2026',
      end: '15/12/2026',
      exam: 'परिणाम घोषित'
    },
    fee: {
      gen: 'निशुल्क',
      reserved: 'निशुल्क'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/results/MPTET_Varg2_2026.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी शिक्षक पात्रता परीक्षा (वर्ग-2) परिणाम घोषित ★',
      keyPoints: [
        'माध्यमिक शिक्षक पात्रता स्कोरकार्ड लाइव',
        'आजीवन वैधता प्रमाण पत्र',
        'स्कोरकार्ड चेक कराएं: 8982324497'
      ],
      note: 'Nitish Khobragade (8982324497)'
    }
  }
];

/**
 * Transforms SeedPostData into a standard PostRecord compatible with Firestore
 */
export function seedPostToPostRecord(post: SeedPostData): PostRecord {
  return {
    id: post.slug,
    slug: post.slug,
    year: post.year,
    month: post.month,
    blogNo: post.blogNo,
    title: post.title,
    shortTitle: post.shortTitle || post.title.slice(0, 30),
    dept: post.dept,
    category: post.category,
    categories: post.categories,
    status: post.status,
    publishedAt: post.publishedAt,
    totalPosts: post.totalPosts,
    qualification: post.qualification,
    eligibility: post.qualification,
    lastDate: post.lastDate,
    detailsUrl: post.detailsUrl,
    content: post.content,
    state: post.state,
    dates: post.dates,
    fee: post.fee,
    links: post.links,
    posterConfig: post.posterConfig,
    minAge: post.minAge,
    maxAge: post.maxAge,
    requiredDocuments: post.requiredDocuments,
    howToApplySteps: post.howToApplySteps,
    isTechJob: post.isTechJob,
    companyName: post.companyName,
    role: post.role,
    experience: post.experience,
    location: post.location,
    batchEligibility: post.batchEligibility,
    updatedAt: Date.now()
  };
}

/**
 * Returns formatted in-memory list for immediate rendering without delays
 */
export function getInitialSeedPosts(): PostRecord[] {
  return INITIAL_SEED_POSTS.map(seedPostToPostRecord);
}

/**
 * Checks Firestore collection 'posts' and seeds all posts if empty.
 * Can also force re-sync when requested by Admin.
 */
export async function seedPostsIfEmpty(forceReSync: boolean = false): Promise<{ success: boolean; count: number }> {
  try {
    const postsRef = collection(db, 'posts');
    const snap = await getDocs(postsRef);

    if (!snap.empty && !forceReSync) {
      return { success: true, count: snap.size };
    }

    let seededCount = 0;
    for (const post of INITIAL_SEED_POSTS) {
      const docRef = doc(db, 'posts', post.slug);
      const payload: Record<string, unknown> = {
        ...post,
        id: post.slug,
        eligibility: post.qualification,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, payload, { merge: true });
      seededCount++;
    }

    return { success: true, count: seededCount };
  } catch (err) {
    console.warn('Firestore seeding encountered error or offline mode:', err);
    return { success: false, count: 0 };
  }
}
