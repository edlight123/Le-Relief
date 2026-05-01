"use client";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type EditorAction =
  | "save_draft"
  | "submit_review"
  | "request_revisions"
  | "approve"
  | "reject"
  | "schedule"
  | "publish";

export default function EditorTopBar({
  title,
  role,
  status,
  onAction,
  disabled,
}: {
  title: string;
  role: "writer" | "editor" | "publisher" | "admin";
  status: string;
  onAction: (action: EditorAction) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3 border border-border-subtle bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-headline text-xl font-extrabold text-foreground">{title}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="info">{role}</Badge>
          <Badge variant="default">{status}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={disabled} onClick={() => onAction("save_draft")}>Sauvegarder</Button>
        {(role === "writer" || role === "publisher" || role === "admin") && (
          <Button variant="outline" disabled={disabled} onClick={() => onAction("submit_review")}>Soumettre</Button>
        )}
        {(role === "editor" || role === "publisher" || role === "admin") && (
          <>
            <Button variant="outline" disabled={disabled} onClick={() => onAction("request_revisions")}>Révisions</Button>
            <Button variant="outline" disabled={disabled} onClick={() => onAction("approve")}>Approuver</Button>
            <Button variant="outline" disabled={disabled} onClick={() => onAction("reject")}>Rejeter</Button>
          </>
        )}
        {(role === "publisher" || role === "admin") && (
          <>
            <Button variant="outline" disabled={disabled} onClick={() => onAction("schedule")}>Programmer</Button>
            <Button disabled={disabled} onClick={() => onAction("publish")}>Publier</Button>
          </>
        )}
      </div>
    </div>
  );
}
