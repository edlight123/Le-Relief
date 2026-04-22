import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDefaultAdminLandingForRole } from "@/lib/permissions";

export default async function AdminEntryPage() {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    redirect("/login");
  }

  redirect(getDefaultAdminLandingForRole(user.role));
}
