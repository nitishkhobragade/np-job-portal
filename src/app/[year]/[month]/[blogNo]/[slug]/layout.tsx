import type { Metadata } from 'next';
import { DETAILED_JOBS_LIST, getJobDetailBySlug } from '../../../../../data/jobDetailsData';
import { db } from '../../../../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string; blogNo: string; slug: string }>;
}): Promise<Metadata> {
  const { year, month, blogNo, slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npjobportal.in';

  const staticJob = getJobDetailBySlug(slug) || DETAILED_JOBS_LIST.find((j) => j.slug === slug);

  let title = staticJob?.title;
  let department = staticJob?.department;
  let totalPosts = staticJob?.totalPosts;
  let qualification = staticJob?.qualificationSummary;
  let lastDate = staticJob?.lastDate;
  let state = staticJob?.state;

  if (!title) {
    try {
      const docRef = doc(db, 'posts', slug);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        title = data.title;
        department = data.dept;
        totalPosts = data.totalPosts ? String(data.totalPosts) : undefined;
        qualification = data.eligibility || data.qualification;
        lastDate = data.dates?.end || data.lastDate;
        state = data.state;
      } else {
        const postsRef = collection(db, 'posts');
        const q = query(postsRef, where('slug', '==', slug));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const data = querySnap.docs[0].data();
          title = data.title;
          department = data.dept;
          totalPosts = data.totalPosts ? String(data.totalPosts) : undefined;
          qualification = data.eligibility || data.qualification;
          lastDate = data.dates?.end || data.lastDate;
          state = data.state;
        }
      }
    } catch {
      // Fallback
    }
  }

  const cleanTitle = title || slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  const cleanDept = department || 'Government of Madhya Pradesh & Central Recruitment';
  const cleanPosts = totalPosts || 'विज्ञप्ति अनुसार';
  const cleanLastDate = lastDate || 'शीघ्र देखें';
  const cleanQual = qualification || '10वीं / 12वीं / स्नातक / डिप्लोमा';

  const pageTitle = `${cleanTitle} – Apply Online, Notification PDF | NP Job Portal`;
  const pageDescription = `${cleanTitle} (${cleanDept}). कुल पद: ${cleanPosts}. योग्यता: ${cleanQual}. अंतिम तिथि: ${cleanLastDate}. ऑनलाइन फॉर्म भरने हेतु NP Job Portal देखें।`;
  const canonicalUrl = `${baseUrl}/${year}/${month}/${blogNo}/${slug}`;

  const allKeywords = [
    cleanTitle,
    `${cleanTitle} 2026`,
    `${cleanTitle} online form`,
    cleanDept,
    state ? `${state} Govt Jobs` : 'MP Govt Jobs',
    'npjobportal',
    'npjobportal.in',
    'latest jobs',
    'latest vacancy',
    'nponline',
    'nponline cafe',
    'latest admit card',
    'online result',
    'latest job',
    'mponline apply',
    'banking jobs',
    'fresher jobs',
    'freejobalert',
    'sarkarijob',
    'sarkari result'
  ];

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: allKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'NP Job Portal',
      type: 'article',
      locale: 'hi_IN',
      images: [
        {
          url: 'https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png',
          width: 416,
          height: 416,
          alt: cleanTitle
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: ['https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png'],
      creator: '@NitishKhobragade',
    },
  };
}

export default function YearMonthBlogSlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
