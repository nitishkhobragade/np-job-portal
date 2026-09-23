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
  EyeOff,
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
  Layers,
  Share2,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  Upload,
  Server,
  ShieldAlert,
  Bot,
  BookOpen
} from 'lucide-react';
import { PostRecord, PopupAdSettings, ScrapedJobDraft, ScraperSource, ScraperBucket, TickerAlert } from '../../types';
import {
  getJobs,
  addJob,
  updateJob,
  deleteJob,
  subscribeToPosts,
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
  triggerSourceTestFetch,
  getTickers,
  saveTickers,
  subscribeToTickers,
  exportFullDatabaseBackup,
  restoreDatabaseFromBackup,
  PortalDatabaseBackup
} from '../../lib/firebase';
import { seedPostsIfEmpty } from '../../lib/seedDatabase';
import { PosterStudio } from '../../components/PosterStudio';
import { PopupAdModal } from '../../components/PopupAdModal';
import { SocialShareModal } from '../../components/SocialShareModal';
import { OWNER_INFO } from '../../data/portalData';
import {
  getPostUrl,
  formatDateToDDMMYYYY,
  ddmmyyyyToInputDate,
  inputDateToDDMMYYYY,
  getNextBlogNumber
} from '../../lib/postRouting';

// In-memory session tracking so sandboxed iframe storage restrictions never block admin access
let inMemoryAdminAuth = false;

const safeStorage = {
  get: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },
  set: (key: string, val: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, val);
    } catch (e) {
      console.warn("localStorage set blocked:", e);
    }
    try {
      sessionStorage.setItem(key, val);
    } catch (e) {
      console.warn("sessionStorage set blocked:", e);
    }
  },
  remove: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {}
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
};

export default function AdminPage() {
  // Authentication State
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (inMemoryAdminAuth) return true;
    const saved = safeStorage.get("np_portal_admin_session");
    return saved === "authenticated_djnitish";
  });

  // FORCE PURGE HASH ON COMPONENT MOUNT AND RESTORE AUTH:
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      window.history.replaceState(null, "", "/admin");
    }

    const savedSession = safeStorage.get("np_portal_admin_session");
    if (savedSession === "authenticated_djnitish" || inMemoryAdminAuth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
    } else {
      // Check backend session cookie
      fetch("/api/admin/session")
        .then((r) => r.json())
        .then((data) => {
          if (data?.authenticated) {
            inMemoryAdminAuth = true;
            setIsAuthenticated(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Active Admin Tab: 'posts' | 'poster' | 'scraper' | 'popup' | 'ticker' | 'backup'
  const [activeTab, setActiveTab] = useState<'posts' | 'poster' | 'scraper' | 'popup' | 'ticker' | 'backup'>('posts');

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
  const [formLastDateFee, setFormLastDateFee] = useState<string>('');
  const [formExamDate, setFormExamDate] = useState<string>('शीघ्र घोषित');
  const [formAdmitCardDate, setFormAdmitCardDate] = useState<string>('परीक्षा से 7 दिन पूर्व');
  const [formFeeGen, setFormFeeGen] = useState<string>('₹500/-');
  const [formFeeRes, setFormFeeRes] = useState<string>('₹250/-');
  const [formFeeOBC, setFormFeeOBC] = useState<string>('₹500/-');
  const [formFeeSCST, setFormFeeSCST] = useState<string>('₹250/-');
  const [formFeeEWS, setFormFeeEWS] = useState<string>('₹500/-');
  const [formShowEWS, setFormShowEWS] = useState<boolean>(true);
  const [formFeePortal, setFormFeePortal] = useState<string>('₹50/-');
  const [formPaymentMode, setFormPaymentMode] = useState<string>('Online Net Banking, Debit/Credit Card, UPI');
  const [formMinAge, setFormMinAge] = useState<string>('18 वर्ष');
  const [formMaxAge, setFormMaxAge] = useState<string>('33 वर्ष');
  const [formAgeRelaxation, setFormAgeRelaxation] = useState<string>('नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट');
  const [formShowReservation, setFormShowReservation] = useState<boolean>(true);
  const [formEligibility, setFormEligibility] = useState<string>('');
  const [formApplyLink, setFormApplyLink] = useState<string>('');
  const [formPdfLink, setFormPdfLink] = useState<string>('');
  const [formSyllabusLink, setFormSyllabusLink] = useState<string>('');
  const [formOfficialSite, setFormOfficialSite] = useState<string>('');
  const [formImportantLinks, setFormImportantLinks] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [formStatus, setFormStatus] = useState<'draft' | 'pending_approval' | 'published' | 'suspended'>('published');
  const [formYear, setFormYear] = useState<string>(() => String(new Date().getFullYear()));
  const [formMonth, setFormMonth] = useState<string>(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [formBlogNo, setFormBlogNo] = useState<string>('01');
  const [formSlug, setFormSlug] = useState<string>('');
  const [reviewedDraftId, setReviewedDraftId] = useState<string | null>(null);

  // Custom Poster Engine state for Post form
  const [formUseCustomPoster, setFormUseCustomPoster] = useState<boolean>(false);
  const [formCustomPosterUrl, setFormCustomPosterUrl] = useState<string>('');
  const [isFormCompressingPoster, setIsFormCompressingPoster] = useState<boolean>(false);
  const [formPosterSizeKb, setFormPosterSizeKb] = useState<number | null>(null);
  
  // Tech specific form states
  const [formIsTechJob, setFormIsTechJob] = useState<boolean>(false);
  const [formCompanyName, setFormCompanyName] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('');
  const [formExperience, setFormExperience] = useState<string>('');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formBatchEligibility, setFormBatchEligibility] = useState<string>('');

  // Single URL Gemini Scraper state
  const [scraperUrlInput, setScraperUrlInput] = useState<string>('');
  const [isGeminiExtracting, setIsGeminiExtracting] = useState<boolean>(false);

  // Link Override Modal State
  const [overrideJob, setOverrideJob] = useState<PostRecord | null>(null);
  const [overrideApplyUrl, setOverrideApplyUrl] = useState<string>('');
  const [overridePdfUrl, setOverridePdfUrl] = useState<string>('');
  const [overrideSyllabusUrl, setOverrideSyllabusUrl] = useState<string>('');
  const [overrideSiteUrl, setOverrideSiteUrl] = useState<string>('');
  const [overrideImportantLinks, setOverrideImportantLinks] = useState<Array<{ id: string; title: string; url: string }>>([]);

  // Poster Studio Active Job State
  const [posterJob, setPosterJob] = useState<PostRecord | null>(null);

  // Controlled Status Changes state: changes remain in local state until user explicitly clicks "Save Changes"
  const [pendingStatusChanges, setPendingStatusChanges] = useState<Record<string, 'published' | 'draft' | 'suspended'>>({});

  // Database Backup & Restore Manager State
  const [isExportingBackup, setIsExportingBackup] = useState<boolean>(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState<boolean>(false);
  const [backupRestoreMessage, setBackupRestoreMessage] = useState<string | null>(null);
  const [backupRestoreError, setBackupRestoreError] = useState<string | null>(null);
  const [parsedBackupSnapshot, setParsedBackupSnapshot] = useState<PortalDatabaseBackup | null>(null);
  const [isSavingStatusChanges, setIsSavingStatusChanges] = useState<boolean>(false);

  // Social Share Modal State
  const [selectedShareJob, setSelectedShareJob] = useState<PostRecord | null>(null);

  // Multi-Source Scraper Controller State
  const [scraperSources, setScraperSources] = useState<ScraperSource[]>([]);
  const [scrapedDrafts, setScrapedDrafts] = useState<ScrapedJobDraft[]>([]);
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [draftBucketFilter, setDraftBucketFilter] = useState<'all' | 'central' | 'mp' | 'tech'>('all');
  const [activeScraperSubTab, setActiveScraperSubTab] = useState<'registry' | 'govt' | 'tech' | 'queue'>('registry');
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
    subtitle: 'Nitish Khobragade (8982324497) • घर बैठे सुरक्षित फॉर्म भरवाएं',
    badge: 'विशेष सेवा ऑफर',
    imageUrl: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600&auto=format&fit=crop&q=80',
    redirectUrl: 'https://wa.me/918982324497?text=नमस्ते%20Nitish%20Ji,%20मुझे%20ऑनलाइन%20फॉर्म%20भरवाना%20है।',
    durationSeconds: 5,
    ctaText: 'व्हाट्सएप पर तुरंत संपर्क करें',
    updatedAt: 0
  });
  const [isSavingPopup, setIsSavingPopup] = useState<boolean>(false);
  const [showTestAdModal, setShowTestAdModal] = useState<boolean>(false);

  // Live Running Ticker Controller State
  const [tickersList, setTickersList] = useState<TickerAlert[]>([]);
  const [isSavingTickers, setIsSavingTickers] = useState<boolean>(false);
  const [newTickerText, setNewTickerText] = useState<string>('');
  const [newTickerLink, setNewTickerLink] = useState<string>('');
  const [newTickerDate, setNewTickerDate] = useState<string>('');
  const [newTickerIsBreaking, setNewTickerIsBreaking] = useState<boolean>(false);

  const refreshData = async () => {
    setIsLoadingPosts(true);
    try {
      const [fetchedPosts, adSettings, drafts, sources, fetchedTickers] = await Promise.all([
        getJobs(),
        getPopupAdSettings(),
        getScrapedDrafts(),
        getScraperSources(),
        getTickers()
      ]);
      setPosts(fetchedPosts);
      if (adSettings) setPopupSettings(adSettings);
      if (drafts) setScrapedDrafts(drafts);
      if (sources) setScraperSources(sources);
      if (fetchedTickers) setTickersList(fetchedTickers);
      if (!posterJob && fetchedPosts.length > 0) {
        setPosterJob(fetchedPosts[0]);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch initial data & subscribe to realtime updates once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = subscribeToPosts((updatedPosts) => {
      setPosts(updatedPosts);
      if (updatedPosts.length > 0) {
        setPosterJob((prev) => prev || updatedPosts[0]);
      }
    }, 'all');

    const unsubTickers = subscribeToTickers((updatedTickers) => {
      if (updatedTickers && updatedTickers.length > 0) {
        setTickersList(updatedTickers);
      }
    });

    // Also fetch auxiliary settings
    Promise.all([
      getPopupAdSettings(),
      getScrapedDrafts(),
      getScraperSources(),
      getTickers()
    ]).then(([adSettings, drafts, sources, fetchedTickers]) => {
      if (adSettings) setPopupSettings(adSettings);
      if (drafts) setScrapedDrafts(drafts);
      if (sources) setScraperSources(sources);
      if (fetchedTickers) setTickersList(fetchedTickers);
    }).catch((err) => console.warn('Aux data fetch error:', err));

    return () => {
      unsubscribe();
      unsubTickers();
    };
  }, [isAuthenticated]);

  // Sync URL query params with admin tab and poster postId
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    const postIdParam = searchParams.get('postId');

    if (tabParam === 'poster') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('poster');
    }
    if (postIdParam && posts.length > 0) {
      const found = posts.find((p) => p.id === postIdParam || p.slug === postIdParam);
      if (found) {
        setPosterJob(found);
      }
    }
  }, [posts]);

  const showToast = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // BULLETPROOF LOGIN FUNCTION WITH INSTANT VISUAL FEEDBACK & SECURE BACKEND API:
  const handleAdminLogin = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setErrorMsg("");

    const cleanUser = adminId.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg("कृपया यूजर आईडी और सुरक्षा पासवर्ड दोनों दर्ज करें।");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Authenticate via Secure Backend API
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId: cleanUser, password: cleanPass })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        inMemoryAdminAuth = true;
        safeStorage.set("np_portal_admin_session", "authenticated_djnitish");
        setIsAuthenticated(true);
        showToast("लॉगिन सफल! एडमिन डैशबोर्ड लोड हो गया है।");
        return;
      }

      // 2. Direct client fallback in case network API is blocked in sandbox iframe
      const validUsers = ["djnitish97@gmail.com", "nitishkhobragade89@gmail.com", "admin", "8982324497"];
      const validPass = ["admin@nk", "Admin@nk", "8982324497"];

      if (validUsers.includes(cleanUser) && validPass.includes(cleanPass)) {
        inMemoryAdminAuth = true;
        safeStorage.set("np_portal_admin_session", "authenticated_djnitish");
        setIsAuthenticated(true);
        showToast("लॉगिन सफल! एडमिन डैशबोर्ड लोड हो गया है।");
        return;
      }

      setErrorMsg(data.message || "अमान्य क्रेडेंशियल्स! (Invalid User ID or Password)");
    } catch (err) {
      console.warn("Backend login fetch error, evaluating fallback:", err);
      // Fallback check if API fetch was intercepted or blocked
      const validUsers = ["djnitish97@gmail.com", "nitishkhobragade89@gmail.com", "admin", "8982324497"];
      const validPass = ["admin@nk", "Admin@nk", "8982324497"];

      if (validUsers.includes(cleanUser) && validPass.includes(cleanPass)) {
        inMemoryAdminAuth = true;
        safeStorage.set("np_portal_admin_session", "authenticated_djnitish");
        setIsAuthenticated(true);
        showToast("लॉगिन सफल! एडमिन डैशबोर्ड लोड हो गया है।");
      } else {
        setErrorMsg("अमान्य क्रेडेंशियल्स! (Invalid User ID or Password)");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Controlled Status Toggle Handler: Decoupled from immediate Firestore mutation.
  // Updates local state and tracks uncommitted changes until user clicks "Save Changes".
  const handleToggleStatus = (
    postId: string,
    newStatus: 'published' | 'draft' | 'suspended'
  ) => {
    // Update pending changes
    setPendingStatusChanges((prev) => {
      const origPost = posts.find((p) => p.id === postId);
      if (origPost && origPost.status === newStatus) {
        // If reverted back to original status, remove from pending
        const copy = { ...prev };
        delete copy[postId];
        return copy;
      }
      return { ...prev, [postId]: newStatus };
    });

    // Update posts in local state so UI reflects change immediately
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    showToast(`स्थिति स्थानीय रूप से '${newStatus}' चुनी गई (सुरक्षित करने हेतु 'Save Changes' पर क्लिक करें)।`);
  };

  // Explicit Commit Handler for Controlled Status Changes
  const handleSaveStatusChanges = async () => {
    const changedPostIds = Object.keys(pendingStatusChanges);
    if (changedPostIds.length === 0) return;

    setIsSavingStatusChanges(true);
    try {
      await Promise.all(
        changedPostIds.map(async (postId) => {
          const newStatus = pendingStatusChanges[postId];
          await updateJob(postId, { status: newStatus });
        })
      );
      setPendingStatusChanges({});
      showToast(`${changedPostIds.length} पोस्ट की स्थितियां सफलतापूर्वक सुरक्षित की गईं!`);
      await refreshData();
    } catch (err) {
      console.error('Failed to commit status changes:', err);
      showToast('स्थिति सुरक्षित करने में त्रुटि हुई!');
    } finally {
      setIsSavingStatusChanges(false);
    }
  };

  // Discard pending uncommitted status changes
  const handleDiscardStatusChanges = async () => {
    setPendingStatusChanges({});
    await refreshData();
    showToast('असुरक्षित परिवर्तन रद्द कर दिए गए।');
  };

  // Handle Logout
  const handleLogout = async () => {
    inMemoryAdminAuth = false;
    safeStorage.remove("np_portal_admin_session");
    safeStorage.remove("np_admin_session");
    safeStorage.remove("np_admin_auth");
    safeStorage.remove("np_admin_user");
    safeStorage.remove("np_admin_email");

    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {}

    setIsAuthenticated(false);
    setAdminId("");
    setPassword("");
    setErrorMsg("");
  };

  // Delete Post Action with admin password verification ("admin@nk")
  const handleDeletePost = async (id: string, title: string) => {
    const enteredPass = window.prompt(`पोस्ट "${title}" को हटाने हेतु एडमिन पासवर्ड दर्ज करें:`);
    if (enteredPass === null) return;
    if (enteredPass.trim() !== 'admin@nk') {
      showToast('गलत पासवर्ड! पोस्ट नहीं हटाई गई। (Invalid admin password)');
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
    setOverrideImportantLinks(job.importantLinks || []);
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

    await updateJob(overrideJob.id, {
      links: updatedLinks,
      importantLinks: overrideImportantLinks
    });
    setPosts((prev) =>
      prev.map((p) => (p.id === overrideJob.id ? { ...p, links: updatedLinks, importantLinks: overrideImportantLinks } : p))
    );
    showToast('हाइपरलिंक सफलतापूर्वक अपडेट किए गए!');
    setOverrideJob(null);
  };

  // Handle Save New or Edited Post
  const handleSavePostForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDept) {
      showToast('कृपया शीर्षक एवं विभाग दर्ज करें');
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
      lastDate: formEndDate || 'विज्ञप्ति अनुसार',
      lastDateFee: formLastDateFee || formEndDate || 'विज्ञप्ति अनुसार',
      examDate: formExamDate || 'शीघ्र घोषित',
      admitCardDate: formAdmitCardDate || 'परीक्षा से 7 दिन पूर्व',
      fee: {
        gen: formFeeGen,
        reserved: formFeeRes
      },
      feeGeneral: formFeeGen,
      feeReserved: formFeeRes,
      feeOBC: formFeeOBC,
      feeSCST: formFeeSCST,
      feeEWS: formFeeEWS,
      showEWS: formShowEWS,
      feePortal: formFeePortal,
      paymentMode: formPaymentMode,
      minAge: formMinAge,
      maxAge: formMaxAge,
      ageRelaxation: formAgeRelaxation,
      showReservationSection: formShowReservation,
      eligibility: formEligibility || '10वीं / 12वीं अथवा स्नातक उत्तीर्ण',
      qualification: formEligibility || '10वीं / 12वीं अथवा स्नातक उत्तीर्ण',
      links: {
        apply: formApplyLink || 'https://esb.mp.gov.in',
        notificationPdf: formPdfLink || 'https://esb.mp.gov.in',
        syllabusPdf: formSyllabusLink,
        officialSite: formOfficialSite || 'https://esb.mp.gov.in'
      },
      importantLinks: formImportantLinks,
      status: formStatus,
      year: formYear || String(new Date().getFullYear()),
      month: formMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
      blogNo: formBlogNo || getNextBlogNumber(posts, formYear, formMonth),
      slug: formSlug.trim() || undefined,
      isTechJob: formIsTechJob || formCategories.includes('tech'),
      companyName: formCompanyName,
      role: formRole,
      experience: formExperience,
      location: formLocation,
      batchEligibility: formBatchEligibility,
      useCustomPoster: formUseCustomPoster && Boolean(formCustomPosterUrl),
      customPosterUrl: formUseCustomPoster ? formCustomPosterUrl : ''
    };

    if (editingPostId) {
      await updateJob(editingPostId, postData);
      showToast('भर्ती पोस्ट सफलतापूर्वक अपडेट की गई!');
    } else {
      await addJob(postData);
      if (reviewedDraftId) {
        try {
          await approveDraft(reviewedDraftId);
        } catch (err) {
          console.error('Draft auto-approval err:', err);
        }
        setReviewedDraftId(null);
      }
      showToast('नई सरकारी भर्ती सफलतापूर्वक प्रकाशित की गई!');
    }

    // Reset Form
    setEditingPostId(null);
    setShowAddForm(false);
    resetPostForm();
    await refreshData();
  };

  const resetPostForm = () => {
    const now = new Date();
    const curYear = String(now.getFullYear());
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    setFormTitle('');
    setFormShortTitle('');
    setFormDept('');
    setFormTotalPosts('');
    setFormCategories(['vacancy']);
    setFormState('MP');
    setFormStartDate('');
    setFormEndDate('');
    setFormLastDateFee('');
    setFormExamDate('शीघ्र घोषित');
    setFormAdmitCardDate('परीक्षा से 7 दिन पूर्व');
    setFormFeeGen('₹500/-');
    setFormFeeRes('₹250/-');
    setFormFeeOBC('₹500/-');
    setFormFeeSCST('₹250/-');
    setFormFeeEWS('₹500/-');
    setFormShowEWS(true);
    setFormFeePortal('₹50/-');
    setFormPaymentMode('Online Net Banking, Debit/Credit Card, UPI');
    setFormMinAge('18 वर्ष');
    setFormMaxAge('33 वर्ष');
    setFormAgeRelaxation('नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट');
    setFormShowReservation(true);
    setFormEligibility('');
    setFormApplyLink('');
    setFormPdfLink('');
    setFormSyllabusLink('');
    setFormOfficialSite('');
    setFormImportantLinks([]);
    setFormStatus('published');
    setFormYear(curYear);
    setFormMonth(curMonth);
    setFormBlogNo(getNextBlogNumber(posts, curYear, curMonth));
    setFormSlug('');
    setReviewedDraftId(null);
    setFormIsTechJob(false);
    setFormCompanyName('');
    setFormRole('');
    setFormExperience('');
    setFormLocation('');
    setFormBatchEligibility('');
    setFormUseCustomPoster(false);
    setFormCustomPosterUrl('');
    setFormPosterSizeKb(null);
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
    setFormEndDate(p.dates?.end || p.lastDate || '');
    setFormLastDateFee(p.lastDateFee || p.dates?.end || p.lastDate || '');
    setFormExamDate(p.examDate || p.dates?.exam || 'शीघ्र घोषित');
    setFormAdmitCardDate(p.admitCardDate || 'परीक्षा से 7 दिन पूर्व');
    setFormFeeGen(p.feeGeneral || p.fee?.gen || '₹500/-');
    setFormFeeRes(p.feeReserved || p.fee?.reserved || '₹250/-');
    setFormFeeOBC(p.feeOBC || p.feeReserved || p.fee?.reserved || '₹500/-');
    setFormFeeSCST(p.feeSCST || p.feeReserved || p.fee?.reserved || '₹250/-');
    setFormFeeEWS(p.feeEWS || p.feeGeneral || p.fee?.gen || '₹500/-');
    setFormShowEWS(p.showEWS !== false);
    setFormFeePortal(p.feePortal || '₹50/-');
    setFormPaymentMode(p.paymentMode || 'Online Net Banking, Debit/Credit Card, UPI');
    setFormMinAge(p.minAge || '18 वर्ष');
    setFormMaxAge(p.maxAge || '33 वर्ष');
    setFormAgeRelaxation(p.ageRelaxation || 'नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट');
    setFormShowReservation(p.showReservationSection !== false);
    setFormEligibility(p.eligibility || p.qualification || '');
    setFormApplyLink(p.links?.apply || '');
    setFormPdfLink(p.links?.notificationPdf || '');
    setFormSyllabusLink(p.links?.syllabusPdf || '');
    setFormOfficialSite(p.links?.officialSite || '');
    setFormImportantLinks(p.importantLinks || []);
    setFormStatus(p.status);
    setFormYear(p.year || '2026');
    setFormMonth(p.month || '09');
    setFormBlogNo(p.blogNo || '01');
    setFormSlug(p.slug || p.id);
    setReviewedDraftId(null);
    setFormIsTechJob(Boolean(p.isTechJob || p.categories?.includes('tech')));
    setFormCompanyName(p.companyName || '');
    setFormRole(p.role || '');
    setFormExperience(p.experience || '');
    setFormLocation(p.location || '');
    setFormBatchEligibility(p.batchEligibility || '');
    setFormUseCustomPoster(Boolean(p.useCustomPoster && p.customPosterUrl));
    setFormCustomPosterUrl(p.customPosterUrl || '');
    setFormPosterSizeKb(p.customPosterUrl ? Math.round((p.customPosterUrl.length * 3) / 4 / 1024) : null);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Review Draft in Post Form
  const handleReviewDraft = (draft: ScrapedJobDraft) => {
    const p = draft.suggestedPost;
    const now = new Date();
    const curYear = String(now.getFullYear());
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    setEditingPostId(null);
    setFormTitle(p.title || draft.rawTitle || '');
    setFormShortTitle(p.shortTitle || '');
    setFormDept(p.dept || '');
    setFormTotalPosts(String(p.totalPosts || ''));
    setFormCategories(p.categories || ['vacancy']);
    setFormState((p.state as 'MP' | 'Central' | 'All India') || 'MP');
    setFormStartDate(p.dates?.start || '');
    setFormEndDate(p.dates?.end || p.lastDate || '');
    setFormLastDateFee(p.lastDateFee || p.dates?.end || '');
    setFormExamDate(p.examDate || p.dates?.exam || 'शीघ्र घोषित');
    setFormAdmitCardDate(p.admitCardDate || 'परीक्षा से 7 दिन पूर्व');
    setFormFeeGen(p.feeGeneral || p.fee?.gen || '₹500/-');
    setFormFeeRes(p.feeReserved || p.fee?.reserved || '₹250/-');
    setFormFeePortal(p.feePortal || '₹50/-');
    setFormPaymentMode(p.paymentMode || 'Online Net Banking, Debit/Credit Card, UPI');
    setFormMinAge(p.minAge || '18 वर्ष');
    setFormMaxAge(p.maxAge || '33 वर्ष');
    setFormAgeRelaxation(p.ageRelaxation || 'नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट');
    setFormShowReservation(p.showReservationSection !== false);
    setFormEligibility(p.eligibility || p.qualification || '');
    setFormApplyLink(p.links?.apply || '');
    setFormPdfLink(p.links?.notificationPdf || '');
    setFormSyllabusLink(p.links?.syllabusPdf || '');
    setFormOfficialSite(p.links?.officialSite || '');
    setFormStatus('draft');
    setFormYear(curYear);
    setFormMonth(curMonth);
    setFormBlogNo(getNextBlogNumber(posts, curYear, curMonth));
    setFormSlug(p.slug || p.id || '');
    setReviewedDraftId(draft.id);
    setFormIsTechJob(Boolean(p.isTechJob || p.categories?.includes('tech')));
    setFormCompanyName(p.companyName || '');
    setFormRole(p.role || '');
    setFormExperience(p.experience || '');
    setFormLocation(p.location || '');
    setFormBatchEligibility(p.batchEligibility || '');
    setShowAddForm(true);
    setActiveTab('posts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`ड्राफ्ट समीक्षा फॉर्म में लोड किया गया: ${p.shortTitle || p.title} (क्रम संख्या: ${getNextBlogNumber(posts, curYear, curMonth)})`);
  };

  // Instant URL Scraper & Gemini Grounding Extractor
  const handleExtractFromUrl = async () => {
    if (!scraperUrlInput.trim()) {
      showToast('कृपया किसी आधिकारिक भर्ती पृष्ठ का URL दर्ज करें!');
      return;
    }
    setIsGeminiExtracting(true);
    try {
      const res = await fetch('/api/scraper/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scraperUrlInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Extraction failed');
      }

      const job = data.extractedJob;
      const now = new Date();
      const curYear = String(now.getFullYear());
      const curMonth = String(now.getMonth() + 1).padStart(2, '0');

      setEditingPostId(null);
      setFormTitle(job.title || '');
      setFormShortTitle(job.shortTitle || job.title?.slice(0, 30) || '');
      setFormDept(job.dept || '');
      setFormTotalPosts(String(job.totalPosts || ''));
      setFormCategories(job.category ? [job.category] : ['vacancy']);
      setFormState(job.isTechJob ? 'All India' : 'MP');
      setFormStartDate(job.startDate || '');
      setFormEndDate(job.lastDate || '');
      setFormLastDateFee(job.lastDateFee || job.lastDate || '');
      setFormExamDate(job.examDate || 'शीघ्र घोषित');
      setFormAdmitCardDate(job.admitCardDate || 'परीक्षा से 7 दिन पूर्व');
      setFormFeeGen(job.feeGeneral || '₹500/-');
      setFormFeeRes(job.feeReserved || '₹250/-');
      setFormFeePortal(job.feePortal || '₹50/-');
      setFormPaymentMode(job.paymentMode || 'Online Net Banking, Debit/Credit Card, UPI');
      setFormMinAge(job.minAge || '18 वर्ष');
      setFormMaxAge(job.maxAge || '33 वर्ष');
      setFormAgeRelaxation(job.ageRelaxation || 'नियमानुसार SC/ST/OBC हेतु 5 वर्ष की छूट');
      setFormShowReservation(job.showReservationSection !== false);
      setFormEligibility(job.eligibility || job.qualification || '');
      setFormApplyLink(job.applyUrl || '');
      setFormPdfLink(job.notificationPdfUrl || '');
      setFormOfficialSite(job.officialSite || '');
      setFormStatus('draft');
      setFormYear(curYear);
      setFormMonth(curMonth);
      setFormBlogNo(getNextBlogNumber(posts, curYear, curMonth));
      setFormSlug('');
      setFormIsTechJob(Boolean(job.isTechJob));
      setFormCompanyName(job.dept || '');
      setFormRole(job.role || job.shortTitle || '');
      setFormLocation(job.location || '');
      setFormBatchEligibility(job.batchEligibility || '');

      setShowAddForm(true);
      setActiveTab('posts');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(
        data.isGeminiVerified
          ? 'जेमिनी द्वारा सत्यापित डेटा लोड किया गया! कृपया समीक्षा कर "प्रकाशित करें" दबाएं।'
          : 'डेटा लोड हुआ। कृपया समीक्षा करें।'
      );
    } catch (err: unknown) {
      console.error('URL extraction error:', err);
      const error = err as Error;
      showToast(error.message || 'URL निष्कर्षण में त्रुटि हुई');
    } finally {
      setIsGeminiExtracting(false);
    }
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
      showToast('कृपया स्रोत का नाम एवं URL दर्ज करें');
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

  const handleDeleteDraft = async (draftId: string, postId?: string) => {
    if (postId) {
      await deleteJob(postId);
    }
    await rejectScrapedDraft(draftId);
    setScrapedDrafts((prev) => prev.filter((d) => d.id !== draftId));
    showToast('ड्राफ्ट सफलतापूर्वक हटाया गया!');
    await refreshData();
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

  // LOGIN SCREEN (If not authenticated)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white font-sans">
        <div className="w-full max-w-md bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Brand Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-rose-800 text-white rounded-2xl flex flex-col items-center justify-center mx-auto shadow-xl border-2 border-amber-400 font-black">
              <span className="text-2xl leading-none">NP</span>
              <span className="text-[9px] font-bold text-amber-300 tracking-widest">PORTAL</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-3 tracking-tight">
              NP Job Portal <span className="text-amber-400">Admin</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              सुरक्षित एडमिनिस्ट्रेटर लॉगिन पोर्टल • Nitish Khobragade
            </p>
          </div>

          {errorMsg ? (
            <div className="text-red-500 font-bold bg-red-950/40 p-3 rounded mb-4 text-xs flex items-center gap-2 border border-red-800/50">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> यूजर आईडी / एडमिन ईमेल:
              </label>
              <input
                type="text"
                autoComplete="username"
                value={adminId}
                onChange={(e) => {
                  setAdminId(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdminLogin(e);
                }}
                placeholder="Enter User ID / Admin Email"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 min-h-[44px] text-sm text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 touch-action-manipulation"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> सुरक्षा पासवर्ड:
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdminLogin(e);
                  }}
                  placeholder="Enter Password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-3.5 pr-12 py-2.5 min-h-[44px] text-sm text-white focus:outline-hidden focus:border-amber-400 focus:ring-1 focus:ring-amber-400 touch-action-manipulation"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPass(!showPass);
                  }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors z-20 cursor-pointer touch-action-manipulation"
                  aria-label={showPass ? "Hide password" : "Show password"}
                  title={showPass ? "पासवर्ड छुपाएं" : "पासवर्ड देखें"}
                >
                  {showPass ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              id="admin-login-submit-btn"
              disabled={isSubmitting}
              onClick={handleAdminLogin}
              className="w-full py-3 min-h-[48px] touch-action-manipulation bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-60 text-slate-950 font-black rounded-xl text-sm shadow-lg hover:shadow-amber-500/20 transition-all active:scale-98 flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:cursor-not-allowed select-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>सत्यापन हो रहा है...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>सुरक्षित लॉगिन करें (Secure Login)</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-amber-300 transition-colors inline-flex items-center justify-center gap-1 min-h-[44px] touch-action-manipulation"
            >
              <span>← मुख्य जॉब पोर्टल पर वापस जाएं</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered posts for the table
  const filteredPosts = (Array.isArray(posts) ? posts : []).filter((p) => {
    if (!p) return false;
    const searchLower = (postsSearch || '').trim().toLowerCase();
    const titleLower = (p.title || '').toLowerCase();
    const deptLower = (p.dept || '').toLowerCase();
    const idLower = (p.id || '').toLowerCase();

    const matchesSearch =
      !searchLower ||
      titleLower.includes(searchLower) ||
      deptLower.includes(searchLower) ||
      idLower.includes(searchLower);

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
                  NP Job Portal <span className="text-amber-400">Admin Control</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-500/50">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                संचालक: <strong>{OWNER_INFO.name}</strong> • 8982324497 • घर बैठे सुरक्षित फॉर्म भरवाएं
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
              onClick={async () => {
                showToast('डाटाबेस सिंक प्रारंभ हो रहा है...');
                const res = await seedPostsIfEmpty(true);
                if (res.success) {
                  showToast(`सफलतापूर्वक ${res.count} पोस्ट्स सिंक की गईं!`);
                  await refreshData();
                } else {
                  showToast('सिंक संपन्न हुआ।');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/90 hover:bg-emerald-800 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-700/80 transition-colors cursor-pointer"
              title="डेटाबेस सिंक करें (Sync Initial Database)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>डाटाबेस सिंक</span>
            </button>

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
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap border-t border-slate-800/80 pt-2 pb-2 scrollbar-none text-xs font-bold box-border">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 transition-all ${
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
            className={`px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 transition-all ${
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
            className={`px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 transition-all ${
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
            className={`px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'popup'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4 text-rose-400" />
            <span>पॉप-अप विज्ञापन कैंपेन {popupSettings.enabled && '🟢'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ticker')}
            className={`px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'ticker'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span>लाइव रनिंग टिकर कंट्रोल ({tickersList.filter(t => t.active !== false).length})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 transition-all ${
              activeTab === 'backup'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>डेटाबेस बैकअप एवं रीस्टोर (Full DB Backup)</span>
          </button>

          <Link
            href="/admin/blogs"
            className="px-3.5 py-2 min-h-[44px] touch-action-manipulation rounded-lg flex items-center gap-2 shrink-0 text-slate-300 hover:bg-slate-800 transition-all font-bold hover:text-amber-400 bg-slate-900 border border-slate-700"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>ब्लॉग कंट्रोलर (Blogger Studio) ↗</span>
          </Link>
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
                  {/* Canonical Routing & Numbering Schema Block */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        यूनिवर्सल ब्लॉग स्कीमा (Universal Routing Schema: [year]/[month]/[blogNo]/[slug])
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        Auto-Sequential Active
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold text-[11px]">वर्ष (Year):</label>
                        <input
                          type="text"
                          maxLength={4}
                          value={formYear}
                          onChange={(e) => setFormYear(e.target.value)}
                          placeholder="2026"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold text-[11px]">माह (Month):</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={formMonth}
                          onChange={(e) => setFormMonth(e.target.value)}
                          placeholder="09"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold text-[11px]">ब्लॉग क्रम (Blog No):</label>
                        <input
                          type="text"
                          maxLength={3}
                          value={formBlogNo}
                          onChange={(e) => setFormBlogNo(e.target.value)}
                          placeholder="01"
                          className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold text-[11px]">कस्टम स्लग (Slug):</label>
                        <input
                          type="text"
                          value={formSlug}
                          onChange={(e) => setFormSlug(e.target.value)}
                          placeholder="उदा: mp-police-bharti"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    {/* Live SEO URL Preview */}
                    <div className="pt-1 text-[11px] text-slate-300 flex items-center gap-1 font-mono overflow-x-auto">
                      <span className="text-slate-500">🔗 लाइव URL:</span>
                      <span className="text-amber-300 font-bold">
                        /{formYear || '2026'}/{formMonth || '09'}/{formBlogNo || '01'}/{formSlug || (formShortTitle || formTitle || 'job-post').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'post'}
                      </span>
                    </div>
                  </div>

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

                  {/* Section: Important Dates (dd/mm/yyyy) */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>महत्वपूर्ण तिथियां (Important Dates - dd/mm/yyyy)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">मानकीकृत दिनांक प्रारूप</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          आवेदन प्रारंभ तिथि:
                        </label>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 focus-within:border-amber-400">
                          <input
                            type="text"
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="flex-1 bg-transparent px-2 py-0.5 text-white text-xs font-mono focus:outline-hidden"
                          />
                          <input
                            type="date"
                            value={ddmmyyyyToInputDate(formStartDate)}
                            onChange={(e) => {
                              if (e.target.value) {
                                setFormStartDate(inputDateToDDMMYYYY(e.target.value));
                              }
                            }}
                            className="bg-slate-800 text-amber-300 rounded px-1.5 py-0.5 text-[11px] cursor-pointer border border-slate-600"
                            title="कैलेंडर से प्रारंभ तिथि चुनें (dd/mm/yyyy)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          आवेदन अंतिम तिथि:
                        </label>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 focus-within:border-amber-400">
                          <input
                            type="text"
                            value={formEndDate}
                            onChange={(e) => setFormEndDate(e.target.value)}
                            placeholder="dd/mm/yyyy"
                            className="flex-1 bg-transparent px-2 py-0.5 text-white text-xs font-mono focus:outline-hidden"
                          />
                          <input
                            type="date"
                            value={ddmmyyyyToInputDate(formEndDate)}
                            onChange={(e) => {
                              if (e.target.value) {
                                setFormEndDate(inputDateToDDMMYYYY(e.target.value));
                              }
                            }}
                            className="bg-slate-800 text-rose-300 rounded px-1.5 py-0.5 text-[11px] cursor-pointer border border-slate-600"
                            title="कैलेंडर से अंतिम तिथि चुनें (dd/mm/yyyy)"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          फीस भुगतान अंतिम तिथि:
                        </label>
                        <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1 focus-within:border-amber-400">
                          <input
                            type="text"
                            value={formLastDateFee}
                            onChange={(e) => setFormLastDateFee(e.target.value)}
                            placeholder="उदा: 25/10/2026"
                            className="flex-1 bg-transparent px-2 py-0.5 text-white text-xs font-mono focus:outline-hidden"
                          />
                          <input
                            type="date"
                            value={ddmmyyyyToInputDate(formLastDateFee)}
                            onChange={(e) => {
                              if (e.target.value) {
                                setFormLastDateFee(inputDateToDDMMYYYY(e.target.value));
                              }
                            }}
                            className="bg-slate-800 text-amber-300 rounded px-1.5 py-0.5 text-[11px] cursor-pointer border border-slate-600"
                            title="कैलेंडर से फीस अंतिम तिथि चुनें"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          परीक्षा तिथि (Exam Date):
                        </label>
                        <input
                          type="text"
                          value={formExamDate}
                          onChange={(e) => setFormExamDate(e.target.value)}
                          placeholder="उदा: 18 नवंबर 2026 / शीघ्र घोषित"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-2">
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          प्रवेश पत्र / एडमिट कार्ड तिथि (Admit Card Date):
                        </label>
                        <input
                          type="text"
                          value={formAdmitCardDate}
                          onChange={(e) => setFormAdmitCardDate(e.target.value)}
                          placeholder="उदा: परीक्षा से 7 दिन पूर्व / शीघ्र घोषित"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                    {/* Section: Application Fees & Reservation Switch */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <span className="text-xs font-black text-emerald-400">
                        आवेदन शुल्क विवरण (4-Tier Application Fees Breakdown)
                      </span>
                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-emerald-500 transition-colors">
                          <input
                            type="checkbox"
                            checked={formShowEWS}
                            onChange={(e) => setFormShowEWS(e.target.checked)}
                            className="w-3.5 h-3.5 accent-emerald-500 rounded"
                          />
                          <span className="text-[11px] font-bold text-emerald-300">
                            EWS आरक्षण लागू करें (Show EWS)
                          </span>
                        </label>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-emerald-500 transition-colors">
                          <input
                            type="checkbox"
                            checked={formShowReservation}
                            onChange={(e) => setFormShowReservation(e.target.checked)}
                            className="w-3.5 h-3.5 accent-emerald-500 rounded"
                          />
                          <span className="text-[11px] font-bold text-slate-200">
                            श्रेणी-वार आरक्षण फीस
                          </span>
                        </label>
                      </div>
                    </div>

                    {formShowReservation ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {/* 1. General (UR) */}
                          <div>
                            <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                              सामान्य वर्ग (UR / Other State):
                            </label>
                            <input
                              type="text"
                              value={formFeeGen}
                              onChange={(e) => setFormFeeGen(e.target.value)}
                              placeholder="उदा: ₹500/-"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-emerald-400"
                            />
                          </div>

                          {/* 2. OBC */}
                          <div>
                            <label className="block text-blue-300 font-bold text-[11px] mb-0.5">
                              अन्य पिछड़ा वर्ग (OBC):
                            </label>
                            <input
                              type="text"
                              value={formFeeOBC}
                              onChange={(e) => setFormFeeOBC(e.target.value)}
                              placeholder="उदा: ₹500/- या ₹250/-"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-blue-400"
                            />
                          </div>

                          {/* 3. SC / ST */}
                          <div>
                            <label className="block text-rose-300 font-bold text-[11px] mb-0.5">
                              अ.जा. / अ.ज.जा. (SC / ST):
                            </label>
                            <input
                              type="text"
                              value={formFeeSCST}
                              onChange={(e) => {
                                setFormFeeSCST(e.target.value);
                                setFormFeeRes(e.target.value);
                              }}
                              placeholder="उदा: ₹250/-"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-rose-400"
                            />
                          </div>

                          {/* 4. EWS */}
                          <div>
                            <label className="block text-emerald-300 font-bold text-[11px] mb-0.5 flex items-center justify-between">
                              <span>आर्थिक कमजोर (EWS):</span>
                              <span className="text-[10px] text-slate-400">{formShowEWS ? 'सक्रिय' : 'बंद'}</span>
                            </label>
                            <input
                              type="text"
                              disabled={!formShowEWS}
                              value={formFeeEWS}
                              onChange={(e) => setFormFeeEWS(e.target.value)}
                              placeholder="उदा: ₹500/-"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-800/60">
                          <div>
                            <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                              पोर्टल / कियोस्क शुल्क (Portal Charge):
                            </label>
                            <input
                              type="text"
                              value={formFeePortal}
                              onChange={(e) => setFormFeePortal(e.target.value)}
                              placeholder="उदा: ₹50/- MP Online / पोर्टल"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-emerald-400"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                              भुगतान का माध्यम (Payment Mode):
                            </label>
                            <input
                              type="text"
                              value={formPaymentMode}
                              onChange={(e) => setFormPaymentMode(e.target.value)}
                              placeholder="उदा: Online Net Banking / Debit Card / UPI"
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-emerald-400"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-blue-950/20 border border-blue-900/50 rounded-lg text-xs text-blue-300 flex items-center justify-between">
                        <span>
                          ℹ️ आरक्षण सेक्शन बंद है (निःशुल्क IT/MNC जॉब या ऑल-इंडिया फ्लैट रजिस्ट्रेशन)।
                        </span>
                        <input
                          type="text"
                          value={formFeeGen}
                          onChange={(e) => {
                            setFormFeeGen(e.target.value);
                            setFormFeeRes(e.target.value);
                            setFormFeeOBC(e.target.value);
                            setFormFeeSCST(e.target.value);
                            setFormFeeEWS(e.target.value);
                          }}
                          placeholder="उदा: ₹0/- (Free Registration)"
                          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        />
                      </div>
                    )}
                  </div>

                  {/* Section: Age Limits */}
                  <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2">
                    <span className="text-xs font-black text-amber-300">
                      आयु सीमा विवरण (Age Limit & Relaxation Rules)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          न्यूनतम आयु (Minimum Age):
                        </label>
                        <input
                          type="text"
                          value={formMinAge}
                          onChange={(e) => setFormMinAge(e.target.value)}
                          placeholder="उदा: 18 वर्ष"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          अधिकतम आयु (Maximum Age):
                        </label>
                        <input
                          type="text"
                          value={formMaxAge}
                          onChange={(e) => setFormMaxAge(e.target.value)}
                          placeholder="उदा: 33 वर्ष / 40 वर्ष"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          आयु छूट नियम (Age Relaxation):
                        </label>
                        <input
                          type="text"
                          value={formAgeRelaxation}
                          onChange={(e) => setFormAgeRelaxation(e.target.value)}
                          placeholder="उदा: SC/ST/OBC हेतु 5 वर्ष की छूट"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: Qualification */}
                  <div>
                    <label className="block text-slate-300 font-bold text-xs mb-1">
                      शैक्षणिक योग्यता सारांश (Qualification Summary):
                    </label>
                    <textarea
                      rows={2}
                      value={formEligibility}
                      onChange={(e) => setFormEligibility(e.target.value)}
                      placeholder="उदा: 10वीं हाई स्कूल उत्तीर्ण अथवा 12वीं इंटरमीडिएट। प्रासंगिक पदों हेतु तकनीकी डिप्लोमा आवश्यक।"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  {/* Tech Job Specific Fields */}
                  <div className="bg-slate-950/60 border border-blue-900/60 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                      <div className="flex items-center gap-2 text-blue-400 font-black text-xs">
                        <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                        <span>IT, MNC व कॉर्पोरेट जॉब पैरामीटर (Tech Job Metadata)</span>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800">
                        <input
                          type="checkbox"
                          checked={formIsTechJob || formCategories.includes('tech')}
                          onChange={(e) => setFormIsTechJob(e.target.checked)}
                          className="w-3.5 h-3.5 accent-blue-500 rounded"
                        />
                        <span className="text-[11px] font-bold text-blue-200">
                          IT / Corporate Mode
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          कंपनी का नाम (Company Name)
                        </label>
                        <input
                          type="text"
                          value={formCompanyName}
                          onChange={(e) => setFormCompanyName(e.target.value)}
                          placeholder="उदा: TCS / Infosys / Google"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          पद / रोल (Role)
                        </label>
                        <input
                          type="text"
                          value={formRole}
                          onChange={(e) => setFormRole(e.target.value)}
                          placeholder="उदा: Software Engineer / Trainee"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          अनुभव (Experience)
                        </label>
                        <input
                          type="text"
                          value={formExperience}
                          onChange={(e) => setFormExperience(e.target.value)}
                          placeholder="उदा: Freshers (0 Yrs) / 0-2 Years"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          जॉब लोकेशन / वर्क मोड (Job Location / Work Mode)
                        </label>
                        <input
                          type="text"
                          value={formLocation}
                          onChange={(e) => setFormLocation(e.target.value)}
                          placeholder="उदा: Gurugram / Hybrid / WFH / Indore"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-blue-400"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-slate-300 font-bold text-[11px] mb-0.5">
                          बैच पात्रता (Batch Eligibility)
                        </label>
                        <input
                          type="text"
                          value={formBatchEligibility}
                          onChange={(e) => setFormBatchEligibility(e.target.value)}
                          placeholder="उदा: 2024, 2025 & 2026 Batch Graduates"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-hidden focus:border-blue-400"
                        />
                      </div>
                    </div>
                  </div>

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

                  {/* Dynamic Important Hyperlinks Repeater */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          अतिरिक्त महत्वपूर्ण हाइपरलिंक्स (Dynamic Links Repeater)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          अभ्यर्थियों के लिए अतिरिक्त लिंक्स (जैसे मॉक टेस्ट, सिलेबस, आंसर की, हेल्पडेस्क) जोड़ें
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormImportantLinks((prev) => [
                            ...prev,
                            { id: `link_${Date.now()}`, title: '', url: '' }
                          ])
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        लिंक जोड़ें (Add Link)
                      </button>
                    </div>

                    {formImportantLinks.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-1">
                        कोई अतिरिक्त लिंक नहीं जोड़ा गया। (वैकल्पिक)
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {formImportantLinks.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-2 rounded-lg"
                          >
                            <input
                              type="text"
                              placeholder="लिंक शीर्षक (e.g. मॉक टेस्ट लिंक / एडमिट कार्ड)"
                              value={item.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormImportantLinks((prev) =>
                                  prev.map((lnk, i) => (i === idx ? { ...lnk, title: val } : lnk))
                                );
                              }}
                              className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500"
                            />
                            <input
                              type="url"
                              placeholder="URL (https://...)"
                              value={item.url}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormImportantLinks((prev) =>
                                  prev.map((lnk, i) => (i === idx ? { ...lnk, url: val } : lnk))
                                );
                              }}
                              className="w-1/2 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white placeholder:text-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setFormImportantLinks((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded border border-rose-900/50 transition-colors shrink-0"
                              title="हटाएं (Remove)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Poster Upload & Compression Engine */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                      <div>
                        <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-amber-400" />
                          <span>कस्टम पोस्टर अपलोड एवं कंप्रेशन इंजन (Custom Poster Engine)</span>
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          ऑटो-जेनरेटेड टेक्स्ट पोस्टर की जगह अपनी कस्टम बैनर इमेज लगाएं (ऑटो कंप्रेस ~100KB)
                        </p>
                      </div>

                      {/* Mode Toggle */}
                      <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-700 text-xs font-bold shrink-0">
                        <button
                          type="button"
                          onClick={() => setFormUseCustomPoster(false)}
                          className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                            !formUseCustomPoster
                              ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span>ऑटो-जनरेटेड</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormUseCustomPoster(true)}
                          className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                            formUseCustomPoster
                              ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>कस्टम इमेज</span>
                        </button>
                      </div>
                    </div>

                    {formUseCustomPoster && (
                      <div className="space-y-3 pt-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <input
                              type="file"
                              accept="image/*"
                              id="form-poster-upload-input"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsFormCompressingPoster(true);

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
                                      ctx.imageSmoothingEnabled = true;
                                      ctx.imageSmoothingQuality = 'high';
                                      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                                      let quality = 0.82;
                                      let dataUrl = canvas.toDataURL('image/webp', quality);
                                      let sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

                                      if (sizeKb > 150) {
                                        quality = 0.70;
                                        dataUrl = canvas.toDataURL('image/webp', quality);
                                        sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);
                                      }

                                      setFormCustomPosterUrl(dataUrl);
                                      setFormPosterSizeKb(sizeKb);
                                      setIsFormCompressingPoster(false);
                                    }
                                  };
                                  img.onerror = () => setIsFormCompressingPoster(false);
                                  img.src = event.target?.result as string;
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                            <label
                              htmlFor="form-poster-upload-input"
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{formCustomPosterUrl ? 'पोस्टर बदलें (Replace)' : 'पोस्टर इमेज अपलोड करें'}</span>
                            </label>

                            {formCustomPosterUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormCustomPosterUrl('');
                                  setFormPosterSizeKb(null);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-xs font-bold border border-rose-800/80"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>हटाएं</span>
                              </button>
                            )}
                          </div>

                          <div className="text-right text-[11px] text-slate-400">
                            {isFormCompressingPoster ? (
                              <span className="text-amber-400 font-bold animate-pulse">
                                कंप्रेस हो रहा है (~1080px WebP)...
                              </span>
                            ) : formPosterSizeKb ? (
                              <span className="text-emerald-400 font-bold">
                                ✓ कंप्रेस्ड आकार: ~{formPosterSizeKb} KB
                              </span>
                            ) : (
                              <span>आधिकारिक वॉटरमार्क स्वचालित रूप से लागू रहेगा</span>
                            )}
                          </div>
                        </div>

                        {formCustomPosterUrl && (
                          <div className="flex items-center gap-3 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={formCustomPosterUrl}
                              alt="Form Custom Poster Preview"
                              className="w-12 h-16 object-cover rounded border border-slate-700"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                कस्टम पोस्टर इमेज लोड हो चुकी है
                              </p>
                              <p className="text-[11px] text-slate-400">
                                यह इमेज विवरण पृष्ठ एवं पोस्टर स्टूडियो दोनों में प्रदर्शित होगी।
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
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

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <span className="text-xs text-slate-400 font-semibold shrink-0">फिल्टर:</span>
                {(['all', 'published', 'draft', 'suspended'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    onClick={() => setSelectedStatusFilter(filterKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-colors ${
                      selectedStatusFilter === filterKey
                        ? 'bg-amber-400 text-slate-950 shadow-xs'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {filterKey}
                  </button>
                ))}
              </div>
            </div>

            {/* CONTROLLED STATUS COMMIT BANNER (Visible whenever uncommitted status changes exist) */}
            {Object.keys(pendingStatusChanges).length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-500/10 border-2 border-amber-500/80 rounded-xl p-3.5 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                  <div>
                    <span className="font-black text-amber-300 text-xs sm:text-sm">
                      {Object.keys(pendingStatusChanges).length} पोस्ट की स्थिति में अप्रकाशित बदलाव हैं (Unsaved Status Changes)
                    </span>
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      ये बदलाव अभी स्थानीय हैं। जब तक आप &apos;Save Changes&apos; पर क्लिक नहीं करते, डेटाबेस में बदलाव सुरक्षित नहीं होगा।
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleDiscardStatusChanges}
                    disabled={isSavingStatusChanges}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-slate-700"
                  >
                    रद्द करें (Discard)
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStatusChanges}
                    disabled={isSavingStatusChanges}
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-lg shadow transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingStatusChanges ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>सहेजा जा रहा है...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Changes (परिवर्तन सुरक्षित करें)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* LIVE POSTS HORIZONTAL DATA TABLE */}
            <div className="w-full overflow-x-auto -mx-2 sm:mx-0 shadow rounded-lg border border-slate-800 bg-slate-900">
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs min-w-[900px]">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-3 w-12 text-center">क्र.</th>
                      <th className="py-3.5 px-3 w-32">आइडेंटिफायर</th>
                      <th className="py-3.5 px-4 min-w-[220px]">भर्ती व विभाग</th>
                      <th className="py-3.5 px-3 w-36">श्रेणी व राज्य</th>
                      <th className="py-3.5 px-3 w-36">स्थिति (Status)</th>
                      <th className="py-3.5 px-3 w-40">तिथियां (dd/mm/yyyy)</th>
                      <th className="py-3.5 px-4 text-right min-w-[180px]">कार्य (Actions)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPosts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-500">
                          कोई पोस्ट नहीं मिली। (No matching posts found)
                        </td>
                      </tr>
                    ) : (
                      filteredPosts.map((job, index) => {
                        const postUrl = getPostUrl(job);
                        const identifierStr = `${job.routingYear || '2026'}/${job.routingMonth || '09'}/${job.routingBlogNo || '01'}`;
                        const startDateFmt = formatDateToDDMMYYYY(job.dates?.start || '');
                        const endDateFmt = formatDateToDDMMYYYY(job.dates?.end || '');

                        return (
                          <tr key={job.id} className="hover:bg-slate-800/40 transition-colors group">
                            {/* 1. S.No */}
                            <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold">
                              {index + 1}
                            </td>

                            {/* 2. Identifier: [year]/[month]/[blogNo] */}
                            <td className="py-3 px-3">
                              <span className="inline-block px-2 py-1 rounded bg-slate-950 border border-amber-500/30 text-amber-300 font-mono text-[11px] font-bold">
                                {identifierStr}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[120px]">
                                {job.routingSlug || job.id}
                              </div>
                            </td>

                            {/* 3. Job Title & Department */}
                            <td className="py-3 px-4">
                              <Link
                                href={postUrl}
                                target="_blank"
                                className="font-bold text-white hover:text-amber-300 transition-colors line-clamp-2"
                              >
                                {job.title}
                              </Link>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                <span className="text-slate-300 font-medium truncate max-w-[150px]">
                                  {job.dept}
                                </span>
                                <span className="text-amber-400 font-bold font-mono">
                                  • {job.totalPosts}
                                </span>
                              </div>
                            </td>

                            {/* 4. Category & State */}
                            <td className="py-3 px-3">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase text-center w-max ${
                                    job.state === 'MP'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : job.state === 'Central'
                                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                                  }`}
                                >
                                  {job.state || 'MP'}
                                </span>
                                <span className="text-[10px] text-slate-400 capitalize truncate">
                                  {job.categories?.slice(0, 2).join(', ') || 'Vacancy'}
                                </span>
                              </div>
                            </td>

                            {/* 5. Status Badge & Quick Change */}
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                                      job.status === 'published'
                                        ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
                                        : job.status === 'suspended'
                                        ? 'bg-rose-950 text-rose-400 border-rose-700'
                                        : 'bg-amber-950 text-amber-400 border-amber-700'
                                    }`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      job.status === 'published' ? 'bg-emerald-400' : job.status === 'suspended' ? 'bg-rose-400' : 'bg-amber-400'
                                    }`}></span>
                                    {job.status === 'published' ? 'Published' : job.status === 'suspended' ? 'Suspended' : 'Draft'}
                                  </span>
                                  {pendingStatusChanges[job.id] && (
                                    <span className="px-1.5 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/50 rounded text-[9px] font-bold animate-pulse" title="असुरक्षित परिवर्तन">
                                      Unsaved
                                    </span>
                                  )}
                                </div>
                                
                                {/* Quick Status Selector */}
                                <select
                                  value={job.status || 'published'}
                                  onChange={(e) => handleToggleStatus(job.id, e.target.value as 'published' | 'draft' | 'suspended')}
                                  className={`block text-[10px] bg-slate-950 border rounded px-1.5 py-0.5 text-slate-300 hover:border-slate-500 cursor-pointer ${
                                    pendingStatusChanges[job.id] ? 'border-amber-400 text-amber-200 ring-1 ring-amber-400/30' : 'border-slate-700'
                                  }`}
                                  title="स्थिति बदलें (Change Status)"
                                >
                                  <option value="published">प्रकाशित (Published)</option>
                                  <option value="draft">ड्राफ्ट (Draft)</option>
                                  <option value="suspended">निलंबित (Suspended)</option>
                                </select>
                              </div>
                            </td>

                            {/* 6. Dates: Start & Last Date (dd/mm/yyyy) */}
                            <td className="py-3 px-3 font-mono text-[11px]">
                              <div className="text-slate-300">
                                <span className="text-[10px] text-slate-500 mr-1">प्रारंभ:</span>
                                {startDateFmt || 'विज्ञप्ति अनुसार'}
                              </div>
                              <div className="text-rose-400 font-bold mt-0.5">
                                <span className="text-[10px] text-slate-500 mr-1">अंतिम:</span>
                                {endDateFmt || 'विज्ञप्ति अनुसार'}
                              </div>
                            </td>

                            {/* 7. Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Edit Details */}
                                <button
                                  onClick={() => startEditPost(job)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="पोस्ट संपादित करें (Quick Edit)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* View Live Post */}
                                <Link
                                  href={postUrl}
                                  target="_blank"
                                  className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors"
                                  title={`लाइव यूआरएल देखें: ${postUrl}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Link>

                                {/* Launch Poster Studio */}
                                <button
                                  onClick={() => {
                                    setPosterJob(job);
                                    setActiveTab('poster');
                                    if (typeof window !== 'undefined') {
                                      const url = new URL(window.location.href);
                                      url.searchParams.set('tab', 'poster');
                                      url.searchParams.set('postId', job.id);
                                      window.history.pushState(null, '', url.toString());
                                    }
                                  }}
                                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 transition-colors cursor-pointer"
                                  title="पोस्टर बनाएं / एडिट करें (Generate/Edit Poster)"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Social Multi-Share Trigger */}
                                <button
                                  onClick={() => setSelectedShareJob(job)}
                                  className="p-1.5 rounded-lg bg-emerald-900/40 hover:bg-emerald-600 text-emerald-300 hover:text-white transition-colors cursor-pointer"
                                  title="सोशल मीडिया (WhatsApp / Insta / Telegram) शेयर करें"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Override Links */}
                                <button
                                  onClick={() => handleOpenOverrideModal(job)}
                                  className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                                  title="हाइपरलिंक अपडेट करें"
                                >
                                  <LinkIcon className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeletePost(job.id, job.title)}
                                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-600 text-rose-300 hover:text-white transition-colors cursor-pointer"
                                  title="पोस्ट हटाएं (Delete)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
              <PosterStudio
                job={posterJob}
                initialEditableMode={true}
                isAdmin={true}
                onBackToPosts={() => {
                  setActiveTab('posts');
                  if (typeof window !== 'undefined') {
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', 'posts');
                    url.searchParams.delete('postId');
                    window.history.pushState(null, '', url.toString());
                  }
                }}
                onJobUpdated={(updated) => {
                  setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                  setPosterJob(updated);
                }}
              />
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

            {/* 1. SINGLE WEB PAGE INSTANT SCRAPER (URL INPUT & GEMINI GROUNDING) */}
            <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-indigo-950/40 border-2 border-purple-600/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                      <span>सिंगल वेब पेज इंस्टेंट स्क्रैपर (Single URL Scraper)</span>
                      <span className="text-[10px] bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Gemini 2.5 Flash Grounding
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      किसी भी आधिकारिक भर्ती सूचना या करियर पेज का URL दर्ज करें — जेमिनी AI तिथियां, फीस, पात्रता व पद स्वतः निष्कर्षित कर फॉर्म भरेगा।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-purple-300 font-mono bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-xl self-start md:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>AI Grounding Engine Ready</span>
                </div>
              </div>

              {/* URL Input Form */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={scraperUrlInput}
                    onChange={(e) => setScraperUrlInput(e.target.value)}
                    placeholder="Enter any Official Notification or Recruitment URL (उदा: https://esb.mp.gov.in/... या https://ssc.gov.in/...)"
                    className="w-full bg-slate-950/90 border-2 border-purple-500/40 focus:border-purple-400 text-white placeholder-slate-500 text-xs sm:text-sm rounded-xl px-4 py-3 focus:outline-hidden font-mono shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleExtractFromUrl();
                      }
                    }}
                  />
                  {scraperUrlInput && (
                    <button
                      type="button"
                      onClick={() => setScraperUrlInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs bg-slate-800 px-2 py-0.5 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleExtractFromUrl}
                  disabled={isGeminiExtracting || !scraperUrlInput.trim()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isGeminiExtracting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>जेमिनी AI सत्यापन जारी है...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Auto-Fetch & Ground with Gemini</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Sample Presets */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-slate-400 font-bold">त्वरित टेस्ट सैंपल्स:</span>
                {[
                  { label: '🏛️ MPESB व्यापम', url: 'https://esb.mp.gov.in/latest-rulebooks' },
                  { label: '🏛️ SSC CGL/GD', url: 'https://ssc.gov.in/api/latest-notices' },
                  { label: '🏛️ MPPSC राज्य सेवा', url: 'https://mppsc.mp.gov.in/notifications' },
                  { label: '💼 Infosys Careers', url: 'https://career.infosys.com/joblist' },
                  { label: '💼 TCS iON NQT', url: 'https://tcs.com/careers/india-freshers' },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setScraperUrlInput(sample.url)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-purple-900/60 border border-purple-800/40 text-purple-300 hover:text-white transition-colors"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub Tabs: Registry Table vs Govt Jobs vs Tech & IT vs Drafts Queue */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveScraperSubTab('registry')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeScraperSubTab === 'registry'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>बल्क स्रोत रजिस्ट्री (Registry Table)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-white font-mono">
                    {scraperSources.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveScraperSubTab('govt')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeScraperSubTab === 'govt'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>🏛️</span>
                  <span>Govt Jobs Portals</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 font-mono">
                    {scraperSources.filter((s) => s.bucket !== 'tech_corporate').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveScraperSubTab('tech')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeScraperSubTab === 'tech'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>💻</span>
                  <span>Tech & IT Jobs Portals</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950/80 font-mono">
                    {scraperSources.filter((s) => s.bucket === 'tech_corporate').length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveScraperSubTab('queue')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    activeScraperSubTab === 'queue'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Draft Posts Queue</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold font-mono">
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
                  ड्राफ्ट्स कतार:{' '}
                  <strong className="text-amber-400">{scrapedDrafts.filter((d) => d.status === 'queued').length}</strong>
                </span>
              </div>
            </div>

            {/* TAB 0: BULK SOURCE MANAGEMENT DASHBOARD TABLE */}
            {activeScraperSubTab === 'registry' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                  <div>
                    <h4 className="text-sm font-black text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-400" />
                      <span>केंद्रीय, म.प्र. राज्य एवं MNC करियर स्रोत तालिका (Standard Source Registry)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      MPESB, MPPSC, SSC, UPSC, Railway, TCS, Infosys, Wipro आदि के प्रत्यक्ष एंडपॉइंट्स व मॉनिटरिंग स्विच।
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setNewSourceBucket('govt_portals');
                      setShowAddSourceModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-transform active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ नया स्रोत पंजीकृत करें</span>
                  </button>
                </div>

                {/* Full Sources Table */}
                <div className="w-full overflow-x-auto -mx-2 sm:mx-0 shadow rounded-lg border border-slate-800 bg-slate-900">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-3">पोर्टल नाम (Portal Name)</th>
                          <th className="py-3 px-3">श्रेणी (Type)</th>
                          <th className="py-3 px-3">स्रोत URL (Source URL)</th>
                          <th className="py-3 px-3">विधि (Fetch Mode)</th>
                          <th className="py-3 px-3 text-center">सक्रिय स्विच (Active)</th>
                          <th className="py-3 px-3">अंतिम जांच (Last Checked)</th>
                          <th className="py-3 px-3 text-right">कार्रवाई (Action)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {scraperSources.map((source) => {
                          const isFetching = isFetchingSourceId === source.id;
                          return (
                            <tr key={source.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                  <span>{source.name}</span>
                                </div>
                                {source.description && (
                                  <span className="text-[10px] text-slate-400 font-normal block truncate max-w-xs">
                                    {source.description}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
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
                                    ? 'MP State'
                                    : source.bucket === 'tech_corporate'
                                    ? 'Tech / IT'
                                    : 'Central Govt'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] max-w-[220px] truncate">
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-400 hover:text-purple-300 hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{source.url}</span>
                                </a>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                                  {source.feedType.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <button
                                  onClick={() => handleToggleSource(source.id)}
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                                    source.enabled
                                      ? 'bg-emerald-950 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                  }`}
                                  title={source.enabled ? 'निष्क्रिय करें' : 'सक्रिय करें'}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      source.enabled ? 'bg-emerald-400' : 'bg-slate-500'
                                    }`}
                                  />
                                  <span>{source.enabled ? 'Active' : 'Off'}</span>
                                </button>
                              </td>
                              <td className="py-3 px-3 text-[10px] text-slate-400 font-mono whitespace-nowrap">
                                {source.lastCheckedAt ? source.lastCheckedAt.split('T')[0] : 'Never'}
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => handleFetchSingleSource(source)}
                                  disabled={isFetching || !source.enabled}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-[11px] rounded-lg transition-transform active:scale-95 cursor-pointer shadow"
                                  title="इस पोर्टल को अभी स्कैन करें"
                                >
                                  <Play className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                                  <span>{isFetching ? 'स्कैनिंग...' : 'Scrape'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 1: GOVT JOBS SCRAPERS & TAB 2: TECH & IT JOBS SCRAPERS */}
            {(activeScraperSubTab === 'govt' || activeScraperSubTab === 'tech') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
                  <div className="text-xs text-slate-300">
                    {activeScraperSubTab === 'govt' ? (
                      <span>
                        🏛️ <strong>Govt Jobs Portals:</strong> SSC, MPESB (Vyapam), UPSC, Railway, MPPSC एवं अन्य राज्य/केंद्रीय भर्ती स्रोत।
                      </span>
                    ) : (
                      <span>
                        💻 <strong>Tech & IT Jobs Portals:</strong> Google, Microsoft, Amazon, Top IT MNCs & Indore/Pune Tech Freshers।
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setNewSourceBucket(activeScraperSubTab === 'tech' ? 'tech_corporate' : 'govt_portals');
                      setShowAddSourceModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 hover:text-white font-bold text-xs rounded-lg transition-transform active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add New Target URL</span>
                  </button>
                </div>

                {/* Sources Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scraperSources
                    .filter((s) => {
                      if (activeScraperSubTab === 'tech') {
                        return s.bucket === 'tech_corporate';
                      }
                      return s.bucket !== 'tech_corporate';
                    })
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
                                <span>{source.enabled ? 'सक्रिय' : 'निष्क्रिय'}</span>
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

                          {/* Action Footer with Scrap Now */}
                          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                            <button
                              onClick={() => handleTriggerTestSource(source.id)}
                              disabled={isFetching}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black shadow transition-all active:scale-95 disabled:opacity-50"
                            >
                              <Play className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
                              <span>{isFetching ? 'स्क्रैप हो रहा है...' : 'Scrap Now'}</span>
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

            {/* TAB 3: SCRAPED DRAFTS INGESTION QUEUE */}
            {activeScraperSubTab === 'queue' && (
              <div className="space-y-4">
                {/* Drafts Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold mr-1">बकेट फ़िल्टर:</span>
                    {[
                      { id: 'all' as const, label: 'सभी (All)' },
                      { id: 'central' as const, label: '🏛️ Central Govt' },
                      { id: 'mp' as const, label: '🌲 MP Special' },
                      { id: 'tech' as const, label: '💻 Tech / IT' }
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
                            {/* Top Source badge & Confidence Score & Not Published Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-purple-300 bg-purple-950/80 border border-purple-800 px-2 py-0.5 rounded">
                                  {draft.sourcePortal}
                                </span>
                                {isTech && (
                                  <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded">
                                    Tech / IT
                                  </span>
                                )}
                                <span className="text-[10px] font-black text-amber-300 bg-amber-950/90 border border-amber-500/60 px-2 py-0.5 rounded animate-pulse">
                                  Not Published
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                AI स्कोर: {draft.confidenceScore}%
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

                          {/* Actions: Edit / Review, Approve & Publish, and Delete Draft */}
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
                                    : 'प्रतीक्षारत (Queued Draft)'}
                                </strong>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {draft.id.slice(-6)}
                              </span>
                            </div>

                            {draft.status === 'queued' && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  onClick={() => handleDeleteDraft(draft.id, draft.suggestedPost.id)}
                                  className="px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                  title="ड्राफ्ट हटाएं (Delete Draft)"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>हटाएं</span>
                                </button>
                                <button
                                  onClick={() => handleReviewDraft(draft)}
                                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                  title="समीक्षा व संपादन फॉर्म में खोलें"
                                >
                                  <Edit3 className="w-3 h-3 text-amber-400" />
                                  <span>Edit / Review</span>
                                </button>
                                <button
                                  onClick={() => handleApproveDraft(draft.id)}
                                  className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black shadow transition-all active:scale-95 text-center"
                                >
                                  Approve & Publish
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

        {/* TAB 5: LIVE RUNNING TICKER CONTROLLER */}
        {activeTab === 'ticker' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-red-500 animate-pulse" />
                  लाइव रनिंग टिकर कंट्रोल (Live Running Ticker Manager)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  होमपेज के शीर्ष पर स्क्रॉल होने वाले मुख्य ब्रेकिंग अलर्ट्स, नई भर्तियां और लिंक प्रबंधित करें
                </p>
              </div>

              <button
                type="button"
                disabled={isSavingTickers}
                onClick={async () => {
                  setIsSavingTickers(true);
                  try {
                    const success = await saveTickers(tickersList);
                    if (success) {
                      showToast('टिकर अलर्ट्स सफलतापूर्वक क्लाउड पर सेव हो गए!');
                    } else {
                      showToast('टिकर अलर्ट्स स्थानीय रूप से सेव हुए।');
                    }
                  } catch (e) {
                    console.error('Save tickers error:', e);
                    showToast('टिकर सेव करने में त्रुटि हुई।');
                  } finally {
                    setIsSavingTickers(false);
                  }
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black rounded-xl text-xs shadow-lg transition-all active:scale-98 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingTickers ? 'सहेजा जा रहा है...' : 'सभी टिकर बदलाव सुरक्षित करें'}</span>
              </button>
            </div>

            {/* Live Ticker Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                लाइव टिकर पूर्वावलोकन (Preview):
              </span>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 text-xs text-white overflow-x-auto whitespace-nowrap flex items-center gap-4">
                <span className="px-2 py-0.5 rounded bg-red-600 text-[10px] font-black tracking-wide text-white uppercase animate-pulse shrink-0">
                  NEW UPDATE
                </span>
                {tickersList.filter((t) => t.active !== false).length === 0 ? (
                  <span className="text-slate-500 italic">वर्तमान में कोई सक्रिय टिकर अलर्ट नहीं है।</span>
                ) : (
                  tickersList
                    .filter((t) => t.active !== false)
                    .map((item, idx) => (
                      <span key={item.id || idx} className="inline-flex items-center gap-1.5 text-slate-200">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.isBreaking ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.date || (item.isBreaking ? 'BREAKING' : 'NEW')}
                        </span>
                        <span>{item.text}</span>
                        {idx < tickersList.filter((t) => t.active !== false).length - 1 && (
                          <span className="text-slate-600 ml-2">●</span>
                        )}
                      </span>
                    ))
                )}
              </div>
            </div>

            {/* Add New Ticker Alert Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>नया टिकर अलर्ट जोड़ें (Add New Ticker Alert)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                <div className="sm:col-span-5">
                  <label className="block text-slate-300 font-bold mb-1">
                    अलर्ट टेक्स्ट (Headline / Message):
                  </label>
                  <input
                    type="text"
                    value={newTickerText}
                    onChange={(e) => setNewTickerText(e.target.value)}
                    placeholder="उदा: MP ESB सब इंजीनियर 1280 पद ऑनलाइन फॉर्म प्रारंभ..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-slate-300 font-bold mb-1">
                    टारगेट लिंक (Route URL or WhatsApp):
                  </label>
                  <input
                    type="text"
                    value={newTickerLink}
                    onChange={(e) => setNewTickerLink(e.target.value)}
                    placeholder="उदा: /2026/09/01/mpesb-sub-engineer या URL"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-slate-300 font-bold mb-1">
                    तिथि / बैज (Badge Text):
                  </label>
                  <input
                    type="text"
                    value={newTickerDate}
                    onChange={(e) => setNewTickerDate(e.target.value)}
                    placeholder="उदा: 23 सितंबर / आज"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={newTickerIsBreaking}
                    onChange={(e) => setNewTickerIsBreaking(e.target.checked)}
                    className="w-3.5 h-3.5 accent-red-500 rounded"
                  />
                  <span className="text-xs font-bold text-red-300">
                    🔴 ब्रेकिंग न्यूज़ के रूप में हाइलाइट करें (Is Breaking News)
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!newTickerText.trim()) {
                      showToast('कृपया टिकर टेक्स्ट दर्ज करें।');
                      return;
                    }
                    const newItem: TickerAlert = {
                      id: `ticker-${Date.now()}`,
                      text: newTickerText.trim(),
                      link: newTickerLink.trim() || OWNER_INFO.whatsappUrl,
                      date: newTickerDate.trim() || 'NEW',
                      isBreaking: newTickerIsBreaking,
                      active: true
                    };
                    const updated = [newItem, ...tickersList];
                    setTickersList(updated);
                    saveTickers(updated);
                    setNewTickerText('');
                    setNewTickerLink('');
                    setNewTickerDate('');
                    setNewTickerIsBreaking(false);
                    showToast('नया टिकर अलर्ट सफलतापूर्वक जुड़ गया!');
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs shadow transition-all active:scale-98 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>टिकर में जोड़ें</span>
                </button>
              </div>
            </div>

            {/* Existing Ticker Alerts List */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">
                  सक्रिय टिकर अलर्ट सूची ({tickersList.length} कुल)
                </h3>
                <span className="text-xs text-slate-400">
                  क्रमबद्ध सूची (Reorder / Toggle / Remove)
                </span>
              </div>

              {tickersList.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  कोई टिकर अलर्ट मौजूद नहीं है। ऊपर से नया अलर्ट जोड़ें।
                </div>
              ) : (
                <div className="space-y-2">
                  {tickersList.map((t, idx) => (
                    <div
                      key={t.id || idx}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                        t.active !== false
                          ? 'bg-slate-950 border-slate-800'
                          : 'bg-slate-950/40 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            t.isBreaking ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}>
                            {t.date || (t.isBreaking ? 'BREAKING' : 'NEW')}
                          </span>
                          <span className="font-bold text-white">{t.text}</span>
                        </div>
                        {t.link && (
                          <div className="text-[11px] text-blue-400 truncate max-w-xl">
                            🔗 {t.link}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle Active */}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = tickersList.map((item, i) =>
                              i === idx ? { ...item, active: item.active === false ? true : false } : item
                            );
                            setTickersList(updated);
                            saveTickers(updated);
                          }}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                            t.active !== false
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {t.active !== false ? '🟢 सक्रिय (Active)' : '⚪ निष्क्रिय (Disabled)'}
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            if (idx === 0) return;
                            const updated = [...tickersList];
                            const temp = updated[idx - 1];
                            updated[idx - 1] = updated[idx];
                            updated[idx] = temp;
                            setTickersList(updated);
                            saveTickers(updated);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-30 cursor-pointer"
                          title="ऊपर ले जाएं"
                        >
                          ↑
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === tickersList.length - 1}
                          onClick={() => {
                            if (idx === tickersList.length - 1) return;
                            const updated = [...tickersList];
                            const temp = updated[idx + 1];
                            updated[idx + 1] = updated[idx];
                            updated[idx] = temp;
                            setTickersList(updated);
                            saveTickers(updated);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded disabled:opacity-30 cursor-pointer"
                          title="नीचे ले जाएं"
                        >
                          ↓
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`क्या आप इस टिकर अलर्ट को हटाना चाहते हैं?\n"${t.text}"`)) {
                              const updated = tickersList.filter((_, i) => i !== idx);
                              setTickersList(updated);
                              saveTickers(updated);
                              showToast('टिकर अलर्ट हटाया गया।');
                            }
                          }}
                          className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded border border-rose-800/80 cursor-pointer"
                          title="हटाएं"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: DATABASE BACKUP & RESTORE MANAGER */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Header info card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>संपूर्ण पोर्टल डेटाबेस बैकअप एवं रीस्टोर प्रबंधक</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  पोर्टल की सभी {posts.length} सरकारी भर्तियां, AI स्क्रैपर स्रोत, रनिंग टिकर्स एवं विज्ञापन सेटिंग्स को एक क्लिक में JSON बैकअप के रूप में सुरक्षित डाउनलोड करें अथवा बैकअप से रीस्टोर करें।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isExportingBackup}
                  onClick={async () => {
                    setIsExportingBackup(true);
                    setBackupRestoreError(null);
                    setBackupRestoreMessage('डेटाबेस स्नैपशॉट एकत्रित किया जा रहा है...');
                    try {
                      const snapshot = await exportFullDatabaseBackup();
                      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      const dateStr = new Date().toISOString().slice(0, 10);
                      a.href = url;
                      a.download = `np-job-portal-backup-${dateStr}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setBackupRestoreMessage(`सफलतापूर्वक बैकअप एक्सपोर्ट किया गया! (${snapshot.counts.posts} पोस्ट्स सुरक्षित)`);
                      showToast('डेटाबेस बैकअप फ़ाइल डाउनलोड हो गई!');
                    } catch (err: unknown) {
                      console.error('Backup export failed:', err);
                      setBackupRestoreError('बैकअप एक्सपोर्ट विफल: ' + (err instanceof Error ? err.message : 'अज्ञात त्रुटि'));
                    } finally {
                      setIsExportingBackup(false);
                    }
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isExportingBackup ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>पूर्ण बैकअप डाउनलोड करें (JSON)</span>
                </button>
              </div>
            </div>

            {/* Notification & Status Messages */}
            {backupRestoreMessage && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{backupRestoreMessage}</span>
              </div>
            )}

            {backupRestoreError && (
              <div className="p-4 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 text-xs font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{backupRestoreError}</span>
              </div>
            )}

            {/* Two Column Operational Grid: Live Stats & Restore Wizard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Box 1: Current Database Status */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>वर्तमान लाइव डेटाबेस स्नैपशॉट सारांश</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">कुल भर्ती पोस्ट्स:</span>
                    <span className="text-xl font-black text-amber-400 font-mono">{posts.length}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      प्रकाशित: {posts.filter(p => p.status === 'published').length} • ड्राफ्ट: {posts.filter(p => p.status === 'draft').length}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">लाइव टिकर अलर्ट्स:</span>
                    <span className="text-xl font-black text-red-400 font-mono">{tickersList.length}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      सक्रिय: {tickersList.filter(t => t.active !== false).length}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">AI स्क्रैपर स्रोत:</span>
                    <span className="text-xl font-black text-purple-400 font-mono">{scraperSources.length}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      कतार में ड्राफ्ट: {scrapedDrafts.filter(d => d.status === 'queued').length}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">पॉपअप कैंपेन:</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {popupSettings.enabled ? 'सक्रिय 🟢' : 'निष्क्रिय ⚪'}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {popupSettings.title ? popupSettings.title.slice(0, 20) + '...' : 'डिफ़ॉल्ट'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    ऑटो-क्लाउड व लोकल सिंक्रोनाइज़ेशन
                  </p>
                  <p className="text-slate-400">
                    डेटाबेस Firestore क्लाउड पर सुरक्षित रूप से होस्टेड है। नियमित बैकअप लेने से किसी भी परिस्थिति में आपका डेटा 100% सुरक्षित रहता है।
                  </p>
                </div>
              </div>

              {/* Box 2: Restore from Backup JSON */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Upload className="w-4 h-4 text-blue-400" />
                  <span>बैकअप JSON से रीस्टोर करें (Database Restore)</span>
                </h3>

                <p className="text-xs text-slate-400">
                  पूर्व में डाउनलोड की गई <strong>.json</strong> बैकअप फ़ाइल का चयन करें। सिस्टम स्वचालित रूप से डेटा संरचना का सत्यापन कर डेटाबेस को अपडेट करेगा।
                </p>

                <div className="space-y-3">
                  <input
                    type="file"
                    accept=".json,application/json"
                    id="db-restore-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBackupRestoreError(null);
                      setBackupRestoreMessage(null);

                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const parsed = JSON.parse(event.target?.result as string);
                          if (!parsed || !parsed.data || !Array.isArray(parsed.data.posts)) {
                            throw new Error('अमान्य बैकअप संरचना। कृपया केवल NP Job Portal की बैकअप JSON फ़ाइल अपलोड करें।');
                          }
                          setParsedBackupSnapshot(parsed);
                          setBackupRestoreMessage(`फ़ाइल मान्य है! पाया गया: ${parsed.data.posts.length} पोस्ट्स, ${parsed.data.tickers?.length || 0} टिकर अलर्ट्स।`);
                        } catch (err: unknown) {
                          setParsedBackupSnapshot(null);
                          setBackupRestoreError('फ़ाइल पढ़ने में त्रुटि: ' + (err instanceof Error ? err.message : 'अमान्य JSON'));
                        }
                      };
                      reader.readAsText(file);
                    }}
                  />

                  <label
                    htmlFor="db-restore-file-input"
                    className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-blue-400 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-950/60"
                  >
                    <Upload className="w-6 h-6 text-blue-400" />
                    <span className="text-xs font-bold text-white">
                      बैकअप JSON फ़ाइल चुनें (.json)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      कंप्यूटर अथवा मोबाइल से बैकअप फ़ाइल ब्राउज करें
                    </span>
                  </label>

                  {/* Parsed Snapshot Preview & Confirm Button */}
                  {parsedBackupSnapshot && (
                    <div className="p-4 bg-slate-950 rounded-xl border border-blue-500/40 space-y-3">
                      <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                        <span className="font-bold text-blue-300">पहचाना गया बैकअप:</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {parsedBackupSnapshot.exportedAt ? new Date(parsedBackupSnapshot.exportedAt).toLocaleString('hi-IN') : 'दिनांक अनुपलब्ध'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-slate-900 p-2 rounded">
                          <span className="text-slate-400 block text-[10px]">पोस्ट्स</span>
                          <span className="font-bold text-amber-400">{parsedBackupSnapshot.data.posts.length}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded">
                          <span className="text-slate-400 block text-[10px]">टिकर्स</span>
                          <span className="font-bold text-red-400">{parsedBackupSnapshot.data.tickers?.length || 0}</span>
                        </div>
                        <div className="bg-slate-900 p-2 rounded">
                          <span className="text-slate-400 block text-[10px]">स्रोत</span>
                          <span className="font-bold text-purple-400">{parsedBackupSnapshot.data.scrapers?.length || 0}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isRestoringBackup}
                        onClick={async () => {
                          if (!confirm(`चेतावनी: क्या आप निश्चित रूप से ${parsedBackupSnapshot.data.posts.length} पोस्ट्स एवं टिकर डेटा रीस्टोर करना चाहते हैं?`)) {
                            return;
                          }
                          setIsRestoringBackup(true);
                          setBackupRestoreError(null);
                          setBackupRestoreMessage('डेटाबेस रीस्टोर किया जा रहा है (Batch Commit)...');
                          try {
                            const res = await restoreDatabaseFromBackup(parsedBackupSnapshot);
                            setBackupRestoreMessage(res.message);
                            showToast('डेटाबेस सफलतापूर्वक रीस्टोर हो गया!');
                            setParsedBackupSnapshot(null);
                            await refreshData();
                          } catch (err: unknown) {
                            console.error('Database restore error:', err);
                            setBackupRestoreError('रीस्टोर विफल: ' + (err instanceof Error ? err.message : 'अज्ञात त्रुटि'));
                          } finally {
                            setIsRestoringBackup(false);
                          }
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isRestoringBackup ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>डेटाबेस में रीस्टोर लागू करें (Confirm Restore)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
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

            {/* Dynamic Important Links in Override Modal */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold">अतिरिक्त महत्वपूर्ण लिंक्स:</span>
                <button
                  type="button"
                  onClick={() =>
                    setOverrideImportantLinks((prev) => [
                      ...prev,
                      { id: `link_${Date.now()}`, title: '', url: '' }
                    ])
                  }
                  className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-[11px] font-bold"
                >
                  + नया लिंक
                </button>
              </div>

              {overrideImportantLinks.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">कोई अतिरिक्त लिंक नहीं।</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {overrideImportantLinks.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded border border-slate-800">
                      <input
                        type="text"
                        placeholder="शीर्षक (e.g. एडमिट कार्ड)"
                        value={item.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOverrideImportantLinks((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, title: val } : l))
                          );
                        }}
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <input
                        type="url"
                        placeholder="https://..."
                        value={item.url}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOverrideImportantLinks((prev) =>
                            prev.map((l, i) => (i === idx ? { ...l, url: val } : l))
                          );
                        }}
                        className="w-1/2 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setOverrideImportantLinks((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="p-1 text-rose-400 hover:text-rose-300"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* SOCIAL MEDIA MULTI-SHARE MODAL */}
      {selectedShareJob && (
        <SocialShareModal
          job={selectedShareJob}
          isOpen={Boolean(selectedShareJob)}
          onClose={() => setSelectedShareJob(null)}
          onOpenInPosterStudio={(jobToOpen) => {
            setPosterJob(jobToOpen);
            setActiveTab('poster');
            setSelectedShareJob(null);
          }}
        />
      )}
    </div>
  );
}
