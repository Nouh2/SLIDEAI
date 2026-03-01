# SlideAI - Template Reponses Questionnaire Securite (B2B)

Version: 1.0  
Date: 23 fevrier 2026  
Usage: reponse rapide aux questionnaires client (RSSI, Achats, Legal)

## Instructions internes

- Remplacer tous les champs `[A COMPLETER]` avant envoi.
- Ne jamais promettre une certification non obtenue.
- En cas d'exigence sante/reglementee, faire valider par legal/compliance.

## 1) Organisation & gouvernance

1. Nom legal de l'entite prestataire  
Reponse: `[A COMPLETER]`

2. Contact securite (email)  
Reponse: `[A COMPLETER]`

3. Avez-vous une politique de securite documentee ?  
Reponse: `Oui`

4. Revue periodique des politiques ?  
Reponse: `Oui, au minimum annuelle`

5. Programme de sensibilisation securite pour les employes ?  
Reponse: `Oui, onboarding + rappels periodiques`

## 2) Architecture & hebergement

6. Ou sont hebergees les donnees client ?  
Reponse: `[UE/US/Multi-region - A COMPLETER]`

7. Type d'architecture multi-tenant ?  
Reponse: `Multi-tenant avec isolation logique des donnees par organisation`

8. Chiffrement en transit ?  
Reponse: `Oui, TLS 1.2+`

9. Chiffrement au repos ?  
Reponse: `Oui, AES-256 (ou equivalent cloud provider)`

10. Gestion des secrets  
Reponse: `Coffre de secrets, acces restreint, rotation periodique`

## 3) Acces & identite

11. MFA pour les comptes administrateurs ?  
Reponse: `Oui, obligatoire`

12. Principe du moindre privilege applique ?  
Reponse: `Oui`

13. Processus d'onboarding/offboarding des acces ?  
Reponse: `Oui, documente avec retrait immediat des acces en sortie`

14. Journalisation des acces et actions admin ?  
Reponse: `Oui, logs d'audit horodates`

## 4) Donnees & confidentialite

15. Quelles donnees sont traitees ?  
Reponse: `Documents importes (PDF/DOCX/XLSX), metadonnees techniques, presentations generees`

16. Utilisez-vous les donnees client pour entrainer vos modeles ?  
Reponse: `Non pour nos modeles internes. Les garanties provider sont encadrees contractuellement selon le mode d'integration.`

17. Sous-traitants principaux  
Reponse: `Google (IA), [Cloud provider], [Auth/DB] - liste detaillee disponible sur demande`

18. DPA disponible ?  
Reponse: `Oui`

19. Mecanisme de transfert hors UE (si applicable) ?  
Reponse: `SCC/clauses contractuelles appropriees`

## 5) IA / LLM (Gemini Flash)

20. Quelle IA utilisez-vous ?  
Reponse: `Gemini Flash via API entreprise (configuration selon tenant)`

21. Minimisation des donnees envoyees au modele ?  
Reponse: `Oui, envoi du strict necessaire au traitement`

22. Retention des prompts/reponses cote provider ?  
Reponse: `[A COMPLETER selon contrat/provider settings]`

23. Option zero retention ?  
Reponse: `Disponible pour offres Enterprise (selon perimetre technique)`

24. Acces humain au contenu client par defaut ?  
Reponse: `Non, sauf demande explicite de support autorisee par le client`

## 6) Retention & suppression

25. Retention des fichiers source  
Reponse: `[A COMPLETER, ex: 24-72h]`

26. Retention des logs techniques  
Reponse: `[A COMPLETER, ex: 30/90 jours]`

27. Delai de suppression sur demande client  
Reponse: `[A COMPLETER, ex: <= 30 jours]`

28. Gestion de la suppression dans les sauvegardes  
Reponse: `Suppression appliquee selon cycle de retention backup [A COMPLETER]`

## 7) Detection & reponse incident

29. Disposez-vous d'un plan de reponse incident ?  
Reponse: `Oui`

30. Delai de notification d'incident  
Reponse: `[A COMPLETER, ex: <72h]`

31. Realisez-vous des analyses post-incident (RCA) ?  
Reponse: `Oui`

## 8) Vulnerabilites & tests

32. Analyse de vulnerabilites periodique ?  
Reponse: `Oui (SAST/dependances et revues periodiques)`

33. Correctifs de securite appliques sous delai ?  
Reponse: `Oui, selon criticite (SLA interne)`

34. Pen tests externes ?  
Reponse: `[A COMPLETER: Oui/Planifie/Non]`

## 9) Continuite d'activite

35. Sauvegardes realisees ?  
Reponse: `Oui`

36. Tests de restauration ?  
Reponse: `Oui, periodiques`

37. RPO/RTO  
Reponse: `[A COMPLETER]`

## 10) Conformites et certifications

38. RGPD  
Reponse: `Oui, DPA + gestion des droits personnes + minimisation des donnees`

39. SOC 2 / ISO 27001  
Reponse: `[A COMPLETER]`

40. HIPAA / donnees de sante  
Reponse: `Uniquement dans un cadre contractuel adapte (BAA requis avec tous sous-traitants concernes)`

## Annexes a joindre si disponible

- DPA
- Liste des sous-traitants
- Politique de retention
- Politique de reponse incident
- Certificats/attestations (si applicables)
