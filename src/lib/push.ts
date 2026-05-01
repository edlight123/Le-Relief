import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@lereliefhaiti.com";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error("VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload,
): Promise<{ success: boolean; error?: string }> {
  ensureConfigured();
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    const error = err as { statusCode?: number; message?: string };
    return { success: false, error: error.message };
  }
}

export async function sendPushToAll(
  subscriptions: PushSubscription[],
  payload: PushPayload,
  onExpired?: (endpoint: string) => Promise<void>,
): Promise<{ sent: number; failed: number; expired: number }> {
  ensureConfigured();
  let sent = 0;
  let failed = 0;
  let expired = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
      } catch (err) {
        const e = err as { statusCode?: number };
        // 410 Gone or 404 Not Found = subscription no longer valid
        if (e.statusCode === 410 || e.statusCode === 404) {
          expired++;
          if (onExpired) await onExpired(sub.endpoint).catch(() => null);
        } else {
          failed++;
        }
      }
    }),
  );

  return { sent, failed, expired };
}
