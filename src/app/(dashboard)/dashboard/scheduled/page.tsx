import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function ScheduledPage() {
  return (
    <WorkflowQueueTable
      title="Programmés"
      subtitle="Publications futures de la newsroom. Vérifiez le rythme, les créneaux et les priorités avant mise en ligne."
      statuses={["scheduled"]}
      dateField="scheduledAt"
      emptyMessage="Aucune publication programmée pour le moment."
    />
  );
}
