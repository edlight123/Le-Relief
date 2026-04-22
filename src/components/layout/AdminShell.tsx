"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
