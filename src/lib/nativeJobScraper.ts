/**
 * Native High-Speed Recruitment HTML & Pattern Scraper Engine
 * 100% Lifetime Free — Zero API Quota Dependency
 * Parses Indian Government & Corporate recruitment notices from HTML directly.
 */

export interface NativeScrapedJob {
  recordType: 'job_vacancy' | 'admit_card' | 'result_answerkey' | 'notification_corrigendum';
  title: string;
  shortTitle: string;
  dept: string;
  category: 'mp-special' | 'latest-jobs' | 'tech-jobs' | 'admit-card' | 'results' | 'central';
  categories: string[];
  state: 'MP' | 'Central' | 'All India';
  totalPosts: string;
  qualification: string;
  eligibility: string;
  startDate: string;
  lastDate: string;
  lastDateFee: string;
  examDate: string;
  admitCardDate: string;
  feeGeneral: string;
  feeReserved: string;
  feePortal: string;
  paymentMode: string;
  minAge: string;
  maxAge: string;
  ageRelaxation: string;
  showReservationSection: boolean;
  isTechJob: boolean;
  description: string;
  roleOverview: string;
  selectionProcessText: string;
  applyUrl: string;
  notificationPdfUrl: string;
  officialSite: string;
  status: 'draft';
  isPublished: false;
  verificationTag: string;
  groundingSources: Array<{ title: string; url: string }>;
}

/**
 * Decodes common HTML entities and strips unwanted whitespace
 */
function cleanHtmlString(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#8377;/gi, '₹')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts a human-friendly title from a URL path
 */
function titleFromUrlSlug(url: string): string {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = parts.pop() || '';
    const clean = lastPart
      .replace(/\.(html?|php|aspx?|pdf)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b(online|form|recruitment|vacancy|bharti|post)\b/gi, '')
      .trim();

    if (clean.length > 5) {
      return clean
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
  } catch {
    // Ignore URL parse error
  }
  return 'सरकारी भर्ती 2026 (Recruitment Notice)';
}

/**
 * Main Native Parser for Recruitment Webpages (SarkariResult, MPESB, MPOnline, State PSCs, SSC, Tech Jobs)
 */
export function parseRecruitmentHtml(rawHtml: string, sourceUrl: string): NativeScrapedJob {
  const cleanText = cleanHtmlString(rawHtml);

  // 1. EXTRACT TITLE
  let title = '';
  // Check <title> tag
  const titleTagMatch = rawHtml.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTagMatch && titleTagMatch[1]) {
    title = cleanHtmlString(titleTagMatch[1])
      .replace(/[\s\-|–]+(sarkari\s*result|freejobalert|sarkariresult\.com|vacancy update mp|mp vacancy|newsjobmp)[\s\S]*/i, '')
      .trim();
  }

  // Check <h1> tag if title is empty or too short
  if (!title || title.length < 8) {
    const h1Match = rawHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = cleanHtmlString(h1Match[1]);
    }
  }

  if (!title || title.length < 8) {
    title = titleFromUrlSlug(sourceUrl);
  }

  // Short Title (under 30 chars)
  const shortTitle = title.replace(/\b(recruitment|online form|notification|vacancy|bharti)\b/gi, '').trim().slice(0, 30).trim() || title.slice(0, 30);

  // 2. EXTRACT DEPARTMENT
  let dept = 'मध्य प्रदेश शासन / संबंधित भर्ती बोर्ड';
  if (/mpesb|vyapam|esb\.mp/i.test(cleanText) || /esb\.mp\.gov\.in/i.test(sourceUrl)) {
    dept = 'Madhya Pradesh Employees Selection Board (MPESB Bhopal)';
  } else if (/mppsc/i.test(cleanText) || /mppsc\.mp\.gov\.in/i.test(sourceUrl)) {
    dept = 'Madhya Pradesh Public Service Commission (MPPSC Indore)';
  } else if (/mp\s*police|police\.mp/i.test(cleanText)) {
    dept = 'Madhya Pradesh Police Department (MP Police)';
  } else if (/ssc\.gov\.in|staff selection commission|ssc cgl|ssc chsl|ssc gd|ssc mts/i.test(cleanText)) {
    dept = 'Staff Selection Commission (SSC New Delhi)';
  } else if (/upsc\.gov\.in|union public service commission|civil services|nda|cds/i.test(cleanText)) {
    dept = 'Union Public Service Commission (UPSC)';
  } else if (/railway|rrb|railway recruitment board|rrc/i.test(cleanText)) {
    dept = 'Railway Recruitment Board (Indian Railways RRB)';
  } else if (/ibps|banking|sbi\b|reserve bank of india|rbi\b/i.test(cleanText)) {
    dept = 'Institute of Banking Personnel Selection (IBPS / Bank)';
  } else if (/high court|mphc/i.test(cleanText)) {
    dept = 'High Court of Madhya Pradesh (MPHC Jabalpur)';
  } else if (/tcs\b|infosys\b|wipro\b|cognizant\b|tech mahindra\b/i.test(cleanText)) {
    dept = 'Corporate IT / Technology Hiring';
  }

  // 3. EXTRACT TOTAL POSTS / VACANCIES
  let totalPosts = 'विज्ञप्ति अनुसार';
  const postPatterns = [
    /(?:total\s*vacancy|total\s*post|कुल\s*पद|vacancies|no\.\s*of\s*post)[\s:–-]*([0-9,]+)\s*(?:posts?|पद)?/i,
    /([0-9,]+)\s*(?:posts?|पद|vacancies)\b/i,
    /([0-9,]+)\s*vacancy/i
  ];
  for (const pat of postPatterns) {
    const m = cleanText.match(pat);
    if (m && m[1]) {
      const num = m[1].replace(/,/g, '').trim();
      if (parseInt(num, 10) > 0 && parseInt(num, 10) < 1000000) {
        totalPosts = `${num} पद (Posts)`;
        break;
      }
    }
  }

  // 4. EXTRACT IMPORTANT DATES (dd/mm/yyyy or similar)
  let startDate = '';
  let lastDate = '';
  let lastDateFee = '';
  let examDate = 'शीघ्र घोषित';
  let admitCardDate = 'परीक्षा से 7 दिन पूर्व';

  // Start Date
  const startMatch = cleanText.match(/(?:application\s*begin|start\s*date|online\s*start|आवेदन\s*प्रारंभ|आवेदन\s*शुरू)[\s:–-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4})/i);
  if (startMatch && startMatch[1]) {
    startDate = startMatch[1].replace(/[\.-]/g, '/');
  }

  // Last Date
  const lastMatch = cleanText.match(/(?:last\s*date\s*(?:for\s*apply)?|online\s*end|अंतिम\s*तिथि|समाप्ति\s*तिथि)[\s:–-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4})/i);
  if (lastMatch && lastMatch[1]) {
    lastDate = lastMatch[1].replace(/[\.-]/g, '/');
  }

  // Last Date for Fee
  const feeLastMatch = cleanText.match(/(?:pay\s*exam\s*fee\s*last\s*date|fee\s*last\s*date|शुल्क\s*भुगतान\s*अंतिम)[\s:–-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4})/i);
  if (feeLastMatch && feeLastMatch[1]) {
    lastDateFee = feeLastMatch[1].replace(/[\.-]/g, '/');
  } else if (lastDate) {
    lastDateFee = lastDate;
  }

  // Exam Date
  const examMatch = cleanText.match(/(?:exam\s*date|परीक्षा\s*तिथि)[\s:–-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4}|[A-Za-z]+\s*202[0-9]|as\s*per\s*schedule|शीघ्र\s*घोषित)/i);
  if (examMatch && examMatch[1]) {
    examDate = examMatch[1].trim();
  }

  // Admit card
  const admitMatch = cleanText.match(/(?:admit\s*card\s*available|प्रवेश\s*पत्र)[\s:–-]*([0-9]{1,2}[\/\.-][0-9]{1,2}[\/\.-][0-9]{2,4}|before\s*exam|notified\s*soon|परीक्षा\s*से\s*पूर्व)/i);
  if (admitMatch && admitMatch[1]) {
    admitCardDate = admitMatch[1].trim();
  }

  // If start or last date not found, fallback to reasonable default
  const today = new Date();
  const todayFormatted = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  if (!startDate) startDate = todayFormatted;
  if (!lastDate) {
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    lastDate = `${String(nextMonth.getDate()).padStart(2, '0')}/${String(nextMonth.getMonth() + 1).padStart(2, '0')}/${nextMonth.getFullYear()}`;
  }
  if (!lastDateFee) lastDateFee = lastDate;

  // 5. EXTRACT APPLICATION FEE
  let feeGeneral = '₹500/-';
  let feeReserved = '₹250/-';

  const genFeeMatch = cleanText.match(/(?:general\s*(?:\/\s*obc)?|gen\s*(?:\/\s*ews)?|सामान्य)[\s:–-]*(?:rs\.?|inr|₹)?\s*([0-9]+)/i);
  if (genFeeMatch && genFeeMatch[1]) {
    feeGeneral = `₹${genFeeMatch[1]}/-`;
  } else if (/no\s*fee|exempted|निःशुल्क/i.test(cleanText)) {
    feeGeneral = 'निःशुल्क (Nil)';
  }

  const resFeeMatch = cleanText.match(/(?:sc\s*(?:\/\s*st)?|आरक्षित\s*वर्ग)[\s:–-]*(?:rs\.?|inr|₹)?\s*([0-9]+)/i);
  if (resFeeMatch && resFeeMatch[1]) {
    feeReserved = `₹${resFeeMatch[1]}/-`;
  } else if (feeGeneral === 'निःशुल्क (Nil)') {
    feeReserved = 'निःशुल्क (Nil)';
  }

  // 6. EXTRACT AGE LIMIT
  let minAge = '18 वर्ष';
  let maxAge = '40 वर्ष';

  const minAgeMatch = cleanText.match(/(?:min(?:imum)?\s*age|न्यूनतम\s*आयु)[\s:–-]*([0-9]{1,2})\s*(?:years?|वर्ष)?/i);
  if (minAgeMatch && minAgeMatch[1]) {
    minAge = `${minAgeMatch[1]} वर्ष`;
  }

  const maxAgeMatch = cleanText.match(/(?:max(?:imum)?\s*age|अधिकतम\s*आयु)[\s:–-]*([0-9]{1,2})\s*(?:years?|वर्ष)?/i);
  if (maxAgeMatch && maxAgeMatch[1]) {
    maxAge = `${maxAgeMatch[1]} वर्ष`;
  }

  // 7. EXTRACT ELIGIBILITY / QUALIFICATION
  let eligibility = '10वीं / 12वीं अथवा संबंधित विषय में स्नातक / डिप्लोमा उत्तीर्ण (विस्तृत अधिसूचना देखें)';
  const qualSnippets: string[] = [];

  if (/10th|high\s*school|10वीं/i.test(cleanText)) qualSnippets.push('10वीं हाईस्कूल');
  if (/12th|intermediate|10\+2|12वीं/i.test(cleanText)) qualSnippets.push('12वीं इंटरमीडिएट (10+2)');
  if (/bachelor|graduate|degree|स्नातक/i.test(cleanText)) qualSnippets.push('किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation)');
  if (/diploma|पॉलीटेक्निक/i.test(cleanText)) qualSnippets.push('संबंधित विषय में डिप्लोमा (Diploma)');
  if (/iti\b|आईटीआई/i.test(cleanText)) qualSnippets.push('संबंधित ट्रेड में ITI प्रमाण पत्र');
  if (/b\.?e|b\.?tech|computer\s*science|mca/i.test(cleanText)) qualSnippets.push('B.E. / B.Tech / BCA / MCA');
  if (/cpct\b/i.test(cleanText)) qualSnippets.push('मध्य प्रदेश CPCT स्कोर कार्ड');
  if (/bed\b|b\.ed|d\.el\.ed|tet\b/i.test(cleanText)) qualSnippets.push('B.Ed / D.El.Ed / शिक्षक पात्रता परीक्षा');

  if (qualSnippets.length > 0) {
    eligibility = qualSnippets.join(' • ');
  }

  // 8. EXTRACT OFFICIAL LINKS FROM HTML TAGS
  let applyUrl = sourceUrl;
  let notificationPdfUrl = sourceUrl;
  let officialSite = sourceUrl;

  // Search <a> tags for Apply Online
  const applyLinkMatch = rawHtml.match(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  if (applyLinkMatch) {
    for (const aTag of applyLinkMatch) {
      const hrefMatch = aTag.match(/href=["'](https?:\/\/[^"']+)["']/i);
      const textMatch = aTag.match(/>([\s\S]*?)<\/a>/i);
      if (hrefMatch && textMatch) {
        const href = hrefMatch[1];
        const linkText = cleanHtmlString(textMatch[1]).toLowerCase();

        // Apply Online link
        if (/apply\s*online|click\s*here|पंजीकरण|आवेदन\s*करें|registration/i.test(linkText) && !/notification|pdf|syllabus/i.test(linkText)) {
          if (!href.includes('google.com') && !href.includes('t.me') && !href.includes('whatsapp')) {
            applyUrl = href;
          }
        }
        // Notification PDF link
        if (/notification|rulebook|विज्ञापन|अधिसूचना|download\s*pdf/i.test(linkText) || href.toLowerCase().endsWith('.pdf')) {
          if (!href.includes('t.me') && !href.includes('whatsapp')) {
            notificationPdfUrl = href;
          }
        }
        // Official Website link
        if (/official\s*website|मुख्य\s*वेबसाइट|विभागीय\s*पोर्टल/i.test(linkText)) {
          officialSite = href;
        }
      }
    }
  }

  // 9. CATEGORY & STATE DETECTION
  let category: NativeScrapedJob['category'] = 'latest-jobs';
  let state: NativeScrapedJob['state'] = 'All India';
  const categories: string[] = ['vacancy'];
  let isTechJob = false;

  if (/mp\b|madhya\s*pradesh|bhopal|indore|vyapam|esb|mppsc/i.test(cleanText) || /esb\.mp\.gov\.in/i.test(sourceUrl)) {
    category = 'mp-special';
    state = 'MP';
    categories.push('mp_special');
  }

  if (/police|constable|sub\s*inspector|daroga|आरक्षक|उप\s*निरीक्षक/i.test(cleanText)) {
    categories.push('police');
    if (category !== 'mp-special') category = 'police' as never;
  } else if (/railway|rrb|rrc|ntpc|alp\b|loco\s*pilot/i.test(cleanText)) {
    categories.push('railway');
    state = 'Central';
  } else if (/ssc\b|cgl|chsl|mts|upsc|ias\b|ips\b/i.test(cleanText)) {
    categories.push('central');
    state = 'Central';
  } else if (/bank\b|ibps|sbi|rbi|clerk|po\b/i.test(cleanText)) {
    categories.push('banking');
    state = 'All India';
  } else if (/teacher|shikshak|samvida|tet\b|tgt|pgt/i.test(cleanText)) {
    categories.push('teaching');
  } else if (/software|developer|it\s*jobs|tech\s*jobs|frontend|backend|cloud/i.test(cleanText)) {
    category = 'tech-jobs';
    isTechJob = true;
    categories.push('tech');
  }

  // 10. RECORD TYPE
  let recordType: NativeScrapedJob['recordType'] = 'job_vacancy';
  if (/admit\s*card|hall\s*ticket|प्रवेश\s*पत्र/i.test(title)) {
    recordType = 'admit_card';
    category = 'admit-card';
  } else if (/result|score\s*card|परिणाम|merit\s*list/i.test(title)) {
    recordType = 'result_answerkey';
    category = 'results';
  }

  // 11. RICH HINDI DESCRIPTION
  const description = `${title} (${dept}): कुल ${totalPosts} के लिए आधिकारिक विज्ञापन जारी कर दिया गया है। योग्य एवं इच्छुक उम्मीदवार ऑनलाइन आवेदन की अंतिम तिथि ${lastDate} तक अपना आवेदन पत्र सबमिट कर सकते हैं। आवेदन करने हेतु न्यूनतम शैक्षणिक योग्यता ${eligibility} निर्धारित की गई है। विस्तृत दिशा-निर्देश, नियम पुस्तिका एवं सिलेबस संबंधी जानकारी NP Job Portal पर उपलब्ध है।`;

  const roleOverview = `इस भर्ती अभियान के तहत चयनित उम्मीदवारों को ${dept} के विभिन्न कार्यालयों एवं संभागों में पदस्थ किया जाएगा। नियमानुसार वेतनमान, महंगाई भत्ता एवं अन्य शासकीय सुविधाएं देय होंगी।`;

  const selectionProcessText = 'ऑनलाइन लिखित परीक्षा (CBT) -> शारीरिक दक्षता परीक्षण (PET/PST - यदि लागू हो) -> दस्तावेज सत्यापन (DV) -> अंतिम मेरिट सूची';

  return {
    recordType,
    title,
    shortTitle,
    dept,
    category,
    categories,
    state,
    totalPosts,
    qualification: eligibility,
    eligibility,
    startDate,
    lastDate,
    lastDateFee,
    examDate,
    admitCardDate,
    feeGeneral,
    feeReserved,
    feePortal: '₹60/- (पोर्टल शुल्क)',
    paymentMode: 'Online Net Banking, Debit/Credit Card, UPI, MP Online Kiosk',
    minAge,
    maxAge,
    ageRelaxation: 'मध्य प्रदेश शासन / भारत सरकार के नियमानुसार आरक्षित वर्गों (SC/ST/OBC) को अधिकतम आयु में 5 वर्ष की छूट',
    showReservationSection: true,
    isTechJob,
    description,
    roleOverview,
    selectionProcessText,
    applyUrl,
    notificationPdfUrl,
    officialSite,
    status: 'draft',
    isPublished: false,
    verificationTag: '100% Lifetime Free Native Extraction Engine',
    groundingSources: [{ title: dept, url: sourceUrl }]
  };
}

/**
 * Universal safe webpage fetcher with realistic headers & 8-second timeout
 */
export async function fetchRecruitmentUrlSafely(url: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7',
        'Accept-Language': 'hi,en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    return html;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`Direct fetch to ${url} warning:`, (err as Error).message);
    return '';
  }
}
