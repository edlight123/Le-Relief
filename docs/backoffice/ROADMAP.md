Roadmap — Le Relief Editorial OS

Espace de rédaction premium, workflow de validation et admin newsroom avancé

⸻

## ✅ COMPLETION STATUS

**All 5 phases fully implemented and shipped.**

- **Phase 1** ✅ Editorial workflow foundation — commit 3d68a66 (roles, statuses, review flow, audit trail)
- **Phase 2** ✅ Premium writing workspace — commit 3d68a66 (article editor, metadata, previews, quality checks)
- **Phase 3** ✅ Publishing operations — commit 3d68a66 (scheduling, publication, homepage curation)
- **Phase 4** ✅ Governance & quality — commit 3d68a66 (comments, history, permissions)
- **Phase 5** ✅ Editorial analytics — commit e8a4e7b (KPIs, publication timing, blocked articles, author/category performance)

**Latest spec gaps filled** — commit dcffaf4 (full queue pages rebuilt from stubs, authors page, in-app notifications)

Implementation reference: see `/workspaces/Le-Relief/docs/backoffice/PAGE_BY_PAGE_SPEC.md` for page-by-page implementation details.

⸻

1. Roadmap exécutive

Phase 1 — Editorial workflow foundation

Objectif : poser les fondations du fonctionnement rédactionnel interne.

Priorités

* définir les statuts éditoriaux
* définir les rôles et permissions
* structurer la file de production éditoriale
* mettre en place le cycle soumission → review → révision → approbation
* créer les premières vues admin dédiées à la rédaction
* rendre les actions de validation explicites et traçables

Résultat attendu
Une chaîne éditoriale claire, avec responsabilités, statuts et étapes bien définis.

⸻

Phase 2 — Premium writing workspace

Objectif : transformer l’admin en véritable espace de rédaction premium.

Priorités

* améliorer l’éditeur de contenu
* structurer les champs éditoriaux et métadonnées
* ajouter autosave et indicateurs de complétude
* créer les previews article / mobile / social
* intégrer les contrôles qualité
* améliorer fortement l’UX/UI du back-office

Résultat attendu
Un espace de rédaction élégant, crédible, fluide, agréable pour produire du contenu long-form.

⸻

Phase 3 — Publishing operations layer

Objectif : professionnaliser la publication et le pilotage éditorial.

Priorités

* créer la queue “prêt à publier”
* ajouter scheduling et calendrier éditorial
* permettre la curation manuelle de la homepage
* ajouter les notions de priorité, breaking, mise en avant
* renforcer les vues “programmé”, “publié”, “urgent”

Résultat attendu
Une newsroom capable de piloter son rythme de publication et sa hiérarchie éditoriale.

⸻

Phase 4 — Governance, audit trail and quality control

Objectif : renforcer la gouvernance et la traçabilité.

Priorités

* historique des versions
* journal des actions par utilisateur
* commentaires éditoriaux internes
* règles de validation par rôle
* visibilité sur les contenus bloqués ou incomplets
* contrôle qualité renforcé avant publication

Résultat attendu
Un système éditorial plus fiable, plus rigoureux, plus gouverné.

⸻

Phase 5 — Editorial analytics and optimization

Objectif : connecter la rédaction à la performance produit et à l’amélioration continue.

Priorités

* dashboard KPIs rédaction
* suivi brouillon → publication
* suivi performance par auteur, rubrique, type
* suivi qualité et délais de review
* suivi des contenus mis en avant
* préparation aux workflows IA plus avancés

Résultat attendu
Une rédaction pilotée avec plus de visibilité, de mesure et de recul opérationnel.

⸻

2. Roadmap détaillée par phase

⸻

Phase 1 — Editorial workflow foundation

Durée indicative

2 à 4 semaines

Chantier produit

* définir les statuts :
    * brouillon
    * en cours de rédaction
    * soumis à relecture
    * révisions demandées
    * approuvé
    * programmé
    * publié
    * rejeté
    * archivé
* définir les transitions possibles entre statuts
* définir les rôles :
    * rédacteur
    * éditeur
    * publisher
    * admin
* créer les permissions associées
* créer la logique de soumission à review
* créer la logique de demande de révision
* créer la logique d’approbation
* créer la logique de rejet
* créer la logique de publication

Chantier admin / UX

* créer une navigation plus claire côté admin
* créer les premières vues :
    * Dashboard
    * Articles
    * Mes brouillons
    * Review Queue
    * Approved
    * Scheduled
    * Published
* rendre les statuts visibles dans toutes les listes
* créer des badges cohérents par statut

Chantier gouvernance

* formaliser les responsabilités par rôle
* définir qui peut publier
* définir qui peut approuver
* définir les règles de validation minimum

Livrables

* statuts éditoriaux opérationnels
* rôles et permissions documentés
* workflow soumission / review / approbation fonctionnel
* navigation admin clarifiée
* premières vues newsroom disponibles

⸻

Phase 2 — Premium writing workspace

Durée indicative

3 à 5 semaines

Chantier produit

* améliorer l’éditeur de contenu
* structurer les champs :
    * titre
    * surtitre
    * chapô
    * corps
    * auteur
    * rubrique
    * type de contenu
    * tags
    * langue
    * image principale
    * légende
    * slug
    * SEO title
    * meta description
* ajouter autosave
* ajouter l’état “saved / saving”
* ajouter indicateur de complétude éditoriale
* ajouter système d’alertes sur champs manquants

Chantier design

* créer une interface rédactionnelle plus haut de gamme
* améliorer hiérarchie, spacing, lisibilité
* distinguer clairement :
    * contenu principal
    * métadonnées
    * actions de workflow
* créer une esthétique newsroom premium
* renforcer la perception institutionnelle du back-office

Chantier expérience

* créer preview article
* créer preview mobile
* créer preview partage social
* améliorer la lisibilité pour les articles longs
* rendre le parcours de rédaction plus fluide

Livrables

* espace de rédaction premium
* éditeur enrichi
* previews intégrés
* contrôles de complétude
* expérience d’écriture plus crédible et plus propre

⸻

Phase 3 — Publishing operations layer

Durée indicative

2 à 4 semaines

Chantier produit

* créer la file “prêt à publier”
* ajouter publication immédiate
* ajouter programmation date/heure
* ajouter vue “programmé”
* ajouter vue “publié récemment”
* ajouter logique de dépublication
* ajouter logique d’archivage

Chantier homepage / curation

* créer un module de curation homepage
* permettre de définir :
    * À la une
    * article principal
    * contenus secondaires
    * modules spécifiques
* permettre le réordonnancement manuel
* ajouter preview homepage avant validation

Chantier newsroom ops

* créer notion de priorité
* créer notion de breaking
* créer contenu “à surveiller”
* créer une vue calendrier éditorial
* mieux visualiser la charge éditoriale à venir

Livrables

* queue de publication claire
* scheduling opérationnel
* calendrier éditorial
* module de curation homepage
* logique de priorisation newsroom

⸻

Phase 4 — Governance, comments, history and quality

Durée indicative

3 à 5 semaines

Chantier produit

* ajouter commentaires éditoriaux internes
* permettre les notes de révision
* distinguer commentaires simples et commentaires bloquants
* historiser toutes les transitions importantes
* ajouter version history
* enregistrer :
    * qui a modifié
    * quand
    * quel statut a changé
    * qui a approuvé
    * qui a publié

Chantier qualité

* ajouter contrôles avant publication :
    * image principale absente
    * auteur absent
    * rubrique absente
    * type de contenu absent
    * SEO incomplet
    * slug invalide
    * traduction non liée si applicable
* ajouter alertes de contenu incomplet
* rendre impossible certaines publications si les champs critiques manquent

Chantier gouvernance

* renforcer les permissions
* consolider les règles de validation finale
* définir les journaux d’audit
* préparer les bases pour workflows EN / IA / QA plus avancés

Livrables

* commentaires internes
* historique des versions
* audit trail
* garde-fous qualité
* gouvernance renforcée

⸻

Phase 5 — Editorial analytics and optimization

Durée indicative

en continu

Chantier analytics

* créer dashboard éditorial
* suivre :
    * nombre de contenus par statut
    * temps moyen brouillon → review
    * temps moyen review → publication
    * taux de révision
    * volume publié par rubrique
    * volume publié par auteur
    * contenus bloqués
    * contenus publiés avec mise en avant
* ajouter lecture de performance interne

Chantier optimisation

* identifier les goulots d’étranglement
* améliorer vitesse de validation
* améliorer qualité moyenne des contenus
* améliorer usage du back-office
* préparer couche d’automatisation future

Chantier futur

* préparer analytics EN
* préparer qualité de traduction
* préparer suggestions IA
* préparer scoring qualité contenu

Livrables

* dashboard KPIs
* visibilité sur la performance rédactionnelle
* boucle d’amélioration continue
* base solide pour futures automatisations

⸻

3. Roadmap par workstream

⸻

A. Workstream Produit

P1

* statuts éditoriaux
* rôles et permissions
* workflow de review
* navigation admin de base

P2

* éditeur premium
* métadonnées structurées
* autosave
* previews

P3

* scheduling
* publication
* dépublication
* curation homepage
* calendrier éditorial

P4

* commentaires
* historique
* contrôles qualité
* audit trail

P5

* analytics
* optimisation
* préparation workflows avancés

⸻

B. Workstream Design

P1

* structuration navigation admin
* badges statuts
* vues de listes plus propres

P2

* writing workspace premium
* hiérarchie visuelle
* layout contenu / métadonnées
* previews

P3

* dashboard publication
* vue calendrier
* curation homepage premium

P4

* timeline activité
* design des commentaires
* visualisation historique
* signaux qualité

P5

* dashboard analytics
* raffinements UI
* amélioration continue de la lisibilité

⸻

C. Workstream Éditorial

P1

* définition des rôles
* règles de validation
* règles de publication
* gouvernance rédactionnelle

P2

* standards de saisie des contenus
* standards métadonnées
* critères de complétude

P3

* règles de mise en avant homepage
* règles de priorisation
* logique de programmation éditoriale

P4

* règles de commentaires internes
* règles de traçabilité
* protocole de correction / republication

P5

* lecture performance
* amélioration des flux
* qualité opérationnelle continue

⸻

D. Workstream Data / Operations

P1

* structuration des statuts
* permissions
* logique des transitions

P2

* indicateurs de complétude
* validations métier
* preview generation

P3

* planification
* gestion files et priorités
* gestion des opérations publication

P4

* journalisation
* versioning
* audit trail

P5

* KPIs rédaction
* dashboards
* instrumentation produit

⸻

4. Priorisation now / next / later

Now

* définir statuts
* définir rôles
* mettre en place workflow review
* créer review queue
* améliorer structure admin
* rendre l’admin plus premium

Next

* enrichir writing workspace
* ajouter preview article / mobile / social
* ajouter scheduling
* créer curation homepage
* ajouter commentaires internes
* ajouter quality checks

Later

* historique avancé
* analytics détaillés
* dashboards auteur / rubrique
* scoring qualité
* automatisations IA internes
* workflows plus riches EN / QA / fact-checking

⸻

5. Version roadmap en tableau simple

Phase	Focus	Principaux livrables
Phase 1	Workflow éditorial	Statuts, rôles, review flow, admin structuré
Phase 2	Espace rédaction premium	Éditeur amélioré, previews, métadonnées, UX premium
Phase 3	Publishing operations	Scheduling, publication, curation homepage, calendrier
Phase 4	Gouvernance & qualité	Commentaires, historique, audit trail, quality checks
Phase 5	Analytics & optimisation	KPIs, dashboard rédaction, amélioration continue

⸻

6. Recommandation d’ordre d’exécution

Je recommande cet ordre exact :

1. formaliser d’abord le workflow éditorial
2. poser les rôles et permissions
3. améliorer ensuite l’espace de rédaction
4. brancher la couche publication / scheduling / homepage curation
5. ajouter la gouvernance, les commentaires et l’historique
6. enfin instrumenter la performance et les analytics

C’est l’ordre le plus propre, parce qu’il évite de polir visuellement un admin avant d’avoir verrouillé la logique opérationnelle.

7. Recommandation produit

Comme le site principal est déjà fait, la priorité n’est plus la vitrine, mais la machine interne.
Le Relief doit maintenant se comporter comme :

* un média structuré
* une rédaction gouvernée
* une opération éditoriale pilotable
* un produit premium aussi côté interne