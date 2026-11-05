import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://npjobportal.vercel.app';
  const baseUrl = rawUrl.replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
