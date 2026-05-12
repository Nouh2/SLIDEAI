/**
 * Script one-shot : renvoie les emails de confirmation Supabase
 * aux utilisateurs qui n'ont pas reçu le leur (problème DMARC résolu).
 *
 * Usage : tsx resend-confirmation-emails.ts email@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SUPABASE_URL = 'https://dntcdhabtctfbylynlcr.supabase.co';
const EMAIL_FROM = 'SlideAI <noreply@slideai.fr>';
const CONFIRMATION_SUBJECT = 'Connectez-vous à votre compte SlideAI';

function requireEnv(name: 'SUPABASE_SERVICE_ROLE_KEY' | 'RESEND_API_KEY') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_API_KEY = requireEnv('RESEND_API_KEY');

function getTargets(): string[] {
  const rawTargets = process.argv.slice(2).length
    ? process.argv.slice(2)
    : (process.env.CONFIRMATION_EMAIL_TARGETS ?? '')
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);

  if (!rawTargets.length) {
    throw new Error(
      'Missing target email. Usage: tsx resend-confirmation-emails.ts email@example.com',
    );
  }

  return rawTargets;
}

const TARGETS = getTargets();

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function buildConfirmationEmail(confirmUrl: string): string {
  const candidates = [
    join(process.cwd(), 'SlideAIemail', 'emails', 'email-safe', '00-confirmation.html'),
    join(process.cwd(), '..', 'SlideAIemail', 'emails', 'email-safe', '00-confirmation.html'),
    join(process.cwd(), '..', '..', 'SlideAIemail', 'emails', 'email-safe', '00-confirmation.html'),
  ];
  const templatePath = candidates.find((candidate) => existsSync(candidate));
  if (!templatePath) {
    throw new Error('Missing SlideAIemail/emails/email-safe/00-confirmation.html');
  }

  return readFileSync(templatePath, 'utf8')
    .split('{{CTA_URL}}').join(confirmUrl)
    .split('{{UNSUBSCRIBE_URL}}').join('https://www.slideai.fr/unsubscribe')
    .split('{{PRIVACY_URL}}').join('https://www.slideai.fr/privacy');
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
      CONFIRMATION_SUBJECT,
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
    CONFIRMATION_SUBJECT,
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
