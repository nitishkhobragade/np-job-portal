import { JobItem, AdmitCardItem, ResultItem, TrendingCard, TickerAlert } from '../types';

export const OWNER_INFO = {
  name: "Nitish Khobragade",
  brandName: "NP Job Portal",
  portalName: "NP Job Portal",
  phone: "8982324497",
  whatsappUrl: "https://wa.me/918982324497?text=%E0%A4%A8%E0%A4%AE%E0%A4%B8%E0%A5%8D%E0%A4%A4%E0%A5%87%20Nitish%20Ji%2C%20%E0%A4%AE%E0%A5%81%E0%A4%9D%E0%A5%87%20NP%20Job%20Portal%20%E0%A4%B8%E0%A5%87%20%E0%A4%91%E0%A4%A8%E0%A4%B2%E0%A4%BE%E0%A4%87%E0%A4%A8%20%E0%A4%AB%E0%A4%BE%E0%A4%B0%E0%A5%8D%E0%A4%AE%20%E0%A4%AD%E0%A4%B0%E0%A4%B5%E0%A4%BE%E0%A4%A8%E0%A4%BE%20%E0%A4%B9%E0%A5%88%E0%A5%A4",
  callUrl: "tel:8982324497",
  tagline: "घर बैठे सुरक्षित फॉर्म भरवाएं • Nitish Khobragade (8982324497)",
  address: "Madhya Pradesh",
  hours: "सुबह 8:00 AM से रात 10:00 PM तक"
};

export const TICKER_ALERTS: TickerAlert[] = [
  {
    id: "tick-1",
    text: "MP Police Constable 2026 भर्ती: 7,500 पदों हेतु ऑनलाइन आवेदन प्रारंभ - अंतिम तिथि 15 अक्टूबर",
    isBreaking: true,
    date: "Today"
  },
  {
    id: "tick-2",
    text: "MP AYUSH UG 2026 मॉप-अप काउंसलिंग सीट आवंटन सूची जारी।",
    isBreaking: true,
    date: "New"
  },
  {
    id: "tick-3",
    text: "SSC CHSL 10+2 भर्ती 2026: 3,712 पदों हेतु ऑनलाइन फॉर्म शुरू - घर बैठे फॉर्म भरवाएं!",
    isBreaking: false,
    date: "Active"
  },
  {
    id: "tick-4",
    text: "Railway RRC Group D भर्ती अधिसूचना जारी - 32,000+ पदों पर भर्ती प्रक्रिया प्रारंभ",
    isBreaking: true,
    date: "Big Update"
  },
  {
    id: "tick-5",
    text: "MP TET वर्ग 3 प्राथमिक शिक्षक पात्रता परीक्षा 2026 एडमिट कार्ड लाइव",
    isBreaking: false,
    date: "Latest"
  }
];

export const TRENDING_CARDS: TrendingCard[] = [
  {
    id: "trend-1",
    title: "MP Police Constable 2026",
    subtitle: "MP ESB Constable GD & Radio",
    colorTheme: "from-blue-600 to-indigo-700",
    badge: "7,500 Posts",
    postsOrDate: "Last Date: 15/10/2026",
    category: "MP Special"
  },
  {
    id: "trend-2",
    title: "MP AYUSH UG Counselling",
    subtitle: "BAMS / BHMS / BUMS Seat Allotment",
    colorTheme: "from-emerald-600 to-teal-700",
    badge: "Choice Filling Open",
    postsOrDate: "Round 2 Allotment",
    category: "Medical/MP"
  },
  {
    id: "trend-3",
    title: "SSC CHSL (10+2) 2026",
    subtitle: "LDC, JSA & Data Entry Operator",
    colorTheme: "from-amber-600 to-orange-700",
    badge: "3,712 Posts",
    postsOrDate: "Last Date: 28/09/2026",
    category: "Central SSC"
  },
  {
    id: "trend-4",
    title: "Railway RRC Group D",
    subtitle: "Track Maintainer & Assistant Pointsman",
    colorTheme: "from-rose-600 to-red-700",
    badge: "32,000+ Posts",
    postsOrDate: "10th Pass / ITI",
    category: "Railway"
  },
  {
    id: "trend-5",
    title: "IBPS Bank PO / Clerk",
    subtitle: "Probationary Officer 2026-27",
    colorTheme: "from-purple-600 to-indigo-800",
    badge: "4,455 Posts",
    postsOrDate: "Prelims Oct 2026",
    category: "Banking"
  },
  {
    id: "trend-6",
    title: "MP TET Varg 3 2026",
    subtitle: "Primary School Teacher Eligibility",
    colorTheme: "from-cyan-600 to-blue-700",
    badge: "Admit Card Out",
    postsOrDate: "Exam: 04 Nov 2026",
    category: "MP Teaching"
  },
  {
    id: "trend-7",
    title: "Agniveer Army & Navy",
    subtitle: "Rally Bharti General Duty / Tradesman",
    colorTheme: "from-stone-700 to-neutral-900",
    badge: "10th/12th Pass",
    postsOrDate: "Rally Dates Out",
    category: "Defence"
  },
  {
    id: "trend-8",
    title: "MPPSC State Service 2026",
    subtitle: "Deputy Collector, DSP, Naib Tehsildar",
    colorTheme: "from-violet-600 to-purple-800",
    badge: "Prelims Live",
    postsOrDate: "Exam Date: 17 Dec",
    category: "State PSC"
  }
];

export const LATEST_JOBS_DATA: JobItem[] = [
  {
    id: "job-1",
    slug: "mp-police-constable-2026",
    title: "MP Police Constable GD / Radio Operator Bharti 2026",
    department: "MP Employees Selection Board (MPESB Bhopal)",
    totalPosts: "7,500 Posts",
    lastDate: "15/10/2026",
    state: "MP",
    qualification: "10th / 12th Pass + ITI for Radio",
    ageLimit: "18-36 Years (MP Domicile Relaxations)",
    fee: "General: ₹500 | SC/ST/OBC: ₹250",
    isNew: true,
    isHot: true,
    category: "Police",
    applyUrl: "https://esb.mp.gov.in"
  },
  {
    id: "job-2",
    slug: "mp-ayush-ug-counselling",
    title: "MP AYUSH UG BAMS / BHMS 2026 Online Counselling",
    department: "Directorate of AYUSH, Madhya Pradesh",
    totalPosts: "State Quota Seats",
    lastDate: "05/10/2026",
    state: "MP",
    qualification: "NEET UG 2026 Qualified Candidates",
    ageLimit: "Min 17 Years as on 31 Dec",
    fee: "Registration: ₹2,000 Portal Fee",
    isNew: true,
    isHot: true,
    category: "Health",
    applyUrl: "https://ayush.mponline.gov.in"
  },
  {
    id: "job-3",
    slug: "ssc-chsl-2026",
    title: "SSC Combined Higher Secondary (10+2) Level CHSL 2026",
    department: "Staff Selection Commission (SSC Central)",
    totalPosts: "3,712 Posts",
    lastDate: "28/09/2026",
    state: "Central",
    qualification: "10+2 Intermediate from Recognized Board",
    ageLimit: "18-27 Years (OBC +3, SC/ST +5)",
    fee: "General/OBC: ₹100 | Female/SC/ST: Nil",
    isNew: true,
    isHot: true,
    category: "SSC/UPSC",
    applyUrl: "https://ssc.gov.in"
  },
  {
    id: "job-4",
    slug: "railway-rrc-group-d",
    title: "Railway RRC Group D CEN 02/2026 Recruitment",
    department: "Railway Recruitment Cell (Indian Railways)",
    totalPosts: "32,450 Posts",
    lastDate: "22/10/2026",
    state: "Central",
    qualification: "Class 10th High School or NCVT ITI Certificate",
    ageLimit: "18-33 Years",
    fee: "General/OBC: ₹500 | SC/ST/Ex-SM: ₹250",
    isNew: true,
    isHot: false,
    category: "Railway",
    applyUrl: "https://indianrailways.gov.in"
  },
  {
    id: "job-5",
    slug: "ibps-po-clerk-2026",
    title: "IBPS PO / Management Trainee XIV Online Form 2026",
    department: "Institute of Banking Personnel Selection",
    totalPosts: "4,455 Posts",
    lastDate: "30/09/2026",
    state: "All India",
    qualification: "Any Bachelor's Degree from Recognized University",
    ageLimit: "20-30 Years",
    fee: "General/EWS/OBC: ₹850 | SC/ST/PwD: ₹175",
    isNew: false,
    isHot: true,
    category: "Banking",
    applyUrl: "https://ibps.in"
  },
  {
    id: "job-6",
    slug: "mp-forest-guard-2026",
    title: "MP Forest Guard (Vanrakshak) & Kshetra Rakshak 2026",
    department: "Madhya Pradesh Forest Department",
    totalPosts: "2,112 Posts",
    lastDate: "12/10/2026",
    state: "MP",
    qualification: "Class 10th Matriculation",
    ageLimit: "18-35 Years",
    fee: "General: ₹500 | Reserved: ₹250",
    isNew: true,
    isHot: false,
    category: "Police",
    applyUrl: "https://esb.mp.gov.in"
  },
  {
    id: "job-7",
    slug: "mppsc-state-engineering-2026",
    title: "MPPSC State Engineering Service Exam 2026",
    department: "Madhya Pradesh Public Service Commission (Indore)",
    totalPosts: "184 Posts",
    lastDate: "18/10/2026",
    state: "MP",
    qualification: "B.E. / B.Tech in Civil / Electrical / Mechanical",
    ageLimit: "21-40 Years",
    fee: "MP Residents: ₹250 | Others: ₹500",
    isNew: false,
    isHot: false,
    category: "SSC/UPSC",
    applyUrl: "https://mppsc.mp.gov.in"
  },
  {
    id: "job-8",
    slug: "indian-army-agniveer-2026",
    title: "Indian Army Agniveer Rally General Duty & Clerk 2026",
    department: "Join Indian Army (Recruitment HQ Jabalpur/Bhopal)",
    totalPosts: "Various Rallies",
    lastDate: "10/10/2026",
    state: "All India",
    qualification: "Class 10th / 12th with 45% to 60% Marks",
    ageLimit: "17.5 to 21 Years",
    fee: "Application: Nil | CEE Fee: ₹250",
    isNew: false,
    isHot: true,
    category: "Defense",
    applyUrl: "https://joinindianarmy.nic.in"
  },
  {
    id: "tech-1",
    slug: "google-software-engineer-early-career-2026",
    title: "Google India Software Engineer (Early Career / Campus 2026)",
    department: "Google India Private Limited",
    totalPosts: "Multiple Openings",
    postDate: "19/09/2026",
    lastDate: "30/10/2026",
    state: "All India",
    qualification: "B.Tech / B.E / M.Tech / MCA in CS / IT or related STEM field",
    ageLimit: "No Upper Age Limit",
    fee: "निःशुल्क (Free Application)",
    isNew: true,
    isHot: true,
    category: "Tech/IT",
    isTechJob: true,
    companyName: "Google India",
    role: "Software Engineer (SWE Early Career)",
    experience: "0 - 1 Year (Freshers Eligible)",
    location: "Bengaluru / Hyderabad (Hybrid)",
    batchEligibility: "2024, 2025 & 2026 Batches",
    applyUrl: "https://careers.google.com/jobs/results/"
  },
  {
    id: "tech-2",
    slug: "microsoft-software-engineer-sde1-2026",
    title: "Microsoft Software Engineer 1 (Azure & Cloud Core)",
    department: "Microsoft India Development Center (IDC)",
    totalPosts: "120+ Openings",
    postDate: "18/09/2026",
    lastDate: "25/10/2026",
    state: "All India",
    qualification: "B.E / B.Tech / M.E / M.Tech / MS in Computer Science, EE, or IT",
    ageLimit: "No Bar",
    fee: "निःशुल्क (Zero Fee)",
    isNew: true,
    isHot: true,
    category: "Tech/IT",
    isTechJob: true,
    companyName: "Microsoft",
    role: "Software Engineer 1 (SDE-1 Cloud & AI)",
    experience: "0 - 2 Years",
    location: "Hyderabad / Bengaluru / Noida",
    batchEligibility: "2024, 2025 & 2026 Passing Out",
    applyUrl: "https://careers.microsoft.com"
  },
  {
    id: "tech-3",
    slug: "infosys-specialist-programmer-dse-2026",
    title: "Infosys Specialist Programmer (SP) & Digital Specialist (DSE) 2026",
    department: "Infosys Limited",
    totalPosts: "3,500+ Hires",
    postDate: "17/09/2026",
    lastDate: "15/10/2026",
    state: "All India",
    qualification: "B.E / B.Tech / M.E / M.Tech / MCA / M.Sc (CS/IT/Electronics)",
    ageLimit: "18-28 Years",
    fee: "निःशुल्क (Free Registration)",
    isNew: true,
    isHot: false,
    category: "Tech/IT",
    isTechJob: true,
    companyName: "Infosys",
    role: "Specialist Programmer (₹9.5 LPA) / DSE (₹6.25 LPA)",
    experience: "Freshers (0 Years Experience)",
    location: "Indore / Pune / Bengaluru / Hyderabad / Remote Option",
    batchEligibility: "2025 & 2026 Batch",
    applyUrl: "https://career.infosys.com"
  },
  {
    id: "tech-4",
    slug: "tcs-nqt-digital-ninja-hiring-2026",
    title: "TCS National Qualifier Test (NQT) Digital & Prime Hiring Drive 2026",
    department: "Tata Consultancy Services (TCS)",
    totalPosts: "10,000+ Vacancies",
    postDate: "16/09/2026",
    lastDate: "20/10/2026",
    state: "All India",
    qualification: "B.Tech / B.E / MCA / M.Sc / M.Tech (All Branches Eligible)",
    ageLimit: "18-28 Years",
    fee: "निःशुल्क (Official TCS iON Free Test)",
    isNew: true,
    isHot: true,
    category: "Tech/IT",
    isTechJob: true,
    companyName: "Tata Consultancy Services (TCS)",
    role: "Prime (₹9 LPA) / Digital (₹7 LPA) / Ninja (₹3.6 LPA)",
    experience: "0 - 1 Year",
    location: "Pan India (Indore, Bhopal, Pune, Mumbai, Delhi)",
    batchEligibility: "2024, 2025 & 2026 Batch",
    applyUrl: "https://www.tcs.com/careers"
  },
  {
    id: "tech-5",
    slug: "razorpay-software-development-engineer-2026",
    title: "Razorpay Associate Software Engineer (Full Stack / Fintech)",
    department: "Razorpay Software Private Limited",
    totalPosts: "45 Positions",
    postDate: "15/09/2026",
    lastDate: "28/10/2026",
    state: "All India",
    qualification: "B.E / B.Tech / MCA with knowledge of React, Node.js or Golang",
    ageLimit: "Open",
    fee: "Free Application",
    isNew: false,
    isHot: false,
    category: "Tech/IT",
    isTechJob: true,
    companyName: "Razorpay / Startups",
    role: "Associate Software Engineer (Frontend / Backend)",
    experience: "0 - 2 Years",
    location: "Bengaluru / Remote",
    batchEligibility: "2024 & 2025 & 2026 Graduates",
    applyUrl: "https://razorpay.com/jobs"
  },
  {
    id: "tech-6",
    slug: "cognizant-genc-next-developer-2026",
    title: "Cognizant GenC Next & Elevate Developer Campus Recruitment",
    department: "Cognizant Technology Solutions",
    totalPosts: "2,200+ Hires",
    postDate: "14/09/2026",
    lastDate: "18/10/2026",
    state: "All India",
    qualification: "B.E / B.Tech (CS, IT, ECE, EE, Mech) / MCA with 60%+ aggregate",
    ageLimit: "18-26 Years",
    fee: "No Registration Fee",
    isNew: false,
    isHot: false,
    category: "Tech/IT",
    isTechJob: true,
    companyName: "Cognizant (CTS)",
    role: "Programmer Analyst Trainee (GenC Next)",
    experience: "Freshers (0 Years)",
    location: "Pune / Chennai / Coimbatore / Bengaluru",
    batchEligibility: "2025 & 2026 Batches",
    applyUrl: "https://careers.cognizant.com"
  }
];

export const TECH_JOBS_DATA: JobItem[] = LATEST_JOBS_DATA.filter((j) => j.isTechJob || j.category === 'Tech/IT');

export const ADMIT_CARD_DATA: AdmitCardItem[] = [
  {
    id: "admit-1",
    title: "MP TET Varg 3 (Primary School Teacher) 2026 Admit Card",
    department: "MP Employees Selection Board (Bhopal)",
    examDate: "Exam: 04 to 18 Nov 2026",
    releaseDate: "Released: 20 Sep 2026",
    hallTicketStatus: "Live Now",
    isNew: true,
    downloadUrl: "https://esb.mp.gov.in"
  },
  {
    id: "admit-2",
    title: "SSC CGL Tier 1 Computer Based Examination 2026",
    department: "Staff Selection Commission (All Regions)",
    examDate: "Exam: 25 Sep - 06 Oct 2026",
    releaseDate: "Region Wise Live",
    hallTicketStatus: "Live Now",
    isNew: true,
    downloadUrl: "https://ssc.gov.in"
  },
  {
    id: "admit-3",
    title: "Railway RRB ALP (Assistant Loco Pilot) CBT 1 Hall Ticket",
    department: "Railway Recruitment Board Bhopal / Bilaspur",
    examDate: "Exam: 12-16 Oct 2026",
    releaseDate: "City Intimation Live",
    hallTicketStatus: "Coming Soon",
    isNew: true,
    downloadUrl: "https://rrbbhopal.gov.in"
  },
  {
    id: "admit-4",
    title: "MP Police Constable Physical Test (PET/PST) 2025-26",
    department: "Police Headquarters MP & MPESB",
    examDate: "Ground Test: Starts 28 Oct",
    releaseDate: "Schedule Declared",
    hallTicketStatus: "Live Now",
    isNew: true,
    downloadUrl: "https://esb.mp.gov.in"
  },
  {
    id: "admit-5",
    title: "UPSC Combined Defence Services (CDS II) 2026 E-Admit Card",
    department: "Union Public Service Commission (Dholpur House)",
    examDate: "Exam: 01 Nov 2026",
    releaseDate: "Released Today",
    hallTicketStatus: "Live Now",
    isNew: false,
    downloadUrl: "https://upsconline.nic.in"
  },
  {
    id: "admit-6",
    title: "IBPS RRB Clerk Mains Examination Admit Card 2026",
    department: "Institute of Banking Personnel Selection",
    examDate: "Exam: 06 Oct 2026",
    releaseDate: "Download Active",
    hallTicketStatus: "Live Now",
    isNew: false,
    downloadUrl: "https://ibps.in"
  },
  {
    id: "admit-7",
    title: "MP Patwari Verification & Medical Call Letter Phase 2",
    department: "MP Land Records & Revenue Dept",
    examDate: "DV: 15-20 Oct 2026",
    releaseDate: "Call Letters Sent",
    hallTicketStatus: "Out",
    isNew: false,
    downloadUrl: "https://mpesb.mp.gov.in"
  }
];

export const RESULTS_DATA: ResultItem[] = [
  {
    id: "res-1",
    title: "MP Patwari Group 2 Sub Group 4 Revised Merit & Allotment",
    department: "MPESB Bhopal Revenue Department",
    declaredDate: "Declared: 19 Sep 2026",
    type: "Result",
    isNew: true,
    scoreCardAvailable: true,
    viewUrl: "https://esb.mp.gov.in"
  },
  {
    id: "res-2",
    title: "SSC Multi Tasking Staff (MTS) & Havaldar Tier 1 Scorecard",
    department: "Staff Selection Commission Central",
    declaredDate: "Declared: 18 Sep 2026",
    type: "Result",
    isNew: true,
    scoreCardAvailable: true,
    viewUrl: "https://ssc.gov.in"
  },
  {
    id: "res-3",
    title: "MPPSC State Service (SSE) Prelims Official Answer Key 2026",
    department: "Madhya Pradesh PSC Indore",
    declaredDate: "Updated: 17 Sep 2026",
    type: "Answer Key",
    isNew: true,
    scoreCardAvailable: false,
    viewUrl: "https://mppsc.mp.gov.in"
  },
  {
    id: "res-4",
    title: "CTET July 2026 Central Teacher Eligibility Result & Digilocker",
    department: "Central Board of Secondary Education (CBSE)",
    declaredDate: "Declared: 15 Sep 2026",
    type: "Result",
    isNew: false,
    scoreCardAvailable: true,
    viewUrl: "https://ctet.nic.in"
  },
  {
    id: "res-5",
    title: "MP ESB Group 5 Nursing & Paramedical Staff Cutoff Marks",
    department: "Madhya Pradesh Employees Selection Board",
    declaredDate: "Declared: 14 Sep 2026",
    type: "Cutoff",
    isNew: false,
    scoreCardAvailable: true,
    viewUrl: "https://esb.mp.gov.in"
  },
  {
    id: "res-6",
    title: "SSC Stenographer Grade C & D 2026 Final Selection List",
    department: "Staff Selection Commission",
    declaredDate: "Declared: 12 Sep 2026",
    type: "Result",
    isNew: false,
    scoreCardAvailable: true,
    viewUrl: "https://ssc.gov.in"
  },
  {
    id: "res-7",
    title: "UPSC Civil Services CSE Prelims Answer Key & Cut Off",
    department: "Union Public Service Commission",
    declaredDate: "Declared: 10 Sep 2026",
    type: "Answer Key",
    isNew: false,
    scoreCardAvailable: false,
    viewUrl: "https://upsc.gov.in"
  }
];

export const SERVICE_BENEFITS = [
  {
    title: "गलती-मुक्त फॉर्म सबमिशन",
    desc: "100% सही विवरण, फोटो-सिग्नेचर साइजिंग एवं कैटेगरी वेरिफिकेशन",
    iconName: "ShieldCheck"
  },
  {
    title: "घर बैठे सुविधा",
    desc: "व्हाट्सएप पर दस्तावेज भेजें, तुरंत पावती (Payment Receipt) प्राप्त करें",
    iconName: "Home"
  },
  {
    title: "एडमिट कार्ड व रिजल्ट अलर्ट",
    desc: "फॉर्म भरने के बाद एडमिट कार्ड व रिजल्ट जारी होने पर व्यक्तिगत सूचना",
    iconName: "BellRing"
  },
  {
    title: "एमपी ऑनलाइन अधिकृत सेवाएं",
    desc: "समग्र ई-केवाईसी, रोजगार पंजीयन, निवास व जाति प्रमाण पत्र आवेदन",
    iconName: "Award"
  }
];
