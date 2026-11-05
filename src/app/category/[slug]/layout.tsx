import type { Metadata } from 'next';

const CATEGORY_META: Record<
  string,
  { title: string; desc: string; keywords: string[] }
> = {
  'latest-jobs': {
    title: 'Latest Jobs 2026 – MP & Central Govt Recruitment Online Forms | NP Job Portal',
    desc: 'मध्य प्रदेश एवं केंद्र सरकार की सभी नवीनतम सरकारी भर्तियां (Latest Jobs 2026). MPESB व्यापम, SSC, रेलवे, पुलिस, बैंकिंग व टीचिंग जॉब्स के ऑनलाइन फॉर्म, नोटिफिकेशन व अंतिम तिथि।',
    keywords: [
      'latest jobs',
      'latest vacancy',
      'latest job',
      'npjobportal',
      'np job portal',
      'nponline',
      'nponline cafe',
      'sarkarijob',
      'sarkari result',
      'sarkari result mp',
      'freejobalert',
      'mponline apply',
      'mp govt jobs 2026',
      'central govt jobs'
    ]
  },
  'admit-card': {
    title: 'Latest Admit Card 2026 – Hall Ticket, Call Letter Download Direct Links | NP Job Portal',
    desc: 'सरकारी परीक्षाओं के एडमिट कार्ड (Admit Card 2026). MP Police, MPESB, SSC CGL/CHSL/GD, Railway RRB, UPSC, IBPS के प्रवेश पत्र सीधे लिंक से डाउनलोड करें।',
    keywords: [
      'latest admit card',
      'admit card 2026',
      'hall ticket download',
      'call letter download',
      'npjobportal admit card',
      'mp police admit card',
      'mpesb admit card',
      'ssc admit card',
      'railway admit card'
    ]
  },
  'results': {
    title: 'Online Result 2026 – Sarkari Exam Results, Cutoff Marks & Merit List | NP Job Portal',
    desc: 'सरकारी परीक्षाओं के ऑनलाइन परीक्षा परिणाम (Online Results 2026). MP व्यापम, SSC, UPSC, बैंक, रेलवे एवं राज्य परीक्षाओं के रिजल्ट, कट-ऑफ व मेरिट लिस्ट सबसे पहले।',
    keywords: [
      'online result',
      'onlne result',
      'sarkari result',
      'sarkari result mp',
      'npjobportal result',
      'mpesb result',
      'exam result 2026',
      'cutoff marks merit list'
    ]
  },
  'mp-special': {
    title: 'MP Special Govt Jobs 2026 – MPESB व्यापम, MP Police, पटवारी, संविदा शिक्षक | NP Job Portal',
    desc: 'मध्य प्रदेश विशेष सरकारी नौकरियां (MP Special Jobs 2026). MPESB पुलिस आरक्षक, सब-इंस्पेक्टर, पटवारी, जेल प्रहरी, वनरक्षक, ग्रुप 4 व महिला पर्यवेक्षक भर्ती।',
    keywords: [
      'mp special jobs',
      'mpesb vacancy 2026',
      'mp vyapam vacancy',
      'mp police bharti',
      'mp patwari',
      'mponline apply',
      'nponline',
      'nponline cafe',
      'npjobportal mp special'
    ]
  },
  'tech-jobs': {
    title: 'Tech Jobs & IT Careers 2026 – Software Engineer, Developer, Fresher Hiring | NP Job Portal',
    desc: 'सॉफ्टवेयर इंजीनियर, डेवलपर, डेटा एनालिस्ट एवं आईटी फ्रेशर्स व अनुभवी पेशेवरों हेतु नवीनतम टेक जॉब्स (Tech Jobs 2026). TCS, Infosys, Wipro, Google, Startup भर्तियां।',
    keywords: [
      'tech jobs',
      'fresher jobs',
      'it jobs 2026',
      'software engineer vacancy',
      'remote tech jobs',
      'npjobportal tech'
    ]
  },
  'banking': {
    title: 'Banking Jobs 2026 – IBPS PO, Clerk, SBI, RBI, NABARD Bank Recruitment | NP Job Portal',
    desc: 'बैंक भर्ती 2026 (Banking Jobs). IBPS PO, Clerk, SO, SBI PO/Clerk, RRB ग्रामीण बैंक एवं RBI में नवीनतम सरकारी बैंक नौकरियों के ऑनलाइन फॉर्म एवं परीक्षा अपडेट।',
    keywords: [
      'banking jobs',
      'bank recruitment 2026',
      'ibps po clerk online form',
      'sbi po clerk vacancy',
      'rbi vacancy',
      'npjobportal banking'
    ]
  },
  'police': {
    title: 'Police Jobs 2026 – MP Police, SSC GD, Delhi Police, SI & Constable Bharti | NP Job Portal',
    desc: 'पुलिस भर्ती 2026 (Police Jobs). MP Police आरक्षक, SI, दिल्ली पुलिस, SSC GD कांस्टेबल, RPF व राज्य पुलिस बलों में शारीरिक दक्षता, योग्यता व ऑनलाइन आवेदन।',
    keywords: [
      'police jobs 2026',
      'mp police constable bharti',
      'ssc gd constable',
      'delhi police vacancy',
      'sub inspector recruitment'
    ]
  },
  'railway': {
    title: 'Railway RRB Jobs 2026 – NTPC, Group D, ALP, Technician, RPF Recruitment | NP Job Portal',
    desc: 'भारतीय रेलवे भर्ती (Railway RRB Jobs 2026). RRB NTPC, Group D, ALP, तकनीशियन, जूनियर इंजीनियर व RPF कांस्टेबल/SI के ऑनलाइन फॉर्म व परीक्षा तिथियां।',
    keywords: [
      'railway jobs 2026',
      'rrb ntpc online form',
      'railway group d vacancy',
      'rrb alp technician',
      'rpf vacancy'
    ]
  },
  'ssc-upsc': {
    title: 'SSC & UPSC Recruitment 2026 – CGL, CHSL, MTS, CPO, NDA, CDS, Civil Services | NP Job Portal',
    desc: 'SSC एवं UPSC सरकारी भर्ती 2026. SSC CGL, CHSL, MTS, GD, CPO SI एवं UPSC IAS/IPS सिविल सेवा, NDA, CDS के ऑफिशियल नोटिफिकेशन एवं ऑनलाइन आवेदन।',
    keywords: [
      'ssc jobs 2026',
      'ssc cgl chsl mts form',
      'upsc civil services',
      'nda cds exam',
      'sarkarijob'
    ]
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npjobportal.in';
  const normSlug = slug.toLowerCase();

  const meta = CATEGORY_META[normSlug] || {
    title: `${slug.toUpperCase()} Recruitment 2026 – Online Forms & Updates | NP Job Portal`,
    desc: `सरकारी भर्ती एवं परीक्षा अपडेट ${slug} 2026. NP Job Portal पर ऑनलाइन आवेदन, नोटिफिकेशन, सिलेबस व एडमिट कार्ड चेक करें।`,
    keywords: [
      slug,
      `${slug} 2026`,
      'npjobportal',
      'np job portal',
      'latest jobs',
      'latest vacancy',
      'sarkarijob',
      'sarkari result'
    ]
  };

  const canonicalUrl = `${baseUrl}/category/${normSlug}`;

  const defaultKeywords = [
    'npjobportal',
    'npjobportal.in',
    'np job portal',
    'NP JOB PORTAL',
    'latest jobs',
    'latest vacancy',
    'nponline',
    'nponline cafe',
    'latest admit card',
    'online result',
    'onlne result',
    'latest job',
    'mponline apply',
    'banking jobs',
    'fresher jobs',
    'freejobalert',
    'sarkarijob',
    'sarkari result',
    'sarkari result mp',
    'nitish khobragade',
    'ntechbay balaghat'
  ];

  return {
    title: meta.title,
    description: meta.desc,
    keywords: Array.from(new Set([...meta.keywords, ...defaultKeywords])),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: meta.title,
      description: meta.desc,
      url: canonicalUrl,
      siteName: 'NP Job Portal',
      type: 'website',
      locale: 'hi_IN',
      images: [
        {
          url: 'https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png',
          width: 416,
          height: 416,
          alt: meta.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.desc,
      images: ['https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png'],
      creator: '@NitishKhobragade',
    },
  };
}

export default function CategoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
