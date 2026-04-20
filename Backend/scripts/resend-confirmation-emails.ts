/**
 * Script one-shot : renvoie les emails de confirmation Supabase
 * aux utilisateurs qui n'ont pas reçu le leur (problème DMARC résolu).
 *
 * Usage : tsx resend-confirmation-emails.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dntcdhabtctfbylynlcr.supabase.co';
const EMAIL_FROM = 'SlideAI <noreply@slideai.fr>';

function requireEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'RESEND_API_KEY') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = requireEnv('RESEND_API_KEY');

const TARGETS = [
  'karlaelong@yahoo.com',
  'dialloidrissa042@gmail.com',
  'etoile.filante241217@gmail.com',
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function buildConfirmationEmail(confirmUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmez votre compte SlideAI</title>
</head>
<body style="margin:0;padding:0;background:#f4fbff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4fbff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #dbeafe;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:#1fb6ff;padding:28px 40px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">SlideAI</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1fb6ff;text-transform:uppercase;letter-spacing:1px;">Bienvenue</p>
              <h1 style="margin:0 0 20px;font-size:26px;font-weight:700;color:#0f172a;line-height:1.2;">Confirmez votre compte SlideAI</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6;">
                Merci de vous être inscrit sur SlideAI&nbsp;! Pour activer votre compte et accéder à toutes les fonctionnalités, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.6;">
                Ce lien est valable <strong>24 heures</strong>.
              </p>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:#1fb6ff;">
                    <a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      Confirmer mon adresse email
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;font-size:13px;color:#94a3b8;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br />
                <a href="${confirmUrl}" style="color:#1fb6ff;word-break:break-all;">${confirmUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #dbeafe;background:#f4fbff;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                Vous recevez cet email car vous venez de créer un compte sur SlideAI.<br />
                Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement ce message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [to], subject, html }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(`Resend error (${res.status}): ${JSON.stringify(body)}`);
  return body;
}

async function processUser(email: string) {
  console.log(`\n→ Traitement de ${email}`);

  // Génère un nouveau lien de confirmation Supabase
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
  });

  if (error) {
    // Si l'user est déjà confirmé, Supabase renvoie une erreur
    // Dans ce cas on génère un magic link pour qu'il puisse se connecter
    console.warn(`  ⚠ generateLink(signup) failed: ${error.message}`);
    console.log(`  → Tentative avec magic link...`);

    const { data: ml, error: mlErr } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (mlErr) {
      console.error(`  ✗ Magic link aussi échoué: ${mlErr.message}`);
      return;
    }

    const url = ml.properties?.action_link;
    if (!url) {
      console.error(`  ✗ Pas d'action_link dans la réponse magic link`);
      return;
    }

    const html = buildConfirmationEmail(url);
    const result = await sendViaResend(
      email,
      'Connectez-vous à votre compte SlideAI',
      html,
    );
    console.log(`  ✓ Magic link envoyé — id: ${result.id}`);
    return;
  }

  const url = data.properties?.action_link;
  if (!url) {
    console.error(`  ✗ Pas d'action_link dans la réponse`);
    return;
  }

  console.log(`  ✓ Lien généré`);
  const html = buildConfirmationEmail(url);
  const result = await sendViaResend(
    email,
    'Confirmez votre compte SlideAI',
    html,
  );
  console.log(`  ✓ Email envoyé — id: ${result.id}`);
}

async function main() {
  console.log('=== Renvoi des emails de confirmation ===');
  console.log(`Cibles : ${TARGETS.join(', ')}\n`);

  for (const email of TARGETS) {
    try {
      await processUser(email);
    } catch (err: any) {
      console.error(`  ✗ Erreur pour ${email}: ${err.message}`);
    }
  }

  console.log('\n=== Terminé ===');
}

main();
