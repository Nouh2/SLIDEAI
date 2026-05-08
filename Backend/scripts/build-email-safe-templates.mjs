// Generates email-safe HTML for all 9 email templates from a single
// declarative definition. Outputs to SlideAIemail/emails/email-safe/.
// Pass 1 of the rewrite: layout in tables, no illustrations yet.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..');
const outDir = resolve(repoRoot, 'SlideAIemail', 'emails', 'email-safe');
mkdirSync(outDir, { recursive: true });

// ──────────────────────────────────────────────────────────────────
// Brand tokens (literal hex — no CSS vars allowed in email)
// ──────────────────────────────────────────────────────────────────
const C = {
  navy: '#0D1117',
  blue: '#2BB5FF',
  bluePale: '#EBF6FF',
  bluePale2: '#F5FBFF',
  blueBorder: '#C8E8FA',
  bgApp: '#F0F4F8',
  textMain: '#0D1117',
  textMuted: '#6B7A90',
  border: '#E4EAF0',
  white: '#FFFFFF',
  surface: '#F8FAFC',
  textBlue: '#1A6090',
  blueDark: '#1A2438',
};

const FONT = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif";

// ──────────────────────────────────────────────────────────────────
// Block helpers
// ──────────────────────────────────────────────────────────────────

function spacer(px = 24) {
  return `<tr><td class="em-bg-white" bgcolor="${C.white}" style="height:${px}px;line-height:${px}px;font-size:0;background-color:${C.white};">&nbsp;</td></tr>`;
}

function dividerBlock() {
  return `<tr><td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
    <div style="height:1px;background:${C.border};line-height:1px;font-size:0;">&nbsp;</div>
  </td></tr>`;
}

function header(badge) {
  const badgeCell = badge
    ? `<td align="right" valign="middle" style="padding:0;">
            <span class="em-badge" style="display:inline-block;font-family:${FONT};font-size:10px;font-weight:600;letter-spacing:0.8px;text-transform:uppercase;color:${C.textMuted};background:${C.bluePale};padding:5px 11px;border-radius:20px;border:1px solid ${C.blueBorder};line-height:1;">${badge}</span>
          </td>`
    : '';
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:22px 36px 20px;background:${C.white};background-color:${C.white};border-bottom:1px solid ${C.border};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="left" valign="middle" style="padding:0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" width="28" height="28" style="width:28px;height:28px;font-size:0;line-height:0;">
                  <img src="https://www.slideai.fr/logo.png" width="28" height="28" alt="SlideAI" style="display:block;width:28px;height:28px;border:0;outline:none;text-decoration:none;">
                </td>
                <td valign="middle" class="em-text-main" style="padding:0 0 0 9px;font-family:${FONT};font-size:16px;font-weight:700;color:${C.navy};letter-spacing:-0.3px;line-height:28px;white-space:nowrap;">
                  Slide<span style="color:${C.blue};">AI</span>
                </td>
              </tr>
            </table>
          </td>
          ${badgeCell}
        </tr>
      </table>
    </td>
  </tr>`;
}

function hero({ title, subtitle }) {
  return `<tr>
    <td class="em-pad em-hero-pad em-bg-blue-pale" bgcolor="${C.bluePale}" style="padding:36px 36px 32px;background:${C.bluePale};background-color:${C.bluePale};background-image:linear-gradient(135deg,${C.bluePale} 0%,${C.bluePale2} 60%,${C.white} 100%);border-bottom:2px solid ${C.blue};">
      <h1 class="em-hero-h1 em-text-main" style="margin:0;padding:0;font-family:${FONT};font-size:26px;font-weight:800;color:${C.navy};line-height:1.2;letter-spacing:-0.7px;">${title}</h1>
      <p class="em-hero-sub em-text-muted" style="margin:10px 0 0;padding:0;font-family:${FONT};font-size:14.5px;color:${C.textMuted};line-height:1.65;">${subtitle}</p>
    </td>
  </tr>`;
}

function content(paragraphs) {
  const ps = paragraphs.map((p) =>
    `<p class="em-text-body" style="margin:0 0 16px 0;padding:0;font-family:${FONT};font-size:14.5px;color:#2A3545;line-height:1.75;">${p}</p>`,
  ).join('');
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">${ps.replace(/margin:0 0 16px 0;[^>]*>([^<]*)<\/p>$/, (m) => m.replace('margin:0 0 16px 0', 'margin:0'))}</td>
  </tr>`;
}

function steps(items) {
  const rows = items.map((s) => `<tr>
    <td class="em-step-num-cell" valign="top" width="42" style="padding:0 14px 14px 0;width:42px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="28" height="28" bgcolor="${C.blue}" style="background:${C.blue};background-color:${C.blue};border-radius:14px;width:28px;height:28px;">
        <tr><td align="center" valign="middle" width="28" height="28" style="font-family:'Inter',Arial,sans-serif;font-size:12px;font-weight:700;color:${C.white};line-height:28px;">${s.num}</td></tr>
      </table>
    </td>
    <td valign="top" style="padding:0 0 14px 0;">
      <strong class="em-step-title em-text-main" style="display:block;font-family:${FONT};font-size:13.5px;font-weight:600;color:${C.navy};line-height:1.4;margin:0 0 2px;">${s.title}</strong>
      <span class="em-step-body em-text-muted" style="display:block;font-family:${FONT};font-size:13px;color:${C.textMuted};line-height:1.5;">${s.body}</span>
    </td>
  </tr>`).join('');
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    </td>
  </tr>`;
}

function ctaButton({ label, url, ghost = false }) {
  if (ghost) {
    return `<tr>
      <td class="em-cta em-cta-ghost em-pad em-bg-white" bgcolor="${C.white}" align="center" style="padding:0 36px 4px;background-color:${C.white};">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td align="center" bgcolor="${C.white}" style="border:1.5px solid ${C.navy};border-radius:8px;background:${C.white};background-color:${C.white};">
              <a class="em-text-main" href="${url}" style="display:inline-block;padding:9.5px 26.5px;font-family:${FONT};font-size:13.5px;font-weight:600;color:${C.navy};text-decoration:none;">${label}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }
  return `<tr>
    <td class="em-cta em-pad em-bg-white" bgcolor="${C.white}" align="center" style="padding:0 36px 4px;background-color:${C.white};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
        <tr>
          <td align="center" bgcolor="${C.blue}" style="border-radius:8px;background:${C.blue};background-color:${C.blue};">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" stroke="f" fillcolor="${C.blue}">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:14px;font-weight:600;">${label.replace(/<[^>]+>/g, '')}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${url}" style="display:inline-block;padding:13px 32px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.white};text-decoration:none;letter-spacing:-0.2px;border-radius:8px;mso-padding-alt:0;">${label}</a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function ps(text) {
  return `<tr>
    <td class="em-pad em-bg-white em-text-muted" bgcolor="${C.white}" style="padding:16px 36px;background-color:${C.white};font-family:${FONT};font-size:13px;color:${C.textMuted};line-height:1.65;font-style:italic;">${text}</td>
  </tr>`;
}

function highlight({ body }) {
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="${C.bluePale}" class="em-bg-blue-pale em-text-body" style="background:${C.bluePale};background-color:${C.bluePale};border-left:3px solid ${C.blue};border-radius:0 8px 8px 0;padding:15px 18px;font-family:${FONT};font-size:13.5px;color:#1A3050;line-height:1.65;">${body}</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function tip({ label, body }) {
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="${C.surface}" class="em-bg-surface em-text-muted" style="background:${C.surface};background-color:${C.surface};border-radius:10px;padding:16px 18px;font-family:${FONT};font-size:13.5px;color:${C.textMuted};line-height:1.65;border:1px solid ${C.border};">
            ${label ? `<div class="em-text-blue" style="font-family:${FONT};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.blue};margin-bottom:7px;">${label}</div>` : ''}
            ${body}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function urgency({ title, sub }) {
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="${C.navy}" class="em-bg-navy em-text-white" align="center" style="background:${C.navy};background-color:${C.navy};border-radius:10px;padding:18px 22px;text-align:center;">
            <strong class="em-urgency-title" style="display:block;font-family:${FONT};font-size:20px;font-weight:800;color:${C.white};letter-spacing:-0.5px;line-height:1.2;">${title}</strong>
            <span style="display:block;font-family:${FONT};font-size:13px;color:#8A9CB8;margin-top:5px;line-height:1.4;">${sub}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function testimonial({ quote, initials, name, role }) {
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.white}" style="background:${C.white};background-color:${C.white};border:1px solid ${C.border};border-radius:10px;">
        <tr>
          <td bgcolor="${C.white}" style="padding:20px 22px;background-color:${C.white};">
            <blockquote class="em-quote em-text-body" style="margin:0 0 14px;padding:0;font-family:${FONT};font-size:14.5px;font-style:italic;color:#2A3545;line-height:1.7;">${quote}</blockquote>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td valign="middle" width="34" height="34" bgcolor="${C.blue}" style="background:${C.blue};background-color:${C.blue};border-radius:17px;width:34px;height:34px;">
                  <div style="font-family:'Inter',Arial,sans-serif;font-size:12px;font-weight:700;color:${C.white};line-height:34px;text-align:center;">${initials}</div>
                </td>
                <td valign="middle" style="padding:0 0 0 10px;">
                  <strong class="em-text-main" style="display:block;font-family:${FONT};font-size:13px;font-weight:600;color:${C.navy};line-height:1.3;">${name}</strong>
                  <span class="em-text-muted" style="display:block;font-family:${FONT};font-size:12px;color:${C.textMuted};line-height:1.3;">${role}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

function features(items) {
  // 2 columns x 2 rows = 4 features. Stacks to 1 column on mobile via .em-feature-cell { display:block }.
  const cell = (f) => `<td class="em-feature-cell" valign="top" width="50%" style="padding:5px;width:50%;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FAFBFD" style="background:#FAFBFD;background-color:#FAFBFD;border:1px solid ${C.border};border-radius:8px;">
      <tr><td bgcolor="#FAFBFD" style="padding:14px 15px;background-color:#FAFBFD;">
        <div style="font-size:18px;line-height:1;margin-bottom:7px;">${f.icon}</div>
        <strong class="em-text-main" style="display:block;font-family:${FONT};font-size:13px;font-weight:600;color:${C.navy};margin-bottom:3px;line-height:1.4;">${f.title}</strong>
        <span class="em-text-muted" style="display:block;font-family:${FONT};font-size:12px;color:${C.textMuted};line-height:1.5;">${f.body}</span>
      </td></tr>
    </table>
  </td>`;
  const rows = [];
  for (let i = 0; i < items.length; i += 2) {
    rows.push(`<tr class="em-feature-row">${cell(items[i])}${items[i + 1] ? cell(items[i + 1]) : '<td></td>'}</tr>`);
  }
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 31px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>
    </td>
  </tr>`;
}

function pills(items) {
  const tds = items.map((p) =>
    `<td class="em-pill-cell" align="center" style="padding:0 4px 8px 4px;font-family:${FONT};font-size:12px;font-weight:500;color:${C.textBlue};line-height:1;">
      <span class="em-text-blue" style="display:inline-block;background:${C.bluePale};background-color:${C.bluePale};color:${C.textBlue};padding:5px 12px;border-radius:20px;border:1px solid ${C.blueBorder};white-space:nowrap;">${p}</span>
    </td>`,
  ).join('');
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" align="center" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr>${tds}</tr></table>
    </td>
  </tr>`;
}

function nlSection(title) {
  return `<tr>
    <td class="em-pad em-bg-white em-text-blue" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};font-family:${FONT};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${C.blue};margin-bottom:10px;line-height:1;">${title}</td>
  </tr>
  <tr><td style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>`;
}

function nlFeatures(items) {
  const rows = items.map((it, i) => {
    const isLast = i === items.length - 1;
    return `<tr>
      <td valign="top" width="48" style="padding:0 12px 0 0;width:48px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="36" height="36" bgcolor="${C.bluePale}" style="background:${C.bluePale};background-color:${C.bluePale};border-radius:8px;border:1px solid ${C.blueBorder};width:36px;height:36px;">
          <tr><td align="center" valign="middle" width="36" height="36" style="font-size:16px;line-height:36px;">${it.icon}</td></tr>
        </table>
      </td>
      <td valign="top" style="padding:0 0 12px 0;${isLast ? '' : `border-bottom:1px solid ${C.border};`}">
        <strong class="em-nl-title em-text-main" style="display:block;font-family:${FONT};font-size:13.5px;font-weight:600;color:${C.navy};margin:0 0 2px;line-height:1.4;">${it.title}</strong>
        <span class="em-nl-body em-text-muted" style="display:block;font-family:${FONT};font-size:13px;color:${C.textMuted};line-height:1.5;">${it.body}</span>
      </td>
    </tr>
    ${isLast ? '' : '<tr><td colspan="2" style="height:12px;line-height:12px;font-size:0;">&nbsp;</td></tr>'}`;
  }).join('');
  return `<tr>
    <td class="em-pad em-bg-white" bgcolor="${C.white}" style="padding:0 36px;background-color:${C.white};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    </td>
  </tr>`;
}

function footer(lines, options = {}) {
  const ps = lines.map((line) =>
    `<p class="em-text-footer" style="margin:0 0 5px;padding:0;font-family:${FONT};font-size:11.5px;color:#A0AABB;line-height:1.65;">${line}</p>`,
  ).join('');
  return `<tr>
    <td class="em-pad em-bg-surface" align="center" bgcolor="${C.surface}" style="padding:22px 36px;background:${C.surface};background-color:${C.surface};border-top:1px solid ${C.border};text-align:center;">
      ${ps}
    </td>
  </tr>`;
}

// Hosted PNG illustration. `name` matches the file in
// Frontend/presto-decks/public/email-assets/{name}-illustration.png.
// `inset` true = card with side margins (548px), false = edge-to-edge banner (620px).
// `alt` = required for accessibility + image-blocked clients.
//
// Outset (banner) cells skip the .em-pad class so the image goes truly
// edge-to-edge on mobile. .em-pad would otherwise inject 20px padding on
// small screens and the image would no longer touch the email's edges.
function illustration({ name, inset = true, alt = 'Illustration' }) {
  const widthAttr = inset ? 548 : 620;
  const cellClasses = inset ? 'em-pad em-bg-white' : 'em-bg-white';
  const cellPadding = inset ? '8px 36px' : '0';
  const url = `https://www.slideai.fr/email-assets/${name}-illustration.png`;
  return `<tr>
    <td class="${cellClasses}" bgcolor="${C.white}" style="padding:${cellPadding};background-color:${C.white};font-size:0;line-height:0;">
      <img src="${url}" width="${widthAttr}" alt="${alt}" style="display:block;width:100%;max-width:${widthAttr}px;height:auto;border:0;outline:none;text-decoration:none;${inset ? 'border-radius:10px;' : ''}">
    </td>
  </tr>`;
}

// ──────────────────────────────────────────────────────────────────
// Top-level wrapper
// ──────────────────────────────────────────────────────────────────
function buildHtml({ title, preview, badge, hero: heroData, body, footer: footerData }) {
  const blocks = body.map((b) => {
    switch (b.type) {
      case 'spacer': return spacer(b.size || 24);
      case 'content': return content(b.paragraphs);
      case 'steps': return steps(b.items);
      case 'cta': return ctaButton({ label: b.label, url: b.url });
      case 'cta-ghost': return ctaButton({ label: b.label, url: b.url, ghost: true });
      case 'ps': return ps(b.text);
      case 'highlight': return highlight({ body: b.body });
      case 'tip': return tip({ label: b.label, body: b.body });
      case 'urgency': return urgency({ title: b.title, sub: b.sub });
      case 'testimonial': return testimonial(b);
      case 'features': return features(b.items);
      case 'pills': return pills(b.items);
      case 'divider': return dividerBlock();
      case 'nl-section': return nlSection(b.title);
      case 'nl-features': return nlFeatures(b.items);
      case 'illustration': return illustration(b);
      default: throw new Error(`Unknown block type: ${b.type}`);
    }
  }).join('\n');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="fr">
<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="only light">
<meta name="supported-color-schemes" content="only light">
<title>${title}</title>
<style>
  :root { color-scheme: only light; supported-color-schemes: only light; }
  body,table,td,a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table,td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
  table { border-collapse:collapse !important; }
  body { margin:0 !important; padding:0 !important; width:100% !important; height:100% !important; background:${C.bgApp}; }
  a { color:${C.blue}; }
  /* Mobile-first responsive — phones get the priority since that's where most opens happen */
  @media only screen and (max-width:620px) {
    .em-shell { width:100% !important; max-width:100% !important; }
    .em-pad { padding-left:20px !important; padding-right:20px !important; }
    .em-hero-pad { padding:30px 20px 26px !important; }
    .em-hero-h1 { font-size:23px !important; line-height:1.22 !important; letter-spacing:-0.5px !important; }
    .em-hero-sub { font-size:15px !important; line-height:1.55 !important; }
    .em-cta a { display:block !important; padding:15px 18px !important; font-size:15px !important; }
    .em-cta-ghost a { display:block !important; padding:13px 18px !important; }
    /* Body paragraphs slightly larger on mobile for readability */
    .em-text-body, .em-text-body * { font-size:15px !important; line-height:1.7 !important; }
    /* Steps: keep the number column tight and the title/body readable */
    .em-step-num-cell { width:38px !important; padding-right:12px !important; }
    .em-step-title { font-size:14.5px !important; line-height:1.4 !important; }
    .em-step-body { font-size:14px !important; line-height:1.55 !important; }
    /* Features 2x2 grid collapses to 1-column stack on mobile */
    .em-feature-row { display:block !important; width:100% !important; }
    .em-feature-cell { display:block !important; width:100% !important; padding:0 0 10px 0 !important; box-sizing:border-box !important; }
    /* Testimonial keeps the avatar+name tight, slightly larger quote */
    .em-quote { font-size:15px !important; line-height:1.7 !important; }
    /* Newsletter feature blocks: icon + text */
    .em-nl-title { font-size:14.5px !important; }
    .em-nl-body { font-size:14px !important; }
    /* Footer text size: keep small but legible */
    .em-text-footer, .em-text-footer * { font-size:12px !important; line-height:1.6 !important; }
    /* Pills wrap naturally on mobile */
    .em-pill-cell { display:inline-block !important; }
    /* Header badge small on tiny screens to stay on the same row as the logo */
    .em-badge { font-size:9.5px !important; padding:4px 9px !important; }
    /* Urgency block big number scales down */
    .em-urgency-title { font-size:18px !important; }
  }
  /* Extra-small phones (≤ 375px) */
  @media only screen and (max-width:380px) {
    .em-pad { padding-left:16px !important; padding-right:16px !important; }
    .em-hero-pad { padding:26px 16px 22px !important; }
    .em-hero-h1 { font-size:21px !important; }
  }
  /* Lock design colors when client (Apple Mail / iOS Gmail / native Outlook) auto-applies dark mode.
     Without this, Gmail mobile inverts dark text to white but keeps the light hero background,
     producing white-on-white text. */
  @media (prefers-color-scheme: dark) {
    body, .em-shell { background:${C.bgApp} !important; background-color:${C.bgApp} !important; }
    .em-shell { background:${C.white} !important; background-color:${C.white} !important; }
    .em-bg-white { background:${C.white} !important; background-color:${C.white} !important; }
    .em-bg-blue-pale { background:${C.bluePale} !important; background-color:${C.bluePale} !important; }
    .em-bg-surface { background:${C.surface} !important; background-color:${C.surface} !important; }
    .em-bg-navy { background:${C.navy} !important; background-color:${C.navy} !important; }
    .em-text-main, .em-text-main * { color:${C.navy} !important; }
    .em-text-muted, .em-text-muted * { color:${C.textMuted} !important; }
    .em-text-body, .em-text-body * { color:#2A3545 !important; }
    .em-text-blue, .em-text-blue * { color:${C.blue} !important; }
    .em-text-white, .em-text-white * { color:${C.white} !important; }
    .em-text-footer, .em-text-footer * { color:#A0AABB !important; }
    .em-badge { color:${C.textMuted} !important; background:${C.bluePale} !important; background-color:${C.bluePale} !important; }
  }
  /* Outlook.com / Outlook 365 webmail dark mode (uses [data-ogsc] selector prefix) */
  [data-ogsc] .em-bg-white { background:${C.white} !important; background-color:${C.white} !important; }
  [data-ogsc] .em-bg-blue-pale { background:${C.bluePale} !important; background-color:${C.bluePale} !important; }
  [data-ogsc] .em-bg-surface { background:${C.surface} !important; background-color:${C.surface} !important; }
  [data-ogsc] .em-text-main, [data-ogsc] .em-text-main * { color:${C.navy} !important; }
  [data-ogsc] .em-text-muted, [data-ogsc] .em-text-muted * { color:${C.textMuted} !important; }
  [data-ogsc] .em-text-body, [data-ogsc] .em-text-body * { color:#2A3545 !important; }
</style>
</head>
<body bgcolor="${C.bgApp}" style="margin:0;padding:0;background:${C.bgApp};background-color:${C.bgApp};font-family:${FONT};color:${C.navy};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bgApp}" style="background:${C.bgApp};background-color:${C.bgApp};">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" class="em-shell em-bg-white" width="620" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.white}" style="width:620px;max-width:620px;background:${C.white};background-color:${C.white};">
${header(badge)}
${hero(heroData)}
${blocks}
${footer(footerData.lines)}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────────
// Templates
// ──────────────────────────────────────────────────────────────────

const templates = {
  '00-confirmation': {
    title: `Confirmez votre adresse`,
    preview: `Une dernière étape avant de tester SlideAI.`,
    badge: 'Vérification',
    hero: {
      title: `Une dernière<br>étape.`,
      subtitle: `Confirmez votre adresse pour démarrer votre essai. 7 jours, sans carte bancaire.`,
    },
    body: [
      { type: 'spacer', size: 16 },
      { type: 'illustration', name: '00-confirmation', inset: true, alt: 'Confirmation email avec une coche bleue' },
      { type: 'spacer', size: 16 },
      { type: 'cta', label: 'Confirmer mon adresse', url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Si vous n'avez pas créé de compte, ignorez cet email. Le lien expire dans 24 heures.`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'divider' },
      { type: 'spacer', size: 16 },
      { type: 'pills', items: ['Sans carte bancaire', 'Export PowerPoint', '7 jours gratuits'] },
      { type: 'spacer', size: 24 },
    ],
    footer: { lines: [
      'SlideAI · <a href="https://www.slideai.fr" style="color:#2BB5FF;text-decoration:none;">slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a> · <a href="{{PRIVACY_URL}}" style="color:#2BB5FF;text-decoration:none;">Politique de confidentialité</a>',
    ]},
  },

  '01-bienvenue': {
    title: `Bonjour, c'est Noé`,
    preview: `Pas un email automatique. C'est le fondateur qui vous écrit.`,
    badge: 'Bienvenue',
    hero: {
      title: `Quelques mots<br>avant que vous <span style="color:#2BB5FF;font-weight:800;">testiez.</span>`,
      subtitle: `C'est Noé, fondateur de SlideAI. Pas un email automatique.`,
    },
    body: [
      { type: 'illustration', name: '01-bienvenue', inset: false, alt: 'Trois étapes pour créer un deck : déposez votre source, choisissez le style, exportez en .pptx' },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Bonjour,`,
        `Je suis seul aux commandes pour l'instant. Je code, je gère le support, je lis chaque réponse à ce mail. Avant votre premier deck, deux choses :`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'highlight', body: `<strong style="color:#2BB5FF;">1. L'outil n'est pas encore parfait.</strong> Si quelque chose vous bloque, répondez à ce mail. Je vous lis dans la journée.` },
      { type: 'spacer', size: 14 },
      { type: 'highlight', body: `<strong style="color:#2BB5FF;">2. Testez sur un vrai livrable.</strong> Un brief client, un audit, une reco. Pas un test "pour voir". C'est là que SlideAI gagne sa place dans votre workflow, ou pas.` },
      { type: 'spacer', size: 24 },
      { type: 'cta', label: 'Créer mon premier deck', url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: `PS : si vous bloquez, répondez. Pas de bot, c'est moi. Noé.` },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a> · <a href="{{PRIVACY_URL}}" style="color:#2BB5FF;text-decoration:none;">Politique de confidentialité</a>',
    ]},
  },

  '02-activation': {
    title: `Je vois que vous n'avez pas encore lancé`,
    preview: `C'est normal. La plupart attendent le « bon » document. Ne faites pas ça.`,
    badge: null,
    hero: {
      title: `Vous n'avez pas encore<br>lancé votre <span style="color:#2BB5FF;font-weight:800;">premier deck.</span>`,
      subtitle: `C'est normal. La plupart attendent le « bon » document. Ne faites pas ça.`,
    },
    body: [
      { type: 'spacer', size: 16 },
      { type: 'illustration', name: '02-activation', inset: true, alt: `Compteur d'essai : 6 jours restants sur 7` },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        'Bonjour,',
        `Vous avez créé votre compte hier, vous n'avez pas généré de deck. Je vois ça souvent.`,
        `Le piège classique : attendre d'avoir le brief parfait, le PDF complet, le doc bien propre. Pendant ce temps, vous ne testez pas.`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'highlight', body: `<strong style="color:#2BB5FF;">Un email de réunion suffit.</strong> Un compte-rendu griffonné aussi. SlideAI fait la base, vous ajustez ensuite. C'est plus rapide que ce que vous imaginez.` },
      { type: 'spacer', size: 24 },
      { type: 'cta', label: `Tester sur ce que j'ai sous la main`, url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: `PS : 6 jours restants sur l'essai. Pas de carte demandée. Noé.` },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a>',
    ]},
  },

  '03-pedagogique': {
    title: `J'ai remarqué un pattern`,
    preview: `Ce que font ceux qui vont le plus vite avec SlideAI.`,
    badge: null,
    hero: {
      title: `J'ai remarqué<br>un <span style="color:#2BB5FF;font-weight:800;">pattern.</span>`,
      subtitle: `Ceux qui gagnent le plus de temps font tous la même chose.`,
    },
    body: [
      { type: 'spacer', size: 16 },
      { type: 'illustration', name: '03-pedagogique', inset: true, alt: `Brief PDF transformé en deck de 15 slides par l'IA` },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        'Bonjour,',
        `En regardant comment les premiers utilisateurs s'en servent, j'ai vu un truc : ceux qui sont les plus rapides ne partent jamais d'une page blanche.`,
        `Ils alimentent l'IA avec un contexte riche dès le départ.`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'tip', label: 'Ce qui fonctionne', body:
        `<strong style="color:${C.navy};">1. Brief détaillé.</strong> Plus vous donnez de contexte, plus le deck est juste.<br><br>
         <strong style="color:${C.navy};">2. PDF enrichi.</strong> Uploadez un rapport, SlideAI extrait les KPIs.<br><br>
         <strong style="color:${C.navy};">3. Itération rapide.</strong> Exportez, retouchez 10 %, livrez. Ne cherchez pas la perfection en amont.`,
      },
      { type: 'spacer', size: 24 },
      { type: 'cta', label: 'Appliquer ce workflow', url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: `PS : 4 jours restants sur l'essai. Noé.` },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a>',
    ]},
  },

  '04-social-proof': {
    title: `Deux retours que j'ai eus cette semaine`,
    preview: `Comment Marie et Thomas s'en servent vraiment. Sans filtre.`,
    badge: null,
    hero: {
      title: `Deux retours<br>que j'ai eus<br><span style="color:#2BB5FF;font-weight:800;">cette semaine.</span>`,
      subtitle: `Ce qu'ils m'ont dit, sans filtre.`,
    },
    body: [
      { type: 'illustration', name: '04-social-proof', inset: false, alt: '5 étoiles, 170+ professionnels font confiance à SlideAI' },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Bonjour,`,
        `Voilà deux échanges récents avec des utilisateurs. Je vous les partage tels qu'ils m'ont parlé.`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'testimonial', initials: 'ML', name: 'Marie L.', role: 'Consultante stratégie indépendante',
        quote: `"Honnêtement j'étais sceptique. J'ai eu un audit comm en retard, je l'ai utilisé un soir tard. Premier rendu à 70 %. J'ai retouché plusieurs slides, mais 70 % partis de rien c'est ce qui m'a fait gagner ma soirée."` },
      { type: 'spacer', size: 16 },
      { type: 'testimonial', initials: 'TK', name: 'Thomas K.', role: 'Responsable commercial, agence digitale',
        quote: `"On préparait nos pitchs sur des templates internes. Maintenant on génère, on adapte 20 %, on envoie. Sur les RFP du trimestre, on a divisé le temps par 3 ou 4."` },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Il vous reste <strong>2 jours</strong> d'essai. Si SlideAI peut faire ça pour vous aussi, c'est le bon moment.`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'cta', label: 'Créer mon deck', url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: 'PS : Noé.' },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a>',
    ]},
  },

  '05-relance': {
    title: `24 heures.`,
    preview: `Avant que votre essai expire, voici l'offre. Sans baratin.`,
    badge: null,
    hero: {
      title: `<span style="color:#2BB5FF;font-weight:800;">24 heures</span><br>avant la fin.`,
      subtitle: `Demain votre essai s'arrête. Voici l'offre, sans baratin.`,
    },
    body: [
      { type: 'spacer', size: 16 },
      { type: 'illustration', name: '05-relance', inset: true, alt: `Décompte du trial qui expire : 24:00:00` },
      { type: 'spacer', size: 24 },
      { type: 'urgency', title: '⏱ 24h restantes', sub: `Votre essai expire demain à 23h59.` },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Bonjour,`,
        `Si SlideAI vous a aidé pendant l'essai, voilà ce qu'on propose en ce moment :`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'highlight', body: `<strong style="color:#2BB5FF;">Pro à 2,99 €/mois pendant 3 mois.</strong> Puis 19,90 €/mois. Annulable à tout moment, sans frais.` },
      { type: 'spacer', size: 24 },
      { type: 'cta', label: 'Continuer avec SlideAI', url: '{{PRICING_URL}}' },
      { type: 'spacer', size: 14 },
      { type: 'cta-ghost', label: 'Voir tous les plans', url: '{{PRICING_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: `PS : si vous hésitez, répondez. Je vous explique sans pression. Noé.` },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a>',
    ]},
  },

  '06-conversion': {
    title: `Votre essai vient de se terminer`,
    preview: `Pas de pression. Voici vos options, en clair.`,
    badge: null,
    hero: {
      title: `Votre essai vient<br>de <span style="color:#2BB5FF;font-weight:800;">se terminer.</span>`,
      subtitle: `Pas de pression. Voici vos options, en clair.`,
    },
    body: [
      { type: 'illustration', name: '06-conversion', inset: false, alt: 'Sans SlideAI 3-4 heures, avec SlideAI 15 minutes' },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Bonjour,`,
        `Vous venez de terminer 7 jours d'essai. Je préfère être direct : la plupart des gens ne convertissent pas, et c'est OK.`,
        `Mais si SlideAI vous a fait gagner du temps cette semaine, voici ce qu'on propose :`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'highlight', body: `<strong style="color:#2BB5FF;">Offre de lancement Pro : 2,99 €/mois pendant 3 mois,</strong> puis 19,90 €/mois. Annulable à tout moment.` },
      { type: 'spacer', size: 24 },
      { type: 'features', items: [
        { icon: '📄', title: 'PDF vers PowerPoint', body: `Brief, audit ou doc en deck éditable.` },
        { icon: '✏️', title: 'Export éditable', body: 'Un .pptx ajustable avant chaque livraison.' },
        { icon: '⚡', title: 'Génération rapide', body: 'Un deck pro en quelques minutes.' },
        { icon: '🎨', title: 'Sans piège', body: `Annulable en un clic, sans frais.` },
      ] },
      { type: 'spacer', size: 24 },
      { type: 'cta', label: `Profiter de l'offre`, url: '{{PRICING_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: `PS : pas convaincu ? Répondez à ce mail, dites-moi pourquoi. Ça m'aide vraiment. Noé.` },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{PRICING_URL}}" style="color:#2BB5FF;text-decoration:none;">Voir les tarifs</a> · <a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a>',
    ]},
  },

  '07-reactivation': {
    title: `Je ne vais pas vous spammer`,
    preview: `Mais voici ce qui a changé depuis votre dernier passage.`,
    badge: null,
    hero: {
      title: `Je ne vais pas<br><span style="color:#2BB5FF;font-weight:800;">vous spammer.</span>`,
      subtitle: `Mais voici ce qui a changé depuis votre dernier passage.`,
    },
    body: [
      { type: 'spacer', size: 16 },
      { type: 'illustration', name: '07-reactivation', inset: true, alt: `Trois nouveautés produit avec un badge NEW` },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Bonjour,`,
        `Ça fait un mois que vous n'êtes pas revenu. Soit l'outil n'était pas adapté à ce moment-là, soit il vous a juste glissé entre les doigts. Voici les évolutions concrètes depuis :`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'steps', items: [
        { num: '↑', title: 'Génération plus précise', body: 'Decks mieux structurés, moins de retouches nécessaires.' },
        { num: '↑', title: 'Nouveaux templates', body: 'Consulting, sales, startups.' },
        { num: '↑', title: 'Extraction enrichie', body: 'SlideAI extrait tableaux et KPIs depuis vos PDFs.' },
      ]},
      { type: 'spacer', size: 24 },
      { type: 'cta', label: `Voir où on en est`, url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'content', paragraphs: [
        `Si SlideAI ne vous va pas, dites-le-moi en répondant à ce mail. C'est utile pour comprendre. Et c'est le dernier mail de relance que je vous envoie.`,
      ] },
      { type: 'spacer', size: 24 },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner définitivement</a>',
    ]},
  },

  '08-newsletter': {
    title: `Ce que j'ai shippé en avril`,
    preview: `Notes de fondateur. Court.`,
    badge: null,
    hero: {
      title: `Ce que j'ai<br>shippé en <span style="color:#2BB5FF;font-weight:800;">avril.</span>`,
      subtitle: `Notes de fondateur. Court.`,
    },
    body: [
      { type: 'illustration', name: '08-newsletter', inset: false, alt: `Calendrier d'avril 2026 et 3 articles publiés` },
      { type: 'spacer', size: 24 },
      { type: 'nl-section', title: 'Ce qui a changé' },
      { type: 'nl-features', items: [
        { icon: '📊', title: 'Extraction de données', body: 'Tableaux et graphiques reconnus dans vos PDFs et restitués dans les slides.' },
        { icon: '🎨', title: '5 nouveaux templates', body: 'Consulting, pitch, bilan, revue commerciale, onboarding.' },
        { icon: '⚡', title: 'Génération 40 % plus rapide', body: '15 slides en moins de 45 secondes.' },
      ] },
      { type: 'spacer', size: 20 },
      { type: 'divider' },
      { type: 'spacer', size: 20 },
      { type: 'nl-section', title: `Le truc que j'ai appris` },
      { type: 'tip', label: 'Insight', body:
        `<strong style="color:${C.navy};">Personne ne livre un deck IA tel quel. C'est normal.</strong><br><br>
         Les meilleurs sont retouchés 10 à 20 % après génération. L'IA fait la structure ; vous apportez la nuance et la relation client.` },
      { type: 'spacer', size: 20 },
      { type: 'divider' },
      { type: 'spacer', size: 20 },
      { type: 'nl-section', title: `Ce qui arrive en mai` },
      { type: 'content', paragraphs: [
        `<strong>Mode collaboration :</strong> partager un deck en cours avec un collègue pour validation directe.`,
        `<strong>Connecteur Notion :</strong> pour ceux qui documentent dans Notion.`,
      ] },
      { type: 'spacer', size: 16 },
      { type: 'cta', label: `Tester ce qui est sorti`, url: '{{CTA_URL}}' },
      { type: 'spacer', size: 24 },
      { type: 'ps', text: `Une idée pour SlideAI ? Répondez. Noé.` },
    ],
    footer: { lines: [
      'Noé · Fondateur SlideAI · <a href="mailto:noe@slideai.fr" style="color:#2BB5FF;text-decoration:none;">noe@slideai.fr</a> · <a href="https://www.slideai.fr" style="color:#2BB5FF;text-decoration:none;">slideai.fr</a>',
      '<a href="{{UNSUBSCRIBE_URL}}" style="color:#2BB5FF;text-decoration:none;">Se désabonner</a> · <a href="{{PREFS_URL}}" style="color:#2BB5FF;text-decoration:none;">Préférences</a> · <a href="{{PRIVACY_URL}}" style="color:#2BB5FF;text-decoration:none;">Confidentialité</a>',
    ]},
  },
};

for (const [name, def] of Object.entries(templates)) {
  const html = buildHtml(def);
  const out = resolve(outDir, `${name}.html`);
  writeFileSync(out, html, 'utf8');
  console.log(`✓ ${name}.html (${html.length} chars)`);
}

console.log(`\nDone. ${Object.keys(templates).length} templates written to ${outDir}`);
