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

/**
 * Broadcast a "new article published" push notification to every subscriber
 * matching the article's language. Safe to fire-and-forget: errors are logged
 * but never thrown so callers cannot have their request fail because of push.
 *
 * Returns immediately (does not await delivery) — the actual sending happens
 * in the background so it does not delay the publish API response.
 */
export function broadcastArticlePublished(article: {
  id?: string | number;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  language?: string | null;
  coverImage?: string | null;
}): void {
  const language = (article.language || "fr").toString();
  const slug = (article.slug || "").toString();
  const title =
    (article.title || "").toString() ||
    (language === "fr" ? "Nouvel article" : "New article");
  const body =
    (article.excerpt || "").toString().slice(0, 120) ||
    (language === "fr"
      ? "Lire l'article sur Le Relief."
      : "Read the article on Le Relief.");
  const url = slug ? `/${slug}` : "/";
  const icon = (article.coverImage || "/icon-192.png").toString();

  // Run async without blocking the caller.
  void (async () => {
    try {
      const pushRepo = await import("./repositories/push-subscriptions");
      const subscriptions = await pushRepo
        .getSubscriptionsByLocale(language)
        .catch(() => []);
      if (subscriptions.length === 0) return;
      await sendPushToAll(
        subscriptions,
        { title, body, url, icon },
        (endpoint) => pushRepo.deleteSubscription(endpoint),
      );
    } catch (err) {
      console.warn("[push] broadcastArticlePublished failed", err);
    }
  })();
}
