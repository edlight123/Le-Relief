import type { Role } from "@/types/user";

export type AppRole = "writer" | "editor" | "publisher" | "admin";

export type RouteAccessRule = {
  prefix: string;
  allowedRoles: AppRole[];
};

export function normalizeAppRole(role: string | null | undefined): AppRole | null {
  if (role === "writer" || role === "editor" || role === "publisher" || role === "admin") {
    return role;
  }

  if (role === "reader") {
    return "writer";
  }

  return null;
}

export function getRoleLandingPath(role: AppRole): string {
  if (role === "writer") return "/admin/workspace";
  if (role === "editor") return "/admin/review";
  if (role === "publisher") return "/admin/publishing";
  return "/admin/dashboard";
}

export function canAccessRoleScopedRoute(pathname: string, role: AppRole): boolean {
  const matchingRule = ROLE_SCOPED_ROUTE_RULES
    .filter((rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (!matchingRule) {
    return true;
  }

  return matchingRule.allowedRoles.includes(role);
}

export function isRoleScopedRoute(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function toRoleOrNull(role: Role | string | null | undefined): AppRole | null {
  return normalizeAppRole(typeof role === "string" ? role : role ?? null);
}

const ROLE_SCOPED_ROUTE_RULES: RouteAccessRule[] = [
  { prefix: "/admin", allowedRoles: ["writer", "editor", "publisher", "admin"] },

  { prefix: "/admin/dashboard", allowedRoles: ["admin"] },

  { prefix: "/admin/users", allowedRoles: ["admin"] },
  { prefix: "/admin/settings", allowedRoles: ["admin"] },
  { prefix: "/admin/audit", allowedRoles: ["admin"] },
  { prefix: "/admin/authors", allowedRoles: ["admin"] },
  { prefix: "/admin/sections", allowedRoles: ["admin"] },

  { prefix: "/admin/workspace", allowedRoles: ["writer", "publisher", "admin"] },
  { prefix: "/admin/drafts", allowedRoles: ["writer", "publisher", "admin"] },
  { prefix: "/admin/submitted", allowedRoles: ["writer", "publisher", "admin"] },
  { prefix: "/admin/revisions", allowedRoles: ["writer", "editor", "publisher", "admin"] },

  { prefix: "/admin/review", allowedRoles: ["editor", "publisher", "admin"] },
  { prefix: "/admin/review/attention", allowedRoles: ["editor", "publisher", "admin"] },

  { prefix: "/admin/articles/new", allowedRoles: ["writer", "editor", "publisher", "admin"] },
  { prefix: "/admin/articles", allowedRoles: ["editor", "publisher", "admin"] },

  { prefix: "/admin/publishing/published", allowedRoles: ["editor", "publisher", "admin"] },

  { prefix: "/admin/homepage", allowedRoles: ["publisher", "admin"] },
  { prefix: "/admin/media", allowedRoles: ["publisher", "admin"] },
  { prefix: "/admin/publishing", allowedRoles: ["publisher", "admin"] },
];