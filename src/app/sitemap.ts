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
  const baseUrl = 'https://npjobportal.com';
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
      url: `${baseUrl}/category/police`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
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

  return [...staticRoutes, ...staticJobRoutes, ...dynamicJobRoutes, ...dynamicBlogRoutes];
}
