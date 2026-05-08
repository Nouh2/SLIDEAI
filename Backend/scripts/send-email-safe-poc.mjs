import dotenv from 'dotenv';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(repoRoot, 'Backend', 'apps', 'worker', '.env') });

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';
const to = process.argv[2] || 'noe.tehraoui1@gmail.com';

if (!apiKey) {
  console.error('RESEND_API_KEY missing');
  process.exit(1);
}

// HTML wrapper for the SVG illustration so Chrome can render it as a PNG
// at the exact width / styling that the standalone file uses.
const illustrationHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  html,body { margin:0; padding:0; background:#FFFFFF; }
  .wrap { width:620px; border-top:1px solid #E4EAF0; border-bottom:2px solid #2BB5FF; background:linear-gradient(90deg,#EBF6FF 0%,#F5FBFF 100%); }
  .wrap svg { display:block; width:100%; height:auto; }
</style></head>
<body>
<div class="wrap">
  <svg viewBox="0 0 548 130" xmlns="http://www.w3.org/2000/svg">
    <rect x="40" y="28" width="130" height="74" rx="10" fill="white" stroke="#C8E8FA" stroke-width="1.5"/>
    <circle cx="68" cy="52" r="13" fill="#2BB5FF"/>
    <text x="68" y="57" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="white">1</text>
    <rect x="88" y="47" width="66" height="7" rx="3" fill="#C8E8FA"/>
    <rect x="54" y="73" width="100" height="6" rx="2" fill="#EBF6FF"/>
    <rect x="54" y="84" width="76" height="6" rx="2" fill="#EBF6FF"/>
    <line x1="178" y1="65" x2="208" y2="65" stroke="#2BB5FF" stroke-width="2" stroke-dasharray="4 3"/>
    <polygon points="207,60 218,65 207,70" fill="#2BB5FF"/>
    <rect x="222" y="28" width="104" height="74" rx="10" fill="white" stroke="#C8E8FA" stroke-width="1.5"/>
    <circle cx="250" cy="52" r="13" fill="#2BB5FF"/>
    <text x="250" y="57" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="white">2</text>
    <rect x="270" y="47" width="40" height="7" rx="3" fill="#C8E8FA"/>
    <rect x="236" y="73" width="74" height="6" rx="2" fill="#EBF6FF"/>
    <rect x="236" y="84" width="56" height="6" rx="2" fill="#EBF6FF"/>
    <line x1="334" y1="65" x2="364" y2="65" stroke="#2BB5FF" stroke-width="2" stroke-dasharray="4 3"/>
    <polygon points="363,60 374,65 363,70" fill="#2BB5FF"/>
    <rect x="378" y="28" width="130" height="74" rx="10" fill="#EBF6FF" stroke="#2BB5FF" stroke-width="1.5"/>
    <circle cx="406" cy="52" r="13" fill="#2BB5FF"/>
    <text x="406" y="57" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="white">3</text>
    <rect x="426" y="47" width="66" height="7" rx="3" fill="#2BB5FF" opacity="0.4"/>
    <rect x="392" y="73" width="100" height="6" rx="2" fill="#2BB5FF" opacity="0.2"/>
    <rect x="392" y="84" width="76" height="6" rx="2" fill="#2BB5FF" opacity="0.15"/>
    <text x="105" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#4A8AAA">Déposez votre source</text>
    <text x="274" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#4A8AAA">Choisissez le style</text>
    <text x="443" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#2BB5FF">Export .pptx</text>
  </svg>
</div>
</body></html>`;

function renderToPng(html, widthPx, heightPx) {
  const tmpHtml = resolve(tmpdir(), `slideai-illus-${Date.now()}.html`);
  const tmpPng = resolve(tmpdir(), `slideai-illus-${Date.now()}.png`);
  const userDataDir = resolve(tmpdir(), `slideai-chrome-${Date.now()}`);
  writeFileSync(tmpHtml, html, 'utf8');
  mkdirSync(userDataDir, { recursive: true });

  const result = spawnSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--hide-scrollbars',
    `--user-data-dir=${userDataDir}`,
    `--screenshot=${tmpPng}`,
    `--window-size=${widthPx},${heightPx}`,
    '--default-background-color=00000000',
    pathToFileURL(tmpHtml).href,
  ], { encoding: 'utf8' });

  rmSync(userDataDir, { recursive: true, force: true });

  if (result.status !== 0) {
    throw new Error(`Chrome screenshot failed: ${result.stderr || result.stdout}`);
  }
  const buf = readFileSync(tmpPng);
  rmSync(tmpHtml, { force: true });
  rmSync(tmpPng, { force: true });
  return buf;
}

console.log('Rendering illustration to PNG...');
const pngBuffer = renderToPng(illustrationHtml, 620, 153);
console.log(`  PNG size: ${pngBuffer.length} bytes`);

const dataUri = `data:image/png;base64,${pngBuffer.toString('base64')}`;

const templatePath = resolve(repoRoot, 'SlideAIemail', 'emails', 'email-safe', '01-bienvenue.html');
let html = readFileSync(templatePath, 'utf8');
html = html
  .replace(/{{ILLUSTRATION_URL}}/g, dataUri)
  .replace(/{{CTA_URL}}/g, 'https://www.slideai.fr/dashboard')
  .replace(/{{UNSUBSCRIBE_URL}}/g, 'https://www.slideai.fr/unsubscribe')
  .replace(/{{PRIVACY_URL}}/g, 'https://www.slideai.fr/privacy');

const subject = '[Preview email-safe v2] Bienvenue sur SlideAI — voici comment démarrer';

console.log(`Sending to ${to}...`);
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
if (!response.ok) {
  console.error(`Resend error ${response.status}: ${JSON.stringify(body)}`);
  process.exit(1);
}

console.log(`✓ Sent. Resend id: ${body.id}`);
