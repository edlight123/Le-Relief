import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function AdminPublishingReadyPage() {
  return (
    <WorkflowQueueTable
      title="Prêts à publier"
      subtitle="Articles approuvés par la rédaction, en attente de publication."
      statuses={["approved"]}
      dateField="approvedAt"
      emptyMessage="Aucun article approuvé en attente de publication."
    />
  );
}
