import Badge from "@/components/ui/Badge";

interface PriorityFlagProps {
  kind: "breaking" | "urgent" | "featured" | "homepage";
  label?: string;
}

export default function PriorityFlag({ kind, label }: PriorityFlagProps) {
  const variant = kind === "breaking" || kind === "urgent" ? "danger" : kind === "homepage" ? "info" : "warning";
  const text =
    label ||
    (kind === "breaking"
      ? "Breaking"
      : kind === "urgent"
      ? "Urgent"
      : kind === "featured"
      ? "Featured"
      : "Homepage");

  return <Badge variant={variant}>{text}</Badge>;
}