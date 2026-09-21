import { JobPostDetail } from '../types';
import { OWNER_INFO } from './portalData';

export const DETAILED_JOBS_LIST: JobPostDetail[] = [
  {
    slug: "mp-police-constable-2026",
    id: "job-1",
    title: "MP Police Constable (GD & Radio Operator) Recruitment 2026",
    shortTitle: "MP Police Constable 2026",
    department: "Madhya Pradesh Employees Selection Board (MPESB Bhopal)",
    advtNo: "ESB/PR/2026/04",
    totalPosts: "7,500 Posts",
    postDate: "15 September 2026",
    startDate: "15/09/2026",
    lastDate: "15/10/2026",
    lastDateFee: "15/10/2026",
    correctionDate: "20/10/2026",
    examDate: "15 December 2026 Onwards",
    admitCardDate: "December 1st Week 2026",
    feeGeneral: "₹500/- (General & Other State)",
    feeReserved: "₹250/- (SC / ST / OBC / EWS of MP Domicile)",
    feePortal: "₹60/- (Portal Fee)",
    paymentMode: "Online via Debit/Credit Card, Net Banking or UPI",
    minAge: "18 Years",
    maxAge: "36 Years (Plus 3 Years Relaxation for Reserved Categories)",
    ageCalculationDate: "01/01/2026",
    ageRelaxation: "SC / ST / OBC Candidates of MP State get 5 years relaxation. Female candidates get additional age relaxations as per MP Govt rules.",
    state: "MP",
    category: "Police",
    qualificationSummary: "Class 10th High School Exam or 12th Intermediate Passed from Recognized Board. For Radio Operator: 10+2 with ITI / Polytechnic Diploma.",
    vacanciesBreakdown: [
      {
        postName: "Constable (General Duty - GD) Non-Technical",
        total: "7,090 Posts",
        eligibility: "10th Class (Matriculation) Passed from any Recognized Board in India (8th Passed for ST category candidates)."
      },
      {
        postName: "Constable (Radio Operator) Technical",
        total: "410 Posts",
        eligibility: "10+2 Intermediate with 2 Years ITI Certificate in Electronic / Mechanics / Computer / IT / Telecommunication OR Diploma in Engg."
      }
    ],
    categoryWisePosts: [
      { category: "Constable GD (Open)", ur: "1,914", obc: "1,914", ews: "709", sc: "1,134", st: "1,418", total: "7,090" },
      { category: "Constable Radio", ur: "111", obc: "111", ews: "41", sc: "65", st: "82", total: "410" }
    ],
    physicalStandards: [
      { parameter: "Height (Male)", male: "168 CM (General/OBC/SC), 160 CM (ST)", female: "155 CM (All Categories)" },
      { parameter: "Chest (Male)", male: "81 - 86 CM (5 CM expansion mandatory)", female: "Not Applicable" },
      { parameter: "Running (800 Mtr)", male: "2 Min 45 Sec", female: "3 Min 40 Sec" },
      { parameter: "Shot Put (Gola Fek)", male: "19 Feet (7.26 Kg)", female: "15 Feet (4 Kg)" },
      { parameter: "Long Jump", male: "13 Feet", female: "10 Feet" }
    ],
    howToApplySteps: [
      "Step 1: Check eligibility criteria carefully from the official notification PDF.",
      "Step 2: Have active MP Rojgar Panjiyan (रोजगार पंजीयन) & Updated Candidate Profile ready.",
      "Step 3: Keep Aadhar linked with Mobile OTP, Samagra ID, 10th Marksheet, Domicile & Caste Certificate ready.",
      "Step 4: Send your documents on WhatsApp to Nitish Khobragade (8982324497) for secure, error-free form filling from home.",
      "Step 5: Review the form preview and pay the application fee.",
      "Step 6: Receive official computer acknowledgment receipt immediately on WhatsApp."
    ],
    requiredDocuments: [
      "आधार कार्ड (Aadhar Card)",
      "10वीं एवं 12वीं की अंकसूची (10th/12th Marksheet)",
      "मध्य प्रदेश का मूल निवासी प्रमाण पत्र (MP Domicile)",
      "जाति प्रमाण पत्र (SC/ST/OBC Caste Certificate)",
      "जीवित रोजगार पंजीयन क्रमांक (MP Rojgar Panjiyan)",
      "नवीनतम पासपोर्ट साइज फोटो (व्हाइट बैकग्राउंड)",
      "हस्ताक्षर एवं हस्तलिखित घोषणा पत्र (Declaration)"
    ],
    applyUrl: "https://esb.mponline.gov.in",
    notificationPdfUrl: "https://esb.mp.gov.in/Rulebooks/RB_2026/Police_Constable_2026_Rulebook.pdf",
    syllabusUrl: "https://esb.mp.gov.in/Syllabus/Police_2026_Syllabus.pdf",
    officialWebsiteUrl: "https://esb.mp.gov.in",
    serviceTagline: "घर बैठे 100% सुरक्षित फॉर्म भरने के लिए संपर्क करें: Nitish Khobragade - 8982324497"
  },
  {
    slug: "mp-ayush-ug-counselling",
    id: "job-2",
    title: "MP AYUSH UG (BAMS / BHMS / BUMS) Online Counselling 2026",
    shortTitle: "MP AYUSH UG Counselling 2026",
    department: "Directorate of AYUSH, Madhya Pradesh",
    advtNo: "AYUSH/Counselling/2026/UG",
    totalPosts: "State Quota AYUSH Seats",
    postDate: "18 September 2026",
    startDate: "18/09/2026",
    lastDate: "05/10/2026",
    lastDateFee: "05/10/2026",
    correctionDate: "07/10/2026",
    examDate: "NEET UG Scorecard Based",
    admitCardDate: "Allotment List: 12/10/2026",
    feeGeneral: "₹2,000/- (Counselling Registration Fee)",
    feeReserved: "₹2,000/- (Same for all categories)",
    feePortal: "₹150/- (Portal & Choice Filling Fee)",
    paymentMode: "Net Banking, Debit/Credit Card or UPI",
    minAge: "17 Years (as on 31 December 2026)",
    maxAge: "No Upper Age Limit (As per Supreme Court / NMC / NCISM orders)",
    ageCalculationDate: "31/12/2026",
    ageRelaxation: "As per NEET UG & MP Ayush Department rules.",
    state: "MP",
    category: "Health",
    qualificationSummary: "Candidate must have qualified NEET UG 2026 and passed 10+2 with Physics, Chemistry, Biology/Biotechnology and English with minimum 50% marks (40% for SC/ST/OBC).",
    vacanciesBreakdown: [
      {
        postName: "BAMS (Bachelor of Ayurvedic Medicine & Surgery)",
        total: "Govt & Private Colleges",
        eligibility: "NEET UG 2026 Qualified + PCB 50% in 12th + MP State Domicile"
      },
      {
        postName: "BHMS (Bachelor of Homeopathic Medicine & Surgery)",
        total: "Govt & Private Colleges",
        eligibility: "NEET UG 2026 Qualified + PCB 50% in 12th + MP State Domicile"
      },
      {
        postName: "BUMS (Bachelor of Unani Medicine & Surgery)",
        total: "State Quota Colleges",
        eligibility: "NEET UG 2026 Qualified + Urdu subject passed in 10th or 12th"
      }
    ],
    howToApplySteps: [
      "Step 1: Register on official AYUSH portal with NEET Roll No. and Application No.",
      "Step 2: Upload high-resolution scanned documents (NEET score card, 10th/12th marksheets, domicile, caste).",
      "Step 3: Pay the non-refundable registration fee of ₹2,000.",
      "Step 4: Complete Choice Filling and Locking for Preferred Ayurveda & Homeopathy colleges.",
      "Step 5: For hassle-free errorless choice filling and registration, contact Nitish Khobragade (8982324497).",
      "Step 6: Check Merit List and report to allotted college with original documents."
    ],
    requiredDocuments: [
      "NEET UG 2026 एडमिट कार्ड एवं स्कोर कार्ड",
      "10वीं एवं 12वीं की ओरिजिनल अंकसूची",
      "मध्य प्रदेश का डिजिटल मूल निवासी प्रमाण पत्र",
      "डिजिटल जाति प्रमाण पत्र (SC/ST/OBC/EWS)",
      "आय प्रमाण पत्र (Income Certificate)",
      "पासपोर्ट साइज फोटोग्राफ (NEET वाला)",
      "सीट आवंटन पत्र (Allotment Letter - After Result)"
    ],
    applyUrl: "https://ayush.mponline.gov.in",
    notificationPdfUrl: "https://ayush.mponline.gov.in/Portal/Services/Ayush/UG_Counselling_Guidelines_2026.pdf",
    officialWebsiteUrl: "https://ayush.mp.gov.in",
    serviceTagline: "घर बैठे आयुष काउंसलिंग चॉइस फिलिंग हेतु संपर्क करें: Nitish Khobragade - 8982324497"
  },
  {
    slug: "ssc-chsl-2026",
    id: "job-3",
    title: "SSC Combined Higher Secondary (10+2) Level CHSL Recruitment 2026",
    shortTitle: "SSC CHSL (10+2) 2026",
    department: "Staff Selection Commission (SSC Central Govt)",
    advtNo: "F.No. HQ-CHSL/2026",
    totalPosts: "3,712 Posts",
    postDate: "10 September 2026",
    startDate: "10/09/2026",
    lastDate: "28/09/2026",
    lastDateFee: "29/09/2026",
    correctionDate: "02/10/2026 to 03/10/2026",
    examDate: "Tier 1: November 2026 (Computer Based)",
    admitCardDate: "4 Days Before Exam",
    feeGeneral: "₹100/- (General, OBC, EWS Male)",
    feeReserved: "₹0/- (All Female, SC, ST, PwD, Ex-Servicemen exempted)",
    feePortal: "Nil (SSC Direct)",
    paymentMode: "Online via BHIM UPI, Net Banking, Credit or Debit Card",
    minAge: "18 Years",
    maxAge: "27 Years (Born not before 02-08-1999 and not later than 01-08-2008)",
    ageCalculationDate: "01/08/2026",
    ageRelaxation: "OBC: 3 Years, SC/ST: 5 Years, PwD: 10-15 Years relaxation.",
    state: "Central",
    category: "SSC/UPSC",
    qualificationSummary: "Candidates must have passed 12th Standard or equivalent examination from a recognized Board or University. For DEO Grade A in CAG: 12th with Science and Math.",
    vacanciesBreakdown: [
      {
        postName: "Lower Division Clerk (LDC) / Junior Secretariat Assistant (JSA)",
        total: "2,480 Posts",
        eligibility: "12th Class Pass + Typing speed of 35 wpm in English or 30 wpm in Hindi."
      },
      {
        postName: "Data Entry Operator (DEO / DEO Grade A)",
        total: "1,232 Posts",
        eligibility: "12th Standard Pass with Mathematics for CAG offices; 12th Pass for others."
      }
    ],
    howToApplySteps: [
      "Step 1: Open One Time Registration (OTR) on the official SSC portal (ssc.gov.in).",
      "Step 2: Take live webcam photo and upload signature (10KB - 20KB).",
      "Step 3: Select examination centers and educational qualifications.",
      "Step 4: Contact Nitish Khobragade (8982324497) to complete live-photo capture and error-free submission.",
      "Step 5: Pay online fee of ₹100 if applicable.",
      "Step 6: Download and save the finalized application form PDF."
    ],
    requiredDocuments: [
      "आधार कार्ड / वोटर आईडी कार्ड",
      "10वीं एवं 12वीं की मार्कशीट",
      "लाइव फोटो (Webcam capture in good lighting)",
      "हस्ताक्षर की जेपीजी फाइल (10 to 20 KB)",
      "ईमेल आईडी एवं मोबाइल नंबर (ओटीपी हेतु)"
    ],
    applyUrl: "https://ssc.gov.in",
    notificationPdfUrl: "https://ssc.gov.in/notice-modal/CHSL_2026_Notice.pdf",
    officialWebsiteUrl: "https://ssc.gov.in",
    serviceTagline: "एसएससी फॉर्म में लाइव फोटो व विवरण त्रुटि-मुक्त भरवाएं: Nitish Khobragade - 8982324497"
  },
  {
    slug: "railway-rrc-group-d",
    id: "job-4",
    title: "Railway RRC Group D (Level-1 Posts) CEN 02/2026 Recruitment",
    shortTitle: "Railway RRC Group D 2026",
    department: "Railway Recruitment Cell (Ministry of Railways, Govt of India)",
    advtNo: "CEN RRC 02/2026",
    totalPosts: "32,450 Posts",
    postDate: "12 September 2026",
    startDate: "15/09/2026",
    lastDate: "22/10/2026",
    lastDateFee: "24/10/2026",
    correctionDate: "28/10/2026",
    examDate: "January - February 2027 (CBT)",
    admitCardDate: "4 Days Prior to Exam",
    feeGeneral: "₹500/- (₹400 refundable after appearing in CBT)",
    feeReserved: "₹250/- (Full ₹250 refundable for SC/ST/Ex-SM/Female/EBC after CBT)",
    feePortal: "Bank transaction charges as applicable",
    paymentMode: "Online Payment via UPI, Internet Banking, Debit/Credit Card",
    minAge: "18 Years",
    maxAge: "33 Years",
    ageCalculationDate: "01/07/2026",
    ageRelaxation: "SC/ST: 5 Years, OBC-NCL: 3 Years, PwBD: 10 Years as per RRB rules.",
    state: "Central",
    category: "Railway",
    qualificationSummary: "Class 10th High School Pass from Recognized Board OR NCVT / SCVT ITI Certificate OR National Apprenticeship Certificate (NAC).",
    vacanciesBreakdown: [
      {
        postName: "Track Maintainer Grade IV",
        total: "14,800 Posts",
        eligibility: "10th Pass or ITI from institutions recognized by NCVT/SCVT"
      },
      {
        postName: "Assistant Pointsman (Traffic)",
        total: "6,200 Posts",
        eligibility: "10th Pass or ITI or equivalent NAC"
      },
      {
        postName: "Helper / Assistant (Electrical, Mechanical, S&T)",
        total: "11,450 Posts",
        eligibility: "10th Pass + ITI certificate in relevant trade"
      }
    ],
    howToApplySteps: [
      "Step 1: Check your RRB Zone wise vacancies and eligibility.",
      "Step 2: Fill personal details, community, category, and bank account for refund.",
      "Step 3: Upload signature and photograph conforming strictly to railway specifications.",
      "Step 4: Contact Nitish Khobragade (8982324497) for safe form filling and bank refund details entry.",
      "Step 5: Pay the fee and print the confirmation page."
    ],
    requiredDocuments: [
      "10वीं बोर्ड अंकसूची / आईटीआई प्रमाण पत्र",
      "बैंक पासबुक (शुल्क वापसी / Refund हेतु)",
      "आधार कार्ड (Aadhar Card)",
      "जाति प्रमाण पत्र (रेलवे फॉर्मेट में)",
      "पासपोर्ट साइज रंगीन फोटो एवं हस्ताक्षर"
    ],
    applyUrl: "https://www.rrbapply.gov.in",
    notificationPdfUrl: "https://indianrailways.gov.in/railwayboard/uploads/directorate/personnel/CEN_02_2026_GroupD.pdf",
    officialWebsiteUrl: "https://indianrailways.gov.in",
    serviceTagline: "रेलवे ग्रुप डी भर्ती फॉर्म सुरक्षित भरवाने के लिए संपर्क करें: Nitish Khobragade - 8982324497"
  },
  {
    slug: "ibps-po-clerk-2026",
    id: "job-5",
    title: "IBPS Probationary Officer (PO / MT XIV) Recruitment 2026",
    shortTitle: "IBPS PO / Clerk 2026",
    department: "Institute of Banking Personnel Selection (IBPS)",
    advtNo: "CRP PO/MT-XIV/2026-27",
    totalPosts: "4,455 Posts",
    postDate: "01 August 2026",
    startDate: "01/08/2026",
    lastDate: "30/09/2026",
    lastDateFee: "30/09/2026",
    correctionDate: "03/10/2026",
    examDate: "Prelims: October 2026 | Mains: November 2026",
    admitCardDate: "October 1st Week",
    feeGeneral: "₹850/- (General / OBC / EWS)",
    feeReserved: "₹175/- (SC / ST / PwD)",
    feePortal: "Nil",
    paymentMode: "Online through Master/Visa/RuPay Cards, Net Banking, UPI",
    minAge: "20 Years",
    maxAge: "30 Years",
    ageCalculationDate: "01/08/2026",
    ageRelaxation: "SC/ST: 5 Years, OBC-NCL: 3 Years, PwD: 10 Years.",
    state: "All India",
    category: "Banking",
    qualificationSummary: "A Degree (Graduation) in any discipline from a University recognized by the Govt. Of India or any equivalent qualification recognized by the Central Government.",
    vacanciesBreakdown: [
      {
        postName: "Probationary Officer / Management Trainee (Bank of Baroda, Canara, PNB, etc.)",
        total: "4,455 Posts",
        eligibility: "Bachelor's Degree in any stream with valid graduation passing marks."
      }
    ],
    howToApplySteps: [
      "Step 1: Go to IBPS official portal and click on CRP PO/MT XIV.",
      "Step 2: Register with Name, Mobile No. and Email.",
      "Step 3: Upload Left Thumb Impression and Hand-Written Declaration.",
      "Step 4: Complete Bank Preference list with guidance from Nitish Khobragade (8982324497).",
      "Step 5: Pay online fee and retain e-receipt."
    ],
    requiredDocuments: [
      "ग्रेजुएशन डिग्री / फाइनल ईयर मार्कशीट",
      "बाएं हाथ के अंगूठे का निशान (Left Thumb Impression)",
      "हस्तलिखित घोषणा पत्र (Handwritten Declaration)",
      "पासपोर्ट साइज फोटो एवं हस्ताक्षर"
    ],
    applyUrl: "https://ibps.in",
    notificationPdfUrl: "https://ibps.in/crp-po-mt-xiv-notification.pdf",
    officialWebsiteUrl: "https://ibps.in",
    serviceTagline: "बैंक फॉर्म एवं प्रेफरेंस लिस्ट सुरक्षित भरवाएं: Nitish Khobragade - 8982324497"
  }
];

// Helper to find job by slug or fallback gracefully
export function getJobDetailBySlug(slug: string): JobPostDetail {
  const normalized = (slug || '').toLowerCase().trim();
  const found = DETAILED_JOBS_LIST.find(
    (j) => j.slug.toLowerCase() === normalized || j.id.toLowerCase() === normalized
  );

  if (found) {
    return found;
  }

  // Generate a realistic structured fallback object for any arbitrary slug
  const titleFormatted = normalized
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return {
    slug: normalized,
    id: `job-${normalized}`,
    title: `${titleFormatted} Recruitment 2026`,
    shortTitle: titleFormatted,
    department: "Government Recruitment Board / Commission",
    advtNo: `ADV/${normalized.toUpperCase().slice(0, 6)}/2026`,
    totalPosts: "Various Vacancies",
    postDate: "September 2026",
    startDate: "01/09/2026",
    lastDate: "30/10/2026",
    lastDateFee: "30/10/2026",
    correctionDate: "05/11/2026",
    examDate: "Notified Soon",
    admitCardDate: "Before Exam",
    feeGeneral: "₹500/- (General/OBC)",
    feeReserved: "₹250/- (SC/ST/Reserved)",
    feePortal: "₹50/- Portal Charges",
    paymentMode: "Online Payment via Debit Card, Credit Card, Net Banking or UPI",
    minAge: "18 Years",
    maxAge: "35 Years",
    ageCalculationDate: "01/01/2026",
    ageRelaxation: "Age relaxation applicable as per Government Recruitment Rules.",
    state: normalized.includes('mp') ? 'MP' : 'Central',
    category: "Other",
    qualificationSummary: "Class 10th / 12th / Graduate from a recognized Board or University in India as per recruitment norms.",
    vacanciesBreakdown: [
      {
        postName: `${titleFormatted} Various Posts`,
        total: "Multiple Seats",
        eligibility: "Educational Qualification matching the official notification criteria."
      }
    ],
    howToApplySteps: [
      "Step 1: Check the detailed eligibility conditions and guidelines.",
      "Step 2: Collect essential documents including photo, signature, ID proof, and academic records.",
      "Step 3: Contact Nitish Khobragade (8982324497) for instant, error-free online submission from home.",
      "Step 4: Verify your details before final submission.",
      "Step 5: Receive official confirmation slip on WhatsApp."
    ],
    requiredDocuments: [
      "आधार कार्ड (Aadhar Card)",
      "शैक्षणिक योग्यता प्रमाण पत्र (Educational Certificates)",
      "जाति एवं मूल निवास प्रमाण पत्र (Caste & Domicile)",
      "पासपोर्ट साइज फोटो एवं हस्ताक्षर (Photo & Signature)",
      "सक्रिय मोबाइल नंबर एवं ईमेल आईडी"
    ],
    applyUrl: "https://mponline.gov.in",
    notificationPdfUrl: "https://mponline.gov.in",
    officialWebsiteUrl: "https://mponline.gov.in",
    serviceTagline: `घर बैठे 100% सुरक्षित फॉर्म भरने के लिए संपर्क करें: ${OWNER_INFO.name} - ${OWNER_INFO.phone}`
  };
}
