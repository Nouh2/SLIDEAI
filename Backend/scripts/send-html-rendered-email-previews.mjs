import dotenv from 'dotenv';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
dotenv.config({ path: resolve(repoRoot, 'Backend', 'apps', 'worker', '.env') });
const emailDir = resolve(repoRoot, 'slideaiemail', 'emails', 'standalone');
const outDir = resolve(repoRoot, 'slideaiemail', 'emails', 'rendered');
const logPath = resolve(outDir, 'send-rendered.log');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const defaultFiles = [
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

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const heightByFile = {
  '00-confirmation.html': 900,
  '01-bienvenue.html': 950,
  '02-activation.html': 980,
  '03-pedagogique.html': 1180,
  '04-social-proof.html': 1180,
  '05-relance.html': 1000,
  '06-conversion.html': 1120,
  '07-reactivation.html': 1040,
  '08-newsletter.html': 1300,
};

async function renderHtmlToPng(chrome, fileName) {
  writeFileSync(logPath, `[${new Date().toISOString()}] render start ${fileName}\n`, { flag: 'a' });
  const sourcePath = resolve(emailDir, fileName);
  const outputPath = resolve(outDir, fileName.replace(/\.html$/i, '.png'));
  const userDataDir = join(tmpdir(), `slideai-email-chrome-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const height = heightByFile[fileName] || 1100;

  mkdirSync(userDataDir, { recursive: true });
  const result = spawnSync(chrome, [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--hide-scrollbars',
    `--user-data-dir=${userDataDir}`,
    `--screenshot=${outputPath}`,
    `--window-size=620,${height}`,
    pathToFileURL(sourcePath).href,
  ], { encoding: 'utf8' });

  try {
    if (result.status !== 0) {
      throw new Error(`Chrome screenshot failed for ${fileName}: ${result.stderr || result.stdout}`);
    }
    writeFileSync(logPath, `[${new Date().toISOString()}] screenshot ok ${fileName}\n`, { flag: 'a' });
    return outputPath;
  } finally {
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

async function sendRenderedEmail(to, fileName, imagePath) {
  writeFileSync(logPath, `[${new Date().toISOString()}] send start ${fileName}\n`, { flag: 'a' });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY missing');

  const htmlSource = readFileSync(resolve(emailDir, fileName), 'utf8');
  const subject = (htmlSource.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || fileName).trim();
  const cid = fileName.replace(/\.html$/i, '-render');
  const image = readFileSync(imagePath).toString('base64');
  const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';

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
      html: `<!doctype html><html><body style="margin:0;padding:0;background:#F0F4F8;"><div style="max-width:620px;margin:0 auto;background:#FFFFFF;"><img src="cid:${cid}" width="620" style="display:block;width:100%;max-width:620px;height:auto;border:0;outline:none;text-decoration:none;" alt="${subject.replace(/"/g, '&quot;')}"></div></body></html>`,
      attachments: [{
        content: image,
        filename: basename(imagePath),
        contentId: cid,
        content_type: 'image/png',
      }],
    }),
  });

  if (!response.ok) {
    throw new Error(`${fileName} ${response.status} ${await response.text()}`);
  }

  const result = await response.json();
  writeFileSync(logPath, `[${new Date().toISOString()}] send ok ${fileName} ${result.id}\n`, { flag: 'a' });
  return { file: fileName, subject, id: result.id, image: imagePath };
}

const to = process.argv[2] || 'noe.tehraoui1@gmail.com';
const requestedFiles = process.argv.slice(3);
const files = requestedFiles.length ? requestedFiles : defaultFiles;
mkdirSync(outDir, { recursive: true });

const sent = [];
for (const fileName of files) {
  console.log(`Rendering ${fileName}...`);
  const imagePath = await renderHtmlToPng(chromePath, fileName);
  console.log(`Sending ${fileName}...`);
  sent.push(await sendRenderedEmail(to, fileName, imagePath));
  await sleep(1500);
}

console.log(JSON.stringify({ to, mode: 'rendered-html-screenshot-cid', sent }, null, 2));
