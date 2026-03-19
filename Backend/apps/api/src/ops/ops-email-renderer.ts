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

function buildSignupDay1NoPresentationEmail(createUrl: string): EmailContent {
  return {
    subject: 'Le plus simple pour démarrer SlideAI',
    preview: 'Prenez un brief ou un document récent. C’est le meilleur premier test.',
    badge: 'Premier pas',
    title: 'Ne cherchez pas le cas parfait',
    intro: 'Le meilleur premier usage de SlideAI est un cas réel, même simple: un brief, un document client, quelques notes.',
    stats: [
      { value: '1 brief', label: 'Suffit pour commencer' },
      { value: 'Quelques min', label: 'Pour voir un premier résultat' },
      { value: '0 carte', label: 'Toujours sans paiement' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Le vrai objectif',
      body: 'Valider une chose: est-ce que SlideAI vous aide à produire plus vite sur un vrai sujet ?',
    },
    body: [
      'Si vous attendez le bon projet, vous risquez de laisser passer de la valeur sans jamais la tester correctement.',
      'Le bon point de départ est souvent le plus simple: une matière déjà existante, puis quelques ajustements.',
    ],
    bullets: [
      'Importez un document ou partez d’un prompt clair',
      'Laissez SlideAI proposer une structure',
      'Ajustez puis exportez quand le deck est prêt',
    ],
    ctaLabel: 'Créer ma première présentation',
    ctaUrl: createUrl,
  };
}

function buildSignupDay3NoPresentationEmail(examplesUrl: string): EmailContent {
  return {
    subject: 'Voici comment des pros utilisent SlideAI',
    preview: 'Le plus utile est souvent de partir d’un cas d’usage proche du vôtre.',
    badge: 'Cas d’usage',
    title: 'Projetez-vous sur un cas concret',
    intro: 'Si vous n’avez pas encore lancé votre premier deck, le plus efficace est de regarder un exemple proche de votre manière de travailler.',
    stats: [
      { value: 'Consulting', label: 'Reco, audit, reporting' },
      { value: 'Sales', label: 'Pitch, support de rendez-vous' },
      { value: 'Freelance', label: 'Livrables plus rapides' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Pourquoi ça aide',
      body: 'Quand vous voyez un cas d’usage concret, il devient beaucoup plus simple d’identifier où SlideAI peut vous faire gagner du temps.',
    },
    body: [
      'Les meilleurs essais ne partent pas d’une feuille blanche. Ils partent d’un besoin qui ressemble déjà à votre quotidien.',
      'Regardez quelques exemples, puis testez-en un sur votre propre matière.',
    ],
    bullets: [
      'Voir un rendu proche de votre usage',
      'Comprendre quoi tester en premier',
      'Réduire la friction du premier lancement',
    ],
    ctaLabel: 'Voir des exemples',
    ctaUrl: examplesUrl,
  };
}

function buildSignupDay5ActivatedEmail(createUrl: string, presentationCount: number): EmailContent {
  const usageLabel = formatPresentationCount(presentationCount);

  return {
    subject: `Vous avez déjà créé ${usageLabel} avec SlideAI`,
    preview: 'Le plus intéressant maintenant est de transformer cet essai en habitude de production.',
    badge: 'Activation',
    title: 'Vous avez déjà passé le cap le plus important',
    intro: `Avec ${usageLabel} déjà créées, vous avez validé l’essentiel: SlideAI peut vous aider à aller plus vite sur un vrai livrable.`,
    stats: [
      { value: usageLabel, label: 'Déjà créées' },
      { value: 'Moins de manuel', label: 'Plus de temps pour le fond' },
      { value: 'Workflow', label: 'Déjà en train de se former' },
    ],
    spotlight: {
      tone: 'success',
      title: 'La bonne suite',
      body: 'Créer une nouvelle présentation pendant que le produit est encore frais dans votre tête. C’est le meilleur moyen de confirmer la valeur.',
    },
    body: [
      'La plupart des utilisateurs qui convertissent ne se demandent plus “est-ce que l’outil marche ?”. Ils voient surtout qu’ils ont envie de garder cette manière de produire.',
      'Le bon prochain test est simplement le suivant: refaire un deck avec SlideAI au lieu de repartir à zéro.',
    ],
    bullets: [
      'Conserver le rythme d’utilisation',
      'Tester un second cas concret',
      'Mieux sentir la valeur dans votre workflow',
    ],
    ctaLabel: 'Créer une autre présentation',
    ctaUrl: createUrl,
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

function buildPackPurchaseConfirmationEmail(createUrl: string): EmailContent {
  return {
    subject: 'Votre pack est actif',
    preview: 'Vous pouvez continuer à générer et exporter sans abonnement.',
    badge: 'Pack activé',
    title: 'Votre pack est prêt à être utilisé',
    intro: 'Votre achat est confirmé. Vous pouvez continuer à générer ponctuellement et exporter en PDF/PPTX dès maintenant.',
    stats: [
      { value: 'One-shot', label: 'Achat ponctuel, sans abonnement' },
      { value: 'PDF/PPTX', label: 'Exports inclus' },
      { value: 'Immédiat', label: 'Utilisable maintenant' },
    ],
    spotlight: {
      tone: 'success',
      title: 'Le meilleur usage du pack',
      body: 'L’utiliser sur un vrai livrable à court terme, puis juger si votre volume justifie un passage à Pro.',
    },
    body: [
      'Le pack est idéal si votre besoin est ponctuel ou si vous voulez continuer à produire sans vous engager dans un abonnement tout de suite.',
      'Quand vous êtes prêt, le plus simple est de lancer directement votre prochain deck.',
    ],
    bullets: [
      'Créer immédiatement une nouvelle présentation',
      'Exporter en PDF/PPTX quand le deck est prêt',
      'Mesurer si votre usage reste ponctuel ou devient régulier',
    ],
    ctaLabel: 'Créer une présentation',
    ctaUrl: createUrl,
  };
}

function buildPackLowBalanceEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Il vous reste peu de crédits dans votre pack',
    preview: 'Anticipez la rupture si vous comptez continuer à produire.',
    badge: 'Pack bientôt épuisé',
    title: 'Votre marge devient courte',
    intro: 'Il vous reste peu de générations dans votre pack. Si vous comptez produire d’autres decks, c’est le bon moment pour anticiper.',
    stats: [
      { value: 'Peu de crédits', label: 'Le pack arrive à sa fin' },
      { value: 'Sans coupure', label: 'Passez à Pro si le besoin continue' },
      { value: 'Simple', label: 'Une seule action pour continuer' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'Le vrai choix ici',
      body: 'Si votre besoin reste ponctuel, un autre pack peut suffire. Si vous produisez régulièrement, Pro sera vite plus logique.',
    },
    body: [
      'Le pack est excellent pour absorber un besoin ponctuel. Mais dès que le volume devient plus fréquent, il commence à coûter plus en friction qu’il n’en enlève.',
      'Le bon moment pour décider est avant la rupture, pas une fois bloqué.',
    ],
    bullets: [
      'Éviter l’arrêt au mauvais moment',
      'Choisir entre pack ponctuel et usage régulier',
      'Garder un workflow fluide',
    ],
    ctaLabel: 'Voir mes options',
    ctaUrl: pricingUrl,
  };
}

function buildPackExhaustedEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Votre pack est épuisé',
    preview: 'Choisissez la suite la plus simple pour continuer à produire.',
    badge: 'Pack terminé',
    title: 'Vous avez consommé votre pack',
    intro: 'Votre pack est terminé. Si vous voulez continuer à créer sans revenir au manuel, il faut maintenant choisir la bonne suite.',
    stats: [
      { value: '0 crédit', label: 'Le pack est consommé' },
      { value: 'Pack ou Pro', label: 'Deux façons simples de reprendre' },
      { value: 'Sans perte', label: 'Vos données restent disponibles' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'Le bon arbitrage',
      body: 'Pack si votre besoin reste ponctuel. Pro si SlideAI commence à entrer dans votre routine de production.',
    },
    body: [
      'Vous avez déjà vu comment SlideAI peut accélérer la création d’un deck. La vraie question maintenant est votre fréquence d’usage.',
      'Si vous produisez souvent, l’abonnement devient vite la décision la plus simple.',
    ],
    bullets: [
      'Repartir avec un autre pack si le besoin est exceptionnel',
      'Passer à Pro si le volume devient récurrent',
      'Reprendre sans perdre votre historique',
    ],
    ctaLabel: 'Choisir ma suite',
    ctaUrl: pricingUrl,
  };
}

function buildInactive7dEmail(createUrl: string): EmailContent {
  return {
    subject: 'Vous aviez commencé quelque chose avec SlideAI',
    preview: 'Le plus utile maintenant est de reprendre un deck réel, pas de relire la doc.',
    badge: 'Réactivation',
    title: 'Reprenez là où vous vous étiez arrêté',
    intro: 'Vous avez déjà utilisé SlideAI, puis votre usage s’est arrêté. Le plus efficace est de le remettre sur un vrai cas pendant que la logique du produit vous est encore familière.',
    stats: [
      { value: '1 reprise', label: 'Suffit pour se remettre dedans' },
      { value: 'Un cas réel', label: 'Toujours le meilleur test' },
      { value: 'Rapide', label: 'Retour en main en quelques minutes' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Le bon réflexe',
      body: 'Ne cherchez pas à “retester le produit”. Reprenez simplement un deck ou un brief concret et voyez si le gain de temps revient immédiatement.',
    },
    body: [
      'Les outils qui finissent dans un workflow sont souvent ceux que l’on réessaie sur un cas réel au bon moment.',
      'Si vous avez un livrable en attente, c’est probablement le meilleur moment pour remettre SlideAI en jeu.',
    ],
    bullets: [
      'Reprendre un deck concret',
      'Retrouver rapidement vos repères',
      'Mesurer si l’outil mérite une place durable',
    ],
    ctaLabel: 'Reprendre avec SlideAI',
    ctaUrl: createUrl,
  };
}

function buildInactive14dEmail(createUrl: string): EmailContent {
  return {
    subject: 'Un deck que vous pourriez sortir plus vite cette semaine',
    preview: 'Pensez à votre prochain support client, pas au produit lui-même.',
    badge: 'Retour à l’usage',
    title: 'Réactivez SlideAI sur un livrable précis',
    intro: 'Si vous n’êtes pas revenu depuis quelque temps, le plus simple est de penser à un livrable bien défini que vous devez sortir cette semaine.',
    stats: [
      { value: '1 deck', label: 'Bien choisi vaut mieux que 10 tests' },
      { value: 'Moins de friction', label: 'Quand le sujet est concret' },
      { value: 'Plus clair', label: 'Pour juger la valeur réelle' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Exemples qui marchent bien',
      body: 'Reco client, support de rendez-vous, pitch, audit ou reporting. Les usages les plus concrets sont souvent ceux qui révèlent le plus vite la valeur.',
    },
    body: [
      'Quand un outil semble “en pause”, ce n’est pas toujours un problème produit. C’est souvent un problème de timing ou de cas d’usage.',
      'Revenez avec un sujet très précis, et jugez-le sur le résultat obtenu.',
    ],
    bullets: [
      'Choisir un besoin concret',
      'Relancer un test utile',
      'Voir vite si SlideAI mérite de rester dans votre stack',
    ],
    ctaLabel: 'Relancer un deck',
    ctaUrl: createUrl,
  };
}

function buildInactive21dOfferEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Dernière relance avant de laisser SlideAI de côté',
    preview: 'Si vous pensez encore que SlideAI peut vous faire gagner du temps, c’est le moment de revenir.',
    badge: 'Dernière relance',
    title: 'Soit vous le remettez dans votre workflow, soit vous passez à autre chose',
    intro: 'Après plusieurs semaines sans activité, il reste surtout une question utile: est-ce que SlideAI mérite encore une vraie place dans votre manière de produire ?',
    stats: [
      { value: '21 jours', label: 'Sans activité récente' },
      { value: 'Un seul test', label: 'Peut suffire pour décider' },
      { value: 'Décision claire', label: 'Reprendre ou laisser tomber' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'La bonne décision',
      body: 'Revenez sur un vrai besoin si vous pensez qu’il y a encore un gain de temps à capturer. Sinon, ignorez simplement cet email.',
    },
    body: [
      'Le but n’est pas de vous convaincre artificiellement. Le but est de vous aider à trancher proprement.',
      'Si vous voyez encore un usage concret pour SlideAI, revenez dessus maintenant. Sinon, inutile de garder le sujet ouvert dans un coin de votre tête.',
    ],
    bullets: [
      'Un dernier test sur un vrai cas',
      'Une décision nette ensuite',
      'Aucun bruit inutile après',
    ],
    ctaLabel: 'Revoir SlideAI',
    ctaUrl: pricingUrl,
  };
}

function buildCancelConfirmationEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Votre annulation est bien prise en compte',
    preview: 'Votre accès continue jusqu’à la fin de la période en cours.',
    badge: 'Annulation confirmée',
    title: 'Votre abonnement s’arrêtera à la fin de la période',
    intro: 'Votre demande est enregistrée. Votre accès actuel continue jusqu’à la fin de votre période en cours.',
    stats: [
      { value: 'Accès actif', label: 'Jusqu’à la fin de période' },
      { value: 'Aucune coupure', label: 'Immédiate aujourd’hui' },
      { value: 'Réversible', label: 'Tant que la période n’est pas terminée' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Ce que vous pouvez faire d’ici là',
      body: 'Continuer à utiliser SlideAI normalement, puis décider calmement si vous voulez réellement laisser l’outil sortir de votre workflow.',
    },
    body: [
      'Merci d’avoir utilisé SlideAI. Si votre besoin est simplement en pause, il n’y a aucune urgence à décider définitivement aujourd’hui.',
      'Le plus rationnel est de juger l’outil sur vos prochains decks, pas sur une impression générale.',
    ],
    bullets: [
      'Garder l’accès jusqu’à la fin de période',
      'Continuer à produire normalement d’ici là',
      'Réévaluer la décision sur vos vrais usages',
    ],
    ctaLabel: 'Revoir mon abonnement',
    ctaUrl: pricingUrl,
  };
}

function buildCancelDay3WinbackEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Avant de laisser SlideAI sortir de votre workflow',
    preview: 'Si le besoin n’a pas disparu, vous pouvez encore éviter la coupure.',
    badge: 'Save offer',
    title: 'La vraie question n’est pas “est-ce que j’annule ?”',
    intro: 'La vraie question est plutôt: est-ce que vos prochains decks seront plus simples avec SlideAI que sans SlideAI ?',
    stats: [
      { value: 'Workflow', label: 'C’est souvent là que la décision se joue' },
      { value: 'Sans rupture', label: 'Si vous revenez maintenant' },
      { value: 'Simple', label: 'Une action suffit' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'Le coût caché de l’annulation',
      body: 'Pas seulement le logiciel perdu. Surtout le retour à un rythme de production plus lent si l’outil vous aidait déjà réellement.',
    },
    body: [
      'Si votre usage était occasionnel, l’annulation est peut-être la bonne décision.',
      'Mais si SlideAI vous aidait déjà sur vos livrables, il vaut mieux éviter une coupure simplement parce que la décision a été prise trop vite.',
    ],
    bullets: [
      'Réévaluer la décision sur vos usages réels',
      'Éviter une coupure inutile',
      'Garder le rythme si l’outil vous aide déjà',
    ],
    ctaLabel: 'Garder mon accès',
    ctaUrl: pricingUrl,
  };
}

function buildFailedPaymentEmail(pricingUrl: string): EmailContent {
  return {
    subject: 'Votre paiement SlideAI n’a pas abouti',
    preview: 'Mettez à jour votre paiement pour éviter toute interruption.',
    badge: 'Paiement à mettre à jour',
    title: 'Votre accès peut être interrompu si rien ne change',
    intro: 'Nous n’avons pas pu finaliser votre paiement. Le plus simple est de mettre à jour votre moyen de paiement maintenant pour éviter toute interruption.',
    stats: [
      { value: 'Échec paiement', label: 'Action requise' },
      { value: 'Rapide', label: 'Quelques clics suffisent' },
      { value: 'Sans coupure', label: 'Si vous corrigez vite' },
    ],
    spotlight: {
      tone: 'warning',
      title: 'Le bon réflexe',
      body: 'Régler le moyen de paiement avant que cela ne devienne un problème d’accès ou de continuité de travail.',
    },
    body: [
      'Si SlideAI fait déjà partie de votre manière de produire, le plus rationnel est de corriger cela maintenant plutôt que d’attendre une interruption.',
      'Une mise à jour rapide suffit généralement à repartir normalement.',
    ],
    bullets: [
      'Mettre à jour votre paiement',
      'Conserver votre accès',
      'Éviter une coupure dans votre workflow',
    ],
    ctaLabel: 'Mettre à jour mon paiement',
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
      title: 'Ce qui change demain si vous ne faites rien',
      body: 'La g\u00e9n\u00e9ration de nouveaux decks sera limit\u00e9e. Vos pr\u00e9sentations existantes restent consultables et exportables en PDF avec filigrane.',
    },
    body: [
      'Si SlideAI vous a d\u00e9j\u00e0 aid\u00e9 \u00e0 produire plus vite, le plus logique est d\u2019\u00e9viter une coupure.',
      'Deux options selon votre rythme : Pro \u00e0 14\u20ac/mois pour une production r\u00e9guli\u00e8re, ou Pack Mission \u00e0 19\u20ac pour un usage plus ponctuel.',
    ],
    bullets: [
      'Pro (14\u20ac/mois) \u2014 acc\u00e8s illimit\u00e9, id\u00e9al si vous produisez r\u00e9guli\u00e8rement',
      'Pack Mission (19\u20ac, 5 g\u00e9n\u00e9rations, 3 mois) \u2014 si votre besoin est ponctuel',
      'Vos pr\u00e9sentations et exports restent accessibles apr\u00e8s l\u2019essai',
    ],
    ctaLabel: 'Choisir ma suite',
    ctaUrl: pricingUrl,
    note: 'Le but ici est simple: garder l\u2019\u00e9lan, pas repartir \u00e0 z\u00e9ro demain.',
  };
}

function buildExpiredEmail(pricingUrl: string, legacyFree: boolean, presentationCount: number): EmailContent {
  const usageLabel = formatPresentationCount(presentationCount || 1);

  if (legacyFree) {
    return {
      subject: 'Votre essai Pro est termin\u00e9 \u2014 votre compte reste actif',
      preview: 'Vos pr\u00e9sentations sont toujours l\u00e0. Reprenez quand vous avez un nouveau deck \u00e0 livrer.',
      badge: 'Essai termin\u00e9',
      title: 'Votre compte reste actif. Vos donn\u00e9es aussi.',
      intro: 'Votre essai Pro est termin\u00e9. Votre compte est toujours accessible : vous pouvez consulter et modifier vos pr\u00e9sentations existantes.',
      stats: [
        { value: 'Compte actif', label: 'Votre espace reste disponible' },
        { value: 'Vos decks', label: 'Toujours consultables et modifiables' },
        { value: '19\u20ac', label: 'Pack Mission \u2014 5 g\u00e9n\u00e9rations' },
      ],
      spotlight: {
        tone: 'info',
        title: 'Ce qui reste accessible sans paiement',
        body: 'Consultation de vos pr\u00e9sentations, \u00e9dition du texte, export PDF avec filigrane, partage par lien.',
      },
      body: [
        'Pour g\u00e9n\u00e9rer de nouveaux decks, choisissez un pack ponctuel ou un abonnement selon votre rythme de production.',
        'Le Pack Mission \u00e0 19\u20ac vous donne 5 g\u00e9n\u00e9rations valables 3 mois \u2014 sans aucun engagement.',
      ],
      bullets: [
        'Pack Mission (19\u20ac, 5 g\u00e9n\u00e9rations) pour un besoin ponctuel',
        'Pro (14\u20ac/mois) si vous produisez r\u00e9guli\u00e8rement',
        'Aucune carte enregistr\u00e9e sans votre accord',
      ],
      ctaLabel: 'Voir les packs et abonnements',
      ctaUrl: pricingUrl,
    };
  }

  if (presentationCount === 0) {
    return {
      subject: 'Votre essai SlideAI est termin\u00e9 \u2014 votre compte reste actif',
      preview: 'Vous n\u2019avez pas encore test\u00e9 SlideAI sur un vrai cas. Un pack \u00e0 19\u20ac peut y rem\u00e9dier.',
      badge: 'Essai termin\u00e9',
      title: 'Votre compte est toujours l\u00e0.',
      intro: 'Votre essai est termin\u00e9 sans que vous ayez eu le temps de tester SlideAI sur un vrai document. Votre compte reste accessible.',
      stats: [
        { value: 'Compte actif', label: 'Votre espace est pr\u00e9serv\u00e9' },
        { value: '19\u20ac', label: 'Pack Mission \u2014 5 g\u00e9n\u00e9rations' },
        { value: '3 mois', label: 'Pour les utiliser \u00e0 votre rythme' },
      ],
      spotlight: {
        tone: 'info',
        title: 'Le vrai test n\u2019a pas encore eu lieu',
        body: 'Pas de jugement possible sans une vraie pr\u00e9sentation. Le Pack Mission vous donne 5 g\u00e9n\u00e9rations pour tester sur un cas concret, sans abonnement.',
      },
      body: [
        'Le bon crit\u00e8re n\u2019est pas “est-ce que j\u2019ai tout visit\u00e9 ?”, mais “est-ce que l\u2019outil m\u2019aide \u00e0 livrer plus vite ?”',
        'Un pack ponctuel vous permet de le valider sans aucun engagement mensuel.',
      ],
      bullets: [
        'Testez sur un vrai brief client ou un document existant',
        'Voyez le gain de temps en une session',
        'D\u00e9cidez ensuite si l\u2019abonnement Pro vaut le coup',
      ],
      ctaLabel: 'Voir les options',
      ctaUrl: pricingUrl,
    };
  }

  return {
    subject: 'Votre essai est termin\u00e9 \u2014 votre compte reste actif',
    preview: 'Vos pr\u00e9sentations sont toujours l\u00e0. Pour g\u00e9n\u00e9rer \u00e0 nouveau, un pack suffit.',
    badge: 'Essai termin\u00e9',
    title: 'Votre compte reste actif. Vos pr\u00e9sentations aussi.',
    intro: `Votre essai Pro est termin\u00e9. Vous avez d\u00e9j\u00e0 cr\u00e9\u00e9 ${usageLabel}. Votre compte est toujours accessible : consultation, \u00e9dition, export PDF avec filigrane.`,
    stats: [
      { value: usageLabel, label: 'D\u00e9j\u00e0 cr\u00e9\u00e9es pendant l\u2019essai' },
      { value: 'Compte actif', label: 'Vos decks restent consultables' },
      { value: '19\u20ac', label: 'Pack Mission \u2014 5 g\u00e9n\u00e9rations' },
    ],
    spotlight: {
      tone: 'info',
      title: 'Ce qui reste accessible sans paiement',
      body: 'Consultation et \u00e9dition de vos pr\u00e9sentations, export PDF avec filigrane, partage par lien en lecture.',
    },
    body: [
      'Pour g\u00e9n\u00e9rer de nouveaux decks, choisissez un pack ponctuel ou un abonnement selon votre rythme.',
      'Le Pack Mission \u00e0 19\u20ac vous donne 5 g\u00e9n\u00e9rations valables 3 mois \u2014 sans aucun engagement mensuel.',
    ],
    bullets: [
      'Pack Mission (19\u20ac, 5 g\u00e9n\u00e9rations, 3 mois) pour un besoin ponctuel',
      'Pack Trimestre (39\u20ac, 15 g\u00e9n\u00e9rations, 6 mois) pour plusieurs missions',
      'Pro (14\u20ac/mois) si vous produisez chaque semaine',
    ],
    ctaLabel: 'Voir les packs et abonnements',
    ctaUrl: pricingUrl,
    note: 'Vos pr\u00e9sentations et votre historique restent disponibles. Seule la g\u00e9n\u00e9ration de nouveaux decks est limit\u00e9e.',
  };
}

function buildWinbackEmail(pricingUrl: string, presentationCount: number, offer?: WinbackOffer): EmailContent {
  const activated = presentationCount > 0;
  const promoCode = offer?.code || 'TRIAL20';
  const percentOff = offer?.percentOff ?? 20;
  const expiresInHours = offer?.expiresInHours ?? 72;
  const ctaUrl = `${pricingUrl}${pricingUrl.includes('?') ? '&' : '?'}promo=${encodeURIComponent(promoCode)}`;

  return {
    subject: activated
      ? `Reprenez SlideAI \u2014 Pack Mission 19\u20ac ou -${percentOff}% sur Pro`
      : `Testez vraiment SlideAI \u2014 Pack Mission 19\u20ac, sans abonnement`,
    preview: activated
      ? `Vous avez d\u00e9j\u00e0 vu la valeur. Voici deux fa\u00e7ons simples de reprendre.`
      : `Un pack ponctuel suffit pour faire le vrai test. Votre offre expire dans ${expiresInHours}\u00a0h.`,
    badge: 'Offre de relance',
    title: activated
      ? 'Vous avez d\u00e9j\u00e0 vu la valeur. Voici deux fa\u00e7ons de reprendre.'
      : 'Le vrai test n\u2019a pas encore eu lieu.',
    intro: activated
      ? `Vous avez d\u00e9j\u00e0 test\u00e9 SlideAI sur de vraies pr\u00e9sentations. Deux options pour reprendre : un Pack Mission ponctuel \u00e0 19\u20ac, ou Pro avec -${percentOff}% sur le premier mois.`
      : `Votre essai s\u2019est termin\u00e9 sans que vous ayez eu le temps de tester SlideAI sur un vrai document. Le Pack Mission \u00e0 19\u20ac vous donne 5 g\u00e9n\u00e9rations valables 3 mois \u2014 sans aucun abonnement.`,
    stats: [
      { value: '19\u20ac', label: 'Pack Mission \u2014 5 g\u00e9n\u00e9rations, 3 mois' },
      { value: `-${percentOff}%`, label: `Pro avec le code ${promoCode}` },
      { value: `${expiresInHours}h`, label: 'Fen\u00eatre limit\u00e9e' },
    ],
    spotlight: {
      tone: 'success',
      title: activated ? 'Deux options, selon votre rythme' : 'Commencez sans engagement',
      body: activated
        ? `Pack Mission (19\u20ac, 5 g\u00e9n\u00e9rations) si votre besoin est ponctuel. Pro avec le code <strong>${promoCode}</strong> (-${percentOff}% sur le premier mois) si vous produisez r\u00e9guli\u00e8rement.`
        : `Le Pack Mission \u00e0 19\u20ac vous donne 5 g\u00e9n\u00e9rations valables 3 mois pour faire un vrai test \u2014 sans abonnement, sans engagement. Si vous trouvez la valeur, vous pouvez passer \u00e0 Pro avec le code <strong>${promoCode}</strong> (-${percentOff}%).`,
    },
    body: [
      activated
        ? 'Vous savez d\u00e9j\u00e0 ce que SlideAI peut vous faire gagner. La bonne question est juste votre fr\u00e9quence d\u2019usage : ponctuel ou r\u00e9gulier.'
        : 'Il n\u2019y a pas de jugement possible sans une vraie pr\u00e9sentation. Un pack ponctuel est le moyen le plus simple de le valider sans pression.',
      `L\u2019offre promo sur Pro expire dans ${expiresInHours}\u00a0heures. Le Pack Mission, lui, est disponible en permanence.`,
    ],
    bullets: [
      'Pack Mission (19\u20ac, 5 g\u00e9n\u00e9rations, 3 mois) \u2014 sans abonnement',
      activated
        ? `Pro avec le code ${promoCode} \u2014 -${percentOff}% sur le premier mois`
        : `Pro avec le code ${promoCode} apr\u00e8s avoir valid\u00e9 la valeur`,
      'Votre compte et vos donn\u00e9es restent disponibles',
    ],
    ctaLabel: 'Voir les packs et abonnements',
    ctaUrl,
    note: `Code ${promoCode} valable sur Pro uniquement, pendant ${expiresInHours}\u00a0heures. Le Pack Mission est sans code.`,
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
}) {
  const appUrl = process.env.FRONTEND_URL || 'https://slideai.fr';
  const pricingUrl = `${appUrl.replace(/\/$/, '')}/pricing`;
  const createUrl = `${appUrl.replace(/\/$/, '')}/create`;
  const examplesUrl = `${appUrl.replace(/\/$/, '')}/examples`;
  const daysLeft = Math.max(0, Math.ceil((new Date(params.trialEndsAt).getTime() - Date.now()) / DAY_MS));

  let content: EmailContent | null = null;

  switch (params.emailType) {
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
}) {
  const content = buildLifecycleEmailModel(params);
  if (!content) {
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
