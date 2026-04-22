import AdminShell from "@/components/layout/AdminShell";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { canAccessDashboard, normalizeRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import type { Role } from "@/types/user";
import { headers } from "next/headers";
import {
  E2E_REQUEST_ROLE_HEADER,
  E2E_REQUEST_USER_ID_HEADER,
  resolveE2ERole,
} from "@/lib/e2e-role";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const e2eRole = resolveE2ERole(requestHeaders.get(E2E_REQUEST_ROLE_HEADER));

  const session = e2eRole
    ? {
        user: {
          id: requestHeaders.get(E2E_REQUEST_USER_ID_HEADER) ?? `e2e-${e2eRole}`,
          name: `E2E ${e2eRole}`,
          email: `${e2eRole}@example.test`,
          role: e2eRole,
        },
      }
    : await auth();

  const role = ((session?.user as { role?: Role } | undefined)?.role || "writer") as Role;

  if (!session?.user?.id || !canAccessDashboard(normalizeRole(role))) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session as never}>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
