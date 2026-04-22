"use client";

import { useEffect, useState } from "react";
import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function MyDraftsPage() {
  const [authorId, setAuthorId] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((user) => setAuthorId(user?.id || undefined))
      .catch(() => setAuthorId(undefined));
  }, []);

  return (
    <WorkflowQueueTable
      title="Mes brouillons"
      subtitle="Suivez vos brouillons, contenus en rédaction et demandes de révision dans une file personnelle."
      statuses={["draft", "writing", "revisions_requested"]}
      dateField="updatedAt"
      queryParams={{ authorId }}
      emptyMessage="Aucun brouillon personnel à traiter."
    />
  );
}
