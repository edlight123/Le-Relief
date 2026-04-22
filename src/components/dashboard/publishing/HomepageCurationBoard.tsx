"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export interface HomepageSlot {
  id: string;
  label: string;
  articleId: string | null;
}

export interface HomepageCandidate {
  id: string;
  title: string;
}

export default function HomepageCurationBoard({
  slots,
  candidates,
  onAssign,
  onPublish,
}: {
  slots: HomepageSlot[];
  candidates: HomepageCandidate[];
  onAssign: (slotId: string, articleId: string | null) => void;
  onPublish: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-4 px-5 py-4">
          <p className="font-label text-xs font-extrabold uppercase tracking-wider text-muted">
            Curation de la une
          </p>
          {slots.map((slot) => (
            <div key={slot.id} className="grid gap-2 sm:grid-cols-[160px_1fr] sm:items-center">
              <label className="font-label text-xs font-bold uppercase text-foreground">{slot.label}</label>
              <select
                value={slot.articleId || ""}
                onChange={(e) => onAssign(slot.id, e.target.value || null)}
                className="w-full border border-border-subtle bg-surface px-3 py-2 font-label text-sm text-foreground"
              >
                <option value="">Aucun article</option>
                {candidates.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="pt-2">
            <Button onClick={onPublish}>Publier la configuration</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
