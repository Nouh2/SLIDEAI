import dotenv from 'dotenv';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(repoRoot, 'Backend', 'apps', 'worker', '.env') });

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';
const to = process.argv[2] || 'noe.tehraoui1@gmail.com';

if (!apiKey) {
  console.error('RESEND_API_KEY missing');
  process.exit(1);
}

const emailSafeDir = resolve(repoRoot, 'SlideAIemail', 'emails', 'email-safe');
const files = readdirSync(emailSafeDir).filter((f) => /^\d{2}-.+\.html$/.test(f)).sort();

const PLACEHOLDERS = {
  '{{CTA_URL}}': 'https://www.slideai.fr/dashboard',
  '{{PRICING_URL}}': 'https://www.slideai.fr/pricing',
  '{{UNSUBSCRIBE_URL}}': 'https://www.slideai.fr/unsubscribe',
  '{{PRIVACY_URL}}': 'https://www.slideai.fr/privacy',
  '{{PREFS_URL}}': 'https://www.slideai.fr/preferences',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function sendOne(file) {
  let html = readFileSync(resolve(emailSafeDir, file), 'utf8');
  for (const [key, value] of Object.entries(PLACEHOLDERS)) {
    html = html.split(key).join(value);
  }
  const subject = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || file).trim();

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${file} ${response.status} ${JSON.stringify(body)}`);
  return { file, subject, id: body.id };
}

const sent = [];
for (const file of files) {
  process.stdout.write(`Sending ${file}...`);
  try {
    const r = await sendOne(file);
    sent.push(r);
    console.log(`  ✓ ${r.id}`);
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
  }
  await sleep(700);
}

console.log(`\n${sent.length}/${files.length} sent to ${to}`);
