import type { Role } from "@/types/user";
import { getRoleLandingPath, normalizeAppRole, type AppRole } from "@/lib/role-routing";

export function normalizeRole(role: Role): Exclude<Role, "reader"> {
  if (role === "reader") return "writer";
  return role;
}

export function normalizeRoleFromUnknown(role: string | null | undefined): AppRole | null {
  return normalizeAppRole(role);
}

const roleHierarchy: Record<Role, number> = {
  reader: 1,
  writer: 1,
  editor: 2,
  publisher: 3,
  admin: 4,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageArticles(role: Role): boolean {
  return hasRole(normalizeRole(role), "editor");
}

export function canManageUsers(role: Role): boolean {
  return hasRole(normalizeRole(role), "admin");
}

export function canAccessDashboard(role: Role): boolean {
  return hasRole(normalizeRole(role), "writer");
}

export function getDefaultAdminLandingForRole(role: string | null | undefined): string {
  const normalizedRole = normalizeRoleFromUnknown(role);
  return normalizedRole ? getRoleLandingPath(normalizedRole) : "/admin/access-denied";
}

export function canDeleteArticle(role: Role, isOwner: boolean): boolean {
  const normalized = normalizeRole(role);
  return hasRole(normalized, "admin") || (hasRole(normalized, "editor") && isOwner);
}
