# Runbook Mise En Prod Free Trial

## Objectif

Basculer de l'ancien mod&egrave;le freemium vers:

- nouveaux comptes -> essai Pro 7 jours sans carte
- anciens comptes freemium -> `legacy_free`
- lifecycle emails -> actifs en prod
- fin d'essai -> paywall pour les nouveaux comptes

## Pr&eacute;requis

- code backend / worker / frontend d&eacute;j&agrave; d&eacute;ployable
- worker BullMQ actif en prod
- Redis prod actif
- Resend configur&eacute; avec un domaine v&eacute;rifi&eacute;
- `EMAIL_FROM=SlideAI <noreply@slideai.fr>`

## Variables d'environnement &agrave; avoir

### API

- `FREE_TRIAL_LAUNCH_AT`
- `DATABASE_URL`
- `DIRECT_URL`
- `REDIS_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FRONTEND_URL`
- `EMAIL_FROM`
- `RESEND_API_KEY`

### Worker

- `REDIS_URL`
- `FRONTEND_URL`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- variables Supabase d&eacute;j&agrave; utilis&eacute;es en prod

## Valeur recommand&eacute;e

- `FREE_TRIAL_LAUNCH_AT`

Utiliser la date de bascule r&eacute;elle de prod, en UTC.

Exemple:

- `FREE_TRIAL_LAUNCH_AT=2026-03-11T12:00:00.000Z`

Important:

- tout utilisateur cr&eacute;&eacute; avant cette date = `legacy_free`
- tout utilisateur cr&eacute;&eacute; apr&egrave;s cette date = `trialing`

## Ordre de d&eacute;ploiement

1. D&eacute;ployer le code API, worker et frontend.
2. Mettre &agrave; jour les variables d'environnement en prod.
3. Appliquer la migration Prisma:

```powershell
cd Backend/apps/api
npm.cmd run build
C:\Users\noete\Desktop\SLIDEAI\Backend\node_modules\.bin\prisma.cmd migrate deploy
```

4. Red&eacute;marrer l'API.
5. Red&eacute;marrer le worker.
6. Lancer le backfill legacy:

```powershell
cd Backend/apps/api
npm.cmd run backfill:legacy-trial
```

## R&eacute;sultat attendu du backfill

- les users freemium existants passent en `legacyFree=true`
- les users free sans ligne d'abonnement re&ccedil;oivent une ligne `Subscription`
- les users payants restent inchang&eacute;s

## Smoke tests prod imm&eacute;diats

### API

- `GET /healthz` -> `200`

### Billing / subscription

Sur un compte existant freemium:

- `GET /v1/subscription` doit retourner `legacy_free`

Sur un nouveau compte cr&eacute;&eacute; apr&egrave;s la date de bascule:

- `GET /v1/subscription` doit retourner `trialing`
- `trialEndsAt` doit &ecirc;tre &agrave; J+7

### Emails

Sur un compte test cr&eacute;&eacute; apr&egrave;s la bascule:

- l'email `trial_welcome` doit partir
- les jobs lifecycle doivent &ecirc;tre visibles dans Redis / BullMQ

### UI

- la page pricing doit montrer l'essai 7 jours
- un compte `legacy_free` doit voir le CTA d'activation d'essai
- un compte expir&eacute; doit voir le paywall

## Test manuel recommand&eacute; en prod

1. Cr&eacute;er un compte de test apr&egrave;s la bascule
2. V&eacute;rifier `trialing`
3. V&eacute;rifier l'email de bienvenue
4. Simuler ou attendre un email lifecycle
5. Acheter un pack avec un compte de test
6. V&eacute;rifier que le pack n'active pas un trial
7. V&eacute;rifier qu'un compte legacy peut activer son essai

## Rollback logique

Si souci apr&egrave;s d&eacute;ploiement:

1. d&eacute;sactiver les workers lifecycle email
2. remettre temporairement le frontend sur un message de maintenance billing si besoin
3. corriger les variables d'environnement
4. ne pas supprimer les lignes `Subscription` cr&eacute;&eacute;es par le backfill sans script correctif cibl&eacute;

## Point d'attention

- le script de preview ajoute `[Preview]` uniquement via `EMAIL_SUBJECT_PREFIX` ou sa valeur par d&eacute;faut du script de test
- les vrais emails prod envoy&eacute;s par le worker n'ajoutent pas `[Preview]`
