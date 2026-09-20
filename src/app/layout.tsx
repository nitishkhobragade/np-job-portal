import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NP Job Portal - Latest Sarkari Jobs, Admit Card, Results | NP ONLINE",
  description: "Government recruitment portal by NP ONLINE for latest MP and Central Government jobs, admit cards, results, and online form filling service by Nitish Khobragade.",
  openGraph: {
    title: "NP Job Portal - Latest Sarkari Jobs, Admit Card, Results | NP ONLINE",
    description: "Government recruitment portal by NP ONLINE for latest MP and Central Government jobs, admit cards, results, and online form filling service by Nitish Khobragade.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
