const DAY_MS = 24 * 60 * 60 * 1000;

const BRAND = {
  primary: '#1fb6ff',
  primaryDark: '#0ea5e9',
  text: '#0f172a',
  textMuted: '#475569',
  border: '#dbeafe',
  surface: '#ffffff',
  background: '#f4fbff',
  softBlue: '#eef8ff',
  softBlueDark: '#d8f1ff',
  softWarning: '#fff7ed',
  warningBorder: '#fdba74',
  softSuccess: '#ecfdf5',
  successBorder: '#86efac',
};

type Tone = 'info' | 'warning' | 'success';

type Stat = {
  value: string;
  label: string;
};

type Spotlight = {
  tone: Tone;
  title: string;
  body: string;
};

export type EmailContent = {
  subject: string;
  preview: string;
  badge: string;
  title: string;
  intro: string;
  body: string[];
  stats?: Stat[];
  bullets?: string[];
  spotlight?: Spotlight;
  ctaLabel: string;
  ctaUrl: string;
  note?: string;
  unsubscribeUrl?: string;
  footerReason?: string;
  layout?: 'default' | 'welcome';
};

export type EmailContentPatch = Partial<EmailContent> & {
  body?: string[];
  bullets?: string[];
  stats?: Stat[];
  spotlight?: Spotlight | null;
};

export type WinbackOffer = {
  code: string;
  expiresAt: string;
  percentOff: number;
  expiresInHours: number;
};

function getSpotlightColors(tone: Tone) {
  if (tone === 'warning') {
    return {
      background: BRAND.softWarning,
      border: BRAND.warningBorder,
      title: '#9a3412',
    };
  }

  if (tone === 'success') {
    return {
      background: BRAND.softSuccess,
      border: BRAND.successBorder,
      title: '#166534',
    };
  }

  return {
    background: BRAND.softBlue,
    border: BRAND.softBlueDark,
    title: BRAND.primaryDark,
  };
}

function renderStats(stats?: Stat[]) {
  if (!stats?.length) {
    return '';
  }

  const renderStatCard = (stat: Stat, width: string, padding: string) => `
    <td class="stat-col" valign="top" align="center" style="width: ${width}; ${padding}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; background: ${BRAND.softBlue}; border: 1px solid ${BRAND.border}; border-radius: 16px; table-layout: fixed;">
        <tr>
          <td class="stat-card" height="96" valign="middle" align="center" style="height: 96px; padding: 14px 12px; text-align: center !important;">
            <div style="font-size: 20px; line-height: 24px; font-weight: 800; color: ${BRAND.text}; text-align: center !important;">${stat.value}</div>
            <div style="margin-top: 8px; font-size: 12px; line-height: 17px; color: ${BRAND.textMuted}; text-align: center !important;">${stat.label}</div>
          </td>
        </tr>
      </table>
    </td>`;

  return `
    <table class="stats-grid" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width: 100%; margin: 0 0 22px 0; table-layout: fixed;">
      <tr>
        ${stats
          .map((stat, index) => {
            const isLast = index === stats.length - 1;
            return renderStatCard(
              stat,
              `${Math.floor(100 / stats.length)}%`,
              `padding: 0 ${isLast ? 0 : 6}px 0 0;`,
            );
          })
          .join('')}
      </tr>
    </table>`;
}

function renderBullets(bullets?: string[]) {
  if (!bullets?.length) {
    return '';
  }

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 8px 0 0 0;">
      ${bullets
        .map(
          (bullet) => `
            <tr>
              <td style="padding: 0 0 12px 0; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
                <span style="display: inline-block; width: 22px; color: ${BRAND.primary}; font-weight: 800;">•</span>${bullet}
              </td>
            </tr>`,
        )
        .join('')}
    </table>`;
}

function renderSpotlight(spotlight?: Spotlight) {
  if (!spotlight) {
    return '';
  }

  const colors = getSpotlightColors(spotlight.tone);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 22px 0;">
      <tr>
        <td style="padding: 18px 18px 18px 18px; background: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 16px;">
          <div style="font-size: 13px; line-height: 18px; font-weight: 800; color: ${colors.title}; text-transform: uppercase; letter-spacing: 0.04em;">
            ${spotlight.title}
          </div>
          <div style="margin-top: 8px; font-size: 15px; line-height: 24px; color: ${BRAND.text};">
            ${spotlight.body}
          </div>
        </td>
      </tr>
    </table>`;
}

function wrapSignupWelcomeEmail(content: EmailContent) {
  const stepRows = (content.bullets ?? [])
    .map(
      (step, i) => `
    <tr>
      <td style="padding: 0 0 12px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.softBlue}; border: 1px solid ${BRAND.border}; border-radius: 14px; padding: 0;">
          <tr>
            <td style="padding: 16px 20px; vertical-align: top;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td valign="top" style="padding-right: 14px;">
                    <div style="width: 28px; height: 28px; border-radius: 50%; background: ${BRAND.primary}; color: #ffffff; font-size: 13px; font-weight: 800; text-align: center; line-height: 28px;">${i + 1}</div>
                  </td>
                  <td valign="top">
                    <div style="font-size: 15px; line-height: 22px; color: ${BRAND.text};">${step}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join('');

  const bodyParagraphs = content.body
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 27px; color: ${BRAND.textMuted};">${p}</p>`,
    )
    .join('');

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${content.subject}</title>
    <style>
      @media only screen and (max-width: 600px) {
        .email-shell { width: 100% !important; padding: 0 !important; }
        .email-body { padding: 24px 20px !important; }
        .cta-button { display: block !important; width: 100% !important; box-sizing: border-box !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: #f1f5f9; font-family: Inter, Arial, Helvetica, sans-serif; color: ${BRAND.text};">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${content.preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f1f5f9; padding: 32px 0;">
      <tr>
        <td align="center">
          <table class="email-shell" role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

            <!-- Logo header -->
            <tr>
              <td style="background: #ffffff; border-radius: 20px 20px 0 0; padding: 28px 32px; text-align: center; border-bottom: 1px solid ${BRAND.border};">
                <img
                  src="https://www.slideai.fr/logo.png"
                  alt="SlideAI"
                  width="100"
                  style="display: inline-block; border: 0; height: auto;"
                />
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="email-body" style="background: #ffffff; padding: 36px 40px 32px 40px;">
                <p style="margin: 0 0 20px 0; font-size: 17px; line-height: 28px; color: ${BRAND.text};">${content.intro}</p>
                ${bodyParagraphs}

                ${content.bullets?.length ? `
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 26px; font-weight: 700; color: ${BRAND.text};">Pour commencer :</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${stepRows}</table>` : ''}

                <!-- CTA -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 24px 0;">
                  <tr>
                    <td align="center" bgcolor="${BRAND.primary}" style="border-radius: 12px; box-shadow: 0 8px 20px rgba(31, 182, 255, 0.28);">
                      <a class="cta-button" href="${content.ctaUrl}" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 800; color: #ffffff; text-decoration: none;">${content.ctaLabel}</a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 0; font-size: 16px; line-height: 26px; color: ${BRAND.textMuted};">À bientôt,<br /><strong style="color: ${BRAND.text};">Noe</strong><br /><span style="font-size: 14px;">Fondateur, SlideAI</span></p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background: #f8fafc; border-radius: 0 0 20px 20px; padding: 20px 32px; text-align: center; font-size: 12px; line-height: 20px; color: ${BRAND.textMuted}; border-top: 1px solid ${BRAND.border};">
                ${content.footerReason || 'Vous recevez cet email car vous avez cr&eacute;&eacute; un compte SlideAI.'}<br />
                ${content.unsubscribeUrl ? `<a href="${content.unsubscribeUrl}" style="color: ${BRAND.primaryDark}; text-decoration: underline;">Se d&eacute;sabonner</a><br />` : ''}
                SlideAI, plus rapide du brief client au deck final.
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function wrapEmail(content: EmailContent) {
  const sections = content.body
    .map(
      (paragraph) => `
        <p style="margin: 0 0 14px 0; font-size: 16px; line-height: 27px; color: ${BRAND.textMuted};">
          ${paragraph}
        </p>`,
    )
    .join('');

  return `<!doctype html>
<html lang="fr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${content.subject}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell {
          width: 100% !important;
          padding: 0 10px !important;
        }

        .hero-card,
        .body-card {
          padding-left: 20px !important;
          padding-right: 20px !important;
        }

        .hero-title {
          font-size: 28px !important;
          line-height: 34px !important;
        }

        .hero-intro {
          font-size: 16px !important;
          line-height: 26px !important;
        }

        .stat-col {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          padding: 0 0 12px 0 !important;
        }

        .stat-card {
          height: auto !important;
          min-height: 96px !important;
          text-align: center !important;
        }

        .cta-wrap,
        .cta-wrap tbody,
        .cta-wrap tr,
        .cta-wrap td {
          display: block !important;
          width: 100% !important;
        }

        .cta-button {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background: ${BRAND.background}; font-family: Inter, Arial, Helvetica, sans-serif; color: ${BRAND.text};">
    <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
      ${content.preview}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${BRAND.background}; margin: 0; padding: 24px 0;">
      <tr>
        <td align="center">
          <table class="email-shell" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; padding: 0 16px;">
            <tr>
              <td style="padding: 0 0 16px 0; text-align: center;">
                <span style="display: inline-block; padding: 8px 14px; border-radius: 999px; background: ${BRAND.softBlue}; color: ${BRAND.primaryDark}; font-size: 13px; line-height: 18px; font-weight: 800; letter-spacing: 0.03em;">
                  ${content.badge}
                </span>
              </td>
            </tr>
            <tr>
              <td class="hero-card" style="background: linear-gradient(135deg, ${BRAND.primary} 0%, #66d9ff 100%); border-radius: 28px 28px 0 0; padding: 34px 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td valign="top">
                      <div style="display: inline-block; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.18); text-align: center; overflow: hidden;">
                        <img
                          src="https://www.slideai.fr/favicon.svg"
                          alt="SlideAI"
                          width="42"
                          height="42"
                          style="display: block; width: 42px; height: 42px; border: 0;"
                        />
                      </div>
                      <div style="margin-top: 14px; font-size: 13px; line-height: 18px; color: #e0f2fe; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;">
                        SlideAI
                      </div>
                      <h1 class="hero-title" style="margin: 12px 0 10px 0; font-size: 32px; line-height: 38px; font-weight: 800; color: #ffffff;">
                        ${content.title}
                      </h1>
                      <p class="hero-intro" style="margin: 0; font-size: 17px; line-height: 28px; color: #ecfeff;">
                        ${content.intro}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="body-card" style="background: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-top: 0; border-radius: 0 0 28px 28px; padding: 30px 32px 32px 32px;">
                <div style="margin: 0 0 22px 0; font-size: 13px; line-height: 20px; color: ${BRAND.textMuted};">
                  Pens&eacute; pour <strong>freelances</strong>, <strong>agences</strong> et <strong>&eacute;quipes sales</strong> qui veulent passer plus vite du brief client au livrable.
                </div>
                ${renderStats(content.stats)}
                ${renderSpotlight(content.spotlight)}
                ${sections}
                ${renderBullets(content.bullets)}
                <table class="cta-wrap" role="presentation" cellpadding="0" cellspacing="0" style="margin: 28px 0 18px 0;">
                  <tr>
                    <td align="center" bgcolor="${BRAND.primary}" style="border-radius: 14px; box-shadow: 0 10px 24px rgba(31, 182, 255, 0.28);">
                      <a class="cta-button" href="${content.ctaUrl}" style="display: inline-block; padding: 15px 24px; font-size: 16px; font-weight: 800; color: #ffffff; text-decoration: none;">
                        ${content.ctaLabel}
                      </a>
                    </td>
                  </tr>
                </table>
                ${content.note ? `<p style="margin: 0; font-size: 13px; line-height: 22px; color: ${BRAND.textMuted};">${content.note}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding: 18px 10px 0 10px; text-align: center; font-size: 12px; line-height: 20px; color: ${BRAND.textMuted};">
                ${content.footerReason || 'Vous recevez cet email car vous utilisez SlideAI.'}<br />
                ${content.unsubscribeUrl ? `<a href="${content.unsubscribeUrl}" style="color: ${BRAND.primaryDark}; text-decoration: underline;">Se desabonner des emails marketing</a><br />` : ''}
                SlideAI, plus rapide du brief client au deck final.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function formatPresentationCount(count: number) {
  return `${count} pr\u00e9sentation${count > 1 ? 's' : ''}`;
}

function applyEmailPatch(base: EmailContent, patch?: EmailContentPatch): EmailContent {
  if (!patch) {
    return base;
  }

  return {
    ...base,
    ...patch,
    body: patch.body ?? base.body,
    bullets: patch.bullets ?? base.bullets,
    stats: patch.stats ?? base.stats,
    spotlight: patch.spotlight === null ? undefined : patch.spotlight ?? base.spotlight,
  };
}

function buildWelcomeEmail(createUrl: string): EmailContent {
  return {
    subject: 'Votre essai Pro est lanc\u00e9 \ud83d\ude80',
    preview: 'Cr\u00e9ez votre premi\u00e8re pr\u00e9sentation en quelques minutes. Voici comment d\u00e9marrer.',
    badge: 'Essai Pro \u00b7 7 jours',
    title: 'C\u2019est parti ! Votre acc\u00e8s Pro est actif',
    intro: 'Votre essai de 7 jours vient de d\u00e9marrer. Voici quelques exemples de ce que vous pouvez faire d\u00e8s maintenant\u00a0:',
    stats: [
      { value: '7 jours', label: 'Acc\u00e8s Pro complet' },
      { value: 'PDF/PPTX', label: 'Exports inclus' },
      { value: '0\u20ac', label: 'Aucune carte demand\u00e9e' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83d\udca1 Le meilleur premier test',
      body: 'Importez un brief client, une note de r\u00e9union ou un document existant. SlideAI g\u00e9n\u00e8re une structure compl\u00e8te en quelques secondes \u2014 vous n\u2019avez plus qu\u2019\u00e0 peaufiner.',
    },
    body: [
      '\ud83d\udcc4 Un brief client \u2192 un deck de recommandations structur\u00e9',
      '\ud83d\udcca Des donn\u00e9es ou un reporting \u2192 une pr\u00e9sentation claire pour votre \u00e9quipe',
      '\ud83c\udfaf Des notes de r\u00e9union \u2192 un support de suivi ou un pitch commercial',
    ],
    bullets: [
      'Partez de vos documents existants, sans page blanche',
      'Obtenez une premi\u00e8re structure en quelques secondes',
      'Exportez en PDF ou PowerPoint d\u00e8s que le deck est pr\u00eat',
    ],
    ctaLabel: 'Cr\u00e9er ma premi\u00e8re pr\u00e9sentation',
    ctaUrl: createUrl,
    note: 'Aucune carte bancaire requise pendant l\u2019essai.',
  };
}

function buildInactiveDay1Email(createUrl: string): EmailContent {
  return {
    subject: 'Voici comment tirer le meilleur de SlideAI \ud83d\udc47',
    preview: 'Quelques cas concrets pour vous lancer rapidement avec SlideAI.',
    badge: 'Cas d\u2019usage \ud83d\udca1',
    title: 'D\u00e9marrez avec un vrai document',
    intro: 'Vous n\u2019avez pas encore cr\u00e9\u00e9 votre premi\u00e8re pr\u00e9sentation. Voici comment nos utilisateurs utilisent SlideAI au quotidien\u00a0:',
    stats: [
      { value: '< 5 min', label: 'Pour une premi\u00e8re structure compl\u00e8te' },
      { value: '100%', label: 'Contr\u00f4le sur le rendu final' },
      { value: '1 doc', label: 'Suffit pour commencer' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83d\udccc Exemple concret',
      body: 'Un consultant importe son brief de 10 pages \u2192 SlideAI g\u00e9n\u00e8re un plan de reco structur\u00e9 en 3 minutes \u2192 il ajuste 2-3 slides et livre au client.',
    },
    body: [
      '\ud83d\udcc4 Un brief client \u2192 un deck de recommandations',
      '\ud83d\udcca Des donn\u00e9es \u2192 une pr\u00e9sentation de reporting',
      '\ud83d\udcdd Des notes de r\u00e9union \u2192 un support de suivi ou un pitch',
    ],
    bullets: [
      'Importez n\u2019importe quel document existant',
      'Obtenez une structure claire en quelques secondes',
      'Ajustez et exportez en PDF ou PowerPoint',
    ],
    ctaLabel: 'Tester sur un document r\u00e9el',
    ctaUrl: createUrl,
    note: 'Pas besoin du cas parfait. Un brief ou une note de r\u00e9union suffit pour voir la valeur.',
  };
}

function buildSignupWelcomeEmail(createUrl: string, firstName?: string): EmailContent {
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,';
  return {
    layout: 'welcome',
    subject: 'Bienvenue sur SlideAI, cr\u00e9ez votre premi\u00e8re pr\u00e9sentation',
    preview: 'Je suis Noe, fondateur de SlideAI. Ravi de vous accueillir officiellement\u00a0!',
    badge: 'Bienvenue',
    title: 'Bienvenue sur SlideAI',
    intro: greeting,
    body: [
      'Je suis Noe, le fondateur de SlideAI, et je suis vraiment ravi de vous accueillir officiellement\u00a0!',
      'SlideAI aide les freelances, consultants, \u00e9quipes marketing et \u00e9quipes sales \u00e0 passer plus vite du brief client au deck final, en quelques minutes.',
      'Nous sommes impatients de vous aider \u00e0 cr\u00e9er des pr\u00e9sentations professionnelles. Voici comment d\u00e9marrer\u00a0:',
    ],
    bullets: [
      '<strong>Importez votre document</strong> : brief client, PDF, notes de r\u00e9union, ou partez d\u2019un prompt.',
      '<strong>SlideAI g\u00e9n\u00e8re votre structure</strong> : plan, titres et contenu organis\u00e9 en quelques secondes.',
      '<strong>Ajustez et exportez</strong> : modifiez ce que vous voulez, puis exportez en PDF ou PowerPoint.',
    ],
    ctaLabel: 'Cr\u00e9er ma premi\u00e8re pr\u00e9sentation',
    ctaUrl: createUrl,
    footerReason: 'Vous recevez cet email car vous venez de cr\u00e9er un compte SlideAI.',
  };
}

function buildSignupDay1NoPresentationEmail(createUrl: string): EmailContent {
  return {
    subject: 'Votre premi\u00e8re pr\u00e9sentation vous attend \ud83d\udc40',
    preview: 'Un brief, des notes, un doc existant \u2014 c\u2019est tout ce qu\u2019il vous faut pour d\u00e9marrer.',
    badge: 'Premier pas \ud83d\ude80',
    title: 'Pas besoin du projet parfait pour d\u00e9marrer',
    intro: 'La meilleure fa\u00e7on de d\u00e9couvrir SlideAI ? Tester sur un vrai document, m\u00eame simple. Voici quelques id\u00e9es\u00a0:',
    stats: [
      { value: '1 document', label: 'Suffit pour d\u00e9marrer' },
      { value: '< 5 min', label: 'Pour voir un premier r\u00e9sultat' },
      { value: 'Gratuit', label: 'Aucune carte bancaire' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83c\udfaf L\u2019astuce des utilisateurs avanc\u00e9s',
      body: 'Importez un document existant plut\u00f4t que de partir d\u2019un prompt. SlideAI structure mieux quand il a de la mati\u00e8re \u2014 et vous gagnez bien plus de temps.',
    },
    body: [
      '\ud83d\udcc4 Un brief client \u2192 un deck de recommandations structur\u00e9',
      '\ud83d\udcca Un reporting \u2192 une pr\u00e9sentation claire pour votre \u00e9quipe marketing ou sales',
      '\ud83d\udcdd Des notes \u2192 un support de r\u00e9union ou un pitch commercial',
    ],
    bullets: [
      'Importez un document ou partez d\u2019un prompt clair',
      'Laissez SlideAI g\u00e9n\u00e9rer une structure compl\u00e8te',
      'Ajustez et exportez en PDF ou PowerPoint',
    ],
    ctaLabel: 'Cr\u00e9er ma premi\u00e8re pr\u00e9sentation',
    ctaUrl: createUrl,
  };
}

function buildSignupDay3NoPresentationEmail(examplesUrl: string): EmailContent {
  return {
    subject: 'Voici comment des pros utilisent SlideAI \ud83d\udc47',
    preview: 'Consulting, marketing, sales, freelance \u2014 voici des cas concrets proches de votre usage.',
    badge: 'Inspirations \u2728',
    title: 'Comment d\u2019autres professionnels utilisent SlideAI',
    intro: 'Pas encore lanc\u00e9 votre premier deck\u00a0? Voici ce que font des utilisateurs comme vous\u00a0:',
    stats: [
      { value: 'Consulting', label: 'Reco, audit, reporting client' },
      { value: 'Marketing', label: 'Supports de campagne, bilans' },
      { value: 'Sales', label: 'Pitch, support de rendez-vous' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83d\udccc Exemple : \u00e9quipe marketing',
      body: 'Une responsable marketing importe son bilan mensuel \u2192 SlideAI cr\u00e9e une pr\u00e9sentation structur\u00e9e pour le CODIR \u2192 elle passe 30 min \u00e0 personnaliser au lieu de 3h \u00e0 cr\u00e9er de z\u00e9ro.',
    },
    body: [
      '\ud83d\udd0d Consultant : transformer un audit ou une reco en deck client en quelques minutes',
      '\ud83d\udce3 \u00c9quipe marketing : g\u00e9n\u00e9rer des bilans de campagne, rapports de performance ou supports CODIR',
      '\ud83d\udcbc Sales / freelance : cr\u00e9er un pitch ou un support de rendez-vous client rapidement',
    ],
    bullets: [
      'Voir un rendu proche de votre usage',
      'Identifier le bon premier test pour vous',
      'Se lancer en moins de 5 minutes',
    ],
    ctaLabel: 'Voir des exemples',
    ctaUrl: examplesUrl,
  };
}

function buildSignupDay5ActivatedEmail(createUrl: string, presentationCount: number): EmailContent {
  const usageLabel = formatPresentationCount(presentationCount);

  return {
    subject: `Bravo ! Vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel} avec SlideAI \ud83c\udf89`,
    preview: 'Vous avez d\u00e9j\u00e0 valid\u00e9 le plus important. Voici comment continuer sur cette lanc\u00e9e.',
    badge: 'Vous \u00eates lanc\u00e9 \u2705',
    title: `${usageLabel} cr\u00e9\u00e9es \u2014 vous avez pass\u00e9 le cap !`,
    intro: `Vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel} avec SlideAI. C\u2019est exactement le signe que l\u2019outil vous fait gagner du temps sur de vrais livrables.`,
    stats: [
      { value: usageLabel, label: 'D\u00e9j\u00e0 cr\u00e9\u00e9es' },
      { value: 'Moins de manuel', label: 'Plus de temps pour le fond' },
      { value: 'Workflow', label: 'D\u00e9j\u00e0 en train de se former' },
    ],
    spotlight: {
      tone: 'success',
      title: '\ud83d\udca1 Ce que font les utilisateurs les plus actifs',
      body: 'Ils int\u00e8grent SlideAI dans chaque nouveau brief ou reporting. R\u00e9sultat : leurs livrables sont pr\u00eats 2 \u00e0 3 fois plus vite, et ils passent plus de temps sur le fond que sur la forme.',
    },
    body: [
      'Vous avez d\u00e9j\u00e0 vu que le gain de temps est r\u00e9el. La prochaine \u00e9tape\u00a0: en faire une habitude.',
      'Chaque nouveau brief, reporting ou pitch est une occasion de gagner encore plus de temps avec SlideAI.',
    ],
    bullets: [
      'Continuez sur votre prochain livrable',
      'Testez un second type de pr\u00e9sentation (pitch, rapport, reco)',
      'Mesurez le temps gagn\u00e9 sur votre workflow',
    ],
    ctaLabel: 'Cr\u00e9er une autre pr\u00e9sentation',
    ctaUrl: createUrl,
  };
}

function buildValueDay4Email(pricingUrl: string, presentationCount: number): EmailContent {
  const isStrongUsage = presentationCount >= 3;
  const usageLabel = formatPresentationCount(presentationCount);

  return {
    subject: isStrongUsage
      ? `\ud83d\udd25 ${usageLabel} cr\u00e9\u00e9es \u2014 vous utilisez vraiment SlideAI !`
      : 'Vous avez d\u00e9j\u00e0 vu le gain de temps avec SlideAI \u2705',
    preview: 'La question n\u2019est plus de tester. C\u2019est de garder ce rythme de production.',
    badge: isStrongUsage ? 'Usage avanc\u00e9 \ud83d\udd25' : 'Valeur valid\u00e9e \u2705',
    title: isStrongUsage
      ? `${usageLabel} en quelques jours \u2014 excellent rythme !`
      : 'Vous avez d\u00e9j\u00e0 prouv\u00e9 que \u00e7a marche pour vous',
    intro: isStrongUsage
      ? `Avec ${usageLabel} cr\u00e9\u00e9es pendant votre essai, SlideAI fait d\u00e9j\u00e0 partie de votre mani\u00e8re de travailler. Voici comment tirer encore plus de valeur.`
      : `Vous avez cr\u00e9\u00e9 ${usageLabel} pendant votre essai. Le gain de temps n\u2019est plus th\u00e9orique \u2014 vous l\u2019avez v\u00e9cu.`,
    stats: [
      { value: usageLabel, label: 'Cr\u00e9\u00e9es pendant l\u2019essai' },
      { value: 'Acc\u00e8s Pro', label: 'Toujours actif' },
      { value: '3 jours', label: 'Avant la fin de l\u2019essai' },
    ],
    spotlight: {
      tone: 'success',
      title: '\ud83d\udca1 Ce que font nos meilleurs utilisateurs',
      body: 'Ils utilisent SlideAI pour chaque nouveau livrable : pitch sales, rapport marketing, reco consulting. R\u00e9sultat : 2h \u00e0 3h gagn\u00e9es par deck en moyenne.',
    },
    body: [
      'La vraie question maintenant n\u2019est pas \u00ab\u00a0est-ce que SlideAI marche\u00a0?\u00bb. Vous le savez d\u00e9j\u00e0.',
      'C\u2019est : est-ce que vous voulez continuer \u00e0 produire \u00e0 cette vitesse apr\u00e8s l\u2019essai\u00a0?',
    ],
    bullets: [
      'Conservez la vitesse de production que vous avez trouv\u00e9e',
      'Continuez les exports PDF/PPTX sans interruption',
      'Gardez SlideAI dans votre workflow au-del\u00e0 de l\u2019essai',
    ],
    ctaLabel: 'Continuer avec Pro',
    ctaUrl: pricingUrl,
  };
}

function buildPackPurchaseConfirmationEmail(createUrl: string): EmailContent {
  return {
    subject: 'Votre pack est actif \u2014 \u00e0 vous de jouer ! \ud83c\udf89',
    preview: 'G\u00e9n\u00e9rez et exportez sans abonnement. Votre pack est pr\u00eat.',
    badge: 'Pack activ\u00e9 \u2705',
    title: 'C\u2019est parti ! Votre pack est pr\u00eat',
    intro: 'Votre achat est confirm\u00e9. Vous pouvez g\u00e9n\u00e9rer et exporter en PDF/PPTX d\u00e8s maintenant, sans abonnement. Voici ce que vous pouvez faire\u00a0:',
    stats: [
      { value: 'Sans abo', label: 'Achat ponctuel, flexible' },
      { value: 'PDF/PPTX', label: 'Exports inclus' },
      { value: 'Imm\u00e9diat', label: 'Utilisable maintenant' },
    ],
    spotlight: {
      tone: 'success',
      title: '\ud83d\udca1 Comment maximiser votre pack',
      body: 'Utilisez-le sur vos livrables les plus urgents : pitch client, reporting \u00e9quipe, reco strat\u00e9gique. Vous verrez vite si votre usage justifie un passage \u00e0 Pro.',
    },
    body: [
      '\ud83d\udcc4 Un brief client \u2192 un deck de recommandations structur\u00e9',
      '\ud83d\udce3 Des donn\u00e9es marketing \u2192 une pr\u00e9sentation de reporting pour votre \u00e9quipe',
      '\ud83c\udfaf Des notes \u2192 un pitch commercial ou un support de rendez-vous',
    ],
    bullets: [
      'Lancez imm\u00e9diatement votre prochain deck',
      'Exportez en PDF ou PowerPoint quand il est pr\u00eat',
      'Jugez si votre usage m\u00e9rite un passage \u00e0 Pro',
    ],
    ctaLabel: 'Cr\u00e9er une pr\u00e9sentation',
    ctaUrl: createUrl,
  };
}

function buildPackLowBalanceEmail(pricingUrl: string): EmailContent {
  return {
    subject: '\u26a0\ufe0f Il vous reste peu de cr\u00e9dits dans votre pack',
    preview: 'Anticipez avant d\u2019\u00eatre bloqu\u00e9 au mauvais moment.',
    badge: 'Pack bient\u00f4t \u00e9puis\u00e9 \u26a0\ufe0f',
    title: 'Vos cr\u00e9dits arrivent \u00e0 leur fin',
    intro: 'Il vous reste peu de g\u00e9n\u00e9rations dans votre pack. Si vous avez encore des livrables \u00e0 produire, c\u2019est le bon moment pour anticiper\u00a0:',
    stats: [
      { value: 'Peu de cr\u00e9dits', label: 'Le pack arrive \u00e0 sa fin' },
      { value: 'Sans coupure', label: 'Si vous anticipez maintenant' },
      { value: 'Flexible', label: 'Pack ponctuel ou Pro selon votre usage' },
    ],
    spotlight: {
      tone: 'warning',
      title: '\ud83e\udd14 Pack ou Pro \u2014 comment choisir\u00a0?',
      body: 'Si vous cr\u00e9ez 1 \u00e0 2 decks par mois : un nouveau pack suffit. Si vous produisez chaque semaine pour votre \u00e9quipe marketing, sales ou vos clients : Pro devient vite plus rentable.',
    },
    body: [
      'Le pack est id\u00e9al pour un besoin ponctuel. D\u00e8s que la fr\u00e9quence augmente, l\u2019abonnement Pro devient plus logique.',
      'Le bon moment pour d\u00e9cider, c\u2019est avant d\u2019\u00eatre bloqu\u00e9, pas apr\u00e8s.',
    ],
    bullets: [
      '\u00c9vitez une coupure au mauvais moment',
      'Choisissez la formule adapt\u00e9e \u00e0 votre fr\u00e9quence d\u2019usage',
      'Gardez un workflow fluide sur vos prochains livrables',
    ],
    ctaLabel: 'Voir mes options',
    ctaUrl: pricingUrl,
  };
}

function buildPackExhaustedEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Votre pack est \u00e9puis\u00e9 \u2014 quelle est la suite\u00a0? \ud83e\udd14',
    preview: 'Continuez \u00e0 produire sans revenir au manuel. Voici vos options.',
    badge: 'Pack termin\u00e9',
    title: 'Votre pack est consomm\u00e9 \u2014 et maintenant\u00a0?',
    intro: 'Vous avez utilis\u00e9 tout votre pack. Bonne nouvelle : vous savez maintenant exactement comment SlideAI peut acc\u00e9l\u00e9rer votre production. Voici vos options\u00a0:',
    stats: [
      { value: '0 cr\u00e9dit', label: 'Pack consomm\u00e9' },
      { value: 'Pack ou Pro', label: 'Deux options selon votre usage' },
      { value: 'Sans perte', label: 'Votre historique est conserv\u00e9' },
    ],
    spotlight: {
      tone: 'warning',
      title: '\ud83e\udd14 Comment choisir\u00a0?',
      body: 'Vous produisez 1 \u00e0 2 decks par mois\u00a0: un nouveau pack suffit. Vous cr\u00e9ez chaque semaine des pitchs, rapports ou supports clients\u00a0: Pro est bien plus rentable.',
    },
    body: [
      'Vous avez d\u00e9j\u00e0 vu comment SlideAI acc\u00e9l\u00e8re la cr\u00e9ation de decks. La seule vraie question : \u00e0 quelle fr\u00e9quence voulez-vous continuer\u00a0?',
      'Plus votre usage est r\u00e9gulier, plus Pro devient l\u2019option la plus simple et la plus \u00e9conomique.',
    ],
    bullets: [
      'Rachetez un pack si votre besoin reste exceptionnel',
      'Passez \u00e0 Pro si vous produisez r\u00e9guli\u00e8rement',
      'Reprenez sans perdre votre historique',
    ],
    ctaLabel: 'Choisir ma suite',
    ctaUrl: pricingUrl,
  };
}

function buildInactive7dEmail(createUrl: string): EmailContent {
  return {
    subject: 'On vous a manqu\u00e9\u00a0? \ud83d\udc4b Reprenez avec SlideAI',
    preview: 'Un livrable en attente\u00a0? C\u2019est le moment id\u00e9al pour remettre SlideAI en jeu.',
    badge: 'On vous a manqu\u00e9\u00a0? \ud83d\udc4b',
    title: 'Reprenez l\u00e0 o\u00f9 vous vous \u00eatiez arr\u00eat\u00e9',
    intro: 'Vous avez d\u00e9j\u00e0 utilis\u00e9 SlideAI il y a quelques jours. Si vous avez un livrable en attente cette semaine, c\u2019est le moment parfait pour reprendre. Voici ce que vous pourriez cr\u00e9er\u00a0:',
    stats: [
      { value: '1 reprise', label: 'Suffit pour se remettre dedans' },
      { value: '< 5 min', label: 'Pour retrouver vos rep\u00e8res' },
      { value: 'Concret', label: 'Toujours le meilleur test' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83d\udca1 L\u2019id\u00e9e des utilisateurs qui reviennent',
      body: 'Ils ne \u00ab\u00a0retestent\u00a0\u00bb pas le produit. Ils reprennent directement sur un vrai besoin : un pitch client \u00e0 livrer, un rapport marketing \u00e0 pr\u00e9senter, une reco \u00e0 finir.',
    },
    body: [
      '\ud83c\udfaf Un pitch ou support de rendez-vous commercial',
      '\ud83d\udcca Un rapport ou bilan marketing \u00e0 pr\u00e9senter \u00e0 votre \u00e9quipe',
      '\ud83d\udcc4 Une recommandation client ou un compte-rendu structur\u00e9',
    ],
    bullets: [
      'Reprenez sur un livrable concret',
      'Retrouvez vos rep\u00e8res en quelques minutes',
      'Mesurez si SlideAI m\u00e9rite une place durable dans votre workflow',
    ],
    ctaLabel: 'Reprendre avec SlideAI',
    ctaUrl: createUrl,
  };
}

function buildInactive14dEmail(createUrl: string): EmailContent {
  return {
    subject: 'Un deck que vous pourriez sortir 3x plus vite cette semaine \u23f0',
    preview: 'Pensez \u00e0 votre prochain livrable client \u2014 pas au produit lui-m\u00eame.',
    badge: 'Retour \u00e0 l\u2019usage \ud83d\udcbc',
    title: 'R\u00e9activez SlideAI sur un livrable pr\u00e9cis',
    intro: 'Vous n\u2019\u00eates pas revenu depuis 2 semaines. Le meilleur moyen de red\u00e9couvrir SlideAI\u00a0? Pensez \u00e0 un livrable bien d\u00e9fini \u00e0 sortir cette semaine, pas \u00e0 \u00ab\u00a0retester\u00a0\u00bb le produit. Exemples\u00a0:',
    stats: [
      { value: '1 deck', label: 'Bien choisi vaut 10 tests' },
      { value: '< 5 min', label: 'Pour une premi\u00e8re structure' },
      { value: 'Concret', label: 'Toujours le meilleur test' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83d\udccc Les usages qui fonctionnent le mieux',
      body: 'Reco client, support de rendez-vous commercial, bilan marketing, pitch ou audit. Plus le sujet est concret et urgent, plus le gain de temps est imm\u00e9diat.',
    },
    body: [
      '\ud83d\udc64 Consultant : une recommandation ou un audit structur\u00e9 pour un client',
      '\ud83d\udce3 Marketing : un bilan de campagne ou un reporting pour votre direction',
      '\ud83d\udcbc Sales : un pitch ou support de rendez-vous client \u00e0 pr\u00e9parer rapidement',
    ],
    bullets: [
      'Choisissez un besoin concret et urgent',
      'Laissez SlideAI g\u00e9n\u00e9rer la structure en quelques secondes',
      'Jugez sur le r\u00e9sultat obtenu, pas sur une impression g\u00e9n\u00e9rale',
    ],
    ctaLabel: 'Relancer un deck',
    ctaUrl: createUrl,
  };
}

function buildInactive21dOfferEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Derni\u00e8re relance \u2014 et une offre si vous revenez \ud83c\udf81',
    preview: 'Si SlideAI peut encore vous faire gagner du temps, c\u2019est le moment de revenir.',
    badge: 'Derni\u00e8re relance \ud83c\udf81',
    title: 'On vous garde une place si vous voulez revenir',
    intro: '\u00c7a fait 3 semaines que vous n\u2019\u00eates pas revenu. Pas de pression \u2014 mais si vous avez encore des livrables \u00e0 produire, voici pourquoi certains utilisateurs sont revenus apr\u00e8s une pause\u00a0:',
    stats: [
      { value: '3 semaines', label: 'Sans activit\u00e9 r\u00e9cente' },
      { value: '1 test', label: 'Peut suffire pour d\u00e9cider' },
      { value: 'D\u00e9cision', label: 'Reprendre ou passer \u00e0 autre chose' },
    ],
    spotlight: {
      tone: 'warning',
      title: '\ud83d\udcac Ce que disent les utilisateurs qui reviennent',
      body: '\u00ab\u00a0J\u2019ai eu un audit client urgent et j\u2019ai relancer SlideAI par r\u00e9flexe. En 10 minutes j\u2019avais une base exploitable. Je ne suis plus repart\u00ed.\u00a0\u00bb',
    },
    body: [
      'Si vous pensez que SlideAI peut vous faire gagner du temps sur vos prochains decks, c\u2019est le moment de le v\u00e9rifier.',
      'Si vous ne voyez plus d\u2019usage concret, ignorez simplement cet email. Pas de jugement.',
    ],
    bullets: [
      'Un dernier test sur un vrai livrable',
      'Une d\u00e9cision nette ensuite',
      'Aucun email suppl\u00e9mentaire apr\u00e8s si ce n\u2019est pas pour vous',
    ],
    ctaLabel: 'Revoir SlideAI',
    ctaUrl: pricingUrl,
  };
}

function buildCancelConfirmationEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Annulation prise en compte \u2014 votre acc\u00e8s continue encore un moment',
    preview: 'Votre acc\u00e8s reste actif jusqu\u2019\u00e0 la fin de la p\u00e9riode en cours. Pas de coupure imm\u00e9diate.',
    badge: 'Annulation confirm\u00e9e',
    title: 'Votre abonnement s\u2019arr\u00eate \u00e0 la fin de la p\u00e9riode',
    intro: 'Votre annulation est bien enregistr\u00e9e. Bonne nouvelle : votre acc\u00e8s reste actif jusqu\u2019\u00e0 la fin de votre p\u00e9riode en cours. Vous pouvez continuer \u00e0 produire en attendant.',
    stats: [
      { value: 'Acc\u00e8s actif', label: 'Jusqu\u2019\u00e0 la fin de p\u00e9riode' },
      { value: 'Aucune coupure', label: 'Imm\u00e9diate aujourd\u2019hui' },
      { value: 'R\u00e9versible', label: 'Vous pouvez changer d\u2019avis' },
    ],
    spotlight: {
      tone: 'info',
      title: '\ud83d\udca1 Profitez-en d\u2019ici la fin de votre p\u00e9riode',
      body: 'Utilisez votre acc\u00e8s restant sur vos prochains livrables : pitch, reporting, reco client. Vous pourrez juger sur des cas r\u00e9els si vous voulez vraiment partir.',
    },
    body: [
      'Merci d\u2019avoir utilis\u00e9 SlideAI. Si votre besoin est simplement en pause, il n\u2019y a aucune urgence.',
      'Si vous changez d\u2019avis avant la fin de la p\u00e9riode, vous pouvez r\u00e9activer votre abonnement en un clic.',
    ],
    bullets: [
      'Continuez \u00e0 utiliser SlideAI jusqu\u2019\u00e0 la fin de p\u00e9riode',
      'Jugez sur vos vrais usages, pas sur une impression',
      'R\u00e9activez si vous changez d\u2019avis',
    ],
    ctaLabel: 'Revoir mon abonnement',
    ctaUrl: pricingUrl,
  };
}

function buildCancelDay3WinbackEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Avant de laisser SlideAI sortir de votre workflow \ud83e\udd14',
    preview: 'Une seule question : vos prochains decks seront-ils plus simples avec ou sans SlideAI\u00a0?',
    badge: 'On peut encore s\u2019arranger \ud83e\udd1d',
    title: 'La vraie question avant de partir d\u00e9finitivement',
    intro: 'Ce n\u2019est pas \u00ab\u00a0est-ce que j\u2019annule\u00a0?\u00bb. La vraie question est : est-ce que vos prochains livrables seront plus simples avec SlideAI que sans lui\u00a0?',
    stats: [
      { value: 'Workflow', label: 'C\u2019est l\u00e0 que la d\u00e9cision se joue vraiment' },
      { value: 'Sans rupture', label: 'Si vous revenez maintenant' },
      { value: '1 clic', label: 'Pour r\u00e9activer' },
    ],
    spotlight: {
      tone: 'warning',
      title: '\u26a0\ufe0f Ce que vous perdez concr\u00e8tement',
      body: 'Pas juste un logiciel. Le retour \u00e0 des heures de mise en page manuelle, \u00e0 la page blanche avant chaque pitch ou rapport. Si SlideAI vous aidait d\u00e9j\u00e0, c\u2019est ce rythme que vous perdez.',
    },
    body: [
      'Si votre usage \u00e9tait vraiment occasionnel, l\u2019annulation est la bonne d\u00e9cision. Pas de probl\u00e8me.',
      'Mais si vous avez encore des pitchs, rapports ou reco \u00e0 produire r\u00e9guli\u00e8rement, \u00e9vitez une coupure prise trop vite.',
    ],
    bullets: [
      'R\u00e9\u00e9valuez sur vos usages concrets, pas sur une impression',
      '\u00c9vitez une coupure qui vous co\u00fbte plus qu\u2019elle ne vous fait gagner',
      'R\u00e9activez en un clic si vous changez d\u2019avis',
    ],
    ctaLabel: 'Garder mon acc\u00e8s',
    ctaUrl: pricingUrl,
  };
}

function buildFailedPaymentEmail(pricingUrl: string): EmailContent {
  return {
    subject: '\u26a0\ufe0f Action requise : votre paiement SlideAI n\u2019a pas abouti',
    preview: 'Mettez \u00e0 jour votre paiement en quelques clics pour \u00e9viter toute interruption.',
    badge: 'Paiement \u00e0 mettre \u00e0 jour \u26a0\ufe0f',
    title: 'Votre acc\u00e8s est en danger \u2014 action requise',
    intro: 'Nous n\u2019avons pas pu finaliser votre paiement. Votre acc\u00e8s SlideAI risque d\u2019\u00eatre interrompu si vous ne corrigez pas cela rapidement.',
    stats: [
      { value: '\u00c9chec', label: 'Paiement non finalis\u00e9' },
      { value: '2 min', label: 'Pour corriger en quelques clics' },
      { value: 'Sans coupure', label: 'Si vous agissez maintenant' },
    ],
    spotlight: {
      tone: 'warning',
      title: '\u26a0\ufe0f Ce qui se passe si vous n\u2019agissez pas',
      body: 'Votre acc\u00e8s Pro sera suspendu et vous ne pourrez plus g\u00e9n\u00e9rer ni exporter de pr\u00e9sentations. Quelques clics suffisent pour \u00e9viter \u00e7a.',
    },
    body: [
      'Si SlideAI fait d\u00e9j\u00e0 partie de votre workflow \u2014 pitchs, rapports, reco clients \u2014 le mieux est de corriger cela maintenant.',
      'Une mise \u00e0 jour rapide de votre moyen de paiement suffit pour repartir normalement.',
    ],
    bullets: [
      'Mettez \u00e0 jour votre moyen de paiement en 2 minutes',
      'Conservez votre acc\u00e8s Pro sans interruption',
      '\u00c9vitez une coupure dans votre workflow de production',
    ],
    ctaLabel: 'Mettre \u00e0 jour mon paiement',
    ctaUrl: pricingUrl,
  };
}

function buildEndingDay6Email(createUrl: string, pricingUrl: string, presentationCount: number, daysLeft: number): EmailContent {
  if (presentationCount === 0) {
    return {
      subject: 'Votre essai se termine demain',
      preview: 'Il vous reste 1 jour pour tester SlideAI sur un vrai cas avant la fin.',
      badge: '1 jour restant',
      title: 'Essayez-le sur un vrai besoin avant demain',
      intro: `Il vous reste environ ${daysLeft} jour avant la fin de votre essai. Si vous n\u2019avez pas encore test\u00e9 SlideAI sur un cas r\u00e9el, c\u2019est maintenant.`,
      stats: [
        { value: '1 jour', label: 'Avant la fin de l\u2019essai' },
        { value: '1 doc', label: 'Suffit pour voir la valeur' },
        { value: '0 carte', label: 'Toujours aucun moyen de paiement demand\u00e9' },
      ],
      spotlight: {
        tone: 'warning',
        title: 'Le bon dernier test',
        body: 'Prenez un brief ou un document client r\u00e9cent. Laissez SlideAI poser une base. Vous saurez en une session si l\u2019outil vaut sa place dans votre workflow.',
      },
      body: [
        'Ne laissez pas l\u2019essai se terminer sans avoir vu le produit dans une situation concr\u00e8te.',
        'Le meilleur moment pour d\u00e9cider est apr\u00e8s une vraie pr\u00e9sentation, pas avant.',
      ],
      bullets: [
        'Test rapide sur un cas r\u00e9el',
        'Base claire \u00e0 reprendre et finaliser',
        'Vision imm\u00e9diate du gain de temps',
      ],
      ctaLabel: 'Cr\u00e9er une pr\u00e9sentation avant la fin',
      ctaUrl: createUrl,
      note: 'Le bon objectif aujourd\u2019hui: valider l\u2019usage, pas h\u00e9siter de plus.',
    };
  }

  const usageLabel = formatPresentationCount(presentationCount);

  return {
    subject: 'Votre acc\u00e8s Pro se termine demain',
    preview: 'Gardez votre vitesse de production et vos exports au-del\u00e0 de l\u2019essai.',
    badge: 'Fin d\u2019essai imminente',
    title: 'Gardez l\u2019acc\u00e8s complet sans interruption',
    intro: `Il vous reste environ ${daysLeft} jour avant la fin de l\u2019essai, et vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel} avec SlideAI.`,
    stats: [
      { value: usageLabel, label: 'D\u00e9j\u00e0 produites' },
      { value: 'PDF/PPTX', label: 'Exports \u00e0 garder sans coupure' },
      { value: 'Demain', label: 'Fin de l\u2019acc\u00e8s Pro actuel' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'Ce que vous prot\u00e9gez en passant \u00e0 Pro',
      body: 'Votre vitesse de production, votre continuit\u00e9 de travail et la possibilit\u00e9 de reprendre vos prochains decks sans retour en arri\u00e8re.',
    },
    body: [
      'Si SlideAI vous a d\u00e9j\u00e0 aid\u00e9 \u00e0 produire plus vite, le plus logique est d\u2019\u00e9viter une coupure au moment o\u00f9 l\u2019outil commence \u00e0 entrer dans votre routine.',
      'Passer \u00e0 Pro maintenant vous permet de garder l\u2019acc\u00e8s complet sans friction ni interruption.',
    ],
    bullets: [
      'Pas de rupture dans votre workflow',
      'Acc\u00e8s continu \u00e0 la cr\u00e9ation et aux exports',
      'Reprise imm\u00e9diate sur vos prochains decks',
    ],
    ctaLabel: 'Continuer avec Pro',
    ctaUrl: pricingUrl,
    note: 'Le but ici est simple: garder l\u2019\u00e9lan, pas repartir \u00e0 z\u00e9ro demain.',
  };
}

function buildExpiredEmail(pricingUrl: string, legacyFree: boolean, presentationCount: number): EmailContent {
  const usageLabel = formatPresentationCount(presentationCount || 1);

  if (legacyFree) {
    return {
      subject: 'Votre essai Pro est termin\u00e9',
      preview: 'Votre compte repasse sur votre acc\u00e8s gratuit historique.',
      badge: 'Retour au plan historique',
      title: 'Votre essai est termin\u00e9, votre compte reste actif',
      intro: 'Votre essai Pro est termin\u00e9. Votre compte revient maintenant sur votre acc\u00e8s gratuit historique.',
      stats: [
        { value: 'Compte actif', label: 'Votre espace reste disponible' },
        { value: 'Historique', label: 'Vos donn\u00e9es sont conserv\u00e9es' },
        { value: 'Pro', label: 'Toujours accessible \u00e0 tout moment' },
      ],
      spotlight: {
        tone: 'info',
        title: 'La bonne logique maintenant',
        body: 'Reprendre Pro quand vous avez un vrai besoin de production r\u00e9gulier, pour retrouver un workflow plus rapide et plus confortable.',
      },
      body: [
        'Vous pouvez continuer sur votre acc\u00e8s gratuit historique. En revanche, si vous voulez garder le confort et la vitesse du mode Pro, il faut maintenant passer \u00e0 l\u2019abonnement.',
        'Le plus simple est de le faire au moment o\u00f9 vous avez de nouveaux decks \u00e0 produire.',
      ],
      bullets: [
        'Vous gardez votre compte',
        'Vous gardez votre historique',
        'Vous pouvez repasser \u00e0 Pro d\u00e8s qu\u2019un besoin r\u00e9gulier revient',
      ],
      ctaLabel: 'Voir l\u2019offre Pro',
      ctaUrl: pricingUrl,
    };
  }

  if (presentationCount === 0) {
    return {
      subject: 'Votre essai Pro SlideAI est termin\u00e9',
      preview: 'Les nouvelles cr\u00e9ations sont maintenant bloqu\u00e9es jusqu\u2019\u00e0 l\u2019abonnement.',
      badge: 'Essai termin\u00e9',
      title: 'Votre acc\u00e8s Pro est coup\u00e9',
      intro: 'Votre essai est termin\u00e9 et les nouvelles cr\u00e9ations sont maintenant bloqu\u00e9es.',
      stats: [
        { value: 'Bloqu\u00e9', label: 'Nouvelles cr\u00e9ations suspendues' },
        { value: 'Pro', label: 'N\u00e9cessaire pour reprendre' },
        { value: 'Immediat', label: 'R\u00e9activation d\u00e8s l\u2019abonnement' },
      ],
      spotlight: {
        tone: 'warning',
        title: 'La meilleure suite si vous voulez vraiment tester',
        body: 'Passez \u00e0 Pro et utilisez SlideAI sur un vrai cas. Sans usage r\u00e9el, il est difficile de juger le gain de temps du produit.',
      },
      body: [
        'Si vous voulez continuer \u00e0 explorer SlideAI, l\u2019\u00e9tape utile maintenant est de passer \u00e0 Pro et de l\u2019utiliser sur un besoin concret.',
        'Le bon crit\u00e8re n\u2019est pas “est-ce que j\u2019ai tout test\u00e9 ?”, mais “est-ce que l\u2019outil m\u2019aide vraiment \u00e0 livrer plus vite ?”',
      ],
      bullets: [
        'D\u00e9bloquez imm\u00e9diatement la cr\u00e9ation',
        'Testez-le sur un vrai projet',
        'Validez enfin le gain de temps dans votre contexte',
      ],
      ctaLabel: 'D\u00e9bloquer SlideAI',
      ctaUrl: pricingUrl,
    };
  }

  return {
    subject: 'Votre essai Pro SlideAI est termin\u00e9',
    preview: 'Vos nouvelles cr\u00e9ations sont bloqu\u00e9es, mais vos donn\u00e9es sont toujours l\u00e0.',
    badge: 'Essai termin\u00e9',
    title: 'Ne perdez pas la dynamique que vous avez cr\u00e9\u00e9e',
    intro: `Votre essai est termin\u00e9. Vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel}, mais les nouvelles cr\u00e9ations sont maintenant bloqu\u00e9es.`,
    stats: [
      { value: usageLabel, label: 'Cr\u00e9\u00e9es pendant l\u2019essai' },
      { value: 'Bloqu\u00e9', label: 'Nouvelles cr\u00e9ations suspendues' },
      { value: 'Vos donn\u00e9es', label: 'Toujours conserv\u00e9es' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'Ce que vous perdez si vous attendez',
      body: 'La continuit\u00e9 de travail. Vous repassez sur un mode plus lent alors que vous avez d\u00e9j\u00e0 valid\u00e9 l\u2019int\u00e9r\u00eat du produit sur de vraies pr\u00e9sentations.',
    },
    body: [
      'Le moment le plus logique pour passer \u00e0 Pro, c\u2019est maintenant: tant que SlideAI est encore frais dans votre workflow et que vos prochains decks arrivent.',
      'Vos pr\u00e9sentations et votre historique sont toujours l\u00e0. Il vous suffit de r\u00e9activer l\u2019acc\u00e8s complet pour reprendre.',
    ],
    bullets: [
      'D\u00e9bloquez imm\u00e9diatement de nouvelles pr\u00e9sentations',
      'Gardez vos exports et votre vitesse de production',
      'Reprenez exactement l\u00e0 o\u00f9 vous vous \u00eates arr\u00eat\u00e9',
    ],
    ctaLabel: 'D\u00e9bloquer SlideAI',
    ctaUrl: pricingUrl,
    note: 'Vos donn\u00e9es restent disponibles. Seule la cr\u00e9ation de nouveaux decks est bloqu\u00e9e.',
  };
}

function buildWinbackEmail(pricingUrl: string, presentationCount: number, offer?: WinbackOffer): EmailContent {
  const activated = presentationCount > 0;
  const promoCode = offer?.code || 'TRIAL20';
  const percentOff = offer?.percentOff ?? 20;
  const expiresInHours = offer?.expiresInHours ?? 72;
  const ctaUrl = `${pricingUrl}${pricingUrl.includes('?') ? '&' : '?'}promo=${encodeURIComponent(promoCode)}`;

  return {
    subject: `Reprenez SlideAI avec -${percentOff}% sur votre premier mois`,
    preview: `Votre offre de relance expire sous ${expiresInHours} heures.`,
    badge: 'Offre de relance',
    title: activated
      ? 'Vous avez d\u00e9j\u00e0 vu la valeur. Voici une raison concr\u00e8te de reprendre.'
      : 'Si le timing n\u2019\u00e9tait pas bon, voici une derni\u00e8re fen\u00eatre.',
    intro: activated
      ? 'Vous avez d\u00e9j\u00e0 test\u00e9 SlideAI sur de vraies pr\u00e9sentations. Cette offre est l\u00e0 pour vous aider \u00e0 reprendre sans trop h\u00e9siter.'
      : 'Vous n\u2019avez peut-\u00eatre pas eu le bon moment pour tester SlideAI correctement. Voici une derni\u00e8re occasion de le reprendre dans de bonnes conditions.',
    stats: [
      { value: `-${percentOff}%`, label: 'Sur votre premier mois' },
      { value: promoCode, label: 'Code \u00e0 utiliser au checkout' },
      { value: `${expiresInHours}h`, label: 'Fen\u00eatre limit\u00e9e' },
    ],
    spotlight: {
      tone: 'success',
      title: 'Offre temporaire',
      body: `Le code <strong>${promoCode}</strong> vous donne -${percentOff}% sur votre premier mois. C\u2019est une relance simple, limit\u00e9e dans le temps, pour reprendre sans friction.`,
    },
    body: [
      activated
        ? 'Vous savez d\u00e9j\u00e0 ce que SlideAI peut vous faire gagner. Si vous comptez l\u2019utiliser \u00e0 nouveau, autant reprendre maintenant avec cette remise.'
        : 'Si vous vouliez tester SlideAI plus s\u00e9rieusement mais que le timing n\u2019\u00e9tait pas bon, cette fen\u00eatre est faite pour vous.',
      'Pass\u00e9 le d\u00e9lai de 72 heures, l\u2019offre dispara\u00eet. Si vous pensez que SlideAI peut r\u00e9ellement acc\u00e9l\u00e9rer votre production, c\u2019est le bon moment pour reprendre.',
    ],
    bullets: [
      'Code promo simple \u00e0 utiliser',
      'R\u00e9duction valable sur le premier mois',
      'Reprise rapide de votre acc\u00e8s Pro',
    ],
    ctaLabel: 'Activer mon offre',
    ctaUrl,
    note: `Utilisez le code ${promoCode} au moment du paiement. L'offre expire dans ${expiresInHours} heures.`,
  };
}

export function buildLifecycleEmailModel(params: {
  emailType: string;
  legacyFree: boolean;
  trialEndsAt: string;
  presentationCount: number;
  winbackOffer?: WinbackOffer;
  contentPatch?: EmailContentPatch;
  unsubscribeUrl?: string;
  footerReason?: string;
  firstName?: string;
}) {
  const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
  const pricingUrl = `${appUrl.replace(/\/$/, '')}/pricing`;
  const createUrl = `${appUrl.replace(/\/$/, '')}/create`;
  const examplesUrl = `${appUrl.replace(/\/$/, '')}/examples`;
  const daysLeft = Math.max(0, Math.ceil((new Date(params.trialEndsAt).getTime() - Date.now()) / DAY_MS));

  let content: EmailContent | null = null;

  switch (params.emailType) {
    case 'signup_welcome':
      content = buildSignupWelcomeEmail(createUrl, params.firstName);
      break;
    case 'signup_day1_no_presentation':
      content = buildSignupDay1NoPresentationEmail(createUrl);
      break;
    case 'signup_day3_no_presentation':
      content = buildSignupDay3NoPresentationEmail(examplesUrl);
      break;
    case 'signup_day5_activated':
      content = buildSignupDay5ActivatedEmail(createUrl, params.presentationCount);
      break;
    case 'trial_welcome':
      content = buildWelcomeEmail(createUrl);
      break;
    case 'trial_inactive_day1':
      content = buildInactiveDay1Email(createUrl);
      break;
    case 'trial_value_day4':
      content = buildValueDay4Email(pricingUrl, params.presentationCount);
      break;
    case 'trial_ending_day6':
      content = buildEndingDay6Email(createUrl, pricingUrl, params.presentationCount, daysLeft);
      break;
    case 'trial_expired':
      content = buildExpiredEmail(pricingUrl, params.legacyFree, params.presentationCount);
      break;
    case 'trial_winback_day2':
      content = buildWinbackEmail(pricingUrl, params.presentationCount, params.winbackOffer);
      break;
    case 'pack_purchase_confirmation':
      content = buildPackPurchaseConfirmationEmail(createUrl);
      break;
    case 'pack_low_balance':
      content = buildPackLowBalanceEmail(pricingUrl);
      break;
    case 'pack_exhausted':
      content = buildPackExhaustedEmail(pricingUrl);
      break;
    case 'inactive_7d':
      content = buildInactive7dEmail(createUrl);
      break;
    case 'inactive_14d':
      content = buildInactive14dEmail(createUrl);
      break;
    case 'inactive_21d_offer':
      content = buildInactive21dOfferEmail(pricingUrl);
      break;
    case 'cancel_confirmation':
      content = buildCancelConfirmationEmail(pricingUrl);
      break;
    case 'cancel_day3_winback':
      content = buildCancelDay3WinbackEmail(pricingUrl);
      break;
    case 'failed_payment_day0':
      content = buildFailedPaymentEmail(pricingUrl);
      break;
    default:
      return null;
  }

  return applyEmailPatch(
    {
      ...content,
      unsubscribeUrl: params.unsubscribeUrl,
      footerReason: params.footerReason,
    },
    params.contentPatch,
  );
}

export function buildTrialEmailContent(params: {
  emailType: string;
  legacyFree: boolean;
  trialEndsAt: string;
  presentationCount: number;
  winbackOffer?: WinbackOffer;
  contentPatch?: EmailContentPatch;
  unsubscribeUrl?: string;
  footerReason?: string;
  firstName?: string;
}) {
  const content = buildLifecycleEmailModel(params);
  if (!content) {
    return null;
  }

  return {
    subject: content.subject,
    html: content.layout === 'welcome' ? wrapSignupWelcomeEmail(content) : wrapEmail(content),
  };
}

export async function sendLifecycleEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Noe de SlideAI <noe@slideai.fr>';

  if (!resendApiKey) {
    console.warn('[LifecycleEmail] RESEND_API_KEY missing, skipping actual send');
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend error (${response.status}): ${body}`);
  }

  return response.json();
}
