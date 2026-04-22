import Badge from "@/components/ui/Badge";

export default function UserRoleBadge({ role }: { role: string }) {
  const normalized = role === "reader" ? "writer" : role;
  const variant =
    normalized === "admin"
      ? "danger"
      : normalized === "publisher"
      ? "warning"
      : normalized === "editor"
      ? "info"
      : "default";
  const label =
    normalized === "writer"
      ? "Rédacteur"
      : normalized === "editor"
      ? "Éditeur"
      : normalized === "publisher"
      ? "Publisher"
      : normalized === "admin"
      ? "Admin"
      : normalized;

  return <Badge variant={variant}>{label}</Badge>;
}