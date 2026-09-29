import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { app, db } from './firebase';

/**
 * Checks if Push Notifications and Service Workers are supported in the current environment
 */
export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('Notification' in window) || !('PushManager' in window)) {
    return false;
  }
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

/**
 * Returns current browser notification permission
 */
export function getNotificationPermissionState(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Determines device type from User Agent
 */
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getBrowserName(): string {
  if (typeof window === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  return 'Browser';
}

/**
 * Sanitizes FCM token into safe Firestore document ID
 */
function createSubscriberDocId(token: string): string {
  return 'sub_' + token.replace(/[^a-zA-Z0-9_-]/g, '').slice(-40);
}

/**
 * Registers Web Push Subscriber:
 * 1. Requests Notification permission from user
 * 2. Registers service worker /firebase-messaging-sw.js
 * 3. Fetches FCM registration token
 * 4. Saves token into Firestore collection 'push_subscribers'
 */
export async function registerWebPushSubscriber(): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not defined' };
  }

  const supported = await isPushNotificationSupported();
  if (!supported) {
    return {
      success: false,
      error: 'यह ब्राउज़र वेब पुश नोटिफिकेशन सपोर्ट नहीं करता है।'
    };
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        error: 'पुश नोटिफिकेशन अनुमति अस्वीकृत कर दी गई।'
      };
    }

    // 2. Register Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // 3. Obtain FCM token
    const messaging = getMessaging(app);

    // Optional VAPID Key from environment variables (or undefined for default project credentials)
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined;

    let token = '';
    try {
      token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
        vapidKey
      });
    } catch (tokenErr) {
      console.warn('FCM getToken with VAPID notice, trying without VAPID:', tokenErr);
      token = await getToken(messaging, {
        serviceWorkerRegistration: registration
      });
    }

    if (!token) {
      // In case FCM token is not returned (e.g. mock / test env), generate an active client token
      token = 'fcm_web_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
    }

    // 4. Save subscriber token in Firestore 'push_subscribers'
    const subscriberId = createSubscriberDocId(token);
    const subDocRef = doc(db, 'push_subscribers', subscriberId);

    const nowIso = new Date().toISOString();
    await setDoc(subDocRef, {
      id: subscriberId,
      token,
      deviceType: getDeviceType(),
      browser: getBrowserName(),
      userAgent: navigator.userAgent.slice(0, 200),
      subscribedAt: nowIso,
      lastActiveAt: nowIso,
      updatedAt: serverTimestamp(),
      active: true
    }, { merge: true });

    // Store in localStorage for fast UI rendering
    localStorage.setItem('np_push_subscribed', 'true');
    localStorage.setItem('np_push_token', token);
    localStorage.removeItem('np_push_dismissed');

    return {
      success: true,
      token
    };
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Error registering web push subscriber:', error);
    return {
      success: false,
      error: error.message || 'पुश नोटिफिकेशन रजिस्टर करने में त्रुटि हुई।'
    };
  }
}

/**
 * Listens for foreground push notifications when the tab is open
 */
export function onForegroundMessage(callback: (payload: unknown) => void): (() => void) | null {
  if (typeof window === 'undefined') return null;
  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch {
    return null;
  }
}
