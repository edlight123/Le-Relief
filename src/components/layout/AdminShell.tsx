"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { normalizeAppRole } from "@/lib/role-routing";
import { trackAdminEvent } from "@/lib/analytics/admin-events";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    const role = normalizeAppRole((session?.user as { role?: string } | undefined)?.role);
    trackAdminEvent({
      name: "dashboard_viewed",
      actorId: (session?.user as { id?: string } | undefined)?.id,
      targetType: "setting",
      meta: {
        pathname,
        role,
      },
    });
  }, [pathname, session]);

  return <DashboardLayout>{children}</DashboardLayout>;
}
