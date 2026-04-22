import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDefaultAdminLandingForRole } from "@/lib/permissions";
import { headers } from "next/headers";
import { E2E_REQUEST_ROLE_HEADER, resolveE2ERole } from "@/lib/e2e-role";

export default async function AdminEntryPage() {
  const requestHeaders = await headers();
  const e2eRole = resolveE2ERole(requestHeaders.get(E2E_REQUEST_ROLE_HEADER));

  if (e2eRole) {
    redirect(getDefaultAdminLandingForRole(e2eRole));
  }

  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user?.id) {
    redirect("/login");
  }

  redirect(getDefaultAdminLandingForRole(user.role));
}
