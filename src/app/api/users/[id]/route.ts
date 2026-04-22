import { NextRequest, NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";
import { auth } from "@/lib/auth";
import { canManageUsers, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const userRole = ((session?.user as { role?: Role } | undefined)?.role ?? "writer") as Role;
  if (!session?.user || !canManageUsers(normalizeRole(userRole))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) {
    const allowedRoles: Role[] = ["writer", "editor", "publisher", "admin", "reader"];
    if (!allowedRoles.includes(body.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    data.role = body.role;
  }

  const user = await usersRepo.updateUser(id, data);
  return NextResponse.json(user);
}
