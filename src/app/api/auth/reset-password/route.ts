import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import * as usersRepo from "@/lib/repositories/users";
import * as resetTokensRepo from "@/lib/repositories/password-reset-tokens";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body ?? {};

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` },
        { status: 400 }
      );
    }

    const result = await resetTokensRepo.consumePasswordResetToken(token);

    if (!result.ok) {
      const messages: Record<string, string> = {
        invalid: "Ce lien est invalide.",
        expired: "Ce lien a expiré. Veuillez en demander un nouveau.",
        used: "Ce lien a déjà été utilisé.",
      };
      return NextResponse.json({ error: messages[result.reason] ?? "Lien invalide." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await usersRepo.updateUser(result.userId, { hashedPassword });

    // Clean up any remaining tokens for this user
    await resetTokensRepo.deleteTokensForUser(result.userId);

    return NextResponse.json({ message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
