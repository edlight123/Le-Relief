"use client";

import { useEffect, useState } from "react";

interface HistoryEvent {
  id: string;
  type: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt?: string;
  actor?: { name?: string | null } | null;
}

export default function HistoryPanel({ articleId }: { articleId: string }) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const res = await fetch(`/api/articles/${articleId}/history`);
      const data = await res.json();
      if (!active) return;
      setEvents(data.events || []);
      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [articleId]);

  return (
    <section className="space-y-3 border border-border-subtle p-4">
      <h3 className="font-label text-xs font-extrabold uppercase text-foreground">Historique des versions</h3>

      {loading ? (
        <p className="font-label text-xs text-muted">Chargement...</p>
      ) : events.length === 0 ? (
        <p className="font-label text-xs text-muted">Aucun événement historisé.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id} className="border border-border-subtle p-3">
              <p className="font-label text-xs font-bold uppercase text-foreground">{event.type}</p>
              <p className="mt-1 font-label text-[11px] text-muted">
                {event.actor?.name || "Système"}
                {event.createdAt ? ` · ${new Date(event.createdAt).toLocaleString("fr-FR")}` : ""}
              </p>
              {(event.fromStatus || event.toStatus) && (
                <p className="mt-1 font-label text-xs text-muted">
                  {event.fromStatus || "—"} → {event.toStatus || "—"}
                </p>
              )}
              {event.note ? <p className="mt-2 font-body text-sm text-foreground">{event.note}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
