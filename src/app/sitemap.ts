import { MetadataRoute } from 'next';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DETAILED_JOBS_LIST } from '../data/jobDetailsData';

function parseSafeDate(val: unknown, fallback: Date): Date {
  if (!val) return fallback;
  if (typeof val === 'number') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d;
  }
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? fallback : d;
  }
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    try {
      const d = (val as { toDate: () => Date }).toDate();
      return isNaN(d.getTime()) ? fallback : d;
    } catch {
      return fallback;
    }
  }
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    const d = new Date((val as { seconds: number }).seconds * 1000);
    return isNaN(d.getTime()) ? fallback : d;
  }
  return fallback;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npjobportal.in';
  const now = new Date();

  // Static Key Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${baseUrl}/blogs`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    // Category Pages
    {
      url: `${baseUrl}/category/latest-jobs`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/mp-special`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/tech-jobs`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/ssc-upsc`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.88,
    },
    {
      url: `${baseUrl}/category/admit-card`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/results`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/category/answer-keys`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/syllabus`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/category/admission`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/police`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/teaching`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/railway`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/ssc`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/upsc`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/category/banking`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    // Individual Government Tools Deep Links
    {
      url: `${baseUrl}/tools?tool=photo-resizer`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.92,
    },
    {
      url: `${baseUrl}/tools?tool=smart-passport-maker`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.92,
    },
    {
      url: `${baseUrl}/tools?tool=printable-photo-sheet`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.92,
    },
    {
      url: `${baseUrl}/tools?tool=name-date-photo`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools?tool=signature-resizer`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools?tool=image-increaser`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-compress`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.92,
    },
    {
      url: `${baseUrl}/tools?tool=convert-to-pdf`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-merge`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.88,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-split-unlock`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.88,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-rearrange`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-remove-pages`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-to-images`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=word-to-pdf`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=pdf-to-word`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=ocr-word`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=image-joiner`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=format-converter`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=document-enhancer`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tools?tool=age-calculator`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // Institutional & Legal Pages
    {
      url: `${baseUrl}/about-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms-conditions`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Static Job Detail Pages
  const staticJobRoutes: MetadataRoute.Sitemap = DETAILED_JOBS_LIST.map((job) => ({
    url: `${baseUrl}/jobs/${job.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  // Dynamic Posts from Firestore
  let dynamicJobRoutes: MetadataRoute.Sitemap = [];
  let dynamicBlogRoutes: MetadataRoute.Sitemap = [];

  try {
    const postsRef = collection(db, 'posts');
    const postsQuery = query(postsRef, where('status', '==', 'published'));
    const postsSnap = await getDocs(postsQuery);

    dynamicJobRoutes = postsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const slug = data.slug || docSnap.id;
      return {
        url: `${baseUrl}/jobs/${slug}`,
        lastModified: parseSafeDate(data.updatedAt || data.publishedAt, now),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      };
    });
  } catch {
    // Graceful fallback to static list if Firestore read fails
  }

  try {
    const blogsRef = collection(db, 'blogs');
    const blogsQuery = query(blogsRef, where('status', '==', 'published'));
    const blogsSnap = await getDocs(blogsQuery);

    dynamicBlogRoutes = blogsSnap.docs.map((docSnap) => {
      const data = docSnap.data();
      const slug = data.slug || docSnap.id;
      return {
        url: `${baseUrl}/blogs/${slug}`,
        lastModified: parseSafeDate(data.updatedAt || data.publishedAt, now),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      };
    });
  } catch {
    // Graceful fallback
  }

  // Deduplicate URLs to ensure 100% compliant sitemap
  const urlMap = new Map<string, MetadataRoute.Sitemap[number]>();
  for (const item of [...staticRoutes, ...staticJobRoutes, ...dynamicJobRoutes, ...dynamicBlogRoutes]) {
    urlMap.set(item.url, item);
  }

  return Array.from(urlMap.values());
}
