import AdminShell from "@/components/layout/AdminShell";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { canAccessDashboard, normalizeRole } from "@/lib/permissions";
import { redirect } from "next/navigation";
import type { Role } from "@/types/user";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const role = ((session?.user as { role?: Role } | undefined)?.role || "writer") as Role;

  if (!session?.user?.id || !canAccessDashboard(normalizeRole(role))) {
    redirect("/login");
  }

  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}
