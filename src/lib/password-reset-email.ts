import nodemailer from "nodemailer";
import { Resend } from "resend";

type PasswordResetEmailInput = {
  to: string;
  recipientName?: string | null;
  resetUrl: string;
  expiresAt: Date;
};

function formatExpiresAt(expiresAt: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Port-au-Prince",
  }).format(expiresAt);
}

function emailHtml(input: PasswordResetEmailInput): string {
  const greeting = input.recipientName ? `Bonjour ${input.recipientName},` : "Bonjour,";
  const expires = formatExpiresAt(input.expiresAt);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-top:4px solid #B11226">
    <div style="padding:40px 48px 32px">
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B11226">
        Espace rédaction
      </p>
      <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#111111;line-height:1.1;letter-spacing:-0.5px">
        Réinitialisez votre mot de passe
      </h1>
      <p style="margin:0 0 16px;font-size:17px;color:#333333;line-height:1.6">${greeting}</p>
      <p style="margin:0 0 16px;font-size:15px;color:#5F5F5F;line-height:1.7">
        Vous avez demandé à réinitialiser le mot de passe de votre compte Le Relief. Cliquez sur le bouton ci-dessous pour en définir un nouveau.
      </p>
      <a href="${input.resetUrl}" style="display:inline-block;background:#B11226;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:12px 24px;text-decoration:none">
        Réinitialiser mon mot de passe
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#666;line-height:1.6">
        Ce lien expire le ${expires}. Si vous n'êtes pas à l'origine de cette demande, ignorez ce message — votre mot de passe actuel reste inchangé.
      </p>
    </div>
  </div>
</body>
</html>`;
}

function emailText(input: PasswordResetEmailInput): string {
  const greeting = input.recipientName ? `Bonjour ${input.recipientName},` : "Bonjour,";
  const expires = formatExpiresAt(input.expiresAt);
  return `${greeting}\n\nRéinitialisez votre mot de passe Le Relief ici :\n${input.resetUrl}\n\nCe lien expire le ${expires}.\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message.`;
}

function canUseGmail() {
  return !!process.env.EMAIL_USER && !!process.env.EMAIL_APP_PASSWORD;
}

function canUseResend() {
  return !!process.env.RESEND_API_KEY;
}

export function passwordResetEmailConfigured() {
  return canUseGmail() || canUseResend();
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput) {
  const subject = "Le Relief — réinitialisation de votre mot de passe";

  if (canUseGmail()) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Le Relief" <${process.env.EMAIL_USER}>`,
      to: input.to,
      subject,
      html: emailHtml(input),
      text: emailText(input),
    });
    return;
  }

  if (canUseResend()) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Le Relief <no-reply@le-relief.ht>",
      to: input.to,
      subject,
      html: emailHtml(input),
      text: emailText(input),
    });
    return;
  }

  throw new Error("No email provider configured");
}
