import DashboardLayout from "@/components/layout/DashboardLayout";
import { SessionProvider } from "next-auth/react";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </SessionProvider>
  );
}
