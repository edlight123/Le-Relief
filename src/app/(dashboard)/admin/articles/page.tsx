import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function AdminArticlesPage() {
  return (
    <WorkflowQueueTable
      title="Tous les articles"
      subtitle="Vue complète de tous les articles de la rédaction, tous statuts confondus."
      statuses={["draft", "in_review", "revisions_requested", "approved", "scheduled", "published"]}
      dateField="updatedAt"
      emptyMessage="Aucun article trouvé."
    />
  );
}
