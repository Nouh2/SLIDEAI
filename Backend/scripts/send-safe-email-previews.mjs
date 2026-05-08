import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(repoRoot, 'Backend', 'apps', 'worker', '.env') });

const emailDir = resolve(repoRoot, 'SlideAIemail', 'emails', 'standalone');
const to = process.argv[2] || 'noe.tehraoui1@gmail.com';
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';
const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX ?? '[Preview] ';

if (!apiKey) {
  console.error('RESEND_API_KEY missing in Backend/apps/worker/.env');
  process.exit(1);
}

const files = [
  '00-confirmation.html',
  '01-bienvenue.html',
  '02-activation.html',
  '03-pedagogique.html',
  '04-social-proof.html',
  '05-relance.html',
  '06-conversion.html',
  '07-reactivation.html',
  '08-newsletter.html',
];

function makeEmailSafeHtml(html) {
  const vars = {};
  const rootRegex = /:root\s*\{([^}]*)\}/g;
  let rootMatch;
  while ((rootMatch = rootRegex.exec(html))) {
    const varRegex = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
    let varMatch;
    while ((varMatch = varRegex.exec(rootMatch[1]))) {
      vars[varMatch[1]] = varMatch[2].trim();
    }
  }
  let out = html.replace(
    /var\(\s*--([a-zA-Z0-9-]+)(?:\s*,\s*([^)]+))?\s*\)/g,
    (_, name, fallback) => vars[name] ?? (fallback ? fallback.trim() : 'inherit'),
  );
  const overrideStyles =
    '<style>' +
    "body{margin:0 !important;padding:0 !important;background:#F0F4F8 !important;color:#0D1117 !important;display:block !important;height:auto !important;overflow:visible !important;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif !important;}" +
    '.email-wrapper{max-width:620px !important;margin:0 auto !important;background:#FFFFFF !important;}' +
    '</style>';
  if (out.includes('</head>')) {
    out = out.replace('</head>', `${overrideStyles}\n</head>`);
  } else {
    out = `${overrideStyles}\n${out}`;
  }
  return out;
}

async function sendOne(fileName) {
  const raw = readFileSync(resolve(emailDir, fileName), 'utf8');
  const subject = (raw.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || fileName).trim();
  const html = makeEmailSafeHtml(raw);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${subjectPrefix}${fileName.replace('.html', '')} — ${subject}`,
      html,
    }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${fileName} ${response.status} ${JSON.stringify(body)}`);
  }
  return { file: fileName, subject, id: body.id };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sent = [];
for (const fileName of files) {
  console.log(`Sending ${fileName} → ${to} ...`);
  try {
    const result = await sendOne(fileName);
    sent.push(result);
    console.log(`  ✓ ${result.id}`);
  } catch (err) {
    console.error(`  ✗ ${err.message}`);
  }
  await sleep(700);
}

console.log('\n=== Done ===');
console.log(JSON.stringify({ to, count: sent.length, sent }, null, 2));
