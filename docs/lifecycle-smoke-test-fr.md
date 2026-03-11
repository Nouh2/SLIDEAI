# Smoke Tests Lifecycle Emails

Ce runbook sert a tester les nouveaux emails lifecycle en prod sans attendre les delais reels.

## Principe

- Le script pousse un job `lifecycle-email` directement dans Redis.
- Il cree aussi la ligne `LifecycleEmailLog` correspondante.
- Par defaut, il envoie avec `forceSend=true` pour bypass les conditions worker.
- Tu peux donc verifier le rendu et l'envoi reel sur une inbox de test sans attendre J+1, J+7, J+21.

## Commande de base

Depuis le service API Railway:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --type signup_day1_no_presentation
```

## Envoyer vers une autre inbox

Tu peux te baser sur un vrai user, mais envoyer le mail vers une inbox de test:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email user@slideai.fr --send-to noe.tehraoui1@gmail.com --type inactive_7d
```

## Plans disponibles

- `onboarding`
- `trial`
- `pack`
- `inactivity`
- `cancel`
- `billing`

Exemple:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --plan onboarding
```

## Email types disponibles

- `signup_day1_no_presentation`
- `signup_day3_no_presentation`
- `signup_day5_activated`
- `trial_welcome`
- `trial_inactive_day1`
- `trial_value_day4`
- `trial_ending_day6`
- `trial_expired`
- `trial_winback_day2`
- `pack_purchase_confirmation`
- `pack_low_balance`
- `pack_exhausted`
- `inactive_7d`
- `inactive_14d`
- `inactive_21d_offer`
- `cancel_confirmation`
- `cancel_day3_winback`
- `failed_payment_day0`

## Recommandation de test prod rapide

1. Onboarding:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --plan onboarding
```

2. Pack:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --plan pack
```

3. Reactivation:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --plan inactivity
```

4. Churn:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --plan cancel
```

5. Billing:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --plan billing
```

## Notes

- `trial_winback_day2` cree un vrai code promo Stripe unique. Ne le spamme pas inutilement.
- `failed_payment_day0` via le script est un smoke test email, pas une vraie simulation Stripe.
- Pour tester les conditions reelles, tu peux desactiver le bypass:

```bash
npm --prefix apps/api run lifecycle:smoke -- --email noe.tehraoui1@gmail.com --type inactive_7d --force false
```
