import { savePushSubscription } from '@/lib/db';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

/**
 * Check if the browser supports push notifications.
 */
export function isNotificationsSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/**
 * Request notification permission from the user.
 * Returns the resulting permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationsSupported()) return 'denied';
  return Notification.requestPermission();
}

/**
 * Helper to convert a base64 VAPID key to a Uint8Array for the subscription options.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Register the service worker, subscribe to push notifications,
 * and save the subscription to Supabase.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isNotificationsSupported()) return null;

  try {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return null;

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    // Persist the subscription to Supabase
    await savePushSubscription(subscription.toJSON());

    // Schedule local notifications for the day
    scheduleLocalNotifications();

    return subscription;
  } catch (err) {
    console.error('[notifications] subscribeToPush failed', err);
    return null;
  }
}

/**
 * Schedule local notifications for meal reminders.
 * Vercel Hobby only supports 1 daily cron (7AM push from server).
 * The 1PM and 8PM reminders are scheduled locally.
 */
function scheduleLocalNotifications() {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const now = new Date();
  const notifications = [
    {
      hour: 13, minute: 0,
      title: 'Hora de tu comida!',
      body: 'Picadillo con papa, calabacita, zanahoria y ensalada. Recuerda tomar agua.',
    },
    {
      hour: 20, minute: 0,
      title: 'Buenas noches Jose Carlos!',
      body: 'Prepara tu licuado de proteina con fruta y crema de cacahuate. Toma tu magnesio.',
    },
  ];

  for (const n of notifications) {
    const target = new Date(now);
    target.setHours(n.hour, n.minute, 0, 0);
    if (target <= now) continue; // Already past this time today

    const delay = target.getTime() - now.getTime();
    setTimeout(() => {
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(n.title, {
            body: n.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'local-meal-reminder',
          });
        });
      }
    }, delay);
  }
}
