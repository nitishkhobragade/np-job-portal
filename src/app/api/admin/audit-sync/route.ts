import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { PostRecord } from '../../../../types';
import { auditPostWithGeminiGrounding } from '../../../../lib/recruitmentIntelligence';
import { getInitialSeedPosts } from '../../../../lib/seedDatabase';

export const maxDuration = 60; // Allow background audit processing

export async function GET(req: NextRequest) {
  return handleAuditSync(req);
}

export async function POST(req: NextRequest) {
  return handleAuditSync(req);
}

async function handleAuditSync(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dryRun = searchParams.get('dryRun') === 'true';
    const targetSlug = searchParams.get('slug') || searchParams.get('jobId');

    // 1. Fetch posts from Firestore, with fallback to initial seed posts if empty
    const allPosts: PostRecord[] = [];
    try {
      const postsCol = collection(db, 'posts');
      const snap = await getDocs(postsCol);
      if (!snap.empty) {
        snap.forEach((d) => {
          allPosts.push({ ...(d.data() as PostRecord), id: d.id });
        });
      }
    } catch (e) {
      console.warn('Firestore fetch warning in audit-sync:', e);
    }

    if (allPosts.length === 0) {
      allPosts.push(...getInitialSeedPosts());
    }

    const postsToAudit = targetSlug
      ? allPosts.filter((p) => p.id === targetSlug || p.slug === targetSlug)
      : allPosts;

    const report = {
      timestamp: new Date().toISOString(),
      dryRun,
      totalScanned: postsToAudit.length,
      updatedWithVerifiedDates: 0,
      markedDraftPendingRelease: 0,
      verifiedHealthyUnchanged: 0,
      actions: [] as Array<{
        id: string;
        title: string;
        action: 'VERIFIED_UPDATED' | 'UNVERIFIED_SET_DRAFT' | 'HEALTHY_KEPT' | 'SKIPPED';
        reason: string;
        details?: Record<string, unknown>;
      }>
    };

    // Process posts sequentially or in small chunks to respect rate limits
    for (const post of postsToAudit) {
      try {
        // Special check: ITI Training Officer or unverified/rumor check
        const isItiTo = 
          post.id.includes('iti') || 
          post.slug?.includes('iti') || 
          post.title.toLowerCase().includes('iti training officer') ||
          post.title.includes('ट्रेनिंग ऑफिसर');

        const auditResult = await auditPostWithGeminiGrounding(post);

        // CASE A: Official dates/notices exist & confirmed on official portals
        if (auditResult.healthScore >= 80 && auditResult.suggestedPatch) {
          const hasSignificantUpdates = 
            auditResult.suggestedPatch.startDate || 
            auditResult.suggestedPatch.lastDate || 
            auditResult.suggestedPatch.notificationPdf;

          if (hasSignificantUpdates && !dryRun) {
            const docRef = doc(db, 'posts', post.id);
            const updatePayload = {
              ...auditResult.suggestedPatch,
              isAiVerified: true,
              aiVerifiedAt: new Date().toISOString(),
              updatedAt: serverTimestamp()
            };
            try {
              await updateDoc(docRef, updatePayload);
            } catch {
              await setDoc(docRef, updatePayload, { merge: true });
            }
          }

          report.updatedWithVerifiedDates++;
          report.actions.push({
            id: post.id,
            title: post.title,
            action: 'VERIFIED_UPDATED',
            reason: 'आधिकारिक पोर्टल से सत्यापित तिथियां एवं लिंक अपडेट किए गए।',
            details: {
              healthScore: auditResult.healthScore,
              patch: auditResult.suggestedPatch
            }
          });
        } 
        // CASE B: Unverified, speculative rumors, or unconfirmed (like fabricated ITI TO entries)
        else if (isItiTo || auditResult.healthScore < 75 || auditResult.statusBadge === 'critical') {
          // If unverified or based on speculative rumors, remove fabricated dates,
          // set status: 'draft', and tag as 'Pending Official Release'.
          const sanitizedPayload: Partial<PostRecord> & Record<string, unknown> = {
            status: 'draft',
            isPublished: false,
            startDate: 'शीघ्र उपलब्ध / Announced Soon',
            lastDate: 'शीघ्र उपलब्ध / Announced Soon',
            examDate: 'शीघ्र घोषित',
            dates: {
              start: 'शीघ्र उपलब्ध / Announced Soon',
              end: 'शीघ्र उपलब्ध / Announced Soon',
              exam: 'शीघ्र घोषित'
            },
            verificationTag: 'Pending Official Release',
            isAiVerified: false,
            updatedAt: serverTimestamp()
          };

          if (!dryRun) {
            const docRef = doc(db, 'posts', post.id);
            try {
              await updateDoc(docRef, sanitizedPayload);
            } catch {
              await setDoc(docRef, sanitizedPayload, { merge: true });
            }
          }

          report.markedDraftPendingRelease++;
          report.actions.push({
            id: post.id,
            title: post.title,
            action: 'UNVERIFIED_SET_DRAFT',
            reason: isItiTo
              ? 'अपुष्ट या अफवाह आधारित तिथियों को हटाकर ड्राफ्ट (Pending Official Release) में सेट किया गया।'
              : 'आधिकारिक विज्ञप्ति अपुष्ट होने के कारण ड्राफ्ट में सेट किया गया।',
            details: {
              healthScore: auditResult.healthScore,
              issues: auditResult.issues
            }
          });
        } else {
          report.verifiedHealthyUnchanged++;
          report.actions.push({
            id: post.id,
            title: post.title,
            action: 'HEALTHY_KEPT',
            reason: 'पोस्ट पूर्व से ही सत्यापित एवं सामान्य स्थिति में है।',
            details: { healthScore: auditResult.healthScore }
          });
        }
      } catch (postErr) {
        console.warn(`Audit sync error for post ${post.id}:`, postErr);
        report.actions.push({
          id: post.id,
          title: post.title,
          action: 'SKIPPED',
          reason: 'जांच के दौरान त्रुटि: ' + (postErr as Error).message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `डेटाबेस ऑडिट एवं सिंक संपन्न: ${report.totalScanned} पोस्ट्स जांची गईं। ${report.updatedWithVerifiedDates} सत्यापित अपडेट, ${report.markedDraftPendingRelease} ड्राफ्ट सेट किए गए।`,
      report
    });
  } catch (error: unknown) {
    console.error('Audit-Sync Route Error:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Audit sync failed' },
      { status: 500 }
    );
  }
}
