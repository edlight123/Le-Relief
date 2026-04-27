import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { applyPasswordFromSetupToken } from "@/lib/repositories/account-setup-tokens";

const schema = z.object({
  token: z.string().min(32, "Token invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Données invalides" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    const result = await applyPasswordFromSetupToken({
      token: parsed.data.token,
      hashedPassword,
    });

    if (!result.ok) {
      if (result.reason === "expired") {
        return NextResponse.json({ error: "Ce lien a expiré" }, { status: 410 });
      }
      if (result.reason === "used") {
        return NextResponse.json({ error: "Ce lien a déjà été utilisé" }, { status: 409 });
      }
      return NextResponse.json({ error: "Lien invalide" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, email: result.email });
  } catch {
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
