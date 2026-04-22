import { redirect } from "next/navigation";

export default function AdminPublishingReadyPage() {
  redirect("/dashboard/approved");
}
