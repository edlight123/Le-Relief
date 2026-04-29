import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function AdminReviewApprovedPage() {
  return (
    <WorkflowQueueTable
      title="Approuvés"
      subtitle="Articles validés par la review éditoriale, prêts pour la publication."
      statuses={["approved"]}
      dateField="approvedAt"
      emptyMessage="Aucun article approuvé pour le moment."
    />
  );
}
