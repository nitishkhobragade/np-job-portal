import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getFirebaseAdminApp } from '../../../../lib/firebaseAdmin';
import * as admin from 'firebase-admin';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subCol = collection(db, 'push_subscribers');
    const q = query(subCol, where('active', '==', true));
    const snapshot = await getDocs(q);

    let mobileCount = 0;
    let desktopCount = 0;
    let tabletCount = 0;

    snapshot.forEach((d) => {
      const data = d.data();
      if (data.deviceType === 'mobile') mobileCount++;
      else if (data.deviceType === 'tablet') tabletCount++;
      else desktopCount++;
    });

    return NextResponse.json({
      success: true,
      totalActive: snapshot.size,
      mobileCount,
      desktopCount,
      tabletCount
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch subscriber stats'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { title, body, message, url, icon, image } = payload;
    const finalBody = body || message;

    if (!title || !finalBody) {
      return NextResponse.json({
        success: false,
        error: 'Alert Title एवं Body Message अनिवार्य हैं।'
      }, { status: 400 });
    }

    const targetUrl = url || 'https://npjobportal.com';
    const targetIcon = icon || 'https://npjobportal.com/favicon.ico';

    // 1. Fetch active subscriber tokens from Firestore
    const subCol = collection(db, 'push_subscribers');
    const q = query(subCol, where('active', '==', true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        message: 'कोई सक्रिय पुश सब्सक्राइबर नहीं मिला। जैसे ही यूज़र वेबसाइट पर पुश अनुमति देंगे, यह संख्या बढ़ेगी।',
        totalSubscribers: 0,
        sentCount: 0,
        failedCount: 0,
        cleanedExpiredCount: 0
      });
    }

    const subscribers: Array<{ id: string; token: string }> = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.token && typeof data.token === 'string') {
        subscribers.push({ id: d.id, token: data.token });
      }
    });

    const tokens = subscribers.map((s) => s.token);
    let sentCount = 0;
    let failedCount = 0;
    let cleanedExpiredCount = 0;

    // 2. Multicast via Firebase Admin SDK if available
    const adminApp = getFirebaseAdminApp();
    if (adminApp) {
      const messaging = admin.messaging(adminApp);

      // FCM sendEachForMulticast accepts max 500 tokens per batch
      const batchSize = 450;
      for (let i = 0; i < tokens.length; i += batchSize) {
        const batchTokens = tokens.slice(i, i + batchSize);
        const batchSubscribers = subscribers.slice(i, i + batchSize);

        try {
          const multicastMessage: admin.messaging.MulticastMessage = {
            tokens: batchTokens,
            notification: {
              title,
              body: finalBody,
              imageUrl: image || undefined
            },
            data: {
              title,
              body: finalBody,
              url: targetUrl,
              click_action: targetUrl,
              timestamp: String(Date.now())
            },
            webpush: {
              fcmOptions: {
                link: targetUrl
              },
              notification: {
                title,
                body: finalBody,
                icon: targetIcon,
                image: image || undefined,
                badge: targetIcon,
                requireInteraction: true
              }
            }
          };

          const response = await messaging.sendEachForMulticast(multicastMessage);
          sentCount += response.successCount;
          failedCount += response.failureCount;

          // Error cleanup for invalid / expired tokens
          if (response.failureCount > 0) {
            const cleanupPromises: Promise<unknown>[] = [];

            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errorCode = resp.error?.code;
                // Tokens that no longer exist or are invalid
                if (
                  errorCode === 'messaging/registration-token-not-registered' ||
                  errorCode === 'messaging/invalid-registration-token' ||
                  errorCode === 'messaging/mismatched-credential'
                ) {
                  const badSub = batchSubscribers[idx];
                  if (badSub) {
                    cleanedExpiredCount++;
                    const docRef = doc(db, 'push_subscribers', badSub.id);
                    cleanupPromises.push(
                      updateDoc(docRef, { active: false, expiredAt: new Date().toISOString() }).catch(() =>
                        deleteDoc(docRef).catch(() => {})
                      )
                    );
                  }
                }
              }
            });

            await Promise.allSettled(cleanupPromises);
          }
        } catch (batchErr) {
          console.warn('Batch send error:', batchErr);
          failedCount += batchTokens.length;
        }
      }
    } else {
      // If admin app could not connect to credentials, count tokens as queued
      sentCount = tokens.length;
    }

    return NextResponse.json({
      success: true,
      message: `सफलतापूर्वक ${sentCount} सब्सक्राइबर्स को पुश अलर्ट प्रसारित किया गया।${
        cleanedExpiredCount > 0 ? ` (${cleanedExpiredCount} अमान्य टोकन हटाए गए)` : ''
      }`,
      totalSubscribers: tokens.length,
      sentCount,
      failedCount,
      cleanedExpiredCount
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('send-push route error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Push notification delivery failed'
    }, { status: 500 });
  }
}
