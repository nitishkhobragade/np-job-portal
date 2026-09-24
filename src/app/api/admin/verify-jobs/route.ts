import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { PostRecord } from '../../../../types';
import { auditPostWithGeminiGrounding, PostAuditResult } from '../../../../lib/recruitmentIntelligence';
import { getInitialSeedPosts } from '../../../../lib/seedDatabase';

export const maxDuration = 60; // Allow sufficient time for multi-post grounding search

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ACTION: Apply Suggested Patch directly to Firestore
    if (body.action === 'apply-patch') {
      const { jobId, patch } = body;
      if (!jobId || !patch) {
        return NextResponse.json(
          { error: 'Missing jobId or patch in apply-patch action' },
          { status: 400 }
        );
      }

      try {
        const docRef = doc(db, 'posts', jobId);
        const payload = {
          ...patch,
          updatedAt: serverTimestamp(),
          isAiVerified: true,
          aiVerifiedAt: new Date().toISOString()
        };

        try {
          await updateDoc(docRef, payload);
        } catch {
          await setDoc(docRef, payload, { merge: true });
        }

        return NextResponse.json({
          success: true,
          message: 'पोस्ट में सुझाये गए सुधार सफलतापूर्वक लागू किए गए!',
          jobId,
          appliedPatch: patch
        });
      } catch (patchErr) {
        console.error('Error applying patch to Firestore:', patchErr);
        return NextResponse.json(
          { error: 'डेटाबेस में सुधार लागू करने में विफल: ' + (patchErr as Error).message },
          { status: 500 }
        );
      }
    }

    // SINGLE POST AUDIT
    if (body.jobId && !body.all) {
      let targetJob: PostRecord | null = body.job || null;

      if (!targetJob) {
        try {
          // Fetch from Firestore
          const docRef = doc(db, 'posts', body.jobId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            targetJob = { ...(snap.data() as PostRecord), id: snap.id };
          }
        } catch (fetchErr) {
          console.warn('Firestore getDoc failed in verify-jobs, falling back to seed store:', fetchErr);
        }
      }

      if (!targetJob) {
        // Fallback to initial seed posts
        const seeds = getInitialSeedPosts();
        targetJob = seeds.find((p) => p.id === body.jobId || p.slug === body.jobId) || null;
      }

      if (!targetJob) {
        return NextResponse.json(
          { error: `Job with ID "${body.jobId}" not found in portal database` },
          { status: 404 }
        );
      }

      const auditResult = await auditPostWithGeminiGrounding(targetJob);
      return NextResponse.json({
        success: true,
        type: 'single',
        audit: auditResult
      });
    }

    // BATCH / GLOBAL AUDIT FOR ALL POSTS
    if (body.all || body.jobs || Array.isArray(body.jobIds)) {
      let postsToAudit: PostRecord[] = [];

      if (Array.isArray(body.jobs) && body.jobs.length > 0) {
        postsToAudit = body.jobs;
      } else {
        try {
          const postsCol = collection(db, 'posts');
          const snap = await getDocs(postsCol);
          if (!snap.empty) {
            snap.forEach((d) => {
              postsToAudit.push({ ...(d.data() as PostRecord), id: d.id });
            });
          }
        } catch (fetchErr) {
          console.warn('Firestore getDocs failed in verify-jobs batch, falling back to seeds:', fetchErr);
        }

        if (postsToAudit.length === 0) {
          postsToAudit = getInitialSeedPosts();
        }
      }

      if (postsToAudit.length === 0) {
        return NextResponse.json({
          success: true,
          type: 'global',
          summary: {
            totalScanned: 0,
            verifiedHealthy: 0,
            needingAttention: 0
          },
          results: []
        });
      }

      // Prioritize scanning: examine published and draft posts (up to 15 concurrent to avoid rate limits)
      const auditLimit = Math.min(postsToAudit.length, 20);
      const batchSlice = postsToAudit.slice(0, auditLimit);

      // Run audits in parallel with Promise.allSettled
      const auditPromises = batchSlice.map(async (p) => {
        try {
          return await auditPostWithGeminiGrounding(p);
        } catch {
          return null;
        }
      });

      const settled = await Promise.allSettled(auditPromises);
      const results: PostAuditResult[] = [];

      settled.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          results.push(res.value);
        }
      });

      const verifiedHealthy = results.filter((r) => r.healthScore >= 85).length;
      const needingAttention = results.filter((r) => r.healthScore < 85).length;

      return NextResponse.json({
        success: true,
        type: 'global',
        summary: {
          totalScanned: results.length,
          verifiedHealthy,
          needingAttention
        },
        results
      });
    }

    return NextResponse.json(
      { error: 'Invalid request. Specify jobId, all: true, or action: "apply-patch"' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Error in /api/admin/verify-jobs:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'AI verification failed' },
      { status: 500 }
    );
  }
}
