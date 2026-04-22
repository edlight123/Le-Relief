import Badge from "@/components/ui/Badge";
import { getEditorialStatusLabel, getEditorialStatusVariant } from "@/lib/editorial-workflow";

export default function StatusChip({ status }: { status: string }) {
  return (
    <Badge variant={getEditorialStatusVariant(status)}>
      {getEditorialStatusLabel(status)}
    </Badge>
  );
}