import type { AppRole } from "@/lib/role-routing";
import { normalizeAppRole } from "@/lib/role-routing";

export type RoleLike = AppRole | "reader" | string | null | undefined;

export type ActionKey =
  | "save_draft"
  | "submit_for_review"
  | "request_revisions"
  | "approve_article"
  | "reject_article"
  | "publish_article"
  | "schedule_article"
  | "manage_homepage"
  | "manage_media"
  | "manage_users"
  | "manage_settings"
  | "view_audit_log";

export type RouteKey =
  | "admin-dashboard"
  | "writer-workspace"
  | "editor-review"
  | "publisher-ops"
  | "homepage"
  | "users"
  | "settings"
  | "audit";

const DEFAULT_ROLE: AppRole = "writer";

const landingByRole: Record<AppRole, string> = {
  writer: "/admin/workspace",
  editor: "/admin/review",
  publisher: "/admin/publishing",
  admin: "/admin/dashboard",
};

const routeAccessByRole: Record<AppRole, RouteKey[]> = {
  writer: ["writer-workspace"],
  editor: ["writer-workspace", "editor-review"],
  publisher: ["publisher-ops", "homepage"],
  admin: [
    "admin-dashboard",
    "writer-workspace",
    "editor-review",
    "publisher-ops",
    "homepage",
    "users",
    "settings",
    "audit",
  ],
};

const actionAccessByRole: Record<AppRole, ActionKey[]> = {
  writer: ["save_draft", "submit_for_review"],
  editor: ["request_revisions", "approve_article", "reject_article"],
  publisher: ["publish_article", "schedule_article", "manage_homepage", "manage_media"],
  admin: [
    "save_draft",
    "submit_for_review",
    "request_revisions",
    "approve_article",
    "reject_article",
    "publish_article",
    "schedule_article",
    "manage_homepage",
    "manage_media",
    "manage_users",
    "manage_settings",
    "view_audit_log",
  ],
};

const navVisibilityByRole: Record<AppRole, string[]> = {
  writer: ["/admin/workspace", "/admin/drafts", "/admin/revisions", "/admin/submitted", "/admin/articles/new"],
  editor: ["/admin/review", "/admin/review/attention", "/admin/revisions", "/admin/articles"],
  publisher: [
    "/admin/publishing",
    "/admin/publishing/ready",
    "/admin/publishing/scheduled",
    "/admin/publishing/published",
    "/admin/homepage",
    "/admin/media",
  ],
  admin: [
    "/admin/dashboard",
    "/admin/articles/new",
    "/admin/workspace",
    "/admin/articles",
    "/admin/review",
    "/admin/publishing",
    "/admin/homepage",
    "/admin/authors",
    "/admin/sections",
    "/admin/media",
    "/admin/users",
    "/admin/settings",
    "/admin/audit",
  ],
};

function normalizeRole(role: RoleLike): AppRole {
  const normalized = normalizeAppRole(role);
  return normalized ?? DEFAULT_ROLE;
}

export function getRoleCapabilities(role: RoleLike) {
  const normalized = normalizeRole(role);
  return {
    role: normalized,
    landingPath: landingByRole[normalized],
    routes: routeAccessByRole[normalized],
    actions: actionAccessByRole[normalized],
    navItems: navVisibilityByRole[normalized],
  };
}

export function canAccessRoute(role: RoleLike, routeKey: RouteKey): boolean {
  const normalized = normalizeRole(role);
  return routeAccessByRole[normalized].includes(routeKey);
}

export function canSeeNavItem(role: RoleLike, navKey: string): boolean {
  const normalized = normalizeRole(role);
  return navVisibilityByRole[normalized].includes(navKey);
}

export function canPerformAction(role: RoleLike, actionKey: ActionKey): boolean {
  const normalized = normalizeRole(role);
  return actionAccessByRole[normalized].includes(actionKey);
}
