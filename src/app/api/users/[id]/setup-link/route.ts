import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { siteConfig } from "@/config/site.config";
import { canManageUsers, normalizeRole } from "@/lib/permissions";
import type { Role } from "@/types/user";
import * as usersRepo from "@/lib/repositories/users";
import { createAccountSetupToken } from "@/lib/repositories/account-setup-tokens";
import {
  accountSetupEmailConfigured,
  sendAccountSetupEmail,
} from "@/lib/account-setup-email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_req: Request, { params }: RouteParams) {
  const session = await auth();
  const userRole = ((session?.user as { role?: Role } | undefined)?.role ?? "writer") as Role;
  if (!session?.user || !canManageUsers(normalizeRole(userRole))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!accountSetupEmailConfigured()) {
    return NextResponse.json(
      { error: "Aucun fournisseur e-mail n'est configuré" },
      { status: 503 },
    );
  }

  const { id } = await params;
  const user = await usersRepo.getUser(id);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }

  const email = String(user.email || "").trim();
  if (!email) {
    return NextResponse.json(
      { error: "Aucun courriel n'est défini pour cet utilisateur" },
      { status: 400 },
    );
  }

  const { token, expiresAt } = await createAccountSetupToken({
    userId: String(user.id),
    email,
    createdById: session.user.id,
  });

  const setupUrl = `${siteConfig.url}/setup-account?token=${encodeURIComponent(token)}`;

  await sendAccountSetupEmail({
    to: email,
    recipientName: typeof user.name === "string" ? user.name : null,
    setupUrl,
    expiresAt,
  });

  return NextResponse.json({
    ok: true,
    expiresAt: expiresAt.toISOString(),
  });
}
