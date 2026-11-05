import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Govt Form Tools Suite – Photo Resizer, Image Compressor in KB, PDF Compressor, Sheet Maker | NP Job Portal',
  description: '100% Free & Private Online Tools for MP Online, SSC, UPSC, Railway & Banking forms: Passport Size Photo Maker with Date & Name, 300 DPI A4/4x6 Photo Sheet Generator, Image Compressor in KB (20KB, 50KB, 100KB), Signature Resizer (10-20KB), PDF Compress under 200KB, PDF Merge, Split & Age Calculator.',
  keywords: [
    'image compressor in kb',
    'image compressor 20kb 25kb 50kb 100kb',
    'reduce image size to 20kb 50kb online',
    'increase image size to 20kb 50kb online',
    'image size increaser in kb',
    'photo resizer in kb for ssc mpesb upsc',
    'signature resizer online 10kb to 20kb',
    'passport photo maker online',
    'printable photo sheet generator a4 4x6 300 dpi',
    'name and date on photo online for vyapam ssc',
    'photo signature joiner online for mponline ssc',
    'pdf compressor under 200kb for sarkari form',
    'compress pdf to 100kb online free',
    'pdf merge split unlock free',
    'convert word to pdf free',
    'pdf to word converter online',
    'age calculator for sarkari exam',
    'npjobportal',
    'npjobportal.in',
    'np job portal',
    'NP JOB PORTAL',
    'nponline',
    'nponline cafe',
    'mponline apply',
    'latest jobs',
    'latest vacancy',
    'latest admit card',
    'online result',
    'sarkarijob',
    'sarkari result',
    'freejobalert',
    'nitish khobragade'
  ],
  alternates: {
    canonical: 'https://npjobportal.in/tools',
  },
  openGraph: {
    title: 'Free Govt Form Tools Suite – Photo Resizer, Image Compressor & PDF Tools | NP Job Portal',
    description: '100% Private Client-Side Online Form Tools: Passport Photo Maker, Image Compressor (20-50KB), Signature Resizer (10-20KB), 300 DPI Photo Sheet Generator, PDF Compress under 200KB.',
    url: 'https://npjobportal.in/tools',
    siteName: 'NP Job Portal',
    type: 'website',
    locale: 'hi_IN',
    images: [
      {
        url: 'https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png',
        width: 416,
        height: 416,
        alt: 'NP Job Portal Tools Suite'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Govt Form Tools Suite – Photo Resizer, Image Compressor & PDF Tools',
    description: '100% Private Client-Side Tools for MP Online, SSC, UPSC, Railway forms. Photo Resizer, Image Compressor in KB, Signature Resizer, PDF Compress.',
    images: ['https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png'],
    creator: '@NitishKhobragade'
  }
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
