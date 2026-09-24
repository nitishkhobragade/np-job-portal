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
  title: "NP Job Portal - Latest MP & Central Government Jobs, Admit Card, Results | Nitish Khobragade (8982324497)",
  description: "NP Job Portal - Official portal for latest MP and Central Government jobs, admit cards, results, and online form filling service by Nitish Khobragade (8982324497). घर बैठे सुरक्षित फॉर्म भरवाएं.",
  openGraph: {
    title: "NP Job Portal - Latest MP & Central Government Jobs, Admit Card, Results | Nitish Khobragade (8982324497)",
    description: "NP Job Portal - Official portal for latest MP and Central Government jobs, admit cards, results, and online form filling service by Nitish Khobragade (8982324497). घर बैठे सुरक्षित फॉर्म भरवाएं.",
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden w-full max-w-full`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden w-full max-w-full">
        <HashPurgeHandler />
        <ChannelJoinPopup />
        <RewardedAdGate />
        {children}
      </body>
    </html>
  );
}
