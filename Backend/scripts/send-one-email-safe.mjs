import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(repoRoot, 'Backend', 'apps', 'worker', '.env') });

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';
const file = process.argv[2] || '01-bienvenue.html';
const to = process.argv[3] || 'noe.tehraoui1@gmail.com';

if (!apiKey) {
  console.error('RESEND_API_KEY missing');
  process.exit(1);
}

const PLACEHOLDERS = {
  '{{CTA_URL}}': 'https://www.slideai.fr/dashboard',
  '{{PRICING_URL}}': 'https://www.slideai.fr/pricing',
  '{{UNSUBSCRIBE_URL}}': 'https://www.slideai.fr/unsubscribe',
  '{{PRIVACY_URL}}': 'https://www.slideai.fr/privacy',
  '{{PREFS_URL}}': 'https://www.slideai.fr/preferences',
};

const path = resolve(repoRoot, 'SlideAIemail', 'emails', 'email-safe', file);
let html = readFileSync(path, 'utf8');
for (const [k, v] of Object.entries(PLACEHOLDERS)) {
  html = html.split(k).join(v);
}
const subject = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || file).trim();

const response = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from,
    to: [to],
    subject: `[v4 logo] ${file.replace('.html', '')} — ${subject}`,
    html,
  }),
});
const body = await response.json();
if (!response.ok) {
  console.error(`✗ ${response.status} ${JSON.stringify(body)}`);
  process.exit(1);
}
console.log(`✓ Sent ${file} to ${to} — id ${body.id}`);
