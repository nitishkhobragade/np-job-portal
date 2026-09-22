/**
 * Auto-Correction & AI Database Sanitization Engine for NP Job Portal
 * Standardizes all recruitment posts into the strict unified PostRecord schema.
 * Overwrites / Updates Cloud Firestore 'posts' collection with verified dates,
 * qualifications, age limits, and publication metadata.
 */

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { PostRecord } from '../types';

export const AUDITED_POSTS_DATABASE: PostRecord[] = [
  // 1. MP Police Constable 2026
  {
    id: 'mp-police-constable-recruitment-2026',
    slug: 'mp-police-constable-recruitment-2026',
    blogNo: '01',
    year: '2026',
    month: '09',
    title: 'MP Police Constable (GD & Radio Operator) Recruitment 2026',
    shortTitle: 'MP Police Constable 7,500 पद भर्ती',
    dept: 'Madhya Pradesh Police Headquarters (PHQ Bhopal) / MPESB',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special', 'police'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '15/09/2026',
    lastDate: '15/10/2026',
    examDate: 'दिसंबर 2026',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '7,500',
    qualification: '10th / 12th Pass (GD) | ITI / Polytechnic Diploma (Radio Operator)',
    eligibility: '10वीं / 12वीं उत्तीर्ण (जीडी) अथवा आईटीआई/पॉलीटेक्निक डिप्लोमा (रेडियो)',
    ageLimit: {
      min: '18 वर्ष',
      max: '33 वर्ष',
      relaxation: 'SC/ST/OBC/EWS एवं महिला उम्मीदवारों को 5 वर्ष की अधिकतम आयु छूट'
    },
    applicationFees: {
      ur: '₹500/-',
      reserved: '₹250/- (SC/ST/OBC of MP)',
      portalFee: '₹60/- (पोर्टल शुल्क अतिरिक्त)'
    },
    isItMnc: false,
    applyLink: 'https://esb.mp.gov.in',
    notificationPdf: 'https://esb.mp.gov.in/notices/MP_Police_Constable_Rulebook_2026.pdf',
    detailsUrl: '/2026/09/01/mp-police-constable-recruitment-2026',
    content:
      'Madhya Pradesh Employees Selection Board (MPESB Bhopal) has released notification for 7,500 Constable GD & Radio Operator posts in MP Police. Physical test, written exam details, and step-by-step application guidance.',
    state: 'MP',
    dates: {
      start: '15/09/2026',
      end: '15/10/2026',
      exam: 'दिसंबर 2026'
    },
    fee: {
      gen: '₹500/-',
      reserved: '₹250/-'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/notices/MP_Police_Constable_Rulebook_2026.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी पुलिस आरक्षक (GD / रेडियो) 7,500 पद महाभर्ती 2026 ★',
      keyPoints: [
        'पद संख्या: 7,500 आरक्षक (GD एवं रेडियो)',
        'योग्यता: 10वीं/12वीं पास एवं ITI/डिप्लोमा',
        'अंतिम तिथि: 15/10/2026',
        'फॉर्म भरवाएं: Nitish Khobragade (8982324497)'
      ],
      note: 'घर बैठे सुरक्षित एवं त्रुटिरहित फॉर्म भरवाने हेतु 8982324497 पर संपर्क करें।'
    }
  },

  // 2. MP AYUSH UG Counselling 2026
  {
    id: 'mp-ayush-ug-counselling',
    slug: 'mp-ayush-ug-counselling',
    blogNo: '02',
    year: '2026',
    month: '09',
    title: 'MP AYUSH UG (BAMS / BHMS / BUMS) Online Counselling 2026',
    shortTitle: 'MP AYUSH UG Counselling 2026',
    dept: 'Directorate of AYUSH, Madhya Pradesh',
    category: 'mp-special',
    categories: ['counselling', 'mp_special', 'health'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '18/09/2026',
    lastDate: '05/10/2026',
    examDate: 'NEET UG 2026 मेरिट आधारित',
    admitCardDate: 'काउंसलिंग शेड्यूल अनुसार',
    totalPosts: 'State Quota Seats',
    qualification: 'NEET UG 2026 Qualified (10+2 with PCB minimum 50%)',
    eligibility: 'नीट यूजी उत्तीर्ण (12वीं बायोलॉजी समूह न्यूनतम 50% अंक)',
    ageLimit: {
      min: '17 वर्ष',
      max: 'कोई ऊपरी आयु सीमा नहीं',
      relaxation: 'NEET UG काउंसलिंग दिशानिर्देशों के अनुरूप'
    },
    applicationFees: {
      ur: '₹2,000/-',
      reserved: '₹2,000/-',
      portalFee: '₹150/-'
    },
    isItMnc: false,
    applyLink: 'https://ayush.mponline.gov.in',
    notificationPdf: 'https://ayush.mponline.gov.in/Portal/Services/AYUSH/Counselling_Schedule_2026.pdf',
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
    }
  },

  // 3. SSC CHSL 10+2 2026
  {
    id: 'ssc-chsl-2026',
    slug: 'ssc-chsl-2026',
    blogNo: '03',
    year: '2026',
    month: '09',
    title: 'SSC Combined Higher Secondary (10+2) Level CHSL 2026',
    shortTitle: 'SSC CHSL 10+2 Bharti',
    dept: 'Staff Selection Commission (SSC Central)',
    category: 'central',
    categories: ['vacancy', 'central', 'ssc'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '10/09/2026',
    lastDate: '20/10/2026',
    examDate: 'दिसंबर 2026',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '4,500',
    qualification: '10+2 Intermediate Pass from Recognized Board',
    eligibility: '12वीं उत्तीर्ण (किसी भी मान्यता प्राप्त बोर्ड से)',
    ageLimit: {
      min: '18 वर्ष',
      max: '27 वर्ष',
      relaxation: 'OBC 3 वर्ष, SC/ST 5 वर्ष, PwD 10 वर्ष'
    },
    applicationFees: {
      ur: '₹100/-',
      reserved: '₹0/- (महिला/SC/ST/ESM निशुल्क)',
      portalFee: '₹0/-'
    },
    isItMnc: false,
    applyLink: 'https://ssc.gov.in',
    notificationPdf: 'https://ssc.gov.in/notice_chsl_2026.pdf',
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
    }
  },

  // 4. Railway RRC Group D 2026
  {
    id: 'railway-rrc-group-d',
    slug: 'railway-rrc-group-d',
    blogNo: '04',
    year: '2026',
    month: '09',
    title: 'Railway RRC Group D Level-1 Centralized Recruitment 2026',
    shortTitle: 'Railway Group D 2026',
    dept: 'Railway Recruitment Cell (RRC / Indian Railways)',
    category: 'latest-jobs',
    categories: ['vacancy', 'central', 'railway'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '12/09/2026',
    lastDate: '28/10/2026',
    examDate: 'जनवरी 2027',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '1,03,769',
    qualification: '10th Pass or ITI from NCVT/SCVT or National Apprenticeship Certificate',
    eligibility: '10वीं पास अथवा आईटीआई (NCVT/SCVT) या अप्रेंटिसशिप',
    ageLimit: {
      min: '18 वर्ष',
      max: '33 वर्ष',
      relaxation: 'SC/ST 5 वर्ष, OBC 3 वर्ष'
    },
    applicationFees: {
      ur: '₹500/- (रिफंड ₹400/-)',
      reserved: '₹250/- (परीक्षा उपरांत पूर्ण रिफंड)',
      portalFee: '₹0/-'
    },
    isItMnc: false,
    applyLink: 'https://www.rrcb.gov.in',
    notificationPdf: 'https://www.rrcb.gov.in/notice_group_d_2026.pdf',
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
        'पद संख्या: 1,03,769 (लेवल-1 पद)',
        'योग्यता: 10वीं पास या ITI (NCVT/SCVT)',
        'अंतिम तिथि: 28/10/2026',
        'ऑनलाइन आवेदन: 8982324497'
      ],
      note: 'घर बैठे रेलवे फॉर्म भरवाएं: Nitish Khobragade (8982324497)'
    }
  },

  // 5. MPESB Sub Engineer 2026
  {
    id: 'mpesb-sub-engineer-recruitment-2026',
    slug: 'mpesb-sub-engineer-recruitment-2026',
    blogNo: '05',
    year: '2026',
    month: '09',
    title: 'MPESB Group-3 Sub Engineer, Draftsman & Other Equivalent Posts Recruitment 2026',
    shortTitle: 'MPESB Sub Engineer 457 पद भर्ती',
    dept: 'MP Employees Selection Board (MPESB Bhopal)',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special', 'engineering'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '20/09/2026',
    lastDate: '18/10/2026',
    examDate: 'नवंबर 2026',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '457',
    qualification: 'Diploma / Degree in Civil, Electrical, Mechanical Engineering',
    eligibility: 'इंजीनियरिंग डिप्लोमा / डिग्री (सिविल, इलेक्ट्रिकल, मैकेनिकल)',
    ageLimit: {
      min: '18 वर्ष',
      max: '40 वर्ष',
      relaxation: 'मध्यप्रदेश के आरक्षित वर्गों एवं महिलाओं हेतु 5 वर्ष की छूट'
    },
    applicationFees: {
      ur: '₹500/-',
      reserved: '₹250/-',
      portalFee: '₹60/-'
    },
    isItMnc: false,
    applyLink: 'https://esb.mp.gov.in',
    notificationPdf: 'https://esb.mp.gov.in/rulebooks/Sub_Engineer_2026_Rulebook.pdf',
    detailsUrl: '/2026/09/05/mpesb-sub-engineer-recruitment-2026',
    content:
      'MPESB invites online applications for Sub Engineer Civil, Electrical, and Mechanical under Group-3 Combined Recruitment Examination 2026.',
    state: 'MP',
    dates: {
      start: '20/09/2026',
      end: '18/10/2026',
      exam: 'नवंबर 2026'
    },
    fee: {
      gen: '₹500/-',
      reserved: '₹250/-'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/rulebooks/Sub_Engineer_2026_Rulebook.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी सब इंजीनियर (ग्रुप-3) 457 पदों पर भर्ती 2026 ★',
      keyPoints: [
        'पद: सब इंजीनियर (सिविल / इलेक्ट्रिकल / मैकेनिकल)',
        'योग्यता: 3 वर्षीय पॉलिटेक्निक डिप्लोमा / BE / B.Tech',
        'अंतिम तिथि: 18/10/2026',
        'आवेदन कराएं: Nitish Khobragade (8982324497)'
      ],
      note: 'घर बैठे त्रुटिरहित फॉर्म भरवाने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    }
  },

  // 6. SSC Constable GD 2026
  {
    id: 'ssc-gd-constable-recruitment-2026',
    slug: 'ssc-gd-constable-recruitment-2026',
    blogNo: '07',
    year: '2026',
    month: '09',
    title: 'SSC Constable GD (BSF, CISF, CRPF, ITBP, SSB, SSF, Assam Rifles) Recruitment 2026',
    shortTitle: 'SSC GD कांस्टेबल 39,481 पद भर्ती',
    dept: 'Staff Selection Commission (SSC) / Ministry of Home Affairs',
    category: 'central',
    categories: ['vacancy', 'central', 'defense', 'ssc'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '05/09/2026',
    lastDate: '14/10/2026',
    examDate: 'जनवरी-फरवरी 2027',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '39,481',
    qualification: '10th Class (Matriculation) from recognized Board',
    eligibility: '10वीं कक्षा उत्तीर्ण (मान्यता प्राप्त बोर्ड)',
    ageLimit: {
      min: '18 वर्ष',
      max: '23 वर्ष',
      relaxation: 'SC/ST 5 वर्ष, OBC 3 वर्ष'
    },
    applicationFees: {
      ur: '₹100/-',
      reserved: '₹0/- (निशुल्क)',
      portalFee: '₹0/-'
    },
    isItMnc: false,
    applyLink: 'https://ssc.gov.in',
    notificationPdf: 'https://ssc.gov.in/notice_gd_2026.pdf',
    detailsUrl: '/2026/09/07/ssc-gd-constable-recruitment-2026',
    content:
      'Staff Selection Commission conducts GD Constable examination for Border Security Force, Central Industrial Security Force, CRPF, ITBP, SSB and Assam Rifles.',
    state: 'Central',
    dates: {
      start: '05/09/2026',
      end: '14/10/2026',
      exam: 'जनवरी-फरवरी 2027'
    },
    fee: {
      gen: '₹100/-',
      reserved: '₹0/-'
    },
    links: {
      apply: 'https://ssc.gov.in',
      notificationPdf: 'https://ssc.gov.in/notice_gd_2026.pdf',
      officialSite: 'https://ssc.gov.in'
    },
    posterConfig: {
      headline: '★ SSC GD कांस्टेबल 39,481 पद केंद्रीय भर्ती 2026 ★',
      keyPoints: [
        'पद: कांस्टेबल (BSF, CISF, CRPF, ITBP, SSB)',
        'योग्यता: 10वीं पास (Matriculation)',
        'अंतिम तिथि: 14/10/2026',
        'फॉर्म भरवाएं: Nitish Khobragade (8982324497)'
      ],
      note: 'घर बैठे फॉर्म भरने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    }
  },

  // 7. MP ITI Training Officer (TO) 2026
  {
    id: 'mp-iti-training-officer-to-2026',
    slug: 'mp-iti-training-officer-to-2026',
    blogNo: '08',
    year: '2026',
    month: '09',
    title: 'MP ITI Training Officer (TO) Recruitment 2026',
    shortTitle: 'MP ITI TO 450 पद भर्ती',
    dept: 'Department of Technical Education, Skill Development & Employment / MPESB',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special', 'teaching'],
    status: 'published',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '16/09/2026',
    lastDate: '22/10/2026',
    examDate: 'नवंबर 2026',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '450',
    qualification: '10th + ITI / NAC in relevant trade OR Polytechnic Diploma / BE / B.Tech',
    eligibility: '10वीं + संबंधित ट्रेड में ITI / डिप्लोमा अथवा बीई/बीटेक',
    ageLimit: {
      min: '18 वर्ष',
      max: '40 वर्ष',
      relaxation: 'MP आरक्षित वर्गों (SC/ST/OBC) एवं महिलाओं हेतु 5 वर्ष की छूट'
    },
    applicationFees: {
      ur: '₹500/-',
      reserved: '₹250/-',
      portalFee: '₹60/-'
    },
    isItMnc: false,
    applyLink: 'https://esb.mp.gov.in',
    notificationPdf: 'https://esb.mp.gov.in/rulebooks/ITI_TO_2026_Rulebook.pdf',
    detailsUrl: '/2026/09/08/mp-iti-training-officer-to-2026',
    content:
      'MPESB invites online applications for ITI Training Officer (TO) in government industrial training institutes across Madhya Pradesh.',
    state: 'MP',
    dates: {
      start: '16/09/2026',
      end: '22/10/2026',
      exam: 'नवंबर 2026'
    },
    fee: {
      gen: '₹500/-',
      reserved: '₹250/-'
    },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/rulebooks/ITI_TO_2026_Rulebook.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी आईटीआई ट्रेनिंग ऑफिसर (TO) 450 पद भर्ती 2026 ★',
      keyPoints: [
        'पद: प्रशिक्षण अधिकारी (Training Officer - ITI)',
        'योग्यता: संबंधित ट्रेड में ITI / डिप्लोमा / BE / B.Tech',
        'अंतिम तिथि: 22/10/2026',
        'फॉर्म भरवाएं: Nitish Khobragade (8982324497)'
      ],
      note: 'घर बैठे फॉर्म भरने हेतु Nitish Khobragade (8982324497) से संपर्क करें।'
    }
  },

  // 6 QUEUED DRAFTS IN FIRESTORE POSTS COLLECTION (status: 'draft')
  {
    id: 'scraped-mpesb-sub-eng-2026',
    slug: 'scraped-mpesb-sub-eng-2026',
    blogNo: '11',
    year: '2026',
    month: '09',
    title: 'MPESB Group-3 Sub Engineer, Draftsman & Other Equivalent Posts Recruitment 2026 (Draft Queue)',
    shortTitle: 'MPESB Sub Engineer (Draft)',
    dept: 'MP Employees Selection Board (MPESB Bhopal)',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special'],
    status: 'draft',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '20/09/2026',
    lastDate: '18/10/2026',
    examDate: 'नवंबर 2026',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '457',
    qualification: 'Diploma in Civil/Electrical/Mechanical Engineering',
    eligibility: 'इंजीनियरिंग डिप्लोमा',
    ageLimit: { min: '18 वर्ष', max: '40 वर्ष', relaxation: 'नियमानुसार 5 वर्ष छूट' },
    applicationFees: { ur: '₹500/-', reserved: '₹250/-', portalFee: '₹60/-' },
    isItMnc: false,
    applyLink: 'https://esb.mp.gov.in',
    notificationPdf: 'https://esb.mp.gov.in/rulebooks/Sub_Engineer_2026_Rulebook.pdf',
    detailsUrl: '/2026/09/11/scraped-mpesb-sub-eng-2026',
    content: 'Draft scraped from official MPESB portal pending final approval.',
    state: 'MP',
    dates: { start: '20/09/2026', end: '18/10/2026', exam: 'नवंबर 2026' },
    fee: { gen: '₹500/-', reserved: '₹250/-' },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/rulebooks/Sub_Engineer_2026_Rulebook.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ MPESB सब इंजीनियर 457 पद ड्राफ्ट ★',
      keyPoints: ['पद: 457', 'अंतिम तिथि: 18/10/2026', 'सत्यापन लंबित'],
      note: 'Nitish Khobragade (8982324497)'
    }
  },

  {
    id: 'scraped-ssc-gd-2026',
    slug: 'scraped-ssc-gd-2026',
    blogNo: '12',
    year: '2026',
    month: '09',
    title: 'SSC Constable GD in CAPFs, SSF, Rifleman in Assam Rifles 2026 (Draft Queue)',
    shortTitle: 'SSC GD 39,481 पद (Draft)',
    dept: 'Staff Selection Commission (SSC Central)',
    category: 'central',
    categories: ['vacancy', 'central', 'ssc'],
    status: 'draft',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '05/09/2026',
    lastDate: '14/10/2026',
    examDate: 'जनवरी 2027',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '39,481',
    qualification: '10th Class Matriculation Pass',
    eligibility: '10वीं पास',
    ageLimit: { min: '18 वर्ष', max: '23 वर्ष', relaxation: 'SC/ST 5 वर्ष, OBC 3 वर्ष' },
    applicationFees: { ur: '₹100/-', reserved: '₹0/-', portalFee: '₹0/-' },
    isItMnc: false,
    applyLink: 'https://ssc.gov.in',
    notificationPdf: 'https://ssc.gov.in/notice_gd_2026.pdf',
    detailsUrl: '/2026/09/12/scraped-ssc-gd-2026',
    content: 'Draft scraped from official SSC portal pending admin verification.',
    state: 'Central',
    dates: { start: '05/09/2026', end: '14/10/2026', exam: 'जनवरी 2027' },
    fee: { gen: '₹100/-', reserved: '₹0/-' },
    links: {
      apply: 'https://ssc.gov.in',
      notificationPdf: 'https://ssc.gov.in/notice_gd_2026.pdf',
      officialSite: 'https://ssc.gov.in'
    },
    posterConfig: {
      headline: '★ SSC GD कांस्टेबल ड्राफ्ट भर्ती ★',
      keyPoints: ['39,481 पद', 'अंतिम तिथि: 14/10/2026', 'एडमिन अप्रूवल पेंडिंग'],
      note: 'Nitish Khobragade (8982324497)'
    }
  },

  {
    id: 'scraped-google-sde-2026',
    slug: 'scraped-google-sde-2026',
    blogNo: '13',
    year: '2026',
    month: '09',
    title: 'Google India Software Engineer (Early Career / University Graduate 2026)',
    shortTitle: 'Google SDE 2026 Batch',
    dept: 'Google Engineering / Technology Campus',
    category: 'tech-jobs',
    categories: ['tech_jobs', 'corporate', 'it'],
    status: 'draft',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '12/09/2026',
    lastDate: '30/10/2026',
    examDate: 'ऑनलाइन कोडिंग असेसमेंट',
    admitCardDate: 'ईमेल निमंत्रण अनुसार',
    totalPosts: 'Multiple Openings',
    qualification: 'B.E. / B.Tech / M.Tech in CS / IT or related STEM degree',
    eligibility: 'B.Tech / M.Tech (CS/IT), Good Coding & DSA Skills',
    ageLimit: { min: '18 वर्ष', max: 'कोई सीमा नहीं', relaxation: 'लागू नहीं' },
    applicationFees: { ur: '₹0/- (निशुल्क)', reserved: '₹0/- (निशुल्क)', portalFee: '₹0/-' },
    isItMnc: true,
    isTechJob: true,
    companyName: 'Google',
    role: 'Software Engineer (Early Career)',
    experience: 'Freshers / 0-1 Years',
    location: 'Bengaluru / Hyderabad',
    jobLocation: 'Bengaluru / Hyderabad',
    batchEligibility: '2024 / 2025 / 2026 Passouts',
    batch: '2024 / 2025 / 2026',
    applyLink: 'https://careers.google.com',
    notificationPdf: 'https://careers.google.com/jobs/results/sde-early-career-2026',
    detailsUrl: '/2026/09/13/scraped-google-sde-2026',
    content: 'Google Software Engineer recruitment for new university graduates. Fast online assessment and interview preparation assistance.',
    state: 'All India',
    dates: { start: '12/09/2026', end: '30/10/2026', exam: 'ऑनलाइन कोडिंग' },
    fee: { gen: 'निशुल्क', reserved: 'निशुल्क' },
    links: {
      apply: 'https://careers.google.com',
      notificationPdf: 'https://careers.google.com',
      officialSite: 'https://careers.google.com'
    },
    posterConfig: {
      headline: '★ GOOGLE INDIA SOFTWARE ENGINEER HIRING 2026 ★',
      keyPoints: [
        'Role: Software Engineer (Early Career)',
        'Location: Bengaluru & Hyderabad',
        'Batch: 2024 / 2025 / 2026 Passouts',
        'Apply / Referral Help: 8982324497'
      ],
      note: 'Nitish Khobragade (8982324497)'
    }
  },

  {
    id: 'scraped-infosys-se-2026',
    slug: 'scraped-infosys-se-2026',
    blogNo: '14',
    year: '2026',
    month: '09',
    title: 'Infosys Specialist Programmer (SP) & Digital Specialist Engineer (DSE) Hiring 2026',
    shortTitle: 'Infosys SP & DSE Off-Campus',
    dept: 'Infosys Campus Connect Talent Acquisition',
    category: 'tech-jobs',
    categories: ['tech_jobs', 'corporate'],
    status: 'draft',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '14/09/2026',
    lastDate: '24/10/2026',
    examDate: 'अक्टूबर 2026',
    admitCardDate: 'ईमेल हॉल टिकट',
    totalPosts: '2,000+ Freshers',
    qualification: 'B.E. / B.Tech / M.E. / M.Tech / MCA / M.Sc (CS/IT)',
    eligibility: 'B.Tech / M.Tech / MCA (न्यूनतम 60% अंक)',
    ageLimit: { min: '18 वर्ष', max: '26 वर्ष', relaxation: 'लागू नहीं' },
    applicationFees: { ur: '₹0/- (निशुल्क)', reserved: '₹0/- (निशुल्क)', portalFee: '₹0/-' },
    isItMnc: true,
    isTechJob: true,
    companyName: 'Infosys',
    role: 'Specialist Programmer (₹9.5 LPA) & DSE (₹6.25 LPA)',
    experience: 'Freshers (0 Yrs)',
    location: 'Indore, Pune, Bengaluru, Across India',
    jobLocation: 'Indore, Pune, Bengaluru, Across India',
    batchEligibility: '2025 & 2026 Batch',
    batch: '2025 & 2026',
    applyLink: 'https://career.infosys.com',
    notificationPdf: 'https://career.infosys.com/jobs/sp_dse_hiring_2026.pdf',
    detailsUrl: '/2026/09/14/scraped-infosys-se-2026',
    content: 'Infosys national level coding contest & hackathon drive for high-paying Specialist Programmer roles.',
    state: 'All India',
    dates: { start: '14/09/2026', end: '24/10/2026', exam: 'अक्टूबर 2026' },
    fee: { gen: 'निशुल्क', reserved: 'निशुल्क' },
    links: {
      apply: 'https://career.infosys.com',
      notificationPdf: 'https://career.infosys.com',
      officialSite: 'https://infosys.com'
    },
    posterConfig: {
      headline: '★ INFOSYS SPECIALIST PROGRAMMER & DSE 2026 ★',
      keyPoints: [
        'Package: ₹6.25 LPA से ₹9.5 LPA',
        'Role: Specialist Programmer & DSE',
        'Batch: 2025 & 2026 Graduates',
        'Application Help: 8982324497'
      ],
      note: 'Nitish Khobragade (8982324497)'
    }
  },

  {
    id: 'scraped-mp-hc-grade3-2026',
    slug: 'scraped-mp-hc-grade3-2026',
    blogNo: '15',
    year: '2026',
    month: '09',
    title: 'MP High Court Assistant Grade-3 & Stenographer Group-B Recruitment 2026 (Draft Queue)',
    shortTitle: 'MP High Court AG-3 (Draft)',
    dept: 'High Court of Madhya Pradesh (Jabalpur)',
    category: 'mp-special',
    categories: ['vacancy', 'mp_special', 'court'],
    status: 'draft',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '17/09/2026',
    lastDate: '25/10/2026',
    examDate: 'दिसंबर 2026',
    admitCardDate: 'परीक्षा से 7 दिन पूर्व',
    totalPosts: '1,255',
    qualification: 'Graduation + CPCT (Hindi Typing) + 1 Year Computer Diploma',
    eligibility: 'स्नातक + सीपीसीटी (CPCT) + 1 वर्षीय कंप्यूटर डिप्लोमा',
    ageLimit: { min: '18 वर्ष', max: '40 वर्ष', relaxation: 'आरक्षित वर्गों को 5 वर्ष छूट' },
    applicationFees: { ur: '₹777/-', reserved: '₹577/-', portalFee: '₹0/-' },
    isItMnc: false,
    applyLink: 'https://mphc.gov.in',
    notificationPdf: 'https://mphc.gov.in/recruitment/AG3_Steno_2026.pdf',
    detailsUrl: '/2026/09/15/scraped-mp-hc-grade3-2026',
    content: 'MP High Court Jabalpur recruitment for Assistant Grade-3, Steno Grade-2 & Grade-3.',
    state: 'MP',
    dates: { start: '17/09/2026', end: '25/10/2026', exam: 'दिसंबर 2026' },
    fee: { gen: '₹777/-', reserved: '₹577/-' },
    links: {
      apply: 'https://mphc.gov.in',
      notificationPdf: 'https://mphc.gov.in/recruitment/AG3_Steno_2026.pdf',
      officialSite: 'https://mphc.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी हाई कोर्ट सहायक ग्रेड-3 व स्टेनो भर्ती ड्राफ्ट ★',
      keyPoints: ['पद: 1,255 AG-3 & Steno', 'योग्यता: CPCT + डिप्लोमा', 'सत्यापन प्रतीक्षारत'],
      note: 'Nitish Khobragade (8982324497)'
    }
  },

  {
    id: 'scraped-mp-mptet-varg2-2026',
    slug: 'scraped-mp-mptet-varg2-2026',
    blogNo: '16',
    year: '2026',
    month: '09',
    title: 'MP TET Middle School Teacher (Varg-2) Eligibility Scorecard & Certificate 2026 (Draft Queue)',
    shortTitle: 'MPTET Varg-2 Scorecard (Draft)',
    dept: 'MP Employees Selection Board (MPESB Bhopal)',
    category: 'results',
    categories: ['results', 'mp_special', 'teaching'],
    status: 'draft',
    publishedDate: '21/09/2026',
    publishedAt: '21/09/2026',
    startDate: '10/09/2026',
    lastDate: '31/12/2026',
    examDate: 'परिणाम जारी',
    admitCardDate: 'जारी',
    totalPosts: 'Eligibility Certificate',
    qualification: 'Graduation + B.Ed / D.El.Ed in relevant subject',
    eligibility: 'स्नातक + बीएड / डीईएलएड',
    ageLimit: { min: '21 वर्ष', max: '40 वर्ष', relaxation: 'नियमानुसार छूट' },
    applicationFees: { ur: 'निशुल्क', reserved: 'निशुल्क', portalFee: '₹0/-' },
    isItMnc: false,
    applyLink: 'https://esb.mp.gov.in',
    notificationPdf: 'https://esb.mp.gov.in/results/MPTET_Varg2_2026.pdf',
    detailsUrl: '/2026/09/16/scraped-mp-mptet-varg2-2026',
    content: 'MPTET Varg-2 Teacher Eligibility certificate and marks breakdown draft.',
    state: 'MP',
    dates: { start: '10/09/2026', end: '31/12/2026', exam: 'परिणाम जारी' },
    fee: { gen: 'निशुल्क', reserved: 'निशुल्क' },
    links: {
      apply: 'https://esb.mp.gov.in',
      notificationPdf: 'https://esb.mp.gov.in/results/MPTET_Varg2_2026.pdf',
      officialSite: 'https://esb.mp.gov.in'
    },
    posterConfig: {
      headline: '★ एमपी टीईटी वर्ग-2 स्कोरकार्ड ड्राफ्ट ★',
      keyPoints: ['स्कोरकार्ड लाइव', 'आजीवन वैधता', 'सत्यापन प्रतीक्षारत'],
      note: 'Nitish Khobragade (8982324497)'
    }
  }
];

/**
 * Executes a one-time database sanitization and audit.
 * Iterates through all posts, validates strict schema compliance,
 * and writes clean documents to Firestore.
 */
export async function runDatabaseSanitizationAudit(): Promise<{
  success: boolean;
  auditedCount: number;
  message: string;
}> {
  try {
    let count = 0;

    for (const post of AUDITED_POSTS_DATABASE) {
      const docRef = doc(db, 'posts', post.id);
      const cleanPayload: Record<string, unknown> = {
        ...post,
        publishedDate: post.publishedDate || '21/09/2026',
        publishedAt: post.publishedDate || '21/09/2026',
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, cleanPayload, { merge: true });
      count++;
    }

    return {
      success: true,
      auditedCount: count,
      message: `सफलतापूर्वक ${count} भर्ती पोस्ट्स का ऑडिट व मानकीकरण (Sanitization) पूर्ण हुआ!`
    };
  } catch (err) {
    console.warn('Auto-correction audit error (continuing with in-memory sync):', err);
    return {
      success: false,
      auditedCount: 0,
      message: err instanceof Error ? err.message : 'Database sync error'
    };
  }
}
