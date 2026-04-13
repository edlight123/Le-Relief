import type { Role } from "@/types/user";

const roleHierarchy: Record<Role, number> = {
  reader: 0,
  publisher: 1,
  admin: 2,
};

export function hasRole(userRole: Role, requiredRole: Role): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canManageArticles(role: Role): boolean {
  return hasRole(role, "publisher");
}

export function canManageUsers(role: Role): boolean {
  return hasRole(role, "admin");
}

export function canAccessDashboard(role: Role): boolean {
  return hasRole(role, "publisher");
}

export function canDeleteArticle(role: Role, isOwner: boolean): boolean {
  return hasRole(role, "admin") || (hasRole(role, "publisher") && isOwner);
}
