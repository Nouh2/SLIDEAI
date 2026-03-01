# SlideAI - Checklist d'audit "Gemini n'entraine pas sur nos prompts" (10 points)

Version: 1.0  
Date: 23 fevrier 2026  
Perimetre: Gemini API via Google AI Studio (API key)

## Objectif

Constituer un dossier de preuve pour repondre aux clients B2B sur la question:
"Est-ce que vos prompts/reponses sont utilises pour entrainer les modeles Google ?"

## Regle de base (a communiquer)

Pour les **Paid Services** Gemini API, Google indique ne pas utiliser prompts/reponses pour ameliorer ses produits.  
Attention: des donnees peuvent etre conservees temporairement pour l'abuse monitoring, sans entrainement.

## Checklist (10 points)

1. Verifier la version des termes applicable  
Preuve a collecter:
- Capture de `https://ai.google.dev/gemini-api/terms` montrant "Effective December 18, 2025".
- Capture du passage "Paid Services" / "How Google Uses Your Data".
Resultat attendu:
- Le texte indique explicitement que Google n'utilise pas prompts/reponses des Paid Services pour ameliorer ses produits.

2. Confirmer que votre trafic API est bien en Paid Service  
Preuve a collecter:
- Capture AI Studio > API keys > colonne Quota tier sur le projet lie a la cle (`Tier 1/2/3`).
- Capture du projet Google Cloud associe a la cle.
Resultat attendu:
- La cle de production est rattachee a un projet avec billing actif.

3. Confirmer l'activation du Cloud Billing sur le bon projet  
Preuve a collecter:
- Capture Cloud Console > Billing > compte actif.
- Capture AI Studio indiquant statut billable reussi.
Resultat attendu:
- Projet de prod effectivement facture (pas uniquement free tier).

4. Verifier que les cles de production ne pointent pas vers un projet free  
Preuve a collecter:
- Inventaire de toutes les cles (prod/staging/dev) + projet associe + tier.
- Rotation/invalidations des anciennes cles non conformes.
Resultat attendu:
- Aucune cle utilisee en prod n'est en free tier.

5. Verifier la politique "Data Logging and Sharing"  
Preuve a collecter:
- Capture `https://ai.google.dev/gemini-api/docs/logs-policy` montrant:
  - "By default ... prompts and responses ... are not used for product improvement" (billing-enabled).
  - Le mecanisme de partage de dataset vers Google.
Resultat attendu:
- Equipe consciente que le partage explicite de datasets peut basculer vers un usage type Unpaid Services.

6. Desactiver/encadrer le partage de datasets de logs avec Google  
Preuve a collecter:
- Capture du parametre de partage (opt-out) dans AI Studio Logs/Datasets.
- Procedure interne interdisant le partage de donnees sensibles.
Resultat attendu:
- Pas de contribution volontaire de logs clients a l'amelioration des modeles Google.

7. Documenter la retention d'abuse monitoring  
Preuve a collecter:
- Capture `https://ai.google.dev/gemini-api/docs/usage-policies` indiquant:
  - retention de 55 jours pour prompts/context/output
  - usage uniquement policy enforcement, pas d'entrainement
Resultat attendu:
- Message client clair: "pas d'entrainement" != "zero retention".

8. Verifier les options/features annexes qui ont leurs propres regles  
Preuve a collecter:
- Si Grounding Search/Maps est active, capture des sections termes correspondantes (retention specifique).
- Inventaire des features Gemini activees par environnement.
Resultat attendu:
- Aucune surprise contractuelle liee a une feature annexe activee par defaut.

9. Aligner les documents contractuels/commerciaux  
Preuve a collecter:
- DPA + annexe sous-traitants + politique de retention + wording commercial.
- Validation legal des formulations "no training" et retention.
Resultat attendu:
- Le discours commercial est strictement aligne avec les termes Google et votre architecture.

10. Mettre un controle trimestriel de derive  
Preuve a collecter:
- Tache trimestrielle: relecture Terms/Billing/Logs policy/Abuse monitoring.
- Changelog interne avec date de verification et decision.
Resultat attendu:
- Preuve de gouvernance continue, utile pour audit client.

## Pack de preuves minimum a envoyer a un client enterprise

- Extrait termes Paid Services (no product improvement)
- Extrait Abuse monitoring (55 jours, pas d'entrainement)
- Extrait Logs policy (risque si dataset sharing)
- Capture quota tier de la cle/projet de production
- Politique interne retention/suppression SlideAI

## Wording recommande (copier-coller)

"Nos appels Gemini en production passent via des projets Google Cloud en Paid Tier.  
Conformement aux Gemini API Additional Terms (effective 18 decembre 2025), Google n'utilise pas nos prompts ni les reponses pour ameliorer ses produits sur Paid Services.  
Nous n'activons pas le partage de datasets de logs avec Google.  
Nous informons egalement nos clients de la retention technique limitee liee a l'abuse monitoring (55 jours), qui n'est pas utilisee pour l'entrainement des modeles."

## Sources officielles a joindre

- Gemini API Additional Terms: https://ai.google.dev/gemini-api/terms
- Billing (tiers et billable status): https://ai.google.dev/gemini-api/docs/billing/
- Data Logging and Sharing: https://ai.google.dev/gemini-api/docs/logs-policy
- Abuse monitoring: https://ai.google.dev/gemini-api/docs/usage-policies
- Pricing (resume Free vs Paid data use): https://ai.google.dev/gemini-api/docs/pricing
