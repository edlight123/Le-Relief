import { analyticsConfig } from "@/config/analytics.config";

export type AdminEventName =
  | "dashboard_viewed"
  | "article_created"
  | "article_updated"
  | "article_published"
  | "article_unpublished"
  | "review_decision"
  | "settings_updated"
  | "role_updated";

export interface AdminEventInput {
  name: AdminEventName;
  actorId?: string;
  targetId?: string;
  targetType?: "article" | "user" | "setting" | "homepage";
  outcome?: "success" | "failure";
  meta?: Record<string, unknown>;
}

export function buildAdminEventPayload(input: AdminEventInput) {
  return {
    namespace: analyticsConfig.adminEvents.namespace,
    eventType: analyticsConfig.adminEvents.eventType,
    locale: analyticsConfig.adminEvents.defaultLocale,
    name: input.name,
    actorId: input.actorId,
    targetId: input.targetId,
    targetType: input.targetType,
    outcome: input.outcome ?? "success",
    ...input.meta,
  };
}

export function trackAdminEvent(input: AdminEventInput) {
  if (!analyticsConfig.adminEvents.enabled) return;

  if (process.env.NODE_ENV !== "production") {
    // Lightweight default transport for now; can be replaced by analytics service binding.
    // eslint-disable-next-line no-console
    console.info("[admin-event]", buildAdminEventPayload(input));
  }
}
