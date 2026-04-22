"use client";

import Link from "next/link";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import { FileText } from "lucide-react";

export interface WriterWorkspaceModuleItem {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  badge?: { label: string; variant?: "default" | "success" | "warning" | "danger" | "info" };
}

export interface WriterWorkspaceModule {
  key: "in-progress" | "revisions" | "submitted";
  title: string;
  items: WriterWorkspaceModuleItem[];
  emptyTitle: string;
  emptyDescription: string;
}

export default function WriterWorkspaceModules({
  modules,
}: {
  modules: WriterWorkspaceModule[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {modules.map((module) => (
        <Card key={module.key}>
          <div className="border-b border-border-subtle px-5 py-3">
            <h2 className="font-label text-xs font-extrabold uppercase tracking-wider text-foreground">
              {module.title}
            </h2>
          </div>
          <div className="divide-y divide-border-subtle">
            {module.items.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={module.emptyTitle}
                description={module.emptyDescription}
              />
            ) : (
              module.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block px-5 py-3 transition-colors hover:bg-surface-newsprint"
                >
                  <p className="font-body text-sm font-semibold text-foreground">{item.title}</p>
                  {item.subtitle ? (
                    <p className="mt-0.5 font-label text-xs text-muted">{item.subtitle}</p>
                  ) : null}
                  {item.badge ? (
                    <div className="mt-2">
                      <Badge variant={item.badge.variant ?? "default"}>{item.badge.label}</Badge>
                    </div>
                  ) : null}
                </Link>
              ))
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
