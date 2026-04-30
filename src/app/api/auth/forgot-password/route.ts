import { NextRequest, NextResponse } from "next/server";
import * as usersRepo from "@/lib/repositories/users";
import * as resetTokensRepo from "@/lib/repositories/password-reset-tokens";
import { sendPasswordResetEmail, passwordResetEmailConfigured } from "@/lib/password-reset-email";
import { canAccessDashboard } from "@/lib/permissions";
import type { Role } from "@/types/user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : null;

    if (!email) {
      return NextResponse.json({ error: "Adresse courriel requise." }, { status: 400 });
    }

    // Always return 200 to prevent email enumeration attacks.
    // Only send the email if the user actually exists and has a dashboard role.
    const user = await usersRepo.findByEmail(email);
    console.log(`[forgot-password] lookup for ${email}: found=${!!user}, role=${user?.role ?? "none"}`);

    if (user && canAccessDashboard(user.role as Role)) {
      if (!passwordResetEmailConfigured()) {
        console.error("[forgot-password] No email provider configured. RESEND_API_KEY set:", !!process.env.RESEND_API_KEY);
        return NextResponse.json(
          { error: "Service courriel non configuré. Contactez un administrateur." },
          { status: 503 }
        );
      }

      const appUrl = (
        process.env.AUTH_URL ||
        process.env.NEXTAUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
        "https://le-relief.ht"
      ).replace(/\/$/, "");
      const { token, expiresAt } = await resetTokensRepo.createPasswordResetToken(
        user.id as string,
        user.email as string,
      );

      const resetUrl = `${appUrl}/fr/reset-password?token=${token}`;

      console.log(`[forgot-password] sending reset email to ${user.email as string}, url: ${resetUrl}`);
      await sendPasswordResetEmail({
        to: user.email as string,
        recipientName: user.name as string | null,
        resetUrl,
        expiresAt,
      });
    }

    return NextResponse.json({
      message: "Si cette adresse est enregistrée, un lien de réinitialisation vient d'être envoyé.",
    });
  } catch (err) {
    console.error("[forgot-password] Error:", err);
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 });
  }
}
