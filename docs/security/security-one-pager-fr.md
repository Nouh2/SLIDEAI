# SlideAI - Security & Privacy One-Pager (B2B)

Version: 1.0  
Date: 23 fevrier 2026  
Contact securite: security@slideai.app

## 1) Resume executif

SlideAI permet de transformer des documents (PDF, Word, Excel) en presentations PowerPoint.  
Nous avons ete concus pour des usages B2B avec donnees potentiellement sensibles (conseil, audit, sante), avec les principes suivants:

- Chiffrement en transit et au repos
- Isolation des donnees par client (tenant)
- Retention courte et suppression automatique configurable
- Controle d'acces strict et journalisation d'audit
- Transparence sur les sous-traitants IA et cloud

## 2) Donnees traitees

Categories de donnees:

- Documents importes (PDF, DOCX, XLSX, texte, images)
- Metadonnees techniques (horodatage, taille fichier, statut de traitement)
- Sorties generees (structure de slides, PPTX final)
- Logs applicatifs et d'audit (sans contenu sensible complet, sauf debug active explicitement)

Finalite:

- Generation et edition de presentations
- Support et exploitation technique
- Securite, prevention de fraude et conformite

## 3) IA et sous-traitants

SlideAI utilise Gemini Flash via l'infrastructure Google (AI platform/Vertex selon configuration client).  
Nos engagements par defaut:

- Usage des donnees strictement limite a la generation demandee
- Minimisation des donnees envoyees au modele
- Pas d'usage des donnees client pour entrainer les modeles de SlideAI
- Pas d'usage humain des contenus sans autorisation explicite du client

Notes importantes:

- Les conditions exactes "no training/no retention" dependent du mode d'integration choisi (API directe vs Vertex) et du contrat signe.
- Pour les comptes Enterprise, ces points sont formalises dans le DPA/annexes de traitement.

## 4) Chiffrement et securite technique

- Transit: TLS 1.2+ (HTTPS)
- Repos: chiffrement AES-256 (stockage et sauvegardes)
- Secrets: gestion via coffre de secrets, rotation periodique
- Acces admin: MFA obligatoire et principe du moindre privilege
- Journalisation: traces d'acces et d'actions d'administration
- Segmentation: separation logique par organisation cliente

## 5) Retention et suppression

Politique par defaut (a adapter):

- Fichiers source importes: suppression automatique apres 24-72h
- Artefacts intermediaires: suppression apres [X] heures
- Presentations finales: conservees tant que le client les maintient
- Logs techniques: [30/90] jours
- Sauvegardes: retention [30] jours, puis purge

Options Enterprise:

- Zero retention pour certains traitements
- Regles de retention personnalisees par tenant
- Suppression immediate sur demande (API ou support)

## 6) Gouvernance et conformite

- DPA (Data Processing Agreement) disponible
- Liste des sous-traitants maintenue et partagee sur demande
- Clauses de transfert international (SCC) si necessaire
- Process de gestion des incidents documente
- Notification d'incident selon obligations legales et contractuelles

## 7) Cas donnees de sante / hautement sensibles

Pour les donnees de sante:

- Ne pas revendiquer "HIPAA compliant" sans BAA signe avec tous les acteurs concernes
- Activer environnement dedie + retention minimale + acces restreint
- Redaction/masquage des identifiants directs recommande avant import

## 8) SLA de securite (proposition commerciale)

- Delai de notification incident: < 72h (ou selon contrat)
- Delai de suppression sur demande: < 30 jours (souvent < 7 jours)
- Revue des acces privilegies: trimestrielle
- Rotation des cles/secrets: periodique et tracable

## 9) Reponses courtes pretes a l'emploi

Q: "Ou sont stockees nos donnees ?"  
R: "Dans des environnements cloud securises, avec chiffrement au repos et en transit, et une isolation par tenant."

Q: "Vos fournisseurs IA reutilisent-ils nos donnees ?"  
R: "Nos flux sont configures pour un usage strictement necessaire au service. Les clauses exactes sont formalisees contractuellement (DPA/sous-traitants)."

Q: "Combien de temps gardez-vous les fichiers ?"  
R: "Par defaut sur une retention courte, configurable, avec option zero retention pour les clients sensibles."

Q: "Pouvez-vous traiter des donnees sensibles (audit/sante) ?"  
R: "Oui, avec controles renforces (acces, retention, journalisation, contractualisation). Pour la sante, un cadre contractuel adapte est requis."

## 10) Champs a completer avant envoi client

- Region(s) de traitement: [UE / US / multi-region]
- Delais exacts de retention: [X]
- Liste des sous-traitants: [nom + role + region]
- Contact DPO/securite: [email]
- Certifs/attestations: [SOC 2, ISO 27001, etc. si disponibles]
