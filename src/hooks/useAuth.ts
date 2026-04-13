"use client";

import { useSession } from "next-auth/react";
import type { Role } from "@/types/user";

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    user: session?.user
      ? {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: (session.user as { role?: Role }).role || "reader",
        }
      : null,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
  };
}
