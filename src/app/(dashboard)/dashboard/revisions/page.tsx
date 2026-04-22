import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function RevisionsRequestedPage() {
  return (
    <WorkflowQueueTable
      title="Révisions demandées"
      subtitle="Contenus renvoyés aux rédacteurs avec commentaires bloquants ou demandes d'ajustement."
      statuses={["revisions_requested"]}
      dateField="updatedAt"
      emptyMessage="Aucune révision en attente côté rédaction."
    />
  );
}
