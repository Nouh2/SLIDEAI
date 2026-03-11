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

type EmailContent = {
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
                      <div style="display: inline-block; width: 42px; height: 42px; border-radius: 12px; background: rgba(255,255,255,0.18); color: #ffffff; font-size: 22px; line-height: 42px; font-weight: 900; text-align: center;">
                        S
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
                Vous recevez cet email car vous avez lanc&eacute; un essai SlideAI.<br />
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

function buildWelcomeEmail(createUrl: string): EmailContent {
  return {
    subject: 'Votre essai Pro de 7 jours est activ\u00e9',
    preview: 'Le plus simple pour voir la valeur: cr\u00e9ez votre premi\u00e8re pr\u00e9sentation aujourd\u2019hui.',
    badge: 'Essai Pro 7 jours',
    title: 'Le meilleur test, c\u2019est une vraie pr\u00e9sentation',
    intro: 'Votre acc\u00e8s Pro est ouvert. Le plus rentable maintenant est de lancer une premi\u00e8re pr\u00e9sentation sur un vrai brief ou un vrai document.',
    stats: [
      { value: '7 jours', label: 'Acc\u00e8s Pro sans carte bancaire' },
      { value: 'PDF/PPTX', label: 'Exports disponibles pendant l\u2019essai' },
      { value: '1 doc', label: 'Suffit pour d\u00e9marrer' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Le raccourci le plus efficace',
      body: 'Partez d\u2019un brief client, d\u2019un doc commercial ou d\u2019une mati\u00e8re existante. Vous verrez la valeur beaucoup plus vite qu\u2019en partant de z\u00e9ro.',
    },
    body: [
      'SlideAI n\u2019est pas fait pour vous remplacer. Il est fait pour vous donner une base claire, propre et exploitable plus vite.',
      'Si vous voyez le gain de temps sur votre premi\u00e8re session, vous saurez imm\u00e9diatement si SlideAI a sa place dans votre workflow.',
    ],
    bullets: [
      'G\u00e9n\u00e9rez une premi\u00e8re structure sans repartir d\u2019une page blanche',
      'Reprenez la main sur le message, le design et les derniers ajustements',
      'Livrez plus vite un deck pr\u00e9sentable au client',
    ],
    ctaLabel: 'Cr\u00e9er ma premi\u00e8re pr\u00e9sentation',
    ctaUrl: createUrl,
    note: 'Aucune carte bancaire n\u2019est demand\u00e9e pendant l\u2019essai.',
  };
}

function buildInactiveDay1Email(createUrl: string): EmailContent {
  return {
    subject: 'Le moyen le plus simple de tester SlideAI',
    preview: 'Prenez un document r\u00e9cent. Laissez SlideAI poser la structure.',
    badge: 'Objectif: premier r\u00e9sultat',
    title: 'Ne cherchez pas un cas parfait',
    intro: 'Le meilleur usage pour d\u00e9marrer est un cas r\u00e9el, m\u00eame imparfait. Un brief, un doc client, quelques notes: cela suffit.',
    stats: [
      { value: '1 brief', label: 'Ou 1 document pour commencer' },
      { value: 'Quelques min', label: 'Pour obtenir une base exploitable' },
      { value: '100%', label: 'Vous gardez le contr\u00f4le sur le rendu final' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Ce que vous devez valider',
      body: 'Pas un deck parfait. Juste une chose: est-ce que SlideAI vous fait gagner du temps sur une vraie pr\u00e9sentation ?',
    },
    body: [
      'Si vous attendez le bon moment ou le bon projet, vous risquez de laisser passer votre essai sans voir la valeur.',
      'Les utilisateurs qui convertissent comprennent en g\u00e9n\u00e9ral le produit sur leur premi\u00e8re pr\u00e9sentation, pas sur la cinqui\u00e8me.',
    ],
    bullets: [
      'Importez votre mati\u00e8re existante',
      'Laissez SlideAI proposer une structure claire',
      'Ajustez et exportez quand le deck est pr\u00eat',
    ],
    ctaLabel: 'Tester sur un vrai document',
    ctaUrl: createUrl,
    note: 'Visez simple. Le but est de voir le gain de temps, pas de produire le deck parfait au premier essai.',
  };
}

function buildValueDay4Email(pricingUrl: string, presentationCount: number): EmailContent {
  const isStrongUsage = presentationCount >= 3;
  const usageLabel = formatPresentationCount(presentationCount);

  return {
    subject: isStrongUsage
      ? `Vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel} avec SlideAI`
      : 'Vous avez d\u00e9j\u00e0 valid\u00e9 le principal avec SlideAI',
    preview: 'Ce n\u2019est plus juste un test. Vous avez d\u00e9j\u00e0 commenc\u00e9 \u00e0 l\u2019int\u00e9grer \u00e0 votre workflow.',
    badge: 'Valeur d\u00e9j\u00e0 visible',
    title: isStrongUsage
      ? 'Vous avez d\u00e9j\u00e0 commenc\u00e9 \u00e0 l\u2019utiliser pour produire'
      : 'Votre essai a d\u00e9j\u00e0 d\u00e9pass\u00e9 le stade de la curiosit\u00e9',
    intro: isStrongUsage
      ? `Avec ${usageLabel} cr\u00e9\u00e9es pendant l\u2019essai, SlideAI commence d\u00e9j\u00e0 \u00e0 prendre une place concr\u00e8te dans votre mani\u00e8re de travailler.`
      : `Vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel} pendant l\u2019essai. Vous avez donc vu l\u2019essentiel: le gain de temps n\u2019est plus th\u00e9orique.`,
    stats: [
      { value: usageLabel, label: 'D\u00e9j\u00e0 cr\u00e9\u00e9es pendant l\u2019essai' },
      { value: 'Pro', label: 'Acc\u00e8s complet en cours' },
      { value: 'Moins de manuel', label: 'Plus de temps pour le fond' },
    ],
    spotlight: {
      tone: 'success',
      title: 'Le vrai enjeu maintenant',
      body: 'Garder cette vitesse de production quand vos prochains decks arrivent, au lieu de retomber sur un workflow plus lent et plus manuel.',
    },
    body: [
      'La question n\u2019est plus vraiment “est-ce que SlideAI marche ?”. La bonne question est “est-ce que je veux continuer \u00e0 produire de cette mani\u00e8re ?”',
      'Si la r\u00e9ponse est oui, le passage \u00e0 Pro devient une d\u00e9cision de workflow, pas un simple achat logiciel.',
    ],
    bullets: [
      'Conservez un rythme r\u00e9gulier de g\u00e9n\u00e9ration',
      'Continuez vos exports sans friction',
      'Gardez SlideAI comme outil de production, pas comme simple test',
    ],
    ctaLabel: 'Continuer avec Pro',
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

function buildWinbackEmail(pricingUrl: string, presentationCount: number): EmailContent {
  const activated = presentationCount > 0;

  return {
    subject: 'Reprenez SlideAI avec -20% sur votre premier mois',
    preview: 'Votre offre de relance expire sous 72 heures.',
    badge: 'Offre de relance',
    title: activated
      ? 'Vous avez d\u00e9j\u00e0 vu la valeur. Voici une raison concr\u00e8te de reprendre.'
      : 'Si le timing n\u2019\u00e9tait pas bon, voici une derni\u00e8re fen\u00eatre.',
    intro: activated
      ? 'Vous avez d\u00e9j\u00e0 test\u00e9 SlideAI sur de vraies pr\u00e9sentations. Cette offre est l\u00e0 pour vous aider \u00e0 reprendre sans trop h\u00e9siter.'
      : 'Vous n\u2019avez peut-\u00eatre pas eu le bon moment pour tester SlideAI correctement. Voici une derni\u00e8re occasion de le reprendre dans de bonnes conditions.',
    stats: [
      { value: '-20%', label: 'Sur votre premier mois' },
      { value: 'TRIAL20', label: 'Code \u00e0 utiliser au checkout' },
      { value: '72h', label: 'Fen\u00eatre limit\u00e9e' },
    ],
    spotlight: {
      tone: 'success',
      title: 'Offre temporaire',
      body: 'Le code <strong>TRIAL20</strong> vous donne -20% sur votre premier mois. C\u2019est une relance simple, limit\u00e9e dans le temps, pour reprendre sans friction.',
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
    ctaUrl: pricingUrl,
    note: 'Utilisez le code TRIAL20 au moment du paiement.',
  };
}

export function buildTrialEmailContent(params: {
  emailType: string;
  legacyFree: boolean;
  trialEndsAt: string;
  presentationCount: number;
}) {
  const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
  const pricingUrl = `${appUrl.replace(/\/$/, '')}/pricing`;
  const createUrl = `${appUrl.replace(/\/$/, '')}/create`;
  const daysLeft = Math.max(0, Math.ceil((new Date(params.trialEndsAt).getTime() - Date.now()) / DAY_MS));

  let content: EmailContent | null = null;

  switch (params.emailType) {
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
      content = buildWinbackEmail(pricingUrl, params.presentationCount);
      break;
    default:
      return null;
  }

  return {
    subject: content.subject,
    html: wrapEmail(content),
  };
}

export async function sendLifecycleEmail(params: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'SlideAI <noreply@slideai.fr>';

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
