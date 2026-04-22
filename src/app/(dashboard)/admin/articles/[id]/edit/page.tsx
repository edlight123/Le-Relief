import { redirect } from "next/navigation";

export default async function AdminArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/articles/${id}/edit`);
}
