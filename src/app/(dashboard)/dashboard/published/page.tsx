import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function PublishedPage() {
  return (
    <WorkflowQueueTable
      title="Publiés"
      subtitle="Vue opérationnelle des contenus live pour suivi post-publication, corrections et archivage."
      statuses={["published"]}
      dateField="publishedAt"
      emptyMessage="Aucun article publié trouvé."
    />
  );
}
