import type { Role } from "@/types/user";

export const EDITORIAL_STATUSES = [
  "draft",
  "writing",
  "in_review",
  "revisions_requested",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
] as const;

export type EditorialStatus = (typeof EDITORIAL_STATUSES)[number] | "pending_review";
export type NormalizedEditorialStatus = (typeof EDITORIAL_STATUSES)[number];

type WorkflowRole = "writer" | "editor" | "publisher" | "admin";

const TRANSITIONS: Record<WorkflowRole, Partial<Record<NormalizedEditorialStatus, NormalizedEditorialStatus[]>>> = {
  writer: {
    draft: ["writing", "in_review"],
    writing: ["in_review", "draft"],
    revisions_requested: ["writing", "in_review"],
  },
  editor: {
    in_review: ["approved", "revisions_requested", "rejected"],
    revisions_requested: ["in_review"],
    approved: ["scheduled", "published", "revisions_requested"],
    scheduled: ["published", "approved"],
    published: ["archived", "approved"],
  },
  publisher: {
    approved: ["scheduled", "published", "revisions_requested"],
    scheduled: ["published", "approved"],
    published: ["archived", "approved"],
  },
  admin: {
    draft: EDITORIAL_STATUSES.filter((status) => status !== "draft"),
    writing: EDITORIAL_STATUSES.filter((status) => status !== "writing"),
    in_review: EDITORIAL_STATUSES.filter((status) => status !== "in_review"),
    revisions_requested: EDITORIAL_STATUSES.filter((status) => status !== "revisions_requested"),
    approved: EDITORIAL_STATUSES.filter((status) => status !== "approved"),
    scheduled: EDITORIAL_STATUSES.filter((status) => status !== "scheduled"),
    published: EDITORIAL_STATUSES.filter((status) => status !== "published"),
    rejected: EDITORIAL_STATUSES.filter((status) => status !== "rejected"),
    archived: EDITORIAL_STATUSES.filter((status) => status !== "archived"),
  },
};

export function normalizeEditorialStatus(status: string | null | undefined): NormalizedEditorialStatus {
  if (status === "pending_review") return "in_review";
  if (!status) return "draft";
  return EDITORIAL_STATUSES.includes(status as NormalizedEditorialStatus)
    ? (status as NormalizedEditorialStatus)
    : "draft";
}

export function normalizeWorkflowRole(role: Role | string | null | undefined): WorkflowRole {
  if (role === "admin" || role === "publisher" || role === "editor" || role === "writer") {
    return role;
  }
  if (role === "reader") return "writer";
  return "writer";
}

export function canAccessDashboard(role: Role | string | null | undefined): boolean {
  const normalizedRole = normalizeWorkflowRole(role);
  return normalizedRole === "editor" || normalizedRole === "publisher" || normalizedRole === "admin";
}

export function canEditArticle(
  role: Role | string | null | undefined,
  isOwner: boolean,
  status: string | null | undefined,
): boolean {
  const normalizedRole = normalizeWorkflowRole(role);
  const normalizedStatus = normalizeEditorialStatus(status);

  if (normalizedRole === "admin" || normalizedRole === "publisher" || normalizedRole === "editor") {
    return true;
  }

  if (!isOwner) return false;

  return ["draft", "writing", "revisions_requested", "in_review"].includes(normalizedStatus);
}

export function canTransitionStatus(params: {
  role: Role | string | null | undefined;
  fromStatus: string | null | undefined;
  toStatus: string | null | undefined;
  isOwner: boolean;
}) {
  const normalizedRole = normalizeWorkflowRole(params.role);
  const from = normalizeEditorialStatus(params.fromStatus);
  const to = normalizeEditorialStatus(params.toStatus);

  if (from === to) {
    if (normalizedRole === "writer" && !params.isOwner) {
      return { allowed: false, reason: "Le rédacteur ne peut modifier que ses propres articles." };
    }
    return { allowed: true };
  }

  if (normalizedRole === "writer" && !params.isOwner) {
    return { allowed: false, reason: "Le rédacteur ne peut modifier que ses propres articles." };
  }

  const allowedTargets = TRANSITIONS[normalizedRole][from] || [];
  if (!allowedTargets.includes(to)) {
    return {
      allowed: false,
      reason: `Transition non autorisée: ${from} → ${to} pour le rôle ${normalizedRole}.`,
    };
  }

  return { allowed: true };
}

export function getEditorialStatusLabel(status: string | null | undefined): string {
  const normalized = normalizeEditorialStatus(status);

  switch (normalized) {
    case "draft":
      return "Brouillon";
    case "writing":
      return "Rédaction";
    case "in_review":
      return "En revue";
    case "revisions_requested":
      return "Révisions demandées";
    case "approved":
      return "Approuvé";
    case "scheduled":
      return "Programmé";
    case "published":
      return "Publié";
    case "rejected":
      return "Rejeté";
    case "archived":
      return "Archivé";
    default:
      return normalized;
  }
}

export function getEditorialStatusVariant(
  status: string | null | undefined,
): "default" | "success" | "warning" | "danger" | "info" {
  const normalized = normalizeEditorialStatus(status);

  switch (normalized) {
    case "published":
    case "approved":
      return "success";
    case "in_review":
    case "scheduled":
      return "info";
    case "revisions_requested":
    case "writing":
      return "warning";
    case "rejected":
    case "archived":
      return "danger";
    default:
      return "default";
  }
}
