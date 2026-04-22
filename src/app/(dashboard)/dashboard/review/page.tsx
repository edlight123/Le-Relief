import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function ReviewQueuePage() {
  return (
    <WorkflowQueueTable
      title="Review Queue"
      subtitle="Tous les contenus soumis à validation éditoriale, triés pour accélérer les décisions d'approbation, de rejet ou de demande de révisions."
      statuses={["in_review", "pending_review"]}
      dateField="submittedForReviewAt"
      emptyMessage="Aucun article en file de review."
    />
  );
}
