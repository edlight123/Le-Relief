import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function AdminPublishingScheduledPage() {
  return (
    <WorkflowQueueTable
      title="Programmés"
      subtitle="Articles programmés pour une publication automatique à la date prévue."
      statuses={["scheduled"]}
      dateField="scheduledAt"
      emptyMessage="Aucun article programmé."
    />
  );
}
