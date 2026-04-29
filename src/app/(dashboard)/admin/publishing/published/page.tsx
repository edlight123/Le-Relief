import WorkflowQueueTable from "@/components/dashboard/WorkflowQueueTable";

export default function AdminPublishingPublishedPage() {
  return (
    <WorkflowQueueTable
      title="Publiés"
      subtitle="Tous les articles publiés sur le site, du plus récent au plus ancien."
      statuses={["published"]}
      dateField="publishedAt"
      emptyMessage="Aucun article publié."
    />
  );
}
