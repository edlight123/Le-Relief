/**
 * Meta Graph API publisher — Instagram (feed/story/reel cover) + Facebook (feed/link).
 *
 * Behaviour
 *   - If no `meta` connection exists → returns `{status: "not-connected"}` so
 *     the admin UI can render a "Connect Meta" prompt.
 *   - If a connection exists → performs the real Graph calls. Tokens are
 *     read via `getDecryptedToken("meta")`, the FB Page id is read from
 *     `connection.metadata.fbPageId`, and the IG Business user id from
 *     `connection.metadata.igUserId`. Both are populated by the OAuth
 *     callback in `/api/admin/social/connections/meta/callback`.
 *
 * Reference: https://developers.facebook.com/docs/instagram-api/guides/content-publishing
 */

import type { PlatformId } from "@le-relief/types";
import type { PlatformPostState, PublishResult } from "@/types/social";
import type { PublishContext } from "./index";
import { getConnection, getDecryptedToken } from "../connections";

const GRAPH = "https://graph.facebook.com/v20.0";

export async function publishToMeta(
  platform: PlatformId,
  state: PlatformPostState,
  ctx: PublishContext,
): Promise<PublishResult> {
  const conn = await getConnection("meta");
  if (!conn || conn.status !== "connected") {
    return {
      status: "not-connected",
      mode: "api",
      error:
        "Meta n'est pas encore connecté. Aller dans Réglages → Connexions sociales pour autoriser l'application.",
    };
  }

  const tokenBlob = await getDecryptedToken("meta");
  if (!tokenBlob?.token) {
    return {
      status: "not-connected",
      mode: "api",
      error: "Connection Meta présente mais le jeton est illisible. Reconnectez.",
    };
  }
  const token = tokenBlob.token;
  const fbPageId = conn.metadata?.fbPageId ?? conn.accountId ?? null;
  const igUserId = conn.metadata?.igUserId ?? null;

  try {
    switch (platform) {
      case "instagram-feed":
      case "instagram-reel-cover":
        if (!igUserId) return { status: "failed", mode: "api", error: "igUserId manquant sur la connexion Meta." };
        return await publishInstagramCarousel(token, igUserId, state, ctx);
      case "instagram-story":
        if (!igUserId) return { status: "failed", mode: "api", error: "igUserId manquant sur la connexion Meta." };
        return await publishInstagramStory(token, igUserId, state);
      case "facebook-feed":
        if (!fbPageId) return { status: "failed", mode: "api", error: "fbPageId manquant sur la connexion Meta." };
        return await publishFacebookPhoto(token, fbPageId, state);
      case "facebook-link":
        if (!fbPageId) return { status: "failed", mode: "api", error: "fbPageId manquant sur la connexion Meta." };
        return await publishFacebookLink(token, fbPageId, state, ctx);
      default:
        return { status: "failed", mode: "api", error: `Unsupported platform ${platform}` };
    }
  } catch (err) {
    return { status: "failed", mode: "api", error: errMsg(err) };
  }
}

// ── Instagram ────────────────────────────────────────────────────────────────

async function publishInstagramCarousel(
  token: string,
  igUserId: string,
  state: PlatformPostState,
  _ctx: PublishContext,
): Promise<PublishResult> {
  const assets = state.assets;
  if (assets.length === 0) return { status: "failed", mode: "api", error: "No slides to publish." };

  let creationId: string;
  if (assets.length === 1) {
    const containerRes = await graph(`/${igUserId}/media`, token, {
      image_url: assets[0].url,
      caption: state.caption,
    });
    creationId = containerRes.id;
  } else {
    const childIds: string[] = [];
    for (const asset of assets) {
      const child = await graph(`/${igUserId}/media`, token, {
        image_url: asset.url,
        is_carousel_item: "true",
      });
      childIds.push(child.id);
    }
    const parent = await graph(`/${igUserId}/media`, token, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption: state.caption,
    });
    creationId = parent.id;
  }

  await waitForContainer(token, creationId);
  const publish = await graph(`/${igUserId}/media_publish`, token, { creation_id: creationId });
  const externalId = publish.id;
  const externalUrl = await fetchPermalink(token, externalId);

  if (state.firstComment) {
    await graph(`/${externalId}/comments`, token, { message: state.firstComment }).catch(() => null);
  }

  return { status: "published", mode: "api", externalId, externalUrl };
}

async function publishInstagramStory(
  token: string,
  igUserId: string,
  state: PlatformPostState,
): Promise<PublishResult> {
  const asset = state.assets[0];
  if (!asset) return { status: "failed", mode: "api", error: "No story asset." };
  const container = await graph(`/${igUserId}/media`, token, {
    image_url: asset.url,
    media_type: "STORIES",
  });
  await waitForContainer(token, container.id);
  const publish = await graph(`/${igUserId}/media_publish`, token, { creation_id: container.id });
  return { status: "published", mode: "api", externalId: publish.id };
}

// ── Facebook ─────────────────────────────────────────────────────────────────

async function publishFacebookPhoto(
  token: string,
  pageId: string,
  state: PlatformPostState,
): Promise<PublishResult> {
  const asset = state.assets[0];
  if (!asset) return { status: "failed", mode: "api", error: "No photo asset." };
  const res = await graph(`/${pageId}/photos`, token, {
    url: asset.url,
    caption: state.caption,
    published: "true",
  });
  const externalUrl = res.post_id ? `https://facebook.com/${res.post_id}` : null;
  return { status: "published", mode: "api", externalId: res.id ?? res.post_id, externalUrl };
}

async function publishFacebookLink(
  token: string,
  pageId: string,
  state: PlatformPostState,
  ctx: PublishContext,
): Promise<PublishResult> {
  const res = await graph(`/${pageId}/feed`, token, {
    link: ctx.articleUrl,
    message: state.caption,
  });
  return {
    status: "published",
    mode: "api",
    externalId: res.id,
    externalUrl: res.id ? `https://facebook.com/${res.id}` : null,
  };
}

// ── Graph helpers ────────────────────────────────────────────────────────────

async function graph(
  path: string,
  token: string,
  body: Record<string, string>,
): Promise<{ id: string; post_id?: string; permalink?: string; status_code?: string }> {
  const url = `${GRAPH}${path}`;
  const params = new URLSearchParams({ ...body, access_token: token });
  const res = await fetch(url, {
    method: "POST",
    body: params,
    headers: { "content-type": "application/x-www-form-urlencoded" },
  });
  const json = (await res.json()) as { id?: string; post_id?: string; error?: { message?: string }; permalink?: string; status_code?: string };
  if (!res.ok || json.error) {
    throw new Error(`Graph ${path} → ${res.status} ${json.error?.message ?? JSON.stringify(json)}`);
  }
  return json as { id: string };
}

async function waitForContainer(token: string, creationId: string): Promise<void> {
  for (let i = 0; i < 12; i++) {
    const url = `${GRAPH}/${creationId}?fields=status_code&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = (await res.json()) as { status_code?: string };
    if (json.status_code === "FINISHED") return;
    if (json.status_code === "ERROR") throw new Error("Container build error");
    await new Promise((r) => setTimeout(r, 2_000));
  }
}

async function fetchPermalink(token: string, mediaId: string): Promise<string | null> {
  try {
    const url = `${GRAPH}/${mediaId}?fields=permalink&access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url);
    const json = (await res.json()) as { permalink?: string };
    return json.permalink ?? null;
  } catch {
    return null;
  }
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
