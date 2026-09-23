import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, ArrowRight, User } from 'lucide-react';
import { BlogPost } from '../types';
import { getBlogPosts } from '../lib/firebase';

interface RelatedBlogsWidgetProps {
  currentBlogSlug?: string;
  limit?: number;
  className?: string;
}

export const RelatedBlogsWidget: React.FC<RelatedBlogsWidgetProps> = ({
  currentBlogSlug,
  limit = 3,
  className = ''
}) => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);

  useEffect(() => {
    getBlogPosts('published')
      .then((all) => {
        const filtered = all
          .filter((b) => b.slug !== currentBlogSlug)
          .slice(0, limit);
        setBlogs(filtered);
      })
      .catch((err) => console.warn('Could not load related blogs:', err));
  }, [currentBlogSlug, limit]);

  if (blogs.length === 0) return null;

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-red-100 text-red-700">
            <BookOpen className="w-4 h-4" />
          </span>
          <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
            मार्गदर्शन एवं तैयारी लेख (Career & Exam Guides)
          </h3>
        </div>
        <Link
          href="/blogs"
          className="text-xs font-bold text-red-700 hover:underline inline-flex items-center gap-1"
        >
          सभी ब्लॉग्स <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {blogs.map((b) => (
          <Link
            key={b.id}
            href={`/blogs/${b.slug}`}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            {b.bannerUrl && (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={b.bannerUrl}
                  alt={b.title}
                  fill
                  sizes="80px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 mb-1">
                {b.category}
              </span>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug">
                {b.title}
              </h4>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {b.author?.name || 'Nitish Khobragade'}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {b.readingTimeMinutes || 5} मिनट पठन
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
