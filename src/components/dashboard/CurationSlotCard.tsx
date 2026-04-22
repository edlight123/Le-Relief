import type { ReactNode } from "react";
import Card, { CardContent, CardHeader } from "@/components/ui/Card";

export default function CurationSlotCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-label text-xs font-extrabold uppercase text-foreground">{title}</h2>
        {description ? <p className="mt-2 font-body text-xs text-muted">{description}</p> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}