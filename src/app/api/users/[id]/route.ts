import { NextRequest, NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";
import * as notificationsRepo from "@/lib/repositories/notifications";
import { auth } from "@/lib/auth";
import { canManageUsers, normalizeRole } from "@/lib/permissions";
import { sendTeamRoleChangedEmail as resendTeamRoleChangedEmail } from "@/lib/resend";
import { sendTeamRoleChangedEmail as gmailTeamRoleChangedEmail } from "@/lib/mailer";
import type { Role } from "@/types/user";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function emailConfigured() {
  return (
    (!!process.env.EMAIL_USER && !!process.env.EMAIL_APP_PASSWORD) ||
    !!process.env.RESEND_API_KEY
  );
}

async function sendRoleChangedEmail(params: {
  email: string;
  name?: string | null;
  previousRole?: string;
  newRole: string;
}) {
  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD) {
    await gmailTeamRoleChangedEmail(params);
  } else if (process.env.RESEND_API_KEY) {
    await resendTeamRoleChangedEmail(params);
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const userRole = ((session?.user as { role?: Role } | undefined)?.role ?? "writer") as Role;
  if (!session?.user || !canManageUsers(normalizeRole(userRole))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const existingUser = await usersRepo.getUser(id);
  if (!existingUser) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) {
    const allowedRoles: Role[] = ["writer", "editor", "publisher", "admin", "reader"];
    if (!allowedRoles.includes(body.role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }
    data.role = body.role;
  }

  if (body.email !== undefined) {
    const newEmail = String(body.email).trim().toLowerCase();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json({ error: "Adresse courriel invalide" }, { status: 400 });
    }
    const existing = await usersRepo.findByEmail(newEmail);
    if (existing && String(existing.id) !== id) {
      return NextResponse.json({ error: "Cette adresse courriel est déjà utilisée" }, { status: 409 });
    }
    data.email = newEmail;
  }

  const user = await usersRepo.updateUser(id, data);

  if (body.role !== undefined && user && String(existingUser.role || "") !== String(body.role)) {
    const actorName = (session.user as { name?: string }).name || "Administration";
    const message = `Votre rôle a été modifié: ${String(existingUser.role || "reader")} → ${String(body.role)}.`;

    await notificationsRepo
      .createNotification({
        userId: id,
        type: "team_role_changed",
        articleId: "system",
        actorName,
        message,
      })
      .catch(() => null);

    const email = typeof user.email === "string" ? user.email : "";
    if (email && emailConfigured()) {
      await sendRoleChangedEmail({
        email,
        name: typeof user.name === "string" ? user.name : null,
        previousRole: String(existingUser.role || "reader"),
        newRole: String(body.role),
      }).catch(() => null);
    }
  }

  return NextResponse.json(user);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const session = await auth();
  const userRole = ((session?.user as { role?: Role } | undefined)?.role ?? "writer") as Role;
  if (!session?.user || !canManageUsers(normalizeRole(userRole))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent self-deletion
  if ((session.user as { id?: string }).id === id) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 400 });
  }

  const existing = await usersRepo.getUser(id);
  if (!existing) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  await usersRepo.deleteUser(id);
  return NextResponse.json({ success: true });
}
