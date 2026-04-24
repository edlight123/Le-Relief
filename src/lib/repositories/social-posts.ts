import { FieldValue } from "firebase-admin/firestore";
import { getDb, serializeTimestamps } from "@/lib/firebase";
import type { PlatformId } from "@le-relief/types";
import type {
  PlatformPostState,
  PlatformPublishState,
  SocialPost,
  SocialPostStatus,
} from "@/types/social";

const COLLECTION = "social_posts";

function col() {
  return getDb().collection(COLLECTION);
}

export async function getByArticleId(articleId: string): Promise<SocialPost | null> {
  const snap = await col().where("articleId", "==", articleId).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as unknown as Record<string, unknown>) as unknown as SocialPost;
}

export async function getById(id: string): Promise<SocialPost | null> {
  const doc = await col().doc(id).get();
  if (!doc.exists) return null;
  return serializeTimestamps({ id: doc.id, ...doc.data() } as unknown as Record<string, unknown>) as unknown as SocialPost;
}

export async function listRecent(limit = 50): Promise<SocialPost[]> {
  const snap = await col().orderBy("updatedAt", "desc").limit(limit).get();
  return snap.docs.map((d) =>
    serializeTimestamps({ id: d.id, ...d.data() } as unknown as Record<string, unknown>) as unknown as SocialPost,
  );
}

export interface UpsertInput {
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  articleLanguage: "fr" | "en";
  brandName: string;
  status: SocialPostStatus;
  platforms: Partial<Record<PlatformId, PlatformPostState>>;
  createdBy: string;
}

/**
 * Create-or-merge by articleId. Used after a render run.
 */
export async function upsert(input: UpsertInput): Promise<SocialPost> {
  const existing = await getByArticleId(input.articleId);
  const now = FieldValue.serverTimestamp();
  if (existing) {
    // Merge platform state — preserve manually-edited captions.
    const mergedPlatforms: Partial<Record<PlatformId, PlatformPostState>> = {
      ...(existing.platforms ?? {}),
    };
    for (const [key, next] of Object.entries(input.platforms) as [
      PlatformId,
      PlatformPostState,
    ][]) {
      const prev = mergedPlatforms[key];
      mergedPlatforms[key] = {
        ...next,
        // Preserve dirty caption + publish state across re-renders
        caption: prev?.captionDirty ? prev.caption : next.caption,
        captionDirty: prev?.captionDirty ?? false,
        publish: prev?.publish ?? next.publish,
      };
    }
    await col().doc(existing.id).update({
      status: input.status,
      brandName: input.brandName,
      articleTitle: input.articleTitle,
      articleSlug: input.articleSlug,
      articleLanguage: input.articleLanguage,
      platforms: mergedPlatforms,
      updatedAt: now,
    });
    return (await getById(existing.id))!;
  }
  const ref = col().doc();
  await ref.set({
    articleId: input.articleId,
    articleSlug: input.articleSlug,
    articleTitle: input.articleTitle,
    articleLanguage: input.articleLanguage,
    brandName: input.brandName,
    status: input.status,
    platforms: input.platforms,
    createdAt: now,
    updatedAt: now,
    createdBy: input.createdBy,
  });
  return (await getById(ref.id))!;
}

export async function updatePlatformCaption(
  postId: string,
  platform: PlatformId,
  caption: string,
): Promise<void> {
  await col()
    .doc(postId)
    .update({
      [`platforms.${platform}.caption`]: caption,
      [`platforms.${platform}.captionDirty`]: true,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function updatePlatformPublishState(
  postId: string,
  platform: PlatformId,
  state: PlatformPublishState,
): Promise<void> {
  await col()
    .doc(postId)
    .update({
      [`platforms.${platform}.publish`]: state,
      updatedAt: FieldValue.serverTimestamp(),
    });
}

export async function updateStatus(
  postId: string,
  status: SocialPostStatus,
): Promise<void> {
  await col().doc(postId).update({ status, updatedAt: FieldValue.serverTimestamp() });
}
