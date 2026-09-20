"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  KeyRound,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Eye,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Globe,
  FileText,
  Check,
  Link as LinkIcon,
  Megaphone,
  Search,
  Image as ImageIcon,
  Rss,
  Radio,
  Play,
  Briefcase,
  Building2,
  Layers
} from 'lucide-react';
import { PostRecord, PopupAdSettings, ScrapedJobDraft, ScraperSource, ScraperBucket } from '../../types';
import {
  getJobs,
  addJob,
  updateJob,
  deleteJob,
  getPopupAdSettings,
  savePopupAdSettings,
  getScrapedDrafts,
  approveScrapedDraft,
  rejectScrapedDraft,
  simulateScraperRun,
  getScraperSources,
  addScraperSource,
  toggleScraperSource,
  deleteScraperSource,
  triggerSourceTestFetch
} from '../../lib/firebase';
import { PosterStudio } from '../../components/PosterStudio';
import { PopupAdModal } from '../../components/PopupAdModal';
import { OWNER_INFO } from '../../data/portalData';

export default function AdminPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('np_admin_auth') === 'true';
      } catch {
        return false;
      }
    }
    return false;
  });
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoadingAuth] = useState<boolean>(false);

  // Active Admin Tab: 'posts' | 'poster' | 'scraper' | 'popup'
  const [activeTab, setActiveTab] = useState<'posts' | 'poster' | 'scraper' | 'popup'>('posts');

  // Posts State
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [postsSearch, setPostsSearch] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string>('');

  // Add/Edit Post Form State
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formShortTitle, setFormShortTitle] = useState<string>('');
  const [formDept, setFormDept] = useState<string>('');
  const [formTotalPosts, setFormTotalPosts] = useState<string>('');
  const [formCategories, setFormCategories] = useState<string[]>(['vacancy']);
  const [formState, setFormState] = useState<'MP' | 'Central' | 'All India'>('MP');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formExamDate, setFormExamDate] = useState<string>('शीघ्र घोषित');
  const [formFeeGen, setFormFeeGen] = useState<string>('₹500/-');
  const [formFeeRes, setFormFeeRes] = useState<string>('₹250/-');
  const [formEligibility, setFormEligibility] = useState<string>('');
  const [formApplyLink, setFormApplyLink] = useState<string>('');
  const [formPdfLink, setFormPdfLink] = useState<string>('');
  const [formSyllabusLink, setFormSyllabusLink] = useState<string>('');
  const [formOfficialSite, setFormOfficialSite] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'draft' | 'pending_approval' | 'published'>('published');
  
  // Tech specific form states
  const [formIsTechJob, setFormIsTechJob] = useState<boolean>(false);
  const [formCompanyName, setFormCompanyName] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('');
  const [formExperience, setFormExperience] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formBatchEligibility, setFormBatchEligibility] = useState<string>('');

  // Link Override Modal State
  const [overrideJob, setOverrideJob] = useState<PostRecord | null>(null);
  const [overrideApplyUrl, setOverrideApplyUrl] = useState<string>('');
  const [overridePdfUrl, setOverridePdfUrl] = useState<string>('');
  const [overrideSyllabusUrl, setOverrideSyllabusUrl] = useState<string>('');
  const [overrideSiteUrl, setOverrideSiteUrl] = useState<string>('');

  // Poster Studio Active Job State
  const [posterJob, setPosterJob] = useState<PostRecord | null>(null);

  // Multi-Source Scraper Controller State
  const [scraperSources, setScraperSources] = useState<ScraperSource[]>([]);
  const [scrapedDrafts, setScrapedDrafts] = useState<ScrapedJobDraft[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [sourceBucketFilter, setSourceBucketFilter] = useState<'all' | ScraperBucket>('all');
  const [draftBucketFilter, setDraftBucketFilter] = useState<'all' | 'central' | 'mp' | 'tech'>('all');
  const [activeScraperSubTab, setActiveScraperSubTab] = useState<'sources' | 'queue'>('sources');
  const [isFetchingSourceId, setIsFetchingSourceId] = useState<string | null>(null);

  // Add Source Form / Modal State
  const [showAddSourceModal, setShowAddSourceModal] = useState<boolean>(false);
  const [newSourceName, setNewSourceName] = useState<string>('');
  const [newSourceUrl, setNewSourceUrl] = useState<string>('');
  const [newSourceBucket, setNewSourceBucket] = useState<ScraperBucket>('govt_portals');
  const [newSourceFeedType, setNewSourceFeedType] = useState<'rss' | 'html' | 'api'>('rss');
  const [newSourceDescription, setNewSourceDescription] = useState<string>('');

  // Pop-Up Ad Campaign State
  const [popupSettings, setPopupSettings] = useState<PopupAdSettings>({
    enabled: true,
    title: 'घर बैठे ऑनलाइन फॉर्म भरवाएं — 100% सही व सुरक्षित',
    subtitle: 'Nitish Khobragade (NP ONLINE KIOSK) • 8982324497',
    badge: 'विशेष सेवा ऑफर',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    redirectUrl: 'https://wa.me/918982324497?text=नमस्ते%20Nitish%20Ji,%20मुझे%20ऑनलाइन%20फॉर्म%20भरवाना%20है।',
    durationSeconds: 5,
    ctaText: 'व्हाट्सएप पर तुरंत संपर्क करें',
    updatedAt: 0
  });
  const [isSavingPopup, setIsSavingPopup] = useState<boolean>(false);
  const [showTestAdModal, setShowTestAdModal] = useState<boolean>(false);

  const refreshData = async () => {
    setIsLoadingPosts(true);
    try {
      const [fetchedPosts, adSettings, drafts, sources] = await Promise.all([
        getJobs(),
        getPopupAdSettings(),
        getScrapedDrafts(),
        getScraperSources()
      ]);
      setPosts(fetchedPosts);
      if (adSettings) setPopupSettings(adSettings);
      if (drafts) setScrapedDrafts(drafts);
      if (sources) setScraperSources(sources);
      if (!posterJob && fetchedPosts.length > 0) {
        setPosterJob(fetchedPosts[0]);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch initial data once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    let isCancelled = false;

    getJobs().then(async (fetchedPosts) => {
      if (isCancelled) return;
      setPosts(fetchedPosts);
      if (fetchedPosts.length > 0) {
        setPosterJob((prev) => prev || fetchedPosts[0]);
      }
      const [adSettings, drafts, sources] = await Promise.all([
        getPopupAdSettings(),
        getScrapedDrafts(),
        getScraperSources()
      ]);
      if (isCancelled) return;
      if (adSettings) setPopupSettings(adSettings);
      if (drafts) setScrapedDrafts(drafts);
      if (sources) setScraperSources(sources);
    });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated]);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPassword = authPassword.trim();

    if (cleanEmail === 'djnitish97@gmail.com' && cleanPassword === 'admin@nk') {
      setIsAuthenticated(true);
      try {
        localStorage.setItem('np_admin_auth', 'true');
        localStorage.setItem('np_admin_email', cleanEmail);
      } catch {
        // ignore
      }
    } else {
      setAuthError('अमान्य ईमेल अथवा पासवर्ड! कृपया सही क्रेडेंशियल्स दर्ज करें।');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    try {
      localStorage.removeItem('np_admin_auth');
      localStorage.removeItem('np_admin_email');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setAuthEmail('');
    setAuthPassword('');
  };

  // Delete Post Action
  const handleDeletePost = async (id: string, title: string) => {
    if (!window.confirm(`क्या आप निश्चित रूप से "${title}" को हटाना चाहते हैं?`)) {
      return;
    }
    await deleteJob(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    showToast(`सफलतापूर्वक हटाया गया: ${title}`);
  };

  // Open Edit Links Modal
  const handleOpenOverrideModal = (job: PostRecord) => {
    setOverrideJob(job);
    setOverrideApplyUrl(job.links?.apply || '');
    setOverridePdfUrl(job.links?.notificationPdf || '');
    setOverrideSyllabusUrl(job.links?.syllabusPdf || '');
    setOverrideSiteUrl(job.links?.officialSite || '');
  };

  // Save Overridden Links
  const handleSaveOverrideLinks = async () => {
    if (!overrideJob) return;
    const updatedLinks = {
      apply: overrideApplyUrl,
      notificationPdf: overridePdfUrl,
      syllabusPdf: overrideSyllabusUrl,
      officialSite: overrideSiteUrl
    };

    await updateJob(overrideJob.id, { links: updatedLinks });
    setPosts((prev) =>
      prev.map((p) => (p.id === overrideJob.id ? { ...p, links: updatedLinks } : p))
    );
    showToast('हाइपरलिंक सफलतापूर्वक अपडेट किए गए!');
    setOverrideJob(null);
  };

  // Handle Save New or Edited Post
  const handleSavePostForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDept) {
      alert('कृपया शीर्षक एवं विभाग दर्ज करें');
      return;
    }

    const postData: Partial<PostRecord> = {
      title: formTitle,
      shortTitle: formShortTitle || formTitle.slice(0, 30),
      dept: formDept,
      totalPosts: formTotalPosts || 'विज्ञप्ति अनुसार',
      categories: formCategories.length > 0 ? formCategories : ['vacancy'],
      state: formState,
      dates: {
        start: formStartDate || 'शीघ्र प्रारंभ',
        end: formEndDate || 'विज्ञप्ति अनुसार',
        exam: formExamDate || 'शीघ्र घोषित'
      },
      fee: {
        gen: formFeeGen,
        reserved: formFeeRes
      },
      eligibility: formEligibility || '10वीं / 12वीं अथवा स्नातक उत्तीर्ण',
      links: {
        apply: formApplyLink || 'https://esb.mp.gov.in',
        notificationPdf: formPdfLink || 'https://esb.mp.gov.in',
        syllabusPdf: formSyllabusLink,
        officialSite: formOfficialSite || 'https://esb.mp.gov.in'
      },
      status: formStatus,
      isTechJob: formIsTechJob || formCategories.includes('tech'),
      companyName: formCompanyName,
      role: formRole,
      experience: formExperience,
      location: formLocation,
      batchEligibility: formBatchEligibility
    };

    if (editingPostId) {
      await updateJob(editingPostId, postData);
      showToast('भर्ती पोस्ट सफलतापूर्वक अपडेट की गई!');
    } else {
      await addJob(postData);
      showToast('नई सरकारी भर्ती सफलतापूर्वक प्रकाशित की गई!');
    }

    // Reset Form
    setEditingPostId(null);
    setShowAddForm(false);
    resetPostForm();
    await refreshData();
  };

  const resetPostForm = () => {
    setFormTitle('');
    setFormShortTitle('');
    setFormDept('');
    setFormTotalPosts('');
    setFormCategories(['vacancy']);
    setFormState('MP');
    setFormStartDate('');
    setFormEndDate('');
    setFormExamDate('शीघ्र घोषित');
    setFormFeeGen('₹500/-');
    setFormFeeRes('₹250/-');
    setFormEligibility('');
    setFormApplyLink('');
    setFormPdfLink('');
    setFormSyllabusLink('');
    setFormOfficialSite('');
    setFormStatus('published');
    setFormIsTechJob(false);
    setFormCompanyName('');
    setFormRole('');
    setFormExperience('');
    setFormLocation('');
    setFormBatchEligibility('');
  };

  const startEditPost = (p: PostRecord) => {
    setEditingPostId(p.id);
    setFormTitle(p.title);
    setFormShortTitle(p.shortTitle || '');
    setFormDept(p.dept);
    setFormTotalPosts(String(p.totalPosts));
    setFormCategories(p.categories || ['vacancy']);
    setFormState(p.state || 'MP');
    setFormStartDate(p.dates?.start || '');
    setFormEndDate(p.dates?.end || '');
    setFormExamDate(p.dates?.exam || 'शीघ्र घोषित');
    setFormFeeGen(p.fee?.gen || '₹500/-');
    setFormFeeRes(p.fee?.reserved || '₹250/-');
    setFormEligibility(p.eligibility || '');
    setFormApplyLink(p.links?.apply || '');
    setFormPdfLink(p.links?.notificationPdf || '');
    setFormSyllabusLink(p.links?.syllabusPdf || '');
    setFormOfficialSite(p.links?.officialSite || '');
    setFormStatus(p.status);
    setFormIsTechJob(Boolean(p.isTechJob || p.categories?.includes('tech')));
    setFormCompanyName(p.companyName || '');
    setFormRole(p.role || '');
    setFormExperience(p.experience || '');
    setFormLocation(p.location || '');
    setFormBatchEligibility(p.batchEligibility || '');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Review Draft in Post Form
  const handleReviewDraft = (draft: ScrapedJobDraft) => {
    const p = draft.suggestedPost;
    setEditingPostId(null);
    setFormTitle(p.title || draft.rawTitle || '');
    setFormShortTitle(p.shortTitle || '');
    setFormDept(p.dept || '');
    setFormTotalPosts(String(p.totalPosts || ''));
    setFormCategories(p.categories || ['vacancy']);
    setFormState((p.state as 'MP' | 'Central' | 'All India') || 'MP');
    setFormStartDate(p.dates?.start || '');
    setFormEndDate(p.dates?.end || '');
    setFormExamDate(p.dates?.exam || 'शीघ्र घोषित');
    setFormFeeGen(p.fee?.gen || '₹500/-');
    setFormFeeRes(p.fee?.reserved || '₹250/-');
    setFormEligibility(p.eligibility || '');
    setFormApplyLink(p.links?.apply || '');
    setFormPdfLink(p.links?.notificationPdf || '');
    setFormSyllabusLink(p.links?.syllabusPdf || '');
    setFormOfficialSite(p.links?.officialSite || '');
    setFormStatus('published');
    setFormIsTechJob(Boolean(p.isTechJob || p.categories?.includes('tech')));
    setFormCompanyName(p.companyName || '');
    setFormRole(p.role || '');
    setFormExperience(p.experience || '');
    setFormLocation(p.location || '');
    setFormBatchEligibility(p.batchEligibility || '');
    setShowAddForm(true);
    setActiveTab('posts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`ड्राफ्ट समीक्षा फॉर्म में लोड किया गया: ${p.shortTitle || p.title}`);
  };

  // Scraper Sources Handlers
  const handleToggleSource = async (sourceId: string) => {
    await toggleScraperSource(sourceId);
    setScraperSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, enabled: !s.enabled } : s))
    );
    showToast('स्रोत स्थिति सफलतापूर्वक अपडेट की गई');
  };

  const handleDeleteSource = async (sourceId: string, name: string) => {
    if (!confirm(`क्या आप वाकई स्रोत "${name}" को हटाना चाहते हैं?`)) return;
    await deleteScraperSource(sourceId);
    setScraperSources((prev) => prev.filter((s) => s.id !== sourceId));
    showToast(`स्रोत हटाया गया: ${name}`);
  };

  const handleTriggerTestSource = async (sourceId: string) => {
    setIsFetchingSourceId(sourceId);
    try {
      const res = await triggerSourceTestFetch(sourceId);
      if (res.success) {
        showToast(res.message);
        // Refresh sources & drafts
        const [updatedDrafts, updatedSources] = await Promise.all([
          getScrapedDrafts(),
          getScraperSources()
        ]);
        setScrapedDrafts(updatedDrafts);
        setScraperSources(updatedSources);
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('टेस्ट फेच ट्रिगर करने में त्रुटि हुई');
    } finally {
      setIsFetchingSourceId(null);
    }
  };

  const handleAddSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName || !newSourceUrl) {
      alert('कृपया स्रोत का नाम एवं URL दर्ज करें');
      return;
    }
    const created = await addScraperSource({
      name: newSourceName,
      url: newSourceUrl,
      bucket: newSourceBucket,
      feedType: newSourceFeedType,
      enabled: true,
      lastScraped: 'अभी जोड़ा गया',
      itemsFound: 0,
      description: newSourceDescription || 'कस्टम इनजेशन स्रोत'
    });
    setScraperSources((prev) => [created, ...prev]);
    setShowAddSourceModal(false);
    setNewSourceName('');
    setNewSourceUrl('');
    setNewSourceDescription('');
    showToast(`नया स्रोत सफलतापूर्वक जोड़ा गया: ${created.name}`);
  };

  // AI Scraper Triggers
  const handleRunAIScraper = async () => {
    setIsScraping(true);
    try {
      const updated = await simulateScraperRun();
      setScrapedDrafts(updated);
      showToast('AI स्क्रैपर द्वारा नई भर्ती विज्ञप्तियां सफलतापूर्वक इनजेस्ट की गईं!');
    } catch {
      showToast('स्क्रैपर चलाने में त्रुटि हुई');
    } finally {
      setIsScraping(false);
    }
  };

  const handleApproveDraft = async (draftId: string) => {
    const published = await approveScrapedDraft(draftId);
    if (published) {
      showToast('ड्राफ्ट सफलतापूर्वक स्वीकृत व मुख्य पोर्टल पर प्रकाशित किया गया!');
      await refreshData();
    }
  };

  const handleRejectDraft = async (draftId: string) => {
    await rejectScrapedDraft(draftId);
    setScrapedDrafts((prev) =>
      prev.map((d) => (d.id === draftId ? { ...d, status: 'rejected' } : d))
    );
    showToast('ड्राफ्ट अस्वीकृत (Rejected)');
  };

  // Save Pop-Up Ad Settings
  const handleSavePopupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPopup(true);
    try {
      await savePopupAdSettings(popupSettings);
      showToast('पॉप-अप विज्ञापन सेटिंग्स सफलतापूर्वक सुरक्षित की गईं!');
    } catch {
      showToast('पॉप-अप सेटिंग्स सुरक्षित करने में त्रुटि हुई');
    } finally {
      setIsSavingPopup(false);
    }
  };

  // Loading Screen
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // LOGIN SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Brand Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-rose-800 text-white rounded-2xl flex flex-col items-center justify-center mx-auto shadow-xl border-2 border-amber-400 font-black">
              <span className="text-2xl leading-none">NP</span>
              <span className="text-[9px] font-bold text-amber-300 tracking-widest">ONLINE</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-3 tracking-tight">
              NP Job Portal <span className="text-amber-400">Admin</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              सुरक्षित एडमिनिस्ट्रेटर लॉगिन पोर्टल • Nitish Khobragade
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-500 rounded-xl text-xs text-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> अधिकृत एडमिन ईमेल ID:
              </label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="djnitish97@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> सुरक्षा पासवर्ड (Password):
              </label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:shadow-amber-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 mt-2"
            >
              <Lock className="w-4 h-4" />
              <span>सुरक्षित लॉगिन करें (Secure Login)</span>
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1"
            >
              <span>← मुख्य जॉब पोर्टल पर वापस जाएं</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered posts for the table
  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(postsSearch.toLowerCase()) ||
      p.dept.toLowerCase().includes(postsSearch.toLowerCase()) ||
      p.id.toLowerCase().includes(postsSearch.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'all' || p.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Top Admin Dashboard Navigation Bar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-black text-base shadow-md">
              NP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg text-white">
                  NP Online Kiosk <span className="text-amber-400">Admin Control</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                संचालक: <strong>{OWNER_INFO.name}</strong> • अधिकृत MP Online & CSC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>पोर्टल देखें</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={refreshData}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
              title="डेटा रीफ्रेश करें"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingPosts ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-lg text-xs font-bold border border-rose-800/80 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>लॉगआउट</span>
            </button>
          </div>
        </div>

        {/* 4 Main Feature Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2 pb-2 scrollbar-none text-xs font-bold">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'posts'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>भर्ती पोस्ट एवं हाइपरलिंक कंट्रोल ({posts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('poster')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'poster'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>डायनामिक पोस्टर स्टूडियो (1080×1350)</span>
          </button>

          <button
            onClick={() => setActiveTab('scraper')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'scraper'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI स्क्रैपर एवं इनजेशन कतार ({scrapedDrafts.filter((d) => d.status === 'queued').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('popup')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'popup'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4 text-rose-400" />
            <span>पॉप-अप विज्ञापन कैंपेन {popupSettings.enabled && '🟢'}</span>
          </button>
        </div>
      </header>

      {/* MAIN ADMIN DASHBOARD CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* TAB 1: POST MANAGEMENT & HYPERLINK CONTROL */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Top Stats & Fast Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  सरकारी भर्ती एवं नोटिफिकेशन प्रबंधन
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  लाइव पोस्ट्स, एक्सपायर्ड लिंक सुधार एवं नई विज्ञप्ति प्रकाशन
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPostId(null);
                  resetPostForm();
                  setShowAddForm(!showAddForm);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'फॉर्म बंद करें' : 'नई भर्ती / नोटिफिकेशन जोड़ें'}</span>
              </button>
            </div>

            {/* ADD / EDIT POST FORM */}
            {showAddForm && (
              <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-5 sm:p-7 shadow-2xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
                  <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-2">
                    {editingPostId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    <span>{editingPostId ? 'भर्ती पोस्ट संपादित करें' : 'नई सरकारी भर्ती पोस्ट तैयार करें'}</span>
                  </h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    रद्द करें
                  </button>
                </div>

                <form onSubmit={handleSavePostForm} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        पूरा शीर्षक (Full Title) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="उदा: MP Police Constable GD Recruitment 2026"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Short Title */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        संक्षिप्त नाम (Short Title)
                      </label>
                      <input
                        type="text"
                        value={formShortTitle}
                        onChange={(e) => setFormShortTitle(e.target.value)}
                        placeholder="उदा: MP Police Constable 2026"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        विभाग / बोर्ड (Department) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formDept}
                        onChange={(e) => setFormDept(e.target.value)}
                        placeholder="उदा: MPESB Bhopal / SSC / RRB"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    {/* Total Posts */}
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        कुल पद संख्या (Total Posts)
                      </label>
                      <input
                        type="text"
                        value={formTotalPosts}
                        onChange={(e) => setFormTotalPosts(e.target.value)}
                        placeholder="उदा: 7,500 Posts"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Multi-Category Selector & State */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">
                        श्रेणियां (Categories) — मल्टीपल चुनें:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'vacancy', label: 'Latest Vacancy' },
                          { id: 'mp_special', label: '★ MP Special' },
                          { id: 'tech', label: '💻 Tech / IT Job' },
                          { id: 'police', label: 'Police' },
                          { id: 'central', label: 'Central / SSC' },
                          { id: 'railway', label: 'Railway' },
                          { id: 'banking', label: 'Banking' },
                          { id: 'teaching', label: 'Teaching' }
                        ].map((cat) => {
                          const isChecked = formCategories.includes(cat.id);
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => {
                                if (isChecked) {
                                  setFormCategories(formCategories.filter((c) => c !== cat.id));
                                  if (cat.id === 'tech') setFormIsTechJob(false);
                                } else {
                                  setFormCategories([...formCategories, cat.id]);
                                  if (cat.id === 'tech') setFormIsTechJob(true);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
                                isChecked
                                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                                  : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1.5">
                        राज्य / स्तर (State / Region):
                      </label>
                      <div className="flex gap-2">
                        {(['MP', 'Central', 'All India'] as const).map((st) => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => setFormState(st)}
                            className={`flex-1 py-1.5 rounded-lg font-bold border transition-all ${
                              formState === st
                                ? 'bg-red-700 text-white border-red-500'
                                : 'bg-slate-950 text-slate-400 border-slate-700'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dates & Fees Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        आवेदन प्रारंभ तिथि:
                      </label>
                      <input
                        type="text"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        placeholder="उदा: 15/09/2026"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        आवेदन अंतिम तिथि:
                      </label>
                      <input
                        type="text"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        placeholder="उदा: 15/10/2026"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        सामान्य/OBC फीस:
                      </label>
                      <input
                        type="text"
                        value={formFeeGen}
                        onChange={(e) => setFormFeeGen(e.target.value)}
                        placeholder="उदा: ₹500/-"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        आरक्षित (SC/ST) फीस:
                      </label>
                      <input
                        type="text"
                        value={formFeeRes}
                        onChange={(e) => setFormFeeRes(e.target.value)}
                        placeholder="उदा: ₹250/-"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      शैक्षणिक योग्यता सारांश (Qualification Summary):
                    </label>
                    <textarea
                      rows={2}
                      value={formEligibility}
                      onChange={(e) => setFormEligibility(e.target.value)}
                      placeholder="उदा: 10वीं हाई स्कूल उत्तीर्ण अथवा 12वीं इंटरमीडिएट। प्रासंगिक पदों हेतु तकनीकी डिप्लोमा आवश्यक।"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Tech Job Specific Fields (shown if tech category checked or toggle active) */}
                  {(formIsTechJob || formCategories.includes('tech')) && (
                    <div className="p-4 bg-blue-950/30 border border-blue-800/60 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-blue-400 font-black text-xs">
                        <Briefcase className="w-4 h-4 text-blue-400" />
                        <span>कंप्यूटर / IT व कॉर्पोरेट जॉब विवरण (Tech Job Metadata)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            कंपनी का नाम (Company Name)
                          </label>
                          <input
                            type="text"
                            value={formCompanyName}
                            onChange={(e) => setFormCompanyName(e.target.value)}
                            placeholder="उदा: Google India / TCS / Infosys"
                            className="w-full bg-slate-950 border border-blue-700/60 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            पद / रोल (Role)
                          </label>
                          <input
                            type="text"
                            value={formRole}
                            onChange={(e) => setFormRole(e.target.value)}
                            placeholder="उदा: Software Engineer / QA Tester"
                            className="w-full bg-slate-950 border border-blue-700/60 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            अनुभव (Experience)
                          </label>
                          <input
                            type="text"
                            value={formExperience}
                            onChange={(e) => setFormExperience(e.target.value)}
                            placeholder="उदा: Freshers (0 Yrs) / 0-2 Years"
                            className="w-full bg-slate-950 border border-blue-700/60 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">
                            स्थान (Job Location)
                          </label>
                          <input
                            type="text"
                            value={formLocation}
                            onChange={(e) => setFormLocation(e.target.value)}
                            placeholder="उदा: Indore / Pune / Bengaluru / Remote"
                            className="w-full bg-slate-950 border border-blue-700/60 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-slate-300 font-bold mb-1">
                            बैच पात्रता (Batch Eligibility)
                          </label>
                          <input
                            type="text"
                            value={formBatchEligibility}
                            onChange={(e) => setFormBatchEligibility(e.target.value)}
                            placeholder="उदा: 2024, 2025 & 2026 Batch Graduates"
                            className="w-full bg-slate-950 border border-blue-700/60 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Hyperlinks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Apply Online Link:
                      </label>
                      <input
                        type="url"
                        value={formApplyLink}
                        onChange={(e) => setFormApplyLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Notification PDF URL:
                      </label>
                      <input
                        type="url"
                        value={formPdfLink}
                        onChange={(e) => setFormPdfLink(e.target.value)}
                        placeholder="https://.../notification.pdf"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Syllabus PDF / Info URL:
                      </label>
                      <input
                        type="url"
                        value={formSyllabusLink}
                        onChange={(e) => setFormSyllabusLink(e.target.value)}
                        placeholder="https://..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        Official Department Website:
                      </label>
                      <input
                        type="url"
                        value={formOfficialSite}
                        onChange={(e) => setFormOfficialSite(e.target.value)}
                        placeholder="https://esb.mp.gov.in"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white"
                      />
                    </div>
                  </div>

                  {/* Status & Submit */}
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-300">स्थिति:</span>
                      {(['published', 'draft', 'pending_approval'] as const).map((st) => (
                        <button
                          type="button"
                          key={st}
                          onClick={() => setFormStatus(st)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            formStatus === st
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
                      >
                        रद्द करें
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg shadow-md"
                      >
                        {editingPostId ? 'परिवर्तन सुरक्षित करें' : 'पोस्ट प्रकाशित करें'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* SEARCH & STATUS FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={postsSearch}
                  onChange={(e) => setPostsSearch(e.target.value)}
                  placeholder="पोस्ट या विभाग खोजें..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs text-slate-400 font-semibold">फिल्टर:</span>
                {(['all', 'published', 'draft', 'pending_approval'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setSelectedStatusFilter(filterKey)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      selectedStatusFilter === filterKey
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>
            </div>

            {/* LIVE POSTS CRUD TABLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">भर्ती / पद नाम</th>
                      <th className="py-3.5 px-4">विभाग</th>
                      <th className="py-3.5 px-4">पद संख्या</th>
                      <th className="py-3.5 px-4">अंतिम तिथि</th>
                      <th className="py-3.5 px-4">स्टेटस</th>
                      <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          कोई पोस्ट नहीं मिली।
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((job) => (
                        <tr key={job.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-bold text-white max-w-xs">
                            <div className="line-clamp-2">{job.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              ID: {job.id}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                            {job.dept}
                          </td>
                          <td className="py-3 px-4 text-amber-300 font-bold">
                            {job.totalPosts}
                          </td>
                          <td className="py-3 px-4 text-rose-300 font-mono font-bold">
                            {job.dates?.end || 'विज्ञप्ति अनुसार'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                job.status === 'published'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : job.status === 'pending_approval'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800'
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Launch Poster Studio */}
                              <button
                                onClick={() => {
                                  setPosterJob(job);
                                  setActiveTab('poster');
                                }}
                                className="p-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors"
                                title="पोस्टर स्टूडियो में खोलें"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Override Links */}
                              <button
                                onClick={() => handleOpenOverrideModal(job)}
                                className="p-1.5 rounded-md bg-blue-900/30 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors"
                                title="हाइपरलिंक अपडेट करें"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit details */}
                              <button
                                onClick={() => startEditPost(job)}
                                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="संपादित करें"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* View live page */}
                              <Link
                                href={`/jobs/${job.id}`}
                                target="_blank"
                                className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                title="लाइव देखें"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Link>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeletePost(job.id, job.title)}
                                className="p-1.5 rounded-md bg-rose-950/40 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors"
                                title="हटाएं"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUILT-IN DYNAMIC POSTER STUDIO */}
        {activeTab === 'poster' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-amber-400" />
                  डायनामिक पोस्टर स्टूडियो (Dynamic WhatsApp Poster Engine)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  1080×1350 HD vertical format, -30° वॉटरमार्क एवं Nitish Khobragade ब्रांडिंग सहित
                </p>
              </div>

              {/* Selector to switch active job */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold">भर्ती चुनें:</span>
                <select
                  value={posterJob?.id || ''}
                  onChange={(e) => {
                    const found = posts.find((p) => p.id === e.target.value);
                    if (found) setPosterJob(found);
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-bold"
                >
                  {posts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.shortTitle || p.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {posterJob ? (
              <PosterStudio job={posterJob} initialEditableMode={true} />
            ) : (
              <div className="text-center py-12 text-slate-400">
                पोस्टर बनाने के लिए कृपया ऊपर से कोई भर्ती चुनें।
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI SCRAPER & INGESTION QUEUE */}
        {activeTab === 'scraper' && (
          <div className="space-y-6">
            {/* Scraper Top Banner & Global Action */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/80">
                    <Radio className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      <span>मल्टी-सोर्स इनजेशन एवं RSS स्रोत नियंत्रक</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                        Multi-Feed Engine
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Govt Portals (SSC/UPSC/RRB), MP Special (MPESB/MPPSC), एवं Tech/IT कॉर्पोरेट जॉब्स के लाइव सोर्सेज प्रबंधित करें
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setShowAddSourceModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl shadow transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ नया स्रोत जोड़ें (+ Add Feed)</span>
                </button>

                <button
                  onClick={handleRunAIScraper}
                  disabled={isScraping}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-transform active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                  <span>{isScraping ? 'ग्लोबल स्कैन जारी है...' : 'फुल AI स्क्रैपर चलाएं (Run Scraper)'}</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs: Sources Manager vs. Ingestion Queue */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveScraperSubTab('sources')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeScraperSubTab === 'sources'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Rss className="w-4 h-4" />
                  <span>📡 लक्षित इनजेशन स्रोत (Feeds & URLs)</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-950/80 font-mono">
                    {scraperSources.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveScraperSubTab('queue')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeScraperSubTab === 'queue'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>📥 ड्राफ्ट्स एवं इनजेशन कतार (Queue)</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold font-mono">
                    {scrapedDrafts.filter((d) => d.status === 'queued').length}
                  </span>
                </button>
              </div>

              {/* Stats Overview */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>
                  सक्रिय स्रोत: <strong className="text-emerald-400">{scraperSources.filter((s) => s.enabled).length}</strong> / {scraperSources.length}
                </span>
                <span>•</span>
                <span>
                  कुल ड्राफ्ट्स: <strong className="text-purple-300">{scrapedDrafts.length}</strong>
                </span>
              </div>
            </div>

            {/* SUB-TAB 1: SCRAPER SOURCES LIST */}
            {activeScraperSubTab === 'sources' && (
              <div className="space-y-4">
                {/* Bucket Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold mr-1">श्रेणी फ़िल्टर:</span>
                  {[
                    { id: 'all' as const, label: 'सभी स्रोत (All Sources)' },
                    { id: 'govt_portals' as const, label: '🏛️ केंद्रीय सरकारी पोर्टल' },
                    { id: 'mp_special' as const, label: '🌲 MP स्पेशल पोर्टल' },
                    { id: 'tech_corporate' as const, label: '💻 Tech / IT कॉर्पोरेट' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSourceBucketFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sourceBucketFilter === tab.id
                          ? 'bg-purple-500 text-white font-black'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sources Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scraperSources
                    .filter((s) => sourceBucketFilter === 'all' || s.bucket === sourceBucketFilter)
                    .map((source) => {
                      const isFetching = isFetchingSourceId === source.id;
                      return (
                        <div
                          key={source.id}
                          className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all ${
                            source.enabled
                              ? 'border-slate-800 hover:border-purple-500/60'
                              : 'border-slate-800/40 opacity-60 bg-slate-950'
                          }`}
                        >
                          <div>
                            {/* Card Header: Bucket, FeedType & Toggle */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    source.bucket === 'mp_special'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : source.bucket === 'tech_corporate'
                                      ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                                  }`}
                                >
                                  {source.bucket === 'mp_special'
                                    ? 'MP Special'
                                    : source.bucket === 'tech_corporate'
                                    ? 'Tech / IT'
                                    : 'Central Govt'}
                                </span>
                                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                                  {source.feedType.toUpperCase()}
                                </span>
                              </div>

                              {/* Toggle Active / Inactive */}
                              <button
                                onClick={() => handleToggleSource(source.id)}
                                className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                                  source.enabled
                                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                }`}
                                title={source.enabled ? 'स्रोत को निष्क्रिय करें' : 'स्रोत को सक्रिय करें'}
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    source.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                  }`}
                                />
                                <span>{source.enabled ? 'सक्रिय (Active)' : 'निष्क्रिय'}</span>
                              </button>
                            </div>

                            {/* Name & URL */}
                            <h3 className="font-black text-sm text-white leading-snug">
                              {source.name}
                            </h3>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-1 truncate group"
                            >
                              <LinkIcon className="w-3 h-3 group-hover:underline shrink-0" />
                              <span className="truncate">{source.url}</span>
                            </a>

                            {source.description && (
                              <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                                {source.description}
                              </p>
                            )}

                            {/* Metrics Box */}
                            <div className="mt-4 p-3 bg-slate-950 rounded-xl space-y-1 text-xs border border-slate-800/80">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">अंतिम स्कैन:</span>
                                <span className="font-mono text-slate-300">{source.lastScraped}</span>
                              </div>
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-slate-400">प्राप्त भर्ती विज्ञप्तियां:</span>
                                <span className="font-mono font-bold text-amber-300">
                                  {source.itemsFound} items
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Footer */}
                          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleTriggerTestSource(source.id)}
                              disabled={isFetching}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 border border-purple-500/50 hover:border-purple-500 text-purple-300 hover:text-white rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Play className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                              <span>{isFetching ? 'फेचिंग...' : 'टेस्ट फेच (Fetch Test)'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteSource(source.id, source.name)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 rounded-lg transition-colors"
                              title="स्रोत हटाएं"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: SCRAPED DRAFTS INGESTION QUEUE */}
            {activeScraperSubTab === 'queue' && (
              <div className="space-y-4">
                {/* Drafts Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold mr-1">बकेट:</span>
                    {[
                      { id: 'all' as const, label: 'सभी (All)' },
                      { id: 'central' as const, label: '🏛️ Central' },
                      { id: 'mp' as const, label: '🌲 MP Special' },
                      { id: 'tech' as const, label: '💻 Tech / Corporate' }
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        onClick={() => setDraftBucketFilter(btn.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                          draftBucketFilter === btn.id
                            ? 'bg-purple-600 text-white font-black'
                            : 'bg-slate-950 text-slate-400 border border-slate-700 hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    दिखाए जा रहे हैं:{' '}
                    <strong className="text-white">
                      {scrapedDrafts.filter((d) => {
                        if (draftBucketFilter === 'all') return true;
                        const p = d.suggestedPost;
                        if (draftBucketFilter === 'tech') {
                          return p.isTechJob || p.categories?.includes('tech');
                        }
                        if (draftBucketFilter === 'mp') {
                          return p.state === 'MP' || p.categories?.includes('mp_special');
                        }
                        return p.state === 'Central' || p.categories?.includes('central');
                      }).length}
                    </strong>{' '}
                    ड्राफ्ट्स
                  </div>
                </div>

                {/* Scraper Drafts Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {scrapedDrafts
                    .filter((draft) => {
                      if (draftBucketFilter === 'all') return true;
                      const p = draft.suggestedPost;
                      if (draftBucketFilter === 'tech') {
                        return p.isTechJob || p.categories?.includes('tech');
                      }
                      if (draftBucketFilter === 'mp') {
                        return p.state === 'MP' || p.categories?.includes('mp_special');
                      }
                      return p.state === 'Central' || p.categories?.includes('central');
                    })
                    .map((draft) => {
                      const p = draft.suggestedPost;
                      const isTech = Boolean(p.isTechJob || p.categories?.includes('tech'));
                      return (
                        <div
                          key={draft.id}
                          className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all ${
                            draft.status === 'approved'
                              ? 'border-emerald-500/50 bg-emerald-950/10'
                              : draft.status === 'rejected'
                              ? 'border-rose-900/50 opacity-40 bg-rose-950/10'
                              : isTech
                              ? 'border-blue-500/40 hover:border-blue-400'
                              : 'border-purple-500/40 hover:border-purple-400'
                          }`}
                        >
                          <div>
                            {/* Top Source badge & Confidence Score */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
                                  {draft.sourcePortal}
                                </span>
                                {isTech && (
                                  <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                                    Tech / IT
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                विश्वास स्कोर: {draft.confidenceScore}%
                              </span>
                            </div>

                            <h3 className="font-extrabold text-sm text-white leading-snug">
                              {p.title}
                            </h3>

                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                              {isTech ? (
                                <>
                                  <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span className="font-bold text-blue-300">{p.companyName || p.dept}</span>
                                  {p.location && (
                                    <span className="text-[11px] text-slate-400">({p.location})</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span>🏢</span>
                                  <span>{p.dept}</span>
                                </>
                              )}
                            </div>

                            {/* Info Box */}
                            <div className="mt-3 p-3 bg-slate-950 rounded-xl space-y-1.5 text-xs border border-slate-800/80">
                              {isTech ? (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">रोल / पद:</span>
                                    <span className="font-bold text-blue-300">{p.role || 'Software Engineer'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">अनुभव:</span>
                                    <span className="font-bold text-amber-300">{p.experience || 'Freshers'}</span>
                                  </div>
                                  {p.batchEligibility && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">बैच:</span>
                                      <span className="font-bold text-emerald-300">{p.batchEligibility}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">कुल पद:</span>
                                    <span className="font-bold text-amber-300">{p.totalPosts}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-slate-400">अंतिम तिथि:</span>
                                    <span className="font-bold text-rose-300">{p.dates?.end}</span>
                                  </div>
                                </>
                              )}
                              <div className="text-[11px] text-slate-400 line-clamp-2 pt-1 border-t border-slate-800">
                                {p.eligibility}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-400">
                                स्थिति:{' '}
                                <strong
                                  className={
                                    draft.status === 'approved'
                                      ? 'text-emerald-400'
                                      : draft.status === 'rejected'
                                      ? 'text-rose-400'
                                      : 'text-amber-400 capitalize'
                                  }
                                >
                                  {draft.status === 'approved'
                                    ? 'प्रकाशित (Published)'
                                    : draft.status === 'rejected'
                                    ? 'अस्वीकृत'
                                    : 'प्रतीक्षारत (Queued)'}
                                </strong>
                              </span>
                            </div>

                            {draft.status === 'queued' && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  onClick={() => handleRejectDraft(draft.id)}
                                  className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold transition-colors"
                                  title="कतार से हटाएं"
                                >
                                  अस्वीकार
                                </button>
                                <button
                                  onClick={() => handleReviewDraft(draft)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                  title="संपादन फॉर्म में खोलें"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-400" />
                                  <span>समीक्षा व संपादन</span>
                                </button>
                                <button
                                  onClick={() => handleApproveDraft(draft.id)}
                                  className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition-all active:scale-95 text-center"
                                >
                                  स्वीकार व प्रकाशित करें
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD SCRAPER SOURCE */}
        {showAddSourceModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-purple-500/70 rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <h3 className="text-base font-black text-purple-300 flex items-center gap-2">
                  <Rss className="w-5 h-5 text-purple-400" />
                  <span>नया इनजेशन स्रोत जोड़ें (Add New Source Feed)</span>
                </h3>
                <button
                  onClick={() => setShowAddSourceModal(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ✕ बंद करें
                </button>
              </div>

              <form onSubmit={handleAddSourceSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    स्रोत / संगठन का नाम (Source Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSourceName}
                    onChange={(e) => setNewSourceName(e.target.value)}
                    placeholder="उदा: MP High Court Recruitment Portal"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    लक्षित URL अथवा RSS Feed Link *
                  </label>
                  <input
                    type="url"
                    required
                    value={newSourceUrl}
                    onChange={(e) => setNewSourceUrl(e.target.value)}
                    placeholder="https://mphc.gov.in/recruitment/feed"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-purple-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      श्रेणी / बकेट (Category Bucket)
                    </label>
                    <select
                      value={newSourceBucket}
                      onChange={(e) => setNewSourceBucket(e.target.value as ScraperBucket)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="govt_portals">🏛️ Central Govt Portals</option>
                      <option value="mp_special">🌲 MP Special Portals</option>
                      <option value="tech_corporate">💻 Tech / Corporate Jobs</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      फीड प्रकार (Feed Type)
                    </label>
                    <select
                      value={newSourceFeedType}
                      onChange={(e) => setNewSourceFeedType(e.target.value as 'rss' | 'html' | 'api')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="rss">RSS / Atom Feed</option>
                      <option value="html">HTML Scraping</option>
                      <option value="api">JSON REST API</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    विवरण (Description)
                  </label>
                  <textarea
                    rows={2}
                    value={newSourceDescription}
                    onChange={(e) => setNewSourceDescription(e.target.value)}
                    placeholder="इस स्रोत से प्राप्त होने वाली भर्ती विज्ञप्तियों का विवरण..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddSourceModal(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-lg text-xs shadow-lg transition-transform active:scale-95"
                  >
                    स्रोत सुरक्षित करें (Save Source)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOM POP-UP AD CAMPAIGN MANAGER */}
        {activeTab === 'popup' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-rose-400" />
                  कस्टम पॉप-अप विज्ञापन अभियान (Pop-Up Ad Campaign Manager)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Firestore दस्तावेज `settings/popup_ad` में सुरक्षित — न्यूनतम DB रीड/राइट
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTestAdModal(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>लाइव टेस्ट प्रीव्यू</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl">
              <form onSubmit={handleSavePopupSettings} className="space-y-4 text-xs">
                {/* Active Toggle Switch */}
                <div className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-white block">
                      पॉप-अप विज्ञापन स्थिति (Enable / Disable):
                    </span>
                    <span className="text-xs text-slate-400">
                      चालू करने पर यूजर को 5-6 सेकंड का काउंटडाउन पॉप-अप दिखाई देगा।
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPopupSettings({ ...popupSettings, enabled: !popupSettings.enabled })
                    }
                    className={`w-14 h-8 rounded-full p-1 transition-colors flex items-center ${
                      popupSettings.enabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    विज्ञापन मुख्य शीर्षक (Ad Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={popupSettings.title}
                    onChange={(e) =>
                      setPopupSettings({ ...popupSettings, title: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">
                    उप-शीर्षक (Subtitle / Tagline)
                  </label>
                  <input
                    type="text"
                    value={popupSettings.subtitle || ''}
                    onChange={(e) =>
                      setPopupSettings({ ...popupSettings, subtitle: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      बैनर इमेज URL (Banner Image):
                    </label>
                    <input
                      type="url"
                      value={popupSettings.imageUrl || ''}
                      onChange={(e) =>
                        setPopupSettings({ ...popupSettings, imageUrl: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      रीडायरेक्ट लिंक (Redirect / WhatsApp URL) *:
                    </label>
                    <input
                      type="url"
                      required
                      value={popupSettings.redirectUrl}
                      onChange={(e) =>
                        setPopupSettings({ ...popupSettings, redirectUrl: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      डिस्प्ले अवधि / काउंटडाउन (सेकंड) *:
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={30}
                      value={popupSettings.durationSeconds}
                      onChange={(e) =>
                        setPopupSettings({
                          ...popupSettings,
                          durationSeconds: Number(e.target.value) || 5
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      बटन टेक्स्ट (CTA Button Text):
                    </label>
                    <input
                      type="text"
                      value={popupSettings.ctaText || ''}
                      onChange={(e) =>
                        setPopupSettings({ ...popupSettings, ctaText: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingPopup}
                    className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl shadow-lg transition-all active:scale-98 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingPopup ? 'सुरक्षित हो रहा है...' : 'पॉप-अप सेटिंग्स सुरक्षित करें'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      {/* OVERRIDE LINKS MODAL */}
      {overrideJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-blue-500/70 rounded-2xl p-6 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-400" />
                <span>हाइपरलिंक ओवरराइड: {overrideJob.shortTitle || overrideJob.title}</span>
              </h3>
              <button
                onClick={() => setOverrideJob(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Apply Online URL:
              </label>
              <input
                type="url"
                value={overrideApplyUrl}
                onChange={(e) => setOverrideApplyUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Notification PDF Link:
              </label>
              <input
                type="url"
                value={overridePdfUrl}
                onChange={(e) => setOverridePdfUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Syllabus / Answer Key URL:
              </label>
              <input
                type="url"
                value={overrideSyllabusUrl}
                onChange={(e) => setOverrideSyllabusUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                Official Department Website:
              </label>
              <input
                type="url"
                value={overrideSiteUrl}
                onChange={(e) => setOverrideSiteUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setOverrideJob(null)}
                className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold"
              >
                रद्द करें
              </button>
              <button
                onClick={handleSaveOverrideLinks}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-black shadow"
              >
                लिंक्स सुरक्षित करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST AD MODAL PREVIEW */}
      {showTestAdModal && (
        <PopupAdModal
          forceShow={true}
          customSettings={popupSettings}
          onClose={() => setShowTestAdModal(false)}
        />
      )}
    </div>
  );
}
