import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChannelJoinPopup } from "../components/ChannelJoinPopup";
import { HashPurgeHandler } from "../components/HashPurgeHandler";
import { RewardedAdGate } from "../components/RewardedAdGate";
import { PushNotificationPrompt } from "../components/PushNotificationPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://npjobportal.in"),
  title: {
    default: "NP Job Portal - Latest MP & Central Govt Jobs, Admit Card, Results | Nitish Khobragade (NTechBay)",
    template: "%s | NP Job Portal (NTechBay)"
  },
  description: "NP Job Portal (npjobportal.in) by Nitish Khobragade (8982324497) — Official recruitment updates for MP & Central Govt jobs, admit cards, results, and 100% private client-side online form filling tools.",
  keywords: [
    "NP Job Portal",
    "npjobportal",
    "npjobportal.in",
    "npjobportal.vercel.app",
    "npjobportal vercel",
    "NP JOB PORTAL",
    "NPJobPortal",
    "latest jobs",
    "latest vacancy",
    "latest job",
    "nponline",
    "nponline cafe",
    "latest admit card",
    "online result",
    "onlne result",
    "mponline apply",
    "banking jobs",
    "fresher jobs",
    "freejobalert",
    "sarkarijob",
    "sarkari result",
    "NTechBay",
    "Nitish Khobragade",
    "Nitish Kumar Khobragade",
    "MP Govt Jobs",
    "Balaghat Jobs",
    "MP Online Kiosk Services",
    "Online Form Filling Service",
    "MPESB Vacancy 2026",
    "MP Police Bharti",
    "SSC CGL CHSL GD Online Form",
    "Railway Recruitment 2026",
    "Sarkari Job Alert",
    "Free Job Alert",
    "Sarkari Result MP",
    "Central Govt Jobs",
    "Latest Admit Card",
    "Sarkari Exam Result",
    "Online Form Portal",
    "Passport Photo Maker Online",
    "Printable Photo Sheet Generator A4 4x6",
    "35mm x 45mm Passport Photo 300 DPI",
    "image compressor in kb",
    "image compressor 20kb 25kb 50kb 100kb",
    "reduce image size to 20kb 50kb 100kb online",
    "increase image size to 20kb 50kb online",
    "image size increaser in kb",
    "photo resizer in kb for ssc mpesb upsc",
    "signature resizer online 10kb to 20kb",
    "photo signature joiner online for mponline ssc",
    "pdf compressor under 200kb for sarkari form",
    "compress pdf to 100kb online free",
    "pdf merge split unlock free",
    "rearrange pdf pages free",
    "remove pages from pdf",
    "pdf to jpg converter hd",
    "convert word docx to pdf free",
    "pdf to word converter online",
    "age calculator for sarkari exam"
  ],
  authors: [
    {
      name: "Nitish Khobragade",
      url: "https://npjobportal.in/about-us"
    }
  ],
  creator: "Nitish Khobragade",
  publisher: "NP Job Portal — A Unit of NTechBay",
  icons: {
    icon: [
      { url: "https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/logo.png", type: "image/png", sizes: "416x416" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" }
    ],
    shortcut: "https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png",
    apple: [
      { url: "https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/logo.png", sizes: "416x416", type: "image/png" }
    ]
  },
  formatDetection: {
    telephone: true,
    address: true,
    email: true
  },
  openGraph: {
    title: "NP Job Portal - Latest MP & Central Govt Jobs, Admit Card, Results & Free Tools | NTechBay",
    description: "Official portal for latest MP & Central Government jobs, admit cards, results, and free client-side photo/PDF tools by Nitish Khobragade (8982324497).",
    url: "https://npjobportal.in",
    siteName: "NP Job Portal (npjobportal.in)",
    images: [
      {
        url: "https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png",
        width: 416,
        height: 416,
        alt: "NP Job Portal Logo - Nitish Khobragade"
      },
      {
        url: "/logo.png",
        width: 416,
        height: 416,
        alt: "NP Job Portal Official Logo"
      }
    ],
    type: "website",
    locale: "hi_IN"
  },
  twitter: {
    card: "summary_large_image",
    title: "NP Job Portal - MP & Central Govt Jobs Alert & Free Online Tools",
    description: "Official recruitment updates, admit cards, results and free client-side image compressor & PDF tools by Nitish Khobragade.",
    images: ["https://nitishkhobragade.github.io/portfolio.nitish/img/logo.png"],
    creator: "@NitishKhobragade"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  alternates: {
    canonical: "https://npjobportal.in"
  },
  verification: {
    google: "googlee1dd6021669e73ba"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://npjobportal.in/#organization",
        "name": "NP Job Portal — A Unit of NTechBay",
        "alternateName": ["NP Job Portal", "npjobportal.in", "NTechBay"],
        "url": "https://npjobportal.in",
        "logo": {
          "@type": "ImageObject",
          "url": "https://npjobportal.in/logo.png",
          "width": "416",
          "height": "416"
        },
        "image": "https://npjobportal.in/logo.png",
        "founder": {
          "@type": "Person",
          "@id": "https://npjobportal.in/#author",
          "name": "Nitish Khobragade",
          "alternateName": "Nitish Kumar Khobragade",
          "jobTitle": "Founder, Senior Recruitment Analyst & Online Kiosk Specialist",
          "telephone": "+918982324497",
          "email": "nitishkhobragade89@gmail.com",
          "sameAs": [
            "https://nitishkhobragade.github.io/portfolio.nitish/",
            "https://npjobportal.in/about-us"
          ],
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Balaghat",
            "addressRegion": "Madhya Pradesh",
            "postalCode": "481001",
            "addressCountry": "IN"
          }
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+918982324497",
          "contactType": "Customer Support & Online Form Filling Service",
          "availableLanguage": ["Hindi", "English"],
          "areaServed": "IN"
        }
      },
      {
        "@type": "Person",
        "@id": "https://npjobportal.in/#author",
        "name": "Nitish Khobragade",
        "url": "https://npjobportal.in/about-us",
        "jobTitle": "Founder, Senior Recruitment Editor & Online Form Consultant",
        "worksFor": {
          "@id": "https://npjobportal.in/#organization"
        },
        "telephone": "+918982324497",
        "image": "https://npjobportal.in/logo.png"
      },
      {
        "@type": "WebSite",
        "@id": "https://npjobportal.in/#website",
        "url": "https://npjobportal.in",
        "name": "NP Job Portal",
        "alternateName": ["npjobportal.in", "npjobportal"],
        "publisher": {
          "@id": "https://npjobportal.in/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://npjobportal.in/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebApplication",
        "@id": "https://npjobportal.in/tools#webapp",
        "name": "NP Job Portal Govt Examination Tools Suite",
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "All (Web, Android, iOS, Windows, Mac)",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "INR"
        },
        "description": "100% Free Client-Side Document & Image Tools Suite: Passport size photo maker with DOP/Sign & 300 DPI A4/4x6 sheet generator, Image compressor in KB, Signature resizer 10-20KB, PDF compressor under 200KB, and Age Calculator."
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "होम (Home)",
            "item": "https://npjobportal.in"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "लेटेस्ट जॉब्स (Latest Jobs)",
            "item": "https://npjobportal.in/category/latest-jobs"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "प्रवेश पत्र (Admit Card)",
            "item": "https://npjobportal.in/category/admit-card"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "परीक्षा परिणाम (Results)",
            "item": "https://npjobportal.in/category/results"
          },
          {
            "@type": "ListItem",
            "position": 5,
            "name": "सरकारी टूल्स सुइट (Tools)",
            "item": "https://npjobportal.in/tools"
          }
        ]
      }
    ]
  };

  return (
    <html
      lang="hi"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden w-full max-w-full`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden w-full max-w-full">
        <HashPurgeHandler />
        <ChannelJoinPopup />
        <RewardedAdGate />
        <PushNotificationPrompt />
        {children}
      </body>
    </html>
  );
}
