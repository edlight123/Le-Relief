import { redirect } from "next/navigation";

export default function AdminArticlesNewPage() {
  redirect("/dashboard/articles/new");
}
