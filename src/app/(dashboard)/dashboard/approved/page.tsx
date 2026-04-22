import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function ApprovedQueuePage() {
  return (
    <WorkflowQueueTable
      title="Approved Queue"
      subtitle="Articles validés par la rédaction, prêts pour publication immédiate ou programmation."
      statuses={["approved"]}
      dateField="approvedAt"
      emptyMessage="Aucun article approuvé à publier."
    />
  );
}
