/**
 * Syncs the hosted Supabase Auth "Confirm sign up" email template with
 * SlideAI's production-safe confirmation email.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_... tsx sync-supabase-auth-confirmation-template.ts
 *
 * Optional:
 *   SUPABASE_PROJECT_REF=dntcdhabtctfbylynlcr
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_PROJECT_REF = 'dntcdhabtctfbylynlcr';
const CONFIRMATION_SUBJECT = 'Connectez-vous \u00e0 votre compte SlideAI';

function requireEnv(name: 'SUPABASE_ACCESS_TOKEN') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function loadConfirmationTemplate() {
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
    .split('{{CTA_URL}}').join('{{ .ConfirmationURL }}')
    .split('{{UNSUBSCRIBE_URL}}').join('https://www.slideai.fr/unsubscribe')
    .split('{{PRIVACY_URL}}').join('https://www.slideai.fr/privacy');
}

async function main() {
  const accessToken = requireEnv('SUPABASE_ACCESS_TOKEN');
  const projectRef = process.env.SUPABASE_PROJECT_REF || DEFAULT_PROJECT_REF;
  const html = loadConfirmationTemplate();

  const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mailer_subjects_confirmation: CONFIRMATION_SUBJECT,
      mailer_templates_confirmation_content: html,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Supabase Management API error (${response.status}): ${body}`);
  }

  console.log(`Supabase confirmation template synced for ${projectRef}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
