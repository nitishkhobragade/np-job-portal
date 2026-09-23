"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  ArrowLeft,
  Save,
  CheckCircle2,
  Clock,
  Upload,
  Link as LinkIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code
} from 'lucide-react';
import { BlogPost, BlogCategory } from '../../../types';
import {
  saveBlogPost,
  deleteBlogPost,
  subscribeToBlogPosts
} from '../../../lib/firebase';

const CATEGORIES: BlogCategory[] = [
  'Exam Prep',
  'Career Guidance',
  'Tech Tips',
  'Gov Schemes',
  'General'
];

export default function AdminBlogController() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<BlogCategory>('Career Guidance');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [tagsInput, setTagsInput] = useState('');
  const [seoKeywordsInput, setSeoKeywordsInput] = useState('');

  // AI & Compression States
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeToBlogPosts((updatedBlogs) => {
      setBlogs(updatedBlogs);
    }, 'all');
    return () => unsubscribe();
  }, []);

  // Auto-slug generator when title changes (if slug is clean)
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingId) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  };

  // Image Upload with Instant HTML5 Canvas WebP Compression (~100KB)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setStatusMsg({ text: 'बैनर कंप्रेस किया जा रहा है (~100KB)...', type: 'info' });

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const targetWidth = 1080;
          const scale = targetWidth / img.width;
          const targetHeight = Math.round(img.height * scale);

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          if (ctx) {
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            let quality = 0.82;
            let webpDataUrl = canvas.toDataURL('image/webp', quality);
            let sizeInKb = Math.round((webpDataUrl.length * 3) / 4 / 1024);

            if (sizeInKb > 120) {
              quality = 0.7;
              webpDataUrl = canvas.toDataURL('image/webp', quality);
              sizeInKb = Math.round((webpDataUrl.length * 3) / 4 / 1024);
            }

            setBannerUrl(webpDataUrl);
            setIsCompressing(false);
            setStatusMsg({ text: `बैनर इमेज सफलतापूर्वक कंप्रेस हुई (${sizeInKb} KB)`, type: 'success' });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Image compression error:', err);
      setIsCompressing(false);
      setStatusMsg({ text: 'इमेज अपलोड में त्रुटि हुई', type: 'error' });
    }
  };

  // Rich Text Editor Toolbar Helpers
  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previous = textarea.value;
    const selected = previous.substring(start, end);

    const replacement = `${prefix}${selected || 'शीर्षक'}${suffix}`;
    const nextValue = previous.substring(0, start) + replacement + previous.substring(end);
    setContent(nextValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 6));
    }, 50);
  };

  // AI Optimize Article with Gemini
  const handleAiOptimize = async () => {
    if (!title && !content) {
      setStatusMsg({ text: 'कृपया AI अनुकूलन हेतु शीर्षक अथवा कंटेंट दर्ज करें', type: 'error' });
      return;
    }

    setIsAiOptimizing(true);
    setStatusMsg({ text: '✨ Gemini AI द्वारा ब्लॉग लेख का SEO व संरचना अनुकूलन जारी है...', type: 'info' });

    try {
      const res = await fetch('/api/blog/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, category })
      });

      const data = await res.json();
      if (data.success) {
        if (data.optimizedTitle) setTitle(data.optimizedTitle);
        if (data.optimizedContent) setContent(data.optimizedContent);
        if (data.excerpt) setExcerpt(data.excerpt);
        if (data.tags && Array.isArray(data.tags)) setTagsInput(data.tags.join(', '));
        if (data.seoKeywords && Array.isArray(data.seoKeywords)) setSeoKeywordsInput(data.seoKeywords.join(', '));

        setStatusMsg({ text: '✨ ब्लॉग लेख सफलतापूर्वक AI द्वारा अनुकूलित किया गया!', type: 'success' });
      } else {
        throw new Error(data.error || 'AI Optimization failed');
      }
    } catch (err: unknown) {
      const msg = (err as Error).message || 'AI अनुकूलन में त्रुटि हुई';
      setStatusMsg({ text: msg, type: 'error' });
    } finally {
      setIsAiOptimizing(false);
    }
  };

  // Save Blog Post
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStatusMsg({ text: 'कृपया ब्लॉग शीर्षक दर्ज करें', type: 'error' });
      return;
    }

    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    const seoKeywords = seoKeywordsInput.split(',').map((k) => k.trim()).filter(Boolean);

    const postPayload: Partial<BlogPost> = {
      id: editingId || undefined,
      slug: slug.trim() || undefined,
      title: title.trim(),
      excerpt: excerpt.trim(),
      content: content.trim(),
      category,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=1080&auto=format&fit=crop&q=80',
      status,
      tags,
      seoKeywords,
      author: {
        name: 'Nitish Khobragade',
        role: 'Chief Editor & Career Counselor',
        phone: '8982324497'
      }
    };

    setStatusMsg({ text: 'ब्लॉग लेख सुरक्षित किया जा रहा है...', type: 'info' });

    try {
      await saveBlogPost(postPayload);
      setStatusMsg({ text: 'ब्लॉग लेख सफलतापूर्वक सेव हुआ!', type: 'success' });
      resetForm();
    } catch {
      setStatusMsg({ text: 'ब्लॉग सेव करने में त्रुटि हुई', type: 'error' });
    }
  };

  const handleEditClick = (b: BlogPost) => {
    setEditingId(b.id);
    setTitle(b.title);
    setSlug(b.slug);
    setCategory(b.category);
    setExcerpt(b.excerpt || '');
    setContent(b.content || '');
    setBannerUrl(b.bannerUrl || '');
    setStatus(b.status);
    setTagsInput(b.tags?.join(', ') || '');
    setSeoKeywordsInput(b.seoKeywords?.join(', ') || '');
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string, postTitle: string) => {
    if (!confirm(`क्या आप वाकई "${postTitle}" ब्लॉग लेख को हटाना चाहते हैं?`)) return;
    try {
      await deleteBlogPost(id);
      setStatusMsg({ text: 'ब्लॉग सफलतापूर्वक हटा दिया गया', type: 'success' });
      if (editingId === id) resetForm();
    } catch {
      setStatusMsg({ text: 'ब्लॉग हटाने में त्रुटि हुई', type: 'error' });
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setTitle('');
    setSlug('');
    setCategory('Career Guidance');
    setExcerpt('');
    setContent('');
    setBannerUrl('');
    setStatus('published');
    setTagsInput('');
    setSeoKeywordsInput('');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased pb-12">
      {/* Top Controller Header */}
      <header className="bg-neutral-900 text-white border-b-2 border-amber-400 py-4 px-4 sm:px-6 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
              title="वापस एडमिन मुख्य डैशबोर्ड"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-amber-400" />
                NP Job Portal ब्लॉग कंट्रोलर (Blogger Studio)
              </h1>
              <p className="text-xs text-neutral-400">
                AdSense-रेडी आर्टिकल, AI एनहांसर, रिच टेक्स्ट एडिटर एवं रियल-टाइम ब्लॉग प्रबंधन
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/blogs"
              target="_blank"
              className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              लाइव ब्लॉग्स देखें
            </Link>

            <button
              onClick={() => {
                resetForm();
                setIsEditing(true);
              }}
              className="px-4 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              नया ब्लॉग लिखें
            </button>
          </div>
        </div>
      </header>

      {/* Status Bar */}
      {statusMsg && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-300'
                : 'bg-amber-50 text-amber-900 border border-amber-300'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button
              onClick={() => setStatusMsg(null)}
              className="text-slate-500 hover:text-slate-800 font-black px-2"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 mt-6">
        {/* Editor Card (Shown when isEditing is true) */}
        {isEditing && (
          <div className="bg-white rounded-2xl border-2 border-red-300 shadow-xl p-5 sm:p-8 mb-8">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 flex-wrap gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-red-600" />
                  {editingId ? 'ब्लॉग लेख संपादित करें' : 'नया AdSense-रेडी ब्लॉग लेख तैयार करें'}
                </h2>
                <p className="text-xs text-slate-500">
                  शीर्षक, इमेज एवं कंटेंट भरें। AI ऑप्टिमाइज़ बटन दबाकर इसे तुरंत AdSense कम्प्लायंट बनाएं।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiOptimize}
                  disabled={isAiOptimizing}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all disabled:opacity-60"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" />
                  {isAiOptimizing ? 'AI ऑप्टिमाइज़ हो रहा है...' : '✨ AI ऑप्टिमाइज़ / एनहांस करें'}
                </button>

                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> पूर्वावलोकन (Preview)
                </button>
              </div>
            </div>

            <form onSubmit={handleSavePost} className="space-y-6">
              {/* Row 1: Title & Category */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    ब्लॉग शीर्षक (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="उदा. MP Police Constable 2026: परीक्षा पैटर्न एवं 100% सटीक तैयारी रणनीति"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    श्रेणी (Category)
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlogCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-sm font-bold text-slate-900 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Custom Slug & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    कस्टम यूआरएल स्लग (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2.5 rounded-l-xl text-xs text-slate-500 font-mono">
                      /blogs/
                    </span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="mp-police-constable-2026-strategy"
                      className="w-full px-3 py-2.5 rounded-r-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-xs font-mono text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    प्रकाशन स्थिति (Status)
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-sm font-bold text-slate-900 bg-white"
                  >
                    <option value="published">🟢 प्रकाशित (Published)</option>
                    <option value="draft">🟡 ड्राफ्ट (Draft)</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Banner Image Upload (~100KB Auto-Compression) */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  फीचर्ड बैनर इमेज (Featured Banner - ऑटो कंप्रेस ~100KB)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/... अथवा नीचे से सीधे फोटो अपलोड करें"
                    className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-xs text-slate-900"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {isCompressing ? 'कंप्रेस हो रहा है...' : 'बैनर अपलोड करें (~100KB)'}
                  </button>
                </div>

                {bannerUrl && (
                  <div className="relative h-36 w-full max-w-md rounded-xl overflow-hidden mt-3 border border-slate-300 shadow-inner bg-slate-900">
                    <Image
                      src={bannerUrl}
                      alt="Banner Preview"
                      fill
                      sizes="400px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Row 4: Short Excerpt */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  संक्षिप्त विवरण (Excerpt / SEO Meta Description)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="आर्टिकल का 1-2 लाइन का मुख्य सारांश जो गूगल सर्च और सोशल मीडिया शेयरिंग पर दिखेगा..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-xs text-slate-900"
                />
              </div>

              {/* Row 5: Blogger-Style Rich Text Editor Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                    मुख्य लेख सामग्री (Rich Content)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    अक्षर: {content.length} | अनुमानित पठन: {Math.max(2, Math.ceil(content.length / 400))} मिनट
                  </span>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-1 bg-slate-100 p-2 rounded-t-xl border border-b-0 border-slate-300 flex-wrap">
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('## ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                    title="Heading 2"
                  >
                    <Heading2 className="w-4 h-4" /> H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('### ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                    title="Heading 3"
                  >
                    <Heading3 className="w-4 h-4" /> H3
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('**', '**')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('*', '*')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n- ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Bulleted List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n1. ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('\n> ', '')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Blockquote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('[लिंक का नाम](https://', ')')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor('`', '`')}
                    className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
                    title="Code"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  rows={14}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="यहाँ ब्लॉग लेख लिखें... आप हेडिंग (##), बुलेट पॉइंट्स (-), बोल्ड (**) आदि का प्रयोग कर सकते हैं।"
                  className="w-full px-4 py-3 rounded-b-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-sm font-sans leading-relaxed text-slate-900"
                />
              </div>

              {/* Row 6: Tags & SEO Keywords */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    टैग्स (कॉमा से अलग करें)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="MP Police, Syllabus, Exam Pattern, Cut Off"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-xs text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    SEO कीवर्ड्स (AdSense व Google Ranking हेतु)
                  </label>
                  <input
                    type="text"
                    value={seoKeywordsInput}
                    onChange={(e) => setSeoKeywordsInput(e.target.value)}
                    placeholder="Sarkari Bharti 2026, MP Police Admit Card, Form Filling"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-red-600 text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  रद्द करें (Cancel)
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {status === 'published' ? 'ब्लॉग प्रकाशित करें (Publish)' : 'ड्राफ्ट सेव करें (Save Draft)'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Existing Blogs List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <h2 className="font-extrabold text-base">
                सभी ब्लॉग्स सूची ({blogs.length} लेख)
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              रियल-टाइम सिंक सक्रिय
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-black uppercase text-[11px]">
                  <th className="py-3 px-4">शीर्षक व विवरण</th>
                  <th className="py-3 px-4">श्रेणी</th>
                  <th className="py-3 px-4">स्थिति</th>
                  <th className="py-3 px-4">दिनांक</th>
                  <th className="py-3 px-4 text-center">क्रियाएं</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blogs.map((b) => (
                  <tr key={b.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-sm line-clamp-1">{b.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{b.excerpt}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">/blogs/{b.slug}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {b.status === 'published' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> प्रकाशित
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> ड्राफ्ट
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('hi-IN') : 'N/A'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/blogs/${b.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="देखें"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleEditClick(b)}
                          className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
                          title="एडिट करें"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(b.id, b.title)}
                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors"
                          title="डिलीट करें"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Live Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 font-black text-lg p-2"
            >
              ✕
            </button>

            <span className="px-2.5 py-1 bg-red-700 text-white font-black text-[11px] rounded uppercase">
              {category}
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">{title || 'Untitled Post'}</h2>

            {bannerUrl && (
              <div className="relative h-60 w-full rounded-xl overflow-hidden my-4 bg-slate-900">
                <Image
                  src={bannerUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {excerpt && (
              <p className="p-3 bg-amber-50 border-l-4 border-amber-500 rounded text-xs text-slate-800 my-3 font-medium">
                {excerpt}
              </p>
            )}

            <div className="prose text-sm text-slate-800 space-y-3 mt-4">
              {content ? (
                content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))
              ) : (
                <p className="text-slate-400 italic">कंटेंट खाली है</p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
