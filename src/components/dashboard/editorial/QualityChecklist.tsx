"use client";

import Badge from "@/components/ui/Badge";

export interface QualityRule {
  key: string;
  label: string;
  ok: boolean;
}

export default function QualityChecklist({
  rules,
  role,
}: {
  rules: QualityRule[];
  role: "writer" | "editor" | "publisher" | "admin";
}) {
  const passed = rules.filter((r) => r.ok).length;
  return (
    <section className="space-y-3 border border-border-subtle p-4">
      <div className="flex items-center justify-between">
        <p className="font-label text-xs font-extrabold uppercase text-muted">Checklist qualité</p>
        <Badge variant={passed === rules.length ? "success" : "warning"}>
          {passed}/{rules.length}
        </Badge>
      </div>
      <ul className="space-y-1.5">
        {rules.map((rule) => (
          <li key={rule.key} className="flex items-center justify-between gap-2 font-body text-sm text-foreground">
            <span>{rule.label}</span>
            <Badge variant={rule.ok ? "success" : role === "writer" ? "default" : "warning"}>
              {rule.ok ? "OK" : role === "writer" ? "À compléter" : "Bloquant"}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
