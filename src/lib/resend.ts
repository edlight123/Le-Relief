import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Le Relief <newsletter@le-relief.ht>";

export const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "";

export async function addContactToAudience(email: string) {
  if (!AUDIENCE_ID) return;
  await resend.contacts.create({
    email,
    audienceId: AUDIENCE_ID,
    unsubscribed: false,
  });
}

export async function sendWelcomeEmail(email: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Bienvenue dans la lettre de Le Relief",
    html: welcomeEmailHtml(),
  });
}

function welcomeEmailHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-top:4px solid #B11226">
    <div style="padding:40px 48px 32px">
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B11226">
        La Lettre
      </p>
      <h1 style="margin:0 0 24px;font-size:32px;font-weight:900;color:#111111;line-height:1.1;letter-spacing:-0.5px">
        Le Relief Haïti
      </h1>
      <p style="margin:0 0 16px;font-size:17px;color:#333333;line-height:1.6">
        Merci de vous être inscrit à notre lettre.
      </p>
      <p style="margin:0 0 32px;font-size:15px;color:#5F5F5F;line-height:1.7">
        Vous recevrez les prochaines éditions directement dans votre boîte de réception — les nouvelles importantes, les analyses et les dossiers à suivre depuis Haïti.
      </p>
      <a href="https://le-relief.vercel.app" style="display:inline-block;background:#B11226;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:12px 24px;text-decoration:none">
        Lire la dernière édition
      </a>
    </div>
    <div style="border-top:1px solid #e5e5e5;padding:20px 48px">
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#999999">
        Vous recevez cet e-mail car vous vous êtes inscrit sur le-relief.vercel.app.
      </p>
    </div>
  </div>
</body>
</html>`;
}
