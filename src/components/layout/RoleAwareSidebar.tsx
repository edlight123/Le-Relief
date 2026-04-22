"use client";

import Sidebar from "@/components/layout/Sidebar";

interface RoleAwareSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function RoleAwareSidebar({ open, onClose }: RoleAwareSidebarProps) {
  return <Sidebar open={open} onClose={onClose} />;
}
