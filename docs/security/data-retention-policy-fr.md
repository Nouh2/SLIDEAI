# SlideAI - Politique de retention et suppression des donnees

Version: 1.0  
Date d'effet: 23 fevrier 2026  
Proprietaire: Security/Compliance

## 1) Objectif

Cette politique definit comment SlideAI conserve, archive et supprime les donnees clients traitees dans le cadre de la conversion de documents en presentations.

Objectifs:

- Limiter la conservation au strict necessaire
- Reduire le risque sur donnees sensibles
- Respecter les obligations contractuelles et reglementaires (dont RGPD)

## 2) Perimetre

Cette politique couvre:

- Fichiers sources importes (PDF, DOCX, XLSX, images)
- Donnees intermediaires de traitement
- Presentations generees
- Journaux techniques et d'audit
- Sauvegardes et replicas

## 3) Principes

- Minimisation: conservation minimale et justifiee
- Limitation de finalite: usage uniquement pour fournir le service
- Suppression automatisee: purge selon delais definis
- Traçabilite: preuves de suppression et logs d'operations

## 4) Matrice de retention (par defaut)

1. Fichiers sources clients  
Retention: `24 a 72 heures`  
Action de fin de cycle: `suppression automatique`

2. Artefacts intermediaires de traitement  
Retention: `<= 24 heures`  
Action de fin de cycle: `suppression automatique`

3. Presentations generees (livrables)  
Retention: `jusqu'a suppression par le client ou fin de contrat`  
Action de fin de cycle: `suppression logique immediate, purge physique selon cycle backup`

4. Logs applicatifs techniques  
Retention: `30 a 90 jours`  
Action de fin de cycle: `purge automatique`

5. Logs de securite/audit  
Retention: `90 a 365 jours` (selon obligations contractuelles)  
Action de fin de cycle: `purge automatique`

6. Sauvegardes chiffrees  
Retention: `30 jours` (par defaut)  
Action de fin de cycle: `ecrasement/expiration automatique`

Note: ces valeurs peuvent etre personnalisees par contrat Enterprise.

## 5) Option "Zero Retention" (Enterprise)

Pour les clients a haut niveau de sensibilite:

- Pas de conservation des fichiers sources apres traitement
- Suppression immediate des artefacts intermediaires
- Logs sans contenu metier (metadonnees techniques minimales uniquement)
- Parametres IA configures pour minimiser/eliminer la retention cote provider selon possibilites contractuelles

## 6) Demandes de suppression (client)

- Canal: support securite ou API admin
- Delai cible de traitement: `<= 7 jours`
- Delai maximum contractuel: `<= 30 jours`
- Preuve: confirmation de suppression fournie sur demande

## 7) Fin de contrat

En cas de resiliation:

- Blocage des nouveaux traitements a date d'effet
- Periode d'export client: `[A COMPLETER, ex: 30 jours]`
- Suppression des donnees actives apres periode d'export
- Purge des sauvegardes selon cycle de retention backup

## 8) Exceptions legales et litiges

Certaines donnees peuvent etre conservees plus longtemps si requis par:

- Obligation legale
- Requisition autorite competente
- Necessite de preuve en cas de litige

Ces exceptions sont documentees et limitees au strict necessaire.

## 9) Controles techniques de suppression

- Jobs automatises de purge
- Verification periodique des delais de retention
- Separation logique par tenant pour suppression ciblee
- Journalisation des operations de suppression

## 10) Gouvernance et revue

- Revue de la politique: au moins annuelle
- Revue ad hoc: lors de changement majeur de sous-traitant ou d'architecture
- Approbation: Security + Legal + Direction Technique

## 11) Parametres contractuels a completer

- Region(s) de traitement: `[A COMPLETER]`
- Delais exacts par categorie: `[A COMPLETER]`
- Sous-traitants et roles: `[A COMPLETER]`
- SLA de suppression: `[A COMPLETER]`
- Clauses de transfert international: `[A COMPLETER]`
