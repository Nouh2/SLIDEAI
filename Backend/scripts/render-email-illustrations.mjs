// Renders the SVG illustrations from each standalone email template into PNGs
// dropped in Frontend/presto-decks/public/email-assets/.
// Once deployed via Vercel, they become reachable at
// https://www.slideai.fr/email-assets/<name>-illustration.png
// and are referenced by the email-safe HTML templates.

import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { Jimp } from 'jimp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = resolve(repoRoot, 'Frontend', 'presto-decks', 'public', 'email-assets');
mkdirSync(outDir, { recursive: true });

// Each entry mirrors the original standalone illustration block. Setting
// `inset: true` produces a 548×H rounded card (matches `margin: 0 36px;
// border-radius: 10px;` in the standalone). `inset: false` produces a 620×H
// edge-to-edge banner (matches the no-margin variants).
const illustrations = {
  '00-confirmation': {
    inset: true,
    height: 140,
    wrapperStyle: 'border:1px solid #C8E8FA;border-radius:10px;background:linear-gradient(135deg,#EBF6FF,#F5FBFF);',
    svg: `<svg viewBox="0 0 548 140" xmlns="http://www.w3.org/2000/svg">
      <rect x="174" y="28" width="200" height="84" rx="10" fill="white" stroke="#C8E8FA" stroke-width="2"/>
      <rect x="174" y="28" width="200" height="36" rx="10" fill="#EBF6FF"/>
      <rect x="174" y="50" width="200" height="14" fill="#EBF6FF"/>
      <polyline points="174,28 274,78 374,28" fill="none" stroke="#2BB5FF" stroke-width="2.5"/>
      <rect x="204" y="88" width="110" height="7" rx="3" fill="#C8E8FA"/>
      <rect x="204" y="100" width="70" height="7" rx="3" fill="#D8F0FF"/>
      <circle cx="394" cy="46" r="24" fill="#2BB5FF"/>
      <polyline points="382,46 391,55 408,38" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },

  '01-bienvenue': {
    inset: false,
    height: 130,
    wrapperStyle: 'border-top:1px solid #E4EAF0;border-bottom:2px solid #2BB5FF;background:linear-gradient(90deg,#EBF6FF 0%,#F5FBFF 100%);',
    svg: `<svg viewBox="0 0 548 130" xmlns="http://www.w3.org/2000/svg">
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
    </svg>`,
  },

  '02-activation': {
    inset: true,
    height: 110,
    wrapperStyle: 'border:1px solid #1A2438;border-radius:10px;background:#0D1117;',
    svg: `<svg viewBox="0 0 548 110" xmlns="http://www.w3.org/2000/svg">
      <text x="274" y="28" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="600" letter-spacing="2" fill="#3A5070">ESSAI EN COURS</text>
      <text x="274" y="66" text-anchor="middle" font-family="Inter,sans-serif" font-size="38" font-weight="800" letter-spacing="-2" fill="white">6 jours restants</text>
      <rect x="60" y="82" width="428" height="7" rx="3.5" fill="#1A2438"/>
      <rect x="60" y="82" width="61" height="7" rx="3.5" fill="#2BB5FF"/>
      <text x="60" y="100" font-family="Inter,sans-serif" font-size="9" fill="#2A3550">J1</text>
      <text x="488" y="100" text-anchor="end" font-family="Inter,sans-serif" font-size="9" fill="#3A5070">J7</text>
    </svg>`,
  },

  '03-pedagogique': {
    inset: true,
    height: 130,
    wrapperStyle: 'border:1px solid #E4EAF0;border-radius:10px;background:#F8FAFC;',
    svg: `<svg viewBox="0 0 548 130" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="20" width="100" height="90" rx="8" fill="white" stroke="#C8E8FA" stroke-width="1.5"/>
      <rect x="34" y="20" width="100" height="28" rx="8" fill="#EBF6FF"/>
      <rect x="34" y="38" width="100" height="10" fill="#EBF6FF"/>
      <text x="84" y="38" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="600" fill="#1A6090">brief.pdf</text>
      <rect x="46" y="60" width="76" height="6" rx="2" fill="#C8E8FA"/>
      <rect x="46" y="72" width="60" height="6" rx="2" fill="#C8E8FA"/>
      <rect x="46" y="84" width="50" height="6" rx="2" fill="#D8F0FF"/>
      <line x1="142" y1="65" x2="188" y2="65" stroke="#2BB5FF" stroke-width="2" stroke-dasharray="5 4"/>
      <polygon points="186,60 198,65 186,70" fill="#2BB5FF"/>
      <rect x="148" y="53" width="32" height="16" rx="8" fill="#2BB5FF"/>
      <text x="164" y="65" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="white">IA</text>
      <rect x="202" y="14" width="312" height="102" rx="10" fill="white" stroke="#2BB5FF" stroke-width="1.5"/>
      <rect x="212" y="26" width="72" height="52" rx="5" fill="#EBF6FF" stroke="#C8E8FA" stroke-width="1"/>
      <rect x="294" y="26" width="72" height="52" rx="5" fill="#EBF6FF" stroke="#C8E8FA" stroke-width="1"/>
      <rect x="376" y="26" width="72" height="52" rx="5" fill="#2BB5FF" opacity="0.12" stroke="#2BB5FF" stroke-width="1"/>
      <rect x="220" y="38" width="56" height="5" rx="2" fill="#C8E8FA"/>
      <rect x="220" y="48" width="40" height="4" rx="2" fill="#D8F0FF"/>
      <rect x="220" y="56" width="48" height="4" rx="2" fill="#D8F0FF"/>
      <rect x="302" y="38" width="56" height="5" rx="2" fill="#C8E8FA"/>
      <rect x="302" y="48" width="40" height="4" rx="2" fill="#D8F0FF"/>
      <text x="412" y="52" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="#2BB5FF">15 slides</text>
      <text x="358" y="106" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#4A8AAA">deck généré · prêt à exporter</text>
    </svg>`,
  },

  '04-social-proof': {
    inset: false,
    height: 110,
    wrapperStyle: 'border-top:1px solid #E4EAF0;border-bottom:1px solid #E4EAF0;background:linear-gradient(135deg,#F5FBFF,#EBF6FF);',
    svg: `<svg viewBox="0 0 548 110" xmlns="http://www.w3.org/2000/svg">
      <text x="230" y="50" font-size="20" fill="#2BB5FF">★</text>
      <text x="255" y="50" font-size="20" fill="#2BB5FF">★</text>
      <text x="280" y="50" font-size="20" fill="#2BB5FF">★</text>
      <text x="305" y="50" font-size="20" fill="#2BB5FF">★</text>
      <text x="330" y="50" font-size="20" fill="#2BB5FF">★</text>
      <text x="274" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="600" fill="#1A6090">170+ professionnels font confiance à SlideAI</text>
      <circle cx="214" cy="92" r="10" fill="#C8E8FA"/><text x="214" y="96" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#1A6090">ML</text>
      <circle cx="238" cy="92" r="10" fill="#B8DDF5"/><text x="238" y="96" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#1A6090">TK</text>
      <circle cx="262" cy="92" r="10" fill="#A8D2F0"/><text x="262" y="96" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#1A6090">SB</text>
      <circle cx="286" cy="92" r="10" fill="#98C8EB"/><text x="286" y="96" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#1A6090">AC</text>
      <circle cx="310" cy="92" r="10" fill="#88BEE6"/><text x="310" y="96" text-anchor="middle" font-family="Inter,sans-serif" font-size="8" font-weight="700" fill="#1A6090">PL</text>
      <text x="328" y="96" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#4A8AAA">+165</text>
    </svg>`,
  },

  '05-relance': {
    inset: true,
    height: 100,
    wrapperStyle: 'border:1px solid #1A2438;border-radius:10px;background:#0D1117;',
    svg: `<svg viewBox="0 0 548 100" xmlns="http://www.w3.org/2000/svg">
      <text x="274" y="24" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="600" letter-spacing="2" fill="#3A5070">TRIAL EXPIRE DANS</text>
      <text x="274" y="62" text-anchor="middle" font-family="Inter,sans-serif" font-size="40" font-weight="800" letter-spacing="-2" fill="white">24 : 00 : 00</text>
      <text x="195" y="78" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#2A3550">heures</text>
      <text x="274" y="78" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#2A3550">minutes</text>
      <text x="353" y="78" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#2A3550">secondes</text>
      <rect x="60" y="88" width="428" height="5" rx="2.5" fill="#1A2438"/>
      <rect x="60" y="88" width="393" height="5" rx="2.5" fill="#2BB5FF" opacity="0.5"/>
      <rect x="453" y="88" width="35" height="5" rx="2.5" fill="#2BB5FF"/>
    </svg>`,
  },

  '06-conversion': {
    inset: false,
    height: 130,
    wrapperStyle: 'border-top:1px solid #E4EAF0;border-bottom:1px solid #E4EAF0;background:#F8FAFC;',
    svg: `<svg viewBox="0 0 548 130" xmlns="http://www.w3.org/2000/svg">
      <rect x="36" y="14" width="196" height="102" rx="10" fill="white" stroke="#E4EAF0" stroke-width="1.5"/>
      <text x="134" y="34" text-anchor="middle" font-family="Inter,sans-serif" font-size="10" font-weight="600" fill="#A0AABB">Sans SlideAI</text>
      <rect x="52" y="44" width="164" height="7" rx="3" fill="#F0F4F8"/>
      <rect x="52" y="57" width="120" height="7" rx="3" fill="#F0F4F8"/>
      <rect x="52" y="70" width="140" height="7" rx="3" fill="#F0F4F8"/>
      <rect x="52" y="83" width="80" height="7" rx="3" fill="#F0F4F8"/>
      <text x="134" y="108" text-anchor="middle" font-family="Inter,sans-serif" font-size="12" font-weight="700" fill="#C0CCDA">3–4 heures</text>
      <circle cx="274" cy="65" r="20" fill="white" stroke="#E4EAF0" stroke-width="1.5"/>
      <text x="274" y="70" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="#6B7A90">VS</text>
      <rect x="316" y="6" width="196" height="118" rx="10" fill="#EBF6FF" stroke="#2BB5FF" stroke-width="2"/>
      <rect x="356" y="-2" width="116" height="20" rx="10" fill="#2BB5FF"/>
      <text x="414" y="12" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="white">Avec SlideAI ✓</text>
      <rect x="332" y="26" width="164" height="7" rx="3" fill="#C8E8FA"/>
      <rect x="332" y="39" width="120" height="7" rx="3" fill="#C8E8FA"/>
      <rect x="332" y="52" width="140" height="7" rx="3" fill="#C8E8FA"/>
      <rect x="332" y="65" width="80" height="7" rx="3" fill="#D8F0FF"/>
      <text x="414" y="94" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="#2BB5FF">~15 min</text>
      <text x="414" y="114" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" fill="#4A8AAA">deck éditable · livrable client</text>
    </svg>`,
  },

  '07-reactivation': {
    inset: true,
    height: 110,
    wrapperStyle: 'border:1px solid #E4EAF0;border-radius:10px;background:#F8FAFC;',
    svg: `<svg viewBox="0 0 548 110" xmlns="http://www.w3.org/2000/svg">
      <rect x="34" y="16" width="148" height="78" rx="8" fill="white" stroke="#C8E8FA" stroke-width="1.5"/>
      <circle cx="58" cy="42" r="14" fill="#EBF6FF"/>
      <text x="58" y="47" text-anchor="middle" font-size="13">📊</text>
      <rect x="80" y="36" width="86" height="7" rx="3" fill="#C8E8FA"/>
      <rect x="80" y="48" width="60" height="5" rx="2" fill="#D8F0FF"/>
      <rect x="44" y="68" width="120" height="5" rx="2" fill="#EBF6FF"/>
      <rect x="44" y="78" width="90" height="5" rx="2" fill="#EBF6FF"/>
      <rect x="200" y="16" width="148" height="78" rx="8" fill="white" stroke="#C8E8FA" stroke-width="1.5"/>
      <circle cx="224" cy="42" r="14" fill="#EBF6FF"/>
      <text x="224" y="47" text-anchor="middle" font-size="13">🎨</text>
      <rect x="246" y="36" width="86" height="7" rx="3" fill="#C8E8FA"/>
      <rect x="246" y="48" width="60" height="5" rx="2" fill="#D8F0FF"/>
      <rect x="210" y="68" width="120" height="5" rx="2" fill="#EBF6FF"/>
      <rect x="210" y="78" width="90" height="5" rx="2" fill="#EBF6FF"/>
      <rect x="366" y="8" width="148" height="94" rx="8" fill="#EBF6FF" stroke="#2BB5FF" stroke-width="1.5"/>
      <rect x="444" y="0" width="42" height="18" rx="9" fill="#2BB5FF"/>
      <text x="465" y="13" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="white">NEW</text>
      <circle cx="390" cy="42" r="14" fill="#C8E8FA"/>
      <text x="390" y="47" text-anchor="middle" font-size="13">⚡</text>
      <rect x="412" y="36" width="86" height="7" rx="3" fill="#2BB5FF" opacity="0.3"/>
      <rect x="412" y="48" width="60" height="5" rx="2" fill="#2BB5FF" opacity="0.2"/>
      <rect x="376" y="68" width="120" height="5" rx="2" fill="#2BB5FF" opacity="0.15"/>
      <rect x="376" y="78" width="90" height="5" rx="2" fill="#2BB5FF" opacity="0.1"/>
    </svg>`,
  },

  '08-newsletter': {
    inset: false,
    height: 120,
    wrapperStyle: 'border-top:1px solid #E4EAF0;border-bottom:1px solid #E4EAF0;background:linear-gradient(135deg,#EBF6FF,#F5FBFF);',
    svg: `<svg viewBox="0 0 548 120" xmlns="http://www.w3.org/2000/svg">
      <rect x="40" y="18" width="70" height="84" rx="8" fill="white" stroke="#C8E8FA" stroke-width="1.5"/>
      <rect x="40" y="18" width="70" height="26" rx="8" fill="#2BB5FF"/>
      <rect x="40" y="34" width="70" height="10" fill="#2BB5FF"/>
      <text x="75" y="35" text-anchor="middle" font-family="Inter,sans-serif" font-size="9" font-weight="700" fill="white">AVRIL</text>
      <text x="75" y="72" text-anchor="middle" font-family="Inter,sans-serif" font-size="22" font-weight="800" fill="#0D1117">2026</text>
      <rect x="128" y="20" width="380" height="24" rx="6" fill="white" stroke="#C8E8FA" stroke-width="1"/>
      <circle cx="143" cy="32" r="7" fill="#2BB5FF"/>
      <rect x="158" y="28" width="180" height="6" rx="2" fill="#C8E8FA"/>
      <rect x="158" y="37" width="110" height="4" rx="2" fill="#EBF6FF"/>
      <rect x="128" y="52" width="380" height="24" rx="6" fill="white" stroke="#C8E8FA" stroke-width="1"/>
      <circle cx="143" cy="64" r="7" fill="#2BB5FF" opacity="0.6"/>
      <rect x="158" y="60" width="140" height="6" rx="2" fill="#C8E8FA"/>
      <rect x="158" y="69" width="90" height="4" rx="2" fill="#EBF6FF"/>
      <rect x="128" y="84" width="380" height="24" rx="6" fill="white" stroke="#C8E8FA" stroke-width="1"/>
      <circle cx="143" cy="96" r="7" fill="#2BB5FF" opacity="0.3"/>
      <rect x="158" y="92" width="160" height="6" rx="2" fill="#C8E8FA"/>
      <rect x="158" y="101" width="120" height="4" rx="2" fill="#EBF6FF"/>
    </svg>`,
  },
};

async function renderToPng(name, entry) {
  const renderWidth = entry.inset ? 548 : 620;
  // Place the wrap directly in <body> (no padding container) — Chrome
  // headless clips ~36px off any direct child of a padded div. Using a
  // larger viewport than content lets Chrome render fully, then we crop.
  const viewportW = Math.max(renderWidth + 160, 900);
  const viewportH = entry.height + 200;

  const sizedSvg = entry.svg.replace(
    /<svg /,
    `<svg width="${renderWidth}" height="${entry.height}" style="display:block;" `,
  );
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:#FFFFFF;}
    .wrap{display:block;width:${renderWidth}px;height:${entry.height}px;${entry.wrapperStyle}overflow:hidden;box-sizing:border-box;}
  </style></head><body><div class="wrap">${sizedSvg}</div></body></html>`;

  const tmpHtml = resolve(tmpdir(), `slideai-illus-${name}-${Date.now()}.html`);
  const tmpRawPng = resolve(tmpdir(), `slideai-illus-${name}-${Date.now()}-raw.png`);
  const finalPng = resolve(outDir, `${name}-illustration.png`);
  const userDataDir = resolve(tmpdir(), `slideai-chrome-${name}-${Date.now()}`);
  writeFileSync(tmpHtml, html, 'utf8');
  mkdirSync(userDataDir, { recursive: true });

  const result = spawnSync(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--user-data-dir=${userDataDir}`,
    `--screenshot=${tmpRawPng}`,
    `--window-size=${viewportW},${viewportH}`,
    pathToFileURL(tmpHtml).href,
  ], { encoding: 'utf8' });

  rmSync(userDataDir, { recursive: true, force: true });
  rmSync(tmpHtml, { force: true });

  if (result.status !== 0) {
    throw new Error(`Chrome screenshot failed for ${name}: ${result.stderr || result.stdout}`);
  }

  // Wrap renders at top-left (0,0). Crop to its exact size.
  const img = await Jimp.read(tmpRawPng);
  img.crop({ x: 0, y: 0, w: renderWidth, h: entry.height });
  await img.write(finalPng);
  rmSync(tmpRawPng, { force: true });

  return finalPng;
}

for (const [name, entry] of Object.entries(illustrations)) {
  console.log(`Rendering ${name}...`);
  const out = await renderToPng(name, entry);
  const buf = readFileSync(out);
  console.log(`  → ${out} (${buf.length} bytes, ${entry.inset ? 548 : 620}×${entry.height})`);
}

console.log('\nDone. PNGs in', outDir);
console.log('After Vercel deploy: https://www.slideai.fr/email-assets/<name>-illustration.png');
