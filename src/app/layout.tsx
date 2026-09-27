import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChannelJoinPopup } from "../components/ChannelJoinPopup";
import { HashPurgeHandler } from "../components/HashPurgeHandler";
import { RewardedAdGate } from "../components/RewardedAdGate";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://npjobportal.com"),
  title: {
    default: "NP Job Portal - Latest MP & Central Govt Jobs, Admit Card, Results | Nitish Khobragade (NTechBay)",
    template: "%s | NP Job Portal (NTechBay)"
  },
  description: "NP Job Portal (A Unit of NTechBay) by Nitish Khobragade (8982324497) — Official portal for latest MP & Central Government jobs, admit cards, exam results, and 100% private client-side online form tools.",
  keywords: [
    "NP Job Portal",
    "npjobportal",
    "NTechBay",
    "Nitish Khobragade",
    "MP Govt Jobs",
    "Balaghat Jobs",
    "MPESB Vacancy",
    "MP Police Bharti 2026",
    "Sarkari Job Alert",
    "Free Job Alert",
    "MP Online Kiosk Portal",
    "Sarkari Result MP",
    "Central Govt Jobs",
    "Latest Admit Card",
    "Sarkari Exam Result",
    "Online Form Portal",
    "image compressor in kb",
    "reduce image size to 20kb 50kb 100kb online",
    "photo signature joiner online for mponline ssc",
    "pdf compressor under 200kb for sarkari form",
    "rearrange pdf pages free",
    "remove pages from pdf",
    "pdf to jpg converter hd",
    "convert word docx to pdf free"
  ],
  authors: [
    {
      name: "Nitish Khobragade",
      url: "https://npjobportal.com/about-us"
    }
  ],
  creator: "Nitish Khobragade",
  publisher: "NP Job Portal — A Unit of NTechBay",
  formatDetection: {
    telephone: true,
    address: true,
    email: true
  },
  openGraph: {
    title: "NP Job Portal - Latest MP & Central Govt Jobs, Admit Card, Results | NTechBay",
    description: "Official portal for latest MP and Central Government jobs, admit cards, results, and online form filling service by Nitish Khobragade (8982324497). घर बैठे सुरक्षित फॉर्म भरवाएं।",
    url: "https://npjobportal.com",
    siteName: "NP Job Portal (NTechBay)",
    type: "website",
    locale: "hi_IN"
  },
  twitter: {
    card: "summary_large_image",
    title: "NP Job Portal - MP & Central Govt Jobs Alert (NTechBay)",
    description: "Official recruitment updates, admit cards, results and free client-side image/PDF tools by Nitish Khobragade.",
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
        "@id": "https://npjobportal.com/#organization",
        "name": "NP Job Portal — A Unit of NTechBay",
        "url": "https://npjobportal.com",
        "logo": "https://npjobportal.com/logo.png",
        "founder": {
          "@type": "Person",
          "@id": "https://npjobportal.com/#author",
          "name": "Nitish Khobragade",
          "jobTitle": "Founder & Career Counselor",
          "telephone": "+918982324497",
          "email": "nitishkhobragade89@gmail.com",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Balaghat",
            "addressRegion": "Madhya Pradesh",
            "addressCountry": "IN"
          }
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+918982324497",
          "contactType": "Customer Service & Form Assistance",
          "availableLanguage": ["Hindi", "English"],
          "areaServed": "IN"
        }
      },
      {
        "@type": "Person",
        "@id": "https://npjobportal.com/#author",
        "name": "Nitish Khobragade",
        "url": "https://npjobportal.com/about-us",
        "jobTitle": "Founder, Senior Recruitment Editor & Form Consultant",
        "worksFor": {
          "@id": "https://npjobportal.com/#organization"
        },
        "telephone": "+918982324497"
      },
      {
        "@type": "WebSite",
        "@id": "https://npjobportal.com/#website",
        "url": "https://npjobportal.com",
        "name": "NP Job Portal",
        "publisher": {
          "@id": "https://npjobportal.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://npjobportal.com/?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "होम (Home)",
            "item": "https://npjobportal.com"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "लेटेस्ट जॉब्स (Latest Jobs)",
            "item": "https://npjobportal.com/category/latest-jobs"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "प्रवेश पत्र (Admit Card)",
            "item": "https://npjobportal.com/category/admit-card"
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "परीक्षा परिणाम (Results)",
            "item": "https://npjobportal.com/category/results"
          },
          {
            "@type": "ListItem",
            "position": 5,
            "name": "सरकारी टूल्स सुइट (Tools)",
            "item": "https://npjobportal.com/tools"
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
        {children}
      </body>
    </html>
  );
}
