import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Le Relief <newsletter@le-relief.ht>";

export const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || "";

export async function addContactToAudience(email: string) {
  if (!AUDIENCE_ID) return;
  await getResend().contacts.create({
    email,
    audienceId: AUDIENCE_ID,
    unsubscribed: false,
  });
}

export async function sendWelcomeEmail(email: string) {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Bienvenue dans la lettre de Le Relief",
    html: welcomeEmailHtml(),
  });
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    reader: "Lecteur",
    writer: "Rédacteur",
    editor: "Éditeur",
    publisher: "Publisher",
    admin: "Admin",
  };
  return map[role] || role;
}

export async function sendTeamRoleChangedEmail(params: {
  email: string;
  name?: string | null;
  previousRole?: string;
  newRole: string;
}) {
  const { email, name, previousRole, newRole } = params;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Votre accès Le Relief a été mis à jour",
    html: roleChangedEmailHtml({
      name,
      previousRole,
      newRole,
    }),
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

function roleChangedEmailHtml(params: {
  name?: string | null;
  previousRole?: string;
  newRole: string;
}) {
  const { name, previousRole, newRole } = params;
  const greeting = name?.trim() ? `Bonjour ${name.trim()},` : "Bonjour,";
  const prev = previousRole ? roleLabel(previousRole) : "—";
  const next = roleLabel(newRole);

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Georgia,'Times New Roman',serif">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-top:4px solid #B11226">
    <div style="padding:40px 48px 32px">
      <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#B11226">
        Le Relief — Équipe
      </p>
      <h1 style="margin:0 0 24px;font-size:30px;font-weight:900;color:#111111;line-height:1.1;letter-spacing:-0.5px">
        Accès mis à jour
      </h1>
      <p style="margin:0 0 16px;font-size:17px;color:#333333;line-height:1.6">
        ${greeting}
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#5F5F5F;line-height:1.7">
        Votre rôle dans l'espace de rédaction a été modifié par un administrateur.
      </p>
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:0 0 28px">
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e5e5;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#666">Rôle précédent</td>
          <td style="padding:10px 12px;border:1px solid #e5e5e5;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#111">${prev}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;border:1px solid #e5e5e5;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#666">Nouveau rôle</td>
          <td style="padding:10px 12px;border:1px solid #e5e5e5;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;color:#111">${next}</td>
        </tr>
      </table>
      <a href="https://le-relief.vercel.app/dashboard" style="display:inline-block;background:#B11226;color:#ffffff;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:12px 24px;text-decoration:none">
        Ouvrir le backoffice
      </a>
    </div>
    <div style="border-top:1px solid #e5e5e5;padding:20px 48px">
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#999999">
        Cet e-mail est envoyé automatiquement après une mise à jour de permissions.
      </p>
    </div>
  </div>
</body>
</html>`;
}
