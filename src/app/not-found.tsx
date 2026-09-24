import React from 'react';
import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-800/90 border border-neutral-700 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 flex items-center justify-center mx-auto mb-5">
          <FileQuestion className="w-8 h-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black mb-2 text-white">404 - पेज नहीं मिला</h1>

        <p className="text-sm text-neutral-300 leading-relaxed mb-6">
          जिस भर्ती या पेज को आप खोज रहे हैं, वह स्थानांतरित हो चुका है या उपलब्ध नहीं है।
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <Home className="w-4 h-4" />
            <span>मुख्य पृष्ठ पर जाएं</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
