"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import ThemeToggle from "@/components/public/ThemeToggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-surface-newsprint">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border-strong bg-surface px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="border border-border-subtle p-2 transition-colors hover:bg-surface-elevated lg:hidden"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="hidden flex-1 font-label text-xs font-bold uppercase text-muted lg:block">
            Salle de rédaction
          </div>
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
