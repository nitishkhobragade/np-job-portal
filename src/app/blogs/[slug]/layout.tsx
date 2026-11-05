import type { Metadata } from 'next';
import { db } from '../../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npjobportal.in';

  let title: string | undefined;
  let summary: string | undefined;
  let category: string | undefined;
  let author: string | undefined;

  try {
    const docRef = doc(db, 'blogs', slug);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      title = data.title;
      summary = data.summary || data.description || data.excerpt;
      category = data.category;
      author = data.author;
    } else {
      const blogsRef = collection(db, 'blogs');
      const q = query(blogsRef, where('slug', '==', slug));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        const data = querySnap.docs[0].data();
        title = data.title;
        summary = data.summary || data.description || data.excerpt;
        category = data.category;
        author = data.author;
      }
    }
  } catch {
    // Graceful fallback
  }

  const cleanTitle = title || slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
  const pageTitle = `${cleanTitle} – Sarkari Exam Guide & Career Insights | NP Job Portal`;
  const pageDescription = summary || `${cleanTitle}. सरकारी परीक्षा तैयारी, सिलेबस, एडमिट कार्ड एवं करियर मार्गदर्शन संबंधी विस्तृत ब्लॉग पढ़ें NP Job Portal (npjobportal.in) पर।`;
  const canonicalUrl = `${baseUrl}/blogs/${slug}`;

  const keywords = [
    cleanTitle,
    category || 'Govt Jobs Preparation',
    'npjobportal blog',
    'npjobportal.in',
    'sarkari exam preparation',
    'latest jobs guidance',
    'sarkari result update',
    'nponline',
    'nponline cafe',
    'freejobalert',
    'nitish khobragade'
  ];

  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
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
      creator: author || '@NitishKhobragade',
    },
  };
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
