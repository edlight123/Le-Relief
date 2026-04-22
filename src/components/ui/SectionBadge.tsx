import Badge from "@/components/ui/Badge";

export default function SectionBadge({ name }: { name: string | null | undefined }) {
  if (!name) {
    return <Badge variant="default">Sans rubrique</Badge>;
  }
  return <Badge variant="default">{name}</Badge>;
}